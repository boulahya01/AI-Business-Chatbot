import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, chatLimiter } from '@/lib/rate-limiter'
import { OpenAI } from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user (optional for backward compatibility)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const userId = user?.id

    // Check rate limit if user authenticated
    if (userId) {
      const rateCheck = await checkRateLimit(userId, chatLimiter, 'chat')
      if (!rateCheck.allowed) {
        return NextResponse.json(
          { error: rateCheck.error },
          { status: 429, headers: { 'X-RateLimit-Remaining': '0' } }
        )
      }
    }

    const { message, sessionId } = await request.json()
    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    // Embed query
    const queryEmbedding = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: message,
    })

    // Search documents
    // If user authenticated, try to filter by user_id (requires updated RPC)
    // Otherwise, search all documents
    let docs: any[] = []

    if (userId) {
      try {
        // Try new RPC with user_id parameter
        const { data, error: searchError } = await supabase.rpc('match_documents', {
          query_embedding: queryEmbedding.data[0].embedding,
          user_id_param: userId,
          match_count: 5,
        })

        if (!searchError && data) {
          docs = data
        }
      } catch (err) {
        // Fall back to old RPC if new one doesn't exist
        console.warn('New RPC with user_id not available, using fallback')
        const { data, error: searchError } = await supabase.rpc('match_documents', {
          query_embedding: queryEmbedding.data[0].embedding,
          match_count: 5,
        })

        if (!searchError && data) {
          docs = data
        }
      }
    } else {
      // Unauthenticated - search all public documents
      const { data, error: searchError } = await supabase.rpc('match_documents', {
        query_embedding: queryEmbedding.data[0].embedding,
        match_count: 5,
      })

      if (!searchError && data) {
        docs = data
      }
    }

    // Handle no documents
    if (!docs?.length) {
      return NextResponse.json({
        error: 'No documents found. Upload content in Admin Panel first.',
      })
    }

    // Save user message to history
    if (userId && sessionId) {
      await supabase.from('chat_messages').insert({
        user_id: userId,
        session_id: sessionId,
        role: 'user',
        content: message,
      })
    }

    // Build context from documents
    const context = docs.map((doc: any) => doc.content).join('\n\n')

    // Stream response from OpenAI
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      stream: true,
      messages: [
        {
          role: 'system',
          content: `You are a helpful AI assistant. Use the provided documents to answer questions accurately. 
          
Context from documents:
${context}`,
        },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    // Create streaming response
    const encoder = new TextEncoder()
    const customReadable = new ReadableStream({
      async start(controller) {
        let fullResponse = ''

        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              fullResponse += content
              controller.enqueue(encoder.encode(content))
            }
          }

          // Save assistant message to history
          if (userId && sessionId) {
            await supabase.from('chat_messages').insert({
              user_id: userId,
              session_id: sessionId,
              role: 'assistant',
              content: fullResponse,
            })
          }

          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          controller.error(error)
        }
      },
    })

    return new Response(customReadable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 })
  }
}

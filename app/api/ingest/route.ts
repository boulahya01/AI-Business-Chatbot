import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, ingestLimiter } from '@/lib/rate-limiter'
import { chunkText } from '@/lib/chunker'
import { parseUploadedFile, validateFile } from '@/lib/file-parser'
import { OpenAI } from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check rate limit
    const rateCheck = await checkRateLimit(user.id, ingestLimiter, 'ingest')
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: rateCheck.error },
        {
          status: 429,
          headers: { 'X-RateLimit-Remaining': '0' },
        }
      )
    }

    let allChunks: string[] = []
    let processedFiles: string[] = []
    let source = 'manual'
    let metadata = {}

    // Support both FormData and JSON
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      // JSON request - simple text ingestion
      const body = await request.json()
      const text = body.text as string
      metadata = body.metadata || {}
      source = metadata.source || 'manual'

      if (!text?.trim()) {
        return NextResponse.json({ error: 'Text content required' }, { status: 400 })
      }

      allChunks = chunkText(text)
    } else {
      // FormData request - file uploads
      const formData = await request.formData()
      const files = formData.getAll('files') as File[]
      const manualText = formData.get('text') as string
      source = (formData.get('source') as string) || 'manual'
      metadata = { source }

      if (!files.length && !manualText) {
        return NextResponse.json(
          { error: 'Please provide files or text content' },
          { status: 400 }
        )
      }

      // Process uploaded files
      for (const file of files) {
        const error = validateFile(file)
        if (error) {
          return NextResponse.json({ error }, { status: 400 })
        }

        try {
          const parsed = await parseUploadedFile(file)
          const chunks = chunkText(parsed.text)
          allChunks.push(...chunks)
          processedFiles.push(parsed.filename)
        } catch (err) {
          console.error(`Failed to parse ${file.name}:`, err)
          return NextResponse.json(
            { error: `Failed to parse ${file.name}` },
            { status: 400 }
          )
        }
      }

      // Process manual text
      if (manualText?.trim()) {
        const chunks = chunkText(manualText)
        allChunks.push(...chunks)
      }
    }

    if (!allChunks.length) {
      return NextResponse.json(
        { error: 'No content to ingest' },
        { status: 400 }
      )
    }

    // Embed chunks and store
    const documents = []
    for (const chunk of allChunks) {
      try {
        const embedding = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: chunk,
        })

        documents.push({
          content: chunk,
          user_id: user.id,
          metadata: {
            ...metadata,
            source: source,
            files: processedFiles,
            uploaded_at: new Date().toISOString(),
          },
          embedding: embedding.data[0].embedding,
        })
      } catch (err) {
        console.error('Embedding error:', err)
        throw new Error('Failed to embed chunk')
      }
    }

    // Batch insert
    const { error } = await supabase.from('documents').insert(documents)
    if (error) throw error

    // Log action (audit_logs might not exist yet in dev)
    try {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'ingest',
        resource: 'documents',
        details: {
          chunks_created: allChunks.length,
          files: processedFiles,
          source,
        },
      })
    } catch (err) {
      console.warn('Could not log action - audit_logs table may not exist yet')
    }

    return NextResponse.json({
      success: true,
      chunks: allChunks.length,
      files: processedFiles,
      remaining: rateCheck.remaining,
    })
  } catch (error) {
    console.error('Ingest error:', error)
    return NextResponse.json(
      { error: 'Ingest failed' },
      { status: 500 }
    )
  }
}

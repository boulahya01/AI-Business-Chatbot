import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/chat-history?sessionId=xxx
 * Get chat history for a session
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionId = request.nextUrl.searchParams.get('sessionId')
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', user.id)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('History fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}

/**
 * DELETE /api/chat-history?sessionId=xxx
 * Clear chat history for a session
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionId = request.nextUrl.searchParams.get('sessionId')
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', user.id)
      .eq('session_id', sessionId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('History delete error:', error)
    return NextResponse.json({ error: 'Failed to delete history' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * DELETE /api/documents/[id] - Delete a specific document chunk
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify document belongs to user
    const { data: doc } = await supabase
      .from('documents')
      .select('user_id')
      .eq('id', params.id)
      .single()

    if (!doc || doc.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 })
    }

    // Delete the document
    const { error } = await supabase.from('documents').delete().eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete document error:', error)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}

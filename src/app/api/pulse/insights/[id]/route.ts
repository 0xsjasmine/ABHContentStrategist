import { NextRequest, NextResponse } from 'next/server';
import { updateInsightStatus, isSupabaseConfigured } from '@/lib/supabase';

// PATCH - Update insight status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 503 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['new', 'reviewed', 'engaged', 'dismissed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    await updateInsightStatus(id, status);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating insight:', error);
    return NextResponse.json(
      { error: 'Failed to update insight' },
      { status: 500 }
    );
  }
}

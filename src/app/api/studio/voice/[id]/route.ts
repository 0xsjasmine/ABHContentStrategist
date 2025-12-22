import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

// PATCH - Update voice example
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
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('voice_training')
      .update(body)
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating voice example:', error);
    return NextResponse.json(
      { error: 'Failed to update voice example' },
      { status: 500 }
    );
  }
}

// DELETE - Remove voice example
export async function DELETE(
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
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('voice_training')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting voice example:', error);
    return NextResponse.json(
      { error: 'Failed to delete voice example' },
      { status: 500 }
    );
  }
}

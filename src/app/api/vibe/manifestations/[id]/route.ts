import { NextRequest, NextResponse } from 'next/server';
import { updateManifestationStatus, getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

// PATCH - Update manifestation
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

    // If only updating status, use the dedicated function
    if (body.status && Object.keys(body).length === 1) {
      await updateManifestationStatus(id, body.status);
      return NextResponse.json({ success: true });
    }

    // Otherwise, update all provided fields
    const supabase = getSupabaseClient();
    const updates: Record<string, unknown> = {};

    if (body.title) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.why_it_matters !== undefined) updates.why_it_matters = body.why_it_matters;
    if (body.visual_url !== undefined) updates.visual_url = body.visual_url;
    if (body.target_date !== undefined) updates.target_date = body.target_date;
    if (body.status) {
      updates.status = body.status;
      if (body.status === 'achieved') {
        updates.achieved_at = new Date().toISOString();
      }
    }

    const { error } = await supabase
      .from('manifestations')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating manifestation:', error);
    return NextResponse.json(
      { error: 'Failed to update manifestation' },
      { status: 500 }
    );
  }
}

// DELETE - Remove manifestation
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
      .from('manifestations')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting manifestation:', error);
    return NextResponse.json(
      { error: 'Failed to delete manifestation' },
      { status: 500 }
    );
  }
}

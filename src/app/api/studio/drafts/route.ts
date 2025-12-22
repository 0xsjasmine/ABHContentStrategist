import { NextRequest, NextResponse } from 'next/server';
import { getTweetDrafts, saveTweetDraft, isSupabaseConfigured } from '@/lib/supabase';

// GET - Fetch tweet drafts
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase not configured', drafts: [] },
        { status: 200 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'draft' | 'approved' | 'posted' | 'rejected' | null;

    const drafts = await getTweetDrafts(status || undefined);
    return NextResponse.json({ drafts });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drafts', drafts: [] },
      { status: 500 }
    );
  }
}

// POST - Save a new draft
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { draft_text, draft_type, source_insight_id, voice_score, status } = body;

    if (!draft_text) {
      return NextResponse.json(
        { error: 'Draft text is required' },
        { status: 400 }
      );
    }

    const draft = await saveTweetDraft({
      draft_text,
      draft_type: draft_type || 'single',
      source_insight_id: source_insight_id || null,
      voice_score: voice_score || null,
      status: status || 'draft',
      feedback_notes: null,
      posted_url: null,
      engagement_data: null,
    });

    return NextResponse.json({ draft });
  } catch (error) {
    console.error('Error saving draft:', error);
    return NextResponse.json(
      { error: 'Failed to save draft' },
      { status: 500 }
    );
  }
}

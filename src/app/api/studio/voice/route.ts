import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase';

// GET - Fetch voice training examples
export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase not configured', examples: [] },
        { status: 200 }
      );
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('voice_training')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ examples: data || [] });
  } catch (error) {
    console.error('Error fetching voice examples:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice examples', examples: [] },
      { status: 500 }
    );
  }
}

// POST - Add a voice training example
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { example_tweet, source, approved, feedback_notes, patterns_to_replicate } = body;

    if (!example_tweet) {
      return NextResponse.json(
        { error: 'Example tweet is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('voice_training')
      .insert({
        example_tweet,
        source: source || 'manual',
        approved: approved ?? null,
        feedback_notes: feedback_notes || null,
        patterns_to_replicate: patterns_to_replicate || [],
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ example: data });
  } catch (error) {
    console.error('Error adding voice example:', error);
    return NextResponse.json(
      { error: 'Failed to add voice example' },
      { status: 500 }
    );
  }
}

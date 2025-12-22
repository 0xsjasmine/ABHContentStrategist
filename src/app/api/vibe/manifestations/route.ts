import { NextRequest, NextResponse } from 'next/server';
import { getManifestations, createManifestation, isSupabaseConfigured } from '@/lib/supabase';

// GET - Fetch manifestations
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase not configured', manifestations: [] },
        { status: 200 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'person' | 'topic' | 'milestone' | 'series' | null;

    const manifestations = await getManifestations(type || undefined);
    return NextResponse.json({ manifestations });
  } catch (error) {
    console.error('Error fetching manifestations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch manifestations', manifestations: [] },
      { status: 500 }
    );
  }
}

// POST - Create a new manifestation
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { type, title, description, why_it_matters, status, visual_url, target_date } = body;

    if (!type || !title) {
      return NextResponse.json(
        { error: 'Type and title are required' },
        { status: 400 }
      );
    }

    const manifestation = await createManifestation({
      type,
      title,
      description: description || null,
      why_it_matters: why_it_matters || null,
      status: status || 'manifesting',
      visual_url: visual_url || null,
      notes: null,
      target_date: target_date || null,
    });

    return NextResponse.json({ manifestation });
  } catch (error) {
    console.error('Error creating manifestation:', error);
    return NextResponse.json(
      { error: 'Failed to create manifestation' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getPulseInsights, isSupabaseConfigured } from '@/lib/supabase';

// GET - Fetch pulse insights
export async function GET(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase not configured', insights: [] },
        { status: 200 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as 'new' | 'reviewed' | 'engaged' | 'dismissed' | null;
    const category = searchParams.get('category') as 'friendships' | 'ai' | 'ambition' | 'twenties' | null;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    const insights = await getPulseInsights({
      status: status || undefined,
      category: category || undefined,
      limit,
    });

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Error fetching insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights', insights: [] },
      { status: 500 }
    );
  }
}

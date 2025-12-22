import { NextRequest, NextResponse } from 'next/server';
import {
  getWatchlistAccounts,
  addWatchlistAccount,
  removeWatchlistAccount,
  isSupabaseConfigured,
} from '@/lib/supabase';

// GET - Fetch all watchlist accounts
export async function GET() {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase not configured', accounts: [] },
        { status: 200 }
      );
    }

    const accounts = await getWatchlistAccounts();
    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watchlist', accounts: [] },
      { status: 500 }
    );
  }
}

// POST - Add a new account to watchlist
export async function POST(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { handle, display_name, category, why_watching, abh_relevance_notes } = body;

    if (!handle) {
      return NextResponse.json(
        { error: 'Handle is required' },
        { status: 400 }
      );
    }

    const account = await addWatchlistAccount({
      handle,
      display_name: display_name || null,
      category: category || null,
      why_watching: why_watching || null,
      abh_relevance_notes: abh_relevance_notes || null,
    });

    return NextResponse.json({ account });
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to add to watchlist' },
      { status: 500 }
    );
  }
}

// DELETE - Remove an account from watchlist
export async function DELETE(request: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    await removeWatchlistAccount(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return NextResponse.json(
      { error: 'Failed to remove from watchlist' },
      { status: 500 }
    );
  }
}

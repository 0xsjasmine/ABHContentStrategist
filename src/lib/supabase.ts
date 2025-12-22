// Supabase Client for ABH Command Center
// Server and client-side utilities

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Client-side Supabase client (singleton)
let clientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!clientInstance) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase environment variables not configured');
    }
    clientInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  return clientInstance;
}

// Server-side Supabase client (for API routes)
export function getServerClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase server environment variables not configured');
  }

  return createClient(url, key);
}

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

// ===================
// WATCHLIST OPERATIONS
// ===================

export interface WatchlistAccount {
  id: string;
  handle: string;
  display_name: string | null;
  category: 'founder' | 'tech_woman' | 'culture_maker' | 'creator' | null;
  why_watching: string | null;
  abh_relevance_notes: string | null;
  added_at: string;
  last_scanned_at: string | null;
}

export async function getWatchlistAccounts(): Promise<WatchlistAccount[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('watchlist_accounts')
    .select('*')
    .order('added_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function addWatchlistAccount(
  account: Omit<WatchlistAccount, 'id' | 'added_at' | 'last_scanned_at'>
): Promise<WatchlistAccount> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('watchlist_accounts')
    .insert({
      handle: account.handle.replace('@', '').toLowerCase(),
      display_name: account.display_name,
      category: account.category,
      why_watching: account.why_watching,
      abh_relevance_notes: account.abh_relevance_notes,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeWatchlistAccount(id: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('watchlist_accounts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function updateWatchlistLastScanned(handles: string[]): Promise<void> {
  const supabase = getSupabaseClient();
  const cleanHandles = handles.map(h => h.replace('@', '').toLowerCase());

  const { error } = await supabase
    .from('watchlist_accounts')
    .update({ last_scanned_at: new Date().toISOString() })
    .in('handle', cleanHandles);

  if (error) throw error;
}

// ===================
// PULSE INSIGHTS OPERATIONS
// ===================

export interface PulseInsight {
  id: string;
  headline: string;
  subtitle: string | null;
  category: 'friendships' | 'ai' | 'ambition' | 'twenties';
  urgency: 'high' | 'medium' | 'low';
  summary: string | null;
  why_this_matters: string | null;
  key_insight: string | null;
  score_friendships: number | null;
  score_ai: number | null;
  score_ambition: number | null;
  score_twenties: number | null;
  score_composite: number | null;
  key_posts: any[] | null;
  involved_accounts: string[] | null;
  related_topics: string[] | null;
  engagement_type: 'reply' | 'quote_tweet' | 'thread' | 'save' | null;
  engagement_angle: string | null;
  scanned_at: string;
  status: 'new' | 'reviewed' | 'engaged' | 'dismissed';
  source_citations: any[] | null;
}

export async function getPulseInsights(options?: {
  status?: PulseInsight['status'];
  category?: PulseInsight['category'];
  limit?: number;
}): Promise<PulseInsight[]> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('pulse_insights')
    .select('*')
    .order('scanned_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.category) {
    query = query.eq('category', options.category);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function savePulseInsight(
  insight: Omit<PulseInsight, 'id' | 'scanned_at' | 'status'>
): Promise<PulseInsight> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('pulse_insights')
    .insert({
      ...insight,
      status: 'new',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateInsightStatus(
  id: string,
  status: PulseInsight['status']
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('pulse_insights')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
}

// ===================
// PULSE SCANS OPERATIONS
// ===================

export interface PulseScan {
  id: string;
  scanned_at: string;
  accounts_scanned: number;
  handles: string[];
  insights_found: number;
  top_opportunity: any | null;
  overall_pulse: string | null;
  raw_response: string | null;
}

export async function savePulseScan(scan: Omit<PulseScan, 'id' | 'scanned_at'>): Promise<PulseScan> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('pulse_scans')
    .insert(scan)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getLatestPulseScan(): Promise<PulseScan | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('pulse_scans')
    .select('*')
    .order('scanned_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data || null;
}

// ===================
// MANIFESTATIONS OPERATIONS
// ===================

export interface Manifestation {
  id: string;
  type: 'person' | 'topic' | 'milestone' | 'series';
  title: string;
  description: string | null;
  why_it_matters: string | null;
  status: 'manifesting' | 'in_progress' | 'achieved';
  visual_url: string | null;
  notes: any | null;
  target_date: string | null;
  achieved_at: string | null;
  created_at: string;
}

export async function getManifestations(type?: Manifestation['type']): Promise<Manifestation[]> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('manifestations')
    .select('*')
    .order('created_at', { ascending: false });

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createManifestation(
  manifestation: Omit<Manifestation, 'id' | 'created_at' | 'achieved_at'>
): Promise<Manifestation> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('manifestations')
    .insert(manifestation)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateManifestationStatus(
  id: string,
  status: Manifestation['status']
): Promise<void> {
  const supabase = getSupabaseClient();
  const updates: any = { status };

  if (status === 'achieved') {
    updates.achieved_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('manifestations')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

// ===================
// TWEET DRAFTS OPERATIONS
// ===================

export interface TweetDraft {
  id: string;
  source_insight_id: string | null;
  draft_text: string;
  draft_type: 'single' | 'thread' | 'reply' | 'quote_tweet';
  voice_score: number | null;
  status: 'draft' | 'approved' | 'posted' | 'rejected';
  feedback_notes: string | null;
  posted_url: string | null;
  engagement_data: any | null;
  created_at: string;
}

export async function getTweetDrafts(status?: TweetDraft['status']): Promise<TweetDraft[]> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('tweet_drafts')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function saveTweetDraft(
  draft: Omit<TweetDraft, 'id' | 'created_at'>
): Promise<TweetDraft> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('tweet_drafts')
    .insert(draft)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateTweetDraft(
  id: string,
  updates: Partial<TweetDraft>
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('tweet_drafts')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

// ===================
// DIARY ENTRIES (migrated from IndexedDB)
// ===================

export interface DiaryEntryDB {
  id: string;
  content: string;
  type: 'stories' | 'builds' | 'takes' | 'reflections' | null;
  tags: string[] | null;
  analysis: any | null;
  created_at: string;
  updated_at: string;
}

export async function getDiaryEntries(): Promise<DiaryEntryDB[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('diary_entries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function saveDiaryEntry(
  entry: Omit<DiaryEntryDB, 'id' | 'created_at' | 'updated_at'>
): Promise<DiaryEntryDB> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('diary_entries')
    .insert(entry)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateDiaryEntry(
  id: string,
  updates: Partial<DiaryEntryDB>
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('diary_entries')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

// Supabase Database Types for ABH Command Center
// Auto-generated types for type safety

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      watchlist_accounts: {
        Row: {
          id: string;
          handle: string;
          display_name: string | null;
          category: 'founder' | 'tech_woman' | 'culture_maker' | 'creator' | null;
          why_watching: string | null;
          abh_relevance_notes: string | null;
          added_at: string;
          last_scanned_at: string | null;
        };
        Insert: {
          id?: string;
          handle: string;
          display_name?: string | null;
          category?: 'founder' | 'tech_woman' | 'culture_maker' | 'creator' | null;
          why_watching?: string | null;
          abh_relevance_notes?: string | null;
          added_at?: string;
          last_scanned_at?: string | null;
        };
        Update: {
          id?: string;
          handle?: string;
          display_name?: string | null;
          category?: 'founder' | 'tech_woman' | 'culture_maker' | 'creator' | null;
          why_watching?: string | null;
          abh_relevance_notes?: string | null;
          added_at?: string;
          last_scanned_at?: string | null;
        };
      };
      pulse_insights: {
        Row: {
          id: string;
          headline: string;
          subtitle: string | null;
          category: 'friendships' | 'ai' | 'ambition' | 'twenties' | null;
          urgency: 'high' | 'medium' | 'low';
          summary: string | null;
          why_this_matters: string | null;
          key_insight: string | null;
          score_friendships: number | null;
          score_ai: number | null;
          score_ambition: number | null;
          score_twenties: number | null;
          score_composite: number | null;
          key_posts: Json | null;
          involved_accounts: string[] | null;
          related_topics: string[] | null;
          engagement_type: 'reply' | 'quote_tweet' | 'thread' | 'save' | null;
          engagement_angle: string | null;
          scanned_at: string;
          status: 'new' | 'reviewed' | 'engaged' | 'dismissed';
          source_citations: Json | null;
        };
        Insert: {
          id?: string;
          headline: string;
          subtitle?: string | null;
          category?: 'friendships' | 'ai' | 'ambition' | 'twenties' | null;
          urgency?: 'high' | 'medium' | 'low';
          summary?: string | null;
          why_this_matters?: string | null;
          key_insight?: string | null;
          score_friendships?: number | null;
          score_ai?: number | null;
          score_ambition?: number | null;
          score_twenties?: number | null;
          score_composite?: number | null;
          key_posts?: Json | null;
          involved_accounts?: string[] | null;
          related_topics?: string[] | null;
          engagement_type?: 'reply' | 'quote_tweet' | 'thread' | 'save' | null;
          engagement_angle?: string | null;
          scanned_at?: string;
          status?: 'new' | 'reviewed' | 'engaged' | 'dismissed';
          source_citations?: Json | null;
        };
        Update: {
          id?: string;
          headline?: string;
          subtitle?: string | null;
          category?: 'friendships' | 'ai' | 'ambition' | 'twenties' | null;
          urgency?: 'high' | 'medium' | 'low';
          summary?: string | null;
          why_this_matters?: string | null;
          key_insight?: string | null;
          score_friendships?: number | null;
          score_ai?: number | null;
          score_ambition?: number | null;
          score_twenties?: number | null;
          score_composite?: number | null;
          key_posts?: Json | null;
          involved_accounts?: string[] | null;
          related_topics?: string[] | null;
          engagement_type?: 'reply' | 'quote_tweet' | 'thread' | 'save' | null;
          engagement_angle?: string | null;
          scanned_at?: string;
          status?: 'new' | 'reviewed' | 'engaged' | 'dismissed';
          source_citations?: Json | null;
        };
      };
      pulse_scans: {
        Row: {
          id: string;
          scanned_at: string;
          accounts_scanned: number;
          handles: string[];
          insights_found: number;
          top_opportunity: Json | null;
          overall_pulse: string | null;
          raw_response: string | null;
        };
        Insert: {
          id?: string;
          scanned_at?: string;
          accounts_scanned?: number;
          handles?: string[];
          insights_found?: number;
          top_opportunity?: Json | null;
          overall_pulse?: string | null;
          raw_response?: string | null;
        };
        Update: {
          id?: string;
          scanned_at?: string;
          accounts_scanned?: number;
          handles?: string[];
          insights_found?: number;
          top_opportunity?: Json | null;
          overall_pulse?: string | null;
          raw_response?: string | null;
        };
      };
      manifestations: {
        Row: {
          id: string;
          type: 'person' | 'topic' | 'milestone' | 'series';
          title: string;
          description: string | null;
          why_it_matters: string | null;
          status: 'manifesting' | 'in_progress' | 'achieved';
          visual_url: string | null;
          notes: Json | null;
          target_date: string | null;
          achieved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: 'person' | 'topic' | 'milestone' | 'series';
          title: string;
          description?: string | null;
          why_it_matters?: string | null;
          status?: 'manifesting' | 'in_progress' | 'achieved';
          visual_url?: string | null;
          notes?: Json | null;
          target_date?: string | null;
          achieved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: 'person' | 'topic' | 'milestone' | 'series';
          title?: string;
          description?: string | null;
          why_it_matters?: string | null;
          status?: 'manifesting' | 'in_progress' | 'achieved';
          visual_url?: string | null;
          notes?: Json | null;
          target_date?: string | null;
          achieved_at?: string | null;
          created_at?: string;
        };
      };
      tweet_drafts: {
        Row: {
          id: string;
          source_insight_id: string | null;
          draft_text: string;
          draft_type: 'single' | 'thread' | 'reply' | 'quote_tweet';
          voice_score: number | null;
          status: 'draft' | 'approved' | 'posted' | 'rejected';
          feedback_notes: string | null;
          posted_url: string | null;
          engagement_data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_insight_id?: string | null;
          draft_text: string;
          draft_type?: 'single' | 'thread' | 'reply' | 'quote_tweet';
          voice_score?: number | null;
          status?: 'draft' | 'approved' | 'posted' | 'rejected';
          feedback_notes?: string | null;
          posted_url?: string | null;
          engagement_data?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          source_insight_id?: string | null;
          draft_text?: string;
          draft_type?: 'single' | 'thread' | 'reply' | 'quote_tweet';
          voice_score?: number | null;
          status?: 'draft' | 'approved' | 'posted' | 'rejected';
          feedback_notes?: string | null;
          posted_url?: string | null;
          engagement_data?: Json | null;
          created_at?: string;
        };
      };
      voice_training: {
        Row: {
          id: string;
          example_tweet: string;
          source: 'generated' | 'manual' | 'posted';
          approved: boolean | null;
          feedback_notes: string | null;
          patterns_to_replicate: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          example_tweet: string;
          source?: 'generated' | 'manual' | 'posted';
          approved?: boolean | null;
          feedback_notes?: string | null;
          patterns_to_replicate?: string[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          example_tweet?: string;
          source?: 'generated' | 'manual' | 'posted';
          approved?: boolean | null;
          feedback_notes?: string | null;
          patterns_to_replicate?: string[] | null;
          created_at?: string;
        };
      };
      diary_entries: {
        Row: {
          id: string;
          content: string;
          type: 'stories' | 'builds' | 'takes' | 'reflections' | null;
          tags: string[] | null;
          analysis: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          content: string;
          type?: 'stories' | 'builds' | 'takes' | 'reflections' | null;
          tags?: string[] | null;
          analysis?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          content?: string;
          type?: 'stories' | 'builds' | 'takes' | 'reflections' | null;
          tags?: string[] | null;
          analysis?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      book_quotes: {
        Row: {
          id: string;
          book_title: string;
          author: string;
          quote: string;
          page: string | null;
          my_take: string | null;
          tags: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          book_title: string;
          author: string;
          quote: string;
          page?: string | null;
          my_take?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          book_title?: string;
          author?: string;
          quote?: string;
          page?: string | null;
          my_take?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      saved_formats: {
        Row: {
          id: string;
          text: string;
          url: string | null;
          author: string;
          saved_date: string;
          tags_topic: string[] | null;
          tags_creator: string[] | null;
          tags_format: string[] | null;
          tags_vibe: string[] | null;
          highlights: string[] | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          text: string;
          url?: string | null;
          author: string;
          saved_date?: string;
          tags_topic?: string[] | null;
          tags_creator?: string[] | null;
          tags_format?: string[] | null;
          tags_vibe?: string[] | null;
          highlights?: string[] | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          text?: string;
          url?: string | null;
          author?: string;
          saved_date?: string;
          tags_topic?: string[] | null;
          tags_creator?: string[] | null;
          tags_format?: string[] | null;
          tags_vibe?: string[] | null;
          highlights?: string[] | null;
          notes?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

// Convenience type exports
export type WatchlistAccount = Database['public']['Tables']['watchlist_accounts']['Row'];
export type PulseInsight = Database['public']['Tables']['pulse_insights']['Row'];
export type PulseScan = Database['public']['Tables']['pulse_scans']['Row'];
export type Manifestation = Database['public']['Tables']['manifestations']['Row'];
export type TweetDraft = Database['public']['Tables']['tweet_drafts']['Row'];
export type VoiceTraining = Database['public']['Tables']['voice_training']['Row'];
export type DiaryEntry = Database['public']['Tables']['diary_entries']['Row'];
export type BookQuote = Database['public']['Tables']['book_quotes']['Row'];
export type SavedFormat = Database['public']['Tables']['saved_formats']['Row'];

// ABH Category type (Content Pillars: Friendships, AI, Ambition, Twenties)
export type ABHCategory = 'friendships' | 'ai' | 'ambition' | 'twenties';

// ABH Score type
export interface ABHScore {
  friendships: number;
  ai: number;
  ambition: number;
  twenties: number;
  composite: number;
}

// Key Post type (for JSON field)
export interface KeyPost {
  handle: string;
  postText?: string;
  postSummary: string;
  tweetUrl?: string;
  engagement: 'high' | 'medium' | 'low';
  likes?: number;
  retweets?: number;
}

// Engagement Opportunity type
export interface EngagementOpportunity {
  type: 'reply' | 'quote_tweet' | 'thread' | 'save';
  suggestedAngle: string;
  urgency: 'high' | 'medium' | 'low';
}

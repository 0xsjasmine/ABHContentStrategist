-- ABH Command Center Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================
-- WATCHLIST ACCOUNTS
-- KOLs and people to track on X
-- ===================
CREATE TABLE IF NOT EXISTS watchlist_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  handle TEXT NOT NULL UNIQUE,
  display_name TEXT,
  category TEXT CHECK (category IN ('founder', 'tech_woman', 'culture_maker', 'creator')),
  why_watching TEXT,
  abh_relevance_notes TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  last_scanned_at TIMESTAMPTZ
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_watchlist_handle ON watchlist_accounts(handle);
CREATE INDEX IF NOT EXISTS idx_watchlist_category ON watchlist_accounts(category);

-- ===================
-- PULSE INSIGHTS
-- Scanned insights from watchlist
-- ===================
CREATE TABLE IF NOT EXISTS pulse_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  headline TEXT NOT NULL,
  subtitle TEXT,
  category TEXT CHECK (category IN ('ambition', 'community', 'growth', 'realness', 'twenties')),
  urgency TEXT CHECK (urgency IN ('high', 'medium', 'low')) DEFAULT 'medium',
  summary TEXT,
  why_this_matters TEXT,
  key_insight TEXT,

  -- ABH 5-Pillar Scoring (0-10 each)
  score_ambition INT CHECK (score_ambition >= 0 AND score_ambition <= 10),
  score_community INT CHECK (score_community >= 0 AND score_community <= 10),
  score_growth INT CHECK (score_growth >= 0 AND score_growth <= 10),
  score_realness INT CHECK (score_realness >= 0 AND score_realness <= 10),
  score_twenties INT CHECK (score_twenties >= 0 AND score_twenties <= 10),
  score_composite DECIMAL(3,1),

  -- Key posts/tweets with URLs
  key_posts JSONB DEFAULT '[]'::jsonb,
  involved_accounts TEXT[] DEFAULT '{}',
  related_topics TEXT[] DEFAULT '{}',

  -- Engagement opportunity
  engagement_type TEXT CHECK (engagement_type IN ('reply', 'quote_tweet', 'thread', 'save')),
  engagement_angle TEXT,

  -- Meta
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT CHECK (status IN ('new', 'reviewed', 'engaged', 'dismissed')) DEFAULT 'new',
  source_citations JSONB DEFAULT '[]'::jsonb
);

-- Indexes for filtering
CREATE INDEX IF NOT EXISTS idx_insights_category ON pulse_insights(category);
CREATE INDEX IF NOT EXISTS idx_insights_urgency ON pulse_insights(urgency);
CREATE INDEX IF NOT EXISTS idx_insights_status ON pulse_insights(status);
CREATE INDEX IF NOT EXISTS idx_insights_scanned_at ON pulse_insights(scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_insights_composite ON pulse_insights(score_composite DESC);

-- ===================
-- PULSE SCANS
-- History of scan runs
-- ===================
CREATE TABLE IF NOT EXISTS pulse_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  accounts_scanned INT DEFAULT 0,
  handles TEXT[] DEFAULT '{}',
  insights_found INT DEFAULT 0,
  top_opportunity JSONB,
  overall_pulse TEXT,
  raw_response TEXT
);

CREATE INDEX IF NOT EXISTS idx_scans_scanned_at ON pulse_scans(scanned_at DESC);

-- ===================
-- MANIFESTATIONS
-- Vision board items
-- ===================
CREATE TABLE IF NOT EXISTS manifestations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('person', 'topic', 'milestone', 'series')),
  title TEXT NOT NULL,
  description TEXT,
  why_it_matters TEXT,
  status TEXT CHECK (status IN ('manifesting', 'in_progress', 'achieved')) DEFAULT 'manifesting',
  visual_url TEXT,
  notes JSONB DEFAULT '[]'::jsonb,
  target_date DATE,
  achieved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_manifestations_type ON manifestations(type);
CREATE INDEX IF NOT EXISTS idx_manifestations_status ON manifestations(status);

-- ===================
-- TWEET DRAFTS
-- Generated content
-- ===================
CREATE TABLE IF NOT EXISTS tweet_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_insight_id UUID REFERENCES pulse_insights(id) ON DELETE SET NULL,
  draft_text TEXT NOT NULL,
  draft_type TEXT CHECK (draft_type IN ('single', 'thread', 'reply', 'quote_tweet')) DEFAULT 'single',
  voice_score INT CHECK (voice_score >= 1 AND voice_score <= 10),
  status TEXT CHECK (status IN ('draft', 'approved', 'posted', 'rejected')) DEFAULT 'draft',
  feedback_notes TEXT,
  posted_url TEXT,
  engagement_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drafts_status ON tweet_drafts(status);
CREATE INDEX IF NOT EXISTS idx_drafts_created_at ON tweet_drafts(created_at DESC);

-- ===================
-- VOICE TRAINING
-- Learning your style
-- ===================
CREATE TABLE IF NOT EXISTS voice_training (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  example_tweet TEXT NOT NULL,
  source TEXT CHECK (source IN ('generated', 'manual', 'posted')) DEFAULT 'manual',
  approved BOOLEAN DEFAULT NULL,
  feedback_notes TEXT,
  patterns_to_replicate TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voice_approved ON voice_training(approved);

-- ===================
-- DIARY ENTRIES
-- Migrated from IndexedDB
-- ===================
CREATE TABLE IF NOT EXISTS diary_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  type TEXT CHECK (type IN ('stories', 'builds', 'takes', 'reflections')),
  tags TEXT[] DEFAULT '{}',
  analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diary_type ON diary_entries(type);
CREATE INDEX IF NOT EXISTS idx_diary_created_at ON diary_entries(created_at DESC);

-- ===================
-- BOOK QUOTES
-- Library of quotes
-- ===================
CREATE TABLE IF NOT EXISTS book_quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_title TEXT NOT NULL,
  author TEXT NOT NULL,
  quote TEXT NOT NULL,
  page TEXT,
  my_take TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotes_author ON book_quotes(author);
CREATE INDEX IF NOT EXISTS idx_quotes_book ON book_quotes(book_title);

-- ===================
-- SAVED POST FORMATS
-- Inspiration posts
-- ===================
CREATE TABLE IF NOT EXISTS saved_formats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text TEXT NOT NULL,
  url TEXT,
  author TEXT NOT NULL,
  saved_date TIMESTAMPTZ DEFAULT NOW(),
  tags_topic TEXT[] DEFAULT '{}',
  tags_creator TEXT[] DEFAULT '{}',
  tags_format TEXT[] DEFAULT '{}',
  tags_vibe TEXT[] DEFAULT '{}',
  highlights TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_formats_author ON saved_formats(author);

-- ===================
-- ROW LEVEL SECURITY (RLS)
-- Uncomment and customize if you add auth
-- ===================

-- ALTER TABLE watchlist_accounts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE pulse_insights ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE pulse_scans ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE manifestations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tweet_drafts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE voice_training ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE book_quotes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE saved_formats ENABLE ROW LEVEL SECURITY;

-- Example policy (allow all for authenticated users):
-- CREATE POLICY "Allow all for authenticated" ON watchlist_accounts
--   FOR ALL TO authenticated USING (true) WITH CHECK (true);

// Core data types for ABH Content Strategist

// =====================
// DIARY TAB TYPES
// =====================

export type DiaryEntryType = 'stories' | 'builds' | 'takes' | 'reflections';

export interface DiaryVoiceAnalysis {
  ambitious: number; // Percentage (0-100)
  human: number;     // Percentage (0-100)
}

export interface DiaryAnalysis {
  contentPotential: number; // 1-10 score
  coreInsight: string;
  suggestedFormat: string;
  voice: DiaryVoiceAnalysis;
  keyPhrases: string[];
  emotionalTone: string;
  contentPillar: string[];
}

export interface TrendMatch {
  topics: string[];
  mentions: number;
  urgency: 'high' | 'medium' | 'low';
  angle: string;
}

export interface DiaryEntry {
  id: string;
  timestamp: string; // ISO string
  content: string;
  tags: string[];
  type: DiaryEntryType;
  analysis?: DiaryAnalysis;
  trendMatch?: TrendMatch;
  createdAt: string;
  updatedAt: string;
}

// =====================
// CREATOR/INSPIRATION TAB TYPES
// =====================

export interface SavedPostTags {
  topic: string[];
  creator: string[];
  format: string[];
  vibe: string[];
}

export interface SavedPost {
  id: string;
  text: string;
  url?: string;
  author: string;
  savedDate: string;
  tags: SavedPostTags;
  highlights: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// =====================
// BOOKS/LIBRARY TAB TYPES
// =====================

export interface BookQuote {
  id: string;
  bookTitle: string;
  author: string;
  quote: string;
  page?: string;
  myTake: string; // Required - user's reaction/connection
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// =====================
// DATA/TRENDS TAB TYPES
// =====================

export interface TrendingTopic {
  topic: string;
  mentions: number;
  context: string;
  sentiment: 'excited' | 'concerned' | 'mixed' | 'neutral';
  topPosts: {
    author: string;
    text: string;
    engagement: number;
    url?: string;
  }[];
  yourOpportunity?: {
    diaryEntryId?: string;
    angle: string;
    urgency: 'high' | 'medium' | 'low';
  };
}

export interface TrendingPerson {
  handle: string;
  context: string;
  engagement: number;
  relevance: string;
}

export interface Debate {
  topic: string;
  sides: string[];
  yourAngle: string;
  opportunityScore: number;
}

export interface DailyBrief {
  id: string;
  date: string;
  generatedAt: string;
  trendingTopics: TrendingTopic[];
  trendingPeople: TrendingPerson[];
  debates: Debate[];
  diaryMatches: {
    diaryEntryId: string;
    trendTopic: string;
    angle: string;
    urgency: 'high' | 'medium' | 'low';
    suggestedFormat: string;
  }[];
}

// =====================
// REPLY GIRL TAB TYPES
// =====================

export type ReplyStyle =
  | 'supportive-add-value'
  | 'vulnerable-relatable'
  | 'sharp-challenge'
  | 'thought-leadership'
  | 'join-conversation';

export interface ReplyTarget {
  id: string;
  author: string;
  text: string;
  url?: string;
  engagement: {
    likes: number;
    retweets: number;
  };
}

export interface ReplySuggestion {
  id: string;
  text: string;
  style: ReplyStyle;
  diaryPulls: string[];
  characterCount: number;
  whyThisWorks: string;
}

export interface ReplyRequest {
  id: string;
  originalPost: ReplyTarget;
  userContext: {
    whyReply: string;
    connectedDiaryId?: string;
    stylePreference: ReplyStyle;
  };
  suggestions: ReplySuggestion[];
  grokContext?: {
    topicTrending: string;
    mentions: number;
    authorFollowers: number;
    priority: 'high' | 'medium' | 'low';
  };
  createdAt: string;
}

// =====================
// CONTENT GENERATION TYPES
// =====================

export interface ContentSource {
  type: 'diary' | 'library' | 'creator' | 'grok';
  content: string;
  attribution?: string;
  addedValue?: string;
}

export interface GenerationRequest {
  diaryEntryId: string;
  selectedBookQuoteIds?: string[];
  selectedFormatPostId?: string;
  trendHook?: string;
  customInstructions?: string;
}

export interface GeneratedPost {
  id: string;
  content: string;
  sources: ContentSource[];
  voiceCheck: {
    diaryVoicePercentage: number;
    ambitiousHumanSplit: DiaryVoiceAnalysis;
  };
  whyThisWorks: string[];
  characterCount: number;
  createdAt: string;
}

export interface GenerationCombination {
  id: string;
  title: string;
  storytellingScore: number;
  timingScore: number;
  naturalFitScore: number;
  totalScore: number;
  elements: {
    diary: { insight: string; keyPhrases: string[] };
    library?: { quote: string; author: string; addedDepth: string };
    grok?: { trend: string; mentions: number; urgency: string };
    format?: { creator: string; structure: string; vibe: string };
  };
  whyCombination: string[];
}

// =====================
// APP STATE TYPES
// =====================

export type TabId = 'diary' | 'creator' | 'books' | 'data' | 'reply';

export interface AppSettings {
  claudeApiKey?: string;
  grokApiKey?: string;
  serpApiKey?: string;
  autoSaveInterval: number; // milliseconds
  theme: 'light' | 'dark' | 'system';
}

// =====================
// TAG PRESETS
// =====================

export const DIARY_TAG_PRESETS = [
  '#AItools',
  '#seasons',
  '#tradeoffs',
  '#FlightStory',
  '#GenAI',
  '#unscalable',
  '#automation',
  '#relationships',
  '#building',
  '#reflection',
] as const;

export const FORMAT_TAG_PRESETS = [
  'thread-vulnerable',
  'single-hot-take',
  'data-insight',
  'storytelling',
  'listicle',
  'quote-tweet-style',
  'thread-tactical',
  'philosophical-single',
] as const;

export const VIBE_TAG_PRESETS = [
  'sharp',
  'warm',
  'provocative',
  'educational',
  'funny',
  'permission-giving',
  'vulnerable',
  'strategic',
] as const;

export const CONTENT_PILLARS = [
  'AI scales the scalable',
  'Trade-offs & seasons',
  'Thought leadership',
  'Life in seasons',
  'The sacrifice is real',
  'Give back',
  'Taste & curation',
] as const;

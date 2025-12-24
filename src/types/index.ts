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

export type TabId = 'diary' | 'pulse' | 'roundtable' | 'studio' | 'library';

export interface AppSettings {
  claudeApiKey?: string;
  grokApiKey?: string;
  serpApiKey?: string;
  autoSaveInterval: number; // milliseconds
  theme: 'light' | 'dark' | 'system';
}

// =====================
// AI ROUNDTABLE TYPES
// =====================

export interface PsychologyScore {
  score: number; // 1-10
  analysis: string;
  details?: string[];
}

export interface TriggerWithAnalysis {
  present: boolean;
  analysis: string;
}

export interface LevelTrigger {
  level: 'low' | 'medium' | 'high';
  analysis: string;
}

export interface AdditionalTriggers {
  socialProof: TriggerWithAnalysis | boolean; // Support both new and old format
  lossAversion: TriggerWithAnalysis | boolean;
  identitySignaling: TriggerWithAnalysis | boolean;
  specificity?: LevelTrigger; // New format
  vulnerability?: LevelTrigger; // New format
  specificityLevel?: 'low' | 'medium' | 'high'; // Old format for backwards compat
  vulnerabilityFactor?: 'low' | 'medium' | 'high'; // Old format for backwards compat
  permissionGiving: TriggerWithAnalysis | boolean;
  patternCompletion: TriggerWithAnalysis | boolean;
}

export interface AlignmentScores {
  abhFit: number; // 1-10 - Ambitious But Human balance
  voiceMatch: number; // 1-10 - Could this be YOUR voice?
  communityResonance: number; // 1-10 - Would your people care?
}

export interface AIAnalysis {
  model: 'grok' | 'claude' | 'openai';
  curiosityGap: PsychologyScore;
  predictionViolation: PsychologyScore;
  habituationBypass: PsychologyScore;
  additionalTriggers: AdditionalTriggers;
  keyInsight: string;
  alignmentScores: AlignmentScores;
}

export interface RoundtableAgreement {
  points: string[];
}

export interface RoundtableDifference {
  grokFocus: string;
  claudeFocus: string;
}

export interface ActionableTakeaway {
  category: 'structure' | 'language' | 'positioning' | 'timing' | 'format';
  title: string;
  description: string;
  example: string;
}

export interface TweetAnalysis {
  id: string;
  tweet: {
    author: string;
    handle: string;
    text: string;
    url?: string;
    embedHtml?: string;
    engagement: {
      likes: number;
      replies: number;
      retweets: number;
    };
    postedAt: string;
  };
  grokAnalysis: AIAnalysis;
  claudeAnalysis: AIAnalysis;
  openaiAnalysis?: AIAnalysis; // Optional for backwards compatibility
  agreements: RoundtableAgreement;
  differences: RoundtableDifference;
  takeaways: ActionableTakeaway[];
  analyzedAt: string;
}

// =====================
// CREATOR VOICE LIBRARY
// =====================

export type CreatorId = 'steven' | 'mylene' | 'greg';

export interface CreatorProfile {
  id: CreatorId;
  name: string;
  handle: string;
  description: string;
  color: string;
}

export const CREATORS: CreatorProfile[] = [
  { id: 'steven', name: 'Steven', handle: '', description: 'Vulnerable storytelling, uses lists', color: '#3B82F6' },
  { id: 'mylene', name: 'Mylene', handle: '', description: 'Punchy takes, contrarian angles', color: '#8B5CF6' },
  { id: 'greg', name: 'Greg', handle: '', description: 'Strategic hooks, pattern interrupts', color: '#10B981' },
];

export interface CreatorTweet {
  id: string;
  creatorId: CreatorId;
  text: string;
  author: string;
  handle: string;
  url?: string;
  embedHtml?: string;
  addedAt: string;
  notes?: string; // Optional notes about why this tweet works
}

export interface WeeklyPatternReport {
  id: string;
  weekOf: string;
  topCuriosityGapStructures: {
    structure: string;
    avgScore: number;
    examples: string[];
  }[];
  topPredictionViolations: {
    pattern: string;
    frequency: number;
  }[];
  habituationBypasses: {
    technique: string;
    effectiveness: number;
  }[];
  watchlistTrends: {
    handle: string;
    pattern: string;
  }[];
  recommendations: {
    tryThis: string;
    avoidThis: string;
    experiment: string;
  };
  generatedAt: string;
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

// =====================
// IMPORTED STRUCTURE (Pulse -> Diary)
// =====================

export interface ImportedStructure {
  id: string;
  sourceHandle: string; // Who the outlier was from
  sourceTweetUrl?: string; // Link to original tweet
  importedAt: string; // ISO string

  // The structure analysis from the outlier
  hookStrength: string; // e.g., "Strong personal confession opener"
  structureNotes: string; // e.g., "Provocation → List → Vulnerability → Close"
  authenticityFactor?: string; // e.g., "Raw admission of failure"
  uniqueAngle?: string; // e.g., "Turning weakness into unexpected strength"

  // Quick summary
  whatMadeItWork: string; // From analysis.whatStoodOut
  theLesson: string; // From analysis.theLesson

  // Scores for reference
  topicScore: number;
  storytellingScore: number;
  outperformanceMultiple?: number;

  // Original tweet text for context
  originalTweetText?: string;

  // Thought starters - podcast-style questions to spark reflection
  thoughtStarters?: ThoughtStarter[];
}

export interface ThoughtStarter {
  ai: 'grok' | 'claude' | 'gpt';
  question: string; // The thought-provoking question
  angle: string; // What perspective this question explores
  storyPrompt: string; // A follow-up to dig into personal experience
}

// Claude API Integration for Content Generation
// Server-side only - runs in API routes

import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_SYSTEM_PROMPT } from '@/prompts/claude-system';
import type {
  DiaryEntry,
  BookQuote,
  SavedPost,
  DiaryAnalysis,
  GenerationCombination,
  GeneratedPost,
  ContentSource,
} from '@/types';

// Initialize Anthropic client (will use ANTHROPIC_API_KEY env var)
function getClient(apiKey?: string): Anthropic {
  return new Anthropic({
    apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
  });
}

// =====================
// DIARY ANALYSIS
// =====================

export async function analyzeDiaryEntry(
  entry: DiaryEntry,
  apiKey?: string
): Promise<DiaryAnalysis> {
  const client = getClient(apiKey);

  const prompt = `Analyze this diary entry and provide a structured analysis.

DIARY ENTRY:
"""
${entry.content}
"""

Tags: ${entry.tags.join(', ')}
Type: ${entry.type}
Date: ${entry.timestamp}

Respond with a JSON object (no markdown, just raw JSON) with this structure:
{
  "contentPotential": <1-10 score>,
  "coreInsight": "<one sentence summary in user's words>",
  "suggestedFormat": "<format type: thread-vulnerable, single-hot-take, storytelling, etc.>",
  "voice": {
    "ambitious": <percentage 0-100>,
    "human": <percentage 0-100>
  },
  "keyPhrases": ["<phrase1>", "<phrase2>", ...],
  "emotionalTone": "<reflective/excited/vulnerable/sharp/etc.>",
  "contentPillar": ["<pillar1>", "<pillar2>", ...]
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: CLAUDE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  try {
    return JSON.parse(textContent.text) as DiaryAnalysis;
  } catch {
    // If JSON parsing fails, return a default analysis
    return {
      contentPotential: 5,
      coreInsight: 'Analysis pending...',
      suggestedFormat: 'single-hot-take',
      voice: { ambitious: 30, human: 70 },
      keyPhrases: [],
      emotionalTone: 'reflective',
      contentPillar: [],
    };
  }
}

// =====================
// FIND CONNECTIONS
// =====================

export interface UsageData {
  inputTokens: number;
  outputTokens: number;
}

export interface FindConnectionsResult {
  combinations: GenerationCombination[];
  usage?: UsageData;
}

export async function findConnections(
  diaryEntry: DiaryEntry,
  bookQuotes: BookQuote[],
  savedPosts: SavedPost[],
  trendingTopics?: string[],
  apiKey?: string
): Promise<FindConnectionsResult> {
  const client = getClient(apiKey);

  const booksContext = bookQuotes.length > 0
    ? `\n\nAVAILABLE BOOK QUOTES:\n${bookQuotes.map((q, i) =>
        `${i + 1}. "${q.quote}" - ${q.author} (${q.bookTitle})\n   Your take: ${q.myTake}`
      ).join('\n')}`
    : '';

  const formatsContext = savedPosts.length > 0
    ? `\n\nAVAILABLE FORMAT EXAMPLES:\n${savedPosts.map((p, i) =>
        `${i + 1}. @${p.author}: "${p.text.substring(0, 200)}..."\n   Format: ${p.tags.format.join(', ')} | Vibe: ${p.tags.vibe.join(', ')}\n   Notes: ${p.notes}`
      ).join('\n')}`
    : '';

  const trendsContext = trendingTopics && trendingTopics.length > 0
    ? `\n\nCURRENT TRENDING TOPICS:\n${trendingTopics.join('\n')}`
    : '';

  const prompt = `Based on this diary entry, find the best content combinations.

DIARY ENTRY:
"""
${diaryEntry.content}
"""
Tags: ${diaryEntry.tags.join(', ')}
Type: ${diaryEntry.type}
${booksContext}
${formatsContext}
${trendsContext}

Generate 2-3 combination options. Respond with a JSON array (no markdown, just raw JSON):
[
  {
    "id": "combo_1",
    "title": "<short descriptive title>",
    "storytellingScore": <1-10>,
    "timingScore": <1-10>,
    "naturalFitScore": <1-10>,
    "totalScore": <average>,
    "elements": {
      "diary": {
        "insight": "<core insight>",
        "keyPhrases": ["<phrase1>", "<phrase2>"]
      },
      "library": {
        "quote": "<quote if using one>",
        "author": "<author>",
        "addedDepth": "<how it adds depth>"
      },
      "grok": {
        "trend": "<trend if using one>",
        "mentions": <number>,
        "urgency": "<high/medium/low>"
      },
      "format": {
        "creator": "<@creator if using format>",
        "structure": "<structure description>",
        "vibe": "<vibe tags>"
      }
    },
    "whyCombination": ["<reason1>", "<reason2>"]
  }
]

Always include a "Pure Diary Voice" option as the last combination with only diary elements filled in.`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: CLAUDE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  // Extract usage data
  const usage: UsageData = {
    inputTokens: response.usage?.input_tokens || 0,
    outputTokens: response.usage?.output_tokens || 0,
  };

  try {
    return {
      combinations: JSON.parse(textContent.text) as GenerationCombination[],
      usage,
    };
  } catch {
    // Return a default pure diary option
    return {
      combinations: [{
        id: 'combo_pure',
        title: 'Pure Diary Voice',
        storytellingScore: 7,
        timingScore: 5,
        naturalFitScore: 10,
        totalScore: 7.3,
        elements: {
          diary: {
            insight: diaryEntry.content.substring(0, 200),
            keyPhrases: [],
          },
        },
        whyCombination: ['Most authentic - 100% your voice'],
      }],
      usage,
    };
  }
}

// =====================
// GENERATE POST
// =====================

export interface GeneratePostResult {
  post: GeneratedPost;
  usage?: UsageData;
}

export async function generatePost(
  diaryEntry: DiaryEntry,
  combination: GenerationCombination,
  bookQuote?: BookQuote,
  formatPost?: SavedPost,
  apiKey?: string
): Promise<GeneratePostResult> {
  const client = getClient(apiKey);

  let contextParts: string[] = [];

  contextParts.push(`DIARY ENTRY (70% foundation):
"""
${diaryEntry.content}
"""
Tags: ${diaryEntry.tags.join(', ')}
Key phrases to preserve: ${combination.elements.diary.keyPhrases.join(', ')}`);

  if (bookQuote && combination.elements.library) {
    contextParts.push(`
BOOK QUOTE TO WEAVE IN:
"${bookQuote.quote}" - ${bookQuote.author}
Your take: ${bookQuote.myTake}
How to add depth: ${combination.elements.library.addedDepth}`);
  }

  if (formatPost && combination.elements.format) {
    contextParts.push(`
FORMAT STRUCTURE TO USE:
From @${formatPost.author}:
"${formatPost.text}"
Structure: ${combination.elements.format.structure}
Vibe: ${combination.elements.format.vibe}
User notes: ${formatPost.notes}`);
  }

  if (combination.elements.grok) {
    contextParts.push(`
TREND HOOK:
Topic: ${combination.elements.grok.trend}
Mentions: ${combination.elements.grok.mentions}
Urgency: ${combination.elements.grok.urgency}`);
  }

  const prompt = `Generate an X post using these elements:

${contextParts.join('\n')}

COMBINATION RATIONALE:
${combination.whyCombination.join('\n')}

Generate the post and provide transparent sourcing. Respond with JSON (no markdown):
{
  "content": "<the generated post text>",
  "sources": [
    {
      "type": "diary",
      "content": "<what you pulled from diary>",
      "attribution": null,
      "addedValue": "foundation"
    },
    {
      "type": "library",
      "content": "<quote used if any>",
      "attribution": "<author>",
      "addedValue": "<how it adds depth>"
    }
  ],
  "voiceCheck": {
    "diaryVoicePercentage": <number>,
    "ambitiousHumanSplit": {
      "ambitious": <number>,
      "human": <number>
    }
  },
  "whyThisWorks": ["<reason1>", "<reason2>", "<reason3>"],
  "characterCount": <number>
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: CLAUDE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  // Extract usage data
  const usage: UsageData = {
    inputTokens: response.usage?.input_tokens || 0,
    outputTokens: response.usage?.output_tokens || 0,
  };

  try {
    const parsed = JSON.parse(textContent.text);
    return {
      post: {
        id: `gen_${Date.now()}`,
        ...parsed,
        createdAt: new Date().toISOString(),
      },
      usage,
    };
  } catch {
    // Return a fallback post
    return {
      post: {
        id: `gen_${Date.now()}`,
        content: diaryEntry.content.substring(0, 280),
        sources: [{
          type: 'diary',
          content: diaryEntry.content,
          addedValue: 'foundation',
        }],
        voiceCheck: {
          diaryVoicePercentage: 100,
          ambitiousHumanSplit: { ambitious: 30, human: 70 },
        },
        whyThisWorks: ['Pure diary voice - most authentic'],
        characterCount: Math.min(diaryEntry.content.length, 280),
        createdAt: new Date().toISOString(),
      },
      usage,
    };
  }
}

// =====================
// GENERATE REPLIES
// =====================

export async function generateReplies(
  originalPost: { author: string; text: string },
  diaryEntry: DiaryEntry,
  style: string,
  apiKey?: string
): Promise<{ text: string; style: string; diaryPulls: string[]; whyThisWorks: string }[]> {
  const client = getClient(apiKey);

  const prompt = `Generate reply options for this post:

ORIGINAL POST by @${originalPost.author}:
"${originalPost.text}"

YOUR DIARY ENTRY (substance for reply):
"${diaryEntry.content}"

PREFERRED STYLE: ${style}

Generate 3 reply options. Respond with JSON array (no markdown):
[
  {
    "text": "<reply under 280 chars>",
    "style": "<style name>",
    "diaryPulls": ["<insight from diary used>"],
    "whyThisWorks": "<explanation>"
  }
]

Styles to use:
- supportive-add-value: Agree + add insight
- vulnerable-relatable: Share similar experience
- sharp-challenge: Respectfully push back
- thought-leadership: Position unique angle`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: CLAUDE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  try {
    return JSON.parse(textContent.text);
  } catch {
    return [{
      text: 'Great point!',
      style: 'supportive-add-value',
      diaryPulls: [],
      whyThisWorks: 'Simple engagement',
    }];
  }
}

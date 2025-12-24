import { NextRequest, NextResponse } from 'next/server';
import { findConnections } from '@/lib/claude';
import type { DiaryEntry, BookQuote, SavedPost } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { diaryEntry, bookQuotes, savedPosts, trendHook } = body as {
      diaryEntry: DiaryEntry;
      bookQuotes: BookQuote[];
      savedPosts: SavedPost[];
      trendHook?: string;
    };

    if (!diaryEntry) {
      return NextResponse.json(
        { error: 'Diary entry is required' },
        { status: 400 }
      );
    }

    // Get API key from header or environment
    const apiKey = request.headers.get('x-api-key') || process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // Return mock combinations if no API key
      return NextResponse.json({
        combinations: [
          {
            id: 'combo_pure',
            title: 'Pure Diary Voice',
            storytellingScore: 8,
            timingScore: 5,
            naturalFitScore: 10,
            totalScore: 7.7,
            elements: {
              diary: {
                insight: diaryEntry.content.substring(0, 200),
                keyPhrases: diaryEntry.tags,
              },
            },
            whyCombination: ['Most authentic - 100% your voice', 'No additional elements needed'],
          },
          ...(bookQuotes.length > 0
            ? [
                {
                  id: 'combo_depth',
                  title: 'Diary + Quote Depth',
                  storytellingScore: 9,
                  timingScore: 6,
                  naturalFitScore: 8,
                  totalScore: 7.7,
                  elements: {
                    diary: {
                      insight: diaryEntry.content.substring(0, 200),
                      keyPhrases: diaryEntry.tags,
                    },
                    library: {
                      quote: bookQuotes[0].quote.substring(0, 100),
                      author: bookQuotes[0].author,
                      addedDepth: 'Adds philosophical depth to your personal insight',
                    },
                  },
                  whyCombination: [
                    'Quote adds intellectual depth',
                    'Natural connection to your diary theme',
                  ],
                },
              ]
            : []),
          ...(trendHook
            ? [
                {
                  id: 'combo_trend',
                  title: 'Diary + Trend Hook',
                  storytellingScore: 7,
                  timingScore: 10,
                  naturalFitScore: 7,
                  totalScore: 8.0,
                  elements: {
                    diary: {
                      insight: diaryEntry.content.substring(0, 200),
                      keyPhrases: diaryEntry.tags,
                    },
                    grok: {
                      trend: trendHook,
                      mentions: 10000,
                      urgency: 'high',
                    },
                  },
                  whyCombination: [
                    'Perfect timing with current trend',
                    'Your unique angle fills a gap in the conversation',
                  ],
                },
              ]
            : []),
        ],
      });
    }

    // Call Claude to find connections
    const trendTopics = trendHook ? [trendHook] : undefined;
    const result = await findConnections(
      diaryEntry,
      bookQuotes,
      savedPosts,
      trendTopics,
      apiKey
    );

    // Include usage data for tracking
    const usage = result.usage ? {
      claude: {
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
      },
    } : undefined;

    return NextResponse.json({ combinations: result.combinations, usage });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze content' },
      { status: 500 }
    );
  }
}

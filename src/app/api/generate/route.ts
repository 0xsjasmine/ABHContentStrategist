import { NextRequest, NextResponse } from 'next/server';
import { generatePost } from '@/lib/claude';
import type { DiaryEntry, BookQuote, SavedPost, GenerationCombination } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { diaryEntry, combination, bookQuote, formatPost } = body as {
      diaryEntry: DiaryEntry;
      combination: GenerationCombination;
      bookQuote?: BookQuote;
      formatPost?: SavedPost;
    };

    if (!diaryEntry || !combination) {
      return NextResponse.json(
        { error: 'Diary entry and combination are required' },
        { status: 400 }
      );
    }

    // Get API key from header or environment
    const apiKey = request.headers.get('x-api-key') || process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      // Return mock generated post if no API key
      let content = diaryEntry.content;

      // If we have a book quote, weave it in
      if (bookQuote && combination.elements.library) {
        const quoteSnippet = bookQuote.quote.length > 50
          ? bookQuote.quote.substring(0, 50) + '...'
          : bookQuote.quote;
        content = `I recently read ${bookQuote.author}'s line: "${quoteSnippet}"\n\n${content}`;
      }

      // If we have a trend hook, add it
      if (combination.elements.grok) {
        content = `Everyone's talking about ${combination.elements.grok.trend}.\n\nHere's what's missing:\n\n${content}`;
      }

      // Truncate if too long
      if (content.length > 280) {
        content = content.substring(0, 277) + '...';
      }

      return NextResponse.json({
        id: `gen_${Date.now()}`,
        content,
        sources: [
          {
            type: 'diary',
            content: diaryEntry.content.substring(0, 100),
            addedValue: 'foundation (70%)',
          },
          ...(bookQuote
            ? [
                {
                  type: 'library' as const,
                  content: bookQuote.quote.substring(0, 100),
                  attribution: bookQuote.author,
                  addedValue: 'philosophical depth',
                },
              ]
            : []),
          ...(combination.elements.grok
            ? [
                {
                  type: 'grok' as const,
                  content: combination.elements.grok.trend,
                  addedValue: 'timing hook',
                },
              ]
            : []),
        ],
        voiceCheck: {
          diaryVoicePercentage: bookQuote ? 70 : 100,
          ambitiousHumanSplit: { ambitious: 30, human: 70 },
        },
        whyThisWorks: [
          'Preserves your authentic diary voice',
          'Adds depth without overshadowing',
          combination.elements.grok ? 'Timely trend hook for visibility' : 'Evergreen content',
        ].filter(Boolean),
        characterCount: content.length,
        createdAt: new Date().toISOString(),
      });
    }

    // Call Claude to generate post
    const result = await generatePost(
      diaryEntry,
      combination,
      bookQuote,
      formatPost,
      apiKey
    );

    // Include usage data for tracking
    const usage = result.usage ? {
      claude: {
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
      },
    } : undefined;

    return NextResponse.json({ ...result.post, usage });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate post' },
      { status: 500 }
    );
  }
}

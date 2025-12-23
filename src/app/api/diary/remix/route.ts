import { NextRequest, NextResponse } from 'next/server';
import { callXAI, extractJSON } from '@/lib/xai';
import { getABHRemixPrompt, InspirationTweet } from '@/prompts/abh-remix-prompt';

export interface RemixResult {
  tweet: string;
  characterCount: number;
  techniqueBorrowed: string;
  abhAngle: string;
  hookType: 'curiosity' | 'confession' | 'contrarian' | 'story' | 'question';
  confidence: number;
}

export interface RemixResponse {
  remixedAt: string;
  inspirationCount: number;
  contentType: string;
  remixes: RemixResult[];
  structuralAnalysis?: {
    inspirationPatterns: string[];
    appliedToAbh: string;
  };
  alternateAngles?: Array<{
    angle: string;
    whyItMightWork: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inspirationTweets, userContent, contentType } = body;

    if (!inspirationTweets || !Array.isArray(inspirationTweets) || inspirationTweets.length === 0) {
      return NextResponse.json(
        { error: 'At least one inspiration tweet is required' },
        { status: 400 }
      );
    }

    if (!userContent || typeof userContent !== 'string' || userContent.trim().length < 20) {
      return NextResponse.json(
        { error: 'User content must be at least 20 characters' },
        { status: 400 }
      );
    }

    const validTypes = ['stories', 'builds', 'takes', 'reflections'];
    if (!contentType || !validTypes.includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    // Get API key from header or env
    const apiKey = request.headers.get('x-grok-api-key') || process.env.XAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Grok API key not configured' },
        { status: 503 }
      );
    }

    // Format inspiration tweets
    const formattedInspiration: InspirationTweet[] = inspirationTweets.map((tweet: any) => ({
      text: tweet.text || tweet.tweet?.text || '',
      author: tweet.author || tweet.tweet?.author || 'Unknown',
      handle: tweet.handle || tweet.tweet?.handle || 'unknown',
      analysis: tweet.analysis || tweet.grokAnalysis || tweet.claudeAnalysis,
    }));

    // Generate the remix prompt
    const prompt = getABHRemixPrompt(formattedInspiration, userContent, contentType);

    console.log(`[Remix] Generating remixes from ${formattedInspiration.length} inspiration tweet(s)`);
    console.log(`[Remix] Content type: ${contentType}`);
    console.log(`[Remix] User content length: ${userContent.length} chars`);

    // Call xAI - no search needed, this is generation
    const result = await callXAI({
      prompt,
      apiKey,
      searchDays: 0,
      includeWebSearch: false,
      includeXSearch: false,
    });

    if (!result.success) {
      console.error('[Remix] xAI error:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to generate remixes' },
        { status: 500 }
      );
    }

    // Extract JSON from response
    const remixData = extractJSON<RemixResponse>(result.content);

    if (!remixData || !remixData.remixes) {
      console.error('[Remix] Could not parse JSON from response');
      return NextResponse.json({
        success: false,
        error: 'Could not parse remix response',
        rawContent: result.content,
      });
    }

    console.log(`[Remix] Generated ${remixData.remixes.length} remix options`);

    return NextResponse.json({
      success: true,
      ...remixData,
      usage: result.usage,
    });
  } catch (error: any) {
    console.error('[Remix] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate remixes' },
      { status: 500 }
    );
  }
}

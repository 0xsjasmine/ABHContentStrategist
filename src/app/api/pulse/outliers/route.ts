import { NextRequest, NextResponse } from 'next/server';
import { callXAI, extractJSON } from '@/lib/xai';
import { getABHOutliersScanPrompt } from '@/prompts/abh-outliers-scan';

// Outlier tweet analysis types for a SINGLE account
export interface TweetMetrics {
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  views?: number;
}

export interface OutlierTweet {
  tweet: {
    text: string;
    url: string;
    postedAt: string;
    metrics: TweetMetrics;
    outperformanceMultiple?: number;
  };
  analysis: {
    topicScore: number;
    storytellingScore: number;
    topicBreakdown: {
      score: number;
      explanation: string;
      trendRiding: boolean;
      culturalMoment?: string;
      timingDependence: 'high' | 'medium' | 'low';
    };
    storytellingBreakdown: {
      score: number;
      explanation: string;
      hookStrength?: string;
      structureNotes?: string;
      authenticityFactor?: string;
      uniqueAngle?: string;
    };
    whatStoodOut: string;
    whyItWorked: string;
    theLesson: string;
    abhRelevance: {
      pillar: 'friendships' | 'ai' | 'ambition' | 'twenties';
      score: number;
      angle: string;
    };
  };
}

export interface OutliersResponse {
  scannedAt: string;
  handle: string;
  displayName?: string;
  followerCount?: number;
  avgEngagement?: {
    likes: number;
    retweets: number;
  };
  outliers: OutlierTweet[];
  accountSummary?: {
    contentStyle: string;
    strengthAreas: string[];
    topicVsStorytelling: {
      leansTopic: boolean;
      leansStorytelling: boolean;
      insight: string;
    };
    lessonsForABH: string[];
  };
  noOutliersFound: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { handle } = body;

    if (!handle || typeof handle !== 'string') {
      return NextResponse.json(
        { error: 'handle is required (single account)' },
        { status: 400 }
      );
    }

    // Clean handle
    const cleanHandle = handle.replace('@', '').toLowerCase().trim();

    if (!cleanHandle) {
      return NextResponse.json(
        { error: 'Invalid handle provided' },
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

    // Generate the outliers analysis prompt for single account
    const prompt = getABHOutliersScanPrompt(cleanHandle);

    console.log(`[Outliers] Analyzing @${cleanHandle} for outliers (30-day lookback)`);

    // Call xAI with 30-day lookback for outliers
    const result = await callXAI({
      prompt,
      apiKey,
      searchDays: 30,
      includeWebSearch: false, // Don't need web search for single account
      includeXSearch: true,
    });

    if (!result.success) {
      console.error('[Outliers] xAI error:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to analyze outliers' },
        { status: 500 }
      );
    }

    // Extract JSON from response
    const outliersData = extractJSON<OutliersResponse>(result.content);

    if (!outliersData) {
      console.error('[Outliers] Could not parse JSON from response');
      return NextResponse.json({
        success: false,
        error: 'Could not parse outliers response',
        rawContent: result.content,
      });
    }

    console.log(`[Outliers] Found ${outliersData.outliers?.length || 0} outlier tweets for @${cleanHandle}`);

    return NextResponse.json({
      success: true,
      handle: cleanHandle,
      displayName: outliersData.displayName,
      followerCount: outliersData.followerCount,
      avgEngagement: outliersData.avgEngagement,
      outliers: outliersData.outliers || [],
      accountSummary: outliersData.accountSummary,
      noOutliersFound: outliersData.noOutliersFound || false,
      rawContent: result.content,
      citations: result.citations,
      usage: result.usage,
      scannedAt: outliersData.scannedAt || new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Outliers] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze outliers' },
      { status: 500 }
    );
  }
}

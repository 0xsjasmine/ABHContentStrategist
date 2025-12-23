import { NextRequest, NextResponse } from 'next/server';
import { callXAI, extractJSON } from '@/lib/xai';
import { getABHTopicsScanPrompt } from '@/prompts/abh-topics-scan';

// Topic types
export interface TopicForecast {
  prediction: 'peak' | 'grow' | 'stable' | 'fade' | 'dead';
  heatLevel: number;
  reasoning: string;
}

export interface TrendingTopic {
  keyword: string;
  displayName: string;
  currentHeat: number;
  topicType: 'buzz' | 'rising' | 'evergreen';
  category: string;
  description: string;
  whyTrending: string;
  forecast: {
    sevenDays: TopicForecast;
    thirtyDays: TopicForecast;
    threeMonths: TopicForecast;
  };
  abhAngle: {
    relevance: number;
    pillar: 'friendships' | 'ai' | 'ambition' | 'twenties';
    suggestedTake: string;
    contentIdea: string;
  };
  relatedKeywords: string[];
  riskLevel: 'safe' | 'moderate' | 'risky';
  riskNote?: string;
}

export interface TopicsResponse {
  scannedAt: string;
  topics: TrendingTopic[];
  heatmapSummary: {
    hottestTopic: string;
    risingStars: string[];
    evergreenGold: string[];
    fadingFast: string[];
    abhSweetSpot: string;
  };
  weeklyForecast: {
    biggestOpportunity: string;
    avoidThis: string;
    watchList: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
    // Get API key from header or env
    const apiKey = request.headers.get('x-grok-api-key') || process.env.XAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Grok API key not configured' },
        { status: 503 }
      );
    }

    // Generate the topics scan prompt
    const prompt = getABHTopicsScanPrompt();

    console.log('[Topics] Scanning for trending topics and buzzwords');

    // Call xAI with 7-day lookback (current trends)
    const result = await callXAI({
      prompt,
      apiKey,
      searchDays: 7,
      includeWebSearch: true,
      includeXSearch: true,
    });

    if (!result.success) {
      console.error('[Topics] xAI error:', result.error);
      return NextResponse.json(
        { error: result.error || 'Failed to scan topics' },
        { status: 500 }
      );
    }

    // Extract JSON from response
    const topicsData = extractJSON<TopicsResponse>(result.content);

    if (!topicsData) {
      console.error('[Topics] Could not parse JSON from response');
      return NextResponse.json({
        success: false,
        error: 'Could not parse topics response',
        rawContent: result.content,
      });
    }

    console.log(`[Topics] Found ${topicsData.topics?.length || 0} trending topics`);

    return NextResponse.json({
      success: true,
      topics: topicsData.topics || [],
      heatmapSummary: topicsData.heatmapSummary,
      weeklyForecast: topicsData.weeklyForecast,
      rawContent: result.content,
      citations: result.citations,
      usage: result.usage,
      scannedAt: topicsData.scannedAt || new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Topics] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to scan topics' },
      { status: 500 }
    );
  }
}

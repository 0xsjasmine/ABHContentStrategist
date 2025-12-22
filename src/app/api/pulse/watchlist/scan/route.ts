/**
 * ABH Watchlist Scan API
 *
 * POST /api/pulse/watchlist/scan
 *
 * Scans X/Twitter for recent activity from watchlist accounts
 * and returns ABH-scored insights for community building
 */

import { NextRequest, NextResponse } from 'next/server';
import { callXAI, extractJSON } from '@/lib/xai';
import { getABHWatchlistScanPrompt } from '@/prompts/abh-watchlist-scan';

// Types for the scan response
interface ABHScore {
  ambition: number;
  community: number;
  growth: number;
  realness: number;
  twenties: number;
  composite: number;
}

interface KeyPost {
  handle: string;
  postText?: string;
  postSummary: string;
  tweetUrl?: string;
  engagement: 'high' | 'medium' | 'low';
  likes?: number;
  retweets?: number;
}

interface EngagementOpportunity {
  type: 'reply' | 'quote_tweet' | 'thread' | 'save';
  suggestedAngle: string;
  urgency: 'high' | 'medium' | 'low';
}

interface Insight {
  headline: string;
  subtitle: string;
  category: 'Ambition' | 'Community' | 'Growth' | 'Realness' | 'Twenties';
  urgency: 'high' | 'medium' | 'low';
  summary: string;
  abhScore: ABHScore;
  involvedAccounts: string[];
  keyPosts: KeyPost[];
  whyThisMattersForABH: string;
  keyInsight: string;
  whatToWatchFor?: string;
  engagementOpportunity: EngagementOpportunity;
  relatedTopics: string[];
}

interface ScanResponse {
  scannedAt: string;
  accountsScanned: number;
  insights: Insight[];
  whatThisMeansForABH: {
    topOpportunity: {
      headline: string;
      whyNow: string;
      suggestedAction: string;
      urgency: 'high' | 'medium' | 'low';
    } | null;
    emergingThemes: string[];
    engagementOpportunities: {
      handle: string;
      name?: string;
      reason: string;
      angle: string;
    }[];
    contentIdeas: string[];
    summary?: string;
  };
  quietAccounts: string[];
  overallPulse: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { handles } = body;

    // Validate input
    if (!handles || !Array.isArray(handles) || handles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'handles array is required' },
        { status: 400 }
      );
    }

    // Get API key from header or env
    const apiKey = request.headers.get('x-grok-api-key') || process.env.XAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'XAI_API_KEY not configured. Add it in Settings or .env' },
        { status: 401 }
      );
    }

    // Clean handles (remove @ and lowercase)
    const cleanHandles = handles
      .map((h: string) => h.replace('@', '').toLowerCase().trim())
      .filter(Boolean);

    console.log(`[Watchlist Scan] Scanning ${cleanHandles.length} accounts: ${cleanHandles.join(', ')}`);

    // Generate the prompt
    const prompt = getABHWatchlistScanPrompt(cleanHandles);

    // Call xAI with the correct endpoint
    const response = await callXAI({
      prompt,
      apiKey,
      searchDays: 7,
      includeWebSearch: true,
      includeXSearch: true,
    });

    if (!response.success) {
      console.error('[Watchlist Scan] xAI error:', response.error);
      return NextResponse.json(
        { success: false, error: response.error },
        { status: 500 }
      );
    }

    console.log(`[Watchlist Scan] Got response (${response.content.length} chars)`);

    // Try to parse JSON from response
    const parsedInsights = extractJSON<ScanResponse>(response.content);

    const scannedAt = new Date().toISOString();

    // Return the response
    return NextResponse.json({
      success: true,
      accountsScanned: cleanHandles.length,
      handles: cleanHandles,
      insights: parsedInsights,
      rawContent: response.content,
      citations: response.citations,
      usage: response.usage,
      scannedAt,
    });

  } catch (error: any) {
    console.error('[Watchlist Scan] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to check status
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/pulse/watchlist/scan',
    method: 'POST',
    description: 'Scan watchlist accounts for ABH-relevant insights',
    requiredBody: {
      handles: ['array of Twitter handles to scan'],
    },
    requiredHeaders: {
      'x-grok-api-key': 'Your xAI API key (or set XAI_API_KEY in env)',
    },
  });
}

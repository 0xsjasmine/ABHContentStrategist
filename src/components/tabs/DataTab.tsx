'use client';

import { useState } from 'react';
import {
  TrendingUp,
  RefreshCw,
  Clock,
  Zap,
  Users,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { Button, Card, Badge } from '@/components/ui';

// Placeholder data structure for daily brief
interface MockTrend {
  topic: string;
  mentions: string;
  context: string;
  sentiment: 'excited' | 'concerned' | 'mixed';
  urgency: 'high' | 'medium' | 'low';
  topPosts: { author: string; text: string; engagement: string }[];
  opportunity: string;
}

const MOCK_TRENDS: MockTrend[] = [
  {
    topic: 'AI agents',
    mentions: '23K',
    context: 'OpenAI rumored to launch autonomous agent platform',
    sentiment: 'excited',
    urgency: 'high',
    topPosts: [
      {
        author: '@sama',
        text: 'AI agents will handle entire workflows end-to-end, humans focus on judgment',
        engagement: '80K likes',
      },
    ],
    opportunity: 'Your "scale the scalable" angle is missing from this conversation',
  },
  {
    topic: 'Burnout culture',
    mentions: '8K',
    context: 'Viral thread from founder about quitting $500K job for mental health',
    sentiment: 'mixed',
    urgency: 'medium',
    topPosts: [
      {
        author: '@founder',
        text: 'I quit my $500K job because no salary is worth your mental health',
        engagement: '45K likes',
      },
    ],
    opportunity: 'Your "seasons" content perfectly addresses this - building seasons vs rest seasons',
  },
  {
    topic: '2025 predictions',
    mentions: '12K',
    context: 'End-of-year forecasting season, lots of bold takes',
    sentiment: 'excited',
    urgency: 'low',
    topPosts: [
      {
        author: '@paulg',
        text: '2025 will be the year of the solo founder',
        engagement: '30K likes',
      },
    ],
    opportunity: 'Your AI + human thesis could be positioned as a 2025 prediction',
  },
];

interface MockPerson {
  handle: string;
  context: string;
  trending: string;
  engagement: string;
  relevance: string;
}

const MOCK_PEOPLE: MockPerson[] = [
  {
    handle: '@elonmusk',
    context: 'Tech CEO, 180M+ followers',
    trending: '"AI will create abundance, work becomes optional"',
    engagement: '150K+ likes',
    relevance: 'Connects to your "human as luxury" thesis',
  },
  {
    handle: '@alix_earle',
    context: 'Creator, 6M followers',
    trending: 'Vulnerable post about ending relationship for business',
    engagement: '200K likes',
    relevance: 'Your "seasons & trade-offs" content is a perfect response',
  },
];

export default function DataTab() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated] = useState(new Date().toLocaleTimeString());

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">
            Daily Cultural Brief
          </h2>
          <p className="text-sm text-neutral-500 mt-1 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Last updated: {lastUpdated}
          </p>
        </div>
        <Button onClick={handleRefresh} loading={isRefreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Brief
        </Button>
      </div>

      {/* API Setup Notice */}
      <Card className="bg-amber-50 border-amber-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-amber-900">Grok API Not Connected</h3>
            <p className="text-sm text-amber-700 mt-1">
              To get real-time trends and cultural intelligence, add your Grok API key in Settings.
              The data below is placeholder content to show the interface.
            </p>
          </div>
        </div>
      </Card>

      {/* Trending Topics */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5" />
          Trending Topics
        </h3>
        <div className="space-y-4">
          {MOCK_TRENDS.map((trend, index) => (
            <Card key={index}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-neutral-900">
                      &ldquo;{trend.topic}&rdquo;
                    </h4>
                    <Badge
                      variant={
                        trend.urgency === 'high'
                          ? 'danger'
                          : trend.urgency === 'medium'
                          ? 'warning'
                          : 'default'
                      }
                    >
                      {trend.urgency.toUpperCase()}
                    </Badge>
                    <span className="text-sm text-neutral-500">
                      {trend.mentions} mentions
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600 mb-3">
                    <strong>WHY:</strong> {trend.context}
                  </p>

                  {/* Top Posts */}
                  <div className="bg-neutral-50 rounded-lg p-3 mb-3">
                    {trend.topPosts.map((post, i) => (
                      <div key={i} className="text-sm">
                        <span className="font-medium text-neutral-900">
                          {post.author}:
                        </span>{' '}
                        <span className="text-neutral-600">&ldquo;{post.text}&rdquo;</span>
                        <span className="text-neutral-400 ml-2">({post.engagement})</span>
                      </div>
                    ))}
                  </div>

                  {/* Opportunity */}
                  <div className="flex items-start gap-2 bg-green-50 rounded-lg p-3 border border-green-100">
                    <Zap className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-green-800">
                      <strong>YOUR OPPORTUNITY:</strong> {trend.opportunity}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Trending People */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2 mb-4">
          <Users className="w-5 h-5" />
          Who&apos;s Hot Today
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MOCK_PEOPLE.map((person, index) => (
            <Card key={index}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-neutral-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-neutral-900">{person.handle}</h4>
                  <p className="text-xs text-neutral-500">{person.context}</p>
                </div>
              </div>
              <p className="text-sm text-neutral-600 mb-2">
                <strong>TRENDING:</strong> {person.trending}
              </p>
              <p className="text-xs text-neutral-500 mb-2">
                Engagement: {person.engagement}
              </p>
              <div className="bg-blue-50 rounded-lg p-2 border border-blue-100">
                <p className="text-sm text-blue-800">{person.relevance}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Diary Matches */}
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5" />
          Diary → Trend Matches
        </h3>
        <Card className="text-center py-8 text-neutral-500">
          <p>No diary entries to match yet</p>
          <p className="text-sm mt-1">
            Write diary entries to see how they connect to current trends
          </p>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { TrendingUp, Zap, Users, RefreshCw } from 'lucide-react';

interface Trend {
  topic: string;
  mentions: string;
  context: string;
  urgency: 'high' | 'medium' | 'low';
  opportunity: string;
}

const MOCK_TRENDS: Trend[] = [
  {
    topic: 'AI agents',
    mentions: '23K',
    context: 'Autonomous workflows trending',
    urgency: 'high',
    opportunity: 'Your "scale the scalable" angle',
  },
  {
    topic: 'Burnout',
    mentions: '8K',
    context: 'Founder mental health viral',
    urgency: 'medium',
    opportunity: 'Your seasons content fits',
  },
  {
    topic: '2025 predictions',
    mentions: '12K',
    context: 'Year-end forecasting',
    urgency: 'low',
    opportunity: 'Human-AI thesis as prediction',
  },
];

const MOCK_PEOPLE = [
  { handle: '@elonmusk', context: 'AI abundance tweet', relevance: 'Counter with human luxury' },
  { handle: '@alix_earle', context: 'Vulnerable relationship post', relevance: 'Seasons & trade-offs' },
];

export default function DataTab() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsRefreshing(false);
  };

  return (
    <div className="relative min-h-[80vh]">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-light text-[#2D2A26] mb-1">Trends</h1>
          <p className="text-sm text-[#9C958E] font-light">What&apos;s culturally relevant now</p>
        </div>
        <button
          onClick={handleRefresh}
          className="p-3 glass-subtle rounded-2xl hover:bg-white/60 transition-all"
        >
          <RefreshCw className={`w-5 h-5 text-[#6B6560] ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* API Notice */}
      <div className="glass-subtle rounded-2xl p-4 mb-8 border-l-2 border-[#C4A484]">
        <p className="text-sm text-[#6B6560] font-light">
          Connect Grok API in settings for real-time trends
        </p>
      </div>

      {/* Trending Topics */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[#C4A484]" />
          <h2 className="text-lg font-light text-[#2D2A26]">Trending</h2>
        </div>

        <div className="space-y-3">
          {MOCK_TRENDS.map((trend, i) => (
            <div key={i} className="glass-subtle hover-lift rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-light text-[#2D2A26]">{trend.topic}</span>
                  <span className="text-xs text-[#9C958E]">{trend.mentions}</span>
                </div>
                <span className={`pill ${
                  trend.urgency === 'high' ? 'bg-red-100 text-red-700' :
                  trend.urgency === 'medium' ? 'pill-warm' : 'pill-sage'
                }`}>
                  {trend.urgency}
                </span>
              </div>
              <p className="text-sm text-[#6B6560] font-light mb-2">{trend.context}</p>
              <div className="flex items-center gap-2 pt-2 border-t border-white/20">
                <Zap className="w-4 h-4 text-[#B8C4B8]" />
                <p className="text-sm text-[#6B6560] font-light">{trend.opportunity}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hot Accounts */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-[#C4A484]" />
          <h2 className="text-lg font-light text-[#2D2A26]">Who&apos;s hot</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {MOCK_PEOPLE.map((person, i) => (
            <div key={i} className="glass-subtle hover-lift rounded-2xl p-4">
              <p className="font-light text-[#2D2A26] mb-1">{person.handle}</p>
              <p className="text-sm text-[#9C958E] font-light mb-2">{person.context}</p>
              <p className="text-xs text-[#B8C4B8] font-light">{person.relevance}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import InsightCard from './InsightCard';
import WatchlistManager from './WatchlistManager';
import type { WatchlistAccount, PulseInsight } from '@/lib/supabase';
import type { ABHCategory, ABHScore, KeyPost, EngagementOpportunity } from '@/types/database';

// Icons
const RadarIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const FilterIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const categoryFilters: { value: ABHCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'ambition', label: 'Ambition' },
  { value: 'community', label: 'Community' },
  { value: 'growth', label: 'Growth' },
  { value: 'realness', label: 'Realness' },
  { value: 'twenties', label: 'Twenties' },
];

interface PulseTabProps {
  // Props can be added for server-side data if needed
}

export default function PulseTab({}: PulseTabProps) {
  const [accounts, setAccounts] = useState<WatchlistAccount[]>([]);
  const [insights, setInsights] = useState<PulseInsight[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ABHCategory | 'all'>('all');
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch watchlist accounts
  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/pulse/watchlist');
      if (!res.ok) throw new Error('Failed to fetch accounts');
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError('Failed to load watchlist');
    } finally {
      setIsLoadingAccounts(false);
    }
  }, []);

  // Fetch insights
  const fetchInsights = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.set('category', selectedCategory);
      }
      const res = await fetch(`/api/pulse/insights?${params}`);
      if (!res.ok) throw new Error('Failed to fetch insights');
      const data = await res.json();
      setInsights(data.insights || []);
    } catch (err) {
      console.error('Error fetching insights:', err);
    } finally {
      setIsLoadingInsights(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // Add account to watchlist
  const handleAddAccount = async (account: Omit<WatchlistAccount, 'id' | 'added_at' | 'last_scanned_at'>) => {
    const res = await fetch('/api/pulse/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(account),
    });
    if (!res.ok) throw new Error('Failed to add account');
    await fetchAccounts();
  };

  // Remove account from watchlist
  const handleRemoveAccount = async (id: string) => {
    const res = await fetch(`/api/pulse/watchlist?id=${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to remove account');
    await fetchAccounts();
  };

  // Run watchlist scan
  const handleScan = async () => {
    if (accounts.length === 0) {
      setError('Add accounts to watchlist first');
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      const handles = accounts.map(a => a.handle);
      const res = await fetch('/api/pulse/watchlist/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handles }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Scan failed');
      }

      const data = await res.json();
      setLastScan(new Date().toISOString());

      // Refresh insights after scan
      await fetchInsights();
    } catch (err) {
      console.error('Scan error:', err);
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setIsScanning(false);
    }
  };

  // Dismiss insight
  const handleDismiss = async (id: string) => {
    try {
      await fetch(`/api/pulse/insights/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'dismissed' }),
      });
      setInsights(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error('Failed to dismiss insight:', err);
    }
  };

  // Handle engagement action
  const handleEngage = async (id: string, type: string) => {
    // Mark as engaged and potentially open tweet composer
    try {
      await fetch(`/api/pulse/insights/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'engaged' }),
      });
      // Could open tweet studio or composer here
      console.log('Engage with insight:', id, type);
    } catch (err) {
      console.error('Failed to mark as engaged:', err);
    }
  };

  // Transform PulseInsight to InsightCard props
  const transformInsight = (insight: PulseInsight) => {
    const abhScore: ABHScore = {
      ambition: insight.score_ambition || 0,
      community: insight.score_community || 0,
      growth: insight.score_growth || 0,
      realness: insight.score_realness || 0,
      twenties: insight.score_twenties || 0,
      composite: insight.score_composite || 0,
    };

    const keyPosts: KeyPost[] = Array.isArray(insight.key_posts)
      ? insight.key_posts as KeyPost[]
      : [];

    const engagementOpportunity: EngagementOpportunity | undefined =
      insight.engagement_type && insight.engagement_angle
        ? {
            type: insight.engagement_type,
            suggestedAngle: insight.engagement_angle,
            urgency: insight.urgency,
          }
        : undefined;

    return {
      id: insight.id,
      headline: insight.headline,
      subtitle: insight.subtitle || undefined,
      category: insight.category || 'ambition' as ABHCategory,
      urgency: insight.urgency,
      summary: insight.summary || '',
      whyThisMatters: insight.why_this_matters || undefined,
      keyInsight: insight.key_insight || undefined,
      abhScore,
      involvedAccounts: insight.involved_accounts || [],
      keyPosts,
      relatedTopics: insight.related_topics || [],
      engagementOpportunity,
      scannedAt: insight.scanned_at,
    };
  };

  const filteredInsights = selectedCategory === 'all'
    ? insights
    : insights.filter(i => i.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--soft-pink)', color: 'var(--burgundy)' }}>
            <RadarIcon />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">PULSE</h2>
            <p className="text-sm text-gray-500">Social Listening Hub</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowWatchlist(!showWatchlist)}
            className={`p-2 rounded-lg transition-colors ${showWatchlist ? 'bg-burgundy/10 text-burgundy' : 'text-gray-500 hover:bg-gray-100'}`}
            style={showWatchlist ? { color: 'var(--burgundy)' } : undefined}
          >
            <SettingsIcon />
          </button>
          <button
            onClick={handleScan}
            disabled={isScanning || accounts.length === 0}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshIcon />
            {isScanning ? 'Scanning...' : 'Scan Now'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Watchlist Manager */}
      {showWatchlist && (
        <WatchlistManager
          accounts={accounts}
          onAddAccount={handleAddAccount}
          onRemoveAccount={handleRemoveAccount}
          isLoading={isLoadingAccounts}
        />
      )}

      {/* Category Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <FilterIcon />
        {categoryFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setSelectedCategory(filter.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === filter.value
                ? 'text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={selectedCategory === filter.value ? { backgroundColor: 'var(--burgundy)' } : undefined}
          >
            {filter.label}
          </button>
        ))}
        {lastScan && (
          <span className="ml-auto text-sm text-gray-400">
            Last scan: {new Date(lastScan).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Insights Grid */}
      {isLoadingInsights ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
              <div className="h-20 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredInsights.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--soft-pink)' }}>
            <RadarIcon />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No insights yet</h3>
          <p className="text-gray-500 mb-4">
            {accounts.length === 0
              ? 'Add accounts to your watchlist to start scanning'
              : 'Run a scan to discover insights from your watchlist'
            }
          </p>
          {accounts.length === 0 ? (
            <button
              onClick={() => setShowWatchlist(true)}
              className="btn-primary"
            >
              Manage Watchlist
            </button>
          ) : (
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="btn-primary"
            >
              {isScanning ? 'Scanning...' : 'Scan Now'}
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredInsights.map((insight) => (
            <InsightCard
              key={insight.id}
              {...transformInsight(insight)}
              onDismiss={handleDismiss}
              onEngage={handleEngage}
            />
          ))}
        </div>
      )}
    </div>
  );
}

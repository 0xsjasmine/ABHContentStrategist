'use client';

import { useState, useEffect, useCallback } from 'react';
import InsightCard from './InsightCard';
import WatchlistManager from './WatchlistManager';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import type { WatchlistAccount, PulseInsight } from '@/lib/supabase';
import type { ABHCategory, ABHScore, KeyPost, EngagementOpportunity } from '@/types/database';
import { Settings, RefreshCw } from 'lucide-react';

const categoryTabs = [
  { id: 'all', label: 'All' },
  { id: 'ambition', label: 'Ambition' },
  { id: 'community', label: 'Community' },
  { id: 'growth', label: 'Growth' },
  { id: 'realness', label: 'Realness' },
  { id: 'twenties', label: 'Twenties' },
];

// Local storage keys
const WATCHLIST_KEY = 'abh_pulse_watchlist';
const INSIGHTS_KEY = 'abh_pulse_insights';

// Helper to generate IDs
const generateId = () => crypto.randomUUID();

export default function PulseTab() {
  const [accounts, setAccounts] = useState<WatchlistAccount[]>([]);
  const [insights, setInsights] = useState<PulseInsight[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load watchlist from localStorage
  const fetchAccounts = useCallback(async () => {
    try {
      // Try API first (Supabase)
      const res = await fetch('/api/pulse/watchlist');
      if (res.ok) {
        const data = await res.json();
        if (data.accounts && data.accounts.length > 0) {
          setAccounts(data.accounts);
          setIsLoadingAccounts(false);
          return;
        }
      }
    } catch (err) {
      console.log('Supabase not configured, using localStorage');
    }

    // Fallback to localStorage
    const saved = localStorage.getItem(WATCHLIST_KEY);
    if (saved) {
      try {
        setAccounts(JSON.parse(saved));
      } catch {
        setAccounts([]);
      }
    }
    setIsLoadingAccounts(false);
  }, []);

  // Load insights from localStorage
  const fetchInsights = useCallback(async () => {
    try {
      // Try API first (Supabase)
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.set('category', selectedCategory);
      }
      const res = await fetch(`/api/pulse/insights?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.insights && data.insights.length > 0) {
          setInsights(data.insights);
          setIsLoadingInsights(false);
          return;
        }
      }
    } catch (err) {
      console.log('Supabase not configured, using localStorage');
    }

    // Fallback to localStorage
    const saved = localStorage.getItem(INSIGHTS_KEY);
    if (saved) {
      try {
        const allInsights: PulseInsight[] = JSON.parse(saved);
        const filtered = selectedCategory === 'all'
          ? allInsights
          : allInsights.filter(i => i.category === selectedCategory);
        setInsights(filtered);
      } catch {
        setInsights([]);
      }
    }
    setIsLoadingInsights(false);
  }, [selectedCategory]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // Save watchlist to localStorage
  const saveAccountsToLocal = (newAccounts: WatchlistAccount[]) => {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(newAccounts));
  };

  // Save insights to localStorage
  const saveInsightsToLocal = (newInsights: PulseInsight[]) => {
    localStorage.setItem(INSIGHTS_KEY, JSON.stringify(newInsights));
  };

  // Add account to watchlist
  const handleAddAccount = async (account: Omit<WatchlistAccount, 'id' | 'added_at' | 'last_scanned_at'>) => {
    // Try API first
    try {
      const res = await fetch('/api/pulse/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
      });
      if (res.ok) {
        await fetchAccounts();
        return;
      }
    } catch {
      // Fallback to localStorage
    }

    // Save to localStorage
    const newAccount: WatchlistAccount = {
      ...account,
      id: generateId(),
      added_at: new Date().toISOString(),
      last_scanned_at: null,
    };
    const newAccounts = [...accounts, newAccount];
    setAccounts(newAccounts);
    saveAccountsToLocal(newAccounts);
  };

  // Remove account from watchlist
  const handleRemoveAccount = async (id: string) => {
    // Try API first
    try {
      const res = await fetch(`/api/pulse/watchlist?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchAccounts();
        return;
      }
    } catch {
      // Fallback to localStorage
    }

    // Remove from localStorage
    const newAccounts = accounts.filter(a => a.id !== id);
    setAccounts(newAccounts);
    saveAccountsToLocal(newAccounts);
  };

  // Run watchlist scan
  const handleScan = async () => {
    if (accounts.length === 0) {
      setShowWatchlist(true);
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

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Scan failed');
      }

      // Parse insights from response and save to localStorage
      const parsedInsights = data.insights;
      if (parsedInsights && parsedInsights.insights) {
        const newInsights: PulseInsight[] = parsedInsights.insights.map((insight: any) => ({
          id: generateId(),
          headline: insight.headline || 'New Insight',
          subtitle: insight.subtitle || null,
          category: (insight.category?.toLowerCase() || 'ambition') as PulseInsight['category'],
          urgency: insight.urgency || 'medium',
          summary: insight.summary || null,
          why_this_matters: insight.whyThisMattersForABH || null,
          key_insight: insight.keyInsight || null,
          score_ambition: insight.abhScore?.ambition || 0,
          score_community: insight.abhScore?.community || 0,
          score_growth: insight.abhScore?.growth || 0,
          score_realness: insight.abhScore?.realness || 0,
          score_twenties: insight.abhScore?.twenties || 0,
          score_composite: insight.abhScore?.composite || 0,
          key_posts: insight.keyPosts || [],
          involved_accounts: insight.involvedAccounts || [],
          related_topics: insight.relatedTopics || [],
          engagement_type: insight.engagementOpportunity?.type || null,
          engagement_angle: insight.engagementOpportunity?.suggestedAngle || null,
          scanned_at: new Date().toISOString(),
          status: 'new' as const,
          source_citations: data.citations || null,
        }));

        // Merge with existing insights
        const existingInsights = JSON.parse(localStorage.getItem(INSIGHTS_KEY) || '[]');
        const allInsights = [...newInsights, ...existingInsights];
        saveInsightsToLocal(allInsights);
        setInsights(allInsights);
      }

      // Update last scanned
      const updatedAccounts = accounts.map(a => ({
        ...a,
        last_scanned_at: new Date().toISOString(),
      }));
      setAccounts(updatedAccounts);
      saveAccountsToLocal(updatedAccounts);

    } catch (err) {
      console.error('Scan error:', err);
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setIsScanning(false);
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
      keyPosts: (insight.key_posts || []) as KeyPost[],
      relatedTopics: insight.related_topics || [],
      engagementOpportunity: insight.engagement_type && insight.engagement_angle
        ? { type: insight.engagement_type, suggestedAngle: insight.engagement_angle, urgency: insight.urgency }
        : undefined,
      scannedAt: insight.scanned_at,
    };
  };

  const filteredInsights = selectedCategory === 'all'
    ? insights
    : insights.filter(i => i.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Simple Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Pulse</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWatchlist(!showWatchlist)}
            className={`p-2 rounded-lg transition-colors ${showWatchlist ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanning...' : 'Scan'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Watchlist Modal */}
      {showWatchlist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowWatchlist(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <WatchlistManager
              accounts={accounts}
              onAddAccount={handleAddAccount}
              onRemoveAccount={handleRemoveAccount}
              isLoading={isLoadingAccounts}
            />
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => setShowWatchlist(false)}
                className="w-full btn-secondary"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Segmented Category Tabs */}
      <SegmentedTabs
        tabs={categoryTabs}
        activeTab={selectedCategory}
        onChange={setSelectedCategory}
      />

      {/* Content */}
      {isLoadingInsights ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-5 bg-gray-100 rounded w-1/3 mb-3"></div>
              <div className="h-4 bg-gray-100 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-100 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredInsights.length === 0 ? (
        <div className="text-center py-20">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No insights yet</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            {accounts.length === 0
              ? 'Add accounts to your watchlist to start discovering insights.'
              : 'Run a scan to discover what your watchlist is talking about.'
            }
          </p>
          <button
            onClick={accounts.length === 0 ? () => setShowWatchlist(true) : handleScan}
            disabled={isScanning}
            className="btn-primary"
          >
            {accounts.length === 0 ? 'Add Accounts' : isScanning ? 'Scanning...' : 'Scan Now'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInsights.map((insight) => (
            <InsightCard
              key={insight.id}
              {...transformInsight(insight)}
              onDismiss={async (id) => {
                // Try API first
                try {
                  await fetch(`/api/pulse/insights/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'dismissed' }),
                  });
                } catch {
                  // Fallback handled below
                }
                // Also remove from localStorage
                const allInsights = JSON.parse(localStorage.getItem(INSIGHTS_KEY) || '[]');
                const filtered = allInsights.filter((i: PulseInsight) => i.id !== id);
                saveInsightsToLocal(filtered);
                setInsights(prev => prev.filter(i => i.id !== id));
              }}
              onEngage={async (id) => {
                console.log('Engage with insight:', id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

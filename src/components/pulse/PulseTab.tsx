'use client';

import { useState, useEffect, useCallback } from 'react';
import InsightCard from './InsightCard';
import WatchlistManager from './WatchlistManager';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import type { WatchlistAccount, PulseInsight } from '@/lib/supabase';
import type { ABHCategory, ABHScore, KeyPost, EngagementOpportunity } from '@/types/database';
import { Settings, RefreshCw } from 'lucide-react';

const filterTabs = [
  { id: 'all', label: 'All' },
  { id: 'hot', label: 'Hot Now' },
  { id: 'people', label: 'People' },
  { id: 'topics', label: 'Topics' },
  { id: 'saved', label: 'Saved' },
];

// Helper to get date group label
function getDateGroup(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  if (date >= today) return 'Today';
  if (date >= yesterday) return 'Yesterday';
  if (date >= lastWeek) return 'This Week';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Group insights by date
function groupInsightsByDate<T extends { scanned_at: string }>(insights: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  insights.forEach(insight => {
    const group = getDateGroup(insight.scanned_at);
    if (!groups.has(group)) {
      groups.set(group, []);
    }
    groups.get(group)!.push(insight);
  });

  return groups;
}

// Local storage keys
const WATCHLIST_KEY = 'abh_pulse_watchlist';
const INSIGHTS_KEY = 'abh_pulse_insights';
const SAVED_KEY = 'abh_pulse_saved';

// Helper to generate IDs
const generateId = () => crypto.randomUUID();

export default function PulseTab() {
  const [accounts, setAccounts] = useState<WatchlistAccount[]>([]);
  const [insights, setInsights] = useState<PulseInsight[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedInsightIds, setSavedInsightIds] = useState<Set<string>>(new Set());

  // Load saved insight IDs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(SAVED_KEY);
    if (saved) {
      try {
        setSavedInsightIds(new Set(JSON.parse(saved)));
      } catch {
        setSavedInsightIds(new Set());
      }
    }
  }, []);

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
      const res = await fetch('/api/pulse/insights');
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
        setInsights(allInsights);
      } catch {
        setInsights([]);
      }
    }
    setIsLoadingInsights(false);
  }, []);

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
          category: (insight.category?.toLowerCase() || 'friendships') as PulseInsight['category'],
          urgency: insight.urgency || 'medium',
          summary: insight.summary || null,
          why_this_matters: insight.whyThisMattersForABH || null,
          key_insight: insight.keyInsight || null,
          score_friendships: insight.abhScore?.friendships || 0,
          score_ai: insight.abhScore?.ai || 0,
          score_ambition: insight.abhScore?.ambition || 0,
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
      friendships: insight.score_friendships || 0,
      ai: insight.score_ai || 0,
      ambition: insight.score_ambition || 0,
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

  // Save/unsave insight
  const toggleSaveInsight = (id: string) => {
    const newSaved = new Set(savedInsightIds);
    if (newSaved.has(id)) {
      newSaved.delete(id);
    } else {
      newSaved.add(id);
    }
    setSavedInsightIds(newSaved);
    localStorage.setItem(SAVED_KEY, JSON.stringify([...newSaved]));
  };

  // Filter insights based on selected tab
  const getFilteredInsights = () => {
    switch (selectedFilter) {
      case 'hot':
        // Hot = high urgency or high composite score (7+), sorted by recency
        return insights
          .filter(i => i.urgency === 'high' || (i.score_composite || 0) >= 7)
          .sort((a, b) => new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime());
      case 'people':
        // People = insights with involved accounts
        return insights.filter(i => (i.involved_accounts || []).length > 0);
      case 'topics':
        // Topics = insights with related topics
        return insights.filter(i => (i.related_topics || []).length > 0);
      case 'saved':
        // Saved = insights the user has saved
        return insights.filter(i => savedInsightIds.has(i.id));
      default:
        return insights;
    }
  };

  const filteredInsights = getFilteredInsights();
  const groupedInsights = groupInsightsByDate(filteredInsights);

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

      {/* Segmented Filter Tabs */}
      <SegmentedTabs
        tabs={filterTabs}
        activeTab={selectedFilter}
        onChange={setSelectedFilter}
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {selectedFilter === 'saved' ? 'No saved insights' : 'No insights yet'}
          </h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            {selectedFilter === 'saved'
              ? 'Save insights you want to revisit later.'
              : accounts.length === 0
              ? 'Add accounts to your watchlist to start discovering insights.'
              : 'Run a scan to discover what your watchlist is talking about.'
            }
          </p>
          {selectedFilter !== 'saved' && (
            <button
              onClick={accounts.length === 0 ? () => setShowWatchlist(true) : handleScan}
              disabled={isScanning}
              className="btn-primary"
            >
              {accounts.length === 0 ? 'Add Accounts' : isScanning ? 'Scanning...' : 'Scan Now'}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(groupedInsights.entries()).map(([dateGroup, groupInsights]) => (
            <div key={dateGroup}>
              {/* Date Group Header */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm font-semibold text-gray-900">{dateGroup}</span>
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-400">{groupInsights.length} insight{groupInsights.length !== 1 ? 's' : ''}</span>
              </div>

              {/* Insights in this group */}
              <div className="space-y-3">
                {groupInsights.map((insight) => (
                  <InsightCard
                    key={insight.id}
                    {...transformInsight(insight)}
                    isSaved={savedInsightIds.has(insight.id)}
                    onToggleSave={() => toggleSaveInsight(insight.id)}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

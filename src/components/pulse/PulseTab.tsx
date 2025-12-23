'use client';

import { useState, useEffect, useCallback } from 'react';
import InsightCard from './InsightCard';
import OutlierCard from './OutlierCard';
import TopicsHeatmap from './TopicsHeatmap';
import WatchlistManager from './WatchlistManager';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import type { WatchlistAccount, PulseInsight } from '@/lib/supabase';
import type { ABHCategory, ABHScore, KeyPost } from '@/types/database';
import type { OutlierTweet } from '@/app/api/pulse/outliers/route';
import type { TrendingTopic } from '@/app/api/pulse/topics/route';
import { Settings, RefreshCw, Sparkles, TrendingUp, ChevronDown } from 'lucide-react';

const BRAND_RED = '#C41E3A';

// New simplified tabs
const filterTabs = [
  { id: 'hot', label: '🔥 Hot Now' },
  { id: 'outliers', label: '⚡ Outliers' },
  { id: 'topics', label: '📊 Topics' },
];

// Local storage keys
const WATCHLIST_KEY = 'abh_pulse_watchlist';
const INSIGHTS_KEY = 'abh_pulse_insights';
const OUTLIERS_KEY = 'abh_pulse_outliers';
const TOPICS_KEY = 'abh_pulse_topics';

// Helper to generate IDs
const generateId = () => crypto.randomUUID();

// Helper to get date group label
function getDateGroup(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date >= today) return 'Today';
  if (date >= yesterday) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Group insights by date
function groupInsightsByDate<T extends { scanned_at: string }>(insights: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  insights.forEach(insight => {
    const group = getDateGroup(insight.scanned_at);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(insight);
  });
  return groups;
}

export default function PulseTab() {
  // Core state
  const [accounts, setAccounts] = useState<WatchlistAccount[]>([]);
  const [insights, setInsights] = useState<PulseInsight[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('hot');
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Outliers state (single account)
  const [selectedOutlierAccount, setSelectedOutlierAccount] = useState<string | null>(null);
  const [outliers, setOutliers] = useState<OutlierTweet[]>([]);
  const [outlierAccountSummary, setOutlierAccountSummary] = useState<any>(null);
  const [isLoadingOutliers, setIsLoadingOutliers] = useState(false);
  const [outliersLastScanned, setOutliersLastScanned] = useState<string | null>(null);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  // Topics state
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [topicsSummary, setTopicsSummary] = useState<any>(null);
  const [topicsForecast, setTopicsForecast] = useState<any>(null);
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [topicsLastScanned, setTopicsLastScanned] = useState<string | null>(null);

  // Load watchlist
  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/pulse/watchlist');
      if (res.ok) {
        const data = await res.json();
        if (data.accounts && data.accounts.length > 0) {
          setAccounts(data.accounts);
          setIsLoadingAccounts(false);
          return;
        }
      }
    } catch {
      console.log('Supabase not configured, using localStorage');
    }

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

  // Load insights (for Hot Now)
  const fetchInsights = useCallback(async () => {
    try {
      const res = await fetch('/api/pulse/insights');
      if (res.ok) {
        const data = await res.json();
        if (data.insights && data.insights.length > 0) {
          setInsights(data.insights);
          setIsLoadingInsights(false);
          return;
        }
      }
    } catch {
      console.log('Supabase not configured, using localStorage');
    }

    const saved = localStorage.getItem(INSIGHTS_KEY);
    if (saved) {
      try {
        setInsights(JSON.parse(saved));
      } catch {
        setInsights([]);
      }
    }
    setIsLoadingInsights(false);
  }, []);

  // Load outliers from localStorage
  const loadOutliers = useCallback(() => {
    const saved = localStorage.getItem(OUTLIERS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setOutliers(parsed.outliers || []);
        setOutlierAccountSummary(parsed.accountSummary || null);
        setOutliersLastScanned(parsed.scannedAt || null);
        setSelectedOutlierAccount(parsed.handle || null);
      } catch {
        setOutliers([]);
      }
    }
  }, []);

  // Load topics from localStorage
  const loadTopics = useCallback(() => {
    const saved = localStorage.getItem(TOPICS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTopics(parsed.topics || []);
        setTopicsSummary(parsed.heatmapSummary || null);
        setTopicsForecast(parsed.weeklyForecast || null);
        setTopicsLastScanned(parsed.scannedAt || null);
      } catch {
        setTopics([]);
      }
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);
  useEffect(() => { fetchInsights(); }, [fetchInsights]);
  useEffect(() => { loadOutliers(); }, [loadOutliers]);
  useEffect(() => { loadTopics(); }, [loadTopics]);

  // Save helpers
  const saveAccountsToLocal = (newAccounts: WatchlistAccount[]) => {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(newAccounts));
  };

  const saveInsightsToLocal = (newInsights: PulseInsight[]) => {
    localStorage.setItem(INSIGHTS_KEY, JSON.stringify(newInsights));
  };

  // Add/remove account handlers
  const handleAddAccount = async (account: Omit<WatchlistAccount, 'id' | 'added_at' | 'last_scanned_at'>) => {
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
    } catch {}

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

  const handleRemoveAccount = async (id: string) => {
    try {
      const res = await fetch(`/api/pulse/watchlist?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchAccounts();
        return;
      }
    } catch {}

    const newAccounts = accounts.filter(a => a.id !== id);
    setAccounts(newAccounts);
    saveAccountsToLocal(newAccounts);
  };

  // HOT NOW: Scan all watchlist accounts
  const handleScanHotNow = async () => {
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
      if (!res.ok || !data.success) throw new Error(data.error || 'Scan failed');

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

        const existingInsights = JSON.parse(localStorage.getItem(INSIGHTS_KEY) || '[]');
        const allInsights = [...newInsights, ...existingInsights];
        saveInsightsToLocal(allInsights);
        setInsights(allInsights);
      }

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

  // OUTLIERS: Scan single selected account
  const handleScanOutliers = async () => {
    if (!selectedOutlierAccount) return;

    setIsLoadingOutliers(true);
    setError(null);

    try {
      const res = await fetch('/api/pulse/outliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: selectedOutlierAccount }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Outliers analysis failed');

      setOutliers(data.outliers || []);
      setOutlierAccountSummary(data.accountSummary || null);
      setOutliersLastScanned(data.scannedAt || new Date().toISOString());

      localStorage.setItem(OUTLIERS_KEY, JSON.stringify({
        handle: selectedOutlierAccount,
        outliers: data.outliers || [],
        accountSummary: data.accountSummary || null,
        scannedAt: data.scannedAt || new Date().toISOString(),
      }));

    } catch (err) {
      console.error('Outliers error:', err);
      setError(err instanceof Error ? err.message : 'Outliers analysis failed');
    } finally {
      setIsLoadingOutliers(false);
    }
  };

  // TOPICS: Scan trending topics
  const handleScanTopics = async () => {
    setIsLoadingTopics(true);
    setError(null);

    try {
      const res = await fetch('/api/pulse/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Topics scan failed');

      setTopics(data.topics || []);
      setTopicsSummary(data.heatmapSummary || null);
      setTopicsForecast(data.weeklyForecast || null);
      setTopicsLastScanned(data.scannedAt || new Date().toISOString());

      localStorage.setItem(TOPICS_KEY, JSON.stringify({
        topics: data.topics || [],
        heatmapSummary: data.heatmapSummary || null,
        weeklyForecast: data.weeklyForecast || null,
        scannedAt: data.scannedAt || new Date().toISOString(),
      }));

    } catch (err) {
      console.error('Topics error:', err);
      setError(err instanceof Error ? err.message : 'Topics scan failed');
    } finally {
      setIsLoadingTopics(false);
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

  // Filter to high-relevance insights for Hot Now
  const hotInsights = insights
    .filter(i => i.urgency === 'high' || (i.score_composite || 0) >= 6)
    .sort((a, b) => new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime());

  const groupedInsights = groupInsightsByDate(hotInsights);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Pulse</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWatchlist(!showWatchlist)}
            className={`p-2 rounded-lg transition-colors ${showWatchlist ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>

          {/* Dynamic action button based on tab */}
          {selectedFilter === 'hot' && (
            <button
              onClick={handleScanHotNow}
              disabled={isScanning}
              className="btn-primary flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Scanning...' : 'Scan Watchlist'}
            </button>
          )}
          {selectedFilter === 'outliers' && selectedOutlierAccount && (
            <button
              onClick={handleScanOutliers}
              disabled={isLoadingOutliers}
              className="btn-primary flex items-center gap-2"
            >
              <Sparkles className={`w-4 h-4 ${isLoadingOutliers ? 'animate-pulse' : ''}`} />
              {isLoadingOutliers ? 'Analyzing...' : 'Find Outliers'}
            </button>
          )}
          {selectedFilter === 'topics' && (
            <button
              onClick={handleScanTopics}
              disabled={isLoadingTopics}
              className="btn-primary flex items-center gap-2"
            >
              <TrendingUp className={`w-4 h-4 ${isLoadingTopics ? 'animate-pulse' : ''}`} />
              {isLoadingTopics ? 'Scanning...' : 'Scan Topics'}
            </button>
          )}
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
              <button onClick={() => setShowWatchlist(false)} className="w-full btn-secondary">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <SegmentedTabs
        tabs={filterTabs}
        activeTab={selectedFilter}
        onChange={setSelectedFilter}
      />

      {/* ============ HOT NOW TAB ============ */}
      {selectedFilter === 'hot' && (
        isLoadingInsights ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                <div className="h-5 bg-gray-100 rounded w-1/3 mb-3"></div>
                <div className="h-4 bg-gray-100 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : hotInsights.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hot insights yet</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              {accounts.length === 0
                ? 'Add accounts to your watchlist to start discovering insights.'
                : 'Run a scan to discover what your watchlist is talking about.'}
            </p>
            <button
              onClick={accounts.length === 0 ? () => setShowWatchlist(true) : handleScanHotNow}
              disabled={isScanning}
              className="btn-primary"
            >
              {accounts.length === 0 ? 'Add Accounts' : isScanning ? 'Scanning...' : 'Scan Now'}
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {Array.from(groupedInsights.entries()).map(([dateGroup, groupInsights]) => (
              <div key={dateGroup}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-sm font-semibold text-gray-900">{dateGroup}</span>
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-xs text-gray-400">{groupInsights.length} insight{groupInsights.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupInsights.map((insight) => (
                    <InsightCard
                      key={insight.id}
                      {...transformInsight(insight)}
                      onDismiss={async (id) => {
                        try {
                          await fetch(`/api/pulse/insights/${id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'dismissed' }),
                          });
                        } catch {}
                        const allInsights = JSON.parse(localStorage.getItem(INSIGHTS_KEY) || '[]');
                        const filtered = allInsights.filter((i: PulseInsight) => i.id !== id);
                        saveInsightsToLocal(filtered);
                        setInsights(prev => prev.filter(i => i.id !== id));
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* ============ OUTLIERS TAB ============ */}
      {selectedFilter === 'outliers' && (
        <div className="space-y-6">
          {/* Account Selector */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select an account to analyze
            </label>
            <button
              onClick={() => setShowAccountDropdown(!showAccountDropdown)}
              className="w-full md:w-80 flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl hover:border-gray-300 transition-colors"
            >
              <span className={selectedOutlierAccount ? 'text-gray-900' : 'text-gray-400'}>
                {selectedOutlierAccount ? `@${selectedOutlierAccount}` : 'Choose from watchlist...'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {showAccountDropdown && (
              <div className="absolute z-10 w-full md:w-80 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {accounts.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 text-center">
                    No accounts in watchlist.{' '}
                    <button
                      onClick={() => {
                        setShowAccountDropdown(false);
                        setShowWatchlist(true);
                      }}
                      className="text-red-600 hover:underline"
                    >
                      Add some
                    </button>
                  </div>
                ) : (
                  accounts.map((account) => (
                    <button
                      key={account.id}
                      onClick={() => {
                        setSelectedOutlierAccount(account.handle);
                        setShowAccountDropdown(false);
                        // Clear previous outliers when switching accounts
                        setOutliers([]);
                        setOutlierAccountSummary(null);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                        selectedOutlierAccount === account.handle ? 'bg-red-50' : ''
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                        style={{ backgroundColor: BRAND_RED }}
                      >
                        {account.handle.charAt(0).toUpperCase()}
                      </div>
                      <div className="text-left">
                        <span className="text-sm font-medium text-gray-900">@{account.handle}</span>
                        {account.display_name && (
                          <span className="text-xs text-gray-500 block">{account.display_name}</span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Outliers Content */}
          {!selectedOutlierAccount ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Find Someone's Bangers</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Select an account from your watchlist to discover their top-performing tweets
                from the last 30 days and learn <strong>why they worked</strong>.
              </p>
            </div>
          ) : isLoadingOutliers ? (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                <div className="h-5 bg-gray-100 rounded w-1/3 mb-3"></div>
                <div className="h-4 bg-gray-100 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-100 rounded w-2/3"></div>
              </div>
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">Analyzing @{selectedOutlierAccount}'s top tweets...</p>
                <p className="text-xs text-gray-400 mt-1">This may take a moment</p>
              </div>
            </div>
          ) : outliers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                Click "Find Outliers" to analyze @{selectedOutlierAccount}'s top-performing tweets.
              </p>
              {outliersLastScanned && (
                <p className="text-xs text-gray-400">
                  Last analyzed: {new Date(outliersLastScanned).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Account Summary */}
              {outlierAccountSummary && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">@{selectedOutlierAccount}'s Style</h3>
                  <p className="text-sm text-gray-600 mb-3">{outlierAccountSummary.contentStyle}</p>

                  <div className="flex items-center gap-4 text-sm mb-3">
                    <span className={`px-2 py-1 rounded-full ${
                      outlierAccountSummary.topicVsStorytelling?.leansStorytelling
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {outlierAccountSummary.topicVsStorytelling?.leansStorytelling
                        ? '✍️ Storytelling-driven'
                        : '🌊 Topic-driven'}
                    </span>
                  </div>

                  {outlierAccountSummary.lessonsForABH?.length > 0 && (
                    <div className="mt-3 p-3 rounded-lg" style={{ backgroundColor: '#FEF2F2' }}>
                      <h4 className="text-xs font-semibold uppercase mb-2" style={{ color: BRAND_RED }}>
                        Lessons for ABH
                      </h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {outlierAccountSummary.lessonsForABH.map((lesson: string, idx: number) => (
                          <li key={idx}>• {lesson}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Outlier Cards */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {outliers.length} Outlier Tweet{outliers.length !== 1 ? 's' : ''}
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {outliers.map((outlier, idx) => (
                    <OutlierCard
                      key={idx}
                      outlier={{
                        ...outlier,
                        handle: `@${selectedOutlierAccount}`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============ TOPICS TAB ============ */}
      {selectedFilter === 'topics' && (
        isLoadingTopics ? (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-5 bg-gray-100 rounded w-1/3 mb-3"></div>
              <div className="h-4 bg-gray-100 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-100 rounded w-2/3"></div>
            </div>
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">Scanning trending topics...</p>
              <p className="text-xs text-gray-400 mt-1">This may take a moment</p>
            </div>
          </div>
        ) : topics.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Discover Trending Topics</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Get a heatmap of what's buzzing on X/Twitter with growth forecasts for
              <strong> 7 days, 30 days, and 3 months</strong>.
            </p>
            <button
              onClick={handleScanTopics}
              disabled={isLoadingTopics}
              className="btn-primary"
            >
              Scan Topics
            </button>
            {topicsLastScanned && (
              <p className="text-xs text-gray-400 mt-4">
                Last scanned: {new Date(topicsLastScanned).toLocaleDateString()}
              </p>
            )}
          </div>
        ) : (
          <TopicsHeatmap
            topics={topics}
            heatmapSummary={topicsSummary}
            weeklyForecast={topicsForecast}
          />
        )
      )}
    </div>
  );
}

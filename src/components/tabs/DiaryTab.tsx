'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, MoreHorizontal, Send, Sparkles, ExternalLink, Zap, Check, X, Brain, Lightbulb, Target } from 'lucide-react';
import {
  getAllDiaryEntries,
  createDiaryEntry,
  updateDiaryEntry,
  deleteDiaryEntry,
} from '@/lib/db';
import type { DiaryEntry, DiaryEntryType, TweetAnalysis } from '@/types';

// Local storage keys for insights
const PULSE_INSIGHTS_KEY = 'abh_pulse_insights';
const ROUNDTABLE_ANALYSES_KEY = 'abh_roundtable_analyses';

interface PulseInsight {
  id: string;
  headline: string;
  subtitle?: string;
  key_insight?: string;
  summary?: string;
  category?: string;
}

interface ElevateResult {
  elevatedTweet: string;
  psychologyApplied?: {
    predictionViolation?: string;
    curiosityGap?: string;
    habituationBypass?: string;
  };
  insightsUsed?: string[];
  changes?: string;
}

// ABH Core Pillars - same color for all (outline style)
const ABH_PILLARS = [
  { id: 'friendships', label: 'Friendships' },
  { id: 'ai', label: 'AI' },
  { id: 'ambition', label: 'Ambition' },
  { id: 'twenties', label: 'Twenties' },
] as const;

const PILLAR_COLOR = '#C41E3A';

type PillarId = typeof ABH_PILLARS[number]['id'];

// Map pillars to diary entry types for storage
const pillarToType: Record<PillarId, DiaryEntryType> = {
  friendships: 'stories',
  ai: 'builds',
  ambition: 'takes',
  twenties: 'reflections',
};

interface InspoTweet {
  id: string;
  author: string;
  handle: string;
  content: string;
  url?: string;
}

interface DiaryTabProps {
  onAnalyzeEntry?: (entry: DiaryEntry) => void;
  onGeneratePost?: (entry: DiaryEntry) => void;
}

export default function DiaryTab({ onGeneratePost }: DiaryTabProps) {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedPillar, setSelectedPillar] = useState<PillarId>('friendships');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [content, setContent] = useState('');

  // Right panel state
  const [rightTab, setRightTab] = useState<'inspo' | 'compose'>('inspo');
  const [tweetDraft, setTweetDraft] = useState('');
  const [inspoTweets, setInspoTweets] = useState<InspoTweet[]>([]);
  const [isGeneratingInspo, setIsGeneratingInspo] = useState(false);

  // Insights state
  const [pulseInsights, setPulseInsights] = useState<PulseInsight[]>([]);
  const [roundtableInsights, setRoundtableInsights] = useState<TweetAnalysis[]>([]);
  const [selectedPulseIds, setSelectedPulseIds] = useState<Set<string>>(new Set());
  const [selectedRoundtableIds, setSelectedRoundtableIds] = useState<Set<string>>(new Set());
  const [showInsightsPicker, setShowInsightsPicker] = useState(false);

  // Elevate state
  const [isElevating, setIsElevating] = useState(false);
  const [elevateResult, setElevateResult] = useState<ElevateResult | null>(null);

  // Load insights from localStorage
  useEffect(() => {
    // Load Pulse insights
    const savedPulse = localStorage.getItem(PULSE_INSIGHTS_KEY);
    if (savedPulse) {
      try {
        const parsed = JSON.parse(savedPulse);
        setPulseInsights(parsed.slice(0, 10)); // Keep latest 10
      } catch {
        setPulseInsights([]);
      }
    }

    // Load Roundtable analyses
    const savedRoundtable = localStorage.getItem(ROUNDTABLE_ANALYSES_KEY);
    if (savedRoundtable) {
      try {
        const parsed = JSON.parse(savedRoundtable);
        setRoundtableInsights(parsed.slice(0, 10)); // Keep latest 10
      } catch {
        setRoundtableInsights([]);
      }
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    const allEntries = await getAllDiaryEntries();
    setEntries(allEntries);
  };

  const getEntriesForPillar = useCallback((pillarId: PillarId) => {
    return entries.filter(e => e.tags?.includes(pillarId));
  }, [entries]);

  const selectedEntry = entries.find(e => e.id === selectedEntryId);
  const pillarEntries = getEntriesForPillar(selectedPillar);

  const createNewEntry = async () => {
    const newEntry = await createDiaryEntry({
      timestamp: new Date().toISOString(),
      content: '',
      tags: [selectedPillar],
      type: pillarToType[selectedPillar],
    });
    if (newEntry) {
      await loadEntries();
      setSelectedEntryId(newEntry.id);
      setContent('');
    }
  };

  const saveEntry = async () => {
    if (!selectedEntryId || !content.trim()) return;
    await updateDiaryEntry(selectedEntryId, { content });
    await loadEntries();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteDiaryEntry(id);
    if (selectedEntryId === id) {
      setSelectedEntryId(null);
      setContent('');
    }
    await loadEntries();
  };

  const selectEntry = (entry: DiaryEntry) => {
    if (selectedEntryId && content !== selectedEntry?.content) {
      saveEntry();
    }
    setSelectedEntryId(entry.id);
    setContent(entry.content);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const generateInspo = async () => {
    if (!content.trim()) return;
    setIsGeneratingInspo(true);
    setTimeout(() => {
      setInspoTweets([{
        id: '1',
        author: 'Example Creator',
        handle: '@example',
        content: 'Relevant tweets will appear here based on your journal content...',
      }]);
      setIsGeneratingInspo(false);
    }, 1000);
  };

  const pullToTweet = (text: string) => {
    setTweetDraft(text);
    setRightTab('compose');
  };

  // Toggle insight selection
  const togglePulseInsight = (id: string) => {
    const newSelected = new Set(selectedPulseIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else if (newSelected.size + selectedRoundtableIds.size < 5) {
      newSelected.add(id);
    }
    setSelectedPulseIds(newSelected);
  };

  const toggleRoundtableInsight = (id: string) => {
    const newSelected = new Set(selectedRoundtableIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else if (newSelected.size + selectedPulseIds.size < 5) {
      newSelected.add(id);
    }
    setSelectedRoundtableIds(newSelected);
  };

  const totalSelectedInsights = selectedPulseIds.size + selectedRoundtableIds.size;

  // Elevate tweet with AI
  const elevateWithAI = async () => {
    if (!tweetDraft.trim()) return;

    setIsElevating(true);
    setElevateResult(null);

    try {
      const selectedPulse = pulseInsights.filter(i => selectedPulseIds.has(i.id));
      const selectedRoundtable = roundtableInsights.filter(i => selectedRoundtableIds.has(i.id));

      const res = await fetch('/api/studio/elevate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draft: tweetDraft,
          pulseInsights: selectedPulse,
          roundtableInsights: selectedRoundtable,
        }),
      });

      if (!res.ok) throw new Error('Failed to elevate');

      const result: ElevateResult = await res.json();
      setElevateResult(result);
      setTweetDraft(result.elevatedTweet);
    } catch (err) {
      console.error('Elevate error:', err);
    } finally {
      setIsElevating(false);
    }
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex -mx-8 -my-10">
      {/* LEFT PANEL: Pillar Tabs */}
      <div className="w-52 flex flex-col bg-[#FAFAFA] border-r border-[#EEE]">
        {/* Pillar Tabs - Outline Style (same color) */}
        <div className="flex flex-col pt-2">
          {ABH_PILLARS.map((pillar) => {
            const isActive = selectedPillar === pillar.id;
            const count = getEntriesForPillar(pillar.id).length;
            return (
              <button
                key={pillar.id}
                onClick={() => setSelectedPillar(pillar.id)}
                className={`
                  text-left px-4 py-2.5 text-sm font-medium transition-all
                  border-l-3 mx-2 rounded-r-md
                  ${isActive
                    ? 'bg-white text-[#1A1A1A] shadow-sm'
                    : 'bg-transparent text-[#666] hover:bg-white/50 border-transparent'
                  }
                `}
                style={{
                  borderLeftWidth: '3px',
                  borderLeftColor: isActive ? PILLAR_COLOR : 'transparent',
                }}
              >
                <div className="flex items-center justify-between">
                  <span>{pillar.label}</span>
                  <span className="text-xs text-[#999]">{count}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto p-2 mt-4 border-t border-[#EEE] bg-white">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-medium text-[#999] uppercase tracking-wide">
              Entries
            </span>
            <button
              onClick={createNewEntry}
              className="p-1 hover:bg-[#F5F5F5] rounded transition-colors"
              style={{ color: PILLAR_COLOR }}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {pillarEntries.length === 0 ? (
            <button
              onClick={createNewEntry}
              className="w-full text-left px-2 py-2 text-xs text-[#999] hover:text-[#666] transition-colors rounded hover:bg-[#F5F5F5]"
            >
              + New entry
            </button>
          ) : (
            <div className="space-y-0.5">
              {pillarEntries.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => selectEntry(entry)}
                  className={`
                    w-full text-left px-2 py-1.5 rounded text-xs cursor-pointer
                    transition-colors group flex items-center gap-1
                    ${selectedEntryId === entry.id
                      ? 'bg-red-50 font-medium'
                      : 'hover:bg-[#F5F5F5]'
                    }
                  `}
                  style={{
                    color: selectedEntryId === entry.id ? PILLAR_COLOR : '#666'
                  }}
                >
                  <span className="flex-1 truncate">
                    {entry.content.slice(0, 25) || 'Untitled'}
                    {entry.content.length > 25 && '...'}
                  </span>
                  <button
                    onClick={(e) => handleDelete(entry.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-white rounded transition-all"
                  >
                    <Trash2 className="w-3 h-3 text-[#999] hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CENTER PANEL: Writing Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedEntry ? (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#EEE]">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded"
                  style={{ backgroundColor: PILLAR_COLOR, color: 'white' }}
                >
                  {ABH_PILLARS.find(p => p.id === selectedPillar)?.label}
                </span>
                <span className="text-xs text-[#999]">
                  {formatDate(selectedEntry.timestamp)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onGeneratePost?.(selectedEntry)}
                  className="flex items-center gap-1 px-2 py-1 text-xs hover:bg-red-50 rounded transition-colors"
                  style={{ color: PILLAR_COLOR }}
                >
                  <Sparkles className="w-3 h-3" />
                  Generate
                </button>
                <button className="p-1.5 hover:bg-[#F5F5F5] rounded transition-colors">
                  <MoreHorizontal className="w-4 h-4 text-[#999]" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={saveEntry}
                placeholder="Start writing..."
                className="w-full h-full bg-transparent text-[#1A1A1A] placeholder:text-[#CCC] text-sm resize-none focus:outline-none leading-relaxed font-mono"
                style={{ minHeight: '300px' }}
              />
            </div>

            <div className="px-4 py-2 border-t border-[#EEE] flex items-center justify-between">
              <span className="text-xs text-[#999]">{content.length} chars</span>
              <button
                onClick={() => pullToTweet(content)}
                className="text-xs hover:underline"
                style={{ color: PILLAR_COLOR }}
              >
                Pull to tweet →
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-[#999] mb-3">Select or create an entry</p>
              <button
                onClick={createNewEntry}
                className="px-3 py-1.5 text-white rounded text-sm font-medium transition-colors"
                style={{ backgroundColor: PILLAR_COLOR }}
              >
                Start Writing
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Inspo + Compose (more space) */}
      <div className="w-96 border-l border-[#EEE] flex flex-col bg-[#FAFAFA]">
        <div className="flex border-b border-[#EEE]">
          <button
            onClick={() => setRightTab('inspo')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              rightTab === 'inspo'
                ? 'border-b-2'
                : 'text-[#666] hover:text-[#1A1A1A]'
            }`}
            style={{
              color: rightTab === 'inspo' ? PILLAR_COLOR : undefined,
              borderColor: rightTab === 'inspo' ? PILLAR_COLOR : undefined,
            }}
          >
            Inspo
          </button>
          <button
            onClick={() => setRightTab('compose')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              rightTab === 'compose'
                ? 'border-b-2'
                : 'text-[#666] hover:text-[#1A1A1A]'
            }`}
            style={{
              color: rightTab === 'compose' ? PILLAR_COLOR : undefined,
              borderColor: rightTab === 'compose' ? PILLAR_COLOR : undefined,
            }}
          >
            Compose
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {rightTab === 'inspo' ? (
            <div className="p-4">
              <button
                onClick={generateInspo}
                disabled={!content.trim() || isGeneratingInspo}
                className="w-full mb-4 px-4 py-2.5 bg-white border border-[#EEE] rounded-lg text-sm text-[#666] hover:text-[#1A1A1A] hover:border-[#DDD] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {isGeneratingInspo ? 'Finding...' : 'Find relevant tweets'}
              </button>

              {inspoTweets.length === 0 ? (
                <p className="text-sm text-[#999] text-center py-8">
                  Write something, then find related tweets
                </p>
              ) : (
                <div className="space-y-3">
                  {inspoTweets.map((tweet) => (
                    <div key={tweet.id} className="bg-white rounded-lg border border-[#EEE] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-[#EEE] flex items-center justify-center text-xs font-medium text-[#666]">
                          {tweet.author[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#1A1A1A]">{tweet.author}</p>
                          <p className="text-xs text-[#999]">{tweet.handle}</p>
                        </div>
                      </div>
                      <p className="text-sm text-[#666] mb-2">{tweet.content}</p>
                      {tweet.url && (
                        <a
                          href={tweet.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs hover:underline flex items-center gap-1"
                          style={{ color: PILLAR_COLOR }}
                        >
                          View on X <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 flex flex-col h-full overflow-y-auto">
              <textarea
                value={tweetDraft}
                onChange={(e) => {
                  setTweetDraft(e.target.value);
                  setElevateResult(null);
                }}
                placeholder="Compose your tweet..."
                className="w-full h-32 p-3 bg-white border border-[#EEE] rounded-lg text-sm text-[#1A1A1A] placeholder:text-[#CCC] resize-none focus:outline-none focus:border-[#DDD]"
              />
              <div className="flex items-center justify-between mt-3">
                <span className={`text-xs ${tweetDraft.length > 280 ? 'text-red-500' : 'text-[#999]'}`}>
                  {tweetDraft.length}/280
                </span>
                <button
                  onClick={() => navigator.clipboard.writeText(tweetDraft)}
                  disabled={!tweetDraft.trim() || tweetDraft.length > 280}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  style={{ backgroundColor: PILLAR_COLOR }}
                >
                  <Send className="w-3 h-3" />
                  Copy
                </button>
              </div>

              {/* Insights Picker Section */}
              <div className="mt-4 pt-4 border-t border-[#EEE]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4" style={{ color: PILLAR_COLOR }} />
                    <span className="text-xs font-medium text-[#1A1A1A]">Vibe with Insights</span>
                  </div>
                  <span className="text-xs text-[#999]">{totalSelectedInsights}/5 selected</span>
                </div>

                <button
                  onClick={() => setShowInsightsPicker(!showInsightsPicker)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-white border border-[#EEE] rounded-lg text-xs hover:border-[#DDD] transition-colors"
                >
                  <span className="text-[#666]">
                    {totalSelectedInsights > 0
                      ? `${totalSelectedInsights} insight${totalSelectedInsights > 1 ? 's' : ''} selected`
                      : 'Select insights to amplify your tweet'
                    }
                  </span>
                  <span style={{ color: PILLAR_COLOR }}>
                    {showInsightsPicker ? 'Hide' : 'Select'}
                  </span>
                </button>

                {/* Insights Picker Modal */}
                {showInsightsPicker && (
                  <div className="mt-3 bg-white border border-[#EEE] rounded-lg max-h-60 overflow-y-auto">
                    {/* Pulse Insights */}
                    {pulseInsights.length > 0 && (
                      <div className="p-2 border-b border-[#EEE]">
                        <p className="text-xs font-medium text-[#999] px-2 py-1 flex items-center gap-1">
                          <Zap className="w-3 h-3" /> Pulse Insights
                        </p>
                        {pulseInsights.slice(0, 5).map((insight) => (
                          <button
                            key={insight.id}
                            onClick={() => togglePulseInsight(insight.id)}
                            className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-start gap-2 ${
                              selectedPulseIds.has(insight.id)
                                ? 'bg-red-50'
                                : 'hover:bg-[#F5F5F5]'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center mt-0.5 ${
                              selectedPulseIds.has(insight.id)
                                ? 'border-red-500 bg-red-500 text-white'
                                : 'border-[#CCC]'
                            }`}>
                              {selectedPulseIds.has(insight.id) && <Check className="w-3 h-3" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[#1A1A1A] truncate">{insight.headline}</p>
                              {insight.key_insight && (
                                <p className="text-[#666] truncate mt-0.5">{insight.key_insight}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Roundtable Insights */}
                    {roundtableInsights.length > 0 && (
                      <div className="p-2">
                        <p className="text-xs font-medium text-[#999] px-2 py-1 flex items-center gap-1">
                          <Target className="w-3 h-3" /> Roundtable Analysis
                        </p>
                        {roundtableInsights.slice(0, 5).map((analysis) => (
                          <button
                            key={analysis.id}
                            onClick={() => toggleRoundtableInsight(analysis.id)}
                            className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-start gap-2 ${
                              selectedRoundtableIds.has(analysis.id)
                                ? 'bg-red-50'
                                : 'hover:bg-[#F5F5F5]'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center mt-0.5 ${
                              selectedRoundtableIds.has(analysis.id)
                                ? 'border-red-500 bg-red-500 text-white'
                                : 'border-[#CCC]'
                            }`}>
                              {selectedRoundtableIds.has(analysis.id) && <Check className="w-3 h-3" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[#1A1A1A]">@{analysis.tweet.author}</p>
                              <p className="text-[#666] truncate mt-0.5">{analysis.claudeAnalysis.keyInsight}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {pulseInsights.length === 0 && roundtableInsights.length === 0 && (
                      <p className="text-xs text-[#999] text-center py-4">
                        No insights available. Run a Pulse scan or analyze tweets in Roundtable first.
                      </p>
                    )}
                  </div>
                )}

                {/* Elevate Button */}
                <button
                  onClick={elevateWithAI}
                  disabled={!tweetDraft.trim() || isElevating}
                  className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: PILLAR_COLOR }}
                >
                  <Sparkles className="w-4 h-4" />
                  {isElevating ? 'Elevating...' : 'Elevate with AI'}
                </button>

                {/* Psychology Breakdown */}
                {elevateResult?.psychologyApplied && (
                  <div className="mt-3 p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                    <p className="text-xs font-medium text-purple-900 mb-2 flex items-center gap-1">
                      <Lightbulb className="w-3 h-3" /> Psychology Applied
                    </p>
                    <div className="space-y-1.5">
                      {elevateResult.psychologyApplied.curiosityGap && (
                        <div className="flex items-start gap-2">
                          <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">Gap</span>
                          <p className="text-xs text-[#666]">{elevateResult.psychologyApplied.curiosityGap}</p>
                        </div>
                      )}
                      {elevateResult.psychologyApplied.predictionViolation && (
                        <div className="flex items-start gap-2">
                          <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded font-medium">Twist</span>
                          <p className="text-xs text-[#666]">{elevateResult.psychologyApplied.predictionViolation}</p>
                        </div>
                      )}
                      {elevateResult.psychologyApplied.habituationBypass && (
                        <div className="flex items-start gap-2">
                          <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">Fresh</span>
                          <p className="text-xs text-[#666]">{elevateResult.psychologyApplied.habituationBypass}</p>
                        </div>
                      )}
                    </div>
                    {elevateResult.changes && (
                      <p className="text-xs text-purple-700 mt-2 italic">{elevateResult.changes}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div className="mt-4 pt-4 border-t border-[#EEE]">
                <p className="text-xs text-[#999] mb-2">Quick actions</p>
                <div className="space-y-2">
                  <button
                    onClick={() => setTweetDraft(content.slice(0, 280))}
                    className="w-full text-left px-3 py-2 bg-white border border-[#EEE] rounded-lg text-xs text-[#666] hover:text-[#1A1A1A] hover:border-[#DDD] transition-colors"
                  >
                    Pull first 280 chars from journal
                  </button>
                  <button
                    onClick={() => selectedEntry && onGeneratePost?.(selectedEntry)}
                    disabled={!selectedEntry}
                    className="w-full text-left px-3 py-2 bg-white border border-[#EEE] rounded-lg text-xs text-[#666] hover:text-[#1A1A1A] hover:border-[#DDD] transition-colors disabled:opacity-50"
                  >
                    AI generate from journal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

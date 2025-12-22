'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, MoreHorizontal, Send, Sparkles, ExternalLink } from 'lucide-react';
import {
  getAllDiaryEntries,
  createDiaryEntry,
  updateDiaryEntry,
  deleteDiaryEntry,
} from '@/lib/db';
import type { DiaryEntry, DiaryEntryType } from '@/types';

// ABH Core Pillars with filing tab colors (shades of red)
const ABH_PILLARS = [
  { id: 'ambition', label: 'Ambition', color: '#C41E3A' },      // Primary red
  { id: 'community', label: 'Community', color: '#A31830' },    // Darker
  { id: 'growth', label: 'Growth', color: '#D94452' },          // Lighter
  { id: 'realness', label: 'Realness', color: '#8B1538' },      // Deep
  { id: 'twenties', label: 'Twenties', color: '#E85A6B' },      // Soft
] as const;

type PillarId = typeof ABH_PILLARS[number]['id'];

// Map pillars to diary entry types for storage
const pillarToType: Record<PillarId, DiaryEntryType> = {
  ambition: 'takes',
  community: 'stories',
  growth: 'builds',
  realness: 'reflections',
  twenties: 'stories',
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
  const [selectedPillar, setSelectedPillar] = useState<PillarId>('ambition');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [content, setContent] = useState('');

  // Right panel state
  const [rightTab, setRightTab] = useState<'inspo' | 'compose'>('inspo');
  const [tweetDraft, setTweetDraft] = useState('');
  const [inspoTweets, setInspoTweets] = useState<InspoTweet[]>([]);
  const [isGeneratingInspo, setIsGeneratingInspo] = useState(false);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    const allEntries = await getAllDiaryEntries();
    setEntries(allEntries);
  };

  // Get entries for selected pillar (using tags or type mapping)
  const getEntriesForPillar = useCallback((pillarId: PillarId) => {
    return entries.filter(e =>
      e.tags?.includes(pillarId) || e.type === pillarToType[pillarId]
    );
  }, [entries]);

  const selectedEntry = entries.find(e => e.id === selectedEntryId);
  const pillarEntries = getEntriesForPillar(selectedPillar);

  // Create new entry for selected pillar
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

  const currentPillar = ABH_PILLARS.find(p => p.id === selectedPillar)!;

  return (
    <div className="h-[calc(100vh-5rem)] flex -mx-8 -my-10">
      {/* LEFT PANEL: Filing Tab Style Pillars */}
      <div className="w-56 flex flex-col bg-[#FAFAFA] border-r border-[#EEE]">
        {/* Pillar Tabs - Filing Style */}
        <div className="flex flex-col">
          {ABH_PILLARS.map((pillar, idx) => {
            const isActive = selectedPillar === pillar.id;
            const count = getEntriesForPillar(pillar.id).length;
            return (
              <button
                key={pillar.id}
                onClick={() => setSelectedPillar(pillar.id)}
                className="relative text-left transition-all"
                style={{
                  marginLeft: isActive ? 0 : 8,
                  zIndex: isActive ? 10 : ABH_PILLARS.length - idx,
                }}
              >
                <div
                  className={`
                    px-3 py-2.5 text-sm font-medium
                    ${isActive
                      ? 'bg-white text-[#1A1A1A] rounded-l-lg border-r-0 shadow-sm'
                      : 'text-white rounded-l-md'
                    }
                  `}
                  style={{
                    backgroundColor: isActive ? 'white' : pillar.color,
                    borderLeft: isActive ? `3px solid ${pillar.color}` : 'none',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span>{pillar.label}</span>
                    <span className={`text-xs ${isActive ? 'text-[#999]' : 'opacity-70'}`}>
                      {count}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto p-2 bg-white">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-medium text-[#999] uppercase tracking-wide">
              Entries
            </span>
            <button
              onClick={createNewEntry}
              className="p-1 hover:bg-[#F5F5F5] rounded transition-colors"
              style={{ color: currentPillar.color }}
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
                      ? 'bg-[#FEE] font-medium'
                      : 'hover:bg-[#F5F5F5]'
                    }
                  `}
                  style={{
                    color: selectedEntryId === entry.id ? currentPillar.color : '#666'
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
                  style={{ backgroundColor: currentPillar.color, color: 'white' }}
                >
                  {currentPillar.label}
                </span>
                <span className="text-xs text-[#999]">
                  {formatDate(selectedEntry.timestamp)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onGeneratePost?.(selectedEntry)}
                  className="flex items-center gap-1 px-2 py-1 text-xs hover:bg-[#FEE] rounded transition-colors"
                  style={{ color: currentPillar.color }}
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
                style={{ color: currentPillar.color }}
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
                style={{ backgroundColor: currentPillar.color }}
              >
                Start Writing
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Inspo + Compose */}
      <div className="w-72 border-l border-[#EEE] flex flex-col bg-[#FAFAFA]">
        <div className="flex border-b border-[#EEE]">
          <button
            onClick={() => setRightTab('inspo')}
            className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
              rightTab === 'inspo'
                ? 'border-b-2'
                : 'text-[#666] hover:text-[#1A1A1A]'
            }`}
            style={{
              color: rightTab === 'inspo' ? currentPillar.color : undefined,
              borderColor: rightTab === 'inspo' ? currentPillar.color : undefined,
            }}
          >
            Inspo
          </button>
          <button
            onClick={() => setRightTab('compose')}
            className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
              rightTab === 'compose'
                ? 'border-b-2'
                : 'text-[#666] hover:text-[#1A1A1A]'
            }`}
            style={{
              color: rightTab === 'compose' ? currentPillar.color : undefined,
              borderColor: rightTab === 'compose' ? currentPillar.color : undefined,
            }}
          >
            Compose
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {rightTab === 'inspo' ? (
            <div className="p-3">
              <button
                onClick={generateInspo}
                disabled={!content.trim() || isGeneratingInspo}
                className="w-full mb-3 px-3 py-2 bg-white border border-[#EEE] rounded text-xs text-[#666] hover:text-[#1A1A1A] hover:border-[#DDD] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3 h-3" />
                {isGeneratingInspo ? 'Finding...' : 'Find relevant tweets'}
              </button>

              {inspoTweets.length === 0 ? (
                <p className="text-xs text-[#999] text-center py-6">
                  Write something, then find related tweets
                </p>
              ) : (
                <div className="space-y-2">
                  {inspoTweets.map((tweet) => (
                    <div key={tweet.id} className="bg-white rounded border border-[#EEE] p-2.5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-full bg-[#EEE] flex items-center justify-center text-[10px] font-medium text-[#666]">
                          {tweet.author[0]}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-[#1A1A1A]">{tweet.author}</p>
                          <p className="text-[10px] text-[#999]">{tweet.handle}</p>
                        </div>
                      </div>
                      <p className="text-xs text-[#666] mb-1.5">{tweet.content}</p>
                      {tweet.url && (
                        <a
                          href={tweet.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] hover:underline flex items-center gap-0.5"
                          style={{ color: currentPillar.color }}
                        >
                          View on X <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 flex flex-col h-full">
              <textarea
                value={tweetDraft}
                onChange={(e) => setTweetDraft(e.target.value)}
                placeholder="Compose your tweet..."
                className="w-full h-32 p-2.5 bg-white border border-[#EEE] rounded text-xs text-[#1A1A1A] placeholder:text-[#CCC] resize-none focus:outline-none focus:border-[#DDD]"
              />
              <div className="flex items-center justify-between mt-2">
                <span className={`text-[10px] ${tweetDraft.length > 280 ? 'text-red-500' : 'text-[#999]'}`}>
                  {tweetDraft.length}/280
                </span>
                <button
                  disabled={!tweetDraft.trim() || tweetDraft.length > 280}
                  className="flex items-center gap-1 px-2.5 py-1 text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
                  style={{ backgroundColor: currentPillar.color }}
                >
                  <Send className="w-2.5 h-2.5" />
                  Copy
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-[#EEE]">
                <p className="text-[10px] text-[#999] mb-1.5">Quick actions</p>
                <div className="space-y-1.5">
                  <button
                    onClick={() => setTweetDraft(content.slice(0, 280))}
                    className="w-full text-left px-2 py-1.5 bg-white border border-[#EEE] rounded text-[10px] text-[#666] hover:text-[#1A1A1A] hover:border-[#DDD] transition-colors"
                  >
                    Pull first 280 chars
                  </button>
                  <button
                    onClick={() => selectedEntry && onGeneratePost?.(selectedEntry)}
                    disabled={!selectedEntry}
                    className="w-full text-left px-2 py-1.5 bg-white border border-[#EEE] rounded text-[10px] text-[#666] hover:text-[#1A1A1A] hover:border-[#DDD] transition-colors disabled:opacity-50"
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

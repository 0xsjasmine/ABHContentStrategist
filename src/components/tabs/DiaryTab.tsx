'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronRight, ChevronDown, Trash2, MoreHorizontal, Send, Sparkles, ExternalLink } from 'lucide-react';
import {
  getAllDiaryEntries,
  createDiaryEntry,
  updateDiaryEntry,
  deleteDiaryEntry,
} from '@/lib/db';
import type { DiaryEntry, DiaryEntryType } from '@/types';

// Category structure for OneNote-style organization
interface Category {
  id: string;
  name: string;
  type: DiaryEntryType;
  isExpanded: boolean;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'stories', name: 'Stories', type: 'stories', isExpanded: true },
  { id: 'builds', name: 'Builds', type: 'builds', isExpanded: false },
  { id: 'takes', name: 'Takes', type: 'takes', isExpanded: false },
  { id: 'reflections', name: 'Reflections', type: 'reflections', isExpanded: false },
];

// Sample inspiration tweets (would come from Claude/Grok in real implementation)
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
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Right panel state
  const [rightTab, setRightTab] = useState<'inspo' | 'compose'>('inspo');
  const [tweetDraft, setTweetDraft] = useState('');
  const [inspoTweets, setInspoTweets] = useState<InspoTweet[]>([]);
  const [isGeneratingInspo, setIsGeneratingInspo] = useState(false);

  // Load entries
  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    setIsLoading(false);
    const allEntries = await getAllDiaryEntries();
    setEntries(allEntries);
  };

  // Get entries for a category
  const getEntriesForCategory = useCallback((type: DiaryEntryType) => {
    return entries.filter(e => e.type === type);
  }, [entries]);

  // Get selected entry
  const selectedEntry = entries.find(e => e.id === selectedEntryId);

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId ? { ...cat, isExpanded: !cat.isExpanded } : cat
    ));
  };

  // Create new entry in a category
  const createNewEntry = async (type: DiaryEntryType) => {
    const newEntry = await createDiaryEntry({
      timestamp: new Date().toISOString(),
      content: '',
      tags: [],
      type,
    });
    if (newEntry) {
      await loadEntries();
      setSelectedEntryId(newEntry.id);
      setContent('');
    }
  };

  // Save current entry
  const saveEntry = async () => {
    if (!selectedEntryId || !content.trim()) return;
    await updateDiaryEntry(selectedEntryId, { content });
    await loadEntries();
  };

  // Delete entry
  const handleDelete = async (id: string) => {
    await deleteDiaryEntry(id);
    if (selectedEntryId === id) {
      setSelectedEntryId(null);
      setContent('');
    }
    await loadEntries();
  };

  // Handle entry selection
  const selectEntry = (entry: DiaryEntry) => {
    // Auto-save previous entry
    if (selectedEntryId && content !== selectedEntry?.content) {
      saveEntry();
    }
    setSelectedEntryId(entry.id);
    setContent(entry.content);
  };

  // Format date for display
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Generate inspiration based on current content
  const generateInspo = async () => {
    if (!content.trim()) return;

    setIsGeneratingInspo(true);
    // This would call Claude API to find relevant tweets
    // For now, show placeholder
    setTimeout(() => {
      setInspoTweets([
        {
          id: '1',
          author: 'Example Creator',
          handle: '@example',
          content: 'This is where relevant tweets would appear based on your journal content...',
        }
      ]);
      setIsGeneratingInspo(false);
    }, 1000);
  };

  // Pull quote from journal to tweet
  const pullToTweet = (text: string) => {
    setTweetDraft(text);
    setRightTab('compose');
  };

  return (
    <div className="h-[calc(100vh-5rem)] flex -mx-8 -my-10">
      {/* LEFT PANEL: Categories + Drafts (OneNote style) */}
      <div className="w-64 border-r border-[#EEE] flex flex-col bg-[#FAFAFA]">
        <div className="p-4 border-b border-[#EEE]">
          <h2 className="text-sm font-semibold text-[#1A1A1A]">Diary</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {categories.map((category) => {
            const categoryEntries = getEntriesForCategory(category.type);
            return (
              <div key={category.id} className="mb-1">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white transition-colors text-left group"
                >
                  {category.isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-[#999]" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#999]" />
                  )}
                  <span className="text-sm font-medium text-[#1A1A1A] flex-1">
                    {category.name}
                  </span>
                  <span className="text-xs text-[#999]">
                    {categoryEntries.length}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      createNewEntry(category.type);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#EEE] rounded transition-all"
                  >
                    <Plus className="w-3 h-3 text-[#666]" />
                  </button>
                </button>

                {/* Category Entries */}
                {category.isExpanded && (
                  <div className="ml-6 space-y-0.5">
                    {categoryEntries.length === 0 ? (
                      <button
                        onClick={() => createNewEntry(category.type)}
                        className="w-full text-left px-2 py-1.5 text-xs text-[#999] hover:text-[#666] transition-colors"
                      >
                        + New entry
                      </button>
                    ) : (
                      categoryEntries.map((entry) => (
                        <button
                          key={entry.id}
                          onClick={() => selectEntry(entry)}
                          className={`
                            w-full text-left px-2 py-1.5 rounded text-sm truncate
                            transition-colors group flex items-center gap-2
                            ${selectedEntryId === entry.id
                              ? 'bg-white text-[#C41E3A] font-medium'
                              : 'text-[#666] hover:bg-white hover:text-[#1A1A1A]'
                            }
                          `}
                        >
                          <span className="flex-1 truncate">
                            {entry.content.slice(0, 30) || 'Untitled'}
                            {entry.content.length > 30 && '...'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(entry.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#FEE] rounded transition-all"
                          >
                            <Trash2 className="w-3 h-3 text-[#999] hover:text-red-500" />
                          </button>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* New Entry Button */}
        <div className="p-3 border-t border-[#EEE]">
          <button
            onClick={() => createNewEntry('reflections')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white border border-[#EEE] rounded-lg text-sm text-[#666] hover:text-[#1A1A1A] hover:border-[#DDD] transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Entry
          </button>
        </div>
      </div>

      {/* CENTER PANEL: Script/Journal Writing Area */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedEntry ? (
          <>
            {/* Entry Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EEE]">
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#999] uppercase tracking-wide">
                  {selectedEntry.type}
                </span>
                <span className="text-xs text-[#CCC]">•</span>
                <span className="text-xs text-[#999]">
                  {formatDate(selectedEntry.timestamp)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onGeneratePost?.(selectedEntry)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#C41E3A] hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate
                </button>
                <button className="p-2 hover:bg-[#F5F5F5] rounded-lg transition-colors">
                  <MoreHorizontal className="w-4 h-4 text-[#999]" />
                </button>
              </div>
            </div>

            {/* Writing Area - Script Style */}
            <div className="flex-1 overflow-y-auto p-6">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onBlur={saveEntry}
                placeholder="Start writing..."
                className="w-full h-full bg-transparent text-[#1A1A1A] placeholder:text-[#CCC] text-base resize-none focus:outline-none leading-relaxed font-mono"
                style={{ minHeight: '400px' }}
              />
            </div>

            {/* Bottom Actions */}
            <div className="px-6 py-3 border-t border-[#EEE] flex items-center justify-between">
              <span className="text-xs text-[#999]">
                {content.length} characters
              </span>
              <button
                onClick={() => pullToTweet(content)}
                className="text-xs text-[#C41E3A] hover:underline"
              >
                Pull to tweet →
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-[#999] mb-4">Select or create an entry</p>
              <button
                onClick={() => createNewEntry('reflections')}
                className="px-4 py-2 bg-[#C41E3A] text-white rounded-lg text-sm font-medium hover:bg-[#A31830] transition-colors"
              >
                Start Writing
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL: Inspo + Compose */}
      <div className="w-80 border-l border-[#EEE] flex flex-col bg-[#FAFAFA]">
        {/* Tab Switcher */}
        <div className="flex border-b border-[#EEE]">
          <button
            onClick={() => setRightTab('inspo')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              rightTab === 'inspo'
                ? 'text-[#C41E3A] border-b-2 border-[#C41E3A]'
                : 'text-[#666] hover:text-[#1A1A1A]'
            }`}
          >
            Inspo
          </button>
          <button
            onClick={() => setRightTab('compose')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              rightTab === 'compose'
                ? 'text-[#C41E3A] border-b-2 border-[#C41E3A]'
                : 'text-[#666] hover:text-[#1A1A1A]'
            }`}
          >
            Compose
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {rightTab === 'inspo' ? (
            <div className="p-4">
              {/* Generate Inspo Button */}
              <button
                onClick={generateInspo}
                disabled={!content.trim() || isGeneratingInspo}
                className="w-full mb-4 px-4 py-2.5 bg-white border border-[#EEE] rounded-lg text-sm text-[#666] hover:text-[#1A1A1A] hover:border-[#DDD] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {isGeneratingInspo ? 'Finding inspo...' : 'Find relevant tweets'}
              </button>

              {/* Inspo Tweets */}
              {inspoTweets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-[#999]">
                    Write something, then find tweets that relate to your thoughts
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inspoTweets.map((tweet) => (
                    <div
                      key={tweet.id}
                      className="bg-white rounded-lg border border-[#EEE] p-3"
                    >
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
                          className="text-xs text-[#C41E3A] hover:underline flex items-center gap-1"
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
            <div className="p-4 flex flex-col h-full">
              {/* Tweet Composer */}
              <div className="flex-1">
                <textarea
                  value={tweetDraft}
                  onChange={(e) => setTweetDraft(e.target.value)}
                  placeholder="Compose your tweet..."
                  className="w-full h-40 p-3 bg-white border border-[#EEE] rounded-lg text-sm text-[#1A1A1A] placeholder:text-[#CCC] resize-none focus:outline-none focus:border-[#DDD]"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-xs ${tweetDraft.length > 280 ? 'text-red-500' : 'text-[#999]'}`}>
                    {tweetDraft.length}/280
                  </span>
                  <button
                    disabled={!tweetDraft.trim() || tweetDraft.length > 280}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C41E3A] text-white rounded-lg text-sm font-medium hover:bg-[#A31830] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-3 h-3" />
                    Copy
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
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
                    onClick={() => onGeneratePost?.(selectedEntry!)}
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

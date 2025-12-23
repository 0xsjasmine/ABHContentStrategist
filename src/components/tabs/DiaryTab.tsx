'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronLeft, Trash2, Sparkles, Image, FileText, X, Check, Loader2, Lightbulb } from 'lucide-react';
import {
  getAllDiaryEntries,
  createDiaryEntry,
  updateDiaryEntry,
  deleteDiaryEntry,
} from '@/lib/db';
import type { DiaryEntry, DiaryEntryType, TweetAnalysis } from '@/types';

const BRAND_RED = '#C41E3A';

// Episode status types
type EpisodeStatus = 'draft' | 'in_progress' | 'ready' | 'published' | 'archived';

// Entry type labels
const TYPE_LABELS: Record<DiaryEntryType, string> = {
  stories: 'Story',
  builds: 'Build Log',
  takes: 'Hot Take',
  reflections: 'Reflection',
};

// Status badge styles
const STATUS_STYLES: Record<EpisodeStatus, { bg: string; text: string; label: string }> = {
  draft: { bg: '#FEF9C3', text: '#A16207', label: 'Draft' },
  in_progress: { bg: '#DBEAFE', text: '#1D4ED8', label: 'In Progress' },
  ready: { bg: '#DCFCE7', text: '#15803D', label: 'Ready' },
  published: { bg: '#F3E8FF', text: '#7C3AED', label: 'Published' },
  archived: { bg: '#F3F4F6', text: '#6B7280', label: 'Archived' },
};

// Filter tabs
const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Drafts' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'ready', label: 'Ready' },
  { id: 'published', label: 'Published' },
  { id: 'archived', label: 'Archived' },
];

// Content type tabs for editor
const CONTENT_TYPES: { id: DiaryEntryType; label: string }[] = [
  { id: 'stories', label: 'Story' },
  { id: 'builds', label: 'Build Log' },
  { id: 'takes', label: 'Hot Take' },
  { id: 'reflections', label: 'Reflection' },
];

interface DiaryTabProps {
  onAnalyzeEntry?: (entry: DiaryEntry) => void;
  onGeneratePost?: (entry: DiaryEntry) => void;
}

// Inspiration Selector Modal
function InspirationModal({
  isOpen,
  onClose,
  onSelect,
  selectedIds,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tweets: TweetAnalysis[]) => void;
  selectedIds: string[];
}) {
  const [roundtableItems, setRoundtableItems] = useState<TweetAnalysis[]>([]);
  const [localSelected, setLocalSelected] = useState<string[]>(selectedIds);

  useEffect(() => {
    if (isOpen) {
      // Load from Roundtable localStorage
      const saved = localStorage.getItem('abh_roundtable_analyses');
      if (saved) {
        try {
          setRoundtableItems(JSON.parse(saved));
        } catch {
          setRoundtableItems([]);
        }
      }
      setLocalSelected(selectedIds);
    }
  }, [isOpen, selectedIds]);

  const toggleSelect = (id: string) => {
    setLocalSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    const selected = roundtableItems.filter(item => localSelected.includes(item.id));
    onSelect(selected);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Select Inspiration</h2>
            <p className="text-sm text-gray-500">Choose tweets from Roundtable to inspire your content</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {roundtableItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500">No tweets in Roundtable yet</p>
              <p className="text-sm text-gray-400 mt-1">Analyze some tweets first!</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {roundtableItems.map(item => {
                const isSelected = localSelected.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelect(item.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#C41E3A] bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isSelected ? 'bg-[#C41E3A] border-[#C41E3A]' : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{item.tweet.author}</span>
                          <span className="text-gray-400 text-sm">@{item.tweet.handle}</span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">{item.tweet.text}</p>
                        {item.claudeAnalysis?.keyInsight && (
                          <p className="text-xs text-[#C41E3A] mt-2 italic">
                            "{item.claudeAnalysis.keyInsight}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <span className="text-sm text-gray-500">
            {localSelected.length} selected
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={localSelected.length === 0}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50"
              style={{ backgroundColor: BRAND_RED }}
            >
              Use as Inspiration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to get episode status from entry
function getEpisodeStatus(entry: DiaryEntry): EpisodeStatus {
  // For now, default to draft. Later can add status field to entry
  if (!entry.content || entry.content.trim().length === 0) return 'draft';
  if (entry.content.length < 100) return 'draft';
  if (entry.content.length < 500) return 'in_progress';
  return 'ready';
}

// Helper to get title from content
function getEpisodeTitle(entry: DiaryEntry): string {
  if (!entry.content) return 'Untitled';
  // Get first line or first 50 chars
  const firstLine = entry.content.split('\n')[0].trim();
  if (firstLine.length === 0) return 'Untitled';
  if (firstLine.length > 50) return firstLine.slice(0, 47) + '...';
  return firstLine;
}

// Format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Remix result type
interface RemixResult {
  tweet: string;
  characterCount: number;
  techniqueBorrowed: string;
  abhAngle: string;
  hookType: string;
  confidence: number;
}

export default function DiaryTab({ onGeneratePost }: DiaryTabProps) {
  // Core state
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Episode detail state
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editType, setEditType] = useState<DiaryEntryType>('stories');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Inspiration & Remix state
  const [showInspirationModal, setShowInspirationModal] = useState(false);
  const [selectedInspiration, setSelectedInspiration] = useState<TweetAnalysis[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [remixResults, setRemixResults] = useState<RemixResult[]>([]);
  const [selectedRemixIndex, setSelectedRemixIndex] = useState<number | null>(null);

  // Load entries
  const loadEntries = useCallback(async () => {
    try {
      const allEntries = await getAllDiaryEntries();
      setEntries(allEntries);
    } catch (error) {
      console.error('Failed to load entries:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Get selected entry
  const selectedEntry = selectedEntryId
    ? entries.find(e => e.id === selectedEntryId)
    : null;

  // When entry is selected, load its content
  useEffect(() => {
    if (selectedEntry) {
      setEditContent(selectedEntry.content || '');
      setEditType(selectedEntry.type || 'stories');
    }
  }, [selectedEntry]);

  // Filter entries
  const filteredEntries = entries.filter(entry => {
    if (selectedFilter === 'all') return true;
    return getEpisodeStatus(entry) === selectedFilter;
  });

  // Create new episode
  const handleCreateEpisode = async () => {
    try {
      const newEntry = await createDiaryEntry({
        content: '',
        type: 'stories',
        tags: [],
        timestamp: new Date().toISOString(),
      });
      setEntries(prev => [newEntry, ...prev]);
      setSelectedEntryId(newEntry.id);
    } catch (error) {
      console.error('Failed to create episode:', error);
    }
  };

  // Save content
  const handleSave = async () => {
    if (!selectedEntryId) return;

    setIsSaving(true);
    try {
      await updateDiaryEntry(selectedEntryId, {
        content: editContent,
        type: editType,
      });
      setLastSaved(new Date().toISOString());
      // Update local state
      setEntries(prev =>
        prev.map(e =>
          e.id === selectedEntryId
            ? { ...e, content: editContent, type: editType, updatedAt: new Date().toISOString() }
            : e
        )
      );
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete episode
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this episode?')) return;

    try {
      await deleteDiaryEntry(id);
      setEntries(prev => prev.filter(e => e.id !== id));
      if (selectedEntryId === id) {
        setSelectedEntryId(null);
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  // Go back to list
  const handleBack = () => {
    // Auto-save before leaving
    if (selectedEntryId && editContent !== selectedEntry?.content) {
      handleSave();
    }
    setSelectedEntryId(null);
    // Clear remix state
    setSelectedInspiration([]);
    setRemixResults([]);
    setSelectedRemixIndex(null);
  };

  // Handle inspiration selection
  const handleInspirationSelect = (tweets: TweetAnalysis[]) => {
    setSelectedInspiration(tweets);
    setRemixResults([]);
    setSelectedRemixIndex(null);
  };

  // Generate remixes
  const handleGenerate = async () => {
    if (!editContent || editContent.length < 20) return;
    if (selectedInspiration.length === 0) {
      // If no inspiration selected, open the modal
      setShowInspirationModal(true);
      return;
    }

    setIsGenerating(true);
    setRemixResults([]);

    try {
      const response = await fetch('/api/diary/remix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inspirationTweets: selectedInspiration.map(t => ({
            text: t.tweet.text,
            author: t.tweet.author,
            handle: t.tweet.handle,
            analysis: {
              curiosityGap: t.grokAnalysis?.curiosityGap,
              predictionViolation: t.grokAnalysis?.predictionViolation,
              keyInsight: t.claudeAnalysis?.keyInsight || t.grokAnalysis?.keyInsight,
            },
          })),
          userContent: editContent,
          contentType: editType,
        }),
      });

      const result = await response.json();

      if (result.success && result.remixes) {
        setRemixResults(result.remixes);
        setSelectedRemixIndex(0);
      } else {
        console.error('Remix failed:', result.error);
      }
    } catch (error) {
      console.error('Failed to generate:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy remix to clipboard
  const handleCopyRemix = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // ============================================
  // EPISODE LIST VIEW
  // ============================================
  if (!selectedEntryId) {
    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Diary</h1>
            <p className="text-sm text-gray-500">{entries.length} episode{entries.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={handleCreateEpisode}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors hover:opacity-90"
            style={{ backgroundColor: BRAND_RED }}
          >
            <Plus className="w-4 h-4" />
            New Episode
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-6">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Episodes Table */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: BRAND_RED }}></div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No episodes yet</h3>
            <p className="text-gray-500 mb-6">Click "New Episode" to start writing</p>
            <button
              onClick={handleCreateEpisode}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium"
              style={{ backgroundColor: BRAND_RED }}
            >
              <Plus className="w-4 h-4" />
              New Episode
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <div className="col-span-5">Episode</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Last Saved</div>
              <div className="col-span-1">Actions</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100">
              {filteredEntries.map(entry => {
                const status = getEpisodeStatus(entry);
                const statusStyle = STATUS_STYLES[status];

                return (
                  <div
                    key={entry.id}
                    className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => setSelectedEntryId(entry.id)}
                  >
                    {/* Episode Title */}
                    <div className="col-span-5">
                      <span className="font-medium text-gray-900 hover:underline" style={{ color: BRAND_RED }}>
                        {getEpisodeTitle(entry)}
                      </span>
                    </div>

                    {/* Type */}
                    <div className="col-span-2">
                      <span className="text-sm text-gray-600">
                        {TYPE_LABELS[entry.type || 'stories']}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      <span
                        className="inline-flex px-2 py-1 rounded text-xs font-medium"
                        style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                      >
                        {statusStyle.label}
                      </span>
                    </div>

                    {/* Last Saved */}
                    <div className="col-span-2">
                      <span className="text-sm text-gray-500">
                        {formatDate(entry.updatedAt || entry.createdAt)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(entry.id);
                        }}
                        className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================
  // EPISODE DETAIL VIEW (Split Screen)
  // ============================================
  const currentStatus = selectedEntry ? getEpisodeStatus(selectedEntry) : 'draft';
  const currentStatusStyle = STATUS_STYLES[currentStatus];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedEntry ? getEpisodeTitle(selectedEntry) : 'New Episode'}
            </h2>
            <p className="text-xs text-gray-500">
              Click back to return to episode list
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
            style={{ backgroundColor: currentStatusStyle.bg, color: currentStatusStyle.text }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentStatusStyle.text }}></span>
            {currentStatusStyle.label}
          </span>
        </div>
      </div>

      {/* Split View */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* LEFT: Writing Area */}
        <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Type Tabs */}
          <div className="flex items-center gap-1 p-2 border-b border-gray-100">
            {CONTENT_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => setEditType(type.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  editType === type.id
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Editor */}
          <div className="flex-1 p-4 overflow-hidden">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onBlur={handleSave}
              placeholder="Start writing your script..."
              className="w-full h-full resize-none bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none font-mono text-sm leading-relaxed"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-400">
              {editContent.length} characters
            </span>
            <div className="flex items-center gap-2">
              {lastSaved && (
                <span className="text-xs text-gray-400">
                  Saved {formatDate(lastSaved)}
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-3 py-1.5 text-sm font-medium rounded-lg text-white transition-colors hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: BRAND_RED }}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Inspiration & Generation Area */}
        <div className="w-96 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Inspiration Section */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" style={{ color: BRAND_RED }} />
                Inspiration
              </span>
              <button
                onClick={() => setShowInspirationModal(true)}
                className="text-xs font-medium hover:underline"
                style={{ color: BRAND_RED }}
              >
                {selectedInspiration.length > 0 ? 'Change' : '+ Add'}
              </button>
            </div>

            {selectedInspiration.length > 0 ? (
              <div className="space-y-2">
                {selectedInspiration.map((tweet, idx) => (
                  <div key={tweet.id} className="p-2 bg-red-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">@{tweet.tweet.handle}</span>
                      <button
                        onClick={() => setSelectedInspiration(prev => prev.filter((_, i) => i !== idx))}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{tweet.tweet.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">
                Select tweets from Roundtable to inspire your remix
              </p>
            )}
          </div>

          {/* Remix Results or Preview */}
          <div className="flex-1 overflow-y-auto">
            {remixResults.length > 0 ? (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Remix Options</span>
                  <span className="text-xs text-gray-400">{remixResults.length} generated</span>
                </div>
                {remixResults.map((remix, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedRemixIndex(idx)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedRemixIndex === idx
                        ? 'border-[#C41E3A] bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                        {remix.hookType}
                      </span>
                      <span className="text-xs text-gray-400">{remix.characterCount} chars</span>
                    </div>
                    <p className="text-sm text-gray-800 mb-2">{remix.tweet}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 italic line-clamp-1">
                        {remix.techniqueBorrowed}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyRemix(remix.tweet);
                        }}
                        className="text-xs font-medium hover:underline"
                        style={{ color: BRAND_RED }}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-900 min-h-[200px]">
                {editContent.length > 0 ? (
                  <div className="w-full">
                    <div className="bg-white rounded-lg p-4 max-w-full shadow-lg">
                      <div
                        className="text-xs font-semibold uppercase tracking-wide mb-2"
                        style={{ color: BRAND_RED }}
                      >
                        {TYPE_LABELS[editType]}
                      </div>
                      <p className="text-sm text-gray-800 line-clamp-4">
                        {editContent.slice(0, 150)}
                        {editContent.length > 150 && '...'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center mb-4 mx-auto">
                      <Image className="w-6 h-6 text-gray-500" />
                    </div>
                    <h4 className="text-white font-medium mb-1">No content yet</h4>
                    <p className="text-gray-400 text-sm">
                      Start writing to generate
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Generate Button */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleGenerate}
              disabled={!editContent || editContent.length < 20 || isGenerating}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: BRAND_RED }}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Remixing...
                </>
              ) : selectedInspiration.length > 0 ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Remix
                </>
              ) : (
                <>
                  <Lightbulb className="w-4 h-4" />
                  Add Inspiration First
                </>
              )}
            </button>
            {selectedInspiration.length === 0 && editContent.length >= 20 && (
              <p className="text-xs text-center text-gray-400 mt-2">
                Select tweets from Roundtable to remix
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Inspiration Modal */}
      <InspirationModal
        isOpen={showInspirationModal}
        onClose={() => setShowInspirationModal(false)}
        onSelect={handleInspirationSelect}
        selectedIds={selectedInspiration.map(t => t.id)}
      />
    </div>
  );
}

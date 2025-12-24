'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronLeft, Trash2, Sparkles, Image, FileText, X, Check, Loader2, Lightbulb, Radio, Zap, Copy } from 'lucide-react';
import {
  getAllDiaryEntries,
  createDiaryEntry,
  updateDiaryEntry,
  deleteDiaryEntry,
} from '@/lib/db';
import type { DiaryEntry, DiaryEntryType, CreatorId, CreatorTweet, ImportedStructure } from '@/types';
import { CREATORS } from '@/types';

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

// AI Result type
interface AIRemixResult {
  ai: 'grok' | 'claude' | 'gpt';
  success: boolean;
  tweet?: string;
  characterCount?: number;
  scores?: {
    curiosityGap: { score: number; reason: string };
    habituationBypass: { score: number; reason: string };
    predictionViolation: { score: number; reason: string };
  };
  structureBorrowed?: string;
  hookType?: string;
  error?: string;
}

// Creator Tweet Selector Modal
function CreatorTweetSelectorModal({
  isOpen,
  onClose,
  onSelect,
  selectedCreatorId,
  selectedTweetId,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (creatorId: CreatorId, tweetId: string | null, tweets: CreatorTweet[]) => void;
  selectedCreatorId: CreatorId | null;
  selectedTweetId: string | null;
}) {
  const [activeCreator, setActiveCreator] = useState<CreatorId>(selectedCreatorId || 'steven');
  const [creatorTweets, setCreatorTweets] = useState<Record<CreatorId, CreatorTweet[]>>({
    steven: [],
    mylene: [],
    greg: [],
  });
  const [localSelectedTweet, setLocalSelectedTweet] = useState<string | null>(selectedTweetId);

  useEffect(() => {
    if (isOpen) {
      // Load creator tweets from localStorage
      CREATORS.forEach(creator => {
        const saved = localStorage.getItem(`abh_creator_${creator.id}`);
        if (saved) {
          try {
            setCreatorTweets(prev => ({
              ...prev,
              [creator.id]: JSON.parse(saved),
            }));
          } catch {
            // Ignore
          }
        }
      });
      if (selectedCreatorId) setActiveCreator(selectedCreatorId);
      setLocalSelectedTweet(selectedTweetId);
    }
  }, [isOpen, selectedCreatorId, selectedTweetId]);

  const handleConfirm = () => {
    onSelect(activeCreator, localSelectedTweet, creatorTweets[activeCreator]);
    onClose();
  };

  const currentCreator = CREATORS.find(c => c.id === activeCreator)!;
  const currentTweets = creatorTweets[activeCreator] || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Choose Style Reference</h2>
            <p className="text-sm text-gray-500">Pick a creator and optionally a specific tweet to inspire</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Creator Tabs */}
        <div className="flex items-center gap-1 p-2 border-b border-gray-100">
          {CREATORS.map(creator => (
            <button
              key={creator.id}
              onClick={() => {
                setActiveCreator(creator.id);
                setLocalSelectedTweet(null);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeCreator === creator.id
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: creator.color }}
              />
              {creator.name}
              <span className="text-xs opacity-60">
                ({creatorTweets[creator.id]?.length || 0})
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {currentTweets.length === 0 ? (
            <div className="text-center py-12">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${currentCreator.color}20` }}
              >
                <Lightbulb className="w-6 h-6" style={{ color: currentCreator.color }} />
              </div>
              <p className="text-gray-500">No tweets in {currentCreator.name}&apos;s library</p>
              <p className="text-sm text-gray-400 mt-1">Add tweets in the Roundtable tab first!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 mb-3">
                Select a specific tweet or use all of {currentCreator.name}&apos;s library
              </p>
              {currentTweets.map(tweet => {
                const isSelected = localSelectedTweet === tweet.id;
                return (
                  <div
                    key={tweet.id}
                    onClick={() => setLocalSelectedTweet(isSelected ? null : tweet.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={isSelected ? { borderColor: currentCreator.color } : {}}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5`}
                        style={{
                          backgroundColor: isSelected ? currentCreator.color : 'transparent',
                          borderColor: isSelected ? currentCreator.color : '#D1D5DB',
                        }}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{tweet.author}</span>
                          <span className="text-gray-400 text-sm">@{tweet.handle}</span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-3">{tweet.text}</p>
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
            {localSelectedTweet ? '1 tweet selected' : `Using all ${currentTweets.length} tweets`}
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
              disabled={currentTweets.length === 0}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50"
              style={{ backgroundColor: currentCreator.color }}
            >
              Use {currentCreator.name}&apos;s Style
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

  // Creator Voice Remix state
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [selectedCreatorId, setSelectedCreatorId] = useState<CreatorId | null>(null);
  const [selectedTweetId, setSelectedTweetId] = useState<string | null>(null);
  const [creatorTweets, setCreatorTweets] = useState<CreatorTweet[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResults, setAiResults] = useState<AIRemixResult[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Imported Structure state (from Pulse Outliers)
  const [importedStructure, setImportedStructure] = useState<ImportedStructure | null>(null);

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

  // Check for imported structure from Pulse
  useEffect(() => {
    const checkImportedStructure = () => {
      const saved = localStorage.getItem('abh_imported_structure');
      if (saved) {
        try {
          const structure = JSON.parse(saved) as ImportedStructure;
          // Only use if imported within last hour
          const importedTime = new Date(structure.importedAt).getTime();
          const oneHour = 60 * 60 * 1000;
          if (Date.now() - importedTime < oneHour) {
            setImportedStructure(structure);
          } else {
            // Clear stale structure
            localStorage.removeItem('abh_imported_structure');
          }
        } catch {
          // Ignore parse errors
        }
      }
    };

    // Check on mount and when entering detail view
    checkImportedStructure();
    // Also listen for storage changes (in case user switches tabs)
    window.addEventListener('storage', checkImportedStructure);
    return () => window.removeEventListener('storage', checkImportedStructure);
  }, [selectedEntryId]);

  // Clear imported structure
  const handleClearStructure = () => {
    setImportedStructure(null);
    localStorage.removeItem('abh_imported_structure');
  };

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
    setSelectedCreatorId(null);
    setSelectedTweetId(null);
    setCreatorTweets([]);
    setAiResults([]);
  };

  // Handle creator selection
  const handleCreatorSelect = (creatorId: CreatorId, tweetId: string | null, tweets: CreatorTweet[]) => {
    setSelectedCreatorId(creatorId);
    setSelectedTweetId(tweetId);
    setCreatorTweets(tweets);
    setAiResults([]);
  };

  // Generate with all 3 AIs
  const handleGenerate = async () => {
    if (!editContent || editContent.length < 20) return;

    // Allow generation if we have EITHER a creator selected OR an imported structure
    if (!selectedCreatorId && !importedStructure) {
      // If neither, open the modal
      setShowCreatorModal(true);
      return;
    }

    // If no creator but we have structure, still require creator selection
    if (!selectedCreatorId || creatorTweets.length === 0) {
      setShowCreatorModal(true);
      return;
    }

    setIsGenerating(true);
    setAiResults([]);

    try {
      const response = await fetch('/api/diary/voice-remix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: selectedCreatorId,
          selectedTweetId,
          creatorTweets,
          userContent: editContent,
          contentType: editType,
          // Include imported structure if available
          importedStructure: importedStructure || undefined,
        }),
      });

      const result = await response.json();

      if (result.success && result.results) {
        setAiResults(result.results);
        // Clear structure after successful generation
        if (importedStructure) {
          handleClearStructure();
        }
      } else {
        console.error('Voice remix failed:', result.error);
      }
    } catch (error) {
      console.error('Failed to generate:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy tweet to clipboard
  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Get AI icon and color
  const getAiStyle = (ai: string) => {
    switch (ai) {
      case 'grok':
        return { icon: Radio, color: '#C41E3A', name: 'Grok' };
      case 'claude':
        return { icon: Sparkles, color: '#8B5CF6', name: 'Claude' };
      case 'gpt':
        return { icon: Zap, color: '#10B981', name: 'GPT-4o' };
      default:
        return { icon: Sparkles, color: '#666', name: ai };
    }
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
    <div className="fixed inset-0 left-32 flex bg-white z-30">
      {/* LEFT: Writing Area - 50% */}
      <div className="w-1/2 flex flex-col bg-white border-r border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
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
              <p className="text-xs text-gray-500">Click back to return to episode list</p>
            </div>
          </div>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
            style={{ backgroundColor: currentStatusStyle.bg, color: currentStatusStyle.text }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentStatusStyle.text }}></span>
            {currentStatusStyle.label}
          </span>
        </div>

        {/* Type Tabs */}
        <div className="flex items-center gap-1 px-6 py-3 border-b border-gray-100 bg-gray-50">
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

        {/* Editor - Full Height */}
        <div className="flex-1 p-6 overflow-auto">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onBlur={handleSave}
            placeholder="Start writing your script..."
            className="w-full h-full min-h-[400px] resize-none bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none font-mono text-sm leading-relaxed"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <span className="text-sm text-gray-500">
            {editContent.length} characters
          </span>
          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-sm text-gray-400">
                Saved {formatDate(lastSaved)}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: BRAND_RED }}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

        {/* RIGHT: Creator Voice & Generation Area - 50% */}
        <div className="w-1/2 flex flex-col bg-gray-100">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Lightbulb className="w-5 h-5" style={{ color: BRAND_RED }} />
                Voice Style
              </span>
              <button
                onClick={() => setShowCreatorModal(true)}
                className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-gray-100"
                style={{ color: selectedCreatorId ? CREATORS.find(c => c.id === selectedCreatorId)?.color : BRAND_RED }}
              >
                {selectedCreatorId ? 'Change Creator' : '+ Select Creator'}
              </button>
            </div>
            {selectedCreatorId ? (
              <div
                className="mt-3 p-3 rounded-lg flex items-center gap-3"
                style={{ backgroundColor: `${CREATORS.find(c => c.id === selectedCreatorId)?.color}15` }}
              >
                <span
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: CREATORS.find(c => c.id === selectedCreatorId)?.color }}
                />
                <span className="text-sm font-medium text-gray-700">
                  {CREATORS.find(c => c.id === selectedCreatorId)?.name}&apos;s Style
                </span>
                <span className="text-sm text-gray-500">
                  ({creatorTweets.length} tweets)
                </span>
                <button
                  onClick={() => {
                    setSelectedCreatorId(null);
                    setCreatorTweets([]);
                    setAiResults([]);
                  }}
                  className="ml-auto text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500">
                Choose Steven, Mylene, or Greg&apos;s style to inspire your content
              </p>
            )}
          </div>

          {/* Imported Structure Banner */}
          {importedStructure && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: BRAND_RED }}
                  >
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">Structure from Pulse</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                        {importedStructure.outperformanceMultiple}x performer
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      From @{importedStructure.sourceHandle}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClearStructure}
                  className="p-1.5 hover:bg-red-100 rounded-lg transition-colors text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Structure Details */}
              <div className="mt-3 space-y-2">
                {importedStructure.hookStrength && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-gray-500 w-16 flex-shrink-0">Hook:</span>
                    <span className="text-xs text-gray-700">{importedStructure.hookStrength}</span>
                  </div>
                )}
                {importedStructure.structureNotes && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-gray-500 w-16 flex-shrink-0">Structure:</span>
                    <span className="text-xs text-gray-700">{importedStructure.structureNotes}</span>
                  </div>
                )}
                {importedStructure.uniqueAngle && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-gray-500 w-16 flex-shrink-0">Angle:</span>
                    <span className="text-xs text-gray-700">{importedStructure.uniqueAngle}</span>
                  </div>
                )}
              </div>

              {/* The Lesson */}
              <div className="mt-3 p-2 bg-white/60 rounded-lg border border-red-100">
                <p className="text-xs text-gray-600">
                  <span className="font-semibold" style={{ color: BRAND_RED }}>The Lesson:</span>{' '}
                  {importedStructure.theLesson}
                </p>
              </div>
            </div>
          )}

          {/* AI Results or Preview - Full Height */}
          <div className="flex-1 overflow-y-auto">
            {aiResults.length > 0 ? (
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">AI Suggestions</span>
                  <span className="text-sm text-gray-500">
                    {aiResults.filter(r => r.success).length}/3 generated
                  </span>
                </div>
                {aiResults.map((result, idx) => {
                  const aiStyle = getAiStyle(result.ai);
                  const Icon = aiStyle.icon;
                  const avgScore = result.scores
                    ? Math.round((result.scores.curiosityGap.score + result.scores.habituationBypass.score + result.scores.predictionViolation.score) / 3)
                    : 0;

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border bg-white transition-all ${
                        result.success ? 'border-gray-200 hover:border-gray-300 hover:shadow-md' : 'border-red-200 bg-red-50'
                      }`}
                    >
                      {/* AI Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${aiStyle.color}20` }}
                          >
                            <Icon className="w-4 h-4" style={{ color: aiStyle.color }} />
                          </div>
                          <span className="text-sm font-semibold" style={{ color: aiStyle.color }}>
                            {aiStyle.name}
                          </span>
                        </div>
                        {result.success && result.scores && (
                          <span className="text-sm font-bold px-2 py-1 rounded-lg" style={{ backgroundColor: `${aiStyle.color}15`, color: aiStyle.color }}>
                            {avgScore}/10
                          </span>
                        )}
                      </div>

                      {result.success && result.tweet ? (
                        <>
                          {/* Tweet Content */}
                          <p className="text-sm text-gray-800 mb-3 leading-relaxed">{result.tweet}</p>

                          {/* Scores */}
                          {result.scores && (
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                                CG: {result.scores.curiosityGap.score}
                              </span>
                              <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                                HB: {result.scores.habituationBypass.score}
                              </span>
                              <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                                PV: {result.scores.predictionViolation.score}
                              </span>
                            </div>
                          )}

                          {/* Footer */}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                            <span className="text-xs text-gray-500">
                              {result.characterCount || result.tweet.length} chars
                              {result.hookType && ` · ${result.hookType}`}
                            </span>
                            <button
                              onClick={() => handleCopy(result.tweet!, idx)}
                              className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors hover:bg-gray-100"
                              style={{ color: aiStyle.color }}
                            >
                              {copiedIndex === idx ? (
                                <>
                                  <Check className="w-4 h-4" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-4 h-4" />
                                  Copy
                                </>
                              )}
                            </button>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-red-500">{result.error || 'Failed to generate'}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-8 bg-gray-900">
                {editContent.length > 0 ? (
                  <div className="w-full max-w-md">
                    <div className="bg-white rounded-xl p-6 shadow-xl">
                      <div
                        className="text-xs font-semibold uppercase tracking-wide mb-3"
                        style={{ color: BRAND_RED }}
                      >
                        {TYPE_LABELS[editType]} Preview
                      </div>
                      <p className="text-sm text-gray-800 leading-relaxed">
                        {editContent.slice(0, 200)}
                        {editContent.length > 200 && '...'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-600 flex items-center justify-center mb-4 mx-auto">
                      <Image className="w-8 h-8 text-gray-500" />
                    </div>
                    <h4 className="text-white text-lg font-medium mb-2">No content yet</h4>
                    <p className="text-gray-400">
                      Start writing to generate suggestions
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Generate Button */}
          <div className="p-6 border-t border-gray-200 bg-white">
            <button
              onClick={handleGenerate}
              disabled={!editContent || editContent.length < 20 || isGenerating}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-medium text-white text-base transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: selectedCreatorId ? CREATORS.find(c => c.id === selectedCreatorId)?.color : BRAND_RED }}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating with 3 AIs...
                </>
              ) : selectedCreatorId ? (
                <>
                  <Sparkles className="w-5 h-5" />
                  {importedStructure
                    ? `Generate with ${CREATORS.find(c => c.id === selectedCreatorId)?.name} + Structure`
                    : `Generate (${CREATORS.find(c => c.id === selectedCreatorId)?.name} Style)`
                  }
                </>
              ) : (
                <>
                  <Lightbulb className="w-5 h-5" />
                  Select Creator First
                </>
              )}
            </button>
            {!selectedCreatorId && editContent.length >= 20 && (
              <p className="text-sm text-center text-gray-500 mt-3">
                Pick a creator style to generate suggestions
                {importedStructure && ' (structure from Pulse will be applied)'}
              </p>
            )}
          </div>
        </div>

      {/* Creator Tweet Selector Modal */}
      <CreatorTweetSelectorModal
        isOpen={showCreatorModal}
        onClose={() => setShowCreatorModal(false)}
        onSelect={handleCreatorSelect}
        selectedCreatorId={selectedCreatorId}
        selectedTweetId={selectedTweetId}
      />
    </div>
  );
}

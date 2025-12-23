'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronLeft, Trash2, MoreHorizontal, Copy, Sparkles, Image, FileText } from 'lucide-react';
import {
  getAllDiaryEntries,
  createDiaryEntry,
  updateDiaryEntry,
  deleteDiaryEntry,
} from '@/lib/db';
import type { DiaryEntry, DiaryEntryType } from '@/types';

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

        {/* RIGHT: Preview/Generation Area */}
        <div className="w-96 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Preview Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">Preview</span>
            <span className="text-xs text-gray-400">4K · 1:1</span>
          </div>

          {/* Preview Content */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-900">
            {editContent.length > 0 ? (
              <div className="w-full h-full flex flex-col">
                {/* Preview Card */}
                <div className="flex-1 flex items-center justify-center">
                  <div className="bg-white rounded-lg p-6 max-w-xs shadow-lg">
                    <div
                      className="text-xs font-semibold uppercase tracking-wide mb-2"
                      style={{ color: BRAND_RED }}
                    >
                      {TYPE_LABELS[editType]}
                    </div>
                    <p className="text-sm text-gray-800 line-clamp-6">
                      {editContent.slice(0, 200)}
                      {editContent.length > 200 && '...'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center mb-4 mx-auto">
                  <Image className="w-6 h-6 text-gray-500" />
                </div>
                <h4 className="text-white font-medium mb-1">No content yet</h4>
                <p className="text-gray-400 text-sm">
                  Start writing to see a preview
                </p>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => onGeneratePost?.(selectedEntry!)}
              disabled={!editContent || editContent.length < 50}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: BRAND_RED }}
            >
              <Sparkles className="w-4 h-4" />
              Generate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

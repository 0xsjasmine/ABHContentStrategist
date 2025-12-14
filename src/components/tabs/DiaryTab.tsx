'use client';

import { useState, useEffect } from 'react';
import { Plus, Sparkles, Trash2, MoreHorizontal, Tag } from 'lucide-react';
import {
  getAllDiaryEntries,
  createDiaryEntry,
  updateDiaryEntry,
  deleteDiaryEntry,
} from '@/lib/db';
import type { DiaryEntry, DiaryEntryType } from '@/types';

const ENTRY_TYPES: { value: DiaryEntryType; label: string; icon: string }[] = [
  { value: 'stories', label: 'Story', icon: '📖' },
  { value: 'builds', label: 'Build', icon: '🔨' },
  { value: 'takes', label: 'Take', icon: '💭' },
  { value: 'reflections', label: 'Reflect', icon: '✨' },
];

interface DiaryTabProps {
  onAnalyzeEntry?: (entry: DiaryEntry) => void;
  onGeneratePost?: (entry: DiaryEntry) => void;
}

export default function DiaryTab({ onGeneratePost }: DiaryTabProps) {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [content, setContent] = useState('');
  const [entryType, setEntryType] = useState<DiaryEntryType | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showTags, setShowTags] = useState(false);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    const allEntries = await getAllDiaryEntries();
    setEntries(allEntries);
  };

  const handleSave = async () => {
    if (!content.trim()) return;

    if (editingId) {
      await updateDiaryEntry(editingId, { content, type: entryType || 'reflections' });
    } else {
      await createDiaryEntry({
        timestamp: new Date().toISOString(),
        content,
        tags: [],
        type: entryType || 'reflections',
      });
    }

    setContent('');
    setIsWriting(false);
    setEditingId(null);
    setEntryType(null);
    setShowTags(false);
    await loadEntries();
  };

  const handleEdit = (entry: DiaryEntry) => {
    setContent(entry.content);
    setEntryType(entry.type);
    setEditingId(entry.id);
    setIsWriting(true);
  };

  const handleDelete = async (id: string) => {
    await deleteDiaryEntry(id);
    await loadEntries();
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTypeLabel = (type: DiaryEntryType) => {
    return ENTRY_TYPES.find(t => t.value === type)?.label || type;
  };

  return (
    <div className="relative min-h-[80vh]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">Diary</h1>
        <p className="text-sm text-[#999] mt-1">Your voice, unfiltered</p>
      </div>

      {/* Writing Area - Notion style */}
      {isWriting ? (
        <div className="card p-6 mb-8 animate-in">
          {/* Clean textarea - no distractions */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind..."
            autoFocus
            className="w-full bg-transparent text-[#1A1A1A] placeholder:text-[#999] text-base resize-none focus:outline-none min-h-[250px] leading-relaxed"
          />

          {/* Bottom bar with tags + save */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#EEE]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsWriting(false);
                  setContent('');
                  setEditingId(null);
                  setEntryType(null);
                  setShowTags(false);
                }}
                className="text-sm text-[#999] hover:text-[#1A1A1A]"
              >
                Cancel
              </button>

              {/* Tag selector */}
              <div className="relative ml-4">
                <button
                  onClick={() => setShowTags(!showTags)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    entryType
                      ? 'bg-[#1A1A1A] text-white'
                      : 'bg-[#F5F5F5] text-[#666] hover:text-[#1A1A1A]'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  {entryType ? getTypeLabel(entryType) : 'Add tag'}
                </button>

                {/* Tag dropdown */}
                {showTags && (
                  <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-lg border border-[#EEE] p-2 min-w-[140px] z-10">
                    {ENTRY_TYPES.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => {
                          setEntryType(type.value);
                          setShowTags(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                          entryType === type.value
                            ? 'bg-[#F5F5F5] text-[#1A1A1A]'
                            : 'text-[#666] hover:bg-[#FAFAFA]'
                        }`}
                      >
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={!content.trim()}
              className="btn-primary disabled:opacity-50"
            >
              {editingId ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      ) : null}

      {/* Entries Stream */}
      <div className="space-y-3">
        {entries.length === 0 && !isWriting ? (
          <div className="text-center py-20">
            <p className="text-[#999] mb-4">Your thoughts become content</p>
            <button
              onClick={() => setIsWriting(true)}
              className="btn-secondary"
            >
              Start writing
            </button>
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="group card-hover p-5 cursor-pointer"
              onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
            >
              {/* Entry Content first */}
              <p
                className={`text-[#1A1A1A] leading-relaxed mb-3 ${
                  expandedId === entry.id ? '' : 'line-clamp-3'
                }`}
              >
                {entry.content}
              </p>

              {/* Footer with date, tag, actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#999]">
                    {formatDate(entry.timestamp)}
                  </span>
                  {entry.type && (
                    <span className="text-xs bg-[#F5F5F5] text-[#666] px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span>{ENTRY_TYPES.find(t => t.value === entry.type)?.icon}</span>
                      {getTypeLabel(entry.type)}
                    </span>
                  )}
                </div>

                {/* Actions - show on hover */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onGeneratePost?.(entry);
                    }}
                    className="p-2 rounded-lg hover:bg-[#F5F5F5] transition-colors"
                    title="Generate post"
                  >
                    <Sparkles className="w-4 h-4 text-[#666]" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(entry);
                    }}
                    className="p-2 rounded-lg hover:bg-[#F5F5F5] transition-colors"
                    title="Edit"
                  >
                    <MoreHorizontal className="w-4 h-4 text-[#666]" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(entry.id);
                    }}
                    className="p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-[#999] hover:text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button */}
      {!isWriting && entries.length > 0 && (
        <button
          onClick={() => setIsWriting(true)}
          className="fab"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Plus, Sparkles, Trash2, MoreHorizontal } from 'lucide-react';
import {
  getAllDiaryEntries,
  createDiaryEntry,
  updateDiaryEntry,
  deleteDiaryEntry,
} from '@/lib/db';
import type { DiaryEntry, DiaryEntryType } from '@/types';

const ENTRY_TYPES: { value: DiaryEntryType; label: string }[] = [
  { value: 'stories', label: 'Story' },
  { value: 'builds', label: 'Build' },
  { value: 'takes', label: 'Take' },
  { value: 'reflections', label: 'Reflect' },
];

interface DiaryTabProps {
  onAnalyzeEntry?: (entry: DiaryEntry) => void;
  onGeneratePost?: (entry: DiaryEntry) => void;
}

export default function DiaryTab({ onGeneratePost }: DiaryTabProps) {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [content, setContent] = useState('');
  const [entryType, setEntryType] = useState<DiaryEntryType>('reflections');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      await updateDiaryEntry(editingId, { content, type: entryType });
    } else {
      await createDiaryEntry({
        timestamp: new Date().toISOString(),
        content,
        tags: [],
        type: entryType,
      });
    }

    setContent('');
    setIsWriting(false);
    setEditingId(null);
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

  return (
    <div className="relative min-h-[80vh]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">Diary</h1>
        <p className="text-sm text-[#999] mt-1">Your voice, unfiltered</p>
      </div>

      {/* Writing Area */}
      {isWriting ? (
        <div className="card p-6 mb-8 animate-in">
          {/* Type Pills */}
          <div className="flex gap-2 mb-4">
            {ENTRY_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setEntryType(type.value)}
                className={`
                  px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
                  ${entryType === type.value
                    ? 'bg-[#1A1A1A] text-white'
                    : 'bg-[#F5F5F5] text-[#666] hover:text-[#1A1A1A]'
                  }
                `}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Textarea */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind..."
            autoFocus
            className="w-full bg-transparent text-[#1A1A1A] placeholder:text-[#999] text-base resize-none focus:outline-none min-h-[200px] leading-relaxed"
          />

          {/* Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#EEE]">
            <button
              onClick={() => {
                setIsWriting(false);
                setContent('');
                setEditingId(null);
              }}
              className="text-sm text-[#666] hover:text-[#1A1A1A]"
            >
              Cancel
            </button>
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
              {/* Entry Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#999]">
                    {formatDate(entry.timestamp)}
                  </span>
                  <span className="text-xs bg-[#F5F5F5] text-[#666] px-2 py-0.5 rounded">
                    {entry.type}
                  </span>
                </div>

                {/* Actions - show on hover */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onGeneratePost?.(entry);
                    }}
                    className="p-2 rounded-lg hover:bg-[#F5F5F5] transition-colors"
                    title="Generate"
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

              {/* Entry Content */}
              <p
                className={`text-[#1A1A1A] leading-relaxed ${
                  expandedId === entry.id ? '' : 'line-clamp-3'
                }`}
              >
                {entry.content}
              </p>

              {/* Expand indicator */}
              {entry.content.length > 200 && expandedId !== entry.id && (
                <span className="text-xs text-[#999] mt-2 inline-block">
                  tap to expand
                </span>
              )}
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

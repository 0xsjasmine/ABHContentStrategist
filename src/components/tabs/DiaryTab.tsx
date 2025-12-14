'use client';

import { useState, useEffect } from 'react';
import { Plus, Sparkles, Trash2, MoreHorizontal, X } from 'lucide-react';
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
        <h1 className="text-2xl font-light text-[#2D2A26] mb-1">Diary</h1>
        <p className="text-sm text-[#9C958E] font-light">Your voice, unfiltered</p>
      </div>

      {/* Writing Area */}
      {isWriting ? (
        <div className="glass rounded-3xl p-6 mb-8 animate-slide-up">
          {/* Type Pills */}
          <div className="flex gap-2 mb-4">
            {ENTRY_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setEntryType(type.value)}
                className={`
                  px-4 py-1.5 rounded-full text-sm font-light transition-all
                  ${entryType === type.value
                    ? 'bg-gradient-to-r from-[#C4A484] to-[#E8D4CF] text-white'
                    : 'glass-subtle text-[#6B6560] hover:text-[#2D2A26]'
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
            className="w-full bg-transparent text-[#2D2A26] placeholder:text-[#9C958E] text-lg font-light resize-none focus:outline-none min-h-[200px] leading-relaxed"
          />

          {/* Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
            <button
              onClick={() => {
                setIsWriting(false);
                setContent('');
                setEditingId(null);
              }}
              className="text-sm text-[#9C958E] hover:text-[#2D2A26] font-light"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!content.trim()}
              className="px-6 py-2 bg-gradient-to-r from-[#C4A484] to-[#E8D4CF] text-white text-sm font-light rounded-full hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {editingId ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      ) : null}

      {/* Entries Stream */}
      <div className="space-y-4">
        {entries.length === 0 && !isWriting ? (
          <div className="text-center py-20">
            <p className="text-[#9C958E] font-light mb-4">Your thoughts become content</p>
            <button
              onClick={() => setIsWriting(true)}
              className="px-6 py-2.5 glass hover-lift rounded-full text-sm font-light text-[#2D2A26]"
            >
              Start writing
            </button>
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.id}
              className="group glass-subtle hover-lift rounded-2xl p-5 cursor-pointer"
              onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
            >
              {/* Entry Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#9C958E] font-light">
                    {formatDate(entry.timestamp)}
                  </span>
                  <span className="pill pill-warm">{entry.type}</span>
                </div>

                {/* Actions - show on hover */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onGeneratePost?.(entry);
                    }}
                    className="p-2 rounded-full hover:bg-white/50 transition-colors"
                    title="Generate"
                  >
                    <Sparkles className="w-4 h-4 text-[#C4A484]" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(entry);
                    }}
                    className="p-2 rounded-full hover:bg-white/50 transition-colors"
                    title="Edit"
                  >
                    <MoreHorizontal className="w-4 h-4 text-[#9C958E]" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(entry.id);
                    }}
                    className="p-2 rounded-full hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-[#9C958E] hover:text-red-400" />
                  </button>
                </div>
              </div>

              {/* Entry Content */}
              <p
                className={`text-[#2D2A26] font-light leading-relaxed ${
                  expandedId === entry.id ? '' : 'line-clamp-3'
                }`}
              >
                {entry.content}
              </p>

              {/* Expand indicator */}
              {entry.content.length > 200 && expandedId !== entry.id && (
                <span className="text-xs text-[#C4A484] mt-2 inline-block">
                  tap to expand
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {/* Floating Action Button */}
      {!isWriting && (
        <button
          onClick={() => setIsWriting(true)}
          className="fab glass-strong bg-gradient-to-r from-[#C4A484] to-[#E8D4CF] text-white hover:scale-105 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}

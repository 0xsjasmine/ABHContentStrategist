'use client';

import { useState, useEffect } from 'react';
import { Plus, MessageCircle, Copy, Check, Trash2, X, Sparkles } from 'lucide-react';
import { getAllDiaryEntries } from '@/lib/db';
import type { DiaryEntry, ReplyStyle } from '@/types';

const STYLES: { value: ReplyStyle; label: string }[] = [
  { value: 'supportive-add-value', label: 'Add value' },
  { value: 'vulnerable-relatable', label: 'Relatable' },
  { value: 'sharp-challenge', label: 'Challenge' },
  { value: 'thought-leadership', label: 'Lead' },
];

interface ReplyTarget {
  id: string;
  author: string;
  text: string;
  style: ReplyStyle;
  replies?: string[];
}

export default function ReplyTab() {
  const [targets, setTargets] = useState<ReplyTarget[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // Form
  const [author, setAuthor] = useState('');
  const [text, setText] = useState('');
  const [style, setStyle] = useState<ReplyStyle>('supportive-add-value');

  useEffect(() => {
    loadDiary();
  }, []);

  const loadDiary = async () => {
    const entries = await getAllDiaryEntries();
    setDiaryEntries(entries);
  };

  const handleAdd = () => {
    if (!author.trim() || !text.trim()) return;

    const newTarget: ReplyTarget = {
      id: `reply_${Date.now()}`,
      author: author.startsWith('@') ? author : `@${author}`,
      text,
      style,
      replies: generateMockReplies(),
    };

    setTargets([...targets, newTarget]);
    resetForm();
  };

  const generateMockReplies = () => [
    "This resonates. The best insights come from genuine curiosity, not chasing trends.",
    "Love this take. What made you realize this?",
    "Exactly this. Most people miss the nuance here.",
  ];

  const resetForm = () => {
    setAuthor('');
    setText('');
    setStyle('supportive-add-value');
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    setTargets(targets.filter(t => t.id !== id));
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="relative min-h-[80vh]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">Reply</h1>
        <p className="text-sm text-[#999] mt-1">Engage authentically</p>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="card p-6 mb-8 animate-in">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-medium text-[#1A1A1A]">Add post to reply</h2>
            <button onClick={resetForm} className="p-1 hover:bg-[#F5F5F5] rounded-lg">
              <X className="w-4 h-4 text-[#999]" />
            </button>
          </div>

          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="@creator"
            className="w-full px-4 py-2.5 border border-[#EEE] rounded-xl text-sm focus:outline-none focus:border-[#1A1A1A] mb-4"
          />

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste their post..."
            className="w-full bg-transparent text-[#1A1A1A] placeholder:text-[#999] resize-none focus:outline-none min-h-[100px] mb-4"
          />

          <div className="mb-4">
            <p className="text-xs text-[#999] mb-2">Reply style</p>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStyle(s.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    style === s.value
                      ? 'bg-[#1A1A1A] text-white'
                      : 'bg-[#F5F5F5] text-[#666] hover:text-[#1A1A1A]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleAdd}
              disabled={!author.trim() || !text.trim()}
              className="btn-primary disabled:opacity-50 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Generate replies
            </button>
          </div>
        </div>
      )}

      {/* Targets */}
      <div className="space-y-4">
        {targets.length === 0 && !isAdding ? (
          <div className="text-center py-20">
            <MessageCircle className="w-12 h-12 text-[#DDD] mx-auto mb-4" />
            <p className="text-[#999] mb-4">Strategic replies, rooted in your voice</p>
            <button
              onClick={() => setIsAdding(true)}
              className="btn-secondary"
            >
              Add a post
            </button>
          </div>
        ) : (
          targets.map((target) => (
            <div key={target.id} className="card p-5">
              {/* Original post */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#1A1A1A]">{target.author}</span>
                  <span className="text-xs bg-[#F5F5F5] text-[#666] px-2 py-0.5 rounded">
                    {STYLES.find(s => s.value === target.style)?.label}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(target.id)}
                  className="p-1 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4 text-[#999] hover:text-red-500" />
                </button>
              </div>
              <p className="text-[#666] text-sm mb-4 line-clamp-2">{target.text}</p>

              {/* Generated replies */}
              {target.replies && (
                <div className="space-y-2 pt-4 border-t border-[#EEE]">
                  <p className="text-xs text-[#999] mb-2">Reply options</p>
                  {target.replies.map((reply, i) => (
                    <div
                      key={i}
                      className="flex items-start justify-between gap-3 p-3 bg-[#FAFAFA] rounded-xl"
                    >
                      <p className="text-sm text-[#1A1A1A] flex-1">{reply}</p>
                      <button
                        onClick={() => handleCopy(reply, `${target.id}-${i}`)}
                        className="p-2 hover:bg-white rounded-lg flex-shrink-0"
                      >
                        {copiedIndex === `${target.id}-${i}` ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-[#999]" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      {!isAdding && targets.length > 0 && (
        <button
          onClick={() => setIsAdding(true)}
          className="fab"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}

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
        <h1 className="text-2xl font-light text-[#2D2A26] mb-1">Reply</h1>
        <p className="text-sm text-[#9C958E] font-light">Engage authentically</p>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="glass rounded-3xl p-6 mb-8 animate-slide-up">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-light text-[#2D2A26]">Add post to reply</h2>
            <button onClick={resetForm} className="p-1 hover:bg-white/50 rounded-full">
              <X className="w-4 h-4 text-[#9C958E]" />
            </button>
          </div>

          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="@creator"
            className="w-full px-4 py-2.5 glass-subtle rounded-2xl text-sm font-light focus:outline-none mb-4"
          />

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste their post..."
            className="w-full bg-transparent text-[#2D2A26] placeholder:text-[#9C958E] font-light resize-none focus:outline-none min-h-[100px] mb-4"
          />

          <div className="mb-4">
            <p className="text-xs text-[#9C958E] mb-2 font-light">Reply style</p>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStyle(s.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-light transition-all ${
                    style === s.value
                      ? 'bg-[#C4A484] text-white'
                      : 'glass-subtle text-[#6B6560] hover:text-[#2D2A26]'
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
              className="px-6 py-2 bg-gradient-to-r from-[#C4A484] to-[#E8D4CF] text-white text-sm font-light rounded-full hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Generate replies
            </button>
          </div>
        </div>
      )}

      {/* Targets */}
      <div className="space-y-6">
        {targets.length === 0 && !isAdding ? (
          <div className="text-center py-20">
            <MessageCircle className="w-12 h-12 text-[#E8D4CF] mx-auto mb-4" />
            <p className="text-[#9C958E] font-light mb-4">Strategic replies, rooted in your voice</p>
            <button
              onClick={() => setIsAdding(true)}
              className="px-6 py-2.5 glass hover-lift rounded-full text-sm font-light text-[#2D2A26]"
            >
              Add a post
            </button>
          </div>
        ) : (
          targets.map((target) => (
            <div key={target.id} className="glass-subtle rounded-2xl p-5">
              {/* Original post */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-sm font-light text-[#2D2A26]">{target.author}</span>
                  <span className="pill pill-warm ml-2">{STYLES.find(s => s.value === target.style)?.label}</span>
                </div>
                <button
                  onClick={() => handleDelete(target.id)}
                  className="p-1 hover:bg-red-50 rounded-full"
                >
                  <Trash2 className="w-4 h-4 text-[#9C958E] hover:text-red-400" />
                </button>
              </div>
              <p className="text-[#6B6560] font-light text-sm mb-4 line-clamp-2">{target.text}</p>

              {/* Generated replies */}
              {target.replies && (
                <div className="space-y-2 pt-4 border-t border-white/20">
                  <p className="text-xs text-[#9C958E] font-light mb-2">Reply options</p>
                  {target.replies.map((reply, i) => (
                    <div
                      key={i}
                      className="flex items-start justify-between gap-3 p-3 glass rounded-xl"
                    >
                      <p className="text-sm text-[#2D2A26] font-light flex-1">{reply}</p>
                      <button
                        onClick={() => handleCopy(reply, `${target.id}-${i}`)}
                        className="p-2 hover:bg-white/50 rounded-full flex-shrink-0"
                      >
                        {copiedIndex === `${target.id}-${i}` ? (
                          <Check className="w-4 h-4 text-[#B8C4B8]" />
                        ) : (
                          <Copy className="w-4 h-4 text-[#9C958E]" />
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
          className="fab glass-strong bg-gradient-to-r from-[#C4A484] to-[#E8D4CF] text-white hover:scale-105 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Plus, ExternalLink, Trash2, X } from 'lucide-react';
import {
  getAllSavedPosts,
  createSavedPost,
  deleteSavedPost,
} from '@/lib/db';
import type { SavedPost } from '@/types';

const FORMAT_OPTIONS = ['thread', 'single', 'story', 'hot-take', 'listicle'];
const VIBE_OPTIONS = ['sharp', 'warm', 'vulnerable', 'witty', 'bold'];

export default function CreatorTab() {
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [url, setUrl] = useState('');
  const [format, setFormat] = useState('');
  const [vibe, setVibe] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    const all = await getAllSavedPosts();
    setPosts(all);
  };

  const handleSave = async () => {
    if (!text.trim() || !author.trim()) return;

    await createSavedPost({
      text,
      url: url || undefined,
      author: author.startsWith('@') ? author : `@${author}`,
      savedDate: new Date().toISOString(),
      tags: {
        topic: [],
        creator: [author.startsWith('@') ? author : `@${author}`],
        format: format ? [format] : [],
        vibe: vibe ? [vibe] : [],
      },
      highlights: [],
      notes,
    });

    resetForm();
    await loadPosts();
  };

  const resetForm = () => {
    setText('');
    setAuthor('');
    setUrl('');
    setFormat('');
    setVibe('');
    setNotes('');
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    await deleteSavedPost(id);
    await loadPosts();
  };

  return (
    <div className="relative min-h-[80vh]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-light text-[#2D2A26] mb-1">Inspiration</h1>
        <p className="text-sm text-[#9C958E] font-light">Posts that resonate</p>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="glass rounded-3xl p-6 mb-8 animate-slide-up">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-light text-[#2D2A26]">Save a post</h2>
            <button onClick={resetForm} className="p-1 hover:bg-white/50 rounded-full">
              <X className="w-4 h-4 text-[#9C958E]" />
            </button>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the post..."
            className="w-full bg-transparent text-[#2D2A26] placeholder:text-[#9C958E] font-light resize-none focus:outline-none min-h-[120px] mb-4"
          />

          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="@creator"
              className="px-4 py-2.5 glass-subtle rounded-2xl text-sm font-light focus:outline-none"
            />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Link (optional)"
              className="px-4 py-2.5 glass-subtle rounded-2xl text-sm font-light focus:outline-none"
            />
          </div>

          {/* Format & Vibe */}
          <div className="mb-4">
            <p className="text-xs text-[#9C958E] mb-2 font-light">Format</p>
            <div className="flex flex-wrap gap-2">
              {FORMAT_OPTIONS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(format === f ? '' : f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-light transition-all ${
                    format === f
                      ? 'bg-[#C4A484] text-white'
                      : 'glass-subtle text-[#6B6560] hover:text-[#2D2A26]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs text-[#9C958E] mb-2 font-light">Vibe</p>
            <div className="flex flex-wrap gap-2">
              {VIBE_OPTIONS.map((v) => (
                <button
                  key={v}
                  onClick={() => setVibe(vibe === v ? '' : v)}
                  className={`px-3 py-1.5 rounded-full text-xs font-light transition-all ${
                    vibe === v
                      ? 'bg-[#B8C4B8] text-white'
                      : 'glass-subtle text-[#6B6560] hover:text-[#2D2A26]'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Why does this resonate? (optional)"
            className="w-full bg-transparent text-[#2D2A26] placeholder:text-[#9C958E] text-sm font-light resize-none focus:outline-none h-16 mb-4"
          />

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={!text.trim() || !author.trim()}
              className="px-6 py-2 bg-gradient-to-r from-[#C4A484] to-[#E8D4CF] text-white text-sm font-light rounded-full hover:opacity-90 disabled:opacity-50 transition-all"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-4">
        {posts.length === 0 && !isAdding ? (
          <div className="text-center py-20">
            <p className="text-[#9C958E] font-light mb-4">Collect posts that inspire you</p>
            <button
              onClick={() => setIsAdding(true)}
              className="px-6 py-2.5 glass hover-lift rounded-full text-sm font-light text-[#2D2A26]"
            >
              Add first post
            </button>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="group glass-subtle hover-lift rounded-2xl p-5 cursor-pointer"
              onClick={() => setExpandedId(expandedId === post.id ? null : post.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-light text-[#2D2A26]">{post.author}</span>
                  {post.tags.format.map((f) => (
                    <span key={f} className="pill pill-warm">{f}</span>
                  ))}
                  {post.tags.vibe.map((v) => (
                    <span key={v} className="pill pill-sage">{v}</span>
                  ))}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {post.url && (
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-full hover:bg-white/50"
                    >
                      <ExternalLink className="w-4 h-4 text-[#9C958E]" />
                    </a>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(post.id);
                    }}
                    className="p-2 rounded-full hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 text-[#9C958E] hover:text-red-400" />
                  </button>
                </div>
              </div>

              <p className={`text-[#2D2A26] font-light leading-relaxed ${
                expandedId === post.id ? '' : 'line-clamp-3'
              }`}>
                {post.text}
              </p>

              {post.notes && expandedId === post.id && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-sm text-[#6B6560] font-light italic">{post.notes}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      {!isAdding && (
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

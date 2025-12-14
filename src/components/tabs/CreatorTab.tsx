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
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">Inspiration</h1>
        <p className="text-sm text-[#999] mt-1">Posts that resonate</p>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="card p-6 mb-8 animate-in">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-medium text-[#1A1A1A]">Save a post</h2>
            <button onClick={resetForm} className="p-1 hover:bg-[#F5F5F5] rounded-lg">
              <X className="w-4 h-4 text-[#999]" />
            </button>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the post..."
            className="w-full bg-transparent text-[#1A1A1A] placeholder:text-[#999] resize-none focus:outline-none min-h-[120px] mb-4"
          />

          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="@creator"
              className="px-4 py-2.5 border border-[#EEE] rounded-xl text-sm focus:outline-none focus:border-[#1A1A1A]"
            />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Link (optional)"
              className="px-4 py-2.5 border border-[#EEE] rounded-xl text-sm focus:outline-none focus:border-[#1A1A1A]"
            />
          </div>

          {/* Format & Vibe */}
          <div className="mb-4">
            <p className="text-xs text-[#999] mb-2">Format</p>
            <div className="flex flex-wrap gap-2">
              {FORMAT_OPTIONS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(format === f ? '' : f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    format === f
                      ? 'bg-[#1A1A1A] text-white'
                      : 'bg-[#F5F5F5] text-[#666] hover:text-[#1A1A1A]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs text-[#999] mb-2">Vibe</p>
            <div className="flex flex-wrap gap-2">
              {VIBE_OPTIONS.map((v) => (
                <button
                  key={v}
                  onClick={() => setVibe(vibe === v ? '' : v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    vibe === v
                      ? 'bg-[#1A1A1A] text-white'
                      : 'bg-[#F5F5F5] text-[#666] hover:text-[#1A1A1A]'
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
            className="w-full bg-transparent text-[#1A1A1A] placeholder:text-[#999] text-sm resize-none focus:outline-none h-16 mb-4"
          />

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={!text.trim() || !author.trim()}
              className="btn-primary disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Posts */}
      <div className="space-y-3">
        {posts.length === 0 && !isAdding ? (
          <div className="text-center py-20">
            <p className="text-[#999] mb-4">Collect posts that inspire you</p>
            <button
              onClick={() => setIsAdding(true)}
              className="btn-secondary"
            >
              Add first post
            </button>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="group card-hover p-5 cursor-pointer"
              onClick={() => setExpandedId(expandedId === post.id ? null : post.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-[#1A1A1A]">{post.author}</span>
                  {post.tags.format.map((f) => (
                    <span key={f} className="text-xs bg-[#F5F5F5] text-[#666] px-2 py-0.5 rounded">{f}</span>
                  ))}
                  {post.tags.vibe.map((v) => (
                    <span key={v} className="text-xs bg-[#F5F5F5] text-[#666] px-2 py-0.5 rounded">{v}</span>
                  ))}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {post.url && (
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-lg hover:bg-[#F5F5F5]"
                    >
                      <ExternalLink className="w-4 h-4 text-[#999]" />
                    </a>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(post.id);
                    }}
                    className="p-2 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 text-[#999] hover:text-red-500" />
                  </button>
                </div>
              </div>

              <p className={`text-[#1A1A1A] leading-relaxed ${
                expandedId === post.id ? '' : 'line-clamp-3'
              }`}>
                {post.text}
              </p>

              {post.notes && expandedId === post.id && (
                <div className="mt-4 pt-4 border-t border-[#EEE]">
                  <p className="text-sm text-[#666] italic">{post.notes}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      {!isAdding && posts.length > 0 && (
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

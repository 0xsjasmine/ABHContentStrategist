'use client';

import { useState, useEffect } from 'react';
import { Plus, Link as LinkIcon, Trash2, Filter, User } from 'lucide-react';
import { Button, Card, Badge, TagInput, Modal } from '@/components/ui';
import { TextArea, Input } from '@/components/ui/Input';
import {
  getAllSavedPosts,
  createSavedPost,
  deleteSavedPost,
} from '@/lib/db';
import type { SavedPost } from '@/types';
import { FORMAT_TAG_PRESETS, VIBE_TAG_PRESETS } from '@/types';

export default function CreatorTab() {
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<SavedPost | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [filterFormat, setFilterFormat] = useState<string>('');
  const [filterVibe, setFilterVibe] = useState<string>('');

  // Form state
  const [newText, setNewText] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newTopicTags, setNewTopicTags] = useState<string[]>([]);
  const [newFormatTags, setNewFormatTags] = useState<string[]>([]);
  const [newVibeTags, setNewVibeTags] = useState<string[]>([]);
  const [newHighlights, setNewHighlights] = useState<string[]>([]);
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    const allPosts = await getAllSavedPosts();
    setPosts(allPosts);
  };

  const handleSave = async () => {
    if (!newText.trim() || !newAuthor.trim()) return;

    await createSavedPost({
      text: newText,
      url: newUrl || undefined,
      author: newAuthor.startsWith('@') ? newAuthor : `@${newAuthor}`,
      savedDate: new Date().toISOString(),
      tags: {
        topic: newTopicTags,
        creator: [newAuthor.startsWith('@') ? newAuthor : `@${newAuthor}`],
        format: newFormatTags,
        vibe: newVibeTags,
      },
      highlights: newHighlights,
      notes: newNotes,
    });

    // Reset form
    setNewText('');
    setNewUrl('');
    setNewAuthor('');
    setNewTopicTags([]);
    setNewFormatTags([]);
    setNewVibeTags([]);
    setNewHighlights([]);
    setNewNotes('');
    setIsAddingNew(false);

    await loadPosts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this saved post?')) return;
    await deleteSavedPost(id);
    if (selectedPost?.id === id) setSelectedPost(null);
    await loadPosts();
  };

  const filteredPosts = posts.filter((post) => {
    if (filterFormat && !post.tags.format.includes(filterFormat)) return false;
    if (filterVibe && !post.tags.vibe.includes(filterVibe)) return false;
    return true;
  });

  const uniqueFormats = [...new Set(posts.flatMap((p) => p.tags.format))];
  const uniqueVibes = [...new Set(posts.flatMap((p) => p.tags.vibe))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">
            Creator Inspiration
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Save posts that resonate + build your format library
          </p>
        </div>
        <Button onClick={() => setIsAddingNew(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Save Post
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-neutral-500" />
          <select
            value={filterFormat}
            onChange={(e) => setFilterFormat(e.target.value)}
            className="text-sm border border-neutral-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-500"
          >
            <option value="">All formats</option>
            {uniqueFormats.map((format) => (
              <option key={format} value={format}>
                {format}
              </option>
            ))}
          </select>
          <select
            value={filterVibe}
            onChange={(e) => setFilterVibe(e.target.value)}
            className="text-sm border border-neutral-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-500"
          >
            <option value="">All vibes</option>
            {uniqueVibes.map((vibe) => (
              <option key={vibe} value={vibe}>
                {vibe}
              </option>
            ))}
          </select>
        </div>
        <span className="text-sm text-neutral-500">
          {filteredPosts.length} posts
        </span>
      </div>

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-neutral-500">No saved posts yet</p>
          <p className="text-sm text-neutral-400 mt-1">
            Save posts from X that inspire you
          </p>
          <Button className="mt-4" onClick={() => setIsAddingNew(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Save Your First Post
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPosts.map((post) => (
            <Card
              key={post.id}
              hover
              className="cursor-pointer"
              onClick={() => setSelectedPost(post)}
            >
              {/* Author */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-neutral-500" />
                </div>
                <span className="font-medium text-neutral-900">{post.author}</span>
              </div>

              {/* Text Preview */}
              <p className="text-sm text-neutral-700 line-clamp-4 mb-3">
                {post.text}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-3">
                {post.tags.format.map((tag) => (
                  <Badge key={tag} size="sm" variant="primary">
                    {tag}
                  </Badge>
                ))}
                {post.tags.vibe.map((tag) => (
                  <Badge key={tag} size="sm" variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* URL & Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                {post.url ? (
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-neutral-500 hover:text-neutral-700 flex items-center gap-1"
                  >
                    <LinkIcon className="w-3 h-3" />
                    View on X
                  </a>
                ) : (
                  <span />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(post.id);
                  }}
                  className="p-1 text-neutral-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add New Post Modal */}
      <Modal
        isOpen={isAddingNew}
        onClose={() => setIsAddingNew(false)}
        title="Save Inspiration Post"
        description="Save a post that resonates with you"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsAddingNew(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!newText.trim() || !newAuthor.trim()}>
              Save Post
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <TextArea
            label="Post Text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Paste the post text here..."
            rows={5}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Author"
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              placeholder="@creator_name"
            />
            <Input
              label="URL (optional)"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://x.com/..."
            />
          </div>

          <TagInput
            label="Topic Tags"
            tags={newTopicTags}
            onTagsChange={setNewTopicTags}
            placeholder="Add topic tags..."
          />

          <TagInput
            label="Format Tags"
            tags={newFormatTags}
            onTagsChange={setNewFormatTags}
            placeholder="Add format tags..."
            suggestions={FORMAT_TAG_PRESETS as unknown as string[]}
          />

          <TagInput
            label="Vibe Tags"
            tags={newVibeTags}
            onTagsChange={setNewVibeTags}
            placeholder="Add vibe tags..."
            suggestions={VIBE_TAG_PRESETS as unknown as string[]}
          />

          <TextArea
            label="Notes"
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="Why does this resonate? How would you adapt it?"
            rows={3}
            hint="Personal annotations about structure, hooks, or what you love about this post"
          />
        </div>
      </Modal>

      {/* Post Detail Modal */}
      {selectedPost && (
        <Modal
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          title={selectedPost.author}
          size="lg"
        >
          <div className="space-y-4">
            <div className="bg-neutral-50 rounded-lg p-4">
              <p className="text-neutral-900 whitespace-pre-wrap">{selectedPost.text}</p>
            </div>

            {selectedPost.url && (
              <a
                href={selectedPost.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                <LinkIcon className="w-4 h-4" />
                View original on X
              </a>
            )}

            <div>
              <h4 className="text-sm font-medium text-neutral-700 mb-2">Format</h4>
              <div className="flex flex-wrap gap-1">
                {selectedPost.tags.format.map((tag) => (
                  <Badge key={tag} variant="primary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-neutral-700 mb-2">Vibe</h4>
              <div className="flex flex-wrap gap-1">
                {selectedPost.tags.vibe.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {selectedPost.highlights.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-neutral-700 mb-2">
                  Highlights
                </h4>
                <ul className="list-disc list-inside text-sm text-neutral-600 space-y-1">
                  {selectedPost.highlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedPost.notes && (
              <div>
                <h4 className="text-sm font-medium text-neutral-700 mb-2">
                  Your Notes
                </h4>
                <p className="text-sm text-neutral-600 bg-amber-50 rounded-lg p-3 border border-amber-100">
                  {selectedPost.notes}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

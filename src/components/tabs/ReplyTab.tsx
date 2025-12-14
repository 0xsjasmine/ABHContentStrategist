'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  MessageCircle,
  Trash2,
  Send,
  Copy,
  Check,
  Link as LinkIcon,
} from 'lucide-react';
import { Button, Card, Badge, Modal } from '@/components/ui';
import { TextArea, Input } from '@/components/ui/Input';
import { getAllDiaryEntries } from '@/lib/db';
import type { DiaryEntry, ReplyStyle } from '@/types';

const REPLY_STYLES: { value: ReplyStyle; label: string; description: string }[] = [
  {
    value: 'supportive-add-value',
    label: 'Supportive + Add Value',
    description: 'Agree and add your insight',
  },
  {
    value: 'vulnerable-relatable',
    label: 'Vulnerable + Relatable',
    description: 'Share a similar experience',
  },
  {
    value: 'sharp-challenge',
    label: 'Sharp Challenge',
    description: 'Respectfully push back',
  },
  {
    value: 'thought-leadership',
    label: 'Thought Leadership',
    description: 'Position your unique POV',
  },
  {
    value: 'join-conversation',
    label: 'Join Conversation',
    description: 'Simple engagement',
  },
];

interface ReplyTarget {
  id: string;
  author: string;
  text: string;
  url?: string;
  style: ReplyStyle;
  connectedDiaryId?: string;
  generatedReplies?: { text: string; style: string }[];
}

export default function ReplyTab() {
  const [targets, setTargets] = useState<ReplyTarget[]>([]);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<ReplyTarget | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [newAuthor, setNewAuthor] = useState('');
  const [newText, setNewText] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newStyle, setNewStyle] = useState<ReplyStyle>('supportive-add-value');
  const [newDiaryId, setNewDiaryId] = useState('');

  useEffect(() => {
    loadDiaryEntries();
  }, []);

  const loadDiaryEntries = async () => {
    const entries = await getAllDiaryEntries();
    setDiaryEntries(entries);
  };

  const handleAddTarget = () => {
    if (!newAuthor.trim() || !newText.trim()) return;

    const newTarget: ReplyTarget = {
      id: `reply_${Date.now()}`,
      author: newAuthor.startsWith('@') ? newAuthor : `@${newAuthor}`,
      text: newText,
      url: newUrl || undefined,
      style: newStyle,
      connectedDiaryId: newDiaryId || undefined,
    };

    setTargets([...targets, newTarget]);

    // Reset form
    setNewAuthor('');
    setNewText('');
    setNewUrl('');
    setNewStyle('supportive-add-value');
    setNewDiaryId('');
    setIsAddingNew(false);
  };

  const handleDeleteTarget = (id: string) => {
    setTargets(targets.filter((t) => t.id !== id));
    if (selectedTarget?.id === id) setSelectedTarget(null);
  };

  const handleGenerateReplies = async (target: ReplyTarget) => {
    // This would call the Claude API - for now, show mock replies
    const mockReplies = [
      {
        text: `Love this take, ${target.author}. One thing I'd add: the best wins aren't just about the outcome, they're about what you learn along the way.`,
        style: 'supportive-add-value',
      },
      {
        text: `This resonates. I've been there - shipping something after months of grinding hits different. What surprised you most about the journey?`,
        style: 'vulnerable-relatable',
      },
      {
        text: `The real question isn't whether it was worth it - it's what you're going to do differently next time. Growth > grind.`,
        style: 'thought-leadership',
      },
    ];

    setTargets(
      targets.map((t) =>
        t.id === target.id ? { ...t, generatedReplies: mockReplies } : t
      )
    );
    setSelectedTarget({ ...target, generatedReplies: mockReplies });
  };

  const handleCopyReply = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const connectedDiary = selectedTarget?.connectedDiaryId
    ? diaryEntries.find((d) => d.id === selectedTarget.connectedDiaryId)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Reply Girl</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Generate authentic replies rooted in your diary voice
          </p>
        </div>
        <Button onClick={() => setIsAddingNew(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Post to Reply
        </Button>
      </div>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <MessageCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">How it works</h3>
            <ol className="text-sm text-blue-700 mt-1 list-decimal list-inside space-y-1">
              <li>Paste posts you want to reply to</li>
              <li>Connect a diary entry for authentic substance</li>
              <li>Choose your reply style</li>
              <li>Generate and customize replies</li>
            </ol>
          </div>
        </div>
      </Card>

      {/* Targets List */}
      {targets.length === 0 ? (
        <Card className="text-center py-12">
          <MessageCircle className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500">No posts to reply to yet</p>
          <p className="text-sm text-neutral-400 mt-1">
            Add posts from X that you want to engage with
          </p>
          <Button className="mt-4" onClick={() => setIsAddingNew(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Post
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {targets.map((target) => (
            <Card key={target.id}>
              {/* Author */}
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-neutral-900">{target.author}</span>
                <div className="flex items-center gap-2">
                  <Badge size="sm" variant="outline">
                    {REPLY_STYLES.find((s) => s.value === target.style)?.label}
                  </Badge>
                  <button
                    onClick={() => handleDeleteTarget(target.id)}
                    className="p-1 text-neutral-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Post Text */}
              <p className="text-sm text-neutral-700 line-clamp-3 mb-3">
                {target.text}
              </p>

              {/* Connected Diary */}
              {target.connectedDiaryId && (
                <div className="text-xs text-neutral-500 mb-3">
                  Connected to diary entry
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                {target.url && (
                  <a
                    href={target.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-neutral-500 hover:text-neutral-700 flex items-center gap-1"
                  >
                    <LinkIcon className="w-3 h-3" />
                    View
                  </a>
                )}
                <Button
                  size="sm"
                  onClick={() => {
                    handleGenerateReplies(target);
                  }}
                >
                  <Send className="w-4 h-4 mr-1" />
                  Generate Replies
                </Button>
              </div>

              {/* Generated Replies */}
              {target.generatedReplies && target.generatedReplies.length > 0 && (
                <div className="mt-3 pt-3 border-t border-neutral-100 space-y-2">
                  {target.generatedReplies.map((reply, i) => (
                    <div
                      key={i}
                      className="bg-neutral-50 rounded-lg p-3 flex items-start justify-between gap-2"
                    >
                      <div className="flex-1">
                        <Badge size="sm" variant="outline" className="mb-1">
                          {reply.style}
                        </Badge>
                        <p className="text-sm text-neutral-700">{reply.text}</p>
                      </div>
                      <button
                        onClick={() => handleCopyReply(reply.text, `${target.id}-${i}`)}
                        className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
                      >
                        {copiedId === `${target.id}-${i}` ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add New Target Modal */}
      <Modal
        isOpen={isAddingNew}
        onClose={() => setIsAddingNew(false)}
        title="Add Post to Reply"
        description="Paste a post you want to engage with"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsAddingNew(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddTarget}
              disabled={!newAuthor.trim() || !newText.trim()}
            >
              Add Post
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Author"
            value={newAuthor}
            onChange={(e) => setNewAuthor(e.target.value)}
            placeholder="@creator_name"
          />

          <TextArea
            label="Post Text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Paste the post text here..."
            rows={4}
          />

          <Input
            label="URL (optional)"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://x.com/..."
          />

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Reply Style
            </label>
            <select
              value={newStyle}
              onChange={(e) => setNewStyle(e.target.value as ReplyStyle)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500"
            >
              {REPLY_STYLES.map((style) => (
                <option key={style.value} value={style.value}>
                  {style.label} - {style.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Connect Diary Entry (optional)
            </label>
            <select
              value={newDiaryId}
              onChange={(e) => setNewDiaryId(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500"
            >
              <option value="">No diary connection</option>
              {diaryEntries.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.content.substring(0, 60)}...
                </option>
              ))}
            </select>
            <p className="text-xs text-neutral-500 mt-1">
              Connect a diary entry to give your replies authentic substance
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

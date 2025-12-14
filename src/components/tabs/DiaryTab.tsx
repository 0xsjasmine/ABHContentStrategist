'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Save, Trash2, Sparkles, Clock, Tag } from 'lucide-react';
import { Button, Card, Badge, TagInput } from '@/components/ui';
import {
  getAllDiaryEntries,
  createDiaryEntry,
  updateDiaryEntry,
  deleteDiaryEntry,
} from '@/lib/db';
import type { DiaryEntry, DiaryEntryType, DiaryAnalysis } from '@/types';
import { DIARY_TAG_PRESETS } from '@/types';

const ENTRY_TYPES: { value: DiaryEntryType; label: string; description: string }[] = [
  { value: 'stories', label: 'Stories', description: 'Personal experiences, trade-offs, seasons' },
  { value: 'builds', label: 'Builds', description: 'What AI helped with + what it freed up' },
  { value: 'takes', label: 'Takes', description: 'Hot takes, bets, predictions' },
  { value: 'reflections', label: 'Reflections', description: 'Lessons, growth, costs' },
];

interface DiaryTabProps {
  onAnalyzeEntry?: (entry: DiaryEntry) => void;
  onGeneratePost?: (entry: DiaryEntry) => void;
}

export default function DiaryTab({ onAnalyzeEntry, onGeneratePost }: DiaryTabProps) {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [entryType, setEntryType] = useState<DiaryEntryType>('reflections');
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Load entries on mount
  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    const allEntries = await getAllDiaryEntries();
    setEntries(allEntries);
  };

  const handleNewEntry = () => {
    setSelectedEntry(null);
    setContent('');
    setTags([]);
    setEntryType('reflections');
    setIsEditing(true);
  };

  const handleSelectEntry = (entry: DiaryEntry) => {
    setSelectedEntry(entry);
    setContent(entry.content);
    setTags(entry.tags);
    setEntryType(entry.type);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!content.trim()) return;

    setIsSaving(true);
    try {
      if (selectedEntry) {
        // Update existing
        await updateDiaryEntry(selectedEntry.id, {
          content,
          tags,
          type: entryType,
        });
      } else {
        // Create new
        const newEntry = await createDiaryEntry({
          timestamp: new Date().toISOString(),
          content,
          tags,
          type: entryType,
        });
        setSelectedEntry(newEntry);
      }
      await loadEntries();
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEntry) return;
    if (!confirm('Are you sure you want to delete this entry?')) return;

    await deleteDiaryEntry(selectedEntry.id);
    setSelectedEntry(null);
    setContent('');
    setTags([]);
    await loadEntries();
  };

  const handleAnalyze = async () => {
    if (!selectedEntry) return;
    setIsAnalyzing(true);
    try {
      onAnalyzeEntry?.(selectedEntry);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-180px)]">
      {/* Left Sidebar - Entry List */}
      <div className="w-72 flex-shrink-0 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">Diary Entries</h2>
          <Button size="sm" onClick={handleNewEntry}>
            <Plus className="w-4 h-4 mr-1" />
            New
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {entries.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <p className="text-sm">No entries yet</p>
              <p className="text-xs mt-1">Click &quot;New&quot; to start writing</p>
            </div>
          ) : (
            entries.map((entry) => (
              <Card
                key={entry.id}
                hover
                padding="sm"
                onClick={() => handleSelectEntry(entry)}
                className={`cursor-pointer ${
                  selectedEntry?.id === entry.id
                    ? 'ring-2 ring-neutral-900'
                    : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-neutral-900 line-clamp-2">
                      {entry.content.substring(0, 100)}
                      {entry.content.length > 100 ? '...' : ''}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-neutral-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(entry.timestamp)}
                      </span>
                    </div>
                    {entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {entry.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} size="sm" variant="outline">
                            {tag}
                          </Badge>
                        ))}
                        {entry.tags.length > 3 && (
                          <Badge size="sm" variant="outline">
                            +{entry.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  {entry.analysis && (
                    <Badge
                      size="sm"
                      variant={
                        entry.analysis.contentPotential >= 8
                          ? 'success'
                          : entry.analysis.contentPotential >= 5
                          ? 'warning'
                          : 'default'
                      }
                    >
                      {entry.analysis.contentPotential}/10
                    </Badge>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Main Content Area - Editor */}
      <div className="flex-1 flex flex-col">
        {!selectedEntry && !isEditing ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                Your diary is the foundation
              </h3>
              <p className="text-neutral-500 max-w-md">
                Raw thoughts here become high-performing posts. Write freely -
                your voice carries 70% weight in every generation.
              </p>
              <Button className="mt-4" onClick={handleNewEntry}>
                <Plus className="w-4 h-4 mr-2" />
                Start Writing
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Editor Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <select
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value as DiaryEntryType)}
                  disabled={!isEditing}
                  className="text-sm border border-neutral-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-500 disabled:bg-neutral-50"
                >
                  {ENTRY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {selectedEntry && !isEditing && (
                  <span className="text-sm text-neutral-500">
                    {formatDate(selectedEntry.timestamp)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedEntry && !isEditing && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDelete}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
                {isEditing && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (selectedEntry) {
                          handleSelectEntry(selectedEntry);
                        } else {
                          setIsEditing(false);
                          setContent('');
                          setTags([]);
                        }
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      loading={isSaving}
                      disabled={!content.trim()}
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Editor Area */}
            <Card className="flex-1 flex flex-col overflow-hidden" padding="none">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your thoughts here... Be messy, be real. This is your space."
                disabled={!isEditing}
                className="flex-1 w-full p-4 text-neutral-900 placeholder:text-neutral-400 resize-none focus:outline-none disabled:bg-neutral-50 disabled:cursor-default"
                style={{ minHeight: '300px' }}
              />

              {/* Tags Section */}
              <div className="border-t border-neutral-100 p-4">
                {isEditing ? (
                  <TagInput
                    tags={tags}
                    onTagsChange={setTags}
                    placeholder="Add tags..."
                    suggestions={DIARY_TAG_PRESETS as unknown as string[]}
                    label="Tags"
                  />
                ) : (
                  <div>
                    <span className="text-sm font-medium text-neutral-700 flex items-center gap-1 mb-2">
                      <Tag className="w-4 h-4" />
                      Tags
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {tags.length > 0 ? (
                        tags.map((tag) => (
                          <Badge key={tag}>{tag}</Badge>
                        ))
                      ) : (
                        <span className="text-sm text-neutral-400">No tags</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Analysis & Generation Actions */}
            {selectedEntry && !isEditing && (
              <div className="mt-4 flex items-center justify-between">
                <div>
                  {selectedEntry.analysis && (
                    <AnalysisPreview analysis={selectedEntry.analysis} />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={handleAnalyze}
                    loading={isAnalyzing}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze Entry
                  </Button>
                  <Button onClick={() => onGeneratePost?.(selectedEntry)}>
                    Generate Post
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function AnalysisPreview({ analysis }: { analysis: DiaryAnalysis }) {
  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-neutral-500">Potential:</span>
        <Badge
          variant={
            analysis.contentPotential >= 8
              ? 'success'
              : analysis.contentPotential >= 5
              ? 'warning'
              : 'default'
          }
        >
          {analysis.contentPotential}/10
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-neutral-500">Voice:</span>
        <span className="text-neutral-900">
          {analysis.voice.ambitious}% ambitious / {analysis.voice.human}% human
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-neutral-500">Tone:</span>
        <Badge variant="outline">{analysis.emotionalTone}</Badge>
      </div>
    </div>
  );
}

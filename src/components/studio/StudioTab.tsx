'use client';

import { useState, useEffect, useCallback } from 'react';
import type { TweetDraft, VoiceTraining } from '@/types/database';

// Define VoiceTraining type locally if not exported
interface VoiceTrainingItem {
  id: string;
  example_tweet: string;
  source: 'generated' | 'manual' | 'posted';
  approved: boolean | null;
  feedback_notes: string | null;
  patterns_to_replicate: string[] | null;
  created_at: string;
}

// Icons
const PenIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
  </svg>
);

const CopyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const draftTypeLabels = {
  single: 'Single Tweet',
  thread: 'Thread',
  reply: 'Reply',
  quote_tweet: 'Quote Tweet',
};

const statusStyles = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700' },
  approved: { bg: 'bg-green-100', text: 'text-green-700' },
  posted: { bg: 'bg-blue-100', text: 'text-blue-700' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700' },
};

interface StudioTabProps {}

export default function StudioTab({}: StudioTabProps) {
  const [activeTab, setActiveTab] = useState<'generate' | 'drafts' | 'voice'>('generate');
  const [drafts, setDrafts] = useState<TweetDraft[]>([]);
  const [voiceExamples, setVoiceExamples] = useState<VoiceTrainingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generation state
  const [prompt, setPrompt] = useState('');
  const [generatedDraft, setGeneratedDraft] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Voice training state
  const [newExample, setNewExample] = useState('');
  const [isAddingExample, setIsAddingExample] = useState(false);

  // Fetch drafts
  const fetchDrafts = useCallback(async () => {
    try {
      const res = await fetch('/api/studio/drafts');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setDrafts(data.drafts || []);
    } catch (err) {
      console.error('Error fetching drafts:', err);
    }
  }, []);

  // Fetch voice examples
  const fetchVoiceExamples = useCallback(async () => {
    try {
      const res = await fetch('/api/studio/voice');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setVoiceExamples(data.examples || []);
    } catch (err) {
      console.error('Error fetching voice examples:', err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'drafts') {
      fetchDrafts();
    } else if (activeTab === 'voice') {
      fetchVoiceExamples();
    }
  }, [activeTab, fetchDrafts, fetchVoiceExamples]);

  // Generate tweet
  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedDraft('');

    try {
      const res = await fetch('/api/studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Generation failed');
      }

      const data = await res.json();
      setGeneratedDraft(data.draft || '');
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save draft
  const handleSaveDraft = async () => {
    if (!generatedDraft.trim()) return;

    try {
      const res = await fetch('/api/studio/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draft_text: generatedDraft,
          draft_type: 'single',
          status: 'draft',
        }),
      });

      if (!res.ok) throw new Error('Failed to save');

      setGeneratedDraft('');
      setPrompt('');
      setActiveTab('drafts');
      await fetchDrafts();
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save draft');
    }
  };

  // Copy to clipboard
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // Update draft status
  const handleUpdateDraftStatus = async (id: string, status: TweetDraft['status']) => {
    try {
      const res = await fetch(`/api/studio/drafts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error('Failed to update');
      await fetchDrafts();
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  // Delete draft
  const handleDeleteDraft = async (id: string) => {
    try {
      const res = await fetch(`/api/studio/drafts/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');
      await fetchDrafts();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Add voice example
  const handleAddVoiceExample = async () => {
    if (!newExample.trim()) return;

    setIsAddingExample(true);
    try {
      const res = await fetch('/api/studio/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          example_tweet: newExample.trim(),
          source: 'manual',
          approved: true,
        }),
      });

      if (!res.ok) throw new Error('Failed to add');

      setNewExample('');
      await fetchVoiceExamples();
    } catch (err) {
      console.error('Add error:', err);
      setError('Failed to add example');
    } finally {
      setIsAddingExample(false);
    }
  };

  // Delete voice example
  const handleDeleteVoiceExample = async (id: string) => {
    try {
      const res = await fetch(`/api/studio/voice/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');
      await fetchVoiceExamples();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--burgundy)', color: 'white' }}>
            <PenIcon />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">TWEET STUDIO</h2>
            <p className="text-sm text-gray-500">Create & train your voice</p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
        {[
          { id: 'generate', label: 'Generate' },
          { id: 'drafts', label: 'Drafts' },
          { id: 'voice', label: 'Voice Training' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Generate Tab */}
      {activeTab === 'generate' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">What do you want to tweet about?</h3>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., A thread about why community is the real competitive advantage in the AI era..."
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy outline-none resize-none"
            />

            <div className="flex justify-end mt-4">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                <SparklesIcon />
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>

          {/* Generated Draft */}
          {generatedDraft && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Generated Draft</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(generatedDraft)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                    title="Copy to clipboard"
                  >
                    {copied ? <CheckIcon /> : <CopyIcon />}
                  </button>
                  <button
                    onClick={handleGenerate}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                    title="Regenerate"
                  >
                    <RefreshIcon />
                  </button>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl whitespace-pre-wrap text-gray-800">
                {generatedDraft}
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setGeneratedDraft('')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Discard
                </button>
                <button
                  onClick={handleSaveDraft}
                  className="btn-primary text-sm"
                >
                  Save as Draft
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Drafts Tab */}
      {activeTab === 'drafts' && (
        <div className="space-y-4">
          {drafts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--soft-pink)', color: 'var(--burgundy)' }}>
                <PenIcon />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No drafts yet</h3>
              <p className="text-gray-500 mb-4">Generate some tweets to see them here</p>
              <button
                onClick={() => setActiveTab('generate')}
                className="btn-primary"
              >
                Start Generating
              </button>
            </div>
          ) : (
            drafts.map((draft) => (
              <div key={draft.id} className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusStyles[draft.status].bg} ${statusStyles[draft.status].text}`}>
                      {draft.status.charAt(0).toUpperCase() + draft.status.slice(1)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {draftTypeLabels[draft.draft_type]}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(draft.created_at).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-gray-800 whitespace-pre-wrap mb-4">{draft.draft_text}</p>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {draft.status === 'draft' && (
                      <>
                        <button
                          onClick={() => handleUpdateDraftStatus(draft.id, 'approved')}
                          className="text-xs px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 flex items-center gap-1"
                        >
                          <CheckIcon /> Approve
                        </button>
                        <button
                          onClick={() => handleUpdateDraftStatus(draft.id, 'rejected')}
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 flex items-center gap-1"
                        >
                          <XIcon /> Reject
                        </button>
                      </>
                    )}
                    {draft.status === 'approved' && (
                      <button
                        onClick={() => handleUpdateDraftStatus(draft.id, 'posted')}
                        className="text-xs px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200"
                      >
                        Mark as Posted
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopy(draft.draft_text)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                    >
                      <CopyIcon />
                    </button>
                    <button
                      onClick={() => handleDeleteDraft(draft.id)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-red-500"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Voice Training Tab */}
      {activeTab === 'voice' && (
        <div className="space-y-4">
          {/* Add Example */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Train Your Voice</h3>
            <p className="text-sm text-gray-500 mb-4">
              Add examples of tweets that sound like you. The more examples you add, the better the AI will capture your voice.
            </p>

            <textarea
              value={newExample}
              onChange={(e) => setNewExample(e.target.value)}
              placeholder="Paste a tweet that represents your voice..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy outline-none resize-none"
            />

            <div className="flex justify-end mt-4">
              <button
                onClick={handleAddVoiceExample}
                disabled={isAddingExample || !newExample.trim()}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {isAddingExample ? 'Adding...' : 'Add Example'}
              </button>
            </div>
          </div>

          {/* Examples List */}
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
            <div className="px-6 py-4">
              <h3 className="font-semibold text-gray-900">Voice Examples ({voiceExamples.length})</h3>
            </div>

            {voiceExamples.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No voice examples yet. Add some to train the AI!
              </div>
            ) : (
              voiceExamples.map((example) => (
                <div key={example.id} className="px-6 py-4 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-gray-800 text-sm">{example.example_tweet}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400">
                        {example.source === 'manual' ? 'Added manually' : example.source === 'posted' ? 'From posted tweet' : 'Generated'}
                      </span>
                      {example.approved && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <CheckIcon /> Approved
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteVoiceExample(example.id)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-red-500"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

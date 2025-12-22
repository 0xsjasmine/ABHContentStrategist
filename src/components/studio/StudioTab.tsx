'use client';

import { useState, useEffect, useCallback } from 'react';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import type { TweetDraft } from '@/types/database';
import { Send, Sparkles, Copy, Check, RefreshCw, Trash2 } from 'lucide-react';

const studioTabs = [
  { id: 'generate', label: 'Generate' },
  { id: 'drafts', label: 'Drafts' },
  { id: 'voice', label: 'Voice' },
];

const suggestionChips = [
  'A thread about community over competition',
  'Hot take on AI replacing creativity',
  'Personal story about a recent win',
  'Reflection on building in public',
];

interface VoiceExample {
  id: string;
  example_tweet: string;
  source: string;
  approved: boolean | null;
  created_at: string;
}

export default function StudioTab() {
  const [activeTab, setActiveTab] = useState('generate');
  const [drafts, setDrafts] = useState<TweetDraft[]>([]);
  const [voiceExamples, setVoiceExamples] = useState<VoiceExample[]>([]);

  // Generation state
  const [prompt, setPrompt] = useState('');
  const [generatedDraft, setGeneratedDraft] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Voice state
  const [newExample, setNewExample] = useState('');
  const [isAddingExample, setIsAddingExample] = useState(false);

  // Fetch data
  const fetchDrafts = useCallback(async () => {
    try {
      const res = await fetch('/api/studio/drafts');
      if (res.ok) {
        const data = await res.json();
        setDrafts(data.drafts || []);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  }, []);

  const fetchVoiceExamples = useCallback(async () => {
    try {
      const res = await fetch('/api/studio/voice');
      if (res.ok) {
        const data = await res.json();
        setVoiceExamples(data.examples || []);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'drafts') fetchDrafts();
    if (activeTab === 'voice') fetchVoiceExamples();
  }, [activeTab, fetchDrafts, fetchVoiceExamples]);

  // Generate
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGeneratedDraft('');

    try {
      const res = await fetch('/api/studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedDraft(data.draft || '');
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy
  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Save draft
  const handleSaveDraft = async () => {
    if (!generatedDraft.trim()) return;
    try {
      await fetch('/api/studio/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft_text: generatedDraft, draft_type: 'single', status: 'draft' }),
      });
      setGeneratedDraft('');
      setPrompt('');
      setActiveTab('drafts');
      fetchDrafts();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  // Delete draft
  const handleDeleteDraft = async (id: string) => {
    try {
      await fetch(`/api/studio/drafts/${id}`, { method: 'DELETE' });
      fetchDrafts();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  // Add voice example
  const handleAddVoiceExample = async () => {
    if (!newExample.trim()) return;
    setIsAddingExample(true);
    try {
      await fetch('/api/studio/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ example_tweet: newExample.trim(), source: 'manual', approved: true }),
      });
      setNewExample('');
      fetchVoiceExamples();
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsAddingExample(false);
    }
  };

  // Delete voice example
  const handleDeleteVoiceExample = async (id: string) => {
    try {
      await fetch(`/api/studio/voice/${id}`, { method: 'DELETE' });
      fetchVoiceExamples();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-semibold text-gray-900">Studio</h1>

      {/* Tabs */}
      <SegmentedTabs tabs={studioTabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Generate Tab - Search First Design */}
      {activeTab === 'generate' && (
        <div className="max-w-2xl mx-auto pt-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-semibold text-gray-900 mb-2">
              What do you want to <span style={{ color: 'var(--burgundy)' }}>tweet</span>?
            </h2>
            <p className="text-gray-500">Describe your idea and we'll craft it in your voice</p>
          </div>

          {/* Search Input */}
          <div className="relative mb-6">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="A thread about..."
              className="w-full px-5 py-4 pr-14 text-lg border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:border-gray-300"
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              {isGenerating ? (
                <RefreshCw className="w-5 h-5 text-gray-600 animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>

          {/* Suggestion Chips */}
          {!generatedDraft && (
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-3">Try something like</p>
              <div className="flex flex-wrap justify-center gap-2">
                {suggestionChips.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setPrompt(chip)}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Generated Result */}
          {generatedDraft && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Sparkles className="w-4 h-4" />
                  Generated
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleCopy(generatedDraft)} className="p-2 hover:bg-gray-100 rounded-lg">
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
                  </button>
                  <button onClick={handleGenerate} className="p-2 hover:bg-gray-100 rounded-lg">
                    <RefreshCw className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
              <p className="text-gray-800 whitespace-pre-wrap mb-4">{generatedDraft}</p>
              <div className="flex gap-2">
                <button onClick={() => setGeneratedDraft('')} className="flex-1 btn-secondary">Discard</button>
                <button onClick={handleSaveDraft} className="flex-1 btn-primary">Save Draft</button>
              </div>
            </div>
          )}

          <p className="text-center text-xs text-gray-400 mt-8">Powered by Claude</p>
        </div>
      )}

      {/* Drafts Tab */}
      {activeTab === 'drafts' && (
        <div className="space-y-4">
          {drafts.length === 0 ? (
            <div className="text-center py-20">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No drafts yet</h3>
              <p className="text-gray-500 mb-6">Generate some tweets to see them here.</p>
              <button onClick={() => setActiveTab('generate')} className="btn-primary">
                Start Generating
              </button>
            </div>
          ) : (
            drafts.map((draft) => (
              <div key={draft.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    draft.status === 'approved' ? 'bg-green-100 text-green-700' :
                    draft.status === 'posted' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {draft.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(draft.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-800 whitespace-pre-wrap mb-4">{draft.draft_text}</p>
                <div className="flex justify-end gap-2">
                  <button onClick={() => handleCopy(draft.draft_text)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <Copy className="w-4 h-4 text-gray-500" />
                  </button>
                  <button onClick={() => handleDeleteDraft(draft.id)} className="p-2 hover:bg-gray-100 rounded-lg">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Voice Tab */}
      {activeTab === 'voice' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-medium text-gray-900 mb-2">Train Your Voice</h3>
            <p className="text-sm text-gray-500 mb-4">Add tweets that represent your voice to improve generation.</p>
            <textarea
              value={newExample}
              onChange={(e) => setNewExample(e.target.value)}
              placeholder="Paste a tweet that sounds like you..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg resize-none mb-3"
            />
            <button
              onClick={handleAddVoiceExample}
              disabled={isAddingExample || !newExample.trim()}
              className="btn-primary disabled:opacity-50"
            >
              {isAddingExample ? 'Adding...' : 'Add Example'}
            </button>
          </div>

          <div>
            <h3 className="font-medium text-gray-900 mb-4">Voice Examples ({voiceExamples.length})</h3>
            {voiceExamples.length === 0 ? (
              <p className="text-gray-500 text-sm">No examples yet. Add some to train the AI.</p>
            ) : (
              <div className="space-y-3">
                {voiceExamples.map((ex) => (
                  <div key={ex.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-4">
                    <p className="text-sm text-gray-700 flex-1">{ex.example_tweet}</p>
                    <button onClick={() => handleDeleteVoiceExample(ex.id)} className="p-1 hover:bg-gray-100 rounded">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

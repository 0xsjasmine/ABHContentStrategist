'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  TrendingUp,
  PenSquare,
  Palette,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import { Button, Card, Badge, Modal } from '@/components/ui';
import { getAllBookQuotes, getAllSavedPosts } from '@/lib/db';
import type {
  DiaryEntry,
  BookQuote,
  SavedPost,
  GenerationCombination,
  GeneratedPost,
} from '@/types';

interface GenerationPanelProps {
  diaryEntry: DiaryEntry;
  isOpen: boolean;
  onClose: () => void;
}

export default function GenerationPanel({
  diaryEntry,
  isOpen,
  onClose,
}: GenerationPanelProps) {
  const [step, setStep] = useState<'analyze' | 'combine' | 'generate'>('analyze');
  const [bookQuotes, setBookQuotes] = useState<BookQuote[]>([]);
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [trendHook, setTrendHook] = useState('');
  const [combinations, setCombinations] = useState<GenerationCombination[]>([]);
  const [selectedCombination, setSelectedCombination] = useState<GenerationCombination | null>(null);
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadResources();
      setStep('analyze');
      setCombinations([]);
      setSelectedCombination(null);
      setGeneratedPost(null);
    }
  }, [isOpen]);

  const loadResources = async () => {
    const [quotes, posts] = await Promise.all([
      getAllBookQuotes(),
      getAllSavedPosts(),
    ]);
    setBookQuotes(quotes);
    setSavedPosts(posts);
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diaryEntry,
          bookQuotes: bookQuotes.filter((q) => selectedQuotes.includes(q.id)),
          savedPosts: selectedFormat ? savedPosts.filter((p) => p.id === selectedFormat) : [],
          trendHook: trendHook || undefined,
        }),
      });

      if (!response.ok) throw new Error('Analysis failed');

      const data = await response.json();
      setCombinations(data.combinations);
      setStep('combine');
    } catch (error) {
      console.error('Analysis error:', error);
      // Create fallback combinations
      setCombinations([
        {
          id: 'pure_diary',
          title: 'Pure Diary Voice',
          storytellingScore: 8,
          timingScore: 5,
          naturalFitScore: 10,
          totalScore: 7.7,
          elements: {
            diary: {
              insight: diaryEntry.content.substring(0, 200),
              keyPhrases: [],
            },
          },
          whyCombination: ['Most authentic - 100% your voice'],
        },
      ]);
      setStep('combine');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedCombination) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diaryEntry,
          combination: selectedCombination,
          bookQuote: selectedCombination.elements.library
            ? bookQuotes.find((q) => selectedQuotes.includes(q.id))
            : undefined,
          formatPost: selectedCombination.elements.format
            ? savedPosts.find((p) => p.id === selectedFormat)
            : undefined,
        }),
      });

      if (!response.ok) throw new Error('Generation failed');

      const data = await response.json();
      setGeneratedPost(data);
      setStep('generate');
    } catch (error) {
      console.error('Generation error:', error);
      // Create fallback post
      setGeneratedPost({
        id: `gen_${Date.now()}`,
        content: diaryEntry.content.length > 280
          ? diaryEntry.content.substring(0, 277) + '...'
          : diaryEntry.content,
        sources: [
          {
            type: 'diary',
            content: diaryEntry.content,
            addedValue: 'foundation',
          },
        ],
        voiceCheck: {
          diaryVoicePercentage: 100,
          ambitiousHumanSplit: { ambitious: 30, human: 70 },
        },
        whyThisWorks: ['Pure diary voice - most authentic'],
        characterCount: Math.min(diaryEntry.content.length, 280),
        createdAt: new Date().toISOString(),
      });
      setStep('generate');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedPost) return;
    await navigator.clipboard.writeText(generatedPost.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    setStep('combine');
    setGeneratedPost(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Post"
      size="xl"
    >
      <div className="min-h-[500px]">
        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-6">
          {(['analyze', 'combine', 'generate'] as const).map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${step === s
                    ? 'bg-neutral-900 text-white'
                    : i < ['analyze', 'combine', 'generate'].indexOf(step)
                    ? 'bg-green-500 text-white'
                    : 'bg-neutral-200 text-neutral-500'
                  }
                `}
              >
                {i + 1}
              </div>
              {i < 2 && (
                <div
                  className={`w-16 h-0.5 ${
                    i < ['analyze', 'combine', 'generate'].indexOf(step)
                      ? 'bg-green-500'
                      : 'bg-neutral-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Analyze & Select Resources */}
        {step === 'analyze' && (
          <div className="space-y-6">
            {/* Diary Preview */}
            <Card>
              <div className="flex items-start gap-3">
                <PenSquare className="w-5 h-5 text-neutral-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-neutral-900 mb-2">
                    Your Diary Entry (70% Foundation)
                  </h3>
                  <p className="text-sm text-neutral-600 line-clamp-4">
                    {diaryEntry.content}
                  </p>
                  {diaryEntry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {diaryEntry.tags.map((tag) => (
                        <Badge key={tag} size="sm">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Book Quotes Selection */}
            <div>
              <h3 className="font-medium text-neutral-900 flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5" />
                Add Depth from Library (Optional)
              </h3>
              {bookQuotes.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  No quotes saved yet. Add quotes in the Books tab.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                  {bookQuotes.map((quote) => (
                    <label
                      key={quote.id}
                      className={`
                        flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                        ${selectedQuotes.includes(quote.id)
                          ? 'border-neutral-900 bg-neutral-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={selectedQuotes.includes(quote.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedQuotes([...selectedQuotes, quote.id]);
                          } else {
                            setSelectedQuotes(selectedQuotes.filter((id) => id !== quote.id));
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-neutral-700 italic line-clamp-2">
                          &ldquo;{quote.quote}&rdquo;
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">
                          {quote.author} - {quote.bookTitle}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Format Selection */}
            <div>
              <h3 className="font-medium text-neutral-900 flex items-center gap-2 mb-3">
                <Palette className="w-5 h-5" />
                Apply Format Structure (Optional)
              </h3>
              {savedPosts.length === 0 ? (
                <p className="text-sm text-neutral-500">
                  No format examples saved yet. Add posts in the Creator tab.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                  {savedPosts.map((post) => (
                    <label
                      key={post.id}
                      className={`
                        flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                        ${selectedFormat === post.id
                          ? 'border-neutral-900 bg-neutral-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name="format"
                        checked={selectedFormat === post.id}
                        onChange={() => setSelectedFormat(post.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-neutral-700 line-clamp-2">
                          {post.text}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
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
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {selectedFormat && (
                <button
                  onClick={() => setSelectedFormat(null)}
                  className="text-sm text-neutral-500 hover:text-neutral-700 mt-2"
                >
                  Clear selection
                </button>
              )}
            </div>

            {/* Trend Hook */}
            <div>
              <h3 className="font-medium text-neutral-900 flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5" />
                Add Trend Hook (Optional)
              </h3>
              <input
                type="text"
                value={trendHook}
                onChange={(e) => setTrendHook(e.target.value)}
                placeholder="e.g., AI agents, burnout culture..."
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500"
              />
              <p className="text-xs text-neutral-500 mt-1">
                What&apos;s trending that connects to your diary entry?
              </p>
            </div>

            {/* Analyze Button */}
            <div className="flex justify-end">
              <Button onClick={handleAnalyze} loading={isLoading}>
                <Sparkles className="w-4 h-4 mr-2" />
                Find Best Combinations
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Choose Combination */}
        {step === 'combine' && (
          <div className="space-y-4">
            <h3 className="font-medium text-neutral-900">
              Choose a Combination
            </h3>
            <p className="text-sm text-neutral-500">
              Select how to combine your diary entry with other elements
            </p>

            <div className="space-y-3">
              {combinations.map((combo) => (
                <Card
                  key={combo.id}
                  hover
                  className={`cursor-pointer ${
                    selectedCombination?.id === combo.id
                      ? 'ring-2 ring-neutral-900'
                      : ''
                  }`}
                  onClick={() => setSelectedCombination(combo)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-neutral-900">
                          {combo.title}
                        </h4>
                        <Badge variant="outline">
                          Score: {combo.totalScore.toFixed(1)}/10
                        </Badge>
                      </div>

                      {/* Elements Preview */}
                      <div className="space-y-2 text-sm">
                        <p className="text-neutral-600">
                          <span className="font-medium">📝 Diary:</span>{' '}
                          {combo.elements.diary.insight.substring(0, 100)}...
                        </p>
                        {combo.elements.library && (
                          <p className="text-neutral-600">
                            <span className="font-medium">📚 Library:</span>{' '}
                            {combo.elements.library.author} quote → {combo.elements.library.addedDepth}
                          </p>
                        )}
                        {combo.elements.grok && (
                          <p className="text-neutral-600">
                            <span className="font-medium">🔥 Trend:</span>{' '}
                            {combo.elements.grok.trend} ({combo.elements.grok.urgency} urgency)
                          </p>
                        )}
                        {combo.elements.format && (
                          <p className="text-neutral-600">
                            <span className="font-medium">🎨 Format:</span>{' '}
                            {combo.elements.format.creator} - {combo.elements.format.vibe}
                          </p>
                        )}
                      </div>

                      {/* Why */}
                      <div className="mt-3">
                        <p className="text-xs text-neutral-500">Why this works:</p>
                        <ul className="text-xs text-neutral-600 list-disc list-inside">
                          {combo.whyCombination.map((reason, i) => (
                            <li key={i}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <input
                      type="radio"
                      checked={selectedCombination?.id === combo.id}
                      onChange={() => setSelectedCombination(combo)}
                      className="mt-1"
                    />
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep('analyze')}>
                Back
              </Button>
              <Button
                onClick={handleGenerate}
                loading={isLoading}
                disabled={!selectedCombination}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Post
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Generated Post */}
        {step === 'generate' && generatedPost && (
          <div className="space-y-4">
            {/* Transparent Sourcing */}
            <Card className="bg-neutral-50">
              <h4 className="font-medium text-neutral-900 mb-3">
                🔗 What I&apos;m Pulling
              </h4>
              <div className="space-y-2 text-sm">
                {generatedPost.sources.map((source, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="font-medium">
                      {source.type === 'diary' && '📝'}
                      {source.type === 'library' && '📚'}
                      {source.type === 'creator' && '🎨'}
                      {source.type === 'grok' && '🔥'}
                    </span>
                    <div>
                      <p className="text-neutral-700">
                        <span className="uppercase text-xs font-medium text-neutral-500">
                          {source.type}:
                        </span>{' '}
                        {source.content.substring(0, 100)}...
                      </p>
                      {source.addedValue && (
                        <p className="text-neutral-500 text-xs">
                          → {source.addedValue}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Generated Post */}
            <Card>
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-medium text-neutral-900">
                  💡 Generated Post
                </h4>
                <Badge variant={generatedPost.characterCount <= 280 ? 'success' : 'warning'}>
                  {generatedPost.characterCount} chars
                </Badge>
              </div>
              <div className="bg-white border border-neutral-200 rounded-lg p-4">
                <p className="text-neutral-900 whitespace-pre-wrap">
                  {generatedPost.content}
                </p>
              </div>
            </Card>

            {/* Voice Check */}
            <Card>
              <h4 className="font-medium text-neutral-900 mb-3">
                📊 Voice Check
              </h4>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-neutral-500">Diary voice:</span>{' '}
                  <span className="font-medium text-neutral-900">
                    {generatedPost.voiceCheck.diaryVoicePercentage}%
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500">Split:</span>{' '}
                  <span className="font-medium text-neutral-900">
                    {generatedPost.voiceCheck.ambitiousHumanSplit.ambitious}% ambitious /{' '}
                    {generatedPost.voiceCheck.ambitiousHumanSplit.human}% human
                  </span>
                </div>
              </div>
            </Card>

            {/* Why This Works */}
            <Card>
              <h4 className="font-medium text-neutral-900 mb-2">
                Why This Works
              </h4>
              <ul className="text-sm text-neutral-600 list-disc list-inside space-y-1">
                {generatedPost.whyThisWorks.map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            </Card>

            {/* Actions */}
            <div className="flex justify-between">
              <Button variant="ghost" onClick={handleRegenerate}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Different Combination
              </Button>
              <Button onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

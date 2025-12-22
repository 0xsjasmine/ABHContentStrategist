'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Link2,
  Sparkles,
  Radio,
  Target,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Heart,
  MessageCircle,
  Repeat2,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Wand2
} from 'lucide-react';
import type { TweetAnalysis, AIAnalysis } from '@/types';

// Status tags for analyzed tweets
const STATUS_TAGS = [
  { label: 'Decoded', color: 'bg-purple-500' },
  { label: 'Dissected', color: 'bg-blue-500' },
  { label: 'Cracked', color: 'bg-green-500' },
  { label: 'Unpacked', color: 'bg-orange-500' },
  { label: 'In Session', color: 'bg-pink-500' },
];

function getRandomTag() {
  return STATUS_TAGS[Math.floor(Math.random() * STATUS_TAGS.length)];
}

function ScoreBadge({ score }: { score: number }) {
  const getColor = (s: number) => {
    if (s >= 8) return 'bg-green-100 text-green-700 border-green-200';
    if (s >= 6) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (s >= 4) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-bold ${getColor(score)}`}>
      {score}/10
    </span>
  );
}

function AIAnalysisSection({ analysis, isGrok }: { analysis: AIAnalysis; isGrok: boolean }) {
  const Icon = isGrok ? Radio : Sparkles;
  const name = isGrok ? "Grok" : "Claude";
  const color = isGrok ? 'text-blue-600 bg-blue-50' : 'text-[#C41E3A] bg-red-50';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="font-semibold text-[#1A1A1A]">{name}</span>
      </div>

      {/* Scores */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-[#1A1A1A]">Curiosity Gap</span>
            <ScoreBadge score={analysis.curiosityGap.score} />
          </div>
          <p className="text-sm text-[#666]">{analysis.curiosityGap.analysis}</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-[#1A1A1A]">Prediction Violation</span>
            <ScoreBadge score={analysis.predictionViolation.score} />
          </div>
          <p className="text-sm text-[#666]">{analysis.predictionViolation.analysis}</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-[#1A1A1A]">Habituation Bypass</span>
            <ScoreBadge score={analysis.habituationBypass.score} />
          </div>
          <p className="text-sm text-[#666]">{analysis.habituationBypass.analysis}</p>
        </div>
      </div>

      {/* Key Insight */}
      <div className="pt-3 border-t border-[#EEE]">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5" />
          <p className="text-sm text-[#666]">{analysis.keyInsight}</p>
        </div>
      </div>
    </div>
  );
}

// Tweet Card Component
function TweetCard({
  analysis,
  tag,
  onClick
}: {
  analysis: TweetAnalysis;
  tag: { label: string; color: string };
  onClick: () => void;
}) {
  const avgScore = Math.round(
    (analysis.grokAnalysis.curiosityGap.score +
     analysis.claudeAnalysis.curiosityGap.score +
     analysis.grokAnalysis.predictionViolation.score +
     analysis.claudeAnalysis.predictionViolation.score) / 4
  );

  return (
    <button
      onClick={onClick}
      className="text-left bg-white border border-[#EEE] rounded-2xl overflow-hidden hover:shadow-lg hover:border-[#C41E3A]/30 transition-all duration-200 group"
    >
      {/* Tweet Content */}
      <div className="p-5 pb-4">
        {/* Status Tag */}
        <div className="flex items-center justify-between mb-3">
          <span className={`px-3 py-1 ${tag.color} text-white text-xs font-medium rounded-full`}>
            {tag.label}
          </span>
          <div className="flex items-center gap-1 text-xs text-[#999]">
            <span className="font-medium">{avgScore}/10</span>
            <span>avg</span>
          </div>
        </div>

        {/* Tweet Text */}
        <p className="text-[#1A1A1A] text-sm leading-relaxed line-clamp-4 mb-3">
          {analysis.tweet.text}
        </p>

        {/* Engagement */}
        {(analysis.tweet.engagement.likes > 0 || analysis.tweet.engagement.replies > 0) && (
          <div className="flex items-center gap-3 text-xs text-[#999] mb-3">
            {analysis.tweet.engagement.likes > 0 && (
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {analysis.tweet.engagement.likes.toLocaleString()}
              </span>
            )}
            {analysis.tweet.engagement.replies > 0 && (
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {analysis.tweet.engagement.replies.toLocaleString()}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Author Footer */}
      <div className="px-5 py-3 bg-[#FAFAFA] border-t border-[#EEE]">
        <p className="font-medium text-[#1A1A1A] text-sm">{analysis.tweet.author}</p>
        <p className="text-xs text-[#999]">@{analysis.tweet.handle}</p>
      </div>
    </button>
  );
}

// Add Tweet Modal
function AddTweetModal({
  isOpen,
  onClose,
  onAnalyze,
  isAnalyzing
}: {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (url: string, text?: string, author?: string) => void;
  isAnalyzing: boolean;
}) {
  const [tweetUrl, setTweetUrl] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [tweetText, setTweetText] = useState('');
  const [author, setAuthor] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    setError('');
    if (tweetUrl) {
      onAnalyze(tweetUrl);
    } else if (tweetText && author) {
      onAnalyze('', tweetText, author);
    } else {
      setError('Please enter a tweet URL or fill in the manual fields');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EEE]">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">Add Tweet to Roundtable</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#F5F5F5] rounded-lg transition-colors">
            <X className="w-5 h-5 text-[#999]" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Tweet URL</label>
            <div className="relative">
              <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
              <input
                type="url"
                value={tweetUrl}
                onChange={(e) => setTweetUrl(e.target.value)}
                placeholder="https://twitter.com/username/status/..."
                className="w-full pl-11 pr-4 py-3 border border-[#DDD] rounded-xl text-sm focus:outline-none focus:border-[#C41E3A]"
              />
            </div>
            <p className="text-xs text-[#999] mt-1.5">Supports twitter.com and x.com links</p>
          </div>

          {/* Manual Toggle */}
          <button
            onClick={() => setShowManual(!showManual)}
            className="flex items-center gap-2 text-sm text-[#666] hover:text-[#1A1A1A]"
          >
            {showManual ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Or paste manually
          </button>

          {/* Manual Fields */}
          {showManual && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Tweet Text</label>
                <textarea
                  value={tweetText}
                  onChange={(e) => setTweetText(e.target.value)}
                  placeholder="Paste the tweet text..."
                  rows={3}
                  className="w-full px-4 py-3 border border-[#DDD] rounded-xl text-sm focus:outline-none focus:border-[#C41E3A] resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Author</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="@username or name"
                  className="w-full px-4 py-3 border border-[#DDD] rounded-xl text-sm focus:outline-none focus:border-[#C41E3A]"
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#FAFAFA] border-t border-[#EEE] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-[#DDD] text-[#666] rounded-xl font-medium hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isAnalyzing || (!tweetUrl && (!tweetText || !author))}
            className="flex-1 py-3 bg-[#C41E3A] text-white rounded-xl font-medium hover:bg-[#A31830] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Target className="w-4 h-4" />
                Run Roundtable
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Full Analysis Modal
function AnalysisModal({
  analysis,
  tag,
  onClose
}: {
  analysis: TweetAnalysis;
  tag: { label: string; color: string };
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EEE] bg-[#FAFAFA]">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 ${tag.color} text-white text-xs font-medium rounded-full`}>
              {tag.label}
            </span>
            <span className="text-[#1A1A1A] font-semibold">{analysis.tweet.author}</span>
            <span className="text-[#999] text-sm">@{analysis.tweet.handle}</span>
          </div>
          <div className="flex items-center gap-2">
            {analysis.tweet.url && (
              <a
                href={analysis.tweet.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-white rounded-lg transition-colors text-[#666] hover:text-[#1A1A1A]"
              >
                <ExternalLink className="w-5 h-5" />
              </a>
            )}
            <button onClick={onClose} className="p-2 hover:bg-white rounded-lg transition-colors">
              <X className="w-5 h-5 text-[#999]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Tweet */}
          <div className="bg-[#FAFAFA] border border-[#EEE] rounded-xl p-5">
            <p className="text-lg text-[#1A1A1A] leading-relaxed">{analysis.tweet.text}</p>
            {(analysis.tweet.engagement.likes > 0) && (
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#EEE] text-sm text-[#666]">
                <span className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-pink-500" />
                  {analysis.tweet.engagement.likes.toLocaleString()}
                </span>
                {analysis.tweet.engagement.replies > 0 && (
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="w-4 h-4 text-blue-500" />
                    {analysis.tweet.engagement.replies.toLocaleString()}
                  </span>
                )}
                {analysis.tweet.engagement.retweets > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Repeat2 className="w-4 h-4 text-green-500" />
                    {analysis.tweet.engagement.retweets.toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* AI Analyses */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white border border-[#EEE] rounded-xl p-5">
              <AIAnalysisSection analysis={analysis.grokAnalysis} isGrok={true} />
            </div>
            <div className="bg-white border border-[#EEE] rounded-xl p-5">
              <AIAnalysisSection analysis={analysis.claudeAnalysis} isGrok={false} />
            </div>
          </div>

          {/* Agreements & Differences */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-green-900">Where They Agree</h3>
              </div>
              <ul className="space-y-2">
                {analysis.agreements.points.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-green-800">
                    <span className="text-green-500 mt-1">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <ArrowRight className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Where They Differ</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-blue-600 mb-1">Grok:</p>
                  <p className="text-sm text-blue-800">{analysis.differences.grokFocus}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-600 mb-1">Claude:</p>
                  <p className="text-sm text-blue-800">{analysis.differences.claudeFocus}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Takeaways */}
          <div className="bg-white border border-[#EEE] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Wand2 className="w-5 h-5 text-[#C41E3A]" />
              <h3 className="font-semibold text-[#1A1A1A]">How You Can Use This</h3>
            </div>
            <div className="space-y-3">
              {analysis.takeaways.map((takeaway, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-[#C41E3A] text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-medium text-[#1A1A1A]">
                      <span className="uppercase text-xs text-[#999] mr-2">{takeaway.category}:</span>
                      {takeaway.title}
                    </p>
                    <p className="text-sm text-[#666] mt-0.5">{takeaway.description}</p>
                    <p className="text-sm text-[#C41E3A] mt-1 italic">"{takeaway.example}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoundtableTab() {
  const [analyses, setAnalyses] = useState<Array<TweetAnalysis & { tag: { label: string; color: string } }>>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<(TweetAnalysis & { tag: { label: string; color: string } }) | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  // Load saved analyses from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('abh_roundtable_analyses');
    if (saved) {
      try {
        setAnalyses(JSON.parse(saved));
      } catch {
        // Ignore
      }
    }
  }, []);

  // Save analyses to localStorage
  useEffect(() => {
    if (analyses.length > 0) {
      localStorage.setItem('abh_roundtable_analyses', JSON.stringify(analyses));
    }
  }, [analyses]);

  const handleAnalyze = async (url: string, text?: string, author?: string) => {
    setIsAnalyzing(true);
    setError('');

    try {
      const payload: Record<string, unknown> = {};
      if (url) {
        payload.url = url;
      } else if (text && author) {
        payload.tweet = text;
        payload.author = author;
      }

      const response = await fetch('/api/roundtable/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Analysis failed');
      }

      // Add with random tag
      const newAnalysis = { ...result, tag: getRandomTag() };
      setAnalyses(prev => [newAnalysis, ...prev]);
      setShowAddModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">Roundtable</h1>
          <p className="text-[#666] mt-1">Tweets dissected by Grok & Claude</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C41E3A] text-white rounded-xl font-medium hover:bg-[#A31830] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Tweet
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      {/* Empty State */}
      {analyses.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-[#FAFAFA] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-[#999]" />
          </div>
          <h3 className="text-lg font-medium text-[#1A1A1A] mb-2">No tweets analyzed yet</h3>
          <p className="text-[#666] mb-6">Add your first tweet to see Grok & Claude break down what makes it work</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#C41E3A] text-white rounded-xl font-medium hover:bg-[#A31830] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Your First Tweet
          </button>
        </div>
      )}

      {/* Card Grid */}
      {analyses.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {analyses.map((analysis) => (
            <TweetCard
              key={analysis.id}
              analysis={analysis}
              tag={analysis.tag}
              onClick={() => setSelectedAnalysis(analysis)}
            />
          ))}
        </div>
      )}

      {/* Add Tweet Modal */}
      <AddTweetModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
      />

      {/* Analysis Detail Modal */}
      {selectedAnalysis && (
        <AnalysisModal
          analysis={selectedAnalysis}
          tag={selectedAnalysis.tag}
          onClose={() => setSelectedAnalysis(null)}
        />
      )}
    </div>
  );
}

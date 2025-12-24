'use client';

import { useState, useEffect } from 'react';

const BRAND_RED = '#C41E3A';

// Icons
const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"/>
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

// Reply goal options
const REPLY_GOALS = [
  { id: 'visibility', label: '👀 Visibility', description: 'Get noticed by OP and audience' },
  { id: 'connection', label: '🤝 Connection', description: 'Build genuine relationship' },
  { id: 'thought-leadership', label: '💡 Thought Leadership', description: 'Establish expertise' },
  { id: 'community', label: '👥 Community', description: 'Connect with lurkers' },
];

// AI colors
const AI_COLORS = {
  grok: { bg: '#1A1A2E', text: '#fff' },
  claude: { bg: '#D97706', text: '#fff' },
  gpt: { bg: '#10A37F', text: '#fff' },
};

interface AIReplyResult {
  ai: 'grok' | 'claude' | 'gpt';
  success: boolean;
  reply?: string;
  characterCount?: number;
  scores?: {
    curiosityGap: { score: number; reason: string };
    habituationBypass: { score: number; reason: string };
    predictionViolation: { score: number; reason: string };
  };
  replyStrategy?: string;
  expectedResponse?: string;
  hookType?: string;
  alternativeAngle?: string;
  error?: string;
}

interface ReplyGirlModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalPost: {
    text: string;
    author: string;
    handle: string;
    url?: string;
  };
  insightContext?: string;
}

export default function ReplyGirlModal({
  isOpen,
  onClose,
  originalPost,
  insightContext,
}: ReplyGirlModalProps) {
  const [selectedGoal, setSelectedGoal] = useState<string>('visibility');
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<AIReplyResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setResults([]);
      setError(null);
      setCopiedIndex(null);
    }
  }, [isOpen]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch('/api/pulse/reply-girl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalPost,
          insightContext,
          replyGoal: selectedGoal,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate replies');
      }

      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message || 'Failed to generate replies');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  if (!isOpen) return null;

  const successfulResults = results.filter(r => r.success);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: BRAND_RED }}
            >
              <SparklesIcon />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Reply Girl</h2>
              <p className="text-sm text-gray-500">Generate strategic replies with 3 AIs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XIcon />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Original Post Preview */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                style={{ backgroundColor: BRAND_RED }}
              >
                {originalPost.handle.replace('@', '').charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="font-medium text-gray-900">{originalPost.author}</span>
                <span className="text-gray-500 ml-2">@{originalPost.handle}</span>
              </div>
            </div>
            <p className="text-gray-700 text-sm">
              {originalPost.text.length > 200
                ? `${originalPost.text.slice(0, 200)}...`
                : originalPost.text}
            </p>
          </div>

          {/* Goal Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reply Goal
            </label>
            <div className="grid grid-cols-2 gap-2">
              {REPLY_GOALS.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => setSelectedGoal(goal.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedGoal === goal.id
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-sm">{goal.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{goal.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            style={{ backgroundColor: BRAND_RED }}
          >
            {isGenerating ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating 3 replies...
              </>
            ) : (
              <>
                <SparklesIcon />
                Generate Replies (Grok + Claude + GPT)
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Results */}
          {successfulResults.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="font-semibold text-gray-900">
                Generated Replies ({successfulResults.length}/3)
              </h3>

              {results.map((result, idx) => {
                if (!result.success) {
                  return (
                    <div key={idx} className="p-4 bg-gray-50 rounded-xl opacity-50">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="px-2 py-1 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: AI_COLORS[result.ai].bg }}
                        >
                          {result.ai.toUpperCase()}
                        </span>
                        <span className="text-sm text-gray-500">Failed: {result.error}</span>
                      </div>
                    </div>
                  );
                }

                const avgScore = result.scores
                  ? Math.round(
                      ((result.scores.curiosityGap?.score || 0) +
                        (result.scores.habituationBypass?.score || 0) +
                        (result.scores.predictionViolation?.score || 0)) /
                        3
                    )
                  : 0;

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2 py-1 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: AI_COLORS[result.ai].bg }}
                        >
                          {result.ai.toUpperCase()}
                        </span>
                        {result.hookType && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {result.hookType}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {result.scores && (
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-gray-400">CG:{result.scores.curiosityGap?.score}</span>
                            <span className="text-gray-400">HB:{result.scores.habituationBypass?.score}</span>
                            <span className="text-gray-400">PV:{result.scores.predictionViolation?.score}</span>
                            <span
                              className="font-bold ml-1 px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: avgScore >= 7 ? '#DCFCE7' : avgScore >= 5 ? '#FEF9C3' : '#FEE2E2',
                                color: avgScore >= 7 ? '#166534' : avgScore >= 5 ? '#854D0E' : '#991B1B',
                              }}
                            >
                              Avg: {avgScore}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Reply Text */}
                    <div className="relative">
                      <p className="text-gray-800 mb-3 pr-10">{result.reply}</p>
                      <button
                        onClick={() => handleCopy(result.reply || '', idx)}
                        className="absolute top-0 right-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Copy to clipboard"
                      >
                        {copiedIndex === idx ? (
                          <CheckIcon />
                        ) : (
                          <CopyIcon />
                        )}
                      </button>
                    </div>

                    {/* Character count */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{result.characterCount || result.reply?.length || 0} chars</span>
                      {result.expectedResponse && (
                        <span className="text-gray-400">
                          Expected: {result.expectedResponse}
                        </span>
                      )}
                    </div>

                    {/* Strategy & Alternative */}
                    {(result.replyStrategy || result.alternativeAngle) && (
                      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                        {result.replyStrategy && (
                          <p><strong>Strategy:</strong> {result.replyStrategy}</p>
                        )}
                        {result.alternativeAngle && (
                          <p className="mt-1"><strong>Alternative:</strong> {result.alternativeAngle}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Scoring: CG = Curiosity Gap, HB = Habituation Bypass, PV = Prediction Violation</span>
            {originalPost.url && (
              <a
                href={originalPost.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-600 underline"
              >
                View original post
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

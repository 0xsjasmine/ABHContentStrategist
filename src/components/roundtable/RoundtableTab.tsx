'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Link2,
  Sparkles,
  Radio,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  Wand2,
  Scale,
  Trash2,
  ExternalLink,
  MessageSquareQuote,
  Users,
  TrendingUp,
  Heart,
  Target,
  AlertCircle
} from 'lucide-react';
import type { TweetAnalysis, AIAnalysis } from '@/types';

// Cost per token (approximate)
const CLAUDE_INPUT_COST = 0.003 / 1000;  // $3 per 1M input tokens
const CLAUDE_OUTPUT_COST = 0.015 / 1000; // $15 per 1M output tokens
const GROK_INPUT_COST = 0.005 / 1000;    // $5 per 1M input tokens (estimated)
const GROK_OUTPUT_COST = 0.015 / 1000;   // $15 per 1M output tokens (estimated)

interface FeatureUsage {
  feature: string;
  calls: number;
  cost: number;
}

interface MonthlyUsage {
  month: string;
  claude: { calls: number; cost: number; tokens: number };
  grok: { calls: number; cost: number; tokens: number };
  features: FeatureUsage[];
}

function updateApiUsage(claudeUsage: { inputTokens: number; outputTokens: number }, grokUsage: { inputTokens: number; outputTokens: number }) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const storageKey = `abh_api_usage_${currentMonth}`;

  // Calculate costs
  const claudeTokens = claudeUsage.inputTokens + claudeUsage.outputTokens;
  const grokTokens = grokUsage.inputTokens + grokUsage.outputTokens;
  const claudeCost = (claudeUsage.inputTokens * CLAUDE_INPUT_COST) + (claudeUsage.outputTokens * CLAUDE_OUTPUT_COST);
  const grokCost = (grokUsage.inputTokens * GROK_INPUT_COST) + (grokUsage.outputTokens * GROK_OUTPUT_COST);

  // Get existing or create new - matches ApiUsageModal expected format
  let usage: MonthlyUsage = {
    month: currentMonth,
    claude: { calls: 0, cost: 0, tokens: 0 },
    grok: { calls: 0, cost: 0, tokens: 0 },
    features: [],
  };

  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      usage = JSON.parse(stored);
      // Ensure features array exists
      if (!usage.features) usage.features = [];
    }
  } catch {
    // Use default
  }

  // Update Claude
  if (claudeUsage.inputTokens > 0) {
    usage.claude.calls += 1;
    usage.claude.tokens += claudeTokens;
    usage.claude.cost += claudeCost;
  }

  // Update Grok
  if (grokUsage.inputTokens > 0) {
    usage.grok.calls += 1;
    usage.grok.tokens += grokTokens;
    usage.grok.cost += grokCost;
  }

  // Update features breakdown
  const totalCost = claudeCost + grokCost;
  const roundtableFeature = usage.features.find(f => f.feature === 'Roundtable');
  if (roundtableFeature) {
    roundtableFeature.calls += 1;
    roundtableFeature.cost += totalCost;
  } else {
    usage.features.push({ feature: 'Roundtable', calls: 1, cost: totalCost });
  }

  localStorage.setItem(storageKey, JSON.stringify(usage));
}

function ScoreBadge({ score, size = 'sm' }: { score: number; size?: 'sm' | 'lg' }) {
  const getColor = (s: number) => {
    if (s >= 8) return 'bg-green-100 text-green-700 border-green-200';
    if (s >= 6) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (s >= 4) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  if (size === 'lg') {
    return (
      <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl border-2 ${getColor(score)}`}>
        <span className="text-xl font-bold">{score}/10</span>
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-bold ${getColor(score)}`}>
      {score}/10
    </span>
  );
}

// Swipeable Analysis Modal
function SwipeModal({
  analysis,
  onClose
}: {
  analysis: TweetAnalysis;
  onClose: () => void;
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = ['grok', 'claude', 'compare', 'use'];

  const avgScore = Math.round(
    (analysis.grokAnalysis.curiosityGap.score +
     analysis.claudeAnalysis.curiosityGap.score +
     analysis.grokAnalysis.predictionViolation.score +
     analysis.claudeAnalysis.predictionViolation.score +
     analysis.grokAnalysis.habituationBypass.score +
     analysis.claudeAnalysis.habituationBypass.score) / 6
  );

  const goNext = () => setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1));
  const goPrev = () => setCurrentSlide(prev => Math.max(prev - 1, 0));

  const renderSlide = () => {
    switch (slides[currentSlide]) {
      case 'grok':
        return <AISlide analysis={analysis.grokAnalysis} isGrok={true} />;
      case 'claude':
        return <AISlide analysis={analysis.claudeAnalysis} isGrok={false} />;
      case 'compare':
        return <CompareSlide analysis={analysis} />;
      case 'use':
        return <UseSlide analysis={analysis} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header - Clean, no tweet preview */}
        <div className="px-6 py-4 border-b border-[#EEE] bg-gradient-to-r from-[#FFF5F5] to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ScoreBadge score={avgScore} size="lg" />
              <div>
                <h2 className="font-semibold text-[#1A1A1A]">{analysis.tweet.author}</h2>
                <p className="text-sm text-[#999]">@{analysis.tweet.handle}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-[#F5F5F5] rounded-lg transition-colors">
              <X className="w-5 h-5 text-[#999]" />
            </button>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="flex items-center justify-center gap-2 py-3 bg-[#FAFAFA] border-b border-[#EEE]">
          {slides.map((slide, i) => (
            <button
              key={slide}
              onClick={() => setCurrentSlide(i)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                currentSlide === i
                  ? 'bg-[#C41E3A] text-white'
                  : 'text-[#666] hover:bg-[#EEE]'
              }`}
            >
              {slide === 'grok' && <span className="flex items-center gap-1.5"><Radio className="w-4 h-4" /> Grok</span>}
              {slide === 'claude' && <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> Claude</span>}
              {slide === 'compare' && <span className="flex items-center gap-1.5"><Scale className="w-4 h-4" /> Compare</span>}
              {slide === 'use' && <span className="flex items-center gap-1.5"><Wand2 className="w-4 h-4" /> Use This</span>}
            </button>
          ))}
        </div>

        {/* Slide Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderSlide()}
        </div>

        {/* Navigation Arrows */}
        <div className="px-6 py-4 bg-[#FAFAFA] border-t border-[#EEE] flex items-center justify-between">
          <button
            onClick={goPrev}
            disabled={currentSlide === 0}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#666] hover:text-[#1A1A1A] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>
          <div className="flex gap-1">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  currentSlide === i ? 'bg-[#C41E3A]' : 'bg-[#DDD]'
                }`}
              />
            ))}
          </div>
          <button
            onClick={goNext}
            disabled={currentSlide === slides.length - 1}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#666] hover:text-[#1A1A1A] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper to split analysis text into bullet points
function splitIntoBullets(text: string): string[] {
  if (!text) return [];
  // Split by sentences (period followed by space or end)
  return text
    .split(/\.(?:\s|$)/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

// AI Analysis Slide (Grok or Claude) - Bullet Point Style
function AISlide({ analysis, isGrok }: { analysis: AIAnalysis; isGrok: boolean }) {
  const Icon = isGrok ? Radio : Sparkles;
  const name = isGrok ? "Grok" : "Claude";
  const subtitle = isGrok ? 'Real-time cultural context' : 'Deep psychological structure';

  // Calculate average score
  const avgScore = Math.round((analysis.curiosityGap.score + analysis.predictionViolation.score + analysis.habituationBypass.score) / 3);

  const curiosityBullets = splitIntoBullets(analysis.curiosityGap.analysis);
  const violationBullets = splitIntoBullets(analysis.predictionViolation.analysis);
  const bypassBullets = splitIntoBullets(analysis.habituationBypass.analysis);

  return (
    <div className="space-y-5">
      {/* Header - Consistent Red Theme */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-red-100">
          <Icon className="w-7 h-7 text-[#C41E3A]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#1A1A1A]">{name}&apos;s Take</h3>
            <div className="bg-[#C41E3A] text-white px-3 py-1.5 rounded-lg text-sm font-bold">
              {avgScore}/10
            </div>
          </div>
          <p className="text-sm text-[#C41E3A] font-medium">{subtitle}</p>
        </div>
      </div>

      {/* Analysis Breakdown - Bullet Points */}
      <div className="space-y-4">
        {/* Curiosity Gap */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#1A1A1A]">Curiosity Gap</span>
            <span className="text-sm font-semibold text-[#C41E3A]">{analysis.curiosityGap.score}/10</span>
          </div>
          <ul className="space-y-1.5">
            {curiosityBullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#666]">
                <span className="text-[#C41E3A] mt-1">•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Prediction Violation */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#1A1A1A]">Prediction Violation</span>
            <span className="text-sm font-semibold text-[#C41E3A]">{analysis.predictionViolation.score}/10</span>
          </div>
          <ul className="space-y-1.5">
            {violationBullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#666]">
                <span className="text-[#C41E3A] mt-1">•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Habituation Bypass */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#1A1A1A]">Habituation Bypass</span>
            <span className="text-sm font-semibold text-[#C41E3A]">{analysis.habituationBypass.score}/10</span>
          </div>
          <ul className="space-y-1.5">
            {bypassBullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#666]">
                <span className="text-[#C41E3A] mt-1">•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* The Key Insight - Pink Box (Pulse Style) */}
      <div className="bg-gradient-to-r from-[#FFF0F3] to-[#FFF5F7] border-l-4 border-[#C41E3A] rounded-r-xl p-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-[#C41E3A] mb-2">
          <Lightbulb className="w-4 h-4" /> The Key Insight
        </h4>
        <p className="text-sm text-[#666] italic">&quot;{analysis.keyInsight}&quot;</p>
      </div>
    </div>
  );
}

// ABH Pillars
const ABH_PILLARS = [
  { key: 'ambition', label: 'Ambition', icon: Target, color: 'text-purple-600', bg: 'bg-purple-100' },
  { key: 'community', label: 'Community', icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
  { key: 'growth', label: 'Growth', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
  { key: 'realness', label: 'Realness', icon: Heart, color: 'text-pink-600', bg: 'bg-pink-100' },
  { key: 'twenties', label: 'Twenties', icon: Sparkles, color: 'text-amber-600', bg: 'bg-amber-100' },
];

// Compare Slide - With ABH Pillar Analysis
function CompareSlide({ analysis }: { analysis: TweetAnalysis }) {
  // Calculate ABH pillar scores based on content analysis
  // This is a simplified heuristic - in production, the AI would score these
  const avgScore = Math.round(
    (analysis.grokAnalysis.curiosityGap.score + analysis.claudeAnalysis.curiosityGap.score +
     analysis.grokAnalysis.predictionViolation.score + analysis.claudeAnalysis.predictionViolation.score) / 4
  );

  // Simple pillar scoring based on content themes
  const pillarScores = {
    ambition: avgScore >= 7 ? 8 : avgScore >= 5 ? 6 : 4,
    community: analysis.agreements.points.some(p => p.toLowerCase().includes('permission') || p.toLowerCase().includes('relat')) ? 8 : 5,
    growth: analysis.agreements.points.some(p => p.toLowerCase().includes('learn') || p.toLowerCase().includes('wisdom')) ? 7 : 5,
    realness: avgScore >= 7 ? 9 : 6, // High engagement usually = realness
    twenties: analysis.agreements.points.some(p => p.toLowerCase().includes('generation') || p.toLowerCase().includes('ai')) ? 7 : 5,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-purple-100">
          <Scale className="w-7 h-7 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#1A1A1A]">The Verdict</h3>
          <p className="text-sm text-[#C41E3A] font-medium">How this fits the ABH strategy</p>
        </div>
      </div>

      {/* ABH Pillar Fit */}
      <div>
        <h4 className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A] mb-3">
          <Target className="w-4 h-4 text-[#C41E3A]" /> ABH Pillar Fit
        </h4>
        <div className="grid grid-cols-5 gap-2">
          {ABH_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            const score = pillarScores[pillar.key as keyof typeof pillarScores];
            return (
              <div key={pillar.key} className="text-center">
                <div className={`w-10 h-10 mx-auto rounded-lg ${pillar.bg} flex items-center justify-center mb-1`}>
                  <Icon className={`w-5 h-5 ${pillar.color}`} />
                </div>
                <p className="text-xs font-medium text-[#666]">{pillar.label}</p>
                <p className={`text-xs font-bold ${score >= 7 ? 'text-green-600' : score >= 5 ? 'text-amber-600' : 'text-gray-400'}`}>
                  {score}/10
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Where They Agree - Bullet List */}
      <div>
        <h4 className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A] mb-3">
          <CheckCircle2 className="w-4 h-4 text-green-600" /> Both Agree
        </h4>
        <ul className="space-y-2">
          {analysis.agreements.points.map((point, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[#666]">
              <span className="text-green-600 font-bold">✓</span>
              {point}
            </li>
          ))}
        </ul>
      </div>

      {/* Where They Differ - Simple Cards */}
      <div>
        <h4 className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A] mb-3">
          <ArrowRight className="w-4 h-4 text-blue-600" /> Different Perspectives
        </h4>
        <div className="space-y-3">
          <div className="bg-red-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Radio className="w-4 h-4 text-[#C41E3A]" />
              <span className="text-sm font-medium text-[#1A1A1A]">Grok says...</span>
            </div>
            <p className="text-sm text-[#666] italic">&quot;{analysis.differences.grokFocus}&quot;</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#C41E3A]" />
              <span className="text-sm font-medium text-[#1A1A1A]">Claude says...</span>
            </div>
            <p className="text-sm text-[#666] italic">&quot;{analysis.differences.claudeFocus}&quot;</p>
          </div>
        </div>
      </div>

      {/* Missed Opportunity Alert */}
      {Object.values(pillarScores).some(s => s < 5) && (
        <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-700 mb-2">
            <AlertCircle className="w-4 h-4" /> Missed Opportunity
          </h4>
          <p className="text-sm text-amber-700">
            This content could be stronger on{' '}
            {ABH_PILLARS.filter(p => pillarScores[p.key as keyof typeof pillarScores] < 5)
              .map(p => p.label.toLowerCase())
              .join(', ')}.
            Consider adding that angle in your QT or reply!
          </p>
        </div>
      )}
    </div>
  );
}

// Use This Slide - With QT Suggestion & Community Growth
function UseSlide({ analysis }: { analysis: TweetAnalysis }) {
  // Generate a QT suggestion based on ABH voice
  const generateQTSuggestion = () => {
    const hooks = [
      `This is what more people need to hear →`,
      `This hit different because`,
      `The part everyone's missing:`,
      `Real talk on this →`,
      `Adding to this because it's SO important:`,
    ];
    const randomHook = hooks[Math.floor(Math.random() * hooks.length)];
    const insight = analysis.claudeAnalysis.keyInsight || analysis.takeaways[0]?.description || '';
    return `${randomHook}\n\n${insight.slice(0, 200)}${insight.length > 200 ? '...' : ''}`;
  };

  const qtSuggestion = generateQTSuggestion();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#C41E3A] to-[#A31830]">
          <Wand2 className="w-7 h-7 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#1A1A1A]">Steal This</h3>
          <p className="text-sm text-[#C41E3A] font-medium">Actionable tactics for your content</p>
        </div>
      </div>

      {/* QT Suggestion - Reply Girl Style */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-blue-700 mb-3">
          <MessageSquareQuote className="w-4 h-4" /> Quote Tweet This
        </h4>
        <p className="text-sm text-[#1A1A1A] whitespace-pre-wrap mb-3">{qtSuggestion}</p>
        <button
          onClick={() => {
            navigator.clipboard.writeText(qtSuggestion);
          }}
          className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          Copy to clipboard →
        </button>
      </div>

      {/* Takeaways - Numbered List */}
      <div>
        <h4 className="text-sm font-semibold text-[#1A1A1A] mb-3">Key Takeaways</h4>
        <div className="space-y-3">
          {analysis.takeaways.map((takeaway, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-[#C41E3A] text-white rounded-full flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              <div className="flex-1">
                <h4 className="font-medium text-[#1A1A1A] text-sm">{takeaway.title}</h4>
                <p className="text-sm text-[#666] mt-0.5">{takeaway.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Community Growth Opportunity */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-green-700 mb-2">
          <Users className="w-4 h-4" /> Community Growth Play
        </h4>
        <ul className="space-y-2 text-sm text-green-800">
          <li className="flex items-start gap-2">
            <span className="text-green-600">→</span>
            <span>Reply with your own vulnerable take (70% human, 30% strategic)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">→</span>
            <span>QT with an ABH angle to join the conversation</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600">→</span>
            <span>Save to diary for thread inspiration later</span>
          </li>
        </ul>
      </div>

      {/* Pro Tip Box */}
      {analysis.takeaways[0]?.example && (
        <div className="bg-gradient-to-r from-[#FFF0F3] to-[#FFF5F7] border-l-4 border-[#C41E3A] rounded-r-xl p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-[#C41E3A] mb-2">
            💡 Try This Format
          </h4>
          <p className="text-sm text-[#666] italic">&quot;{analysis.takeaways[0].example}&quot;</p>
        </div>
      )}
    </div>
  );
}

// Tweet Card - Custom Display (no Twitter widget truncation)
function TweetCard({
  analysis,
  onClick,
  onDelete
}: {
  analysis: TweetAnalysis;
  onClick: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Get first takeaway as the tag
  const takeawayTag = analysis.takeaways[0]?.title || 'Analyzed';

  const avgScore = Math.round(
    (analysis.grokAnalysis.curiosityGap.score +
     analysis.claudeAnalysis.curiosityGap.score +
     analysis.grokAnalysis.predictionViolation.score +
     analysis.claudeAnalysis.predictionViolation.score) / 4
  );

  const tweetText = analysis.tweet.text || '';
  const isLongTweet = tweetText.length > 280;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showDeleteConfirm) {
      onDelete();
    } else {
      setShowDeleteConfirm(true);
      // Auto-hide confirmation after 3 seconds
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-white border border-[#EEE] rounded-2xl overflow-hidden hover:shadow-lg hover:border-[#C41E3A]/30 transition-all duration-200 group w-full relative"
    >
      {/* Delete Button */}
      <button
        onClick={handleDelete}
        className={`absolute top-3 right-3 p-2 rounded-lg transition-all z-10 ${
          showDeleteConfirm
            ? 'bg-red-500 text-white'
            : 'bg-white/80 text-[#999] opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500'
        }`}
        title={showDeleteConfirm ? 'Click again to confirm' : 'Delete'}
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Tag & Score */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2 pr-8">
          <span className="px-3 py-1.5 bg-[#C41E3A] text-white text-xs font-medium rounded-full line-clamp-1">
            {takeawayTag}
          </span>
          <div className="flex items-center gap-1 text-xs text-[#999] whitespace-nowrap">
            <span className="font-semibold text-[#1A1A1A]">{avgScore}/10</span>
          </div>
        </div>
      </div>

      {/* Custom Tweet Display */}
      <div className="px-4 pb-4">
        {/* Author */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C41E3A] to-[#A31830] flex items-center justify-center text-white font-bold text-sm">
            {analysis.tweet.author?.charAt(0)?.toUpperCase() || 'X'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#1A1A1A] text-sm truncate">{analysis.tweet.author}</p>
            <p className="text-xs text-[#999]">@{analysis.tweet.handle}</p>
          </div>
        </div>

        {/* Tweet Text - Full or Expandable */}
        <div className="text-[#1A1A1A] text-sm leading-relaxed whitespace-pre-wrap">
          {isLongTweet && !expanded ? (
            <>
              {tweetText.slice(0, 280)}...
              <button
                onClick={handleExpand}
                className="text-[#C41E3A] font-medium ml-1 hover:underline"
              >
                Show more
              </button>
            </>
          ) : (
            <>
              {tweetText}
              {isLongTweet && (
                <button
                  onClick={handleExpand}
                  className="text-[#C41E3A] font-medium ml-1 hover:underline block mt-1"
                >
                  Show less
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer with date and link */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#EEE]">
          {analysis.tweet.postedAt && (
            <span className="text-xs text-[#999]">
              {new Date(analysis.tweet.postedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          )}
          {analysis.tweet.url && (
            <a
              href={analysis.tweet.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-[#999] hover:text-[#C41E3A] transition-colors"
            >
              View on X <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
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
                <Sparkles className="w-4 h-4" />
                Run Roundtable
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RoundtableTab() {
  const [analyses, setAnalyses] = useState<TweetAnalysis[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<TweetAnalysis | null>(null);
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
    } else {
      localStorage.removeItem('abh_roundtable_analyses');
    }
  }, [analyses]);

  const handleDelete = (id: string) => {
    setAnalyses(prev => prev.filter(a => a.id !== id));
  };

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

      // Track API usage
      if (result.usage) {
        updateApiUsage(result.usage.claude, result.usage.grok);
      }

      setAnalyses(prev => [result, ...prev]);
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
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">Roundtable</h1>
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

      {/* Card Grid */}
      {analyses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analyses.map((analysis) => (
            <TweetCard
              key={analysis.id}
              analysis={analysis}
              onClick={() => setSelectedAnalysis(analysis)}
              onDelete={() => handleDelete(analysis.id)}
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

      {/* Swipe Analysis Modal */}
      {selectedAnalysis && (
        <SwipeModal
          analysis={selectedAnalysis}
          onClose={() => setSelectedAnalysis(null)}
        />
      )}
    </div>
  );
}

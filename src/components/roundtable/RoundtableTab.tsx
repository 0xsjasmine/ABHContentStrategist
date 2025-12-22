'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Sparkles,
  Radio,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  X,
  Wand2,
  Scale,
  Trash2,
  MessageSquareQuote,
  Users,
  TrendingUp,
  Heart,
  Target,
  AlertCircle,
  Zap
} from 'lucide-react';
import type { TweetAnalysis, AIAnalysis } from '@/types';

// Cost per token (approximate)
const CLAUDE_INPUT_COST = 0.003 / 1000;  // $3 per 1M input tokens
const CLAUDE_OUTPUT_COST = 0.015 / 1000; // $15 per 1M output tokens
const GROK_INPUT_COST = 0.005 / 1000;    // $5 per 1M input tokens (estimated)
const GROK_OUTPUT_COST = 0.015 / 1000;   // $15 per 1M output tokens (estimated)
const OPENAI_INPUT_COST = 0.0025 / 1000;  // $2.50 per 1M input tokens (GPT-4o)
const OPENAI_OUTPUT_COST = 0.01 / 1000;   // $10 per 1M output tokens (GPT-4o)

interface FeatureUsage {
  feature: string;
  calls: number;
  cost: number;
}

interface MonthlyUsage {
  month: string;
  claude: { calls: number; cost: number; tokens: number };
  grok: { calls: number; cost: number; tokens: number };
  openai: { calls: number; cost: number; tokens: number };
  features: FeatureUsage[];
}

function updateApiUsage(
  claudeUsage: { inputTokens: number; outputTokens: number },
  grokUsage: { inputTokens: number; outputTokens: number },
  openaiUsage: { inputTokens: number; outputTokens: number } = { inputTokens: 0, outputTokens: 0 }
) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const storageKey = `abh_api_usage_${currentMonth}`;

  // Calculate costs
  const claudeTokens = claudeUsage.inputTokens + claudeUsage.outputTokens;
  const grokTokens = grokUsage.inputTokens + grokUsage.outputTokens;
  const openaiTokens = openaiUsage.inputTokens + openaiUsage.outputTokens;
  const claudeCost = (claudeUsage.inputTokens * CLAUDE_INPUT_COST) + (claudeUsage.outputTokens * CLAUDE_OUTPUT_COST);
  const grokCost = (grokUsage.inputTokens * GROK_INPUT_COST) + (grokUsage.outputTokens * GROK_OUTPUT_COST);
  const openaiCost = (openaiUsage.inputTokens * OPENAI_INPUT_COST) + (openaiUsage.outputTokens * OPENAI_OUTPUT_COST);

  // Get existing or create new - matches ApiUsageModal expected format
  let usage: MonthlyUsage = {
    month: currentMonth,
    claude: { calls: 0, cost: 0, tokens: 0 },
    grok: { calls: 0, cost: 0, tokens: 0 },
    openai: { calls: 0, cost: 0, tokens: 0 },
    features: [],
  };

  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      usage = JSON.parse(stored);
      // Ensure features array and openai exists
      if (!usage.features) usage.features = [];
      if (!usage.openai) usage.openai = { calls: 0, cost: 0, tokens: 0 };
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

  // Update OpenAI
  if (openaiUsage.inputTokens > 0) {
    usage.openai.calls += 1;
    usage.openai.tokens += openaiTokens;
    usage.openai.cost += openaiCost;
  }

  // Update features breakdown
  const totalCost = claudeCost + grokCost + openaiCost;
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
  // Include GPT if openaiAnalysis exists
  const hasOpenAI = analysis.openaiAnalysis && analysis.openaiAnalysis.curiosityGap.score > 0;
  const slides = hasOpenAI ? ['grok', 'claude', 'gpt', 'compare', 'use'] : ['grok', 'claude', 'compare', 'use'];

  const avgScore = Math.round(
    (analysis.grokAnalysis.curiosityGap.score +
     analysis.claudeAnalysis.curiosityGap.score +
     (hasOpenAI ? analysis.openaiAnalysis!.curiosityGap.score : 0) +
     analysis.grokAnalysis.predictionViolation.score +
     analysis.claudeAnalysis.predictionViolation.score +
     (hasOpenAI ? analysis.openaiAnalysis!.predictionViolation.score : 0) +
     analysis.grokAnalysis.habituationBypass.score +
     analysis.claudeAnalysis.habituationBypass.score +
     (hasOpenAI ? analysis.openaiAnalysis!.habituationBypass.score : 0)) / (hasOpenAI ? 9 : 6)
  );

  const goNext = () => setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1));
  const goPrev = () => setCurrentSlide(prev => Math.max(prev - 1, 0));

  const renderSlide = () => {
    switch (slides[currentSlide]) {
      case 'grok':
        return <AISlide analysis={analysis.grokAnalysis} aiType="grok" />;
      case 'claude':
        return <AISlide analysis={analysis.claudeAnalysis} aiType="claude" />;
      case 'gpt':
        return analysis.openaiAnalysis ? <AISlide analysis={analysis.openaiAnalysis} aiType="gpt" /> : null;
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
              {slide === 'gpt' && <span className="flex items-center gap-1.5"><Zap className="w-4 h-4" /> GPT</span>}
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

// AI Analysis Slide (Grok, Claude, or GPT) - Bullet Point Style
function AISlide({ analysis, aiType }: { analysis: AIAnalysis; aiType: 'grok' | 'claude' | 'gpt' }) {
  const configs = {
    grok: { Icon: Radio, name: "Grok", subtitle: 'Real-time cultural context' },
    claude: { Icon: Sparkles, name: "Claude", subtitle: 'Deep psychological structure' },
    gpt: { Icon: Zap, name: "GPT-4o", subtitle: 'Structured pattern analysis' },
  };
  const { Icon, name, subtitle } = configs[aiType];

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

      {/* Additional Psychological Triggers - Full breakdowns */}
      {analysis.additionalTriggers && (() => {
        const triggers = analysis.additionalTriggers;

        // Helper to check if trigger is present and get analysis
        const getTrigger = (t: unknown): { present: boolean; analysis: string } => {
          if (typeof t === 'boolean') return { present: t, analysis: '' };
          if (t && typeof t === 'object' && 'present' in t) return t as { present: boolean; analysis: string };
          return { present: false, analysis: '' };
        };

        const getLevel = (t: unknown, oldLevel?: string): { level: string; analysis: string } | null => {
          if (t && typeof t === 'object' && 'level' in t) return t as { level: string; analysis: string };
          if (oldLevel && (oldLevel === 'medium' || oldLevel === 'high')) return { level: oldLevel, analysis: '' };
          return null;
        };

        const socialProof = getTrigger(triggers.socialProof);
        const lossAversion = getTrigger(triggers.lossAversion);
        const identitySignaling = getTrigger(triggers.identitySignaling);
        const permissionGiving = getTrigger(triggers.permissionGiving);
        const patternCompletion = getTrigger(triggers.patternCompletion);
        const vulnerability = getLevel(triggers.vulnerability, triggers.vulnerabilityFactor);
        const specificity = getLevel(triggers.specificity, triggers.specificityLevel);

        const activeTriggers = [
          socialProof.present && { name: 'Social Proof', ...socialProof, color: 'green' },
          lossAversion.present && { name: 'Loss Aversion', ...lossAversion, color: 'orange' },
          identitySignaling.present && { name: 'Identity Signaling', ...identitySignaling, color: 'purple' },
          permissionGiving.present && { name: 'Permission Giving', ...permissionGiving, color: 'blue' },
          patternCompletion.present && { name: 'Pattern Completion', ...patternCompletion, color: 'pink' },
          vulnerability && { name: `Vulnerability (${vulnerability.level})`, present: true, analysis: vulnerability.analysis, color: 'red' },
          specificity && { name: `Specificity (${specificity.level})`, present: true, analysis: specificity.analysis, color: 'amber' },
        ].filter(Boolean) as { name: string; present: boolean; analysis: string; color: string }[];

        if (activeTriggers.length === 0) return null;

        const bgColors: Record<string, string> = {
          green: 'bg-green-50',
          orange: 'bg-orange-50',
          purple: 'bg-purple-50',
          blue: 'bg-blue-50',
          pink: 'bg-pink-50',
          red: 'bg-red-50',
          amber: 'bg-amber-50',
        };
        const dotColors: Record<string, string> = {
          green: 'bg-green-500',
          orange: 'bg-orange-500',
          purple: 'bg-purple-500',
          blue: 'bg-blue-500',
          pink: 'bg-pink-500',
          red: 'bg-red-500',
          amber: 'bg-amber-500',
        };

        return (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-[#1A1A1A]">Also Present</h4>
            {activeTriggers.map((trigger, i) => (
              <div key={i} className={`${bgColors[trigger.color] || 'bg-gray-50'} rounded-xl p-3`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${dotColors[trigger.color] || 'bg-gray-500'}`} />
                  <span className="text-sm font-medium text-[#1A1A1A]">{trigger.name}</span>
                </div>
                {trigger.analysis && (
                  <p className="text-sm text-[#666] ml-4">{trigger.analysis}</p>
                )}
              </div>
            ))}
          </div>
        );
      })()}

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

// Tweet Card - Twitter Embed with Delete
function TweetCard({
  analysis,
  onClick,
  onDelete
}: {
  analysis: TweetAnalysis;
  onClick: () => void;
  onDelete: () => void;
}) {
  const embedRef = useRef<HTMLDivElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Get first takeaway as the tag
  const takeawayTag = analysis.takeaways[0]?.title || 'Analyzed';

  const avgScore = Math.round(
    (analysis.grokAnalysis.curiosityGap.score +
     analysis.claudeAnalysis.curiosityGap.score +
     analysis.grokAnalysis.predictionViolation.score +
     analysis.claudeAnalysis.predictionViolation.score) / 4
  );

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

  // Load Twitter widget for embed - use key to force reload on re-render
  const [embedKey, setEmbedKey] = useState(0);

  useEffect(() => {
    if (analysis.tweet.embedHtml && embedRef.current) {
      // Small delay to ensure DOM is ready
      const loadWidget = () => {
        const twttr = (window as unknown as { twttr?: { widgets?: { load?: (el: HTMLElement) => void } } }).twttr;
        if (twttr?.widgets?.load && embedRef.current) {
          twttr.widgets.load(embedRef.current);
        }
      };

      const twttr = (window as unknown as { twttr?: { widgets?: { load?: (el: HTMLElement) => void } } }).twttr;
      if (twttr?.widgets?.load) {
        // Widget already loaded, just call it
        setTimeout(loadWidget, 50);
      } else {
        // Load the script
        const existingScript = document.querySelector('script[src="https://platform.twitter.com/widgets.js"]');
        if (!existingScript) {
          const script = document.createElement('script');
          script.src = 'https://platform.twitter.com/widgets.js';
          script.async = true;
          script.onload = () => setTimeout(loadWidget, 50);
          document.body.appendChild(script);
        } else {
          // Script exists but twttr not ready, wait for it
          setTimeout(loadWidget, 100);
        }
      }
    }
  }, [analysis.tweet.embedHtml, analysis.id, embedKey]);

  // Force reload widget when component becomes visible again
  useEffect(() => {
    setEmbedKey(k => k + 1);
  }, []);

  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-white border border-[#EEE] rounded-2xl overflow-hidden hover:shadow-lg hover:border-[#C41E3A]/30 transition-all duration-200 group w-full relative"
    >
      {/* Delete Button */}
      <button
        onClick={handleDelete}
        className={`absolute top-3 right-3 p-2 rounded-lg transition-all z-20 ${
          showDeleteConfirm
            ? 'bg-red-500 text-white'
            : 'bg-white/90 text-[#999] opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 shadow-sm'
        }`}
        title={showDeleteConfirm ? 'Click again to confirm' : 'Delete'}
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Tag & Score */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-start justify-between gap-2 pr-10">
          <span className="px-3 py-1.5 bg-[#C41E3A] text-white text-xs font-medium rounded-full line-clamp-1">
            {takeawayTag}
          </span>
          <div className="flex items-center gap-1 text-xs text-[#999] whitespace-nowrap">
            <span className="font-semibold text-[#1A1A1A]">{avgScore}/10</span>
          </div>
        </div>
      </div>

      {/* Twitter Embed */}
      {analysis.tweet.embedHtml ? (
        <div
          key={`embed-${analysis.id}-${embedKey}`}
          ref={embedRef}
          className="px-2 pb-2 [&_blockquote]:!m-0 [&_blockquote]:!border-0 [&_.twitter-tweet]:!m-0 [&_iframe]:!max-w-full"
          dangerouslySetInnerHTML={{ __html: analysis.tweet.embedHtml }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C41E3A] to-[#A31830] flex items-center justify-center text-white font-bold text-sm">
              {analysis.tweet.author?.charAt(0)?.toUpperCase() || 'X'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#1A1A1A] text-sm truncate">{analysis.tweet.author}</p>
              <p className="text-xs text-[#999]">@{analysis.tweet.handle}</p>
            </div>
          </div>
          <p className="text-[#1A1A1A] text-sm leading-relaxed line-clamp-4">
            {analysis.tweet.text}
          </p>
        </div>
      )}
    </div>
  );
}

// URL Queue Item for tracking analysis progress
interface UrlQueueItem {
  url: string;
  status: 'pending' | 'analyzing' | 'done' | 'error';
  error?: string;
}

// Right Side Panel for adding multiple tweets
function AddTweetsPanel({
  onAnalyzeComplete,
  analysisQueue,
  setAnalysisQueue,
}: {
  onAnalyzeComplete: (result: TweetAnalysis) => void;
  analysisQueue: UrlQueueItem[];
  setAnalysisQueue: React.Dispatch<React.SetStateAction<UrlQueueItem[]>>;
}) {
  const [urlInput, setUrlInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Parse URLs from input (one per line)
  const parseUrls = (input: string): string[] => {
    return input
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && (line.includes('twitter.com') || line.includes('x.com')));
  };

  const handleAnalyzeAll = async () => {
    const urls = parseUrls(urlInput);
    if (urls.length === 0) return;

    // Initialize queue
    const queue: UrlQueueItem[] = urls.map(url => ({ url, status: 'pending' }));
    setAnalysisQueue(queue);
    setIsAnalyzing(true);

    // Process each URL
    for (let i = 0; i < queue.length; i++) {
      // Update status to analyzing
      setAnalysisQueue(prev => prev.map((item, idx) =>
        idx === i ? { ...item, status: 'analyzing' } : item
      ));

      try {
        const response = await fetch('/api/roundtable/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: queue[i].url }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Analysis failed');
        }

        // Track API usage
        if (result.usage) {
          updateApiUsage(result.usage.claude, result.usage.grok, result.usage.openai);
        }

        // Add to analyses
        onAnalyzeComplete(result);

        // Update status to done
        setAnalysisQueue(prev => prev.map((item, idx) =>
          idx === i ? { ...item, status: 'done' } : item
        ));
      } catch (err) {
        // Update status to error
        setAnalysisQueue(prev => prev.map((item, idx) =>
          idx === i ? { ...item, status: 'error', error: err instanceof Error ? err.message : 'Failed' } : item
        ));
      }
    }

    setIsAnalyzing(false);
    setUrlInput('');
  };

  const urlCount = parseUrls(urlInput).length;
  const completedCount = analysisQueue.filter(q => q.status === 'done').length;
  const errorCount = analysisQueue.filter(q => q.status === 'error').length;

  return (
    <div className="bg-white border border-[#EEE] rounded-2xl p-5 h-fit sticky top-6">
      <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4 flex items-center gap-2">
        <Plus className="w-5 h-5 text-[#C41E3A]" />
        Add Tweets
      </h3>

      {/* URL Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-[#666] mb-2">
          Paste tweet URLs (one per line)
        </label>
        <textarea
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="https://x.com/username/status/123...
https://twitter.com/username/status/456...
https://x.com/another/status/789..."
          rows={6}
          disabled={isAnalyzing}
          className="w-full px-4 py-3 border border-[#DDD] rounded-xl text-sm focus:outline-none focus:border-[#C41E3A] resize-none font-mono disabled:bg-[#F5F5F5] disabled:cursor-not-allowed"
        />
        <p className="text-xs text-[#999] mt-1.5">
          {urlCount > 0 ? `${urlCount} tweet${urlCount > 1 ? 's' : ''} ready` : 'Supports twitter.com and x.com'}
        </p>
      </div>

      {/* Analyze Button */}
      <button
        onClick={handleAnalyzeAll}
        disabled={isAnalyzing || urlCount === 0}
        className="w-full py-3 bg-[#C41E3A] text-white rounded-xl font-medium hover:bg-[#A31830] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing {completedCount + errorCount + 1}/{analysisQueue.length}...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            {urlCount > 1 ? `Analyze ${urlCount} Tweets` : 'Analyze Tweet'}
          </>
        )}
      </button>

      {/* Progress Queue */}
      {analysisQueue.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-[#666]">Progress</p>
          <div className="max-h-48 overflow-y-auto space-y-1.5">
            {analysisQueue.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
                  item.status === 'done' ? 'bg-green-50 text-green-700' :
                  item.status === 'error' ? 'bg-red-50 text-red-700' :
                  item.status === 'analyzing' ? 'bg-blue-50 text-blue-700' :
                  'bg-[#F5F5F5] text-[#666]'
                }`}
              >
                {item.status === 'analyzing' && <Loader2 className="w-3 h-3 animate-spin" />}
                {item.status === 'done' && <CheckCircle2 className="w-3 h-3" />}
                {item.status === 'error' && <AlertCircle className="w-3 h-3" />}
                {item.status === 'pending' && <div className="w-3 h-3 rounded-full border border-current" />}
                <span className="truncate flex-1 font-mono">
                  {item.url.replace(/https?:\/\/(twitter|x)\.com\//, '@').split('/status')[0]}
                </span>
              </div>
            ))}
          </div>
          {!isAnalyzing && (completedCount > 0 || errorCount > 0) && (
            <button
              onClick={() => setAnalysisQueue([])}
              className="text-xs text-[#999] hover:text-[#666]"
            >
              Clear queue
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function RoundtableTab() {
  const [analyses, setAnalyses] = useState<TweetAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<TweetAnalysis | null>(null);
  const [analysisQueue, setAnalysisQueue] = useState<UrlQueueItem[]>([]);

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

  const handleAnalyzeComplete = (result: TweetAnalysis) => {
    setAnalyses(prev => [result, ...prev]);
  };

  return (
    <div className="flex gap-6">
      {/* Main Content - Left Side */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">Roundtable</h1>
          <p className="text-sm text-[#666] mt-1">
            Analyze tweets with Grok, Claude & GPT to learn what makes them work
          </p>
        </div>

        {/* Card Grid */}
        {analyses.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {analyses.map((analysis) => (
              <TweetCard
                key={analysis.id}
                analysis={analysis}
                onClick={() => setSelectedAnalysis(analysis)}
                onDelete={() => handleDelete(analysis.id)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-[#FAFAFA] border border-dashed border-[#DDD] rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-[#C41E3A]" />
            </div>
            <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">No tweets analyzed yet</h3>
            <p className="text-sm text-[#666] max-w-sm mx-auto">
              Paste tweet URLs in the panel on the right to analyze them with three AI perspectives
            </p>
          </div>
        )}
      </div>

      {/* Right Side Panel */}
      <div className="w-80 flex-shrink-0">
        <AddTweetsPanel
          onAnalyzeComplete={handleAnalyzeComplete}
          analysisQueue={analysisQueue}
          setAnalysisQueue={setAnalysisQueue}
        />
      </div>

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

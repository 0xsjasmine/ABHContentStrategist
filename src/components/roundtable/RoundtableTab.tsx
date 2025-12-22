'use client';

import { useState } from 'react';
import {
  MessageSquare,
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
  BookmarkPlus,
  Wand2,
  TrendingUp
} from 'lucide-react';
import type { TweetAnalysis, AIAnalysis } from '@/types';

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const getColor = (s: number) => {
    if (s >= 8) return 'bg-green-100 text-green-700 border-green-200';
    if (s >= 6) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    if (s >= 4) return 'bg-orange-100 text-orange-700 border-orange-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-medium ${getColor(score)}`}>
      <span>{label}</span>
      <span className="font-bold">{score}/10</span>
    </div>
  );
}

function AIAnalysisCard({ analysis, isGrok }: { analysis: AIAnalysis; isGrok: boolean }) {
  const Icon = isGrok ? Radio : Sparkles;
  const name = isGrok ? "Grok's Analysis" : "Claude's Analysis";
  const subtitle = isGrok ? 'Real-time cultural context' : 'Deep psychological structure';

  return (
    <div className="bg-white border border-[#EEE] rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isGrok ? 'bg-blue-50' : 'bg-red-50'}`}>
          <Icon className={`w-5 h-5 ${isGrok ? 'text-blue-600' : 'text-[#C41E3A]'}`} />
        </div>
        <div>
          <p className="font-semibold text-[#1A1A1A]">{name}</p>
          <p className="text-xs text-[#999]">{subtitle}</p>
        </div>
      </div>

      {/* Scores */}
      <div className="space-y-4">
        {/* Curiosity Gap */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-[#1A1A1A]">Curiosity Gap</span>
            <ScoreBadge score={analysis.curiosityGap.score} label="" />
          </div>
          <p className="text-sm text-[#666] leading-relaxed">{analysis.curiosityGap.analysis}</p>
        </div>

        {/* Prediction Violation */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-[#1A1A1A]">Prediction Violation</span>
            <ScoreBadge score={analysis.predictionViolation.score} label="" />
          </div>
          <p className="text-sm text-[#666] leading-relaxed">{analysis.predictionViolation.analysis}</p>
          {analysis.predictionViolation.details && analysis.predictionViolation.details.length > 0 && (
            <div className="mt-2 space-y-1">
              {analysis.predictionViolation.details.map((detail, i) => (
                <p key={i} className="text-xs text-[#999] pl-3 border-l-2 border-[#EEE]">{detail}</p>
              ))}
            </div>
          )}
        </div>

        {/* Habituation Bypass */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-[#1A1A1A]">Habituation Bypass</span>
            <ScoreBadge score={analysis.habituationBypass.score} label="" />
          </div>
          <p className="text-sm text-[#666] leading-relaxed">{analysis.habituationBypass.analysis}</p>
        </div>

        {/* Additional Triggers */}
        <div>
          <p className="text-sm font-medium text-[#1A1A1A] mb-2">Additional Triggers</p>
          <div className="flex flex-wrap gap-1.5">
            {analysis.additionalTriggers.socialProof && (
              <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full">Social Proof</span>
            )}
            {analysis.additionalTriggers.lossAversion && (
              <span className="px-2 py-0.5 bg-orange-50 text-orange-700 text-xs rounded-full">Loss Aversion</span>
            )}
            {analysis.additionalTriggers.identitySignaling && (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">Identity Signaling</span>
            )}
            {analysis.additionalTriggers.permissionGiving && (
              <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">Permission Giving</span>
            )}
            {analysis.additionalTriggers.patternCompletion && (
              <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 text-xs rounded-full">Pattern Completion</span>
            )}
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              analysis.additionalTriggers.specificityLevel === 'high'
                ? 'bg-green-50 text-green-700'
                : analysis.additionalTriggers.specificityLevel === 'medium'
                ? 'bg-yellow-50 text-yellow-700'
                : 'bg-gray-50 text-gray-600'
            }`}>
              Specificity: {analysis.additionalTriggers.specificityLevel}
            </span>
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              analysis.additionalTriggers.vulnerabilityFactor === 'high'
                ? 'bg-pink-50 text-pink-700'
                : analysis.additionalTriggers.vulnerabilityFactor === 'medium'
                ? 'bg-pink-50/50 text-pink-600'
                : 'bg-gray-50 text-gray-600'
            }`}>
              Vulnerability: {analysis.additionalTriggers.vulnerabilityFactor}
            </span>
          </div>
        </div>

        {/* Key Insight */}
        <div className="pt-3 border-t border-[#EEE]">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-[#1A1A1A] mb-1">Key Insight</p>
              <p className="text-sm text-[#666]">{analysis.keyInsight}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoundtableTab() {
  const [tweetText, setTweetText] = useState('');
  const [author, setAuthor] = useState('');
  const [handle, setHandle] = useState('');
  const [likes, setLikes] = useState('');
  const [replies, setReplies] = useState('');
  const [retweets, setRetweets] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<TweetAnalysis | null>(null);
  const [savedAnalyses, setSavedAnalyses] = useState<TweetAnalysis[]>([]);

  const handleAnalyze = async () => {
    if (!tweetText.trim() || !author.trim()) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/roundtable/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tweet: tweetText,
          author,
          handle: handle || author,
          engagement: {
            likes: parseInt(likes) || 0,
            replies: parseInt(replies) || 0,
            retweets: parseInt(retweets) || 0,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      setAnalysis(result);
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (analysis) {
      setSavedAnalyses(prev => [analysis, ...prev]);
      // Clear form
      setTweetText('');
      setAuthor('');
      setHandle('');
      setLikes('');
      setReplies('');
      setRetweets('');
      setAnalysis(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">AI Roundtable</h1>
        <p className="text-[#666] mt-1">Multiple AI perspectives on what makes content work</p>
      </div>

      {/* Input Section */}
      <div className="bg-[#FAFAFA] border border-[#EEE] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-[#C41E3A]" />
          <h2 className="font-medium text-[#1A1A1A]">Analyze a Tweet</h2>
        </div>

        <div className="space-y-4">
          {/* Tweet Text */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Tweet Text</label>
            <textarea
              value={tweetText}
              onChange={(e) => setTweetText(e.target.value)}
              placeholder="Paste the tweet text here..."
              className="w-full px-4 py-3 border border-[#DDD] rounded-xl text-sm resize-none focus:outline-none focus:border-[#C41E3A] bg-white"
              rows={4}
            />
          </div>

          {/* Author Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Author Name</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Leila Hormozi"
                className="w-full px-4 py-2.5 border border-[#DDD] rounded-xl text-sm focus:outline-none focus:border-[#C41E3A] bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Handle</label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="@LeilaHormozi"
                className="w-full px-4 py-2.5 border border-[#DDD] rounded-xl text-sm focus:outline-none focus:border-[#C41E3A] bg-white"
              />
            </div>
          </div>

          {/* Engagement Stats */}
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Engagement (optional)</label>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#DDD] rounded-xl">
                <Heart className="w-4 h-4 text-pink-500" />
                <input
                  type="number"
                  value={likes}
                  onChange={(e) => setLikes(e.target.value)}
                  placeholder="Likes"
                  className="w-full text-sm focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#DDD] rounded-xl">
                <MessageCircle className="w-4 h-4 text-blue-500" />
                <input
                  type="number"
                  value={replies}
                  onChange={(e) => setReplies(e.target.value)}
                  placeholder="Replies"
                  className="w-full text-sm focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#DDD] rounded-xl">
                <Repeat2 className="w-4 h-4 text-green-500" />
                <input
                  type="number"
                  value={retweets}
                  onChange={(e) => setRetweets(e.target.value)}
                  placeholder="Retweets"
                  className="w-full text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={!tweetText.trim() || !author.trim() || isAnalyzing}
            className="w-full py-3 bg-[#C41E3A] text-white rounded-xl font-medium hover:bg-[#A31830] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing with Grok & Claude...
              </>
            ) : (
              <>
                <Target className="w-4 h-4" />
                Run AI Roundtable
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Tweet Preview */}
          <div className="bg-white border border-[#EEE] rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-[#1A1A1A]">{analysis.tweet.author}</p>
                <p className="text-sm text-[#999]">@{analysis.tweet.handle}</p>
              </div>
              {(analysis.tweet.engagement.likes > 0 || analysis.tweet.engagement.replies > 0) && (
                <div className="flex items-center gap-3 text-sm text-[#666]">
                  {analysis.tweet.engagement.likes > 0 && (
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {analysis.tweet.engagement.likes.toLocaleString()}
                    </span>
                  )}
                  {analysis.tweet.engagement.replies > 0 && (
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {analysis.tweet.engagement.replies.toLocaleString()}
                    </span>
                  )}
                </div>
              )}
            </div>
            <p className="text-[#1A1A1A] leading-relaxed">{analysis.tweet.text}</p>
          </div>

          {/* AI Analyses Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            <AIAnalysisCard analysis={analysis.grokAnalysis} isGrok={true} />
            <AIAnalysisCard analysis={analysis.claudeAnalysis} isGrok={false} />
          </div>

          {/* Where They Agree */}
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

          {/* Where They Differ */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <ArrowRight className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Where They Differ</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-blue-600 mb-1">Grok focuses on:</p>
                <p className="text-sm text-blue-800">{analysis.differences.grokFocus}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-blue-600 mb-1">Claude focuses on:</p>
                <p className="text-sm text-blue-800">{analysis.differences.claudeFocus}</p>
              </div>
            </div>
          </div>

          {/* How You Can Use This */}
          <div className="bg-white border border-[#EEE] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Wand2 className="w-5 h-5 text-[#C41E3A]" />
              <h3 className="font-semibold text-[#1A1A1A]">How You Can Use This</h3>
            </div>
            <div className="space-y-4">
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

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 py-3 bg-[#1A1A1A] text-white rounded-xl font-medium hover:bg-black transition-colors flex items-center justify-center gap-2"
            >
              <BookmarkPlus className="w-4 h-4" />
              Save to Playbook
            </button>
            <button className="flex-1 py-3 border border-[#DDD] text-[#1A1A1A] rounded-xl font-medium hover:bg-[#F5F5F5] transition-colors flex items-center justify-center gap-2">
              <Wand2 className="w-4 h-4" />
              Generate Similar
            </button>
            <button className="flex-1 py-3 border border-[#DDD] text-[#1A1A1A] rounded-xl font-medium hover:bg-[#F5F5F5] transition-colors flex items-center justify-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Track Pattern
            </button>
          </div>
        </div>
      )}

      {/* Saved Analyses */}
      {savedAnalyses.length > 0 && (
        <div className="border-t border-[#EEE] pt-6">
          <h2 className="font-semibold text-[#1A1A1A] mb-4">Saved Analyses ({savedAnalyses.length})</h2>
          <div className="space-y-3">
            {savedAnalyses.map((saved) => (
              <button
                key={saved.id}
                onClick={() => setAnalysis(saved)}
                className="w-full text-left p-4 bg-[#FAFAFA] border border-[#EEE] rounded-xl hover:border-[#C41E3A] transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-[#1A1A1A]">{saved.tweet.author}</p>
                  <div className="flex items-center gap-2 text-xs text-[#999]">
                    <span>CG: {saved.grokAnalysis.curiosityGap.score}/10</span>
                    <span>PV: {saved.grokAnalysis.predictionViolation.score}/10</span>
                    <span>HB: {saved.grokAnalysis.habituationBypass.score}/10</span>
                  </div>
                </div>
                <p className="text-sm text-[#666] line-clamp-2">{saved.tweet.text}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

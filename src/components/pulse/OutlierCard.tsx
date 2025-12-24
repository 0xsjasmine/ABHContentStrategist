'use client';

import { useState } from 'react';
import type { OutlierTweet } from '@/app/api/pulse/outliers/route';
import type { ImportedStructure, ThoughtStarter } from '@/types';
import ReplyGirlModal from './ReplyGirlModal';

const BRAND_RED = '#C41E3A';

// Helper to build imported structure (without thought starters initially)
function buildStructure(outlier: OutlierTweet & { handle: string }): ImportedStructure {
  return {
    id: `struct_${Date.now()}`,
    sourceHandle: outlier.handle,
    sourceTweetUrl: outlier.tweet.url,
    importedAt: new Date().toISOString(),
    hookStrength: outlier.analysis.storytellingBreakdown.hookStrength || 'Not analyzed',
    structureNotes: outlier.analysis.storytellingBreakdown.structureNotes || 'Not analyzed',
    authenticityFactor: outlier.analysis.storytellingBreakdown.authenticityFactor,
    uniqueAngle: outlier.analysis.storytellingBreakdown.uniqueAngle,
    whatMadeItWork: outlier.analysis.whatStoodOut,
    theLesson: outlier.analysis.theLesson,
    topicScore: outlier.analysis.topicScore,
    storytellingScore: outlier.analysis.storytellingScore,
    outperformanceMultiple: outlier.tweet.outperformanceMultiple,
    originalTweetText: outlier.tweet.text,
  };
}

// Save structure to localStorage
function saveStructureToDiary(structure: ImportedStructure): void {
  localStorage.setItem('abh_imported_structure', JSON.stringify(structure));
}

// Fetch thought starters from API
async function fetchThoughtStarters(
  tweetText: string,
  structureNotes: string,
  theLesson: string,
  sourceHandle: string
): Promise<ThoughtStarter[]> {
  try {
    const response = await fetch('/api/pulse/thought-starters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tweetText,
        structureNotes,
        theLesson,
        sourceHandle,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch thought starters');
    }

    const result = await response.json();
    return result.thoughtStarters || [];
  } catch (error) {
    console.error('Error fetching thought starters:', error);
    return [];
  }
}

// Icons
const TrendingIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const PenIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const LightbulbIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z"/>
  </svg>
);

const ReplyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
  </svg>
);

const SendIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const LoaderIcon = () => (
  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const MicIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

// Extended type to include handle
interface OutlierCardProps {
  outlier: OutlierTweet & { handle: string };
  onSendToDiary?: (structure: ImportedStructure) => void;
}

function ScoreBar({ label, score, color, icon }: { label: string; score: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 w-28" style={{ color }}>
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score * 10}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-bold w-8 text-right" style={{ color }}>{score}/10</span>
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export default function OutlierCard({ outlier, onSendToDiary }: OutlierCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReplyGirl, setShowReplyGirl] = useState(false);
  const [structureSent, setStructureSent] = useState(false);
  const [isLoadingThoughts, setIsLoadingThoughts] = useState(false);
  const { tweet, analysis, handle } = outlier;

  // Handle sending structure to Diary (with thought starters)
  const handleSendToDiary = async () => {
    setIsLoadingThoughts(true);

    // Build the base structure
    const structure = buildStructure(outlier);

    // Fetch thought starters from all 3 AIs
    const thoughtStarters = await fetchThoughtStarters(
      tweet.text,
      structure.structureNotes,
      structure.theLesson,
      handle
    );

    // Add thought starters to structure
    structure.thoughtStarters = thoughtStarters;

    // Save to localStorage
    saveStructureToDiary(structure);

    setIsLoadingThoughts(false);
    setStructureSent(true);

    if (onSendToDiary) {
      onSendToDiary(structure);
    }

    // Reset after 3 seconds
    setTimeout(() => setStructureSent(false), 3000);
  };

  // Prepare post for Reply Girl
  const replyGirlPost = {
    text: tweet.text,
    author: handle.replace('@', ''),
    handle: handle.replace('@', ''),
    url: tweet.url,
  };

  const insightContext = `This is an outlier tweet that performed ${tweet.outperformanceMultiple}x better than average. ${analysis.whatStoodOut}. ${analysis.theLesson}`;

  // Determine if topic or storytelling driven
  const isDominantlyTopic = analysis.topicScore > analysis.storytellingScore + 2;
  const isDominantlyStorytelling = analysis.storytellingScore > analysis.topicScore + 2;

  const dominanceLabel = isDominantlyTopic
    ? 'Topic-Driven'
    : isDominantlyStorytelling
    ? 'Craft-Driven'
    : 'Balanced';

  const dominanceColor = isDominantlyTopic
    ? '#3B82F6'
    : isDominantlyStorytelling
    ? '#10B981'
    : '#8B5CF6';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: BRAND_RED }}
            >
              {handle.replace('@', '').charAt(0).toUpperCase()}
            </div>
            <div>
              <a
                href={`https://x.com/${handle.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-gray-900 hover:underline"
              >
                {handle}
              </a>
            </div>
          </div>
          <span
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: `${dominanceColor}20`, color: dominanceColor }}
          >
            {dominanceLabel}
          </span>
        </div>

        {/* Tweet Text */}
        <p className="text-gray-800 text-sm leading-relaxed mb-3">
          {tweet.text.length > 200 ? `${tweet.text.slice(0, 200)}...` : tweet.text}
        </p>

        {/* Metrics */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span>❤️</span> {formatNumber(tweet.metrics.likes)}
          </span>
          <span className="flex items-center gap-1">
            <span>🔁</span> {formatNumber(tweet.metrics.retweets)}
          </span>
          {tweet.metrics.views && (
            <span className="flex items-center gap-1">
              <span>👁</span> {formatNumber(tweet.metrics.views)}
            </span>
          )}
          {tweet.outperformanceMultiple && (
            <span
              className="ml-auto font-semibold"
              style={{ color: BRAND_RED }}
            >
              {tweet.outperformanceMultiple}x avg
            </span>
          )}
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="p-4 bg-gray-50">
        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
          Why It Worked
        </h4>

        <div className="space-y-3">
          <ScoreBar
            label="Topic/Timing"
            score={analysis.topicScore}
            color="#3B82F6"
            icon={<TrendingIcon />}
          />
          <ScoreBar
            label="Storytelling"
            score={analysis.storytellingScore}
            color="#10B981"
            icon={<PenIcon />}
          />
        </div>

        {/* Quick Insight */}
        <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
          <div className="flex items-start gap-2">
            <div className="text-amber-500 mt-0.5">
              <LightbulbIcon />
            </div>
            <div>
              <p className="text-sm text-gray-700 font-medium">{analysis.whatStoodOut}</p>
              <p className="text-xs text-gray-500 mt-1">{analysis.theLesson}</p>
            </div>
          </div>
        </div>

        {/* Expand for details */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 w-full text-center text-sm font-medium py-2 rounded-lg hover:bg-gray-100 transition-colors"
          style={{ color: BRAND_RED }}
        >
          {isExpanded ? 'Show Less' : 'Show Detailed Breakdown'}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-100 space-y-4">
          {/* Topic Breakdown */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <h5 className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
              <TrendingIcon /> Topic Analysis
            </h5>
            <p className="text-sm text-blue-900">{analysis.topicBreakdown.explanation}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {analysis.topicBreakdown.trendRiding && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                  🌊 Riding a wave
                </span>
              )}
              {analysis.topicBreakdown.culturalMoment && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                  🎯 {analysis.topicBreakdown.culturalMoment}
                </span>
              )}
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                ⏰ {analysis.topicBreakdown.timingDependence} timing dependence
              </span>
            </div>
          </div>

          {/* Storytelling Breakdown */}
          <div className="p-3 bg-green-50 rounded-lg">
            <h5 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
              <PenIcon /> Craft Analysis
            </h5>
            <p className="text-sm text-green-900">{analysis.storytellingBreakdown.explanation}</p>
            <div className="mt-2 space-y-1 text-xs text-green-800">
              {analysis.storytellingBreakdown.hookStrength && (
                <p>🎣 <strong>Hook:</strong> {analysis.storytellingBreakdown.hookStrength}</p>
              )}
              {analysis.storytellingBreakdown.structureNotes && (
                <p>📐 <strong>Structure:</strong> {analysis.storytellingBreakdown.structureNotes}</p>
              )}
              {analysis.storytellingBreakdown.authenticityFactor && (
                <p>💫 <strong>Authenticity:</strong> {analysis.storytellingBreakdown.authenticityFactor}</p>
              )}
              {analysis.storytellingBreakdown.uniqueAngle && (
                <p>🔮 <strong>Unique Angle:</strong> {analysis.storytellingBreakdown.uniqueAngle}</p>
              )}
            </div>
          </div>

          {/* ABH Relevance */}
          <div className="p-3 rounded-lg" style={{ backgroundColor: '#FEF2F2' }}>
            <h5 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: BRAND_RED }}>
              <span>✨</span> ABH Relevance
            </h5>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="px-2 py-0.5 text-xs rounded-full text-white capitalize"
                style={{ backgroundColor: BRAND_RED }}
              >
                {analysis.abhRelevance.pillar}
              </span>
              <span className="text-sm font-bold" style={{ color: BRAND_RED }}>
                {analysis.abhRelevance.score}/10
              </span>
            </div>
            <p className="text-sm" style={{ color: '#7F1D1D' }}>{analysis.abhRelevance.angle}</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            {/* Primary Action: Use This Structure + Get Thought Starters */}
            <button
              onClick={handleSendToDiary}
              disabled={structureSent || isLoadingThoughts}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
                structureSent
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : isLoadingThoughts
                  ? 'bg-gray-100 text-gray-600 border border-gray-200'
                  : 'text-white hover:opacity-90'
              }`}
              style={!structureSent && !isLoadingThoughts ? { backgroundColor: BRAND_RED } : {}}
            >
              {isLoadingThoughts ? (
                <>
                  <LoaderIcon />
                  Generating thought starters...
                </>
              ) : structureSent ? (
                <>
                  <CheckCircleIcon />
                  Ready! Open Diary for prompts
                </>
              ) : (
                <>
                  <MicIcon />
                  Use Structure + Get Thought Starters
                </>
              )}
            </button>

            {/* Secondary Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowReplyGirl(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 transition-colors hover:bg-gray-50"
              >
                <SparklesIcon />
                Reply Girl
              </button>
              <a
                href={tweet.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 transition-colors hover:bg-gray-50"
              >
                <ExternalLinkIcon />
                View Tweet
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Reply Girl Modal */}
      <ReplyGirlModal
        isOpen={showReplyGirl}
        onClose={() => setShowReplyGirl(false)}
        originalPost={replyGirlPost}
        insightContext={insightContext}
      />
    </div>
  );
}

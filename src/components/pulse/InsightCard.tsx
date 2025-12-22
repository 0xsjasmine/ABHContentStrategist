'use client';

import { useState } from 'react';
import type { ABHCategory, ABHScore, KeyPost, EngagementOpportunity } from '@/types/database';

// Icons
const CrownIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
  </svg>
);

const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LightbulbIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z"/>
  </svg>
);

const BoltIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"/>
  </svg>
);

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const HashtagIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
  </svg>
);

const ChatIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface InsightCardProps {
  id: string;
  headline: string;
  subtitle?: string;
  category: ABHCategory;
  urgency: 'high' | 'medium' | 'low';
  summary: string;
  whyThisMatters?: string;
  keyInsight?: string;
  whatToWatchFor?: string;
  abhScore: ABHScore;
  involvedAccounts?: string[];
  keyPosts?: KeyPost[];
  relatedTopics?: string[];
  engagementOpportunity?: EngagementOpportunity;
  scannedAt?: string;
  onDismiss?: (id: string) => void;
  onEngage?: (id: string, type: string) => void;
}

const categoryLabels: Record<ABHCategory, string> = {
  friendships: 'Friendships',
  ai: 'AI',
  ambition: 'Ambition',
  twenties: 'Twenties',
};

const urgencyColors = {
  high: 'pill-high',
  medium: 'pill-medium',
  low: 'pill-low',
};

function getTimeAgo(dateString?: string): string {
  if (!dateString) return 'Recently';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
  return 'Just now';
}

export default function InsightCard({
  id,
  headline,
  subtitle,
  category,
  urgency,
  summary,
  whyThisMatters,
  keyInsight,
  whatToWatchFor,
  abhScore,
  involvedAccounts = [],
  keyPosts = [],
  relatedTopics = [],
  engagementOpportunity,
  scannedAt,
  onDismiss,
  onEngage,
}: InsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="insight-card animate-slide-up">
      {/* Header */}
      <div className="insight-card-header">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="time-badge">{getTimeAgo(scannedAt)}</span>
            <span className="category-badge">
              <UserIcon />
              {categoryLabels[category]}
            </span>
          </div>
          {onDismiss && (
            <button
              onClick={() => onDismiss(id)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <XIcon />
            </button>
          )}
        </div>

        <div className="flex items-start gap-4 mt-4">
          <div className="icon-box">
            <CrownIcon />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 leading-tight">
              {headline}
            </h3>
            {subtitle && (
              <p className="text-sm mt-1" style={{ color: 'var(--red)' }}>
                {subtitle}
              </p>
            )}
          </div>
          <div className="abh-score">
            <span>{abhScore.composite}/10</span>
            <span className="abh-score-label">ABH Score</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="insight-card-body">
        {/* Summary */}
        <p className="text-gray-700 leading-relaxed">{summary}</p>

        {/* Why This Matters */}
        {whyThisMatters && (
          <div className="insight-card-section">
            <div className="insight-card-section-title">
              <LightbulbIcon />
              Why This Is Worth Noting
            </div>
            <p className="text-gray-700 text-sm">{whyThisMatters}</p>
          </div>
        )}

        {/* Key Takeaways - Show score breakdown */}
        <div className="mt-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
            <BoltIcon />
            Key Takeaways
          </div>
          <div className="space-y-2">
            {abhScore.friendships > 5 && (
              <div className="flex items-start gap-3">
                <span className="takeaway-number">1</span>
                <span className="text-sm text-gray-700">
                  Strong friendships angle ({abhScore.friendships}/10) - touches on connection and support
                </span>
              </div>
            )}
            {abhScore.ai > 5 && (
              <div className="flex items-start gap-3">
                <span className="takeaway-number">2</span>
                <span className="text-sm text-gray-700">
                  High AI relevance ({abhScore.ai}/10) - relates to AI, tech, and staying human in the AI era
                </span>
              </div>
            )}
            {abhScore.ambition > 5 && (
              <div className="flex items-start gap-3">
                <span className="takeaway-number">3</span>
                <span className="text-sm text-gray-700">
                  High ambition factor ({abhScore.ambition}/10) - relates to career, building, or goals
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Key Insight */}
        {keyInsight && (
          <div className="mt-4">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: 'var(--red)' }}>
              <SparklesIcon />
              The Key Insight
            </div>
            <div className="key-insight">
              "{keyInsight}"
            </div>
          </div>
        )}

        {/* What to Watch For */}
        {whatToWatchFor && (
          <div className="mt-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
              <EyeIcon />
              What to Watch For
            </div>
            <p className="text-sm text-gray-600">{whatToWatchFor}</p>
          </div>
        )}

        {/* Key People */}
        {involvedAccounts.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
              <UserIcon />
              Key People
            </div>
            <div className="flex flex-wrap gap-2">
              {involvedAccounts.map((handle) => (
                <div key={handle} className="person-card">
                  <div className="person-avatar">
                    {handle.replace('@', '').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{handle}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Source Posts / Tweet Embeds */}
        {keyPosts.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
              <ChatIcon />
              Source Posts
            </div>
            <div className="space-y-3">
              {keyPosts.slice(0, isExpanded ? keyPosts.length : 2).map((post, idx) => (
                <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="person-avatar w-8 h-8 text-xs">
                      {post.handle.replace('@', '').charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-sm">{post.handle}</span>
                    {post.tweetUrl && (
                      <a
                        href={post.tweetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">
                    {post.postText || post.postSummary}
                  </p>
                  {(post.likes || post.retweets) && (
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      {post.likes && <span>❤️ {post.likes.toLocaleString()}</span>}
                      {post.retweets && <span>🔄 {post.retweets.toLocaleString()}</span>}
                    </div>
                  )}
                </div>
              ))}
              {keyPosts.length > 2 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-sm font-medium w-full py-2 rounded-lg hover:bg-gray-50"
                  style={{ color: 'var(--red)' }}
                >
                  {isExpanded ? 'Show less' : `Show ${keyPosts.length - 2} more`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Related Topics */}
        {relatedTopics.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
              <HashtagIcon />
              Related Topics
            </div>
            <div className="flex flex-wrap gap-2">
              {relatedTopics.map((topic) => (
                <span key={topic} className="topic-tag">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Engagement Actions */}
        {engagementOpportunity && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <span className={`pill ${urgencyColors[engagementOpportunity.urgency]}`}>
                  {engagementOpportunity.urgency.toUpperCase()} PRIORITY
                </span>
                <p className="text-sm text-gray-600 mt-1">
                  {engagementOpportunity.suggestedAngle}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEngage?.(id, engagementOpportunity.type)}
                  className="btn-primary text-sm"
                >
                  {engagementOpportunity.type === 'reply' && 'Reply'}
                  {engagementOpportunity.type === 'quote_tweet' && 'Quote Tweet'}
                  {engagementOpportunity.type === 'thread' && 'Create Thread'}
                  {engagementOpportunity.type === 'save' && 'Save for Later'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-400">
          Scanned {scannedAt ? new Date(scannedAt).toLocaleString() : 'recently'}
        </div>
      </div>
    </div>
  );
}

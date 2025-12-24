'use client';

import { useState, useEffect, useRef } from 'react';
import type { ABHCategory, ABHScore, KeyPost, EngagementOpportunity } from '@/types/database';
import ReplyGirlModal from './ReplyGirlModal';

// Brand colors only
const BRAND_RED = '#C41E3A';
const BRAND_RED_LIGHT = '#FEF2F2';

// Icons
const CrownIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
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

const ReplyIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Twitter Embed Component
function TweetEmbed({ url }: { url: string }) {
  const embedRef = useRef<HTMLDivElement>(null);
  const [embedHtml, setEmbedHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchEmbed() {
      if (!url) return;
      try {
        const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`;
        const res = await fetch(oembedUrl);
        if (res.ok) {
          const data = await res.json();
          setEmbedHtml(data.html);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    }
    fetchEmbed();
  }, [url]);

  useEffect(() => {
    if (embedHtml && embedRef.current) {
      const loadWidget = () => {
        const twttr = (window as unknown as { twttr?: { widgets?: { load?: (el: HTMLElement) => void } } }).twttr;
        if (twttr?.widgets?.load && embedRef.current) {
          twttr.widgets.load(embedRef.current);
        }
      };

      const twttr = (window as unknown as { twttr?: { widgets?: { load?: (el: HTMLElement) => void } } }).twttr;
      if (twttr?.widgets?.load) {
        setTimeout(loadWidget, 50);
      } else {
        const existingScript = document.querySelector('script[src="https://platform.twitter.com/widgets.js"]');
        if (!existingScript) {
          const script = document.createElement('script');
          script.src = 'https://platform.twitter.com/widgets.js';
          script.async = true;
          script.onload = () => setTimeout(loadWidget, 50);
          document.body.appendChild(script);
        } else {
          setTimeout(loadWidget, 100);
        }
      }
    }
  }, [embedHtml]);

  if (isLoading) {
    return (
      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  if (error || !embedHtml) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block border border-gray-200 rounded-xl p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          View on X →
        </div>
      </a>
    );
  }

  return (
    <div
      ref={embedRef}
      className="[&_blockquote]:!m-0 [&_blockquote]:!border-0 [&_.twitter-tweet]:!m-0 [&_iframe]:!max-w-full"
      dangerouslySetInnerHTML={{ __html: embedHtml }}
    />
  );
}

export interface InsightCardProps {
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

// ==========================================
// COMPACT CARD - Grid-style card (Pinterest layout)
// ==========================================
interface InsightCardCompactProps extends InsightCardProps {
  onClick: () => void;
  isSaved?: boolean;
  onToggleSave?: () => void;
}

export function InsightCardCompact({
  headline,
  subtitle,
  abhScore,
  scannedAt,
  onClick,
  isSaved,
  onToggleSave,
  onDismiss,
  id,
}: InsightCardCompactProps) {
  // Get top pillars (score > 5)
  const topPillars = [
    abhScore.friendships > 5 && 'Friendships',
    abhScore.ai > 5 && 'AI',
    abhScore.ambition > 5 && 'Ambition',
    abhScore.twenties > 5 && 'Twenties',
  ].filter(Boolean);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg hover:border-gray-300 transition-all group flex flex-col"
    >
      {/* Card Header - Gradient background */}
      <div
        className="p-4 pb-6"
        style={{ background: `linear-gradient(135deg, ${BRAND_RED_LIGHT} 0%, #FFF 100%)` }}
      >
        {/* Top row - time & actions */}
        <div className="flex items-center justify-between mb-3">
          <span
            className="text-xs font-medium px-2 py-1 rounded-full"
            style={{ backgroundColor: BRAND_RED, color: 'white' }}
          >
            {getTimeAgo(scannedAt)}
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onToggleSave && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave();
                }}
                className="p-1.5 rounded-lg transition-colors bg-white/80 hover:bg-white"
                style={{ color: isSaved ? BRAND_RED : '#9CA3AF' }}
                title={isSaved ? 'Remove from saved' : 'Save'}
              >
                <svg className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            )}
            {onDismiss && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(id);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 bg-white/80 hover:bg-white rounded-lg transition-colors"
              >
                <XIcon />
              </button>
            )}
          </div>
        </div>

        {/* Crown icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
          style={{ backgroundColor: BRAND_RED, color: 'white' }}
        >
          <CrownIcon className="w-6 h-6" />
        </div>

        {/* Headline */}
        <h3
          className="font-semibold text-gray-900 leading-tight text-lg group-hover:opacity-80 transition-opacity"
        >
          {headline}
        </h3>
      </div>

      {/* Card Body */}
      <div className="p-4 pt-0 flex-1 flex flex-col">
        {/* Subtitle */}
        {subtitle && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {subtitle}
          </p>
        )}

        {/* Pillars as simple text */}
        {topPillars.length > 0 && (
          <p className="text-xs text-gray-400 mb-3">
            {topPillars.join(' · ')}
          </p>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer - Score */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">ABH Score</span>
          <span
            className="text-lg font-bold"
            style={{ color: BRAND_RED }}
          >
            {abhScore.composite}/10
          </span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// INSIGHT MODAL - Full analysis in overlay
// ==========================================
interface InsightModalProps extends InsightCardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InsightModal({
  isOpen,
  onClose,
  id,
  headline,
  subtitle,
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
}: InsightModalProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReplyGirl, setShowReplyGirl] = useState(false);

  // Get the first key post for Reply Girl
  const firstKeyPost = keyPosts[0];
  const replyGirlPost = firstKeyPost ? {
    text: firstKeyPost.postText || firstKeyPost.postSummary || headline,
    author: firstKeyPost.handle?.replace('@', '') || 'Unknown',
    handle: firstKeyPost.handle?.replace('@', '') || 'unknown',
    url: firstKeyPost.tweetUrl,
  } : {
    text: headline + (subtitle ? ` - ${subtitle}` : ''),
    author: involvedAccounts[0]?.replace('@', '') || 'Discussion',
    handle: involvedAccounts[0]?.replace('@', '') || 'discussion',
  };

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: BRAND_RED }}>
              <CrownIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{headline}</h2>
              {subtitle && (
                <p className="text-sm text-gray-600">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-14 h-14 rounded-xl text-white flex flex-col items-center justify-center" style={{ backgroundColor: BRAND_RED }}>
              <span className="text-lg font-bold">{abhScore.composite}/10</span>
              <span className="text-[8px] uppercase tracking-wide opacity-80">ABH</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XIcon />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Pillar Tags - Brand colors only */}
          <div className="flex flex-wrap gap-2 mb-4">
            {abhScore.friendships > 5 && (
              <span className="text-sm px-3 py-1 rounded-full border border-gray-200 text-gray-600">
                Friendships {abhScore.friendships}
              </span>
            )}
            {abhScore.ai > 5 && (
              <span className="text-sm px-3 py-1 rounded-full border border-gray-200 text-gray-600">
                AI {abhScore.ai}
              </span>
            )}
            {abhScore.ambition > 5 && (
              <span className="text-sm px-3 py-1 rounded-full border border-gray-200 text-gray-600">
                Ambition {abhScore.ambition}
              </span>
            )}
            {abhScore.twenties > 5 && (
              <span className="text-sm px-3 py-1 rounded-full border border-gray-200 text-gray-600">
                Twenties {abhScore.twenties}
              </span>
            )}
          </div>

          {/* Summary */}
          <p className="text-gray-700 leading-relaxed">{summary}</p>

          {/* Why This Matters */}
          {whyThisMatters && (
            <div className="mt-6 p-4 rounded-xl border border-gray-200" style={{ backgroundColor: BRAND_RED_LIGHT }}>
              <div className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: BRAND_RED }}>
                <LightbulbIcon />
                Why This Is Worth Noting
              </div>
              <p className="text-gray-700 text-sm">{whyThisMatters}</p>
            </div>
          )}

          {/* Key Takeaways */}
          <div className="mt-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
              <BoltIcon />
              Key Takeaways
            </div>
            <div className="space-y-2">
              {abhScore.friendships > 5 && (
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 text-white" style={{ backgroundColor: BRAND_RED }}>1</span>
                  <span className="text-sm text-gray-700">
                    Strong friendships angle ({abhScore.friendships}/10) - touches on connection and support
                  </span>
                </div>
              )}
              {abhScore.ai > 5 && (
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 text-white" style={{ backgroundColor: BRAND_RED }}>2</span>
                  <span className="text-sm text-gray-700">
                    High AI relevance ({abhScore.ai}/10) - relates to AI, tech, and staying human in the AI era
                  </span>
                </div>
              )}
              {abhScore.ambition > 5 && (
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 text-white" style={{ backgroundColor: BRAND_RED }}>3</span>
                  <span className="text-sm text-gray-700">
                    High ambition factor ({abhScore.ambition}/10) - relates to career, building, or goals
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Key Insight */}
          {keyInsight && (
            <div className="mt-6">
              <div className="flex items-center gap-2 text-sm font-semibold mb-2" style={{ color: BRAND_RED }}>
                <SparklesIcon />
                The Key Insight
              </div>
              <div className="p-4 rounded-xl border border-gray-200 italic text-gray-700" style={{ backgroundColor: BRAND_RED_LIGHT }}>
                "{keyInsight}"
              </div>
            </div>
          )}

          {/* What to Watch For */}
          {whatToWatchFor && (
            <div className="mt-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                <EyeIcon />
                What to Watch For
              </div>
              <p className="text-sm text-gray-600">{whatToWatchFor}</p>
            </div>
          )}

          {/* Key People */}
          {involvedAccounts.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
                <UserIcon />
                Key People
              </div>
              <div className="flex flex-wrap gap-2">
                {involvedAccounts.map((handle) => (
                  <a
                    key={handle}
                    href={`https://twitter.com/${handle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ backgroundColor: BRAND_RED }}>
                      {handle.replace('@', '').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{handle}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Source Posts */}
          {keyPosts.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
                <ChatIcon />
                Source Posts
              </div>
              <div className="space-y-3">
                {keyPosts.slice(0, isExpanded ? keyPosts.length : 2).map((post, idx) => (
                  <div key={idx}>
                    {post.tweetUrl ? (
                      <TweetEmbed url={post.tweetUrl} />
                    ) : (
                      <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-medium">
                            {post.handle.replace('@', '').charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-sm">{post.handle}</span>
                        </div>
                        <p className="text-sm text-gray-700">
                          {post.postText || post.postSummary}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                {keyPosts.length > 2 && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-sm font-medium w-full py-2 rounded-lg hover:bg-gray-50"
                    style={{ color: BRAND_RED }}
                  >
                    {isExpanded ? 'Show less' : `Show ${keyPosts.length - 2} more`}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Related Topics */}
          {relatedTopics.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                <HashtagIcon />
                Related Topics
              </div>
              <div className="flex flex-wrap gap-2">
                {relatedTopics.map((topic) => (
                  <span key={topic} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Engagement Opportunity */}
          {engagementOpportunity && (
            <div className="mt-6 p-4 rounded-xl border border-gray-200" style={{ backgroundColor: BRAND_RED_LIGHT }}>
              <div className="flex items-center justify-between">
                <div>
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded text-white"
                    style={{ backgroundColor: engagementOpportunity.urgency === 'high' ? BRAND_RED : '#6B7280' }}
                  >
                    {engagementOpportunity.urgency.toUpperCase()} PRIORITY
                  </span>
                  <p className="text-sm text-gray-700 mt-2">
                    {engagementOpportunity.suggestedAngle}
                  </p>
                </div>
                <button
                  onClick={() => onEngage?.(id, engagementOpportunity.type)}
                  className="px-4 py-2 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: BRAND_RED }}
                >
                  {engagementOpportunity.type === 'reply' && 'Reply'}
                  {engagementOpportunity.type === 'quote_tweet' && 'Quote Tweet'}
                  {engagementOpportunity.type === 'thread' && 'Create Thread'}
                  {engagementOpportunity.type === 'save' && 'Save for Later'}
                </button>
              </div>
            </div>
          )}

          {/* Reply Girl Button */}
          <div className="mt-6">
            <button
              onClick={() => setShowReplyGirl(true)}
              className="w-full py-3 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2 hover:opacity-90"
              style={{ backgroundColor: BRAND_RED }}
            >
              <ReplyIcon />
              Generate Reply with 3 AIs
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400 text-center">
            Scanned {scannedAt ? new Date(scannedAt).toLocaleString() : 'recently'}
          </div>
        </div>
      </div>

      {/* Reply Girl Modal */}
      <ReplyGirlModal
        isOpen={showReplyGirl}
        onClose={() => setShowReplyGirl(false)}
        originalPost={replyGirlPost}
        insightContext={summary + (whyThisMatters ? ` Why it matters: ${whyThisMatters}` : '')}
      />
    </div>
  );
}

// ==========================================
// DEFAULT EXPORT - Compact card + Modal
// ==========================================
interface InsightCardWithModalProps extends InsightCardProps {
  isSaved?: boolean;
  onToggleSave?: () => void;
}

export default function InsightCard(props: InsightCardWithModalProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <InsightCardCompact
        {...props}
        isSaved={props.isSaved}
        onToggleSave={props.onToggleSave}
        onClick={() => setIsModalOpen(true)}
      />
      <InsightModal
        {...props}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';

/**
 * TwitterEmbed Component
 *
 * Embeds actual X/Twitter posts using Twitter's widget.js
 * No API key required - uses Twitter's official embed script
 */

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (element?: HTMLElement) => void;
        createTweet: (
          tweetId: string,
          container: HTMLElement,
          options?: {
            theme?: 'light' | 'dark';
            align?: 'left' | 'center' | 'right';
            conversation?: 'none' | 'all';
            cards?: 'hidden' | 'visible';
            width?: number;
            dnt?: boolean;
          }
        ) => Promise<HTMLElement | undefined>;
      };
    };
  }
}

interface TwitterEmbedProps {
  tweetUrl: string;
  theme?: 'light' | 'dark';
  hideCard?: boolean;
}

// Extract tweet ID from various Twitter/X URL formats
function extractTweetId(url: string): string | null {
  try {
    // Handle various URL formats:
    // https://twitter.com/user/status/1234567890
    // https://x.com/user/status/1234567890
    // https://twitter.com/user/status/1234567890?s=20
    const patterns = [
      /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/,
      /\/status\/(\d+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  } catch {
    return null;
  }
}

// Load Twitter widget script once
let twitterScriptLoaded = false;
let twitterScriptLoading = false;
const loadCallbacks: (() => void)[] = [];

function loadTwitterScript(): Promise<void> {
  return new Promise((resolve) => {
    if (twitterScriptLoaded && window.twttr) {
      resolve();
      return;
    }

    loadCallbacks.push(resolve);

    if (twitterScriptLoading) {
      return;
    }

    twitterScriptLoading = true;

    const script = document.createElement('script');
    script.src = 'https://platform.twitter.com/widgets.js';
    script.async = true;
    script.onload = () => {
      twitterScriptLoaded = true;
      twitterScriptLoading = false;
      loadCallbacks.forEach(cb => cb());
      loadCallbacks.length = 0;
    };
    script.onerror = () => {
      twitterScriptLoading = false;
      loadCallbacks.forEach(cb => cb());
      loadCallbacks.length = 0;
    };
    document.head.appendChild(script);
  });
}

export default function TwitterEmbed({ tweetUrl, theme = 'light', hideCard = false }: TwitterEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [embedded, setEmbedded] = useState(false);

  const tweetId = extractTweetId(tweetUrl);

  useEffect(() => {
    if (!tweetId || !containerRef.current || embedded) return;

    let isMounted = true;

    async function embedTweet() {
      try {
        await loadTwitterScript();

        if (!isMounted || !containerRef.current || !window.twttr) {
          return;
        }

        // Clear container
        containerRef.current.innerHTML = '';

        // Create the tweet embed
        const element = await window.twttr.widgets.createTweet(
          tweetId!,
          containerRef.current,
          {
            theme,
            align: 'center',
            conversation: 'none',
            cards: hideCard ? 'hidden' : 'visible',
            dnt: true,
          }
        );

        if (isMounted) {
          if (element) {
            setIsLoading(false);
            setEmbedded(true);
          } else {
            setError('Tweet not found or unavailable');
            setIsLoading(false);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load tweet');
          setIsLoading(false);
        }
      }
    }

    embedTweet();

    return () => {
      isMounted = false;
    };
  }, [tweetId, theme, hideCard, embedded]);

  if (!tweetId) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
        <p className="text-sm text-gray-500">Invalid tweet URL</p>
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[#8B2635] hover:underline flex items-center justify-center gap-1 mt-2"
        >
          View on X <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
        <p className="text-sm text-gray-500 mb-2">{error}</p>
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[#8B2635] hover:underline flex items-center justify-center gap-1"
        >
          View on X <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  return (
    <div className="twitter-embed-container relative min-h-[150px]">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
          <Loader2 className="w-6 h-6 text-[#8B2635] animate-spin" />
        </div>
      )}
      <div ref={containerRef} className="twitter-embed" />
    </div>
  );
}

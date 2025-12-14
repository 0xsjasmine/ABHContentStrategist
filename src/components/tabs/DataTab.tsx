'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Users, MessageSquare, Zap, RefreshCw, Send, Sparkles } from 'lucide-react';

interface BriefStats {
  trends: number;
  people: number;
  debates: number;
  urgent: boolean;
}

export default function DataTab() {
  const [brief, setBrief] = useState<string>('');
  const [stats, setStats] = useState<BriefStats>({ trends: 0, people: 0, debates: 0, urgent: false });
  const [handles, setHandles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    const key = localStorage.getItem('abh_grok_key');
    setHasApiKey(!!key);
  }, []);

  const fetchBrief = async (searchQuery?: string) => {
    const grokKey = localStorage.getItem('abh_grok_key');
    if (!grokKey) {
      setBrief('Add your Grok API key in Settings to get cultural intelligence.');
      return;
    }

    setIsLoading(true);
    setBrief('');

    try {
      const response = await fetch('/api/trends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-grok-api-key': grokKey,
        },
        body: JSON.stringify({
          query: searchQuery || null,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setBrief(`Error: ${data.error}`);
      } else {
        setBrief(data.brief);
        setStats(data.stats || { trends: 0, people: 0, debates: 0, urgent: false });
        setHandles(data.handles || []);
        setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (error) {
      setBrief('Failed to fetch trends. Check your connection and API key.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      fetchBrief(query.trim());
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">Cultural Brief</h1>
          {lastUpdated && (
            <p className="text-sm text-[#999] mt-1">Last updated {lastUpdated}</p>
          )}
        </div>
        <button
          onClick={() => fetchBrief()}
          disabled={isLoading || !hasApiKey}
          className="flex items-center gap-2 btn-primary disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Loading...' : 'Get Brief'}
        </button>
      </div>

      {/* Bento Stats */}
      {(stats.trends > 0 || stats.people > 0) && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bento-item text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-2 text-[#666]" />
            <p className="text-2xl font-semibold text-[#1A1A1A]">{stats.trends}</p>
            <p className="text-xs text-[#999]">trends</p>
          </div>
          <div className="bento-item text-center">
            <Users className="w-5 h-5 mx-auto mb-2 text-[#666]" />
            <p className="text-2xl font-semibold text-[#1A1A1A]">{stats.people}</p>
            <p className="text-xs text-[#999]">people</p>
          </div>
          <div className="bento-item text-center">
            <MessageSquare className="w-5 h-5 mx-auto mb-2 text-[#666]" />
            <p className="text-2xl font-semibold text-[#1A1A1A]">{stats.debates}</p>
            <p className="text-xs text-[#999]">debates</p>
          </div>
          <div className={`bento-item text-center ${stats.urgent ? 'bg-red-50' : ''}`}>
            <Zap className={`w-5 h-5 mx-auto mb-2 ${stats.urgent ? 'text-red-500' : 'text-[#666]'}`} />
            <p className={`text-2xl font-semibold ${stats.urgent ? 'text-red-600' : 'text-[#1A1A1A]'}`}>
              {stats.urgent ? 'YES' : '—'}
            </p>
            <p className="text-xs text-[#999]">urgent</p>
          </div>
        </div>
      )}

      {/* Hot Handles - quick glance */}
      {handles.length > 0 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="text-xs text-[#999] mr-1">Mentioned:</span>
          {handles.map((handle, i) => (
            <span key={i} className="text-sm text-[#1A1A1A] bg-[#F5F5F5] px-2 py-1 rounded-md">
              {handle}
            </span>
          ))}
        </div>
      )}

      {/* Main Brief - Conversational AI Response */}
      <div className="mb-6">
        {!brief && !isLoading && (
          <div className="message-ai text-center py-12">
            <Sparkles className="w-8 h-8 mx-auto mb-4 text-[#999]" />
            <p className="text-[#666] mb-2">Your cultural strategist is ready</p>
            <p className="text-sm text-[#999]">
              {hasApiKey
                ? 'Click "Get Brief" for today\'s cultural intelligence'
                : 'Add your Grok API key in Settings to get started'}
            </p>
          </div>
        )}

        {isLoading && (
          <div className="message-ai">
            <div className="flex items-center gap-3">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="text-[#666]">Analyzing cultural landscape...</span>
            </div>
          </div>
        )}

        {brief && !isLoading && (
          <div className="message-ai animate-in">
            <div className="prose prose-sm max-w-none">
              {brief.split('\n').map((line, i) => {
                // Style different parts of the response
                if (line.startsWith('#') || line.match(/^[0-9]+\./)) {
                  return <p key={i} className="font-semibold text-[#1A1A1A] mt-4 mb-2">{line.replace(/^#+\s*/, '')}</p>;
                }
                if (line.includes('HIGH URGENCY') || line.includes('⚡')) {
                  return <p key={i} className="text-red-600 font-medium">{line}</p>;
                }
                if (line.includes('@')) {
                  return <p key={i} className="text-[#1A1A1A]">{line}</p>;
                }
                if (line.trim() === '') {
                  return <br key={i} />;
                }
                return <p key={i} className="text-[#666]">{line}</p>;
              })}
            </div>
          </div>
        )}
      </div>

      {/* Ask Follow-up */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about a specific trend or topic..."
          className="flex-1 px-4 py-3 border border-[#EEE] rounded-xl focus:outline-none focus:border-[#1A1A1A] text-sm"
          disabled={!hasApiKey}
        />
        <button
          type="submit"
          disabled={!query.trim() || isLoading || !hasApiKey}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {!hasApiKey && (
        <p className="text-center text-sm text-[#999] mt-4">
          Add your Grok API key in Settings (gear icon in sidebar)
        </p>
      )}
    </div>
  );
}

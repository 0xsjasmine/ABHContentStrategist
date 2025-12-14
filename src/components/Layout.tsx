'use client';

import { useState, type ReactNode } from 'react';
import {
  BookOpen,
  PenSquare,
  Sparkles,
  TrendingUp,
  MessageCircle,
  Settings,
} from 'lucide-react';
import type { TabId } from '@/types';

interface LayoutProps {
  children: ReactNode;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs = [
  { id: 'diary' as TabId, label: 'Diary', icon: PenSquare, emoji: '📝' },
  { id: 'creator' as TabId, label: 'Creator', icon: Sparkles, emoji: '💡' },
  { id: 'books' as TabId, label: 'Books', icon: BookOpen, emoji: '📚' },
  { id: 'data' as TabId, label: 'Data', icon: TrendingUp, emoji: '📊' },
  { id: 'reply' as TabId, label: 'Reply Girl', icon: MessageCircle, emoji: '💬' },
];

export default function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-neutral-900">
              Ambitious But Human
            </h1>
            <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full">
              Content Strategist
            </span>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Tab Navigation */}
        <nav className="bg-white border-b border-neutral-200">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex gap-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`
                      flex items-center gap-2 px-4 py-3 text-sm font-medium
                      border-b-2 transition-all duration-200
                      ${isActive
                        ? 'text-neutral-900 border-neutral-900'
                        : 'text-neutral-500 border-transparent hover:text-neutral-700 hover:border-neutral-300'
                      }
                    `}
                  >
                    <span className="text-base">{tab.emoji}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Settings Modal would go here */}
      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

function SettingsPanel({ onClose }: { onClose: () => void }) {
  const [claudeKey, setClaudeKey] = useState('');
  const [grokKey, setGrokKey] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Settings</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Claude API Key
            </label>
            <input
              type="password"
              value={claudeKey}
              onChange={(e) => setClaudeKey(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500"
            />
            <p className="text-xs text-neutral-500 mt-1">
              For content generation and analysis
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Grok API Key
            </label>
            <input
              type="password"
              value={grokKey}
              onChange={(e) => setGrokKey(e.target.value)}
              placeholder="xai-..."
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-500"
            />
            <p className="text-xs text-neutral-500 mt-1">
              For trends and cultural intelligence
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              // Save to IndexedDB settings
              localStorage.setItem('abh_claude_key', claudeKey);
              localStorage.setItem('abh_grok_key', grokKey);
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

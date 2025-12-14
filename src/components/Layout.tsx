'use client';

import { useState, type ReactNode } from 'react';
import {
  PenSquare,
  Sparkles,
  BookOpen,
  TrendingUp,
  MessageCircle,
  Settings,
  X,
} from 'lucide-react';
import type { TabId } from '@/types';

interface LayoutProps {
  children: ReactNode;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs = [
  { id: 'diary' as TabId, icon: PenSquare, label: 'Diary' },
  { id: 'creator' as TabId, icon: Sparkles, label: 'Inspo' },
  { id: 'books' as TabId, icon: BookOpen, label: 'Library' },
  { id: 'data' as TabId, icon: TrendingUp, label: 'Trends' },
  { id: 'reply' as TabId, icon: MessageCircle, label: 'Reply' },
];

export default function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Side Navigation */}
      <nav
        className={`
          fixed left-0 top-0 h-full z-40
          glass-strong rounded-r-3xl
          flex flex-col items-center py-8
          transition-all duration-300 ease-out
          ${sidebarExpanded ? 'w-44' : 'w-20'}
        `}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        {/* Logo / Brand */}
        <div className="mb-12 px-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#C4A484] to-[#E8D4CF] flex items-center justify-center shadow-sm">
            <span className="text-white text-lg font-light">A</span>
          </div>
        </div>

        {/* Nav Items */}
        <div className="flex-1 flex flex-col gap-2 w-full px-3">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  group flex items-center gap-3 px-3 py-3 rounded-2xl
                  transition-all duration-200 w-full
                  ${isActive
                    ? 'glass bg-white/80 shadow-sm'
                    : 'hover:bg-white/40'
                  }
                `}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition-colors ${
                    isActive ? 'text-[#C4A484]' : 'text-[#6B6560] group-hover:text-[#2D2A26]'
                  }`}
                />
                <span
                  className={`
                    text-sm font-light whitespace-nowrap overflow-hidden
                    transition-all duration-300
                    ${sidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}
                    ${isActive ? 'text-[#2D2A26]' : 'text-[#6B6560] group-hover:text-[#2D2A26]'}
                  `}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Settings */}
        <div className="px-3 w-full">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-white/40 transition-all w-full group"
          >
            <Settings className="w-5 h-5 text-[#9C958E] group-hover:text-[#6B6560]" />
            <span
              className={`
                text-sm font-light text-[#9C958E] group-hover:text-[#6B6560]
                whitespace-nowrap overflow-hidden transition-all duration-300
                ${sidebarExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'}
              `}
            >
              Settings
            </span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 ml-20 min-h-screen">
        <div className="max-w-4xl mx-auto px-8 py-12">
          {children}
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

function SettingsModal({ onClose }: { onClose: () => void }) {
  const [claudeKey, setClaudeKey] = useState('');
  const [grokKey, setGrokKey] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#2D2A26]/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative glass-strong rounded-3xl w-full max-w-md p-8 animate-slide-up">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/50 transition-colors"
        >
          <X className="w-4 h-4 text-[#9C958E]" />
        </button>

        <h2 className="text-xl font-light text-[#2D2A26] mb-6">Settings</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-light text-[#6B6560] mb-2">
              Claude API Key
            </label>
            <input
              type="password"
              value={claudeKey}
              onChange={(e) => setClaudeKey(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full px-4 py-3 glass-subtle rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C4A484]/50"
            />
          </div>

          <div>
            <label className="block text-sm font-light text-[#6B6560] mb-2">
              Grok API Key
            </label>
            <input
              type="password"
              value={grokKey}
              onChange={(e) => setGrokKey(e.target.value)}
              placeholder="xai-..."
              className="w-full px-4 py-3 glass-subtle rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C4A484]/50"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-light text-[#6B6560] hover:text-[#2D2A26] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              localStorage.setItem('abh_claude_key', claudeKey);
              localStorage.setItem('abh_grok_key', grokKey);
              onClose();
            }}
            className="px-5 py-2.5 text-sm font-light bg-gradient-to-r from-[#C4A484] to-[#E8D4CF] text-white rounded-full hover:opacity-90 transition-opacity"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

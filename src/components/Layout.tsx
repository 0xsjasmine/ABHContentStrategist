'use client';

import { useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import type { TabId } from '@/types';

interface LayoutProps {
  children: ReactNode;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs = [
  { id: 'diary' as TabId, label: 'Diary' },
  { id: 'pulse' as TabId, label: 'PULSE' },
  { id: 'vibe' as TabId, label: 'VIBE' },
  { id: 'studio' as TabId, label: 'STUDIO' },
  { id: 'library' as TabId, label: 'Library' },
];

export default function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="min-h-screen flex bg-white">
      {/* Side Navigation - Always Expanded (Text Only) */}
      <nav className="sidebar fixed left-0 top-0 h-full z-40 flex flex-col py-6 w-32">
        {/* Logo / Brand */}
        <div className="mb-8 px-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#C41E3A]">
            <span className="text-white text-sm font-semibold">A</span>
          </div>
        </div>

        {/* Nav Items - Text Only */}
        <div className="flex-1 flex flex-col gap-1 w-full px-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  px-3 py-2.5 rounded-lg text-left
                  transition-colors duration-150 w-full
                  text-sm font-medium
                  ${isActive
                    ? 'text-[#C41E3A]'
                    : 'text-[#666] hover:text-[#1A1A1A]'
                  }
                `}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Settings - Text Only */}
        <div className="px-2 w-full">
          <button
            onClick={() => setShowSettings(true)}
            className="px-3 py-2.5 rounded-lg text-left w-full text-sm font-medium text-[#666] hover:text-[#1A1A1A] transition-colors"
          >
            Settings
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 ml-32 min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-8 py-10">
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
  const [claudeKey, setClaudeKey] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('abh_claude_key') || '' : ''
  );
  const [grokKey, setGrokKey] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('abh_grok_key') || '' : ''
  );

  const handleSave = () => {
    localStorage.setItem('abh_claude_key', claudeKey);
    localStorage.setItem('abh_grok_key', grokKey);
    onClose();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[#F5F5F5] transition-colors"
        >
          <X className="w-4 h-4 text-[#999]" />
        </button>

        <h2 className="text-xl font-semibold text-[#1A1A1A] mb-6">Settings</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
              Claude API Key
            </label>
            <input
              type="password"
              value={claudeKey}
              onChange={(e) => setClaudeKey(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full px-4 py-3 border border-[#EEE] rounded-xl text-sm focus:outline-none focus:border-[#1A1A1A]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
              Grok API Key
            </label>
            <input
              type="password"
              value={grokKey}
              onChange={(e) => setGrokKey(e.target.value)}
              placeholder="xai-..."
              className="w-full px-4 py-3 border border-[#EEE] rounded-xl text-sm focus:outline-none focus:border-[#1A1A1A]"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} className="flex-1 btn-primary">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

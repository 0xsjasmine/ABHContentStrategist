'use client';

import { useState, useEffect, type ReactNode } from 'react';
import type { TabId } from '@/types';

interface LayoutProps {
  children: ReactNode;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs = [
  { id: 'diary' as TabId, label: 'Diary' },
  { id: 'pulse' as TabId, label: 'Pulse' },
  { id: 'vibe' as TabId, label: 'Vibe' },
  { id: 'studio' as TabId, label: 'Studio' },
  { id: 'library' as TabId, label: 'Library' },
];

interface ApiUsage {
  claude: { calls: number; cost: number };
  grok: { calls: number; cost: number };
}

export default function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const [apiUsage, setApiUsage] = useState<ApiUsage>({
    claude: { calls: 0, cost: 0 },
    grok: { calls: 0, cost: 0 },
  });

  useEffect(() => {
    // Load API usage from localStorage
    const stored = localStorage.getItem('abh_api_usage');
    if (stored) {
      try {
        setApiUsage(JSON.parse(stored));
      } catch {
        // Ignore parse errors
      }
    }

    // Listen for usage updates
    const handleStorageChange = () => {
      const updated = localStorage.getItem('abh_api_usage');
      if (updated) {
        try {
          setApiUsage(JSON.parse(updated));
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Also poll every 5 seconds for same-tab updates
    const interval = setInterval(handleStorageChange, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const totalCost = apiUsage.claude.cost + apiUsage.grok.cost;

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

        {/* API Usage Tracker */}
        <div className="px-3 py-3 mx-2 rounded-lg bg-[#FAFAFA] border border-[#EEE]">
          <p className="text-[10px] font-medium text-[#999] uppercase tracking-wide mb-2">API Usage</p>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-[#666]">Claude</span>
              <span className="text-[#1A1A1A] font-medium">${apiUsage.claude.cost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#666]">Grok</span>
              <span className="text-[#1A1A1A] font-medium">${apiUsage.grok.cost.toFixed(2)}</span>
            </div>
            <div className="pt-1 mt-1 border-t border-[#EEE] flex justify-between text-xs">
              <span className="text-[#666]">Total</span>
              <span className="text-[#C41E3A] font-semibold">${totalCost.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 ml-32 min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-8 py-10">
          {children}
        </div>
      </main>
    </div>
  );
}

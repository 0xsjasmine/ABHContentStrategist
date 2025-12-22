'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { BarChart3 } from 'lucide-react';
import type { TabId } from '@/types';
import ApiUsageModal from './ApiUsageModal';

interface LayoutProps {
  children: ReactNode;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs = [
  { id: 'diary' as TabId, label: 'Diary' },
  { id: 'pulse' as TabId, label: 'Pulse' },
  { id: 'roundtable' as TabId, label: 'Roundtable' },
  { id: 'studio' as TabId, label: 'Studio' },
  { id: 'library' as TabId, label: 'Library' },
];

export default function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    // Load current month usage for sidebar display
    const loadUsage = () => {
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const stored = localStorage.getItem(`abh_api_usage_${currentMonth}`);
      if (stored) {
        try {
          const usage = JSON.parse(stored);
          setTotalCost(usage.claude.cost + usage.grok.cost);
        } catch {
          setTotalCost(0);
        }
      }
    };

    loadUsage();
    const interval = setInterval(loadUsage, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex bg-[#FFF6D9]">
      {/* Side Navigation - Always Expanded (Text Only) */}
      <nav className="sidebar fixed left-0 top-0 h-full z-40 flex flex-col py-6 w-32">
        {/* Logo / Brand */}
        <div className="mb-8 px-3">
          <img
            src="/logo.png"
            alt="Ambitious But Human"
            className="w-full h-auto"
          />
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

        {/* API Usage Button */}
        <button
          onClick={() => setShowUsageModal(true)}
          className="mx-2 px-3 py-3 rounded-lg bg-[#FAFAFA] border border-[#EEE] hover:border-[#DDD] hover:bg-white transition-colors text-left"
        >
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-3.5 h-3.5 text-[#999]" />
            <span className="text-[10px] font-medium text-[#999] uppercase tracking-wide">API Costs</span>
          </div>
          <p className="text-lg font-semibold text-[#C41E3A]">${totalCost.toFixed(2)}</p>
          <p className="text-[10px] text-[#999]">This month</p>
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 ml-32 min-h-screen bg-[#FFF6D9]">
        <div className="max-w-6xl mx-auto px-8 py-10">
          {children}
        </div>
      </main>

      {/* API Usage Modal */}
      <ApiUsageModal
        isOpen={showUsageModal}
        onClose={() => setShowUsageModal(false)}
      />
    </div>
  );
}

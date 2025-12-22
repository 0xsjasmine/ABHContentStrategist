'use client';

import { useState, useEffect } from 'react';
import { X, BarChart3, Zap, DollarSign, ChevronLeft, ChevronRight, Sparkles, Radio } from 'lucide-react';

interface UsageData {
  month: string;
  totalCost: number;
  totalCalls: number;
  avgPerCall: number;
  byProvider: {
    claude: { calls: number; cost: number; tokens: number };
    grok: { calls: number; cost: number; tokens: number };
  };
  byFeature: {
    feature: string;
    calls: number;
    cost: number;
  }[];
}

interface BudgetTrackerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mock data for demonstration - in production, this would come from API
const mockData: UsageData = {
  month: 'December 2025',
  totalCost: 13.11,
  totalCalls: 105,
  avgPerCall: 0.12,
  byProvider: {
    claude: { calls: 3, cost: 0.01, tokens: 772 },
    grok: { calls: 102, cost: 13.10, tokens: 2935156 },
  },
  byFeature: [
    { feature: 'PULSE:Watchlist_scan', calls: 98, cost: 12.31 },
    { feature: 'PULSE:Daily_summary', calls: 3, cost: 0.43 },
    { feature: 'STUDIO:Tweet_generation', calls: 3, cost: 0.01 },
    { feature: 'STUDIO:Voice_polish', calls: 1, cost: 0.36 },
  ],
};

export default function BudgetTracker({ isOpen, onClose }: BudgetTrackerProps) {
  const [data, setData] = useState<UsageData>(mockData);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // In production, fetch real data here
      // fetchUsageData().then(setData);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in">
        {/* Header - Burgundy */}
        <div className="bg-[#8B2635] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5" />
            <h2 className="text-lg font-semibold">API Usage & Costs</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Month Navigation */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <span className="text-lg font-medium text-gray-900">{data.month}</span>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {/* Total Cost */}
            <div className="bg-[#8B2635] rounded-xl p-4 text-white">
              <div className="flex items-center gap-2 text-white/80 text-sm mb-1">
                <DollarSign className="w-4 h-4" />
                Total Cost
              </div>
              <div className="text-2xl font-bold">${data.totalCost.toFixed(2)}</div>
              <div className="text-xs text-white/60 mt-1">
                +${data.totalCost.toFixed(2)} vs last month
              </div>
            </div>

            {/* Total Calls */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <Zap className="w-4 h-4" />
                Total API Calls
              </div>
              <div className="text-2xl font-bold text-gray-900">{data.totalCalls}</div>
              <div className="text-xs text-[#8B2635] mt-1">
                +{data.totalCalls} vs last month
              </div>
            </div>

            {/* Avg per Call */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <BarChart3 className="w-4 h-4" />
                Avg per Call
              </div>
              <div className="text-2xl font-bold text-gray-900">${data.avgPerCall.toFixed(2)}</div>
              <div className="text-xs text-gray-500 mt-1">
                Average cost per API call
              </div>
            </div>
          </div>

          {/* By Provider */}
          <h3 className="text-sm font-semibold text-gray-900 mb-3">By Provider</h3>
          <div className="grid grid-cols-2 gap-4 mb-8">
            {/* Claude */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#8B2635]" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Claude (Anthropic)</div>
                  <div className="text-xs text-gray-500">AI Research & Polish</div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Calls</span>
                  <span className="font-medium">{data.byProvider.claude.calls}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cost</span>
                  <span className="font-medium text-[#8B2635]">${data.byProvider.claude.cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tokens</span>
                  <span className="font-medium">{data.byProvider.claude.tokens.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Grok */}
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Radio className="w-5 h-5 text-[#8B2635]" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Grok (xAI)</div>
                  <div className="text-xs text-gray-500">Pulse & Social Scanning</div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Calls</span>
                  <span className="font-medium">{data.byProvider.grok.calls}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cost</span>
                  <span className="font-medium text-[#8B2635]">${data.byProvider.grok.cost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tokens</span>
                  <span className="font-medium">{data.byProvider.grok.tokens.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* By Feature */}
          <h3 className="text-sm font-semibold text-gray-900 mb-3">By Feature</h3>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Feature</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Calls</th>
                  <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Cost</th>
                </tr>
              </thead>
              <tbody>
                {data.byFeature.map((item, index) => (
                  <tr key={index} className="border-b border-gray-50 last:border-b-0">
                    <td className="px-4 py-3 text-sm text-gray-900">{item.feature}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 text-right">{item.calls}</td>
                    <td className="px-4 py-3 text-sm text-[#8B2635] font-medium text-right">${item.cost.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

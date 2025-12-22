'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, BarChart3, DollarSign, Zap, Calculator, Sparkles, Radio, Bot } from 'lucide-react';

interface ProviderUsage {
  calls: number;
  cost: number;
  tokens: number;
}

interface FeatureUsage {
  feature: string;
  calls: number;
  cost: number;
}

interface MonthlyUsage {
  month: string; // YYYY-MM format
  claude: ProviderUsage;
  grok: ProviderUsage;
  openai: ProviderUsage;
  features: FeatureUsage[];
}

interface ApiUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function ApiUsageModal({ isOpen, onClose }: ApiUsageModalProps) {
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [usage, setUsage] = useState<MonthlyUsage>({
    month: currentDate,
    claude: { calls: 0, cost: 0, tokens: 0 },
    grok: { calls: 0, cost: 0, tokens: 0 },
    openai: { calls: 0, cost: 0, tokens: 0 },
    features: [],
  });

  const [prevMonthUsage, setPrevMonthUsage] = useState<MonthlyUsage | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Load current month usage
    const stored = localStorage.getItem(`abh_api_usage_${currentDate}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Ensure openai exists for backwards compatibility
        if (!parsed.openai) {
          parsed.openai = { calls: 0, cost: 0, tokens: 0 };
        }
        setUsage(parsed);
      } catch {
        setUsage({
          month: currentDate,
          claude: { calls: 0, cost: 0, tokens: 0 },
          grok: { calls: 0, cost: 0, tokens: 0 },
          openai: { calls: 0, cost: 0, tokens: 0 },
          features: [],
        });
      }
    } else {
      setUsage({
        month: currentDate,
        claude: { calls: 0, cost: 0, tokens: 0 },
        grok: { calls: 0, cost: 0, tokens: 0 },
        openai: { calls: 0, cost: 0, tokens: 0 },
        features: [],
      });
    }

    // Load previous month for comparison
    const [year, month] = currentDate.split('-').map(Number);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonthKey = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

    const prevStored = localStorage.getItem(`abh_api_usage_${prevMonthKey}`);
    if (prevStored) {
      try {
        const parsed = JSON.parse(prevStored);
        // Ensure openai exists for backwards compatibility
        if (!parsed.openai) {
          parsed.openai = { calls: 0, cost: 0, tokens: 0 };
        }
        setPrevMonthUsage(parsed);
      } catch {
        setPrevMonthUsage(null);
      }
    } else {
      setPrevMonthUsage(null);
    }
  }, [isOpen, currentDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = currentDate.split('-').map(Number);
    let newMonth = direction === 'prev' ? month - 1 : month + 1;
    let newYear = year;

    if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    } else if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    }

    setCurrentDate(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const formatMonth = (dateStr: string) => {
    const [year, month] = dateStr.split('-').map(Number);
    return `${MONTHS[month - 1]} ${year}`;
  };

  const totalCost = usage.claude.cost + usage.grok.cost + usage.openai.cost;
  const totalCalls = usage.claude.calls + usage.grok.calls + usage.openai.calls;
  const avgPerCall = totalCalls > 0 ? totalCost / totalCalls : 0;

  const prevTotalCost = prevMonthUsage
    ? prevMonthUsage.claude.cost + prevMonthUsage.grok.cost + prevMonthUsage.openai.cost
    : 0;
  const prevTotalCalls = prevMonthUsage
    ? prevMonthUsage.claude.calls + prevMonthUsage.grok.calls + prevMonthUsage.openai.calls
    : 0;

  const costDiff = totalCost - prevTotalCost;
  const callsDiff = totalCalls - prevTotalCalls;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#C41E3A]">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-white" />
            <h2 className="text-lg font-semibold text-white">API Usage & Costs</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-64px)] p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-[#F5F5F5] rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-[#666]" />
            </button>
            <div className="flex items-center gap-2 text-[#1A1A1A] font-medium">
              <span className="text-[#999]">📅</span>
              {formatMonth(currentDate)}
            </div>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-[#F5F5F5] rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-[#666]" />
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {/* Total Cost */}
            <div className="bg-[#C41E3A] rounded-xl p-5 text-white">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 opacity-80" />
                <span className="text-sm opacity-90">Total Cost</span>
              </div>
              <p className="text-3xl font-bold mb-2">${totalCost.toFixed(2)}</p>
              <div className="flex items-center gap-1 text-sm opacity-80">
                <span>📈</span>
                <span>{costDiff >= 0 ? '+' : ''}{costDiff.toFixed(2)} vs last month</span>
              </div>
            </div>

            {/* Total API Calls */}
            <div className="bg-white border border-[#EEE] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-[#C41E3A]" />
                <span className="text-sm text-[#666]">Total API Calls</span>
              </div>
              <p className="text-3xl font-bold text-[#1A1A1A] mb-2">{totalCalls.toLocaleString()}</p>
              <div className="flex items-center gap-1 text-sm text-[#C41E3A]">
                <span>📈</span>
                <span>{callsDiff >= 0 ? '+' : ''}{callsDiff.toLocaleString()} vs last month</span>
              </div>
            </div>

            {/* Avg per Call */}
            <div className="bg-white border border-[#EEE] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-4 h-4 text-[#666]" />
                <span className="text-sm text-[#666]">Avg per Call</span>
              </div>
              <p className="text-3xl font-bold text-[#1A1A1A] mb-2">${avgPerCall.toFixed(2)}</p>
              <p className="text-sm text-[#999]">Average cost per API call</p>
            </div>
          </div>

          {/* By Provider */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4">By Provider</h3>
            <div className="grid grid-cols-3 gap-4">
              {/* Claude */}
              <div className="bg-white border border-[#EEE] rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-[#C41E3A]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1A1A1A]">Claude</p>
                    <p className="text-xs text-[#999]">Anthropic</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#666]">Calls</span>
                    <span className="text-[#1A1A1A] font-medium">{usage.claude.calls.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#666]">Cost</span>
                    <span className="text-[#C41E3A] font-medium">${usage.claude.cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#666]">Tokens</span>
                    <span className="text-[#1A1A1A] font-medium">{usage.claude.tokens.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Grok */}
              <div className="bg-white border border-[#EEE] rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                    <Radio className="w-5 h-5 text-[#C41E3A]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1A1A1A]">Grok</p>
                    <p className="text-xs text-[#999]">xAI</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#666]">Calls</span>
                    <span className="text-[#1A1A1A] font-medium">{usage.grok.calls.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#666]">Cost</span>
                    <span className="text-[#C41E3A] font-medium">${usage.grok.cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#666]">Tokens</span>
                    <span className="text-[#1A1A1A] font-medium">{usage.grok.tokens.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* OpenAI / GPT */}
              <div className="bg-white border border-[#EEE] rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <Bot className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#1A1A1A]">GPT-4o</p>
                    <p className="text-xs text-[#999]">OpenAI</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#666]">Calls</span>
                    <span className="text-[#1A1A1A] font-medium">{usage.openai.calls.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#666]">Cost</span>
                    <span className="text-[#C41E3A] font-medium">${usage.openai.cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#666]">Tokens</span>
                    <span className="text-[#1A1A1A] font-medium">{usage.openai.tokens.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* By Feature */}
          <div>
            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4">By Feature</h3>
            <div className="bg-white border border-[#EEE] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#EEE]">
                    <th className="text-left text-xs font-medium text-[#999] px-5 py-3">Feature</th>
                    <th className="text-right text-xs font-medium text-[#999] px-5 py-3">Calls</th>
                    <th className="text-right text-xs font-medium text-[#999] px-5 py-3">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {usage.features.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-sm text-[#999]">
                        No API calls recorded yet this month
                      </td>
                    </tr>
                  ) : (
                    usage.features.map((feature, idx) => (
                      <tr key={idx} className="border-b border-[#EEE] last:border-0">
                        <td className="px-5 py-3 text-sm text-[#1A1A1A]">{feature.feature}</td>
                        <td className="px-5 py-3 text-sm text-[#1A1A1A] text-right">{feature.calls.toLocaleString()}</td>
                        <td className="px-5 py-3 text-sm text-[#C41E3A] text-right font-medium">${feature.cost.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

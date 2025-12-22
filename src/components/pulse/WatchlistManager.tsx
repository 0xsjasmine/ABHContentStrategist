'use client';

import { useState, useEffect } from 'react';
import type { WatchlistAccount } from '@/lib/supabase';

// Icons
const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const UserGroupIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const categoryOptions = [
  { value: 'founder', label: 'Founder', color: 'bg-purple-100 text-purple-700' },
  { value: 'tech_woman', label: 'Tech Woman', color: 'bg-blue-100 text-blue-700' },
  { value: 'culture_maker', label: 'Culture Maker', color: 'bg-pink-100 text-pink-700' },
  { value: 'creator', label: 'Creator', color: 'bg-green-100 text-green-700' },
];

interface WatchlistManagerProps {
  accounts: WatchlistAccount[];
  onAddAccount: (account: Omit<WatchlistAccount, 'id' | 'added_at' | 'last_scanned_at'>) => Promise<void>;
  onRemoveAccount: (id: string) => Promise<void>;
  isLoading?: boolean;
}

export default function WatchlistManager({
  accounts,
  onAddAccount,
  onRemoveAccount,
  isLoading = false,
}: WatchlistManagerProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newHandle, setNewHandle] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newCategory, setNewCategory] = useState<WatchlistAccount['category']>(null);
  const [newWhyWatching, setNewWhyWatching] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHandle.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddAccount({
        handle: newHandle.replace('@', '').trim(),
        display_name: newDisplayName.trim() || null,
        category: newCategory,
        why_watching: newWhyWatching.trim() || null,
        abh_relevance_notes: null,
      });
      setNewHandle('');
      setNewDisplayName('');
      setNewCategory(null);
      setNewWhyWatching('');
      setIsAddingNew(false);
    } catch (error) {
      console.error('Failed to add account:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    try {
      await onRemoveAccount(id);
    } catch (error) {
      console.error('Failed to remove account:', error);
    } finally {
      setRemovingId(null);
    }
  };

  const getCategoryStyle = (category: WatchlistAccount['category']) => {
    const found = categoryOptions.find(c => c.value === category);
    return found?.color || 'bg-gray-100 text-gray-700';
  };

  const getCategoryLabel = (category: WatchlistAccount['category']) => {
    const found = categoryOptions.find(c => c.value === category);
    return found?.label || 'Uncategorized';
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--soft-pink)' }}>
            <UserGroupIcon />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Watchlist</h3>
            <p className="text-sm text-gray-500">{accounts.length} accounts tracked</p>
          </div>
        </div>
        <button
          onClick={() => setIsAddingNew(true)}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <PlusIcon />
          Add Account
        </button>
      </div>

      {/* Add New Form */}
      {isAddingNew && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Add to Watchlist</h4>
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XIcon />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  X Handle <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newHandle}
                  onChange={(e) => setNewHandle(e.target.value)}
                  placeholder="@handle"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="Full name"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={newCategory || ''}
                  onChange={(e) => setNewCategory(e.target.value as WatchlistAccount['category'] || null)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy outline-none"
                >
                  <option value="">Select category...</option>
                  {categoryOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Why Watching
                </label>
                <input
                  type="text"
                  value={newWhyWatching}
                  onChange={(e) => setNewWhyWatching(e.target.value)}
                  placeholder="Reason for tracking..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !newHandle.trim()}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add to Watchlist'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Account List */}
      <div className="divide-y divide-gray-100">
        {isLoading ? (
          <div className="px-6 py-8 text-center text-gray-500">
            Loading watchlist...
          </div>
        ) : accounts.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-gray-500 mb-2">No accounts in watchlist yet</p>
            <p className="text-sm text-gray-400">Add accounts to start scanning for insights</p>
          </div>
        ) : (
          accounts.map((account) => (
            <div
              key={account.id}
              className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm" style={{ backgroundColor: 'var(--red)' }}>
                  {account.handle.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">@{account.handle}</span>
                    {account.category && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryStyle(account.category)}`}>
                        {getCategoryLabel(account.category)}
                      </span>
                    )}
                  </div>
                  {account.display_name && (
                    <p className="text-sm text-gray-500">{account.display_name}</p>
                  )}
                  {account.why_watching && (
                    <p className="text-xs text-gray-400 mt-0.5">{account.why_watching}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                {account.last_scanned_at && (
                  <span className="text-xs text-gray-400">
                    Last scan: {new Date(account.last_scanned_at).toLocaleDateString()}
                  </span>
                )}
                <button
                  onClick={() => handleRemove(account.id)}
                  disabled={removingId === account.id}
                  className="text-gray-400 hover:text-red-500 p-1 disabled:opacity-50"
                  title="Remove from watchlist"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

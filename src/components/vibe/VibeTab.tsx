'use client';

import { useState, useEffect, useCallback } from 'react';
import ManifestationCard from './ManifestationCard';
import type { Manifestation } from '@/types/database';

// Icons
const SparklesIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"/>
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const typeOptions: { value: Manifestation['type']; label: string; description: string }[] = [
  { value: 'person', label: 'Dream Guest', description: 'Someone you want to interview or collaborate with' },
  { value: 'topic', label: 'Topic', description: 'A subject you want to cover or become known for' },
  { value: 'milestone', label: 'Milestone', description: 'A specific goal or achievement to reach' },
  { value: 'series', label: 'Series', description: 'A recurring content format or show idea' },
];

const typeFilters: { value: Manifestation['type'] | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'person', label: 'People' },
  { value: 'topic', label: 'Topics' },
  { value: 'milestone', label: 'Milestones' },
  { value: 'series', label: 'Series' },
];

interface VibeTabProps {}

export default function VibeTab({}: VibeTabProps) {
  const [manifestations, setManifestations] = useState<Manifestation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<Manifestation['type'] | 'all'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Manifestation | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formType, setFormType] = useState<Manifestation['type']>('person');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formWhyItMatters, setFormWhyItMatters] = useState('');
  const [formVisualUrl, setFormVisualUrl] = useState('');
  const [formTargetDate, setFormTargetDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch manifestations
  const fetchManifestations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedType !== 'all') {
        params.set('type', selectedType);
      }
      const res = await fetch(`/api/vibe/manifestations?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setManifestations(data.manifestations || []);
    } catch (err) {
      console.error('Error fetching manifestations:', err);
      setError('Failed to load manifestations');
    } finally {
      setIsLoading(false);
    }
  }, [selectedType]);

  useEffect(() => {
    fetchManifestations();
  }, [fetchManifestations]);

  // Reset form
  const resetForm = () => {
    setFormType('person');
    setFormTitle('');
    setFormDescription('');
    setFormWhyItMatters('');
    setFormVisualUrl('');
    setFormTargetDate('');
    setEditingItem(null);
  };

  // Handle edit
  const handleEdit = (manifestation: Manifestation) => {
    setEditingItem(manifestation);
    setFormType(manifestation.type);
    setFormTitle(manifestation.title);
    setFormDescription(manifestation.description || '');
    setFormWhyItMatters(manifestation.why_it_matters || '');
    setFormVisualUrl(manifestation.visual_url || '');
    setFormTargetDate(manifestation.target_date || '');
    setShowAddForm(true);
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        type: formType,
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        why_it_matters: formWhyItMatters.trim() || null,
        visual_url: formVisualUrl.trim() || null,
        target_date: formTargetDate || null,
        status: editingItem?.status || 'manifesting',
      };

      const url = editingItem
        ? `/api/vibe/manifestations/${editingItem.id}`
        : '/api/vibe/manifestations';
      const method = editingItem ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save');

      await fetchManifestations();
      resetForm();
      setShowAddForm(false);
    } catch (err) {
      console.error('Error saving manifestation:', err);
      setError('Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update status
  const handleUpdateStatus = async (id: string, status: Manifestation['status']) => {
    try {
      const res = await fetch(`/api/vibe/manifestations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error('Failed to update');
      await fetchManifestations();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const filteredManifestations = selectedType === 'all'
    ? manifestations
    : manifestations.filter(m => m.type === selectedType);

  // Group by status
  const manifesting = filteredManifestations.filter(m => m.status === 'manifesting');
  const inProgress = filteredManifestations.filter(m => m.status === 'in_progress');
  const achieved = filteredManifestations.filter(m => m.status === 'achieved');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--gold)', color: 'white' }}>
            <SparklesIcon />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">VIBE BOARD</h2>
            <p className="text-sm text-gray-500">Manifestation Center</p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddForm(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <PlusIcon />
          Add Manifestation
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingItem ? 'Edit Manifestation' : 'New Manifestation'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XIcon />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {typeOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormType(opt.value)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          formType === opt.value
                            ? 'border-burgundy bg-burgundy/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={formType === opt.value ? { borderColor: 'var(--burgundy)' } : undefined}
                      >
                        <div className="font-medium text-sm">{opt.label}</div>
                        <div className="text-xs text-gray-500">{opt.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder={formType === 'person' ? 'e.g., Emma Chamberlain' : 'Enter title...'}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy outline-none"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="What is this about?"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy outline-none resize-none"
                  />
                </div>

                {/* Why It Matters */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Why It Matters</label>
                  <textarea
                    value={formWhyItMatters}
                    onChange={(e) => setFormWhyItMatters(e.target.value)}
                    placeholder="Why is this important to you?"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy outline-none resize-none"
                  />
                </div>

                {/* Visual URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={formVisualUrl}
                    onChange={(e) => setFormVisualUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy outline-none"
                  />
                </div>

                {/* Target Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={formTargetDate}
                    onChange={(e) => setFormTargetDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-burgundy/20 focus:border-burgundy outline-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !formTitle.trim()}
                    className="btn-primary text-sm disabled:opacity-50"
                  >
                    {isSubmitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Type Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {typeFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setSelectedType(filter.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedType === filter.value
                ? 'text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            style={selectedType === filter.value ? { backgroundColor: 'var(--burgundy)' } : undefined}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 animate-pulse">
              <div className="h-40 bg-gray-200 rounded-t-2xl"></div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredManifestations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--gold)', color: 'white' }}>
            <SparklesIcon />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Start manifesting</h3>
          <p className="text-gray-500 mb-4">Add your dreams, goals, and visions here</p>
          <button
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
            className="btn-primary"
          >
            Add First Manifestation
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Manifesting */}
          {manifesting.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Manifesting ({manifesting.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                {manifesting.map((m) => (
                  <ManifestationCard
                    key={m.id}
                    manifestation={m}
                    onUpdateStatus={handleUpdateStatus}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            </div>
          )}

          {/* In Progress */}
          {inProgress.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                In Progress ({inProgress.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                {inProgress.map((m) => (
                  <ManifestationCard
                    key={m.id}
                    manifestation={m}
                    onUpdateStatus={handleUpdateStatus}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Achieved */}
          {achieved.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Achieved ({achieved.length})
              </h3>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                {achieved.map((m) => (
                  <ManifestationCard
                    key={m.id}
                    manifestation={m}
                    onUpdateStatus={handleUpdateStatus}
                    onEdit={handleEdit}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

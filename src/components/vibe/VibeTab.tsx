'use client';

import { useState, useEffect, useCallback } from 'react';
import ManifestationCard from './ManifestationCard';
import SegmentedTabs from '@/components/ui/SegmentedTabs';
import type { Manifestation } from '@/types/database';
import { Plus, X } from 'lucide-react';

const typeTabs = [
  { id: 'all', label: 'All' },
  { id: 'person', label: 'People' },
  { id: 'topic', label: 'Topics' },
  { id: 'milestone', label: 'Milestones' },
  { id: 'series', label: 'Series' },
];

const typeOptions = [
  { value: 'person' as const, label: 'Dream Person' },
  { value: 'topic' as const, label: 'Topic' },
  { value: 'milestone' as const, label: 'Milestone' },
  { value: 'series' as const, label: 'Series' },
];

export default function VibeTab() {
  const [manifestations, setManifestations] = useState<Manifestation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Manifestation | null>(null);

  // Form state
  const [formType, setFormType] = useState<Manifestation['type']>('person');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formVisualUrl, setFormVisualUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch manifestations
  const fetchManifestations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedType !== 'all') {
        params.set('type', selectedType);
      }
      const res = await fetch(`/api/vibe/manifestations?${params}`);
      if (res.ok) {
        const data = await res.json();
        setManifestations(data.manifestations || []);
      }
    } catch (err) {
      console.error('Error fetching manifestations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedType]);

  useEffect(() => {
    fetchManifestations();
  }, [fetchManifestations]);

  const resetForm = () => {
    setFormType('person');
    setFormTitle('');
    setFormDescription('');
    setFormVisualUrl('');
    setEditingItem(null);
  };

  const handleEdit = (manifestation: Manifestation) => {
    setEditingItem(manifestation);
    setFormType(manifestation.type);
    setFormTitle(manifestation.title);
    setFormDescription(manifestation.description || '');
    setFormVisualUrl(manifestation.visual_url || '');
    setShowAddForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        type: formType,
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        visual_url: formVisualUrl.trim() || null,
        status: editingItem?.status || 'manifesting',
      };

      const url = editingItem
        ? `/api/vibe/manifestations/${editingItem.id}`
        : '/api/vibe/manifestations';

      const res = await fetch(url, {
        method: editingItem ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchManifestations();
        resetForm();
        setShowAddForm(false);
      }
    } catch (err) {
      console.error('Error saving:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: Manifestation['status']) => {
    try {
      await fetch(`/api/vibe/manifestations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await fetchManifestations();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const filteredManifestations = selectedType === 'all'
    ? manifestations
    : manifestations.filter(m => m.type === selectedType);

  // Group by status
  const achieved = filteredManifestations.filter(m => m.status === 'achieved');
  const inProgress = filteredManifestations.filter(m => m.status === 'in_progress');
  const manifesting = filteredManifestations.filter(m => m.status === 'manifesting');

  return (
    <div className="space-y-6">
      {/* Simple Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Manifest</h1>
        <button
          onClick={() => { resetForm(); setShowAddForm(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {/* Segmented Tabs */}
      <SegmentedTabs
        tabs={typeTabs}
        activeTab={selectedType}
        onChange={setSelectedType}
      />

      {/* Add/Edit Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => { setShowAddForm(false); resetForm(); }} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">
                {editingItem ? 'Edit' : 'New Manifestation'}
              </h3>
              <button onClick={() => { setShowAddForm(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as Manifestation['type'])}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                >
                  {typeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder={formType === 'person' ? 'e.g., Emma Chamberlain' : 'Enter name...'}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Why this matters..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={formVisualUrl}
                  onChange={(e) => setFormVisualUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setShowAddForm(false); resetForm(); }} className="flex-1 btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting || !formTitle.trim()} className="flex-1 btn-primary disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 animate-pulse">
              <div className="h-32 bg-gray-100 rounded-t-xl"></div>
              <div className="p-3"><div className="h-4 bg-gray-100 rounded w-2/3"></div></div>
            </div>
          ))}
        </div>
      ) : filteredManifestations.length === 0 ? (
        <div className="text-center py-20">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nothing here yet</h3>
          <p className="text-gray-500 mb-6">Add your first manifestation to get started.</p>
          <button onClick={() => { resetForm(); setShowAddForm(true); }} className="btn-primary">
            Add First
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Achieved */}
          {achieved.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Achieved</h2>
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {achieved.map((m) => (
                  <ManifestationCard key={m.id} manifestation={m} onUpdateStatus={handleUpdateStatus} onEdit={handleEdit} />
                ))}
              </div>
            </section>
          )}

          {/* In Progress */}
          {inProgress.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-900 mb-4">In Progress</h2>
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {inProgress.map((m) => (
                  <ManifestationCard key={m.id} manifestation={m} onUpdateStatus={handleUpdateStatus} onEdit={handleEdit} />
                ))}
              </div>
            </section>
          )}

          {/* Manifesting */}
          {manifesting.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-900 mb-4">Manifesting</h2>
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {manifesting.map((m) => (
                  <ManifestationCard key={m.id} manifestation={m} onUpdateStatus={handleUpdateStatus} onEdit={handleEdit} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

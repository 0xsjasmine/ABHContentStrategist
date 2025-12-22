'use client';

import { useState } from 'react';
import type { Manifestation } from '@/types/database';

// Icons
const PersonIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const TopicIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
  </svg>
);

const MilestoneIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const SeriesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const SparklesIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
  </svg>
);

const typeIcons: Record<Manifestation['type'], React.ReactNode> = {
  person: <PersonIcon />,
  topic: <TopicIcon />,
  milestone: <MilestoneIcon />,
  series: <SeriesIcon />,
};

const typeLabels: Record<Manifestation['type'], string> = {
  person: 'Dream Guest',
  topic: 'Topic',
  milestone: 'Milestone',
  series: 'Series',
};

const statusStyles: Record<Manifestation['status'], { bg: string; text: string; label: string }> = {
  manifesting: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Manifesting' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' },
  achieved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Achieved' },
};

interface ManifestationCardProps {
  manifestation: Manifestation;
  onUpdateStatus?: (id: string, status: Manifestation['status']) => void;
  onEdit?: (manifestation: Manifestation) => void;
}

export default function ManifestationCard({
  manifestation,
  onUpdateStatus,
  onEdit,
}: ManifestationCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const statusStyle = statusStyles[manifestation.status];

  const handleStatusChange = () => {
    if (!onUpdateStatus) return;

    const nextStatus: Record<Manifestation['status'], Manifestation['status']> = {
      manifesting: 'in_progress',
      in_progress: 'achieved',
      achieved: 'manifesting',
    };

    onUpdateStatus(manifestation.id, nextStatus[manifestation.status]);
  };

  return (
    <div
      className="relative bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-gray-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Visual/Image */}
      {manifestation.visual_url ? (
        <div className="h-40 bg-gray-100 overflow-hidden">
          <img
            src={manifestation.visual_url}
            alt={manifestation.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div
          className="h-40 flex items-center justify-center"
          style={{ backgroundColor: 'var(--soft-pink)' }}
        >
          <div className="w-16 h-16 rounded-full bg-white/50 flex items-center justify-center" style={{ color: 'var(--red)' }}>
            {typeIcons[manifestation.type]}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Type & Status */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">
              {typeIcons[manifestation.type]}
            </span>
            <span className="text-xs font-medium text-gray-500">
              {typeLabels[manifestation.type]}
            </span>
          </div>
          <button
            onClick={handleStatusChange}
            className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 transition-colors ${statusStyle.bg} ${statusStyle.text}`}
          >
            {manifestation.status === 'achieved' && <CheckIcon />}
            {manifestation.status === 'manifesting' && <SparklesIcon />}
            {statusStyle.label}
          </button>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
          {manifestation.title}
        </h3>

        {/* Description */}
        {manifestation.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
            {manifestation.description}
          </p>
        )}

        {/* Why It Matters */}
        {manifestation.why_it_matters && (
          <div className="text-xs text-gray-500 italic border-l-2 border-gray-200 pl-2 mb-2">
            "{manifestation.why_it_matters}"
          </div>
        )}

        {/* Target Date */}
        {manifestation.target_date && (
          <div className="text-xs text-gray-400">
            Target: {new Date(manifestation.target_date).toLocaleDateString()}
          </div>
        )}

        {/* Achieved Date */}
        {manifestation.achieved_at && (
          <div className="text-xs text-green-600 flex items-center gap-1">
            <CheckIcon />
            Achieved: {new Date(manifestation.achieved_at).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Hover Actions */}
      {isHovered && onEdit && (
        <div className="absolute top-2 right-2">
          <button
            onClick={() => onEdit(manifestation)}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:bg-white transition-colors"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      )}

      {/* Achieved Overlay */}
      {manifestation.status === 'achieved' && (
        <div className="absolute inset-0 bg-green-500/10 pointer-events-none" />
      )}
    </div>
  );
}

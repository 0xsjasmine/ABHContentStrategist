'use client';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface SegmentedTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export default function SegmentedTabs({
  tabs,
  activeTab,
  onChange,
  className = '',
}: SegmentedTabsProps) {
  return (
    <div className={`segmented-tabs ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`segmented-tab ${activeTab === tab.id ? 'segmented-tab-active' : ''}`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="segmented-tab-badge">{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

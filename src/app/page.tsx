'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import { DiaryTab, BooksTab } from '@/components/tabs';
import PulseTab from '@/components/pulse/PulseTab';
import VibeTab from '@/components/vibe/VibeTab';
import StudioTab from '@/components/studio/StudioTab';
import { GenerationPanel } from '@/components/generation';
import type { TabId, DiaryEntry } from '@/types';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('pulse');
  const [selectedDiaryEntry, setSelectedDiaryEntry] = useState<DiaryEntry | null>(null);
  const [showGeneration, setShowGeneration] = useState(false);

  const handleAnalyzeEntry = async (entry: DiaryEntry) => {
    console.log('Analyzing entry:', entry.id);
  };

  const handleGeneratePost = (entry: DiaryEntry) => {
    setSelectedDiaryEntry(entry);
    setShowGeneration(true);
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'diary' && (
        <DiaryTab
          onAnalyzeEntry={handleAnalyzeEntry}
          onGeneratePost={handleGeneratePost}
        />
      )}
      {activeTab === 'pulse' && <PulseTab />}
      {activeTab === 'vibe' && <VibeTab />}
      {activeTab === 'studio' && <StudioTab />}
      {activeTab === 'library' && <BooksTab />}

      {/* Generation Panel */}
      {selectedDiaryEntry && (
        <GenerationPanel
          diaryEntry={selectedDiaryEntry}
          isOpen={showGeneration}
          onClose={() => {
            setShowGeneration(false);
            setSelectedDiaryEntry(null);
          }}
        />
      )}
    </Layout>
  );
}

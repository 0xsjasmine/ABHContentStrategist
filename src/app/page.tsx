'use client';

import { useState } from 'react';
import Layout from '@/components/Layout';
import { DiaryTab, CreatorTab, BooksTab, DataTab, ReplyTab } from '@/components/tabs';
import { GenerationPanel } from '@/components/generation';
import type { TabId, DiaryEntry } from '@/types';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>('diary');
  const [selectedDiaryEntry, setSelectedDiaryEntry] = useState<DiaryEntry | null>(null);
  const [showGeneration, setShowGeneration] = useState(false);

  const handleAnalyzeEntry = async (entry: DiaryEntry) => {
    // For now, just show a notification or trigger analysis
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
      {activeTab === 'creator' && <CreatorTab />}
      {activeTab === 'books' && <BooksTab />}
      {activeTab === 'data' && <DataTab />}
      {activeTab === 'reply' && <ReplyTab />}

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

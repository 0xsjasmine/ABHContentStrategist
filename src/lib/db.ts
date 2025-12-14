// IndexedDB database using Dexie.js
// Local-first data storage for ABH Content Strategist

import Dexie, { type EntityTable } from 'dexie';
import type {
  DiaryEntry,
  SavedPost,
  BookQuote,
  DailyBrief,
  ReplyRequest,
  GeneratedPost,
  AppSettings,
} from '@/types';

// Database schema
class ABHDatabase extends Dexie {
  diaryEntries!: EntityTable<DiaryEntry, 'id'>;
  savedPosts!: EntityTable<SavedPost, 'id'>;
  bookQuotes!: EntityTable<BookQuote, 'id'>;
  dailyBriefs!: EntityTable<DailyBrief, 'id'>;
  replyRequests!: EntityTable<ReplyRequest, 'id'>;
  generatedPosts!: EntityTable<GeneratedPost, 'id'>;
  settings!: EntityTable<AppSettings & { id: string }, 'id'>;

  constructor() {
    super('ABHContentStrategist');

    this.version(1).stores({
      diaryEntries: 'id, timestamp, type, *tags, createdAt, updatedAt',
      savedPosts: 'id, author, savedDate, *tags.topic, *tags.creator, *tags.format, *tags.vibe, createdAt',
      bookQuotes: 'id, bookTitle, author, *tags, createdAt',
      dailyBriefs: 'id, date, generatedAt',
      replyRequests: 'id, createdAt',
      generatedPosts: 'id, createdAt',
      settings: 'id',
    });
  }
}

// Database instance
export const db = new ABHDatabase();

// =====================
// DIARY ENTRY OPERATIONS
// =====================

export async function createDiaryEntry(
  entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>
): Promise<DiaryEntry> {
  const now = new Date().toISOString();
  const newEntry: DiaryEntry = {
    ...entry,
    id: `diary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now,
  };
  await db.diaryEntries.add(newEntry);
  return newEntry;
}

export async function updateDiaryEntry(
  id: string,
  updates: Partial<DiaryEntry>
): Promise<void> {
  await db.diaryEntries.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteDiaryEntry(id: string): Promise<void> {
  await db.diaryEntries.delete(id);
}

export async function getDiaryEntry(id: string): Promise<DiaryEntry | undefined> {
  return db.diaryEntries.get(id);
}

export async function getAllDiaryEntries(): Promise<DiaryEntry[]> {
  return db.diaryEntries.orderBy('timestamp').reverse().toArray();
}

export async function getDiaryEntriesByType(type: DiaryEntry['type']): Promise<DiaryEntry[]> {
  return db.diaryEntries.where('type').equals(type).reverse().sortBy('timestamp');
}

export async function searchDiaryEntries(query: string): Promise<DiaryEntry[]> {
  const entries = await db.diaryEntries.toArray();
  const lowerQuery = query.toLowerCase();
  return entries.filter(
    (entry) =>
      entry.content.toLowerCase().includes(lowerQuery) ||
      entry.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
}

// =====================
// SAVED POST OPERATIONS
// =====================

export async function createSavedPost(
  post: Omit<SavedPost, 'id' | 'createdAt' | 'updatedAt'>
): Promise<SavedPost> {
  const now = new Date().toISOString();
  const newPost: SavedPost = {
    ...post,
    id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now,
  };
  await db.savedPosts.add(newPost);
  return newPost;
}

export async function updateSavedPost(
  id: string,
  updates: Partial<SavedPost>
): Promise<void> {
  await db.savedPosts.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteSavedPost(id: string): Promise<void> {
  await db.savedPosts.delete(id);
}

export async function getSavedPost(id: string): Promise<SavedPost | undefined> {
  return db.savedPosts.get(id);
}

export async function getAllSavedPosts(): Promise<SavedPost[]> {
  return db.savedPosts.orderBy('savedDate').reverse().toArray();
}

export async function getSavedPostsByFormat(format: string): Promise<SavedPost[]> {
  const posts = await db.savedPosts.toArray();
  return posts.filter((post) => post.tags.format.includes(format));
}

export async function getSavedPostsByCreator(creator: string): Promise<SavedPost[]> {
  const posts = await db.savedPosts.toArray();
  return posts.filter((post) => post.tags.creator.includes(creator));
}

// =====================
// BOOK QUOTE OPERATIONS
// =====================

export async function createBookQuote(
  quote: Omit<BookQuote, 'id' | 'createdAt' | 'updatedAt'>
): Promise<BookQuote> {
  const now = new Date().toISOString();
  const newQuote: BookQuote = {
    ...quote,
    id: `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now,
  };
  await db.bookQuotes.add(newQuote);
  return newQuote;
}

export async function updateBookQuote(
  id: string,
  updates: Partial<BookQuote>
): Promise<void> {
  await db.bookQuotes.update(id, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteBookQuote(id: string): Promise<void> {
  await db.bookQuotes.delete(id);
}

export async function getBookQuote(id: string): Promise<BookQuote | undefined> {
  return db.bookQuotes.get(id);
}

export async function getAllBookQuotes(): Promise<BookQuote[]> {
  return db.bookQuotes.orderBy('createdAt').reverse().toArray();
}

export async function getBookQuotesByBook(bookTitle: string): Promise<BookQuote[]> {
  return db.bookQuotes.where('bookTitle').equals(bookTitle).toArray();
}

export async function getBookQuotesByAuthor(author: string): Promise<BookQuote[]> {
  return db.bookQuotes.where('author').equals(author).toArray();
}

// =====================
// DAILY BRIEF OPERATIONS
// =====================

export async function saveDailyBrief(brief: DailyBrief): Promise<void> {
  await db.dailyBriefs.put(brief);
}

export async function getDailyBrief(date: string): Promise<DailyBrief | undefined> {
  return db.dailyBriefs.where('date').equals(date).first();
}

export async function getLatestDailyBrief(): Promise<DailyBrief | undefined> {
  return db.dailyBriefs.orderBy('generatedAt').reverse().first();
}

// =====================
// REPLY REQUEST OPERATIONS
// =====================

export async function createReplyRequest(
  request: Omit<ReplyRequest, 'id' | 'createdAt'>
): Promise<ReplyRequest> {
  const newRequest: ReplyRequest = {
    ...request,
    id: `reply_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  await db.replyRequests.add(newRequest);
  return newRequest;
}

export async function getAllReplyRequests(): Promise<ReplyRequest[]> {
  return db.replyRequests.orderBy('createdAt').reverse().toArray();
}

export async function deleteReplyRequest(id: string): Promise<void> {
  await db.replyRequests.delete(id);
}

// =====================
// GENERATED POST OPERATIONS
// =====================

export async function saveGeneratedPost(
  post: Omit<GeneratedPost, 'id' | 'createdAt'>
): Promise<GeneratedPost> {
  const newPost: GeneratedPost = {
    ...post,
    id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  await db.generatedPosts.add(newPost);
  return newPost;
}

export async function getAllGeneratedPosts(): Promise<GeneratedPost[]> {
  return db.generatedPosts.orderBy('createdAt').reverse().toArray();
}

// =====================
// SETTINGS OPERATIONS
// =====================

const SETTINGS_ID = 'app_settings';

export async function getSettings(): Promise<AppSettings> {
  const settings = await db.settings.get(SETTINGS_ID);
  return (
    settings || {
      autoSaveInterval: 30000,
      theme: 'light',
    }
  );
}

export async function updateSettings(updates: Partial<AppSettings>): Promise<void> {
  const existing = await getSettings();
  await db.settings.put({
    id: SETTINGS_ID,
    ...existing,
    ...updates,
  });
}

// =====================
// EXPORT/IMPORT OPERATIONS
// =====================

export async function exportAllData(): Promise<{
  diaryEntries: DiaryEntry[];
  savedPosts: SavedPost[];
  bookQuotes: BookQuote[];
  generatedPosts: GeneratedPost[];
}> {
  return {
    diaryEntries: await db.diaryEntries.toArray(),
    savedPosts: await db.savedPosts.toArray(),
    bookQuotes: await db.bookQuotes.toArray(),
    generatedPosts: await db.generatedPosts.toArray(),
  };
}

export async function clearAllData(): Promise<void> {
  await Promise.all([
    db.diaryEntries.clear(),
    db.savedPosts.clear(),
    db.bookQuotes.clear(),
    db.dailyBriefs.clear(),
    db.replyRequests.clear(),
    db.generatedPosts.clear(),
  ]);
}

'use client';

import { useState, useEffect } from 'react';
import { Plus, BookOpen, Trash2, Quote } from 'lucide-react';
import { Button, Card, Badge, TagInput, Modal } from '@/components/ui';
import { TextArea, Input } from '@/components/ui/Input';
import {
  getAllBookQuotes,
  createBookQuote,
  deleteBookQuote,
} from '@/lib/db';
import type { BookQuote } from '@/types';

export default function BooksTab() {
  const [quotes, setQuotes] = useState<BookQuote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<BookQuote | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [filterAuthor, setFilterAuthor] = useState<string>('');

  // Form state
  const [bookTitle, setBookTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [quoteText, setQuoteText] = useState('');
  const [page, setPage] = useState('');
  const [myTake, setMyTake] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    const allQuotes = await getAllBookQuotes();
    setQuotes(allQuotes);
  };

  const handleSave = async () => {
    if (!quoteText.trim() || !author.trim() || !bookTitle.trim() || !myTake.trim()) {
      return;
    }

    await createBookQuote({
      bookTitle,
      author,
      quote: quoteText,
      page: page || undefined,
      myTake,
      tags,
    });

    // Reset form
    setBookTitle('');
    setAuthor('');
    setQuoteText('');
    setPage('');
    setMyTake('');
    setTags([]);
    setIsAddingNew(false);

    await loadQuotes();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this quote?')) return;
    await deleteBookQuote(id);
    if (selectedQuote?.id === id) setSelectedQuote(null);
    await loadQuotes();
  };

  const uniqueAuthors = [...new Set(quotes.map((q) => q.author))];

  const filteredQuotes = quotes.filter((quote) => {
    if (filterAuthor && quote.author !== filterAuthor) return false;
    return true;
  });

  // Group quotes by book
  const quotesByBook = filteredQuotes.reduce((acc, quote) => {
    const key = `${quote.bookTitle} - ${quote.author}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(quote);
    return acc;
  }, {} as Record<string, BookQuote[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">
            Books & Library
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Quotes and ideas that add soul and depth to your content
          </p>
        </div>
        <Button onClick={() => setIsAddingNew(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Quote
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <select
          value={filterAuthor}
          onChange={(e) => setFilterAuthor(e.target.value)}
          className="text-sm border border-neutral-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-500"
        >
          <option value="">All authors</option>
          {uniqueAuthors.map((author) => (
            <option key={author} value={author}>
              {author}
            </option>
          ))}
        </select>
        <span className="text-sm text-neutral-500">
          {filteredQuotes.length} quotes from {Object.keys(quotesByBook).length} books
        </span>
      </div>

      {/* Quotes by Book */}
      {Object.keys(quotesByBook).length === 0 ? (
        <Card className="text-center py-12">
          <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500">No quotes saved yet</p>
          <p className="text-sm text-neutral-400 mt-1">
            Save quotes that resonate and add your take
          </p>
          <Button className="mt-4" onClick={() => setIsAddingNew(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Quote
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(quotesByBook).map(([bookKey, bookQuotes]) => (
            <div key={bookKey}>
              <h3 className="text-sm font-medium text-neutral-500 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {bookKey}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookQuotes.map((quote) => (
                  <Card
                    key={quote.id}
                    hover
                    className="cursor-pointer"
                    onClick={() => setSelectedQuote(quote)}
                  >
                    {/* Quote */}
                    <div className="flex gap-2 mb-3">
                      <Quote className="w-5 h-5 text-neutral-300 flex-shrink-0 mt-0.5" />
                      <p className="text-neutral-700 italic line-clamp-3">
                        &ldquo;{quote.quote}&rdquo;
                      </p>
                    </div>

                    {/* Page */}
                    {quote.page && (
                      <p className="text-xs text-neutral-400 mb-3">
                        Page {quote.page}
                      </p>
                    )}

                    {/* My Take Preview */}
                    <div className="bg-amber-50 rounded-lg p-3 mb-3 border-l-2 border-amber-400">
                      <p className="text-sm text-neutral-700 line-clamp-2">
                        {quote.myTake}
                      </p>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {quote.tags.slice(0, 4).map((tag) => (
                        <Badge key={tag} size="sm" variant="outline">
                          {tag}
                        </Badge>
                      ))}
                      {quote.tags.length > 4 && (
                        <Badge size="sm" variant="outline">
                          +{quote.tags.length - 4}
                        </Badge>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end pt-2 border-t border-neutral-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(quote.id);
                        }}
                        className="p-1 text-neutral-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Quote Modal */}
      <Modal
        isOpen={isAddingNew}
        onClose={() => setIsAddingNew(false)}
        title="Add Book Quote"
        description="Save a quote and your take on it"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsAddingNew(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!quoteText.trim() || !author.trim() || !bookTitle.trim() || !myTake.trim()}
            >
              Save Quote
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Book Title"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              placeholder="The Almanack of Naval Ravikant"
            />
            <Input
              label="Author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Eric Jorgenson"
            />
          </div>

          <TextArea
            label="Quote"
            value={quoteText}
            onChange={(e) => setQuoteText(e.target.value)}
            placeholder="Paste the quote here..."
            rows={3}
          />

          <Input
            label="Page (optional)"
            value={page}
            onChange={(e) => setPage(e.target.value)}
            placeholder="45"
          />

          <TextArea
            label="Your Take (required)"
            value={myTake}
            onChange={(e) => setMyTake(e.target.value)}
            placeholder="What does this quote mean to you? How does it connect to your life/work?"
            rows={4}
            hint="This is essential - it connects the quote to YOUR voice"
          />

          <TagInput
            label="Theme Tags"
            tags={tags}
            onTagsChange={setTags}
            placeholder="Add tags..."
            suggestions={['taste', 'AI', 'authenticity', 'curiosity', 'ambition', 'seasons', 'trade-offs']}
          />
        </div>
      </Modal>

      {/* Quote Detail Modal */}
      {selectedQuote && (
        <Modal
          isOpen={!!selectedQuote}
          onClose={() => setSelectedQuote(null)}
          title={selectedQuote.bookTitle}
          size="lg"
        >
          <div className="space-y-4">
            <p className="text-sm text-neutral-500">by {selectedQuote.author}</p>

            <div className="bg-neutral-50 rounded-lg p-4 border-l-4 border-neutral-300">
              <p className="text-lg text-neutral-700 italic">
                &ldquo;{selectedQuote.quote}&rdquo;
              </p>
              {selectedQuote.page && (
                <p className="text-sm text-neutral-400 mt-2">Page {selectedQuote.page}</p>
              )}
            </div>

            <div>
              <h4 className="text-sm font-medium text-neutral-700 mb-2">
                Your Take
              </h4>
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                <p className="text-neutral-700 whitespace-pre-wrap">
                  {selectedQuote.myTake}
                </p>
              </div>
            </div>

            {selectedQuote.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-neutral-700 mb-2">
                  Themes
                </h4>
                <div className="flex flex-wrap gap-1">
                  {selectedQuote.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-neutral-400 pt-4 border-t border-neutral-100">
              Added {new Date(selectedQuote.createdAt).toLocaleDateString()}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

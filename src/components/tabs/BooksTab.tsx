'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Quote } from 'lucide-react';
import {
  getAllBookQuotes,
  createBookQuote,
  deleteBookQuote,
} from '@/lib/db';
import type { BookQuote } from '@/types';

export default function BooksTab() {
  const [quotes, setQuotes] = useState<BookQuote[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Form
  const [quoteText, setQuoteText] = useState('');
  const [author, setAuthor] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [myTake, setMyTake] = useState('');

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    const all = await getAllBookQuotes();
    setQuotes(all);
  };

  const handleSave = async () => {
    if (!quoteText.trim() || !author.trim() || !bookTitle.trim() || !myTake.trim()) return;

    await createBookQuote({
      bookTitle,
      author,
      quote: quoteText,
      myTake,
      tags: [],
    });

    resetForm();
    await loadQuotes();
  };

  const resetForm = () => {
    setQuoteText('');
    setAuthor('');
    setBookTitle('');
    setMyTake('');
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    await deleteBookQuote(id);
    await loadQuotes();
  };

  return (
    <div className="relative min-h-[80vh]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-light text-[#2D2A26] mb-1">Library</h1>
        <p className="text-sm text-[#9C958E] font-light">Words that stay with you</p>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="glass rounded-3xl p-6 mb-8 animate-slide-up">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-light text-[#2D2A26]">Add a quote</h2>
            <button onClick={resetForm} className="p-1 hover:bg-white/50 rounded-full">
              <X className="w-4 h-4 text-[#9C958E]" />
            </button>
          </div>

          <textarea
            value={quoteText}
            onChange={(e) => setQuoteText(e.target.value)}
            placeholder="The quote..."
            className="w-full bg-transparent text-[#2D2A26] placeholder:text-[#9C958E] font-light italic resize-none focus:outline-none min-h-[100px] mb-4 text-lg"
          />

          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author"
              className="px-4 py-2.5 glass-subtle rounded-2xl text-sm font-light focus:outline-none"
            />
            <input
              type="text"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              placeholder="Book title"
              className="px-4 py-2.5 glass-subtle rounded-2xl text-sm font-light focus:outline-none"
            />
          </div>

          <textarea
            value={myTake}
            onChange={(e) => setMyTake(e.target.value)}
            placeholder="Your take — why does this matter to you?"
            className="w-full bg-transparent text-[#2D2A26] placeholder:text-[#9C958E] text-sm font-light resize-none focus:outline-none min-h-[80px] mb-4"
          />

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={!quoteText.trim() || !author.trim() || !bookTitle.trim() || !myTake.trim()}
              className="px-6 py-2 bg-gradient-to-r from-[#C4A484] to-[#E8D4CF] text-white text-sm font-light rounded-full hover:opacity-90 disabled:opacity-50 transition-all"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Quotes */}
      <div className="space-y-4">
        {quotes.length === 0 && !isAdding ? (
          <div className="text-center py-20">
            <p className="text-[#9C958E] font-light mb-4">Quotes that add depth to your voice</p>
            <button
              onClick={() => setIsAdding(true)}
              className="px-6 py-2.5 glass hover-lift rounded-full text-sm font-light text-[#2D2A26]"
            >
              Add first quote
            </button>
          </div>
        ) : (
          quotes.map((quote) => (
            <div
              key={quote.id}
              className="group glass-subtle hover-lift rounded-2xl p-6 cursor-pointer"
              onClick={() => setExpandedId(expandedId === quote.id ? null : quote.id)}
            >
              {/* Quote */}
              <div className="flex gap-3 mb-3">
                <Quote className="w-5 h-5 text-[#C4A484] flex-shrink-0 mt-1" />
                <p className={`text-[#2D2A26] font-light italic leading-relaxed ${
                  expandedId === quote.id ? '' : 'line-clamp-3'
                }`}>
                  &ldquo;{quote.quote}&rdquo;
                </p>
              </div>

              {/* Attribution */}
              <p className="text-sm text-[#9C958E] font-light mb-3">
                — {quote.author}, <span className="italic">{quote.bookTitle}</span>
              </p>

              {/* My Take */}
              {(expandedId === quote.id || quote.myTake.length < 100) && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-sm text-[#6B6560] font-light">{quote.myTake}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(quote.id);
                  }}
                  className="p-2 rounded-full hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 text-[#9C958E] hover:text-red-400" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      {!isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="fab glass-strong bg-gradient-to-r from-[#C4A484] to-[#E8D4CF] text-white hover:scale-105 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}

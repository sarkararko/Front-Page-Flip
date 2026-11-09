import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { PdfResource, Subject } from '../../types';
import { SearchSuggestionsList } from './SearchSuggestionsList';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfs: PdfResource[];
  subjects: Subject[];
  onViewPdf: (pdf: PdfResource) => void;
  onSelectSubject: (subject: Subject) => void;
  onViewAllResults: (query: string) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  pdfs,
  subjects,
  onViewPdf,
  onSelectSubject,
  onViewAllResults,
}) => {
  const [query, setQuery] = useState('');

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search subjects, topics, or PDF notes..."
            className="w-full text-sm font-medium text-[#152238] placeholder-slate-400 outline-hidden bg-transparent"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              title="Clear text"
              aria-label="Clear search text"
              className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {/* Replace ESC text button with easy-to-click X icon button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            title="Close search (Esc)"
            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Search Results */}
        <div className="max-h-96 overflow-y-auto p-4">
          <SearchSuggestionsList
            query={query}
            subjects={subjects}
            pdfs={pdfs}
            onSelectSubject={onSelectSubject}
            onViewPdf={onViewPdf}
            onViewAllResults={onViewAllResults}
            onItemClick={onClose}
          />
        </div>
      </div>
    </div>
  );
};

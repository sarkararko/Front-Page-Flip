import React, { useState, useEffect } from 'react';
import { Search, X, FileText, ArrowRight } from 'lucide-react';
import { PdfResource, Subject } from '../../types';

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

  const matchingPdfs = query.trim()
    ? pdfs
        .filter(
          (p) =>
            p.isPublished &&
            (p.title.toLowerCase().includes(query.toLowerCase()) ||
              p.subjectName.toLowerCase().includes(query.toLowerCase()) ||
              p.topic.toLowerCase().includes(query.toLowerCase()))
        )
        .slice(0, 5)
    : [];

  const matchingSubjects = query.trim()
    ? subjects
        .filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 3)
    : [];

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
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded"
          >
            ESC
          </button>
        </div>

        {/* Live Search Results */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-4">
          {query.trim() === '' ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Search by note title (e.g. Operating Systems, Calculus, Organic Chemistry)
            </div>
          ) : (
            <>
              {/* Matching Subjects */}
              {matchingSubjects.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Subjects
                  </h4>
                  <div className="space-y-1">
                    {matchingSubjects.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          onClose();
                          onSelectSubject(sub);
                        }}
                        className="w-full p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between text-left transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1677FF] flex items-center justify-center font-bold text-xs">
                            {sub.name[0]}
                          </div>
                          <span className="text-xs font-bold text-[#102A56]">{sub.name}</span>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">{sub.pdfCount} PDFs</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching PDFs */}
              {matchingPdfs.length > 0 ? (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    PDF Notes
                  </h4>
                  <div className="space-y-1">
                    {matchingPdfs.map((pdf) => (
                      <button
                        key={pdf.id}
                        type="button"
                        onClick={() => {
                          onClose();
                          onViewPdf(pdf);
                        }}
                        className="w-full p-2.5 rounded-xl hover:bg-blue-50/60 flex items-center justify-between text-left transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-red-500 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-[#102A56] group-hover:text-[#1677FF] transition-colors">
                              {pdf.title}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {pdf.subjectName} • {pdf.topic}
                            </p>
                          </div>
                        </div>
                        <span className="text-[11px] text-[#1677FF] font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          View <ArrowRight className="w-3 h-3" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                matchingSubjects.length === 0 && (
                  <div className="py-6 text-center text-xs text-slate-500">
                    No matching notes found for "{query}".
                  </div>
                )
              )}

              {matchingPdfs.length > 0 && (
                <div className="pt-2 border-t border-slate-100 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onViewAllResults(query);
                    }}
                    className="text-xs font-bold text-[#1677FF] hover:underline"
                  >
                    View all matching results in Browse PDFs →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

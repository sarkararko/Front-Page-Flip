import React from 'react';
import { FileText, ArrowRight, BookOpen } from 'lucide-react';
import { PdfResource, Subject } from '../../types';

interface SearchSuggestionsListProps {
  query: string;
  subjects?: Subject[];
  pdfs?: PdfResource[];
  onSelectSubject?: (subject: Subject) => void;
  onViewPdf?: (pdf: PdfResource) => void;
  onViewAllResults: (query: string) => void;
  onItemClick?: () => void;
  maxSubjects?: number;
  maxPdfs?: number;
}

export const SearchSuggestionsList: React.FC<SearchSuggestionsListProps> = ({
  query,
  subjects = [],
  pdfs = [],
  onSelectSubject,
  onViewPdf,
  onViewAllResults,
  onItemClick,
  maxSubjects = 3,
  maxPdfs = 5,
}) => {
  const trimmedQuery = query.trim().toLowerCase();

  if (!trimmedQuery) {
    return (
      <div className="py-7 px-4 text-center text-xs text-slate-400">
        Search by subject or note title (e.g. Operating Systems, Calculus, Chemistry)
      </div>
    );
  }

  const matchingSubjects = subjects
    .filter((s) => s.name.toLowerCase().includes(trimmedQuery))
    .slice(0, maxSubjects);

  const matchingPdfs = pdfs
    .filter(
      (p) =>
        p.isPublished &&
        (p.title.toLowerCase().includes(trimmedQuery) ||
          p.subjectName.toLowerCase().includes(trimmedQuery) ||
          (p.topic && p.topic.toLowerCase().includes(trimmedQuery)))
    )
    .slice(0, maxPdfs);

  const hasMatches = matchingSubjects.length > 0 || matchingPdfs.length > 0;

  if (!hasMatches) {
    return (
      <div className="py-8 px-4 text-center">
        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
          <BookOpen className="w-5 h-5" />
        </div>
        <p className="text-xs font-semibold text-slate-700">No matching subjects or notes found</p>
        <p className="text-[11px] text-slate-400 mt-1">
          No matches found for &ldquo;{query.trim()}&rdquo;. Try another topic or subject name.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Matching Subjects */}
      {matchingSubjects.length > 0 && (
        <div>
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
            Subjects
          </h4>
          <div className="space-y-1">
            {matchingSubjects.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => {
                  if (onItemClick) onItemClick();
                  if (onSelectSubject) onSelectSubject(sub);
                }}
                className="w-full p-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1677FF] flex items-center justify-center font-bold text-xs shrink-0">
                    {sub.name[0]}
                  </div>
                  <span className="text-xs font-bold text-[#102A56] group-hover:text-[#1677FF] transition-colors truncate">
                    {sub.name}
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-medium shrink-0 ml-2">
                  {sub.pdfCount} {sub.pdfCount === 1 ? 'PDF' : 'PDFs'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Matching PDFs */}
      {matchingPdfs.length > 0 && (
        <div>
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
            PDF Notes
          </h4>
          <div className="space-y-1">
            {matchingPdfs.map((pdf) => (
              <button
                key={pdf.id}
                type="button"
                onClick={() => {
                  if (onItemClick) onItemClick();
                  if (onViewPdf) onViewPdf(pdf);
                }}
                className="w-full p-2.5 rounded-xl hover:bg-blue-50/60 flex items-center justify-between text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-5 h-5 text-red-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#102A56] group-hover:text-[#1677FF] transition-colors truncate">
                      {pdf.title}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {pdf.subjectName} {pdf.topic ? `• ${pdf.topic}` : ''}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-[#1677FF] font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 ml-2">
                  View <ArrowRight className="w-3 h-3" />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* View All Matching Results Footer Link */}
      <div className="pt-2 border-t border-slate-100 text-center">
        <button
          type="button"
          onClick={() => {
            if (onItemClick) onItemClick();
            onViewAllResults(query.trim());
          }}
          className="text-xs font-bold text-[#1677FF] hover:text-[#0E63DC] hover:underline cursor-pointer inline-flex items-center gap-1"
        >
          View all matching results in Browse PDFs →
        </button>
      </div>
    </div>
  );
};

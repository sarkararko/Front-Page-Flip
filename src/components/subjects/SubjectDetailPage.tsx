import React, { useState } from 'react';
import {
  ChevronRight,
  Star,
  Search,
  BookOpen,
  ArrowLeft,
  FileText,
} from 'lucide-react';
import { Subject, PdfResource } from '../../types';
import { PdfCard } from '../common/PdfCard';

interface SubjectDetailPageProps {
  subject: Subject;
  pdfs: PdfResource[];
  isFavorite: boolean;
  readLaterIds: string[];
  onToggleFavorite: (subjectId: string) => void;
  onToggleReadLater: (pdfId: string, e: React.MouseEvent) => void;
  onViewPdf: (pdf: PdfResource) => void;
  onBack: () => void;
}

export const SubjectDetailPage: React.FC<SubjectDetailPageProps> = ({
  subject,
  pdfs,
  isFavorite,
  readLaterIds,
  onToggleFavorite,
  onToggleReadLater,
  onViewPdf,
  onBack,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [searchInSubject, setSearchInSubject] = useState('');

  // PDFs for this subject
  const subjectPdfs = pdfs.filter((p) => p.subjectId === subject.id && p.isPublished);

  // Available topics for this subject
  const topics = subject.topics || Array.from(new Set(subjectPdfs.map((p) => p.topic)));

  // Filtered by topic and local search
  const displayedPdfs = subjectPdfs.filter((p) => {
    const matchTopic = selectedTopic === 'all' || p.topic.toLowerCase() === selectedTopic.toLowerCase();
    const matchSearch =
      !searchInSubject.trim() ||
      p.title.toLowerCase().includes(searchInSubject.toLowerCase()) ||
      p.topic.toLowerCase().includes(searchInSubject.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchInSubject.toLowerCase()));
    return matchTopic && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-[#64748B] mb-6 font-medium">
        <button type="button" onClick={onBack} className="hover:text-[#1677FF] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Subjects</span>
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="text-[#102A56] font-bold">{subject.name}</span>
      </nav>

      {/* Subject Header Banner */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm text-2xl font-black"
            style={{ backgroundColor: subject.iconBgColor || '#EFF6FF', color: subject.iconColor || '#1677FF' }}
          >
            {subject.name[0]}
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-[#102A56]">{subject.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#1677FF]">
                {subjectPdfs.length} PDFs
              </span>
            </div>

            <p className="text-sm text-[#64748B] mt-2 max-w-2xl leading-relaxed font-medium">
              {subject.description || `Explore comprehensive educational notes and study materials for ${subject.name}.`}
            </p>
          </div>
        </div>

        {/* Favorite Toggle Button */}
        <button
          type="button"
          onClick={() => onToggleFavorite(subject.id)}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-xs shrink-0 ${
            isFavorite
              ? 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100'
              : 'bg-white border border-[#CBD5E1] text-[#102A56] hover:bg-slate-50'
          }`}
        >
          <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
          <span>{isFavorite ? 'Favorite Subject' : 'Add to Favorites'}</span>
        </button>
      </div>

      {/* Topic Filter Chips & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
        {/* Topic Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedTopic('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              selectedTopic === 'all'
                ? 'bg-[#102A56] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Topics ({subjectPdfs.length})
          </button>
          {topics.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedTopic(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedTopic === t
                  ? 'bg-[#1677FF] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Local Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchInSubject}
            onChange={(e) => setSearchInSubject(e.target.value)}
            placeholder={`Search in ${subject.name}...`}
            className="w-full pl-9 pr-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#152238] focus:border-[#1677FF] outline-hidden"
          />
        </div>
      </div>

      {/* Grid of PDF Resources */}
      {displayedPdfs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayedPdfs.map((pdf) => (
            <PdfCard
              key={pdf.id}
              pdf={pdf}
              isReadLater={readLaterIds.includes(pdf.id)}
              onToggleReadLater={onToggleReadLater}
              onViewPdf={onViewPdf}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center max-w-md mx-auto">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-[#102A56] text-base">No notes found for this filter</h3>
          <p className="text-xs text-[#64748B] mt-1">
            Try choosing a different topic or resetting the search filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedTopic('all');
              setSearchInSubject('');
            }}
            className="mt-4 px-3.5 py-1.5 bg-[#EFF6FF] text-[#1677FF] rounded-lg text-xs font-bold"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

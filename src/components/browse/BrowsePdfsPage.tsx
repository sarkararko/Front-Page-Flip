import React, { useState, useMemo } from 'react';
import { Search, Filter, SlidersHorizontal, BookOpen, RotateCcw } from 'lucide-react';
import { Subject, PdfResource } from '../../types';
import { PdfCard } from '../common/PdfCard';

interface BrowsePdfsPageProps {
  subjects: Subject[];
  pdfs: PdfResource[];
  initialSearchQuery?: string;
  initialSubjectId?: string;
  readLaterIds: string[];
  onToggleReadLater: (pdfId: string, e: React.MouseEvent) => void;
  onViewPdf: (pdf: PdfResource) => void;
  onSelectSubject: (subject: Subject) => void;
}

export const BrowsePdfsPage: React.FC<BrowsePdfsPageProps> = ({
  subjects,
  pdfs,
  initialSearchQuery = '',
  initialSubjectId,
  readLaterIds,
  onToggleReadLater,
  onViewPdf,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId || 'all');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical' | 'pages'>('recent');

  // Extract all unique semesters
  const availableSemesters = useMemo(() => {
    const sems = new Set<string>();
    pdfs.forEach((p) => {
      if (p.semester) sems.add(p.semester);
    });
    return Array.from(sems).sort();
  }, [pdfs]);

  // Filter and sort PDFs
  const filteredPdfs = useMemo(() => {
    let result = pdfs.filter((p) => p.isPublished);

    // Subject Filter
    if (selectedSubjectId !== 'all') {
      result = result.filter((p) => p.subjectId === selectedSubjectId);
    }

    // Semester Filter
    if (selectedSemester !== 'all') {
      result = result.filter((p) => p.semester === selectedSemester);
    }

    // Search Query Filter (Title, Subject, Topic, Description)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.subjectName.toLowerCase().includes(q) ||
          p.topic.toLowerCase().includes(q) ||
          (p.course && p.course.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sortBy === 'recent') {
      result.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
    } else if (sortBy === 'alphabetical') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'pages') {
      result.sort((a, b) => b.pageCount - a.pageCount);
    }

    return result;
  }, [pdfs, selectedSubjectId, selectedSemester, searchQuery, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSubjectId('all');
    setSelectedSemester('all');
    setSortBy('recent');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header matching specification: "Explore PDF Notes" */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#102A56] tracking-tight">Explore PDF Notes</h1>
        <p className="text-sm sm:text-base text-[#64748B] mt-1 font-medium">
          Find the notes you need, organized by subject and topic.
        </p>
      </div>

      {/* Main Search and Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 shadow-xs mb-8 space-y-4">
        {/* Search input */}
        <div className="relative flex items-center">
          <Search className="w-5 h-5 text-slate-400 absolute left-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by note title, subject, topic or keywords..."
            className="w-full pl-11 pr-4 py-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm text-[#152238] focus:bg-white focus:border-[#1677FF] focus:ring-2 focus:ring-[#1677FF]/15 outline-hidden font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-4 text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter dropdowns row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className="text-[#64748B] font-bold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#1677FF]" /> Filters:
            </span>

            {/* Subject Selector */}
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="py-1.5 px-3 bg-white border border-[#CBD5E1] rounded-lg text-slate-700 font-medium focus:border-[#1677FF] outline-hidden"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.pdfCount})
                </option>
              ))}
            </select>

            {/* Semester Selector */}
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="py-1.5 px-3 bg-white border border-[#CBD5E1] rounded-lg text-slate-700 font-medium focus:border-[#1677FF] outline-hidden"
            >
              <option value="all">All Semesters</option>
              {availableSemesters.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>

            {(selectedSubjectId !== 'all' || selectedSemester !== 'all' || searchQuery) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="py-1.5 px-2.5 text-red-600 hover:bg-red-50 rounded-lg font-semibold flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#64748B] font-semibold flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-1.5 px-3 bg-white border border-[#CBD5E1] rounded-lg text-slate-700 font-medium focus:border-[#1677FF] outline-hidden"
            >
              <option value="recent">Recently Added</option>
              <option value="alphabetical">Alphabetical (A-Z)</option>
              <option value="pages">Most Pages</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm font-bold text-[#102A56]">
          Showing <span className="text-[#1677FF]">{filteredPdfs.length}</span> educational PDF
          {filteredPdfs.length === 1 ? '' : 's'}
        </p>
      </div>

      {/* PDF Grid */}
      {filteredPdfs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredPdfs.map((pdf) => (
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
        /* Empty State */
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 text-[#1677FF] flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#102A56]">No PDFs found</h3>
          <p className="text-sm text-[#64748B] mt-1.5">
            Try a different title, subject, or topic.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-6 px-4 py-2 bg-[#1677FF] text-white rounded-xl text-xs font-bold hover:bg-[#0E63DC] transition-colors"
          >
            Clear Filters &amp; Search
          </button>
        </div>
      )}
    </div>
  );
};

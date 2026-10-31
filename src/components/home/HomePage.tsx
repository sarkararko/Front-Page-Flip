import React from 'react';
import { ArrowRight, BookOpen, FileText, Sparkles } from 'lucide-react';
import { Subject, PdfResource, User } from '../../types';
import { HeroSearch } from './HeroSearch';
import { SubjectCard } from '../common/SubjectCard';
import { PdfCard } from '../common/PdfCard';
import { LearningCollectionBanner } from './LearningCollectionBanner';

interface HomePageProps {
  currentUser: User;
  subjects: Subject[];
  recentlyAddedPdfs: PdfResource[];
  userFavorites: string[];
  readLaterIds: string[];
  readingProgressMap?: Record<string, { lastPageRead: number; totalPages: number }>;
  activeStudentsCount?: number;
  registeredStudentsCount?: number;
  onSearch: (query: string) => void;
  onSelectSubject: (subject: Subject) => void;
  onViewAllSubjects: () => void;
  onViewAllPdfs: () => void;
  onToggleFavorite: (subjectId: string, e: React.MouseEvent) => void;
  onToggleReadLater: (pdfId: string, e: React.MouseEvent) => void;
  onViewPdf: (pdf: PdfResource) => void;
  onGoToLibrary: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  currentUser,
  subjects,
  recentlyAddedPdfs,
  userFavorites,
  readLaterIds,
  readingProgressMap,
  activeStudentsCount = 0,
  registeredStudentsCount,
  onSearch,
  onSelectSubject,
  onViewAllSubjects,
  onViewAllPdfs,
  onToggleFavorite,
  onToggleReadLater,
  onViewPdf,
  onGoToLibrary,
}) => {
  // Show top 8 subjects for the 4x2 grid matching fpf inside interface.png
  const displayedSubjects = subjects.slice(0, 8);

  // Show top 4 recently added PDFs matching fpf inside interface.png
  const displayedPdfs = recentlyAddedPdfs.slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* 1. Hero Search Section with Live MySQL Student Count */}
      <HeroSearch
        userName={currentUser.name}
        activeStudentsCount={activeStudentsCount}
        registeredStudentsCount={registeredStudentsCount}
        onSearch={onSearch}
      />

      {/* 2. Explore Subjects Section */}
      <section className="mb-12">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#102A56] tracking-tight">
              Explore Subjects
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 font-medium">
              Browse by subject and find the notes you need.
            </p>
          </div>

          <button
            type="button"
            onClick={onViewAllSubjects}
            className="text-xs sm:text-sm font-bold text-[#1677FF] hover:text-[#0E63DC] flex items-center gap-1 transition-colors group"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* 4x2 Grid of Subject Cards */}
        {displayedSubjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {displayedSubjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                isFavorite={userFavorites.includes(subject.id)}
                onToggleFavorite={onToggleFavorite}
                onClick={onSelectSubject}
              />
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-white via-[#FAFDFE] to-[#F0F7FF] rounded-3xl border border-[#DCE7F6] p-8 sm:p-10 text-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1677FF]/15 to-[#0DB7A5]/20 text-[#1677FF] border border-[#1677FF]/20 flex items-center justify-center mx-auto mb-3.5 shadow-xs">
              <BookOpen className="w-7 h-7 text-[#1677FF]" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#102A56]">
              No study materials available yet
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 max-w-md mx-auto font-medium">
              New content will appear here once published by the admin.
            </p>
          </div>
        )}
      </section>

      {/* 3. Recently Added PDFs Section */}
      <section className="mb-8">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#102A56] tracking-tight">
              Recently Added PDFs
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 font-medium">
              Check out the latest notes and study materials.
            </p>
          </div>

          <button
            type="button"
            onClick={onViewAllPdfs}
            className="text-xs sm:text-sm font-bold text-[#1677FF] hover:text-[#0E63DC] flex items-center gap-1 transition-colors group"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* 4-column Grid of PDF Resource Cards */}
        {displayedPdfs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {displayedPdfs.map((pdf) => (
              <PdfCard
                key={pdf.id}
                pdf={pdf}
                isReadLater={readLaterIds.includes(pdf.id)}
                readingProgress={readingProgressMap?.[pdf.id]}
                onToggleReadLater={onToggleReadLater}
                onViewPdf={onViewPdf}
              />
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-white via-[#FAFDFE] to-[#F0F7FF] rounded-3xl border border-[#DCE7F6] p-8 sm:p-10 text-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0DB7A5]/15 to-[#4F46E5]/20 text-[#0DB7A5] border border-[#0DB7A5]/25 flex items-center justify-center mx-auto mb-3.5 shadow-xs">
              <FileText className="w-7 h-7 text-[#0DB7A5]" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#102A56]">
              No study materials available yet
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 max-w-md mx-auto font-medium">
              New content will appear here once published by the admin.
            </p>
          </div>
        )}
      </section>

      {/* 4. Bottom Banner: Build Your Learning Collection */}
      <LearningCollectionBanner onGoToLibrary={onGoToLibrary} />
    </div>
  );
};

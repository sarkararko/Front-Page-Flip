import React from 'react';
import { ArrowRight } from 'lucide-react';
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
      {/* 1. Hero Search Section matching fpf inside interface.png */}
      <HeroSearch userName={currentUser.name} onSearch={onSearch} />

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
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
      </section>

      {/* 4. Bottom Banner: Build Your Learning Collection */}
      <LearningCollectionBanner onGoToLibrary={onGoToLibrary} />
    </div>
  );
};

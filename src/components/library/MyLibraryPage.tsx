import React, { useState } from 'react';
import {
  BookMarked,
  Clock,
  Star,
  BookOpen,
  ArrowRight,
  Trash2,
  FileText,
  Calendar,
} from 'lucide-react';
import { PdfResource, Subject, RecentlyViewedItem } from '../../types';
import { PdfCard } from '../common/PdfCard';
import { SubjectCard } from '../common/SubjectCard';

interface MyLibraryPageProps {
  initialSubTab?: 'read-later' | 'recently-viewed' | 'favorites';
  savedPdfs: PdfResource[];
  recentlyViewed: RecentlyViewedItem[];
  allPdfs: PdfResource[];
  favoriteSubjects: Subject[];
  onRemoveReadLater: (pdfId: string) => void;
  onToggleFavorite: (subjectId: string, e: React.MouseEvent) => void;
  onViewPdf: (pdf: PdfResource) => void;
  onSelectSubject: (subject: Subject) => void;
  onExplorePdfs: () => void;
  onExploreSubjects: () => void;
}

export const MyLibraryPage: React.FC<MyLibraryPageProps> = ({
  initialSubTab = 'read-later',
  savedPdfs,
  recentlyViewed,
  allPdfs,
  favoriteSubjects,
  onRemoveReadLater,
  onToggleFavorite,
  onViewPdf,
  onSelectSubject,
  onExplorePdfs,
  onExploreSubjects,
}) => {
  const [activeTab, setActiveTab] = useState<'read-later' | 'recently-viewed' | 'favorites'>(
    initialSubTab
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[#102A56] tracking-tight">My Library</h1>
        <p className="text-sm sm:text-base text-[#64748B] mt-1 font-medium">
          Access your saved educational PDFs, reading history, and favorite subjects.
        </p>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-[#E2E8F0] mb-8 gap-4 sm:gap-8">
        <button
          type="button"
          onClick={() => setActiveTab('read-later')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 relative transition-colors ${
            activeTab === 'read-later' ? 'text-[#1677FF]' : 'text-[#64748B] hover:text-[#102A56]'
          }`}
        >
          <BookMarked className="w-4 h-4" />
          <span>Read Later ({savedPdfs.length})</span>
          {activeTab === 'read-later' && (
            <span className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-[#1677FF] rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('recently-viewed')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 relative transition-colors ${
            activeTab === 'recently-viewed'
              ? 'text-[#1677FF]'
              : 'text-[#64748B] hover:text-[#102A56]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Recently Viewed ({recentlyViewed.length})</span>
          {activeTab === 'recently-viewed' && (
            <span className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-[#1677FF] rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('favorites')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 relative transition-colors ${
            activeTab === 'favorites' ? 'text-[#1677FF]' : 'text-[#64748B] hover:text-[#102A56]'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>Favorite Subjects ({favoriteSubjects.length})</span>
          {activeTab === 'favorites' && (
            <span className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-[#1677FF] rounded-full" />
          )}
        </button>
      </div>

      {/* ================= TAB 1: READ LATER ================= */}
      {activeTab === 'read-later' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#102A56]">Read Later</h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
              Your saved PDFs, ready whenever you are.
            </p>
          </div>

          {savedPdfs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {savedPdfs.map((pdf) => (
                <PdfCard
                  key={pdf.id}
                  pdf={pdf}
                  isReadLater={true}
                  onToggleReadLater={() => onRemoveReadLater(pdf.id)}
                  onViewPdf={onViewPdf}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center max-w-lg mx-auto shadow-xs">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 text-[#1677FF] flex items-center justify-center mb-4">
                <BookMarked className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-[#102A56]">Your reading list is empty.</h3>
              <p className="text-sm text-[#64748B] mt-1.5">
                Bookmark PDFs you want to read later, and they'll appear here.
              </p>
              <button
                type="button"
                onClick={onExplorePdfs}
                className="mt-6 px-5 py-2.5 bg-[#1677FF] hover:bg-[#0E63DC] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 mx-auto"
              >
                <span>Explore PDFs</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: RECENTLY VIEWED ================= */}
      {activeTab === 'recently-viewed' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#102A56]">Recently Viewed</h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
              Continue reading your opened documents from where you stopped.
            </p>
          </div>

          {recentlyViewed.length > 0 ? (
            <div className="space-y-4">
              {recentlyViewed.map((item) => {
                const pdf = allPdfs.find((p) => p.id === item.pdfId);
                if (!pdf) return null;

                const progressPercent = Math.min(
                  100,
                  Math.round((item.lastPageRead / (item.totalPages || pdf.pageCount || 1)) * 100)
                );

                return (
                  <div
                    key={item.pdfId}
                    className="bg-white rounded-2xl border border-[#E2E8F0] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-[#1677FF]/40 hover:shadow-xs transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm sm:text-base text-[#102A56]">
                          {pdf.title}
                        </h4>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          {pdf.subjectName} • {pdf.topic}
                        </p>

                        {/* Progress indicator */}
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className="font-semibold text-[#1677FF]">
                            Page {item.lastPageRead} of {item.totalPages || pdf.pageCount}
                          </span>
                          <span className="text-slate-300">•</span>
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#1677FF] rounded-full"
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                          <span className="text-slate-400 font-mono text-[11px]">
                            {progressPercent}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onViewPdf(pdf)}
                      className="w-full sm:w-auto px-4 py-2 bg-[#EFF6FF] hover:bg-[#1677FF] text-[#1677FF] hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shrink-0"
                    >
                      <span>Continue Reading</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center max-w-lg mx-auto shadow-xs">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 text-[#1677FF] flex items-center justify-center mb-4">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-[#102A56]">No reading history yet.</h3>
              <p className="text-sm text-[#64748B] mt-1.5">
                When you open any PDF note to study, it will be listed here with your last read page.
              </p>
              <button
                type="button"
                onClick={onExplorePdfs}
                className="mt-6 px-5 py-2.5 bg-[#1677FF] text-white rounded-xl text-xs font-bold hover:bg-[#0E63DC] transition-all flex items-center gap-2 mx-auto"
              >
                <span>Browse PDFs</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: FAVORITE SUBJECTS ================= */}
      {activeTab === 'favorites' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#102A56]">Favorite Subjects</h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
              Your starred subjects for fast access to semester materials.
            </p>
          </div>

          {favoriteSubjects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {favoriteSubjects.map((subject) => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  isFavorite={true}
                  onToggleFavorite={onToggleFavorite}
                  onClick={onSelectSubject}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center max-w-lg mx-auto shadow-xs">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-4">
                <Star className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-[#102A56]">No favorite subjects yet.</h3>
              <p className="text-sm text-[#64748B] mt-1.5">
                Save your favorite subjects to find their PDFs faster.
              </p>
              <button
                type="button"
                onClick={onExploreSubjects}
                className="mt-6 px-5 py-2.5 bg-[#1677FF] text-white rounded-xl text-xs font-bold hover:bg-[#0E63DC] transition-all flex items-center gap-2 mx-auto"
              >
                <span>Explore Subjects</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

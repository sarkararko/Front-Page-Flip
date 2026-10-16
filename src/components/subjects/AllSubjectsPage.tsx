import React, { useState } from 'react';
import { Search, BookOpen } from 'lucide-react';
import { Subject } from '../../types';
import { SubjectCard } from '../common/SubjectCard';

interface AllSubjectsPageProps {
  subjects: Subject[];
  userFavorites: string[];
  onToggleFavorite: (subjectId: string, e: React.MouseEvent) => void;
  onSelectSubject: (subject: Subject) => void;
}

export const AllSubjectsPage: React.FC<AllSubjectsPageProps> = ({
  subjects,
  userFavorites,
  onToggleFavorite,
  onSelectSubject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-[#102A56] tracking-tight">Explore Subjects</h1>
          <p className="text-sm sm:text-base text-[#64748B] mt-1 font-medium">
            Browse by subject and find the exact PDF study materials you need.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subjects..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium text-[#152238] focus:border-[#1677FF] outline-hidden"
          />
        </div>
      </div>

      {/* Grid of Subject Cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filtered.map((subject) => (
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
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center max-w-md mx-auto">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-[#102A56] text-base">No subjects found</h3>
          <p className="text-xs text-[#64748B] mt-1">
            Try adjusting your search query.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="mt-4 px-3.5 py-1.5 bg-[#EFF6FF] text-[#1677FF] rounded-lg text-xs font-bold"
          >
            Clear Search
          </button>
        </div>
      )}
    </div>
  );
};

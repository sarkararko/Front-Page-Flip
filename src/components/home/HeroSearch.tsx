import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { DashboardHeroIllustration } from '../common/DashboardHeroIllustration';

interface HeroSearchProps {
  userName: string;
  activeStudentsCount?: number;
  registeredStudentsCount?: number;
  onSearch: (query: string) => void;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({
  userName,
  activeStudentsCount = 0,
  registeredStudentsCount,
  onSearch,
}) => {
  const [searchInput, setSearchInput] = useState('');

  // Compute greeting according to local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = userName ? userName.split(' ')[0] : 'Student';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
    }
  };

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#EDF5FF] via-[#F3F9FE] to-[#E8F5FF] border border-[#D4E5F9] p-6 sm:p-8 md:p-10 shadow-[0_8px_30px_rgb(22,119,255,0.06)] mb-10">
      {/* Decorative subtle ambient circles */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 right-10 w-72 h-72 bg-teal-300/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
        {/* Left Content Area */}
        <div className="w-full md:max-w-xl text-left">
          {/* Live Online Badge near the top */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs border border-emerald-500/25 shadow-xs mb-3.5 text-xs font-bold text-[#102A56] select-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-700 font-extrabold tracking-wide">
              {activeStudentsCount} {activeStudentsCount === 1 ? 'Student' : 'Students'} Online Now
            </span>
            {typeof registeredStudentsCount === 'number' && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-[#1677FF] font-bold">{registeredStudentsCount} Registered Students</span>
              </>
            )}
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 font-medium hidden sm:inline">MySQL Live</span>
          </div>

          {/* Greeting matching reference: "Good morning, Arkoparno! 👋" */}
          <h1 className="text-2xl sm:text-3xl md:text-[34px] font-black text-[#102A56] tracking-tight flex items-center gap-2">
            <span>
              {getGreeting()}, {firstName}!
            </span>
            <span className="inline-block animate-wave origin-bottom-right">👋</span>
          </h1>

          <p className="mt-2 text-sm sm:text-base text-[#475569] font-normal leading-relaxed">
            Find the perfect notes, study materials and PDFs for your subjects.
          </p>

          {/* Prominent Search Bar flush button matching image_f78d44c1.png */}
          <form onSubmit={handleSubmit} className="mt-6 flex items-center max-w-lg">
            <div className="relative w-full flex items-center bg-white rounded-lg shadow-xs border border-[#CBD5E1] focus-within:border-[#1677FF] focus-within:ring-2 focus-within:ring-[#1677FF]/15 transition-all overflow-hidden">
              <Search className="w-4 h-4 text-slate-400 ml-3.5 shrink-0" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search subjects, topics or PDF notes..."
                className="w-full py-2.5 sm:py-3 pl-3 pr-4 text-xs sm:text-sm text-[#152238] placeholder-slate-400 bg-transparent outline-hidden font-medium"
              />
              <button
                type="submit"
                aria-label="Submit search"
                className="h-full px-5 py-2.5 sm:py-3 bg-[#1677FF] hover:bg-[#0E63DC] text-white transition-colors flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Right Illustration: 3D Stacked Books & Pencil Stand matching image_f78d44c1.png */}
        <div className="hidden md:flex shrink-0 items-center justify-end relative h-40 w-72 overflow-hidden select-none">
          <img
            src="/assets/aistudio/image_f78d44c1.png"
            alt="Study materials and books"
            className="h-full w-auto object-cover object-right select-none pointer-events-none drop-shadow-sm scale-110 origin-right"
            onError={(e) => {
              // Fallback to vector illustration if image fails
              e.currentTarget.style.display = 'none';
              const fallback = document.getElementById('hero-vector-fallback');
              if (fallback) fallback.style.display = 'block';
            }}
          />
          <div id="hero-vector-fallback" style={{ display: 'none' }}>
            <DashboardHeroIllustration />
          </div>
        </div>
      </div>
    </section>
  );
};

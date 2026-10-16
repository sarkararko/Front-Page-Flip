import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { DashboardHeroIllustration } from '../common/DashboardHeroIllustration';

interface HeroSearchProps {
  userName: string;
  onSearch: (query: string) => void;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({ userName, onSearch }) => {
  const [searchInput, setSearchInput] = useState('');

  // Compute greeting according to local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = userName ? userName.split(' ')[0] : 'Arkoparno';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
    }
  };

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#EBF3FF] via-[#E9F5FE] to-[#E3F2FD] border border-[#DCEBFE] p-6 sm:p-8 md:p-10 shadow-xs mb-10">
      {/* Decorative subtle ambient circles */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-white/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 right-10 w-60 h-60 bg-teal-100/30 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Left Content Area */}
        <div className="w-full md:max-w-xl text-left">
          {/* Greeting matching reference: "Good morning, Arkoparno! 👋" */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#102A56] tracking-tight flex items-center gap-2">
            <span>
              {getGreeting()}, {firstName}!
            </span>
            <span className="inline-block animate-wave origin-bottom-right">👋</span>
          </h1>

          <p className="mt-2 text-sm sm:text-base text-[#475569] font-medium leading-relaxed">
            Find the perfect notes, study materials and PDFs for your subjects.
          </p>

          {/* Prominent Search Bar */}
          <form onSubmit={handleSubmit} className="mt-6 flex items-center max-w-lg">
            <div className="relative w-full flex items-center bg-white rounded-xl shadow-xs border border-[#E2E8F0] focus-within:border-[#1677FF] focus-within:ring-3 focus-within:ring-[#1677FF]/15 transition-all">
              <Search className="w-5 h-5 text-slate-400 ml-4 shrink-0" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search subjects, topics or PDF notes..."
                className="w-full py-3.5 pl-3 pr-4 text-sm text-[#152238] placeholder-slate-400 bg-transparent outline-hidden font-medium"
              />
              <button
                type="submit"
                aria-label="Submit search"
                className="m-1.5 p-2.5 bg-[#1677FF] hover:bg-[#0E63DC] text-white rounded-lg transition-colors flex items-center justify-center shrink-0 shadow-xs"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Right Illustration: Stacked Books & Pencil Stand */}
        <div className="hidden md:flex shrink-0 items-center justify-center">
          <DashboardHeroIllustration />
        </div>
      </div>
    </section>
  );
};

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { DashboardHeroIllustration } from '../common/DashboardHeroIllustration';

interface HeroSearchProps {
  userName: string;
  onSearch: (query: string) => void;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({
  userName,
  onSearch,
}) => {
  const [searchInput, setSearchInput] = useState('');

  // Dynamic time-based greeting according to local device time (Task 5)
  // - 5:00 AM–11:59 AM: Good morning
  // - 12:00 PM–4:59 PM: Good afternoon
  // - 5:00 PM–4:59 AM: Good evening
  const [currentDate, setCurrentDate] = useState(() => new Date());

  React.useEffect(() => {
    // Re-check every 30 seconds so greeting transitions automatically across boundaries
    const interval = setInterval(() => {
      setCurrentDate(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const getGreeting = () => {
    const hour = currentDate.getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Task 6: Display actual logged-in student's real name instead of generic "Student"
  // If name is unavailable, empty, "Student", or an email, fallback cleanly to neutral greeting without "Student"
  const getCleanFirstName = (name?: string | null): string | null => {
    if (!name) return null;
    const trimmed = name.trim();
    if (
      !trimmed ||
      trimmed.toLowerCase() === 'student' ||
      trimmed.toLowerCase() === 'undefined' ||
      trimmed.toLowerCase() === 'null' ||
      trimmed.includes('@')
    ) {
      return null;
    }
    const first = trimmed.split(/\s+/)[0];
    return first || null;
  };

  const greeting = getGreeting();
  const firstName = getCleanFirstName(userName);
  const greetingHeading = firstName ? `${greeting}, ${firstName}!` : `${greeting}!`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
    }
  };

  return (
    <section className="relative overflow-hidden rounded-[26px] sm:rounded-3xl bg-gradient-to-r from-[#EBF4FE] via-[#EDF5FE] to-[#E3F0FC] border border-[#D0E2F4] p-6 sm:p-8 md:p-10 shadow-[0_4px_24px_rgba(22,119,255,0.04)] mb-6">
      {/* Decorative ambient gradients matching reference screenshot */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-blue-300/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 right-10 w-72 h-72 bg-sky-300/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
        {/* Left Content Area */}
        <div className="w-full md:max-w-xl text-left">
          {/* Main Dynamic Greeting with student's actual name */}
          <h1 className="text-2xl sm:text-3xl md:text-[38px] font-black text-[#0F172A] tracking-tight leading-tight flex items-center gap-2.5">
            <span>{greetingHeading}</span>
            <span className="inline-block animate-wave origin-bottom-right">👋</span>
          </h1>

          <p className="mt-2.5 text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            Find the perfect notes, study materials and PDFs for your subjects.
          </p>

          {/* Prominent Search Bar with Blue Action Button */}
          <form onSubmit={handleSubmit} className="mt-6 flex items-center max-w-xl">
            <div className="relative w-full flex items-center bg-white rounded-xl sm:rounded-2xl shadow-xs border border-slate-200/90 focus-within:border-[#1677FF] focus-within:ring-2 focus-within:ring-[#1677FF]/15 transition-all overflow-hidden pl-3.5 pr-1.5 py-1.5">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0 ml-1" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search subjects, topics or PDF notes..."
                className="w-full py-2 sm:py-2.5 pl-3 pr-3 text-xs sm:text-sm text-[#0F172A] placeholder-slate-400 bg-transparent outline-none font-medium"
              />
              <button
                type="submit"
                aria-label="Submit search"
                className="px-5 sm:px-6 py-2.5 sm:py-3 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-xl transition-colors flex items-center justify-center shrink-0 cursor-pointer shadow-xs"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Right Illustration: 3D Stacked Books & Pencil Stand */}
        <div className="hidden md:flex shrink-0 items-center justify-end relative h-44 w-80 overflow-hidden select-none">
          <img
            src="/assets/aistudio/image_f78d44c1.png"
            alt="Study materials and books"
            className="h-full w-auto object-cover object-right select-none pointer-events-none drop-shadow-sm scale-105 origin-right"
            onError={(e) => {
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

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
    <section className="relative overflow-hidden rounded-[22px] sm:rounded-3xl bg-[linear-gradient(98deg,#EEF5FD_0%,#E3F0FC_28%,#C9E2FA_58%,#9BCAF6_88%,#88BDF2_100%)] border border-[#BED9F4] p-4 xs:p-5 sm:p-8 md:p-10 shadow-[0_4px_24px_rgba(22,119,255,0.05)] mb-6 min-h-[190px] sm:min-h-[240px] md:min-h-[260px] flex flex-col md:flex-row md:items-center justify-between">
      {/* Decorative ambient gradients matching reference screenshot */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-blue-300/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 right-10 w-72 h-72 bg-sky-300/20 rounded-full blur-2xl pointer-events-none" />

      {/* Subtle Right-side Decorative Elements: Translucent circles & soft teal/sky accents */}
      <div className="hidden md:block absolute -top-10 -right-10 w-44 h-44 rounded-full border border-teal-300/25 bg-gradient-to-br from-teal-200/15 to-sky-200/20 pointer-events-none" />
      <div className="hidden md:block absolute top-14 right-8 w-20 h-20 rounded-full border border-sky-300/20 bg-sky-200/15 pointer-events-none" />
      <div className="hidden md:block absolute -bottom-12 -right-6 w-36 h-36 rounded-full bg-gradient-to-tl from-sky-300/15 via-teal-200/10 to-transparent pointer-events-none" />
      <div className="hidden md:block absolute top-8 right-32 w-2.5 h-2.5 rounded-full bg-teal-400/25 pointer-events-none" />
      <div className="hidden md:block absolute bottom-16 right-28 w-2 h-2 rounded-full bg-sky-400/30 pointer-events-none" />

      {/* Desktop & Tablet Right-side Hero Illustration */}
      <div className="hidden md:flex absolute right-0 top-0 bottom-0 h-full w-[44%] lg:w-[48%] xl:w-[50%] max-w-[560px] items-center justify-end pointer-events-none select-none z-0 translate-x-3.5 lg:translate-x-4 pr-1 sm:pr-2 py-2">
        <DashboardHeroIllustration className="w-full h-full max-h-[300px] object-contain drop-shadow-sm" />
      </div>

      {/* Content Area */}
      <div className="relative z-10 w-full md:max-w-[380px] lg:max-w-lg xl:max-w-xl text-left">
        {/* Main Dynamic Greeting with student's actual name */}
        <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-[38px] font-black text-[#0F172A] tracking-tight leading-tight flex items-center gap-2">
          <span className="break-words">{greetingHeading}</span>
          <span className="inline-block animate-wave origin-bottom-right shrink-0">👋</span>
        </h1>

        <p className="mt-2 text-xs xs:text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
          Find the perfect notes, study materials and PDFs for your subjects.
        </p>

        {/* Prominent Search Bar with Blue Action Button */}
        <form onSubmit={handleSubmit} className="mt-4 sm:mt-6 flex items-center w-full max-w-xl">
          <div className="relative w-full flex items-center bg-white rounded-xl sm:rounded-2xl shadow-xs border border-slate-200/90 focus-within:border-[#1677FF] focus-within:ring-2 focus-within:ring-[#1677FF]/15 transition-all overflow-hidden pl-2.5 sm:pl-3.5 pr-1 sm:pr-1.5 py-1 sm:py-1.5">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0 ml-0.5 sm:ml-1" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search subjects, topics or PDF notes..."
              className="w-full py-1.5 sm:py-2.5 pl-2 sm:pl-3 pr-2 sm:pr-3 text-xs sm:text-sm text-[#0F172A] placeholder-slate-400 bg-transparent outline-none font-medium min-w-0"
            />
            <button
              type="submit"
              aria-label="Submit search"
              className="px-3.5 xs:px-4 sm:px-6 py-2 sm:py-3 bg-[#0066FF] hover:bg-[#0052CC] text-white rounded-lg sm:rounded-xl transition-colors flex items-center justify-center shrink-0 cursor-pointer shadow-xs"
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </form>

        {/* Mobile-only illustration placed below greeting and search bar, centered within banner */}
        <div className="flex md:hidden w-full justify-center items-center mt-4 sm:mt-6 pointer-events-none select-none">
          <div className="w-full max-w-[220px] xs:max-w-[260px] sm:max-w-[320px] aspect-[540/360]">
            <DashboardHeroIllustration className="w-full h-full drop-shadow-sm" />
          </div>
        </div>
      </div>
    </section>
  );
};

import React from 'react';
import { Flame, Zap, Layers, ChevronRight } from 'lucide-react';

interface QuickAccessRowProps {
  onViewPopularSubjects: () => void;
  onViewLatestPdfs: () => void;
  onViewStudyCollections: () => void;
}

export const QuickAccessRow: React.FC<QuickAccessRowProps> = ({
  onViewPopularSubjects,
  onViewLatestPdfs,
  onViewStudyCollections,
}) => {
  return (
    <div className="bg-white/95 rounded-2xl sm:rounded-3xl border border-[#E2E8F0] shadow-xs px-3 sm:px-8 py-2.5 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1 sm:gap-4 mb-8 sm:mb-10">
      {/* 1. Popular Subjects */}
      <button
        type="button"
        onClick={onViewPopularSubjects}
        className="w-full sm:w-auto flex-1 flex items-center justify-between sm:justify-start gap-3 group cursor-pointer hover:opacity-90 transition-opacity px-2 sm:px-4 py-2 sm:py-1 rounded-xl hover:bg-slate-50/80 sm:hover:bg-transparent"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FFEBEA] text-[#FF4D4F] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <Flame className="w-4 h-4 sm:w-5 sm:h-5 fill-[#FF4D4F]" />
          </div>
          <span className="font-bold text-[#0F172A] text-xs xs:text-sm sm:text-[15px] tracking-tight">
            Popular Subjects
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-[#1677FF] group-hover:translate-x-1 transition-transform ml-auto" />
      </button>

      {/* Subtle Mobile Divider */}
      <div className="h-px w-full bg-slate-100 sm:hidden" />

      {/* Subtle Desktop Divider */}
      <div className="hidden sm:block h-8 w-px bg-slate-200/90" />

      {/* 2. Latest PDFs */}
      <button
        type="button"
        onClick={onViewLatestPdfs}
        className="w-full sm:w-auto flex-1 flex items-center justify-between sm:justify-start gap-3 group cursor-pointer hover:opacity-90 transition-opacity px-2 sm:px-4 py-2 sm:py-1 rounded-xl hover:bg-slate-50/80 sm:hover:bg-transparent"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FFF4E5] text-[#FA8C16] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-[#FA8C16]" />
          </div>
          <span className="font-bold text-[#0F172A] text-xs xs:text-sm sm:text-[15px] tracking-tight">
            Latest PDFs
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-[#1677FF] group-hover:translate-x-1 transition-transform ml-auto" />
      </button>

      {/* Subtle Mobile Divider */}
      <div className="h-px w-full bg-slate-100 sm:hidden" />

      {/* Subtle Desktop Divider */}
      <div className="hidden sm:block h-8 w-px bg-slate-200/90" />

      {/* 3. Study Collections */}
      <button
        type="button"
        onClick={onViewStudyCollections}
        className="w-full sm:w-auto flex-1 flex items-center justify-between sm:justify-start gap-3 group cursor-pointer hover:opacity-90 transition-opacity px-2 sm:px-4 py-2 sm:py-1 rounded-xl hover:bg-slate-50/80 sm:hover:bg-transparent"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F4EAFF] text-[#722ED1] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5 fill-[#722ED1]" />
          </div>
          <span className="font-bold text-[#0F172A] text-xs xs:text-sm sm:text-[15px] tracking-tight">
            Study Collections
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-[#1677FF] group-hover:translate-x-1 transition-transform ml-auto" />
      </button>
    </div>
  );
};

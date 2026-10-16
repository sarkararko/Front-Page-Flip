import React from 'react';
import { ArrowRight, BookMarked } from 'lucide-react';

interface LearningCollectionBannerProps {
  onGoToLibrary: () => void;
}

export const LearningCollectionBanner: React.FC<LearningCollectionBannerProps> = ({ onGoToLibrary }) => {
  return (
    <div className="mt-12 mb-6 bg-gradient-to-r from-[#E6FFFA] to-[#EDFDFD] border border-[#B2F5EA] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
      <div className="flex items-center gap-4 text-left">
        {/* Teal Document Icon Circle */}
        <div className="w-12 h-12 rounded-xl bg-white border border-[#99F6E4] text-[#0DB7A5] flex items-center justify-center shrink-0 shadow-xs">
          <BookMarked className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#102A56]">
            Build Your Learning Collection
          </h3>
          <p className="text-xs sm:text-sm text-[#475569] mt-0.5">
            Save your favorite PDFs, access them anytime, and keep your studies organized.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onGoToLibrary}
        className="w-full sm:w-auto px-5 py-2.5 bg-[#102A56] hover:bg-[#193B73] text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm shrink-0"
      >
        <span>Go to My Library</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

import React from 'react';
import {
  Sigma,
  Atom,
  FlaskConical,
  Laptop,
  Zap,
  Cog,
  Building2,
  BookOpen,
  ArrowRight,
  Star,
  Folder,
} from 'lucide-react';
import { Subject } from '../../types';

interface SubjectCardProps {
  subject: Subject;
  isFavorite?: boolean;
  onToggleFavorite?: (subjectId: string, e: React.MouseEvent) => void;
  onClick?: (subject: Subject) => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  isFavorite = false,
  onToggleFavorite,
  onClick,
}) => {
  // Map icon names to Lucide icons
  const renderIcon = () => {
    const iconClass = 'w-6 h-6';
    switch (subject.icon) {
      case 'sigma':
        return <Sigma className={iconClass} style={{ color: subject.iconColor || '#1677FF' }} />;
      case 'atom':
        return <Atom className={iconClass} style={{ color: subject.iconColor || '#4F46E5' }} />;
      case 'flask':
        return <FlaskConical className={iconClass} style={{ color: subject.iconColor || '#0DB7A5' }} />;
      case 'laptop':
        return <Laptop className={iconClass} style={{ color: subject.iconColor || '#2563EB' }} />;
      case 'zap':
        return <Zap className={iconClass} style={{ color: subject.iconColor || '#D97706' }} />;
      case 'cog':
        return <Cog className={iconClass} style={{ color: subject.iconColor || '#059669' }} />;
      case 'building':
        return <Building2 className={iconClass} style={{ color: subject.iconColor || '#0284C7' }} />;
      case 'book':
        return <BookOpen className={iconClass} style={{ color: subject.iconColor || '#DB2777' }} />;
      default:
        return <Folder className={iconClass} style={{ color: subject.iconColor || '#1677FF' }} />;
    }
  };

  const cardColor = subject.iconColor || '#1677FF';

  return (
    <div
      onClick={() => onClick && onClick(subject)}
      className="group relative bg-white border border-[#E2E8F0] hover:border-transparent rounded-2xl p-5 hover:shadow-[0_12px_28px_rgba(22,119,255,0.12)] transition-all duration-250 cursor-pointer flex flex-col justify-between overflow-hidden"
    >
      {/* Subtle top accent gradient bar on hover */}
      <div
        className="absolute top-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{
          background: `linear-gradient(90deg, ${cardColor}, #0DB7A5)`,
        }}
      />

      <div>
        {/* Top Row: Icon Container and Favorite Button */}
        <div className="flex items-center justify-between mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-2xs"
            style={{
              backgroundColor: subject.iconBgColor || '#EFF6FF',
            }}
          >
            {renderIcon()}
          </div>

          {onToggleFavorite && (
            <button
              type="button"
              onClick={(e) => onToggleFavorite(subject.id, e)}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className="p-1.5 rounded-lg text-slate-300 hover:text-amber-500 hover:bg-slate-50 transition-colors"
            >
              <Star
                className={`w-4 h-4 transition-colors ${
                  isFavorite ? 'fill-amber-400 text-amber-500' : 'text-slate-300 hover:text-slate-400'
                }`}
              />
            </button>
          )}
        </div>

        {/* Center Details */}
        <div>
          <h3 className="font-bold text-[#102A56] text-base group-hover:text-[#1677FF] transition-colors line-clamp-1">
            {subject.name}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold"
              style={{
                backgroundColor: subject.iconBgColor || '#EFF6FF',
                color: cardColor,
              }}
            >
              {subject.pdfCount} {subject.pdfCount === 1 ? 'PDF Note' : 'PDF Notes'}
            </span>
          </div>
          {subject.description && (
            <p className="text-xs text-[#64748B] mt-2 line-clamp-2 leading-relaxed font-normal">
              {subject.description}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Arrow Indicator */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-[#1677FF] transition-colors">
        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px]">Explore Notes</span>
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </div>
    </div>
  );
};

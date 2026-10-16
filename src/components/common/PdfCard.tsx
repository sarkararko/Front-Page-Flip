import React from 'react';
import { Bookmark, ArrowRight, FileText } from 'lucide-react';
import { PdfResource } from '../../types';

interface PdfCardProps {
  pdf: PdfResource;
  isReadLater?: boolean;
  onToggleReadLater?: (pdfId: string, e: React.MouseEvent) => void;
  onViewPdf: (pdf: PdfResource) => void;
}

export const PdfCard: React.FC<PdfCardProps> = ({
  pdf,
  isReadLater = false,
  onToggleReadLater,
  onViewPdf,
}) => {
  // Render authentic styled thumbnail according to thumbnailStyle
  const renderThumbnail = () => {
    switch (pdf.thumbnailStyle) {
      case 'dark-notebook':
        return (
          <div className="w-full h-32 rounded-lg bg-gradient-to-br from-[#1E293B] to-[#0F172A] p-3 text-white flex flex-col justify-between relative overflow-hidden border border-slate-700/50">
            <div className="space-y-1 opacity-80">
              <div className="h-1.5 w-16 bg-blue-400/80 rounded" />
              <div className="h-1 w-24 bg-slate-500 rounded" />
              <div className="h-1 w-20 bg-slate-600 rounded" />
            </div>
            <div className="text-[10px] font-mono tracking-wider text-slate-400">
              KERNEL • SCHEDULING • VIRTUAL MEMORY
            </div>
            <div className="absolute top-2 right-2 flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400/60" />
              <div className="w-1.5 h-1.5 rounded-full bg-teal-400/60" />
            </div>
          </div>
        );

      case 'lecture-sheet':
        return (
          <div className="w-full h-32 rounded-lg bg-[#FFFDF5] border border-amber-200/70 p-3 flex flex-col justify-between relative overflow-hidden shadow-inner">
            <div className="space-y-1.5 opacity-90">
              <div className="h-2 w-20 bg-amber-800/60 rounded" />
              <div className="h-1 w-28 bg-slate-300 rounded" />
              <div className="text-[9px] font-serif text-slate-600 italic">
                ∫ f(x) dx = F(x) + C • Riemann Sums
              </div>
            </div>
            <div className="h-1.5 w-full bg-amber-100 rounded" />
            <div className="absolute top-0 right-0 w-8 h-8 bg-amber-100/60 rounded-bl-xl border-l border-b border-amber-200" />
          </div>
        );

      case 'green-board':
        return (
          <div className="w-full h-32 rounded-lg bg-gradient-to-br from-[#064E3B] to-[#022C22] p-3 text-emerald-100 flex flex-col justify-between relative overflow-hidden border border-emerald-800">
            <div className="space-y-1">
              <div className="text-[10px] font-mono text-emerald-300 font-semibold">
                SN1 / SN2 • MECHANISMS
              </div>
              <div className="text-[9px] text-emerald-200/70 font-mono">
                R-X + Nu⁻ → R-Nu + X⁻
              </div>
            </div>
            <div className="h-1 w-20 bg-emerald-400/60 rounded" />
          </div>
        );

      case 'circuit-dark':
        return (
          <div className="w-full h-32 rounded-lg bg-gradient-to-br from-[#091E3A] to-[#040C1A] p-3 text-cyan-200 flex flex-col justify-between relative overflow-hidden border border-blue-900/60">
            <div className="space-y-1">
              <div className="text-[10px] font-mono text-cyan-300 font-semibold tracking-wider">
                AES-256 • RSA • TLS 1.3
              </div>
              <div className="text-[8px] text-slate-400 font-mono">
                KEY EXCHANGE &amp; FIREWALL POLICIES
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <div className="h-1 w-12 bg-cyan-400/70 rounded" />
              <div className="h-1 w-6 bg-blue-500/70 rounded" />
            </div>
          </div>
        );

      default:
        return (
          <div className="w-full h-32 rounded-lg bg-slate-100 p-3 flex flex-col justify-between border border-slate-200">
            <FileText className="w-8 h-8 text-blue-500/70" />
            <div className="text-[10px] text-slate-500 font-medium">{pdf.subjectName}</div>
          </div>
        );
    }
  };

  return (
    <div className="group bg-white border border-[#E2E8F0] rounded-xl p-4 flex flex-col justify-between hover:border-[#1677FF]/40 hover:shadow-md transition-all duration-200">
      <div>
        {/* Top Header: Thumbnail with PDF badge + Read Later Toggle */}
        <div className="relative mb-3.5">
          {renderThumbnail()}

          {/* Red PDF Badge Tag on bottom-left of thumbnail */}
          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-[#EF4444] text-white text-[10px] font-black rounded shadow-sm flex items-center gap-1 select-none">
            <span>PDF</span>
          </div>

          {/* Read Later Bookmark Button on top-right */}
          {onToggleReadLater && (
            <button
              type="button"
              onClick={(e) => onToggleReadLater(pdf.id, e)}
              title={isReadLater ? 'Remove from Read Later' : 'Save to Read Later'}
              className="absolute top-2 right-2 p-1.5 rounded-md bg-white/90 backdrop-blur-xs text-slate-500 hover:text-[#1677FF] hover:bg-white shadow-xs transition-colors"
            >
              <Bookmark
                className={`w-4 h-4 transition-colors ${
                  isReadLater ? 'fill-[#1677FF] text-[#1677FF]' : 'text-slate-400'
                }`}
              />
            </button>
          )}
        </div>

        {/* Title */}
        <h4 className="font-bold text-[#102A56] text-sm leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-[#1677FF] transition-colors">
          {pdf.title}
        </h4>

        {/* Subject and Semester metadata */}
        <p className="text-xs text-[#64748B] mt-1.5 font-medium">
          {pdf.subjectName} {pdf.semester && `• ${pdf.semester}`}
        </p>

        {/* Size and Page count */}
        <p className="text-xs text-[#94A3B8] mt-1 font-normal">
          {pdf.fileSize} • {pdf.pageCount} pages
        </p>
      </div>

      {/* Action Button: View PDF -> */}
      <div className="mt-4 pt-2">
        <button
          type="button"
          onClick={() => onViewPdf(pdf)}
          className="w-full py-2 px-3 bg-[#EFF6FF] hover:bg-[#1677FF] text-[#1677FF] hover:text-white border border-[#DBEAFE] hover:border-[#1677FF] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-200"
        >
          <span>View PDF</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
};

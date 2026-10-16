import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Bookmark,
  Download,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  FileText,
  Share2,
  Check,
  Printer,
  Sparkles,
} from 'lucide-react';
import { PdfResource } from '../../types';
import { ApiService } from '../../services/api';

interface PdfReaderProps {
  pdf: PdfResource;
  userId: string;
  onBack: () => void;
  isReadLater: boolean;
  onToggleReadLater: (pdfId: string) => void;
}

export const PdfReader: React.FC<PdfReaderProps> = ({
  pdf,
  userId,
  onBack,
  isReadLater,
  onToggleReadLater,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const totalPages = pdf.pageCount || (pdf.contentPages ? pdf.contentPages.length * 12 : 24);

  // Restore previous reading position if available
  useEffect(() => {
    const history = ApiService.getRecentlyViewed(userId);
    const item = history.find((h) => h.pdfId === pdf.id);
    if (item && item.lastPageRead > 0 && item.lastPageRead <= totalPages) {
      setCurrentPage(item.lastPageRead);
    }
  }, [pdf.id, userId]);

  // Record reading position on page change
  useEffect(() => {
    ApiService.recordRecentlyViewed(userId, pdf.id, currentPage, totalPages);
  }, [currentPage, pdf.id, userId, totalPages]);

  // Handle Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Handle Permitted Download
  const handleDownload = () => {
    if (!pdf.downloadAllowed) return;

    // Create a structured educational PDF/Text document blob
    const content = `=====================================================
FRONT-PAGE FLIP • EDUCATIONAL PDF REPOSITORY
Title: ${pdf.title}
Subject: ${pdf.subjectName}
Topic: ${pdf.topic}
Semester: ${pdf.semester || 'N/A'}
Page Count: ${pdf.pageCount}
Downloaded: ${new Date().toLocaleDateString()}
=====================================================

STUDY NOTES OVERVIEW:
${pdf.description}

PAGES & CHAPTER CONTENT:
${(pdf.contentPages || [])
  .map(
    (p) => `
[PAGE ${p.pageNumber}: ${p.title}]
Section: ${p.section}
Summary:
${p.summary}

Key Concepts:
${p.keyPoints.map((k) => `  • ${k}`).join('\n')}

${p.equationsOrCode ? `Formulas & Code:\n${p.equationsOrCode.join('\n')}` : ''}
${
  p.problemExample
    ? `\nWorked Problem:\nQ: ${p.problemExample.question}\nAns: ${p.problemExample.solution}`
    : ''
}
-----------------------------------------------------`
  )
  .join('\n\n')}

=====================================================
Licensed for Academic and Study Purpose via Front-Page Flip.
=====================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pdf.title.replace(/[^a-zA-Z0-9]/g, '_')}_Notes.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Get active page content data
  const pageData =
    pdf.contentPages && pdf.contentPages.length > 0
      ? pdf.contentPages[(currentPage - 1) % pdf.contentPages.length]
      : null;

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col text-slate-100">
      {/* ================= TOP TOOLBAR ================= */}
      <header className="sticky top-0 z-50 bg-[#1E293B] border-b border-slate-700/80 px-4 py-2.5 flex items-center justify-between shadow-md">
        {/* Left: Back button & Document Title */}
        <div className="flex items-center gap-3 max-w-[50%]">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="h-5 w-px bg-slate-700 mx-1 hidden sm:block" />

          <div className="truncate">
            <h1 className="text-sm font-bold text-white truncate flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-[#EF4444] text-[10px] font-black rounded shrink-0">
                PDF
              </span>
              <span className="truncate">{pdf.title}</span>
            </h1>
            <p className="text-[11px] text-slate-400 truncate hidden md:block">
              {pdf.subjectName} • {pdf.topic}
            </p>
          </div>
        </div>

        {/* Center: Page Controls */}
        <div className="flex items-center gap-2 bg-[#0F172A] px-3 py-1 rounded-lg border border-slate-700 text-xs">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 font-mono font-medium">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val >= 1 && val <= totalPages) setCurrentPage(val);
              }}
              className="w-10 bg-slate-800 text-center rounded text-white py-0.5 outline-hidden"
            />
            <span className="text-slate-400">/ {totalPages}</span>
          </div>

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Actions (Zoom, Read Later, Download, Fullscreen) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom controls */}
          <div className="hidden lg:flex items-center gap-1 bg-[#0F172A] px-2 py-1 rounded-lg border border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(60, z - 15))}
              className="p-1 text-slate-300 hover:text-white"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] w-9 text-center text-slate-300">
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(180, z + 15))}
              className="p-1 text-slate-300 hover:text-white"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Bookmark / Read Later */}
          <button
            type="button"
            onClick={() => onToggleReadLater(pdf.id)}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isReadLater
                ? 'bg-[#1677FF] text-white shadow-sm'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            title={isReadLater ? 'Saved in Read Later' : 'Save to Read Later'}
          >
            <Bookmark className={`w-4 h-4 ${isReadLater ? 'fill-white' : ''}`} />
            <span className="hidden sm:inline">
              {isReadLater ? 'Saved' : 'Read Later'}
            </span>
          </button>

          {/* Download Button */}
          {pdf.downloadAllowed && (
            <button
              type="button"
              onClick={handleDownload}
              className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Download PDF study notes"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span className="hidden sm:inline">Downloaded</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span>
                </>
              )}
            </button>
          )}

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="p-2 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg text-xs transition-colors hidden md:block"
            title="Share Document Link"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg text-xs transition-colors"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ================= DOCUMENT VIEWER WORKSPACE ================= */}
      <main className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start bg-[#0B1120]">
        <div
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          className="transition-transform duration-150"
        >
          {/* Authentic High-Fidelity Academic PDF Page Paper Sheet */}
          <div className="w-[780px] min-h-[1050px] bg-white text-[#152238] rounded-sm shadow-2xl p-12 sm:p-16 flex flex-col justify-between border border-slate-300/80 relative">
            {/* Academic Paper Top Margin / Running Header */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b-2 border-[#102A56] text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[#102A56] uppercase tracking-wider">
                    {pdf.subjectName}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[#64748B] font-medium">{pdf.course || 'Undergraduate Notes'}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Page {currentPage} of {totalPages}
                </div>
              </div>

              {/* Lecture Title & Topic */}
              <div className="mt-8 mb-6">
                <div className="inline-block px-2.5 py-1 bg-[#EFF6FF] text-[#1677FF] rounded text-[11px] font-bold uppercase tracking-wider mb-2">
                  {pdf.topic}
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102A56] tracking-tight">
                  {pageData ? pageData.title : `${pdf.title} — Page ${currentPage}`}
                </h2>
                <p className="text-sm font-semibold text-[#0DB7A5] mt-1">
                  {pageData ? pageData.section : `Section ${(currentPage % 5) + 1}.0: Core Theorems and Proofs`}
                </p>
              </div>

              {/* Page Body: Academic Notes Overview */}
              <div className="space-y-6 text-sm leading-relaxed text-slate-700">
                <div className="p-4 bg-slate-50 border-l-4 border-[#1677FF] rounded-r-lg">
                  <p className="text-slate-800 font-medium">
                    {pageData
                      ? pageData.summary
                      : `Detailed exposition of the fundamental analytical framework for ${pdf.topic}. Understanding these principles is critical for solving practical engineering and theoretical challenges.`}
                  </p>
                </div>

                {/* Key Concepts / Bullet points */}
                <div>
                  <h3 className="font-bold text-[#102A56] text-base mb-3 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#1677FF]" />
                    <span>Essential Concepts &amp; Examination Points</span>
                  </h3>
                  <ul className="space-y-2.5 pl-2">
                    {(pageData?.keyPoints || [
                      'Formulate governing boundary conditions and initial state constraints.',
                      'Apply conservation theorems to decouple dependent variables.',
                      'Evaluate convergence criteria under normalized scaling.',
                      'Verify asymptotic behavior against established reference models.',
                    ]).map((pt, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm">
                        <span className="w-5 h-5 rounded-full bg-blue-50 text-[#1677FF] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-slate-700 leading-snug">{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Formulas or Code snippet */}
                <div className="mt-6">
                  <h3 className="font-bold text-[#102A56] text-sm mb-2 uppercase tracking-wide text-xs">
                    Mathematical Formulation &amp; Implementation:
                  </h3>
                  <div className="p-4 bg-[#1E293B] text-cyan-200 font-mono text-xs sm:text-sm rounded-lg overflow-x-auto shadow-inner border border-slate-700">
                    <pre className="whitespace-pre-wrap">
                      {pageData?.equationsOrCode
                        ? pageData.equationsOrCode.join('\n\n')
                        : `// Standard Algorithm Definition\nfunction computeEquilibrium(inputVector) {\n  let residual = 0.0;\n  for (let i = 0; i < inputVector.length; i++) {\n    residual += Math.pow(inputVector[i], 2);\n  }\n  return Math.sqrt(residual);\n}`}
                    </pre>
                  </div>
                </div>

                {/* Worked Examination Problem */}
                <div className="mt-6 p-4 rounded-xl border border-teal-200 bg-[#E6FFFA]/40">
                  <h4 className="font-bold text-[#102A56] text-xs uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="w-4 h-4 text-[#0DB7A5]" />
                    <span>Solved Problem Analysis</span>
                  </h4>
                  <p className="text-xs font-semibold text-slate-800">
                    {pageData?.problemExample?.question ||
                      `Problem ${(currentPage % 7) + 1}: Deduce the equilibrium state when load parameters reach critical threshold.`}
                  </p>
                  <div className="mt-2 text-xs text-slate-600 bg-white p-3 rounded-lg border border-teal-100">
                    <span className="font-bold text-[#0DB7A5]">Solution: </span>
                    {pageData?.problemExample?.solution ||
                      'Substitute boundary constraints into the characteristic equation. Setting determinant equal to zero yields the eigenvalues λ₁ and λ₂.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Running Footer */}
            <div className="mt-12 pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-[#64748B]">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[#1677FF]" />
                <span className="font-semibold text-[#102A56]">Front-Page Flip Educational Library</span>
              </div>
              <div className="text-[11px] font-mono">
                Notes • Solutions • Learn — Semester {pdf.semester || 'University Edition'}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ================= BOTTOM QUICK BAR ================= */}
      <footer className="bg-[#1E293B] border-t border-slate-700/80 px-4 py-2 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span>File Size: {pdf.fileSize}</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Uploaded: {pdf.uploadDate}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1 bg-[#1677FF] hover:bg-[#0E63DC] text-white rounded disabled:opacity-40 font-semibold"
          >
            Next Page
          </button>
        </div>
      </footer>
    </div>
  );
};

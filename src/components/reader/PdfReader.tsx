import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
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
  Crown,
  Lock,
  Layers,
  RotateCw,
  AlertCircle,
  Loader2,
  Sidebar,
} from 'lucide-react';
import { PdfResource, User } from '../../types';
import { ApiService } from '../../services/api';
import { StorageService } from '../../services/storage';
import { PdfFileStore } from '../../services/pdfFileStore';

// Configure Mozilla PDF.js worker
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  }
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

interface PdfReaderProps {
  pdf: PdfResource;
  userId: string;
  currentUser?: User | null;
  onBack: () => void;
  isReadLater: boolean;
  onToggleReadLater: (pdfId: string) => void;
  onGoToGolden?: (pdfTitle?: string) => void;
}

export const PdfReader: React.FC<PdfReaderProps> = ({
  pdf,
  userId,
  currentUser,
  onBack,
  isReadLater,
  onToggleReadLater,
  onGoToGolden,
}) => {
  // PDF Document State
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(pdf.pageCount || 1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomScale, setZoomScale] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);

  // UI & Loading State
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<string>('Connecting to PDF repository...');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'single' | 'scroll'>('single');

  // Can download if user has ADMIN role or verified GOLDEN status
  const canDownload = currentUser?.role === 'admin' || currentUser?.isGolden === true;

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentRenderTask = useRef<pdfjsLib.RenderTask | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Restore previous reading position
  useEffect(() => {
    const history = ApiService.getRecentlyViewed(userId);
    const item = history.find((h) => h.pdfId === pdf.id);
    if (item && item.lastPageRead > 0) {
      setCurrentPage(item.lastPageRead);
    }
  }, [pdf.id, userId]);

  // Record reading position
  useEffect(() => {
    if (numPages > 0) {
      ApiService.recordRecentlyViewed(userId, pdf.id, currentPage, numPages);
    }
  }, [currentPage, numPages, pdf.id, userId]);

  // Load the original PDF binary via PDF.js
  useEffect(() => {
    let isCancelled = false;

    const loadPdfDocument = async () => {
      setLoading(true);
      setRenderError(null);
      setLoadingProgress('Retrieving original PDF document...');

      try {
        let pdfSource: any = null;

        // 1. Check if raw file data exists in memory
        if (pdf.fileData && pdf.fileData.startsWith('data:')) {
          setLoadingProgress('Reading document data...');
          pdfSource = { data: dataUrlToUint8Array(pdf.fileData) };
        } else {
          // 2. Check IndexedDB offline cache
          const cached = await PdfFileStore.getPdfFile(pdf.id);
          if (cached && cached.startsWith('data:')) {
            setLoadingProgress('Loading from offline storage...');
            pdfSource = { data: dataUrlToUint8Array(cached) };
          }
        }

        // 3. Fetch from original storage URL or backend streaming endpoint
        if (!pdfSource) {
          const viewUrl = pdf.viewUrl || ApiService.getPdfViewUrl(pdf.id);
          const fallbackUrl = pdf.cloudinarySecureUrl || pdf.fileUrl || viewUrl;
          const token = StorageService.getSessionToken();
          const headers: Record<string, string> = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;

          setLoadingProgress('Streaming original PDF from storage...');

          let buffer: ArrayBuffer | null = null;
          try {
            const resp = await fetch(viewUrl, { headers });
            if (resp.ok) {
              buffer = await resp.arrayBuffer();
            }
          } catch {
            // Fallback to direct URL if backend proxy was unavailable
          }

          if (!buffer && fallbackUrl && fallbackUrl !== viewUrl) {
            try {
              const resp2 = await fetch(fallbackUrl);
              if (resp2.ok) {
                buffer = await resp2.arrayBuffer();
              }
            } catch {
              // Both failed
            }
          }

          if (buffer && buffer.byteLength > 0) {
            pdfSource = { data: new Uint8Array(buffer) };
          } else {
            // Direct URL loading via PDF.js
            pdfSource = {
              url: fallbackUrl || viewUrl,
              withCredentials: false,
            };
          }
        }

        if (isCancelled) return;

        setLoadingProgress('Parsing original pages & typography...');
        const loadingTask = pdfjsLib.getDocument(pdfSource);

        loadingTask.onProgress = (progressData: { loaded: number; total: number }) => {
          if (progressData.total > 0) {
            const pct = Math.round((progressData.loaded / progressData.total) * 100);
            setLoadingProgress(`Loaded ${pct}% of original PDF...`);
          }
        };

        const doc = await loadingTask.promise;
        if (isCancelled) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setLoading(false);
      } catch (err: any) {
        if (isCancelled) return;
        console.error('Failed to load authentic PDF binary:', err);
        setRenderError(
          err?.message || 'Could not load original PDF. Please verify network access.'
        );
        setLoading(false);
      }
    };

    loadPdfDocument();

    return () => {
      isCancelled = true;
    };
  }, [pdf.id, pdf.fileData, pdf.fileUrl, pdf.viewUrl, pdf.cloudinarySecureUrl]);

  // Render active page onto canvas with high DPI sharpness
  const renderCurrentPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    try {
      // Cancel any ongoing render task to avoid collision
      if (currentRenderTask.current) {
        currentRenderTask.current.cancel();
        currentRenderTask.current = null;
      }

      const page = await pdfDoc.getPage(currentPage);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const viewport = page.getViewport({ scale: zoomScale, rotation });
      const pixelRatio = window.devicePixelRatio || 1;

      // High-DPI Canvas scaling
      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) return;

      ctx.save();
      ctx.scale(pixelRatio, pixelRatio);

      // Clean background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, viewport.width, viewport.height);

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      const task = page.render(renderContext);
      currentRenderTask.current = task;

      await task.promise;
      ctx.restore();
      currentRenderTask.current = null;
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.warn('Canvas render interrupted:', err);
      }
    }
  }, [pdfDoc, currentPage, zoomScale, rotation]);

  useEffect(() => {
    if (pdfDoc && viewMode === 'single') {
      renderCurrentPage();
    }
  }, [pdfDoc, currentPage, zoomScale, rotation, viewMode, renderCurrentPage]);

  // Keyboard navigation (ArrowLeft = prev, ArrowRight = next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowLeft') {
        setCurrentPage((p) => Math.max(1, p - 1));
      } else if (e.key === 'ArrowRight') {
        setCurrentPage((p) => Math.min(numPages, p + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [numPages]);

  // Handle Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Handle Download Action
  const handleDownloadClick = async () => {
    if (!canDownload) {
      // Non-Golden student: redirect to Golden page per requirements
      if (onGoToGolden) {
        onGoToGolden(pdf.title);
      }
      return;
    }

    try {
      setDownloadError(null);
      await ApiService.downloadPdfFile(pdf.id, pdf.fileName || `${pdf.title}.pdf`);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err: any) {
      setDownloadError(err?.message || 'Could not download PDF. Please try again.');
      setTimeout(() => setDownloadError(null), 5000);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex flex-col text-slate-100 select-none">
      {/* ================= TOP TOOLBAR ================= */}
      <header className="sticky top-0 z-50 bg-[#141C2E] border-b border-slate-700/80 px-4 py-2.5 flex items-center justify-between shadow-md">
        {/* Left: Back button & Document Title */}
        <div className="flex items-center gap-3 max-w-[45%]">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="h-5 w-px bg-slate-700 mx-1 hidden sm:block" />

          {/* Thumbnails toggle */}
          <button
            type="button"
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
              showThumbnails
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-700/80 hover:text-white'
            }`}
            title="Toggle Page Navigation Drawer"
          >
            <Sidebar className="w-4 h-4" />
            <span className="hidden md:inline">Pages</span>
          </button>

          <div className="truncate">
            <h1 className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-[#EF4444] text-[10px] font-black rounded shrink-0 shadow-xs">
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
        <div className="flex items-center gap-2 bg-[#0A0E1A] px-3 py-1 rounded-lg border border-slate-700 text-xs">
          <button
            type="button"
            disabled={currentPage <= 1 || loading}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 cursor-pointer"
            title="Previous page (Left arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1 font-mono font-medium">
            <input
              type="number"
              min={1}
              max={numPages}
              value={currentPage}
              disabled={loading}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val >= 1 && val <= numPages) setCurrentPage(val);
              }}
              className="w-10 bg-slate-800 text-center rounded text-white py-0.5 outline-hidden border border-slate-700 focus:border-blue-500"
            />
            <span className="text-slate-400">/ {numPages}</span>
          </div>

          <button
            type="button"
            disabled={currentPage >= numPages || loading}
            onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
            className="p-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 cursor-pointer"
            title="Next page (Right arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Actions (Zoom, Read Later, Download, Fullscreen) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom controls */}
          <div className="hidden lg:flex items-center gap-1 bg-[#0A0E1A] px-2 py-1 rounded-lg border border-slate-700 text-xs">
            <button
              type="button"
              disabled={loading || zoomScale <= 0.6}
              onClick={() => setZoomScale((z) => Math.max(0.6, parseFloat((z - 0.2).toFixed(1))))}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] w-12 text-center text-slate-300">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              type="button"
              disabled={loading || zoomScale >= 2.5}
              onClick={() => setZoomScale((z) => Math.min(2.5, parseFloat((z + 0.2).toFixed(1))))}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="p-1 text-slate-300 hover:text-white ml-1 border-l border-slate-700 pl-1.5 cursor-pointer"
              title="Rotate 90°"
            >
              <RotateCw className="w-3 h-3" />
            </button>
          </div>

          {/* Bookmark / Read Later */}
          <button
            type="button"
            onClick={() => onToggleReadLater(pdf.id)}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
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

          {/* ======================================================== */}
          {/* DOWNLOAD CONTROL (Golden vs Non-Golden Enforcement)     */}
          {/* ======================================================== */}
          {canDownload ? (
            // Golden Student or Administrator: Download Allowed
            <button
              type="button"
              onClick={handleDownloadClick}
              className="p-2 px-3 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer"
              title="Download original PDF file"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-950" />
                  <span className="hidden sm:inline">Downloaded</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-slate-950" />
                  <span className="hidden sm:inline">Download PDF</span>
                </>
              )}
            </button>
          ) : (
            // Non-Golden Student: Gold-Styled Locked Control
            <button
              type="button"
              onClick={handleDownloadClick}
              className="p-2 px-3 bg-gradient-to-r from-amber-500/20 via-yellow-500/25 to-amber-500/20 hover:from-amber-500 hover:via-yellow-400 hover:to-amber-500 border border-amber-400/80 hover:border-amber-300 text-amber-300 hover:text-slate-950 font-extrabold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10 hover:shadow-amber-500/30 cursor-pointer group"
              title="Downloading study materials requires Lifetime Golden membership"
            >
              <Crown className="w-4 h-4 text-amber-400 group-hover:text-slate-950 fill-amber-400 group-hover:fill-slate-950 transition-colors" />
              <span className="tracking-wide">Download — Golden</span>
            </button>
          )}

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            className="p-2 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg text-xs transition-colors hidden md:block cursor-pointer"
            title="Share Document Link"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg text-xs transition-colors cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Download Error Banner */}
      {downloadError && (
        <div className="bg-red-600/90 text-white text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{downloadError}</span>
        </div>
      )}

      {/* ================= VIEWER BODY ================= */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Thumbnails Sidebar */}
        {showThumbnails && (
          <aside className="w-48 bg-[#0F172A] border-r border-slate-700/80 p-3 overflow-y-auto flex flex-col gap-3 shrink-0">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between pb-2 border-b border-slate-700">
              <span>Pages ({numPages})</span>
              <button
                type="button"
                onClick={() => setShowThumbnails(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {Array.from({ length: numPages }).map((_, idx) => {
                const pageNum = idx + 1;
                const isCurrent = pageNum === currentPage;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-full p-2.5 rounded-lg text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    <span>Page {pageNum}</span>
                    {isCurrent && <span className="w-2 h-2 rounded-full bg-white" />}
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* Main Document Workspace */}
        <main
          ref={containerRef}
          className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start bg-[#060913]"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
              <h3 className="text-base font-bold text-white">Loading Original PDF...</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">{loadingProgress}</p>
            </div>
          ) : renderError ? (
            <div className="max-w-md mx-auto my-20 p-6 rounded-2xl bg-slate-900 border border-red-500/40 text-center">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Could Not Display PDF</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{renderError}</p>
              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Retry Loading
                </button>
                <button
                  type="button"
                  onClick={onBack}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Return
                </button>
              </div>
            </div>
          ) : (
            /* Authentic High-Fidelity PDF Page Sheet Canvas */
            <div className="relative flex flex-col items-center pb-12 transition-transform duration-100">
              <div className="bg-white rounded-sm shadow-2xl shadow-black/80 border border-slate-300 overflow-hidden">
                <canvas ref={canvasRef} className="block" />
              </div>

              {/* Page Indicator floating badge */}
              <div className="mt-4 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700 text-[11px] font-mono text-slate-300 shadow-md">
                Page {currentPage} of {numPages} • {Math.round(zoomScale * 100)}%
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ================= BOTTOM QUICK BAR ================= */}
      <footer className="bg-[#141C2E] border-t border-slate-700/80 px-4 py-2 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span className="font-medium text-slate-300">{pdf.fileName || 'Original Document'}</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Size: {pdf.fileSize}</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Total Pages: {numPages}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1 || loading}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded disabled:opacity-40 cursor-pointer"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={currentPage >= numPages || loading}
            onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
            className="px-3 py-1 bg-[#1677FF] hover:bg-[#0E63DC] text-white rounded disabled:opacity-40 font-semibold cursor-pointer"
          >
            Next Page
          </button>
        </div>
      </footer>
    </div>
  );
};

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Share2,
  Check,
  Crown,
  Lock,
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
    // Prefer public worker served locally to avoid CDN blocking
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
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

interface PdfPageItemProps {
  pageNumber: number;
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  zoomScale: number;
  rotation: number;
  defaultAspectRatio: number;
  containerWidth: number;
  onFirstPageRendered?: () => void;
  onVisible?: (pageNum: number) => void;
}

/**
 * Renders an individual PDF page inside its own canvas.
 * Implements lazy rendering via IntersectionObserver to maintain 60 FPS performance on large documents.
 */
const PdfPageItem: React.FC<PdfPageItemProps> = ({
  pageNumber,
  pdfDoc,
  zoomScale,
  rotation,
  defaultAspectRatio,
  containerWidth,
  onFirstPageRendered,
  onVisible,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const itemRef = useRef<HTMLDivElement | null>(null);
  const currentRenderTask = useRef<pdfjsLib.RenderTask | null>(null);

  const [isRendered, setIsRendered] = useState<boolean>(false);
  // Page 1 initiates immediately; other pages prepare as they approach viewport
  const [shouldRender, setShouldRender] = useState<boolean>(pageNumber <= 2);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null);

  // Responsive page width calculation:
  // - Mobile (< 768px): scales page to fit screen with side padding (no horizontal scroll)
  // - Tablet & Desktop (>= 768px): comfortable centered reading width modulated by zoomScale
  const computedDimensions = useMemo(() => {
    let targetWidth: number;
    if (containerWidth > 0 && containerWidth < 768) {
      const padding = containerWidth < 480 ? 16 : 32;
      const fitWidth = Math.max(280, containerWidth - padding);
      targetWidth = fitWidth * Math.min(zoomScale, 1.8);
    } else {
      const baseWidth = 740;
      targetWidth = Math.max(340, baseWidth * zoomScale);
      if (containerWidth > 0 && zoomScale <= 1.0) {
        targetWidth = Math.min(targetWidth, containerWidth - 64);
      }
    }
    const ratio = defaultAspectRatio > 0 ? defaultAspectRatio : 0.707; // Standard A4 ratio
    const targetHeight = Math.round(targetWidth / ratio);
    return { width: Math.round(targetWidth), height: targetHeight };
  }, [containerWidth, zoomScale, defaultAspectRatio]);

  // IntersectionObserver: Triggers rendering within 600px of viewport and tracks active reading position
  useEffect(() => {
    const el = itemRef.current;
    if (!el) return;

    const renderObserver = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setShouldRender(true);
        }
      },
      { rootMargin: '600px 0px 600px 0px' }
    );
    renderObserver.observe(el);

    const viewObserver = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          onVisible?.(pageNumber);
        }
      },
      { threshold: 0.25 }
    );
    viewObserver.observe(el);

    return () => {
      renderObserver.disconnect();
      viewObserver.disconnect();
    };
  }, [pageNumber, onVisible]);

  // Execute PDF.js page rendering onto the canvas
  useEffect(() => {
    if (!shouldRender || !pdfDoc) return;
    let isCancelled = false;

    const renderPage = async () => {
      try {
        if (currentRenderTask.current) {
          currentRenderTask.current.cancel();
          currentRenderTask.current = null;
        }

        const page = await pdfDoc.getPage(pageNumber);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const baseViewport = page.getViewport({ scale: 1, rotation });
        const scale = computedDimensions.width / baseViewport.width;
        const viewport = page.getViewport({ scale, rotation });

        // High DPI sharpness (capped at 2.25 to prevent mobile GPU canvas exhaustion)
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2.25);

        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        setPageSize({ width: Math.floor(viewport.width), height: Math.floor(viewport.height) });

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        ctx.save();
        ctx.scale(pixelRatio, pixelRatio);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, viewport.width, viewport.height);

        const task = page.render({
          canvasContext: ctx,
          viewport,
        });
        currentRenderTask.current = task;

        await task.promise;
        if (isCancelled) return;

        ctx.restore();
        currentRenderTask.current = null;
        setIsRendered(true);

        if (pageNumber === 1) {
          onFirstPageRendered?.();
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException' && !isCancelled) {
          console.warn(`Error rendering page ${pageNumber}:`, err);
          setRenderError('Could not render page');
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (currentRenderTask.current) {
        currentRenderTask.current.cancel();
        currentRenderTask.current = null;
      }
    };
  }, [shouldRender, pdfDoc, pageNumber, rotation, computedDimensions.width, onFirstPageRendered]);

  const displayWidth = pageSize?.width || computedDimensions.width;
  const displayHeight = pageSize?.height || computedDimensions.height;

  return (
    <div
      id={`pdf-page-container-${pageNumber}`}
      ref={itemRef}
      className="relative flex flex-col items-center group select-none"
      style={{
        width: `${displayWidth}px`,
        minHeight: `${displayHeight}px`,
      }}
    >
      {/* Individual Page Card with Shadow & Border */}
      <div
        className="bg-white rounded-xs shadow-2xl shadow-black/80 border border-slate-700/60 overflow-hidden relative flex items-center justify-center"
        style={{
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
        }}
      >
        {/* Placeholder before page finishes rendering */}
        {!isRendered && !renderError && (
          <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#1677FF]" />
            <span className="text-[11px] font-mono">Page {pageNumber}</span>
          </div>
        )}

        {renderError && (
          <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-red-400 p-4 text-center">
            <p className="text-xs font-semibold">{renderError}</p>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className={`block transition-opacity duration-200 ${isRendered ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>

      {/* Page indicator pill below each page sheet */}
      <div className="mt-2.5 px-2.5 py-0.5 rounded-full bg-slate-900/90 border border-slate-800 text-[10px] font-mono text-slate-400 opacity-70 group-hover:opacity-100 transition-opacity">
        Page {pageNumber}
      </div>
    </div>
  );
};

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
  const [zoomScale, setZoomScale] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 640) return 1.0;
      if (window.innerWidth < 1024) return 1.0;
    }
    return 1.1;
  });
  const [rotation] = useState<number>(0);
  const [defaultAspectRatio, setDefaultAspectRatio] = useState<number>(0.707); // A4 default width / height

  // UI & Loading State
  const [loading, setLoading] = useState<boolean>(true);
  const [isFirstPageRendered, setIsFirstPageRendered] = useState<boolean>(false);
  const [retryTrigger, setRetryTrigger] = useState<number>(0);
  const [loadingProgress, setLoadingProgress] = useState<string>('Connecting to PDF repository...');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);

  // Can download if user has ADMIN role or verified GOLDEN status
  const canDownload = currentUser?.role === 'admin' || currentUser?.isGolden === true;

  // Workspace Container Ref for responsive sizing and scrolling
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') return window.innerWidth;
    return 800;
  });

  // Track workspace container width on window resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      } else if (typeof window !== 'undefined') {
        setContainerWidth(window.innerWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

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

  // Smoothly scroll to a specific page number
  const scrollToPage = useCallback((pageNum: number) => {
    const el = document.getElementById(`pdf-page-container-${pageNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setCurrentPage(pageNum);
    }
  }, []);

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

          // Priority A: If Cloudinary secure URL is present, fetch directly from global CDN
          if (pdf.cloudinarySecureUrl) {
            try {
              const cResp = await fetch(pdf.cloudinarySecureUrl);
              if (cResp.ok) {
                buffer = await cResp.arrayBuffer();
              }
            } catch {
              // Direct CDN fetch had restrictions, proceed to proxy
            }
          }

          // Priority B: Streaming endpoint from backend with 4.5s timeout
          if (!buffer) {
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 4500);
              const resp = await fetch(viewUrl, { headers, signal: controller.signal });
              clearTimeout(timeoutId);
              if (resp.ok) {
                buffer = await resp.arrayBuffer();
              }
            } catch {
              // Backend cold start or sleeping, continue to fallback
            }
          }

          // Priority C: Direct fallback URL
          if (!buffer && fallbackUrl && fallbackUrl !== viewUrl && fallbackUrl !== pdf.cloudinarySecureUrl) {
            try {
              const controller2 = new AbortController();
              const timeoutId2 = setTimeout(() => controller2.abort(), 4500);
              const resp2 = await fetch(fallbackUrl, { signal: controller2.signal });
              clearTimeout(timeoutId2);
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
              url: pdf.cloudinarySecureUrl || fallbackUrl || viewUrl,
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
        setIsFirstPageRendered(true);
        setLoadingProgress('Preparing vertical document layout...');

        // Sample Page 1 for natural aspect ratio
        try {
          const p1 = await doc.getPage(1);
          const vp = p1.getViewport({ scale: 1 });
          if (vp.width && vp.height) {
            setDefaultAspectRatio(vp.width / vp.height);
          }
        } catch {
          // Keep default A4
        }
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
  }, [pdf.id, pdf.fileData, pdf.fileUrl, pdf.viewUrl, pdf.cloudinarySecureUrl, retryTrigger]);

  // Clean retry loading handler
  const handleRetry = useCallback(() => {
    setLoading(true);
    setIsFirstPageRendered(false);
    setRenderError(null);
    setPdfDoc(null);
    setRetryTrigger((prev) => prev + 1);
  }, []);

  // Keyboard navigation (PageUp / ArrowLeft = prev, PageDown / ArrowRight = next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        scrollToPage(Math.max(1, currentPage - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        scrollToPage(Math.min(numPages, currentPage + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [numPages, currentPage, scrollToPage]);

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
    <div className="min-h-screen bg-[#0A0E1A] flex flex-col text-slate-100 select-none overflow-x-hidden w-full max-w-full">
      {/* ================= TOP TOOLBAR ================= */}
      <header className="sticky top-0 z-50 bg-[#141C2E] border-b border-slate-700/80 px-2 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-1 sm:gap-2 shadow-md w-full max-w-full overflow-x-hidden">
        {/* Left: Back button & Document Title */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 max-w-[32%] min-[380px]:max-w-[38%] sm:max-w-[45%] shrink">
          <button
            type="button"
            onClick={onBack}
            className="p-1 sm:p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer shrink-0"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="h-5 w-px bg-slate-700 mx-0.5 sm:mx-1 hidden sm:block" />

          {/* Thumbnails toggle */}
          <button
            type="button"
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`p-1 sm:p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
              showThumbnails
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-700/80 hover:text-white'
            }`}
            title="Toggle Page Navigation Drawer"
          >
            <Sidebar className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden md:inline">Pages</span>
          </button>

          <div className="truncate min-w-0">
            <h1 className="text-[11px] sm:text-sm font-bold text-white truncate flex items-center gap-1 sm:gap-2">
              <span className="px-1 sm:px-1.5 py-0.5 bg-[#EF4444] text-[9px] sm:text-[10px] font-black rounded shrink-0 shadow-xs">
                PDF
              </span>
              <span className="truncate">{pdf.title}</span>
            </h1>
            <p className="text-[11px] text-slate-400 truncate hidden md:block">
              {pdf.subjectName} • {pdf.topic}
            </p>
          </div>
        </div>

        {/* Center: Page Controls (Scroll to specific page) */}
        <div className="flex items-center gap-0.5 sm:gap-2 bg-[#0A0E1A] px-1 sm:px-3 py-1 rounded-lg border border-slate-700 text-xs shrink-0">
          <button
            type="button"
            disabled={currentPage <= 1 || loading}
            onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
            className="p-0.5 sm:p-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 cursor-pointer"
            title="Previous page (Left arrow)"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <div className="flex items-center gap-0.5 sm:gap-1 font-mono font-medium text-[10px] sm:text-xs">
            <input
              type="number"
              min={1}
              max={numPages}
              value={currentPage}
              disabled={loading}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val >= 1 && val <= numPages) scrollToPage(val);
              }}
              className="w-6 sm:w-10 bg-slate-800 text-center rounded text-white py-0.5 text-[11px] sm:text-xs outline-hidden border border-slate-700 focus:border-blue-500"
            />
            <span className="text-slate-400">/{numPages}</span>
          </div>

          <button
            type="button"
            disabled={currentPage >= numPages || loading}
            onClick={() => scrollToPage(Math.min(numPages, currentPage + 1))}
            className="p-0.5 sm:p-1 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 cursor-pointer"
            title="Next page (Right arrow)"
          >
            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Right: Actions (Zoom, Read Later, Download, Fullscreen) */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Zoom controls */}
          <div className="hidden lg:flex items-center gap-1 bg-[#0A0E1A] px-2 py-1 rounded-lg border border-slate-700 text-xs">
            <button
              type="button"
              disabled={loading || zoomScale <= 0.6}
              onClick={() => setZoomScale((z) => Math.max(0.6, parseFloat((z - 0.15).toFixed(2))))}
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
              disabled={loading || zoomScale >= 2.2}
              onClick={() => setZoomScale((z) => Math.min(2.2, parseFloat((z + 0.15).toFixed(2))))}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Toggle Read Later */}
          <button
            type="button"
            onClick={() => onToggleReadLater(pdf.id)}
            className={`p-1 sm:p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 ${
              isReadLater
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-300 hover:bg-slate-700/80 hover:text-white'
            }`}
            title={isReadLater ? 'Saved in Read Later' : 'Save to Read Later'}
          >
            <Bookmark className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isReadLater ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span className="hidden xl:inline">{isReadLater ? 'Saved' : 'Save'}</span>
          </button>

          {/* Share */}
          <button
            type="button"
            onClick={handleShare}
            className="p-1 sm:p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors cursor-pointer shrink-0"
            title="Copy document link"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>

          {/* Golden Download Button */}
          <button
            type="button"
            onClick={handleDownloadClick}
            className={`transition-all cursor-pointer shrink-0 whitespace-nowrap flex items-center justify-center ${
              canDownload
                ? 'px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold gap-1.5 bg-[#1677FF] hover:bg-[#0E63DC] text-white shadow-sm'
                : 'px-2 min-[380px]:px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#FFA800] via-[#FF7E00] to-[#FF6400] hover:brightness-105 active:scale-[0.98] shadow-md shadow-orange-500/20 text-white'
            }`}
            title={canDownload ? 'Download Original PDF' : 'Unlock PDF Downloads with Lifetime Golden (₹149)'}
          >
            {canDownload ? (
              <>
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px] sm:text-xs">
                  <span className="hidden min-[380px]:inline sm:hidden">Download</span>
                  <span className="hidden sm:inline">Download</span>
                </span>
              </>
            ) : (
              <div className="flex items-center gap-1 min-[380px]:gap-2 sm:gap-2.5">
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0 stroke-[2.3]" />
                <span className="h-3.5 sm:h-4 w-[1.5px] bg-white/45 rounded-full shrink-0" aria-hidden="true" />
                <span className="text-[11px] min-[380px]:text-xs sm:text-sm font-bold text-white tracking-normal leading-none">
                  Unlock Premium
                </span>
                <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white shrink-0 stroke-[2.3]" />
              </div>
            )}
          </button>

          {/* Fullscreen */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors hidden sm:flex cursor-pointer shrink-0"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Download Feedback Alerts */}
      {downloadSuccess && (
        <div className="bg-emerald-600 text-white text-xs py-2 px-4 text-center font-semibold animate-fade-in flex items-center justify-center gap-2 shadow-md">
          <Check className="w-4 h-4" />
          <span>Your PDF download has started successfully!</span>
        </div>
      )}
      {downloadError && (
        <div className="bg-red-600 text-white text-xs py-2 px-4 text-center font-semibold animate-fade-in flex items-center justify-center gap-2 shadow-md">
          <AlertCircle className="w-4 h-4" />
          <span>{downloadError}</span>
        </div>
      )}

      {/* ================= VIEWER BODY ================= */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Thumbnails Sidebar */}
        {showThumbnails && (
          <aside className="w-48 bg-[#0F172A] border-r border-slate-700/80 p-3 overflow-y-auto flex flex-col gap-3 shrink-0 z-30">
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
                    onClick={() => {
                      scrollToPage(pageNum);
                      if (window.innerWidth < 768) setShowThumbnails(false);
                    }}
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

        {/* Main Document Workspace: Continuous Vertical Scrolling Pages Container */}
        <main
          ref={containerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 lg:p-8 flex flex-col items-center bg-[#060913] relative min-h-[400px]"
        >
          {/* 1. Loading Screen: Displayed while the PDF document is being retrieved and parsed */}
          {loading && !renderError && !pdfDoc && (
            <div className="flex flex-col items-center justify-center py-24 sm:py-36 text-center max-w-md mx-auto px-4 animate-fade-in z-20">
              <div className="relative mb-6">
                <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-blue-500/30 to-indigo-500/30 blur-lg animate-pulse" />
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/80 shadow-2xl flex items-center justify-center relative">
                  <Loader2 className="w-8 h-8 text-[#1677FF] animate-spin" />
                </div>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Loading your PDF, please wait.
              </h3>
              <p className="text-xs text-slate-400 mt-2 font-medium">
                {pdf.title ? `Preparing "${pdf.title}"` : 'Preparing document pages and typography...'}
              </p>
              {loadingProgress && (
                <div className="mt-4 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-400">
                  {loadingProgress}
                </div>
              )}
            </div>
          )}

          {/* 2. Error State */}
          {renderError && (
            <div className="max-w-md mx-auto my-20 p-6 sm:p-8 rounded-2xl bg-slate-900/95 border border-red-500/40 text-center shadow-2xl z-20">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">Could Not Display PDF</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{renderError}</p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="px-5 py-2.5 bg-[#1677FF] hover:bg-[#0E63DC] text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-2"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Retry Loading</span>
                </button>
                <button
                  type="button"
                  onClick={onBack}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Return
                </button>
              </div>
            </div>
          )}

          {/* 3. Continuous Vertical Scrolling Pages List (Page 1 -> Page 2 -> Page 3 ...) */}
          {pdfDoc && !renderError && (
            <div
              className="w-full flex flex-col items-center gap-6 sm:gap-8 pb-16 transition-opacity duration-300 opacity-100"
            >
              {Array.from({ length: numPages }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <PdfPageItem
                    key={pageNum}
                    pageNumber={pageNum}
                    pdfDoc={pdfDoc}
                    zoomScale={zoomScale}
                    rotation={rotation}
                    defaultAspectRatio={defaultAspectRatio}
                    containerWidth={containerWidth}
                    onFirstPageRendered={() => {
                      setIsFirstPageRendered(true);
                      setLoading(false);
                    }}
                    onVisible={(visiblePage) => {
                      setCurrentPage(visiblePage);
                    }}
                  />
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* ================= BOTTOM QUICK BAR ================= */}
      <footer className="bg-[#141C2E] border-t border-slate-700/80 px-4 py-2 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <span className="font-medium text-slate-300 truncate max-w-[130px] sm:max-w-xs">{pdf.fileName || 'Original Document'}</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Size: {pdf.fileSize}</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Total Pages: {numPages}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1 || loading}
            onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded disabled:opacity-40 cursor-pointer"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={currentPage >= numPages || loading}
            onClick={() => scrollToPage(Math.min(numPages, currentPage + 1))}
            className="px-3 py-1 bg-[#1677FF] hover:bg-[#0E63DC] text-white rounded disabled:opacity-40 font-semibold cursor-pointer"
          >
            Next Page
          </button>
        </div>
      </footer>
    </div>
  );
};

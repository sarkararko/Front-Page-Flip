import { useEffect, useRef, useCallback } from 'react';
import { Subject, PdfResource } from '../types';

export interface RouteState {
  tab: string;
  selectedSubjectId?: string | null;
  activePdfId?: string | null;
  librarySubTab?: 'read-later' | 'recently-viewed' | 'favorites';
  browseSearchQuery?: string;
  goldenRedirectNotice?: string;
  key: string;
}

interface UseNavigationHistoryProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedSubject: Subject | null;
  setSelectedSubject: (subject: Subject | null) => void;
  activePdf: PdfResource | null;
  setActivePdf: (pdf: PdfResource | null) => void;
  librarySubTab: 'read-later' | 'recently-viewed' | 'favorites';
  setLibrarySubTab: (subTab: 'read-later' | 'recently-viewed' | 'favorites') => void;
  browseSearchQuery: string;
  setBrowseSearchQuery: (query: string) => void;
  goldenRedirectNotice?: string;
  setGoldenRedirectNotice: (notice: string | undefined) => void;
  subjects: Subject[];
  pdfs: PdfResource[];
  isLoggedIn: boolean;
}

/**
 * Constructs a clean, standard URL query string from the current route state.
 */
function constructUrl(state: {
  tab: string;
  selectedSubjectId?: string | null;
  activePdfId?: string | null;
  librarySubTab?: string;
  browseSearchQuery?: string;
}): string {
  if (typeof window === 'undefined') return '/';

  const url = new URL(window.location.href);
  // Clear any existing OAuth hashes from URL query
  url.hash = '';

  if (state.activePdfId) {
    url.searchParams.set('tab', 'reader');
    url.searchParams.set('pdf', state.activePdfId);
    url.searchParams.delete('subject');
    url.searchParams.delete('q');
  } else if (state.tab === 'subject-detail' && state.selectedSubjectId) {
    url.searchParams.set('tab', 'subject-detail');
    url.searchParams.set('subject', state.selectedSubjectId);
    url.searchParams.delete('pdf');
    url.searchParams.delete('q');
  } else if (state.tab === 'home' || !state.tab) {
    url.searchParams.delete('tab');
    url.searchParams.delete('subject');
    url.searchParams.delete('pdf');
    url.searchParams.delete('q');
  } else {
    url.searchParams.set('tab', state.tab);
    url.searchParams.delete('subject');
    url.searchParams.delete('pdf');
    if (state.tab === 'browse' && state.browseSearchQuery) {
      url.searchParams.set('q', state.browseSearchQuery);
    } else {
      url.searchParams.delete('q');
    }
  }

  if (state.tab === 'my-library' && state.librarySubTab) {
    url.searchParams.set('sub', state.librarySubTab);
  } else {
    url.searchParams.delete('sub');
  }

  const searchStr = url.searchParams.toString();
  return url.pathname + (searchStr ? `?${searchStr}` : '');
}

/**
 * Immediately scrolls window to top (position 0) across all browsers.
 */
export function scrollToTopInstant() {
  if (typeof window === 'undefined') return;
  try {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  } catch {
    window.scrollTo(0, 0);
  }
  if (document.documentElement) document.documentElement.scrollTop = 0;
  if (document.body) document.body.scrollTop = 0;
}

export function useNavigationHistory({
  activeTab,
  setActiveTab,
  selectedSubject,
  setSelectedSubject,
  activePdf,
  setActivePdf,
  librarySubTab,
  setLibrarySubTab,
  browseSearchQuery,
  setBrowseSearchQuery,
  goldenRedirectNotice,
  setGoldenRedirectNotice,
  subjects,
  pdfs,
  isLoggedIn,
}: UseNavigationHistoryProps) {
  // Map of history entry key -> vertical scroll position
  const scrollPositionsRef = useRef<Map<string, number>>(new Map());
  // Tracks current history entry key
  const currentKeyRef = useRef<string>('');
  // Flag indicating popstate navigation is currently taking place
  const isPoppingRef = useRef<boolean>(false);
  // Whether initial history state has been mounted
  const isInitializedRef = useRef<boolean>(false);

  // References to latest subjects and pdfs for lookup during popstate
  const subjectsRef = useRef(subjects);
  subjectsRef.current = subjects;
  const pdfsRef = useRef(pdfs);
  pdfsRef.current = pdfs;

  // Track scroll position continuously with passive scroll listener
  useEffect(() => {
    let scrollTimeout: any = null;

    const onScroll = () => {
      if (isPoppingRef.current) return;
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (currentKeyRef.current) {
          const currentY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
          scrollPositionsRef.current.set(currentKeyRef.current, currentY);
        }
      }, 80);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // 1. Initialize HTML5 History API & scroll restoration on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Turn off browser default scroll restoration so our route-aware manager takes authoritative control
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Check if initial URL or existing history state has route information
    const urlParams = new URLSearchParams(window.location.search);
    const existingState = window.history.state as RouteState | null;

    let initTab = 'home';
    let initSubjectId: string | null = null;
    let initPdfId: string | null = null;
    let initSubTab: 'read-later' | 'recently-viewed' | 'favorites' = 'read-later';
    let initQuery = '';

    if (existingState && existingState.tab) {
      initTab = existingState.tab;
      initSubjectId = existingState.selectedSubjectId || null;
      initPdfId = existingState.activePdfId || null;
      if (existingState.librarySubTab) initSubTab = existingState.librarySubTab;
      if (existingState.browseSearchQuery) initQuery = existingState.browseSearchQuery;
    } else {
      const tabParam = urlParams.get('tab');
      const subjectParam = urlParams.get('subject');
      const pdfParam = urlParams.get('pdf');
      const subParam = urlParams.get('sub');
      const qParam = urlParams.get('q');

      if (tabParam === 'reader' && pdfParam) {
        initPdfId = pdfParam;
        initTab = 'home';
      } else if (tabParam === 'subject-detail' && subjectParam) {
        initTab = 'subject-detail';
        initSubjectId = subjectParam;
      } else if (tabParam) {
        initTab = tabParam;
      }

      if (subParam === 'favorites' || subParam === 'recently-viewed' || subParam === 'read-later') {
        initSubTab = subParam;
      }
      if (qParam) {
        initQuery = qParam;
      }
    }

    const initialKey = existingState?.key || `fpf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    currentKeyRef.current = initialKey;

    const initialState: RouteState = {
      tab: initTab,
      selectedSubjectId: initSubjectId,
      activePdfId: initPdfId,
      librarySubTab: initSubTab,
      browseSearchQuery: initQuery,
      key: initialKey,
    };

    // Replace initial state so the starting entry has a clean key and route
    window.history.replaceState(initialState, '', constructUrl(initialState));

    // Hydrate initial state
    if (initTab !== activeTab) setActiveTab(initTab);
    if (initSubTab !== librarySubTab) setLibrarySubTab(initSubTab);
    if (initQuery) setBrowseSearchQuery(initQuery);

    isInitializedRef.current = true;
  }, []);

  // 2. Listen to browser Back and Forward navigation (popstate)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as RouteState | null;

      // If user backed out to an entry before Front-Page Flip was opened, allow normal browser behavior
      if (!state || !state.key) {
        return;
      }

      isPoppingRef.current = true;

      // Save scroll position of the page we are transitioning away from
      if (currentKeyRef.current) {
        const leavingY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
        scrollPositionsRef.current.set(currentKeyRef.current, leavingY);
      }

      currentKeyRef.current = state.key;

      // 1. Restore PDF reader state
      if (state.activePdfId) {
        const foundPdf = pdfsRef.current.find((p) => p.id === state.activePdfId);
        if (foundPdf) {
          setActivePdf(foundPdf);
        }
      } else {
        setActivePdf(null);
      }

      // 2. Restore Subject detail state
      if (state.selectedSubjectId) {
        const foundSubject = subjectsRef.current.find(
          (s) => s.id === state.selectedSubjectId || s.slug === state.selectedSubjectId
        );
        if (foundSubject) {
          setSelectedSubject(foundSubject);
        }
      } else if (state.tab !== 'subject-detail') {
        setSelectedSubject(null);
      }

      // 3. Restore Active Tab
      if (state.tab) {
        setActiveTab(state.tab);
      }

      // 4. Restore Library sub-tab
      if (state.librarySubTab) {
        setLibrarySubTab(state.librarySubTab);
      }

      // 5. Restore Search query
      if (typeof state.browseSearchQuery === 'string') {
        setBrowseSearchQuery(state.browseSearchQuery);
      }

      // 6. Restore Golden redirect notice
      if (state.goldenRedirectNotice) {
        setGoldenRedirectNotice(state.goldenRedirectNotice);
      } else {
        setGoldenRedirectNotice(undefined);
      }

      // 7. Restore previous scroll position for this specific history key
      const targetScrollY = scrollPositionsRef.current.get(state.key) || 0;

      requestAnimationFrame(() => {
        try {
          window.scrollTo({ top: targetScrollY, left: 0, behavior: 'instant' as ScrollBehavior });
        } catch {
          window.scrollTo(0, targetScrollY);
        }
        if (document.documentElement) document.documentElement.scrollTop = targetScrollY;
        if (document.body) document.body.scrollTop = targetScrollY;

        // Double check after DOM re-render
        setTimeout(() => {
          try {
            window.scrollTo({ top: targetScrollY, left: 0, behavior: 'instant' as ScrollBehavior });
          } catch {
            window.scrollTo(0, targetScrollY);
          }
          isPoppingRef.current = false;
        }, 60);
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [
    setActiveTab,
    setSelectedSubject,
    setActivePdf,
    setLibrarySubTab,
    setBrowseSearchQuery,
    setGoldenRedirectNotice,
  ]);

  // 3. Push a new route into browser history & always scroll to top
  const navigateTo = useCallback(
    (
      tab: string,
      options?: {
        subject?: Subject | null;
        pdf?: PdfResource | null;
        subTab?: 'read-later' | 'recently-viewed' | 'favorites';
        searchQuery?: string;
        goldenNotice?: string;
        replace?: boolean;
      }
    ) => {
      if (typeof window === 'undefined') return;

      const targetSubject = options?.subject !== undefined ? options.subject : selectedSubject;
      const targetPdf = options?.pdf !== undefined ? options.pdf : null;
      const targetSubTab = options?.subTab || librarySubTab;
      const targetQuery = options?.searchQuery !== undefined ? options.searchQuery : '';

      // Check if this is a duplicate navigation to the identical route
      const isDuplicate =
        !options?.replace &&
        tab === activeTab &&
        Boolean(targetPdf) === Boolean(activePdf) &&
        (!targetPdf || targetPdf.id === activePdf?.id) &&
        (!targetSubject || targetSubject.id === selectedSubject?.id) &&
        (!options?.subTab || options.subTab === librarySubTab);

      if (isDuplicate) {
        // User clicked the link for the page they are already on: smooth scroll to top without adding duplicate history
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Save scroll position of the current page before leaving
      if (currentKeyRef.current) {
        const currentY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
        scrollPositionsRef.current.set(currentKeyRef.current, currentY);
      }

      const newKey = `fpf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      currentKeyRef.current = newKey;

      const newState: RouteState = {
        tab,
        selectedSubjectId: targetSubject ? targetSubject.id : null,
        activePdfId: targetPdf ? targetPdf.id : null,
        librarySubTab: targetSubTab,
        browseSearchQuery: targetQuery,
        goldenRedirectNotice: options?.goldenNotice,
        key: newKey,
      };

      const newUrl = constructUrl({
        tab,
        selectedSubjectId: targetSubject ? targetSubject.id : null,
        activePdfId: targetPdf ? targetPdf.id : null,
        librarySubTab: targetSubTab,
        browseSearchQuery: targetQuery,
      });

      if (options?.replace) {
        window.history.replaceState(newState, '', newUrl);
      } else {
        window.history.pushState(newState, '', newUrl);
      }

      // Update state
      setActiveTab(tab);
      if (options?.subject !== undefined) setSelectedSubject(options.subject);
      if (options?.pdf !== undefined) setActivePdf(options.pdf);
      if (options?.subTab) setLibrarySubTab(options.subTab);
      if (options?.searchQuery !== undefined) setBrowseSearchQuery(options.searchQuery);
      if (options?.goldenNotice !== undefined) setGoldenRedirectNotice(options.goldenNotice);

      // ALWAYS OPEN NEW PAGES FROM THE TOP:
      // Set vertical scroll position to 0 immediately so page header & navigation are visible without flicker
      scrollToTopInstant();

      // Ensure that once React mounts the new route component, it remains pinned to top 0
      requestAnimationFrame(() => {
        scrollToTopInstant();
      });
      setTimeout(() => {
        scrollToTopInstant();
      }, 30);
    },
    [
      activeTab,
      selectedSubject,
      activePdf,
      librarySubTab,
      setActiveTab,
      setSelectedSubject,
      setActivePdf,
      setLibrarySubTab,
      setBrowseSearchQuery,
      setGoldenRedirectNotice,
    ]
  );

  // 4. Back navigation helper (used by in-app back buttons)
  const navigateBack = useCallback(
    (fallbackTab = 'home') => {
      if (typeof window === 'undefined') return;

      // If user has history inside Front-Page Flip, pop with browser history so Back button & in-app match perfectly
      if (window.history.length > 1) {
        window.history.back();
      } else {
        // Fallback if opened directly
        navigateTo(fallbackTab, { replace: true, pdf: null, subject: null });
      }
    },
    [navigateTo]
  );

  return {
    navigateTo,
    navigateBack,
  };
}

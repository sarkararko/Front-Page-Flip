import React, { useState, useEffect } from 'react';
import { User, Subject, PdfResource } from './types';
import { ApiService, getApiBaseUrl } from './services/api';
import { StorageService } from './services/storage';
import { PresenceService } from './services/presence';
import { Navbar } from './components/common/Navbar';
import { AuthPage } from './components/auth/AuthPage';
import { HomePage } from './components/home/HomePage';
import { BrowsePdfsPage } from './components/browse/BrowsePdfsPage';
import { AllSubjectsPage } from './components/subjects/AllSubjectsPage';
import { SubjectDetailPage } from './components/subjects/SubjectDetailPage';
import { MyLibraryPage } from './components/library/MyLibraryPage';
import { PdfReader } from './components/reader/PdfReader';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ProfilePage } from './components/profile/ProfilePage';
import { AboutPage } from './components/about/AboutPage';
import { GoldenPage } from './components/golden/GoldenPage';
import { QuickSearchModal } from './components/common/QuickSearchModal';
import { Logo } from './components/common/Logo';
import { Footer } from './components/common/Footer';

export default function App() {
  // Authentication session
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [goldenRedirectNotice, setGoldenRedirectNotice] = useState<string | undefined>(undefined);

  // App data loaded from backend / StorageService
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    try {
      return StorageService.getSubjects();
    } catch {
      return [];
    }
  });
  const [pdfs, setPdfs] = useState<PdfResource[]>(() => {
    try {
      return StorageService.getPdfs();
    } catch {
      return [];
    }
  });
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(() => {
    try {
      return StorageService.getSubjects().length === 0;
    } catch {
      return true;
    }
  });
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  const [readLaterIds, setReadLaterIds] = useState<string[]>([]);

  // Live student count from MySQL
  const [activeStudentsCount, setActiveStudentsCount] = useState<number>(0);
  const [registeredStudentsCount, setRegisteredStudentsCount] = useState<number>(0);
  const [registeredStudentsLoading, setRegisteredStudentsLoading] = useState<boolean>(true);

  // Navigation state
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [activePdf, setActivePdf] = useState<PdfResource | null>(null);
  const [librarySubTab, setLibrarySubTab] = useState<'read-later' | 'recently-viewed' | 'favorites'>('read-later');
  const [browseSearchQuery, setBrowseSearchQuery] = useState<string>('');

  // Search Modal state
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Load initial data and sync authoritative user profile from backend MySQL
  const loadData = async () => {
    const user = ApiService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }

    // Fetch authoritative profile directly from backend MySQL (/api/v1/auth/me)
    if (user || StorageService.getSessionToken()) {
      ApiService.fetchCurrentUserProfile()
        .then((freshProfile) => {
          if (freshProfile) {
            setCurrentUser(freshProfile);
          }
        })
        .catch(() => {
          // Backend offline or token expired: safely keep existing profile
        });
    }

    try {
      const [subs, pList] = await Promise.all([
        ApiService.getSubjects(),
        ApiService.getPdfs(),
      ]);
      setSubjects(subs);
      setPdfs(pList);
      StorageService.setSubjects(subs);

      // If backend was sleeping on cold start and returned empty in a fresh browser session,
      // silently retry once in the background after 8 seconds to seamlessly synchronize live MySQL data
      if (subs.length === 0 && pList.length === 0) {
        setTimeout(async () => {
          try {
            const [freshSubs, freshPList] = await Promise.all([
              ApiService.getSubjects(),
              ApiService.getPdfs(),
            ]);
            if (freshSubs.length > 0 || freshPList.length > 0) {
              setSubjects(freshSubs);
              setPdfs(freshPList);
            }
          } catch {
            // silent background retry
          }
        }, 8000);
      }
    } catch {
      // Fallback
    } finally {
      setIsInitialLoading(false);
    }

    if (user) {
      setUserFavorites(ApiService.getUserFavorites(user.id));
      setReadLaterIds(ApiService.getUserReadLater(user.id));
      // Sync favorites and read-later directly from backend MySQL
      ApiService.syncLibraryFromBackend(user.id)
        .then((synced) => {
          if (synced) {
            setUserFavorites(synced.favorites);
            setReadLaterIds(synced.readLater);
          }
        })
        .catch(() => {
          // Keep local favorites and read-later state
        });
    }
  };

  // Process Google OAuth redirect callback on mount
  useEffect(() => {
    try {
      const hash = window.location.hash;
      if (hash.includes('auth-success')) {
        const query = hash.split('?')[1] || '';
        const params = new URLSearchParams(query);
        const token = params.get('token');
        const email = params.get('email');
        const rawName = params.get('name');
        const name =
          rawName && rawName !== 'Student' && !rawName.includes('@')
            ? rawName
            : (email ? email.split('@')[0] : '');
        const userId = params.get('userId') || `usr_${Date.now()}`;

        const rawProvider = params.get('provider');
        const provider: 'google' | 'github' | 'email' =
          rawProvider === 'github' ? 'github' : rawProvider === 'email' ? 'email' : 'google';

        if (token && email) {
          const studentUser: User = {
            id: userId,
            name,
            email,
            role: 'student', // STRICT: OAuth is always student
            emailVerified: true,
            createdAt: new Date().toISOString(),
            provider,
            avatar: name ? name.slice(0, 2).toUpperCase() : 'ST',
          };
          StorageService.addUser(studentUser);
          StorageService.setCurrentUser(studentUser);
          StorageService.setSessionToken(token);
          setCurrentUser(studentUser);
          window.history.replaceState(null, '', window.location.pathname);

          // Authoritatively sync user profile from MySQL
          ApiService.fetchCurrentUserProfile()
            .then((fresh) => {
              if (fresh) setCurrentUser(fresh);
            })
            .catch(() => {
              // Ignore network failure
            });

          loadData();
          return;
        }
      } else if (hash.includes('auth-error')) {
        const query = hash.split('?')[1] || '';
        const params = new URLSearchParams(query);
        const errMsg = params.get('message') || 'Social authentication failed or was canceled.';
        setAuthError(errMsg);
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch {
      // Ignore URL parsing errors
    }
    loadData();
  }, []);

  // Poll live active & total student count from backend / MySQL
  useEffect(() => {
    let isMounted = true;
    const fetchCounts = async () => {
      try {
        const counts = await PresenceService.getStudentCounts();
        if (isMounted) {
          setActiveStudentsCount(counts.activeCount);
          setRegisteredStudentsCount(counts.totalStudents);
        }
      } catch {
        if (isMounted) {
          const total = StorageService.getUsers().filter((u) => u.role === 'student').length;
          setRegisteredStudentsCount(total);
        }
      } finally {
        if (isMounted) {
          setRegisteredStudentsLoading(false);
        }
      }
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Periodic heartbeat while student is active on site
  useEffect(() => {
    if (currentUser?.role === 'student') {
      PresenceService.sendHeartbeat();
      const hbInterval = setInterval(() => {
        PresenceService.sendHeartbeat();
      }, 60000);
      return () => clearInterval(hbInterval);
    }
  }, [currentUser]);

  // Strict RBAC: Ensure students cannot stay on admin dashboard
  useEffect(() => {
    if (activeTab === 'admin' && currentUser?.role !== 'admin') {
      setActiveTab('home');
    }
  }, [activeTab, currentUser]);

  // Update user-scoped data when user changes
  useEffect(() => {
    if (currentUser) {
      setUserFavorites(ApiService.getUserFavorites(currentUser.id));
      setReadLaterIds(ApiService.getUserReadLater(currentUser.id));
    }
  }, [currentUser]);

  // --- ACTIONS ---
  const handleLoginSuccess = (user: User) => {
    const existing = StorageService.getUserByEmail(user.email);
    if (!existing) {
      StorageService.addUser(user);
    }
    StorageService.setCurrentUser(user);
    setCurrentUser(user);
    loadData();
    // Redirect according to role
    if (user.role === 'admin') {
      setActiveTab('admin');
    } else {
      setActiveTab('home');
    }
  };

  const handleLogout = async () => {
    if (currentUser?.role === 'student') {
      await PresenceService.sendLogout();
    }
    await ApiService.logout();
    setCurrentUser(null);
    setActivePdf(null);
    setActiveTab('home');
    const updatedCount = await PresenceService.getActiveStudentsCount();
    setActiveStudentsCount(updatedCount);
  };

  const handleToggleFavorite = (subjectId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentUser) return;
    ApiService.toggleFavorite(currentUser.id, subjectId);
    setUserFavorites(ApiService.getUserFavorites(currentUser.id));
  };

  const handleToggleReadLater = (pdfId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentUser) return;
    ApiService.toggleReadLater(currentUser.id, pdfId);
    setReadLaterIds(ApiService.getUserReadLater(currentUser.id));
  };

  const handleViewPdf = (pdf: PdfResource) => {
    setActivePdf(pdf);
  };

  const handleSelectSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setActiveTab('subject-detail');
  };

  const handleHeroSearch = (query: string) => {
    setBrowseSearchQuery(query);
    setActiveTab('browse');
  };

  const handleNavigate = (tab: string, extra?: any) => {
    // Strict RBAC: Students cannot navigate to administrator console
    if (tab === 'admin' && currentUser?.role !== 'admin') {
      setActiveTab('home');
      return;
    }

    setActiveTab(tab);
    if (extra?.subTab) {
      setLibrarySubTab(extra.subTab);
    }
    if (tab === 'browse') {
      setBrowseSearchQuery('');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Prepared data for views (computed unconditionally before any early returns)
  const savedPdfs = pdfs.filter((p) => readLaterIds.includes(p.id));
  const favoriteSubjectsList = subjects.filter((s) => userFavorites.includes(s.id));
  const recentlyViewedItems = currentUser ? ApiService.getRecentlyViewed(currentUser.id) : [];

  const readingProgressMap = React.useMemo(() => {
    const map: Record<string, { lastPageRead: number; totalPages: number }> = {};
    recentlyViewedItems.forEach((item) => {
      map[item.pdfId] = {
        lastPageRead: item.lastPageRead,
        totalPages: item.totalPages,
      };
    });
    return map;
  }, [recentlyViewedItems]);

  // If viewing a PDF document, show full-screen interactive reader
  if (currentUser && activePdf) {
    return (
      <PdfReader
        pdf={activePdf}
        userId={currentUser.id}
        currentUser={currentUser}
        onBack={() => setActivePdf(null)}
        isReadLater={readLaterIds.includes(activePdf.id)}
        onToggleReadLater={() => handleToggleReadLater(activePdf.id)}
        onGoToGolden={(pdfTitle) => {
          setActivePdf(null);
          setGoldenRedirectNotice(pdfTitle);
          setActiveTab('golden');
        }}
      />
    );
  }

  // If not logged in, show Auth Page matching fpf login interface.png
  if (!currentUser) {
    return <AuthPage onSuccess={handleLoginSuccess} initialError={authError} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-[#1677FF]/20 selection:text-[#102A56]">
      {/* Top Navigation Bar with Live MySQL Student Count */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        registeredStudentsCount={registeredStudentsCount}
        registeredStudentsLoading={registeredStudentsLoading}
        activeStudentsCount={activeStudentsCount}
        onNavigate={handleNavigate}
        onOpenSearch={() => setIsSearchModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <HomePage
            currentUser={currentUser}
            subjects={subjects}
            recentlyAddedPdfs={pdfs}
            userFavorites={userFavorites}
            readLaterIds={readLaterIds}
            readingProgressMap={readingProgressMap}
            activeStudentsCount={activeStudentsCount}
            registeredStudentsCount={registeredStudentsCount}
            isLoading={isInitialLoading}
            onSearch={handleHeroSearch}
            onSelectSubject={handleSelectSubject}
            onViewAllSubjects={() => handleNavigate('subjects')}
            onViewAllPdfs={() => handleNavigate('browse')}
            onToggleFavorite={handleToggleFavorite}
            onToggleReadLater={handleToggleReadLater}
            onViewPdf={handleViewPdf}
            onGoToLibrary={() => handleNavigate('my-library')}
            onGoToAdmin={() => handleNavigate('admin')}
            onRefreshData={loadData}
          />
        )}

        {activeTab === 'browse' && (
          <BrowsePdfsPage
            subjects={subjects}
            pdfs={pdfs}
            initialSearchQuery={browseSearchQuery}
            readLaterIds={readLaterIds}
            readingProgressMap={readingProgressMap}
            onToggleReadLater={handleToggleReadLater}
            onViewPdf={handleViewPdf}
            onSelectSubject={handleSelectSubject}
          />
        )}

        {activeTab === 'recent' && (
          <BrowsePdfsPage
            subjects={subjects}
            pdfs={pdfs}
            readLaterIds={readLaterIds}
            readingProgressMap={readingProgressMap}
            onToggleReadLater={handleToggleReadLater}
            onViewPdf={handleViewPdf}
            onSelectSubject={handleSelectSubject}
          />
        )}

        {activeTab === 'subjects' && (
          <AllSubjectsPage
            subjects={subjects}
            userFavorites={userFavorites}
            currentUser={currentUser}
            onRefreshData={loadData}
            onGoToAdmin={() => handleNavigate('admin')}
            onToggleFavorite={handleToggleFavorite}
            onSelectSubject={handleSelectSubject}
          />
        )}

        {activeTab === 'subject-detail' && selectedSubject && (
          <SubjectDetailPage
            subject={selectedSubject}
            allSubjects={subjects}
            pdfs={pdfs}
            currentUser={currentUser}
            isFavorite={userFavorites.includes(selectedSubject.id)}
            readLaterIds={readLaterIds}
            readingProgressMap={readingProgressMap}
            onRefreshData={loadData}
            onToggleFavorite={(id) => handleToggleFavorite(id)}
            onToggleReadLater={handleToggleReadLater}
            onViewPdf={handleViewPdf}
            onBack={() => handleNavigate('subjects')}
          />
        )}

        {activeTab === 'my-library' && (
          <MyLibraryPage
            initialSubTab={librarySubTab}
            savedPdfs={savedPdfs}
            recentlyViewed={recentlyViewedItems}
            allPdfs={pdfs}
            favoriteSubjects={favoriteSubjectsList}
            onRemoveReadLater={(pdfId) => handleToggleReadLater(pdfId)}
            onToggleFavorite={handleToggleFavorite}
            onViewPdf={handleViewPdf}
            onSelectSubject={handleSelectSubject}
            onExplorePdfs={() => handleNavigate('browse')}
            onExploreSubjects={() => handleNavigate('subjects')}
          />
        )}

        {activeTab === 'about' && (
          <AboutPage onNavigate={handleNavigate} />
        )}

        {activeTab === 'admin' && currentUser?.role === 'admin' && (
          <AdminDashboard
            currentUser={currentUser}
            subjects={subjects}
            pdfs={pdfs}
            onRefreshData={loadData}
            onViewPdf={handleViewPdf}
          />
        )}

        {activeTab === 'profile' && (
          <ProfilePage
            currentUser={currentUser}
            readLaterCount={savedPdfs.length}
            favoriteSubjectsCount={favoriteSubjectsList.length}
            recentlyViewedCount={recentlyViewedItems.length}
            onNavigateLibrary={(subTab) => handleNavigate('my-library', { subTab })}
            onLogout={handleLogout}
            onUpdateUser={(updated) => setCurrentUser(updated)}
          />
        )}

        {activeTab === 'golden' && (
          <GoldenPage
            currentUser={currentUser}
            fromPdfTitle={goldenRedirectNotice}
            onNavigate={handleNavigate}
            onBack={() => handleNavigate('home')}
            onPaymentSuccess={() => {
              loadData();
            }}
          />
        )}
      </main>

      {/* Global Quick Search Modal */}
      <QuickSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        pdfs={pdfs}
        subjects={subjects}
        onViewPdf={handleViewPdf}
        onSelectSubject={handleSelectSubject}
        onViewAllResults={(q) => {
          setBrowseSearchQuery(q);
          setActiveTab('browse');
        }}
      />

      {/* Professional Responsive Footer matching Front-Page Flip Brand */}
      <Footer currentUser={currentUser} onNavigate={handleNavigate} />
    </div>
  );
}

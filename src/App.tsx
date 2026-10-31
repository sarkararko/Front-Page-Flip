import React, { useState, useEffect } from 'react';
import { User, Subject, PdfResource } from './types';
import { ApiService } from './services/api';
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
import { QuickSearchModal } from './components/common/QuickSearchModal';
import { Logo } from './components/common/Logo';

export default function App() {
  // Authentication session
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // App data loaded from backend / StorageService
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [pdfs, setPdfs] = useState<PdfResource[]>([]);
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  const [readLaterIds, setReadLaterIds] = useState<string[]>([]);

  // Live student count from MySQL
  const [activeStudentsCount, setActiveStudentsCount] = useState<number>(0);
  const [registeredStudentsCount, setRegisteredStudentsCount] = useState<number>(0);

  // Navigation state
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [activePdf, setActivePdf] = useState<PdfResource | null>(null);
  const [librarySubTab, setLibrarySubTab] = useState<'read-later' | 'recently-viewed' | 'favorites'>('read-later');
  const [browseSearchQuery, setBrowseSearchQuery] = useState<string>('');

  // Search Modal state
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Load initial data
  const loadData = () => {
    const user = ApiService.getCurrentUser();
    setCurrentUser(user);

    ApiService.getSubjects().then((subs) => setSubjects(subs));
    ApiService.getPdfs().then((pList) => setPdfs(pList));

    if (user) {
      setUserFavorites(ApiService.getUserFavorites(user.id));
      setReadLaterIds(ApiService.getUserReadLater(user.id));
      // Sync favorites and read-later directly from backend MySQL
      ApiService.syncLibraryFromBackend(user.id).then((synced) => {
        if (synced) {
          setUserFavorites(synced.favorites);
          setReadLaterIds(synced.readLater);
        }
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
        const name = params.get('name') || 'Student';
        const userId = params.get('userId') || `usr_${Date.now()}`;

        if (token && email) {
          const studentUser: User = {
            id: userId,
            name,
            email,
            role: 'student', // STRICT: Google OAuth is always student
            emailVerified: true,
            createdAt: new Date().toISOString(),
            provider: 'google',
            avatar: name.slice(0, 2).toUpperCase(),
          };
          StorageService.addUser(studentUser);
          StorageService.setCurrentUser(studentUser);
          StorageService.setSessionToken(token);
          setCurrentUser(studentUser);
          window.history.replaceState(null, '', window.location.pathname);
          loadData();
          return;
        }
      } else if (hash.includes('auth-error')) {
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
      const [active, total] = await Promise.all([
        PresenceService.getActiveStudentsCount(),
        PresenceService.getRegisteredStudentCount(),
      ]);
      if (isMounted) {
        setActiveStudentsCount(active);
        setRegisteredStudentsCount(total);
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

  // Update user-scoped data when user changes
  useEffect(() => {
    if (currentUser) {
      setUserFavorites(ApiService.getUserFavorites(currentUser.id));
      setReadLaterIds(ApiService.getUserReadLater(currentUser.id));
    }
  }, [currentUser]);

  // --- ACTIONS ---
  const handleLoginSuccess = (user: User) => {
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
        onBack={() => setActivePdf(null)}
        isReadLater={readLaterIds.includes(activePdf.id)}
        onToggleReadLater={() => handleToggleReadLater(activePdf.id)}
      />
    );
  }

  // If not logged in, show Auth Page matching fpf login interface.png
  if (!currentUser) {
    return <AuthPage onSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans selection:bg-[#1677FF]/20 selection:text-[#102A56]">
      {/* Top Navigation Bar with Live MySQL Student Count */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
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
            onSearch={handleHeroSearch}
            onSelectSubject={handleSelectSubject}
            onViewAllSubjects={() => handleNavigate('subjects')}
            onViewAllPdfs={() => handleNavigate('browse')}
            onToggleFavorite={handleToggleFavorite}
            onToggleReadLater={handleToggleReadLater}
            onViewPdf={handleViewPdf}
            onGoToLibrary={() => handleNavigate('my-library')}
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
            onToggleFavorite={handleToggleFavorite}
            onSelectSubject={handleSelectSubject}
          />
        )}

        {activeTab === 'subject-detail' && selectedSubject && (
          <SubjectDetailPage
            subject={selectedSubject}
            pdfs={pdfs}
            isFavorite={userFavorites.includes(selectedSubject.id)}
            readLaterIds={readLaterIds}
            readingProgressMap={readingProgressMap}
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

        {activeTab === 'admin' && (
          currentUser.role === 'admin' ? (
            <AdminDashboard
              currentUser={currentUser}
              subjects={subjects}
              pdfs={pdfs}
              onRefreshData={loadData}
              onViewPdf={handleViewPdf}
            />
          ) : (
            <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-red-200 text-center shadow-xs">
              <h2 className="text-lg font-bold text-red-600">Access Restricted</h2>
              <p className="text-xs text-slate-500 mt-2">
                Administrator privileges are required to access this workspace.
              </p>
              <button
                type="button"
                onClick={() => handleNavigate('home')}
                className="mt-4 px-4 py-2 bg-[#1677FF] text-white text-xs font-bold rounded-xl"
              >
                Return to Home
              </button>
            </div>
          )
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

      {/* Footer matching Front-Page Flip Brand */}
      <footer className="bg-white border-t border-[#E2E8F0] mt-16 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start">
            <Logo size="sm" showTagline={true} />
            <p className="text-xs text-[#64748B] mt-2 font-medium text-center md:text-left">
              The dedicated educational PDF library for university and school students.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#64748B] font-semibold">
            <button type="button" onClick={() => handleNavigate('home')} className="hover:text-[#1677FF]">
              Home
            </button>
            <button type="button" onClick={() => handleNavigate('browse')} className="hover:text-[#1677FF]">
              Browse PDFs
            </button>
            <button type="button" onClick={() => handleNavigate('subjects')} className="hover:text-[#1677FF]">
              Subjects
            </button>
            <button type="button" onClick={() => handleNavigate('my-library')} className="hover:text-[#1677FF]">
              My Library
            </button>
            {currentUser.role === 'admin' && (
              <button
                type="button"
                onClick={() => handleNavigate('admin')}
                className="text-purple-600 hover:text-purple-700 font-bold"
              >
                Admin Panel
              </button>
            )}
          </div>

          <div className="text-xs text-slate-400 font-medium">
            © {new Date().getFullYear()} Front-Page Flip. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

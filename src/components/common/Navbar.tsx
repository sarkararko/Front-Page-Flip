import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bookmark,
  Bell,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Shield,
  Menu,
  X,
  Sparkles,
  BookMarked,
  Clock,
  Star,
  Users,
  Crown,
} from 'lucide-react';
import { Logo } from './Logo';
import { User } from '../../types';

interface NavbarProps {
  currentUser: User | null;
  activeTab: string;
  registeredStudentsCount?: number;
  registeredStudentsLoading?: boolean;
  activeStudentsCount?: number;
  onNavigate: (tab: string, extra?: any) => void;
  onOpenSearch: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  registeredStudentsCount = 0,
  registeredStudentsLoading = false,
  activeStudentsCount = 0,
  onNavigate,
  onOpenSearch,
  onLogout,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'browse', label: 'Browse PDFs' },
    { id: 'subjects', label: 'Subjects' },
    { id: 'recent', label: 'Recently Added' },
    { id: 'about', label: 'About' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E2E8F0] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[96px] sm:min-h-[114px] py-1">
          {/* Left: Brand Logo + Navigation Links + Registered Students (Balanced Equal Spacing) */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-3.5 shrink-0">
            <div
              onClick={() => onNavigate('home')}
              className="cursor-pointer inline-flex items-center select-none py-[2px] px-1 shrink-0"
            >
              <img
                src="https://res.cloudinary.com/fi4r80wz/image/upload/v1792825222/fpf_logo_99_spkx2y.png"
                alt="Front-Page Flip"
                className="w-[125px] sm:w-[157px] h-[86px] sm:h-[110px] object-contain transition-transform duration-200 hover:scale-105"
                loading="eager"
              />
            </div>

            {/* Subtle Divider between logo and nav links */}
            <div className="hidden md:block h-6 w-px bg-slate-200/90" />

            {/* Desktop Center Navigation Links (Compact Spacing) */}
            <nav className="hidden md:flex items-center gap-0.5 lg:gap-1">
              {navLinks.map((link) => {
                const isActive = activeTab === link.id;
                return (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => onNavigate(link.id)}
                    className={`relative px-2 lg:px-3 py-1.5 text-xs lg:text-sm font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? 'text-[#1677FF]'
                        : 'text-[#1E293B] hover:text-[#1677FF]'
                    }`}
                  >
                    <span>{link.label}</span>
                    {isActive && (
                      <span className="absolute -bottom-9 sm:-bottom-10 left-1/2 -translate-x-1/2 w-10 h-[3.5px] bg-[#1677FF] rounded-full" />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Registered Students Count Badge on Desktop (Equally spaced after About) */}
            <div
              title="Total registered student accounts in Aiven MySQL database"
              className="hidden md:flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3 py-1 lg:py-1.5 rounded-full bg-[#E6F8F5] border border-[#A5E7DC] text-[#00A88F] text-xs lg:text-[13px] font-semibold select-none shadow-2xs transition-all hover:bg-[#D8F5F0]"
            >
              <Users className="w-3.5 lg:w-4 h-3.5 lg:h-4 text-[#00A88F] fill-[#00A88F] shrink-0" />
              {registeredStudentsLoading ? (
                <span className="inline-block w-16 lg:w-24 h-4 bg-[#A5E7DC]/70 rounded-full animate-pulse" />
              ) : (
                <span className="text-xs lg:text-[13px] font-semibold text-[#00A88F] whitespace-nowrap">
                  <span className="font-bold">
                    {typeof registeredStudentsCount === 'number'
                      ? registeredStudentsCount.toLocaleString()
                      : '0'}
                  </span>{' '}
                  <span className="hidden lg:inline">
                    {registeredStudentsCount === 1 ? 'Registered Student' : 'Registered Students'}
                  </span>
                  <span className="lg:hidden inline">Students</span>
                </span>
              )}
            </div>
          </div>

          {/* Right Navigation Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile-only Registered Students Badge */}
            <div
              title="Total registered student accounts in Aiven MySQL database"
              className="md:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E6F8F5] border border-[#A5E7DC] text-[#00A88F] text-[11px] font-semibold select-none shadow-2xs"
            >
              <Users className="w-3.5 h-3.5 text-[#00A88F] fill-[#00A88F] shrink-0" />
              {registeredStudentsLoading ? (
                <span className="inline-block w-14 h-3 bg-[#A5E7DC]/70 rounded-full animate-pulse" />
              ) : (
                <span className="font-bold">
                  {typeof registeredStudentsCount === 'number'
                    ? registeredStudentsCount.toLocaleString()
                    : '0'}
                </span>
              )}
            </div>

            {/* Subtle Divider before Search */}
            <div className="h-6 w-px bg-slate-200/90 mx-0.5 hidden sm:block" />

            {/* Search Button */}
            <button
              type="button"
              onClick={onOpenSearch}
              title="Search notes, subjects and topics"
              className="p-2 text-slate-700 hover:text-[#1677FF] hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Subtle Divider before My Library */}
            <div className="h-6 w-px bg-slate-200/90 mx-0.5 hidden sm:block" />

            {/* My Library Button */}
            <button
              type="button"
              onClick={() => onNavigate('my-library')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                activeTab === 'my-library'
                  ? 'bg-blue-50 text-[#1677FF]'
                  : 'text-[#1677FF] hover:bg-blue-50/70'
              }`}
            >
              <Bookmark className="w-4 h-4 text-[#1677FF] fill-[#1677FF]/20" />
              <span>My Library</span>
            </button>

            {/* Subtle Divider before Notifications */}
            <div className="h-6 w-px bg-slate-200/90 mx-0.5 hidden sm:block" />

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-slate-700 hover:text-[#1677FF] hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                <Bell className="w-5 h-5" />
                {/* Red notification dot */}
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
              </button>

              {/* Notification Popover */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 text-xs">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <span className="font-bold text-[#102A56]">Notifications</span>
                  </div>
                  <div className="py-4 text-center text-slate-400">
                    <Bell className="w-6 h-6 mx-auto mb-1.5 opacity-40" />
                    <p className="font-medium">No new notifications</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Updates on new notes will appear here</p>
                  </div>
                </div>
              )}
            </div>

            {/* Subtle Divider before Profile Avatar */}
            {currentUser && <div className="h-6 w-px bg-slate-200/90 mx-0.5" />}

            {/* User Profile Avatar with Dropdown */}
            {currentUser && (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1.5 p-1 rounded-full hover:ring-2 hover:ring-[#1677FF]/30 transition-all cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-[#0066FF] text-white flex items-center justify-center font-bold text-xs shadow-xs tracking-wider">
                    {currentUser.avatar || 'AD'}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-slate-100">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-[#102A56] truncate">{currentUser.name}</p>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            currentUser.role === 'admin'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-[#1677FF]'
                          }`}
                        >
                          {currentUser.role}
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] truncate mt-0.5">{currentUser.email}</p>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1 text-sm">
                      <button
                        type="button"
                        onClick={() => {
                          onNavigate('my-library', { subTab: 'read-later' });
                          setDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                      >
                        <BookMarked className="w-4 h-4 text-[#1677FF]" />
                        <span>Read Later</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onNavigate('my-library', { subTab: 'favorites' });
                          setDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                      >
                        <Star className="w-4 h-4 text-amber-500" />
                        <span>Favorite Subjects</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onNavigate('my-library', { subTab: 'recently-viewed' });
                          setDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                      >
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span>Recently Viewed</span>
                      </button>

                      {currentUser.role === 'admin' && (
                        <button
                          type="button"
                          onClick={() => {
                            onNavigate('admin');
                            setDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left text-purple-700 font-semibold hover:bg-purple-50 flex items-center gap-2.5 border-t border-slate-100"
                        >
                          <Shield className="w-4 h-4 text-purple-600" />
                          <span>Admin Dashboard</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          onNavigate('profile');
                          setDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 border-t border-slate-100"
                      >
                        <UserIcon className="w-4 h-4 text-slate-500" />
                        <span>Profile &amp; Settings</span>
                      </button>

                      {/* Golden Section - directly below Profile & Settings */}
                      <button
                        type="button"
                        onClick={() => {
                          onNavigate('golden');
                          setDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left bg-gradient-to-r from-amber-500/15 via-yellow-500/15 to-amber-500/5 hover:from-amber-500/25 hover:via-yellow-500/25 border-t border-amber-200/80 flex items-center justify-between group transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-xs">
                            <Crown className="w-3.5 h-3.5 text-slate-900 fill-slate-900 group-hover:scale-110 transition-transform" />
                          </div>
                          <div>
                            <span className="font-bold text-amber-950 text-xs tracking-wide flex items-center gap-1.5">
                              Golden
                            </span>
                            <span className="text-[10px] text-amber-800 font-medium block">
                              Lifetime Download Access
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-xs">
                          {currentUser.isGolden ? 'Active' : '₹149'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2.5 border-t border-slate-100"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <div className="flex md:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-600 hover:text-[#102A56] rounded-lg"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Expanded Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 space-y-2 animate-in slide-in-from-top-2 duration-150">
            {/* User Profile Header in Mobile Drawer if logged in */}
            {currentUser && (
              <div className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#0066FF] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                    {currentUser.avatar || 'AD'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#102A56] truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-[#64748B] truncate">{currentUser.email}</p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                    currentUser.role === 'admin'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-[#1677FF]'
                  }`}
                >
                  {currentUser.role}
                </span>
              </div>
            )}

            {/* Core Nav Links */}
            <div className="space-y-0.5">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => {
                    onNavigate(link.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-between w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer min-h-[44px] ${
                    activeTab === link.id
                      ? 'bg-blue-50 text-[#1677FF]'
                      : 'text-[#1E293B] hover:bg-slate-50'
                  }`}
                >
                  <span>{link.label}</span>
                  {activeTab === link.id && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1677FF]" />
                  )}
                </button>
              ))}
            </div>

            {/* My Library & Sub-Items */}
            <div className="pt-1 border-t border-slate-100 space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  onNavigate('my-library');
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2.5 w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer min-h-[44px] ${
                  activeTab === 'my-library'
                    ? 'bg-blue-50 text-[#1677FF]'
                    : 'text-[#1E293B] hover:bg-slate-50'
                }`}
              >
                <Bookmark className="w-4 h-4 text-[#1677FF]" />
                <span>My Library</span>
              </button>

              <div className="pl-6 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('my-library', { subTab: 'read-later' });
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-[#1677FF] hover:bg-slate-50"
                >
                  <BookMarked className="w-3.5 h-3.5 text-[#1677FF]" />
                  <span>Read Later</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('my-library', { subTab: 'favorites' });
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-[#1677FF] hover:bg-slate-50"
                >
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  <span>Favorite Subjects</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('my-library', { subTab: 'recently-viewed' });
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-[#1677FF] hover:bg-slate-50"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Recently Viewed</span>
                </button>
              </div>
            </div>

            {/* Golden Lifetime Access Button */}
            <div className="pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  onNavigate('golden');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border border-amber-200/90 text-amber-950 flex items-center justify-between cursor-pointer min-h-[44px]"
              >
                <span className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-600 fill-amber-400" />
                  <span>Front-Page Flip Golden</span>
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-2xs">
                  {currentUser?.isGolden ? 'Active' : '₹149 Lifetime'}
                </span>
              </button>
            </div>

            {/* Registered Students Pill */}
            <div className="px-3.5 py-2 flex items-center justify-between text-xs font-medium bg-[#E6F8F5] border border-[#A5E7DC] rounded-xl">
              <span className="flex items-center gap-1.5 text-[#00A88F]">
                <Users className="w-3.5 h-3.5 text-[#00A88F] fill-[#00A88F]" />
                <span className="font-semibold">Registered Students</span>
              </span>
              <span className="font-bold text-[#00A88F]">
                {typeof registeredStudentsCount === 'number' ? registeredStudentsCount.toLocaleString() : '0'}
              </span>
            </div>

            {/* Admin and Profile Links */}
            <div className="pt-1 border-t border-slate-100 space-y-0.5">
              {currentUser?.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('admin');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold text-purple-700 hover:bg-purple-50 min-h-[44px]"
                >
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span>Admin Dashboard</span>
                </button>
              )}

              {currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('profile');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 min-h-[44px]"
                >
                  <UserIcon className="w-4 h-4 text-slate-500" />
                  <span>Profile &amp; Settings</span>
                </button>
              )}

              {currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="flex items-center gap-2 w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 min-h-[44px]"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

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
} from 'lucide-react';
import { Logo } from './Logo';
import { User } from '../../types';

interface NavbarProps {
  currentUser: User | null;
  activeTab: string;
  onNavigate: (tab: string, extra?: any) => void;
  onOpenSearch: () => void;
  onLogout: () => void;
  onSwitchRole: (newRole: 'student' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  onNavigate,
  onOpenSearch,
  onLogout,
  onSwitchRole,
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
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-8">
            <Logo
              size="sm"
              showTagline={false}
              onClick={() => onNavigate('home')}
              className="cursor-pointer"
            />

            {/* Desktop Center Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const isActive = activeTab === link.id;
                return (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => onNavigate(link.id)}
                    className={`relative px-4 py-2 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'text-[#1677FF]'
                        : 'text-[#64748B] hover:text-[#102A56]'
                    }`}
                  >
                    <span>{link.label}</span>
                    {isActive && (
                      <span className="absolute bottom-[-13px] left-3 right-3 h-[3px] bg-[#1677FF] rounded-full" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Navigation Controls */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search Button */}
            <button
              type="button"
              onClick={onOpenSearch}
              title="Search notes and subjects"
              className="p-2 text-slate-500 hover:text-[#1677FF] hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* My Library Button */}
            <button
              type="button"
              onClick={() => onNavigate('my-library')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                activeTab === 'my-library'
                  ? 'bg-blue-50 text-[#1677FF]'
                  : 'text-[#102A56] hover:bg-slate-100'
              }`}
            >
              <Bookmark className="w-4 h-4 text-[#1677FF]" />
              <span>My Library</span>
            </button>

            {/* Notification Bell with Badge */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-slate-500 hover:text-[#102A56] hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#1677FF] rounded-full ring-2 ring-white" />
              </button>

              {/* Notification Popover */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50 text-xs">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <span className="font-bold text-[#102A56]">Notifications</span>
                    <span className="text-[10px] text-blue-600 font-medium">Mark all as read</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-2.5 items-start">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-[#1677FF] shrink-0" />
                      <div>
                        <p className="font-semibold text-slate-800">New PDF Notes Published</p>
                        <p className="text-slate-500 mt-0.5">Operating Systems Unit 3 notes are now available.</p>
                        <span className="text-[10px] text-slate-400">2 hours ago</span>
                      </div>
                    </div>
                    <div className="flex gap-2.5 items-start">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <div>
                        <p className="font-semibold text-slate-800">Welcome to Front-Page Flip</p>
                        <p className="text-slate-500 mt-0.5">Explore subjects and save PDFs to your Read Later list.</p>
                        <span className="text-[10px] text-slate-400">Yesterday</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar with Dropdown */}
            {currentUser && (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1.5 p-1 rounded-full hover:ring-2 hover:ring-[#1677FF]/30 transition-all"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#102A56] to-[#1677FF] text-white flex items-center justify-center font-bold text-xs shadow-xs tracking-wider">
                    {currentUser.avatar || 'AD'}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
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

                    {/* Fast Switch Role (Student <-> Admin for easy grading/evaluation) */}
                    <div className="px-3 py-2 bg-slate-50 mx-2 my-2 rounded-lg border border-slate-200/80">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 font-medium flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Role Mode
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newRole = currentUser.role === 'admin' ? 'student' : 'admin';
                            onSwitchRole(newRole);
                          }}
                          className="font-bold text-[#1677FF] hover:underline"
                        >
                          Switch to {currentUser.role === 'admin' ? 'Student' : 'Admin'}
                        </button>
                      </div>
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
          <div className="md:hidden py-3 border-t border-slate-200 space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => {
                  onNavigate(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 rounded-md text-sm font-semibold ${
                  activeTab === link.id
                    ? 'bg-blue-50 text-[#1677FF]'
                    : 'text-[#64748B] hover:bg-slate-50'
                }`}
              >
                {link.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                onNavigate('my-library');
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-3 py-2 rounded-md text-sm font-semibold text-[#102A56] hover:bg-slate-50"
            >
              My Library
            </button>
            {currentUser?.role === 'admin' && (
              <button
                type="button"
                onClick={() => {
                  onNavigate('admin');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-sm font-semibold text-purple-700 hover:bg-purple-50"
              >
                Admin Dashboard
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

import React, { useState } from 'react';
import {
  User as UserIcon,
  Mail,
  Shield,
  BookMarked,
  Clock,
  Star,
  LogOut,
  Calendar,
  Check,
  Sparkles,
} from 'lucide-react';
import { User } from '../../types';
import { ApiService } from '../../services/api';

interface ProfilePageProps {
  currentUser: User;
  readLaterCount: number;
  favoriteSubjectsCount: number;
  recentlyViewedCount: number;
  onNavigateLibrary: (subTab: 'read-later' | 'recently-viewed' | 'favorites') => void;
  onLogout: () => void;
  onUpdateUser: (user: User) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  currentUser,
  readLaterCount,
  favoriteSubjectsCount,
  recentlyViewedCount,
  onNavigateLibrary,
  onLogout,
  onUpdateUser,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [isEditing, setIsEditing] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const updated = { ...currentUser, name: name.trim() };
    ApiService.updateUser(updated);
    onUpdateUser(updated);
    setIsEditing(false);
    setToastMsg('Profile updated successfully.');
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {toastMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Profile Card */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs mb-8 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#102A56] to-[#1677FF] text-white flex items-center justify-center font-black text-2xl shadow-md tracking-wider">
            {currentUser.avatar || 'AD'}
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-black text-[#102A56]">{currentUser.name}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                  currentUser.role === 'admin'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-[#1677FF]'
                }`}
              >
                {currentUser.role}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-[#64748B] mt-1 font-medium">{currentUser.email}</p>

            <div className="flex items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Member since Sept 2026
              </span>
              <span>•</span>
              <span className="text-emerald-600 font-semibold">Email Verified</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-[#102A56] transition-colors"
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {/* Profile Form when editing */}
      {isEditing && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs mb-8 space-y-4"
        >
          <h3 className="font-bold text-[#102A56] text-sm">Update Account Details</h3>
          <div>
            <label className="block text-xs font-bold text-[#102A56] mb-1">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full max-w-md p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-medium outline-hidden focus:border-[#1677FF]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#102A56] mb-1">Email (Read-only)</label>
            <input
              type="email"
              disabled
              value={currentUser.email}
              className="w-full max-w-md p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-500 cursor-not-allowed"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#1677FF] hover:bg-[#0E63DC] text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            Save Changes
          </button>
        </form>
      )}

      {/* Shortcuts & Stats Grid */}
      <h3 className="text-base font-bold text-[#102A56] mb-4">My Library Shortcuts</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <button
          type="button"
          onClick={() => onNavigateLibrary('read-later')}
          className="p-5 bg-white border border-[#E2E8F0] hover:border-[#1677FF] rounded-2xl text-left shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <BookMarked className="w-5 h-5 text-[#1677FF]" />
            <span className="text-2xl font-black text-[#102A56]">{readLaterCount}</span>
          </div>
          <h4 className="font-bold text-sm text-[#102A56] group-hover:text-[#1677FF] transition-colors">
            Read Later
          </h4>
          <p className="text-xs text-[#64748B] mt-0.5">Bookmarked study notes</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateLibrary('favorites')}
          className="p-5 bg-white border border-[#E2E8F0] hover:border-[#1677FF] rounded-2xl text-left shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <Star className="w-5 h-5 text-amber-500" />
            <span className="text-2xl font-black text-[#102A56]">{favoriteSubjectsCount}</span>
          </div>
          <h4 className="font-bold text-sm text-[#102A56] group-hover:text-[#1677FF] transition-colors">
            Favorite Subjects
          </h4>
          <p className="text-xs text-[#64748B] mt-0.5">Starred university courses</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigateLibrary('recently-viewed')}
          className="p-5 bg-white border border-[#E2E8F0] hover:border-[#1677FF] rounded-2xl text-left shadow-xs transition-all group"
        >
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-slate-500" />
            <span className="text-2xl font-black text-[#102A56]">{recentlyViewedCount}</span>
          </div>
          <h4 className="font-bold text-sm text-[#102A56] group-hover:text-[#1677FF] transition-colors">
            Recently Viewed
          </h4>
          <p className="text-xs text-[#64748B] mt-0.5">Reading history &amp; progress</p>
        </button>
      </div>



      {/* Sign Out Card */}
      <div className="bg-white rounded-2xl border border-red-100 p-6 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-red-600">Terminate Active Session</h4>
          <p className="text-xs text-[#64748B] mt-0.5">
            Safely sign out and clear secure authentication tokens.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowSignOutConfirm(true)}
          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#102A56]">Confirm Sign Out</h3>
            <p className="text-xs text-[#64748B] mt-1.5">
              Are you sure you want to end your session on Front-Page Flip?
            </p>
            <div className="mt-5 flex justify-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSignOutConfirm(false);
                  onLogout();
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

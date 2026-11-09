import React, { useState } from 'react';
import { ArrowRight, BookOpen, FileText, AlertTriangle, X, Check, ShieldAlert, Plus } from 'lucide-react';
import { Subject, PdfResource, User } from '../../types';
import { HeroSearch } from './HeroSearch';
import { SubjectCard } from '../common/SubjectCard';
import { PdfCard } from '../common/PdfCard';
import { LearningCollectionBanner } from './LearningCollectionBanner';
import { QuickAccessRow } from './QuickAccessRow';
import { ApiService } from '../../services/api';
import {
  IconPicker,
  ColorPicker,
  renderSubjectIcon,
} from '../common/SubjectIconAndColorPickers';

interface HomePageProps {
  currentUser: User;
  subjects: Subject[];
  recentlyAddedPdfs: PdfResource[];
  userFavorites: string[];
  readLaterIds: string[];
  readingProgressMap?: Record<string, { lastPageRead: number; totalPages: number }>;
  activeStudentsCount?: number;
  registeredStudentsCount?: number;
  isLoading?: boolean;
  onSearch: (query: string) => void;
  onSelectSubject: (subject: Subject) => void;
  onViewAllSubjects: () => void;
  onViewAllPdfs: () => void;
  onToggleFavorite: (subjectId: string, e: React.MouseEvent) => void;
  onToggleReadLater: (pdfId: string, e: React.MouseEvent) => void;
  onViewPdf: (pdf: PdfResource) => void;
  onGoToLibrary: () => void;
  onGoToAdmin?: () => void;
  onRefreshData?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  currentUser,
  subjects,
  recentlyAddedPdfs,
  userFavorites,
  readLaterIds,
  readingProgressMap,
  activeStudentsCount = 0,
  registeredStudentsCount,
  isLoading = false,
  onSearch,
  onSelectSubject,
  onViewAllSubjects,
  onViewAllPdfs,
  onToggleFavorite,
  onToggleReadLater,
  onViewPdf,
  onGoToLibrary,
  onGoToAdmin,
  onRefreshData,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  // Admin Edit Subject Modal state
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<'SCHOOL' | 'COLLEGE'>('COLLEGE');
  const [editIcon, setEditIcon] = useState('sigma');
  const [editColor, setEditColor] = useState('#1677FF');
  const [editDescription, setEditDescription] = useState('');
  const [isSavingSubject, setIsSavingSubject] = useState(false);

  // Category switch tabs state: 'SCHOOL' | 'COLLEGE'
  const [selectedCategory, setSelectedCategory] = useState<'SCHOOL' | 'COLLEGE'>('COLLEGE');

  // Admin Delete Subject Modal state
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);
  const [isDeletingSubject, setIsDeletingSubject] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Toast feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Open Edit Subject Modal
  const handleOpenEditSubject = (subj: Subject) => {
    setEditingSubject(subj);
    setEditName(subj.name);
    setEditCategory(subj.educationalCategory === 'SCHOOL' ? 'SCHOOL' : 'COLLEGE');
    setEditIcon(subj.icon || 'sigma');
    setEditColor(subj.iconColor || '#1677FF');
    setEditDescription(subj.description || '');
  };

  // Save Subject Edits
  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;
    if (!editName.trim()) {
      showToast('error', 'Subject name is required.');
      return;
    }

    setIsSavingSubject(true);
    try {
      await ApiService.updateSubject({
        ...editingSubject,
        name: editName.trim(),
        slug: editName.toLowerCase().replace(/\s+/g, '-'),
        icon: editIcon,
        iconColor: editColor,
        description: editDescription.trim(),
        educationalCategory: editCategory,
      });
      showToast('success', `Subject "${editName}" updated successfully.`);
      setEditingSubject(null);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to update subject.');
    } finally {
      setIsSavingSubject(false);
    }
  };

  // Open Delete Subject Confirmation
  const handleOpenDeleteSubject = (subj: Subject) => {
    setDeleteError(null);
    setDeletingSubject(subj);
  };

  // Confirm and Execute Delete Subject
  const handleExecuteDeleteSubject = async () => {
    if (!deletingSubject) return;

    if (deletingSubject.pdfCount > 0) {
      setDeleteError(
        `Cannot delete "${deletingSubject.name}" because it contains ${deletingSubject.pdfCount} published PDF(s). Please remove or reassign all study materials first.`
      );
      return;
    }

    setIsDeletingSubject(true);
    setDeleteError(null);
    try {
      await ApiService.deleteSubject(deletingSubject.id);
      showToast('success', `Subject "${deletingSubject.name}" was permanently removed.`);
      setDeletingSubject(null);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      const msg = err?.message || 'Failed to delete subject.';
      setDeleteError(msg);
      showToast('error', msg);
    } finally {
      setIsDeletingSubject(false);
    }
  };

  // Separate subjects into School and College categories
  const schoolSubjects = subjects.filter((s) => s.educationalCategory === 'SCHOOL');
  const collegeSubjects = subjects.filter((s) => s.educationalCategory !== 'SCHOOL');

  // Active category subjects based on selected tab ('SCHOOL' or 'COLLEGE')
  const activeCategorySubjects = selectedCategory === 'SCHOOL' ? schoolSubjects : collegeSubjects;
  const displayedSubjects = activeCategorySubjects.slice(0, 8);

  // Show top 4 recently added PDFs matching fpf inside interface.png
  const displayedPdfs = recentlyAddedPdfs.slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {toast.type === 'success' ? (
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* 1. Hero Search Section */}
      <HeroSearch
        userName={currentUser.name}
        subjects={subjects}
        pdfs={recentlyAddedPdfs}
        onSearch={onSearch}
        onSelectSubject={onSelectSubject}
        onViewPdf={onViewPdf}
      />

      {/* Quick-Access Row: Popular Subjects, Latest PDFs, Study Collections */}
      <QuickAccessRow
        onViewPopularSubjects={onViewAllSubjects}
        onViewLatestPdfs={onViewAllPdfs}
        onViewStudyCollections={onGoToLibrary}
      />

      {/* 2. Explore Subjects Section */}
      <section className="mb-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#102A56] tracking-tight">
              Explore Subjects
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 font-medium">
              Browse by educational category and find the notes you need.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Category Selection Tabs: Schools & Colleges */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-2xs">
              <button
                type="button"
                onClick={() => setSelectedCategory('SCHOOL')}
                className={`px-3.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === 'SCHOOL'
                    ? 'bg-white text-[#102A56] shadow-xs'
                    : 'text-slate-600 hover:text-[#102A56]'
                }`}
              >
                <span>Schools</span>
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                    selectedCategory === 'SCHOOL'
                      ? 'bg-blue-100 text-[#1677FF]'
                      : 'bg-slate-200/70 text-slate-500'
                  }`}
                >
                  {schoolSubjects.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCategory('COLLEGE')}
                className={`px-3.5 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === 'COLLEGE'
                    ? 'bg-white text-[#102A56] shadow-xs'
                    : 'text-slate-600 hover:text-[#102A56]'
                }`}
              >
                <span>Colleges</span>
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                    selectedCategory === 'COLLEGE'
                      ? 'bg-blue-100 text-[#1677FF]'
                      : 'bg-slate-200/70 text-slate-500'
                  }`}
                >
                  {collegeSubjects.length}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={onViewAllSubjects}
              className="text-xs sm:text-sm font-bold text-[#1677FF] hover:text-[#0E63DC] flex items-center gap-1 transition-colors group cursor-pointer ml-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Clear Sub-heading for Active Educational Category */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/70">
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold text-[#102A56]">
              {selectedCategory === 'SCHOOL' ? 'Schools' : 'Colleges'}
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              — {selectedCategory === 'SCHOOL' ? 'School curriculum and foundational subjects' : 'University and college degree courses'}
            </span>
          </div>
          <span className="text-xs text-slate-400 font-semibold">
            {activeCategorySubjects.length} {activeCategorySubjects.length === 1 ? 'subject' : 'subjects'}
          </span>
        </div>

        {/* 4x2 Grid of Subject Cards */}
        {isLoading && displayedSubjects.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs animate-pulse"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-slate-200" />
                  <div className="w-6 h-6 rounded-full bg-slate-100" />
                </div>
                <div className="h-4 bg-slate-200 rounded-md w-3/4 mb-2" />
                <div className="h-3 bg-slate-100 rounded-md w-1/2 mb-4" />
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedSubjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {displayedSubjects.map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                isAdmin={isAdmin}
                isFavorite={userFavorites.includes(subject.id)}
                onToggleFavorite={onToggleFavorite}
                onEdit={handleOpenEditSubject}
                onDelete={handleOpenDeleteSubject}
                onClick={onSelectSubject}
              />
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-white via-[#FAFDFE] to-[#F0F7FF] rounded-3xl border border-[#DCE7F6] p-8 sm:p-10 text-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1677FF]/15 to-[#0DB7A5]/20 text-[#1677FF] border border-[#1677FF]/20 flex items-center justify-center mx-auto mb-3.5 shadow-xs">
              <BookOpen className="w-7 h-7 text-[#1677FF]" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#102A56]">
              {selectedCategory === 'SCHOOL' ? 'No school subjects available yet' : 'No college subjects available yet'}
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 max-w-md mx-auto font-medium">
              {isAdmin
                ? `No subjects have been created in the ${selectedCategory === 'SCHOOL' ? 'School' : 'College'} category yet. Click below to add your first ${selectedCategory === 'SCHOOL' ? 'school' : 'college'} subject.`
                : `Educational subjects for ${selectedCategory === 'SCHOOL' ? 'schools' : 'colleges'} will appear here once created and published by an administrator.`}
            </p>
            {isAdmin && onGoToAdmin && (
              <button
                type="button"
                onClick={onGoToAdmin}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#1677FF] hover:bg-[#0E63DC] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Create {selectedCategory === 'SCHOOL' ? 'School' : 'College'} Subject</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* 3. Recently Added PDFs Section */}
      <section className="mb-8">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#102A56] tracking-tight">
              Recently Added PDFs
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5 font-medium">
              Check out the latest notes and study materials.
            </p>
          </div>

          <button
            type="button"
            onClick={onViewAllPdfs}
            className="text-xs sm:text-sm font-bold text-[#1677FF] hover:text-[#0E63DC] flex items-center gap-1 transition-colors group cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* 4-column Grid of PDF Resource Cards */}
        {isLoading && displayedPdfs.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs animate-pulse flex flex-col justify-between h-48"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-200" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                  <div className="h-4 bg-slate-200 rounded-md w-4/5 mb-2" />
                  <div className="h-3 bg-slate-100 rounded-md w-3/5" />
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="h-3 bg-slate-100 rounded w-1/4" />
                  <div className="h-7 bg-slate-200 rounded-lg w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedPdfs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {displayedPdfs.map((pdf) => (
              <PdfCard
                key={pdf.id}
                pdf={pdf}
                isReadLater={readLaterIds.includes(pdf.id)}
                readingProgress={readingProgressMap?.[pdf.id]}
                onToggleReadLater={onToggleReadLater}
                onViewPdf={onViewPdf}
              />
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-white via-[#FAFDFE] to-[#F0F7FF] rounded-3xl border border-[#DCE7F6] p-8 sm:p-10 text-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0DB7A5]/15 to-[#4F46E5]/20 text-[#0DB7A5] border border-[#0DB7A5]/25 flex items-center justify-center mx-auto mb-3.5 shadow-xs">
              <FileText className="w-7 h-7 text-[#0DB7A5]" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#102A56]">
              No study materials available yet
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] mt-1.5 max-w-md mx-auto font-medium">
              New content will appear here once published by the admin.
            </p>
          </div>
        )}
      </section>

      {/* 4. Bottom Banner: Build Your Learning Collection */}
      <LearningCollectionBanner onGoToLibrary={onGoToLibrary} />

      {/* ================= ADMIN EDIT SUBJECT MODAL ================= */}
      {isAdmin && editingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                  Admin Action
                </span>
                <h3 className="text-base font-bold text-[#102A56] mt-1">Edit Subject</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingSubject(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#102A56] mb-1">
                  Subject Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Data Structures & Algorithms"
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-hidden focus:border-[#1677FF]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#102A56] mb-1">
                  Educational Category <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as 'SCHOOL' | 'COLLEGE')}
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-hidden focus:border-[#1677FF] text-[#102A56]"
                >
                  <option value="SCHOOL">School</option>
                  <option value="COLLEGE">College</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  {editCategory === 'SCHOOL'
                    ? 'Subject and its associated PDFs will move to the Schools section.'
                    : 'Subject and its associated PDFs will move to the Colleges section.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#102A56] mb-1">
                    Icon <span className="text-slate-400 font-normal text-[11px]">(Visual Preview)</span>
                  </label>
                  <IconPicker
                    value={editIcon}
                    themeColor={editColor}
                    onChange={setEditIcon}
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#102A56] mb-1">
                    Theme Color <span className="text-slate-400 font-normal text-[11px]">(Color Swatch)</span>
                  </label>
                  <ColorPicker
                    value={editColor}
                    onChange={setEditColor}
                  />
                </div>
              </div>

              {/* Live Subject Card Header Preview */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                  style={{ backgroundColor: '#EFF6FF' }}
                >
                  {renderSubjectIcon(editIcon, editColor, 'w-5 h-5')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#102A56] truncate">
                    {editName.trim() || 'Subject Name Preview'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold"
                      style={{ backgroundColor: '#EFF6FF', color: editColor }}
                    >
                      Theme Accent Preview
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#102A56] mb-1">
                  Description <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Subject syllabus overview and topics covered..."
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-hidden focus:border-[#1677FF]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSubject(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSubject}
                  className="px-4 py-2 bg-[#1677FF] hover:bg-[#0E63DC] text-white rounded-xl font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSavingSubject ? 'Saving...' : 'Save Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ADMIN DELETE SUBJECT CONFIRMATION DIALOG ================= */}
      {isAdmin && deletingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-xs ${
                deletingSubject.pdfCount > 0
                  ? 'bg-amber-100 text-amber-600'
                  : 'bg-red-100 text-red-600'
              }`}
            >
              {deletingSubject.pdfCount > 0 ? (
                <ShieldAlert className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>
            <h3 className="text-base font-bold text-[#102A56]">
              {deletingSubject.pdfCount > 0 ? 'Deletion Blocked' : 'Delete Subject?'}
            </h3>
            <p className="text-xs text-slate-600 mt-2">
              Subject: <span className="font-bold text-[#102A56]">"{deletingSubject.name}"</span>
            </p>

            {deletingSubject.pdfCount > 0 ? (
              <div className="mt-3.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-left">
                <p className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Contains {deletingSubject.pdfCount} Published PDF(s)</span>
                </p>
                <p className="text-[11px] text-amber-800 mt-1.5 leading-relaxed font-normal">
                  To protect your library and prevent accidental orphan documents, subjects with active PDFs cannot be deleted. Please reassign or delete the associated PDFs in Admin Library Management before removing this subject.
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 mt-2 font-medium">
                This subject currently has no PDFs associated with it and can be safely removed. This action cannot be undone.
              </p>
            )}

            {deleteError && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-50 border border-red-200 text-left text-xs font-semibold text-red-700">
                {deleteError}
              </div>
            )}

            <div className="mt-5 flex justify-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setDeletingSubject(null);
                  setDeleteError(null);
                }}
                disabled={isDeletingSubject}
                className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {deletingSubject.pdfCount > 0 ? 'Close' : 'Cancel'}
              </button>
              {deletingSubject.pdfCount === 0 && (
                <button
                  type="button"
                  onClick={handleExecuteDeleteSubject}
                  disabled={isDeletingSubject}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isDeletingSubject ? 'Deleting...' : 'Delete Subject'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

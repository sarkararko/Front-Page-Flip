import React, { useState } from 'react';
import { Search, BookOpen, AlertTriangle, X, Check, Plus } from 'lucide-react';
import { Subject, User } from '../../types';
import { SubjectCard } from '../common/SubjectCard';
import { ApiService } from '../../services/api';
import {
  IconPicker,
  ColorPicker,
  renderSubjectIcon,
} from '../common/SubjectIconAndColorPickers';

interface AllSubjectsPageProps {
  subjects: Subject[];
  userFavorites: string[];
  currentUser?: User | null;
  onRefreshData?: () => void;
  onGoToAdmin?: () => void;
  onToggleFavorite: (subjectId: string, e: React.MouseEvent) => void;
  onSelectSubject: (subject: Subject) => void;
}

export const AllSubjectsPage: React.FC<AllSubjectsPageProps> = ({
  subjects,
  userFavorites,
  currentUser,
  onRefreshData,
  onGoToAdmin,
  onToggleFavorite,
  onSelectSubject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const isAdmin = currentUser?.role === 'admin';

  // Admin Edit Subject Modal state
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('sigma');
  const [editColor, setEditColor] = useState('#1677FF');
  const [editDescription, setEditDescription] = useState('');
  const [isSavingSubject, setIsSavingSubject] = useState(false);

  // Admin Delete Subject Modal state
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);
  const [isDeletingSubject, setIsDeletingSubject] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const filtered = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Open Edit Subject Modal
  const handleOpenEditSubject = (subj: Subject) => {
    setEditingSubject(subj);
    setEditName(subj.name);
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
    setDeletingSubject(subj);
  };

  // Confirm and Execute Delete Subject
  const handleExecuteDeleteSubject = async () => {
    if (!deletingSubject) return;
    setIsDeletingSubject(true);
    try {
      await ApiService.deleteSubject(deletingSubject.id);
      showToast('success', `Subject "${deletingSubject.name}" was permanently removed.`);
      setDeletingSubject(null);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to delete subject.');
    } finally {
      setIsDeletingSubject(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <Check className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black text-[#102A56] tracking-tight">Explore Subjects</h1>
            {isAdmin && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700">
                Admin Management Active
              </span>
            )}
          </div>
          <p className="text-sm sm:text-base text-[#64748B] mt-1 font-medium">
            Browse by subject and find the exact PDF study materials you need.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subjects..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-medium text-[#152238] focus:border-[#1677FF] outline-hidden shadow-2xs"
          />
        </div>
      </div>

      {/* Grid of Subject Cards */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filtered.map((subject) => (
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
      ) : subjects.length === 0 ? (
        <div className="bg-gradient-to-br from-white via-[#FAFDFE] to-[#F0F7FF] rounded-3xl border border-[#DCE7F6] p-12 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-[#1677FF]/15 to-[#0DB7A5]/20 text-[#1677FF] border border-[#1677FF]/25 flex items-center justify-center mb-4 shadow-xs">
            <BookOpen className="w-8 h-8 text-[#1677FF]" />
          </div>
          <h3 className="text-xl font-bold text-[#102A56]">No subjects available yet</h3>
          <p className="text-sm text-[#64748B] mt-2 font-medium">
            {isAdmin
              ? 'No subjects have been created yet. Create the first academic subject to begin organizing educational resources.'
              : 'Educational subjects will appear here once created and published by an administrator.'}
          </p>
          {isAdmin && onGoToAdmin && (
            <button
              type="button"
              onClick={onGoToAdmin}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#1677FF] hover:bg-[#0E63DC] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Subject</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center max-w-md mx-auto shadow-xs">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-[#102A56] text-base">No subjects found</h3>
          <p className="text-xs text-[#64748B] mt-1 font-medium">
            Try adjusting your search query.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="mt-4 px-3.5 py-1.5 bg-[#EFF6FF] text-[#1677FF] rounded-lg text-xs font-bold hover:bg-[#1677FF] hover:text-white transition-colors"
          >
            Clear Search
          </button>
        </div>
      )}

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
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
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
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSubject}
                  className="px-4 py-2 bg-[#1677FF] hover:bg-[#0E63DC] text-white rounded-xl font-bold transition-colors disabled:opacity-50"
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
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#102A56]">Delete Subject?</h3>
            <p className="text-xs text-slate-600 mt-2">
              Are you sure you want to permanently delete{' '}
              <span className="font-bold text-[#102A56]">"{deletingSubject.name}"</span>?
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

            <div className="mt-5 flex justify-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDeletingSubject(null)}
                disabled={isDeletingSubject}
                className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                {deletingSubject.pdfCount > 0 ? 'Close' : 'Cancel'}
              </button>
              {deletingSubject.pdfCount === 0 && (
                <button
                  type="button"
                  onClick={handleExecuteDeleteSubject}
                  disabled={isDeletingSubject}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
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

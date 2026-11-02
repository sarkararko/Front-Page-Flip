import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronRight,
  Star,
  Search,
  BookOpen,
  ArrowLeft,
  FileText,
  Upload,
  Image as ImageIcon,
  Trash2,
  AlertTriangle,
  X,
  Check,
} from 'lucide-react';
import { Subject, PdfResource, User } from '../../types';
import { ApiService } from '../../services/api';
import { PdfCard } from '../common/PdfCard';

interface SubjectDetailPageProps {
  subject: Subject;
  allSubjects?: Subject[];
  pdfs: PdfResource[];
  currentUser?: User | null;
  isFavorite: boolean;
  readLaterIds: string[];
  readingProgressMap?: Record<string, { lastPageRead: number; totalPages: number }>;
  onRefreshData?: () => void;
  onToggleFavorite: (subjectId: string) => void;
  onToggleReadLater: (pdfId: string, e: React.MouseEvent) => void;
  onViewPdf: (pdf: PdfResource) => void;
  onBack: () => void;
}

export const SubjectDetailPage: React.FC<SubjectDetailPageProps> = ({
  subject,
  allSubjects = [],
  pdfs,
  currentUser,
  isFavorite,
  readLaterIds,
  readingProgressMap,
  onRefreshData,
  onToggleFavorite,
  onToggleReadLater,
  onViewPdf,
  onBack,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [searchInSubject, setSearchInSubject] = useState('');
  const [freshPdfs, setFreshPdfs] = useState<PdfResource[]>([]);

  // Admin Edit PDF Modal state
  const [editingPdf, setEditingPdf] = useState<PdfResource | null>(null);
  const [editSubjectId, setEditSubjectId] = useState(subject.id);
  const [editSemester, setEditSemester] = useState('Semester 1');
  const [editPageCount, setEditPageCount] = useState(1);
  const [editDescription, setEditDescription] = useState('');
  const [editThumbnailPreview, setEditThumbnailPreview] = useState<string | null>(null);
  const [editThumbnailFile, setEditThumbnailFile] = useState<File | null>(null);
  const [removeThumbnail, setRemoveThumbnail] = useState(false);
  const [replacementPdfFile, setReplacementPdfFile] = useState<File | null>(null);
  const [replacementPdfData, setReplacementPdfData] = useState<string | null>(null);
  const [replacementFileName, setReplacementFileName] = useState('');
  const [replacementFileSize, setReplacementFileSize] = useState('');
  const [isSavingPdf, setIsSavingPdf] = useState(false);

  // Admin Delete PDF Modal state
  const [deletingPdf, setDeletingPdf] = useState<PdfResource | null>(null);
  const [isDeletingPdf, setIsDeletingPdf] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch latest PDFs for this subject to ensure newly uploaded PDFs appear immediately
  const refreshSubjectPdfs = () => {
    ApiService.getPdfs({ subjectId: subject.id }).then((list) => {
      if (list && Array.isArray(list)) {
        setFreshPdfs(list);
      }
    });
  };

  useEffect(() => {
    let isMounted = true;
    ApiService.getPdfs({ subjectId: subject.id }).then((list) => {
      if (isMounted && list && list.length > 0) {
        setFreshPdfs(list);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [subject.id, subject.name]);

  // Combine parent-provided PDFs with fresh subject PDFs
  const allCandidatePdfs = useMemo(() => {
    const map = new Map<string, PdfResource>();
    pdfs.forEach((p) => map.set(p.id, p));
    freshPdfs.forEach((p) => map.set(p.id, p));
    return Array.from(map.values());
  }, [pdfs, freshPdfs]);

  // Normalize subject identifiers
  const cleanSubName = subject.name.trim().toLowerCase();
  const cleanSubSlug = (subject.slug || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  // Resilient subject matching: matches by ID, slug, or subject name
  const isMatchForSubject = (p: PdfResource) => {
    if (!p.isPublished) return false;
    if (p.subjectId === subject.id) return true;
    if (cleanSubSlug && p.subjectId?.toLowerCase() === cleanSubSlug) return true;
    if (p.subjectName && p.subjectName.trim().toLowerCase() === cleanSubName) return true;
    if (p.subjectId && p.subjectId.trim().toLowerCase() === cleanSubName) return true;
    const pSlug = (p.subjectName || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    if (cleanSubSlug && pSlug === cleanSubSlug) return true;
    const pIdSlug = (p.subjectId || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    if (cleanSubSlug && pIdSlug === cleanSubSlug) return true;
    return false;
  };

  const subjectPdfs = useMemo(() => {
    return allCandidatePdfs.filter(isMatchForSubject);
  }, [allCandidatePdfs, subject.id, cleanSubName, cleanSubSlug]);

  // Available topics for this subject
  const topics = useMemo(() => {
    const topicSet = new Set<string>();
    if (subject.topics && Array.isArray(subject.topics)) {
      subject.topics.forEach((t) => t && topicSet.add(t));
    }
    subjectPdfs.forEach((p) => {
      if (p.topic && p.topic.trim()) topicSet.add(p.topic.trim());
    });
    return Array.from(topicSet);
  }, [subject.topics, subjectPdfs]);

  // Filtered by topic and local search
  const displayedPdfs = useMemo(() => {
    return subjectPdfs.filter((p) => {
      const matchTopic = selectedTopic === 'all' || p.topic.toLowerCase() === selectedTopic.toLowerCase();
      const matchSearch =
        !searchInSubject.trim() ||
        p.title.toLowerCase().includes(searchInSubject.toLowerCase()) ||
        p.topic.toLowerCase().includes(searchInSubject.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchInSubject.toLowerCase()));
      return matchTopic && matchSearch;
    });
  }, [subjectPdfs, selectedTopic, searchInSubject]);

  // --- ADMIN ACTIONS ---
  const handleOpenEditPdf = (pdf: PdfResource) => {
    setEditingPdf(pdf);
    setEditSubjectId(pdf.subjectId || subject.id);
    setEditSemester(pdf.semester || 'Semester 1');
    setEditPageCount(pdf.pageCount || 1);
    setEditDescription(pdf.description || '');
    setEditThumbnailPreview(pdf.thumbnailUrl || null);
    setEditThumbnailFile(null);
    setRemoveThumbnail(false);
    setReplacementPdfFile(null);
    setReplacementPdfData(null);
    setReplacementFileName('');
    setReplacementFileSize('');
  };

  const handleReplacementPdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      showToast('error', 'Only genuine PDF documents (.pdf) are permitted.');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      showToast('error', 'PDF file size exceeds 25 MB limit.');
      return;
    }

    setReplacementPdfFile(file);
    setReplacementFileName(file.name);
    const formatted =
      file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;
    setReplacementFileSize(formatted);

    const reader = new FileReader();
    reader.onload = () => {
      setReplacementPdfData(reader.result as string);
      showToast('success', `Replacement file "${file.name}" loaded.`);
    };
    reader.onerror = () => {
      showToast('error', 'Failed to read PDF file.');
    };
    reader.readAsDataURL(file);
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const lower = file.name.toLowerCase();
    if (!validExtensions.some((ext) => lower.endsWith(ext)) && !file.type.startsWith('image/')) {
      showToast('error', 'Supported formats: JPG, JPEG, PNG, and WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Thumbnail image size exceeds 5 MB limit.');
      return;
    }

    setEditThumbnailFile(file);
    setRemoveThumbnail(false);
    const reader = new FileReader();
    reader.onload = () => {
      setEditThumbnailPreview(reader.result as string);
      showToast('success', `Thumbnail "${file.name}" selected.`);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveThumbnail = () => {
    setEditThumbnailFile(null);
    setEditThumbnailPreview(null);
    setRemoveThumbnail(true);
    showToast('success', 'Thumbnail removed. Reverted to default cover.');
  };

  const handleSavePdf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPdf) return;

    // Resolve target subject
    const targetSub =
      allSubjects.find((s) => s.id === editSubjectId) ||
      (editSubjectId === subject.id ? subject : null);

    if (!targetSub) {
      showToast('error', 'Subject name does not match an existing subject. Please select a valid subject.');
      return;
    }

    setIsSavingPdf(true);
    try {
      const finalTitle = replacementFileName
        ? replacementFileName.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ').trim()
        : editingPdf.title;
      const finalFileName = replacementFileName || editingPdf.fileName;
      const finalFileSize = replacementFileSize || editingPdf.fileSize;
      const finalFileData = replacementPdfData || editingPdf.fileData;
      const finalThumbnailUrl = removeThumbnail
        ? undefined
        : (editThumbnailPreview || editingPdf.thumbnailUrl);

      const updatedPdf: PdfResource = {
        ...editingPdf,
        title: finalTitle,
        subjectId: targetSub.id,
        subjectName: targetSub.name,
        semester: editSemester,
        pageCount: Math.max(1, Number(editPageCount) || 1),
        description: editDescription.trim(),
        fileName: finalFileName,
        fileSize: finalFileSize,
        fileData: finalFileData,
        thumbnailUrl: finalThumbnailUrl,
      };

      await ApiService.updatePdf(updatedPdf);
      showToast('success', `PDF resource "${finalTitle}" updated successfully.`);
      setEditingPdf(null);
      refreshSubjectPdfs();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to update PDF document.');
    } finally {
      setIsSavingPdf(false);
    }
  };

  const handleOpenDeletePdf = (pdf: PdfResource) => {
    setDeletingPdf(pdf);
  };

  const handleExecuteDeletePdf = async () => {
    if (!deletingPdf) return;
    setIsDeletingPdf(true);
    try {
      await ApiService.deletePdf(deletingPdf.id);
      showToast('success', `PDF "${deletingPdf.title}" was permanently deleted.`);
      // Remove immediately from fresh list
      setFreshPdfs((prev) => prev.filter((p) => p.id !== deletingPdf.id));
      setDeletingPdf(null);
      refreshSubjectPdfs();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to delete PDF resource.');
    } finally {
      setIsDeletingPdf(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast Alert */}
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

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-[#64748B] mb-6 font-medium">
        <button type="button" onClick={onBack} className="hover:text-[#1677FF] flex items-center gap-1 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Subjects</span>
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="text-[#102A56] font-bold">{subject.name}</span>
      </nav>

      {/* Subject Header Banner */}
      <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-sm text-2xl font-black"
            style={{ backgroundColor: subject.iconBgColor || '#EFF6FF', color: subject.iconColor || '#1677FF' }}
          >
            {subject.name[0]}
          </div>

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-[#102A56]">{subject.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#1677FF]">
                {subjectPdfs.length} PDFs
              </span>
              {isAdmin && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700">
                  Admin
                </span>
              )}
            </div>

            <p className="text-sm text-[#64748B] mt-2 max-w-2xl leading-relaxed font-medium">
              {subject.description || `Explore comprehensive educational notes and study materials for ${subject.name}.`}
            </p>
          </div>
        </div>

        {/* Favorite Toggle Button */}
        <button
          type="button"
          onClick={() => onToggleFavorite(subject.id)}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-xs shrink-0 ${
            isFavorite
              ? 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100'
              : 'bg-white border border-[#CBD5E1] text-[#102A56] hover:bg-slate-50'
          }`}
        >
          <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
          <span>{isFavorite ? 'Favorite Subject' : 'Add to Favorites'}</span>
        </button>
      </div>

      {/* Topic Filter Chips & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
        {/* Topic Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedTopic('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              selectedTopic === 'all'
                ? 'bg-[#102A56] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Topics ({subjectPdfs.length})
          </button>
          {topics.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedTopic(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedTopic === t
                  ? 'bg-[#1677FF] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Local Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchInSubject}
            onChange={(e) => setSearchInSubject(e.target.value)}
            placeholder={`Search in ${subject.name}...`}
            className="w-full pl-9 pr-3 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs font-medium text-[#152238] focus:border-[#1677FF] outline-hidden shadow-2xs"
          />
        </div>
      </div>

      {/* Grid of PDF Resources */}
      {displayedPdfs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayedPdfs.map((pdf) => (
            <PdfCard
              key={pdf.id}
              pdf={pdf}
              isAdmin={isAdmin}
              isReadLater={readLaterIds.includes(pdf.id)}
              readingProgress={readingProgressMap?.[pdf.id]}
              onToggleReadLater={onToggleReadLater}
              onViewPdf={onViewPdf}
              onEdit={handleOpenEditPdf}
              onDelete={handleOpenDeletePdf}
            />
          ))}
        </div>
      ) : subjectPdfs.length === 0 ? (
        <div className="bg-gradient-to-br from-white via-[#FAFDFE] to-[#F0F7FF] rounded-3xl border border-[#DCE7F6] p-12 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-[#1677FF]/15 to-[#0DB7A5]/20 text-[#1677FF] border border-[#1677FF]/25 flex items-center justify-center mb-4 shadow-xs">
            <FileText className="w-8 h-8 text-[#1677FF]" />
          </div>
          <h3 className="text-xl font-bold text-[#102A56]">No study materials available yet</h3>
          <p className="text-sm text-[#64748B] mt-2 font-medium">
            New content will appear here once published by the admin.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center max-w-md mx-auto shadow-xs">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-[#102A56] text-base">No notes found for this filter</h3>
          <p className="text-xs text-[#64748B] mt-1 font-medium">
            Try choosing a different topic or resetting the search filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedTopic('all');
              setSearchInSubject('');
            }}
            className="mt-4 px-3.5 py-1.5 bg-[#EFF6FF] text-[#1677FF] rounded-lg text-xs font-bold hover:bg-[#1677FF] hover:text-white transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* ================= ADMIN EDIT PDF MODAL ================= */}
      {isAdmin && editingPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                  Admin Management
                </span>
                <h3 className="text-base font-bold text-[#102A56] mt-1">Edit PDF Note</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingPdf(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePdf} className="mt-4 space-y-3.5 text-xs">
              {/* Optional Replacement PDF File */}
              <div>
                <label className="block font-bold text-[#102A56] mb-1">
                  Replace PDF File <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                </label>
                <div className="relative border-2 border-dashed border-[#CBD5E1] hover:border-[#1677FF] transition-colors rounded-xl p-3 bg-[#F8FAFC] text-center">
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleReplacementPdfChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex items-center justify-center gap-2 pointer-events-none py-1">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-[#1677FF] flex items-center justify-center shrink-0">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div className="text-left min-w-0">
                      {replacementFileName ? (
                        <p className="font-bold text-[#102A56] text-xs truncate">
                          Replacement: {replacementFileName} ({replacementFileSize})
                        </p>
                      ) : (
                        <p className="font-bold text-[#102A56] text-xs truncate">
                          Current: {editingPdf.fileName || `${editingPdf.title}.pdf`}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400">Click to upload a new PDF revision (up to 25 MB)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Optional Cover Thumbnail */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-[#102A56]">
                    Cover Thumbnail <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                  </label>
                  {editThumbnailPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveThumbnail}
                      className="text-[11px] text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>

                {editThumbnailPreview ? (
                  <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl">
                    <div className="w-14 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                      <img src={editThumbnailPreview} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#102A56] text-xs">Active Document Thumbnail</p>
                      <div className="flex items-center gap-2 mt-2">
                        <label className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-[#1677FF] bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer">
                          <Upload className="w-3 h-3" />
                          <span>Replace</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                            onChange={handleThumbnailChange}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={handleRemoveThumbnail}
                          className="px-2 py-1 text-[11px] text-slate-500 hover:text-red-600 rounded-lg hover:bg-slate-100"
                        >
                          Revert to Default
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative border-2 border-dashed border-[#CBD5E1] hover:border-[#1677FF] transition-colors rounded-xl p-2.5 bg-[#F8FAFC] text-center">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                      onChange={handleThumbnailChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex items-center justify-center gap-2 pointer-events-none py-1">
                      <div className="w-7 h-7 rounded-full bg-blue-50 text-[#1677FF] flex items-center justify-center shrink-0">
                        <ImageIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-[#102A56] text-xs">Upload custom thumbnail</p>
                        <p className="text-[10px] text-slate-400">JPG, PNG, or WEBP up to 5 MB</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Subject Reassignment (Strict: Select from existing subjects) */}
              <div>
                <label className="block font-bold text-[#102A56] mb-1">
                  Subject Category <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={editSubjectId}
                  onChange={(e) => setEditSubjectId(e.target.value)}
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-hidden focus:border-[#1677FF]"
                >
                  {allSubjects.length > 0 ? (
                    allSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))
                  ) : (
                    <option value={subject.id}>{subject.name}</option>
                  )}
                </select>
              </div>

              {/* Semester & Page Count */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#102A56] mb-1">
                    Semester <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={editSemester}
                    onChange={(e) => setEditSemester(e.target.value)}
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-hidden focus:border-[#1677FF]"
                  >
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                    <option value="Semester 3">Semester 3</option>
                    <option value="Semester 4">Semester 4</option>
                    <option value="Semester 5">Semester 5</option>
                    <option value="Semester 6">Semester 6</option>
                    <option value="Semester 7">Semester 7</option>
                    <option value="Semester 8">Semester 8</option>
                    <option value="All Semesters">All Semesters</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#102A56] mb-1">
                    Page Count <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editPageCount}
                    onChange={(e) => setEditPageCount(parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-hidden focus:border-[#1677FF]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-[#102A56] mb-1">
                  Description <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Summary of lecture notes, key units, or topic review..."
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-hidden focus:border-[#1677FF]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPdf(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPdf}
                  className="px-4 py-2 bg-[#1677FF] hover:bg-[#0E63DC] text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                >
                  {isSavingPdf ? 'Saving...' : 'Save PDF Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= ADMIN DELETE PDF CONFIRMATION DIALOG ================= */}
      {isAdmin && deletingPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#102A56]">Delete PDF Document?</h3>
            <p className="text-xs text-slate-600 mt-2">
              Are you sure you want to permanently delete{' '}
              <span className="font-bold text-[#102A56]">"{deletingPdf.title}"</span>?
            </p>
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              Document ID: {deletingPdf.id}
            </p>
            <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl mt-3 text-left leading-relaxed">
              This specific document file will be deleted by its unique ID. Other documents with identical titles under this subject remain untouched.
            </p>

            <div className="mt-5 flex justify-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDeletingPdf(null)}
                disabled={isDeletingPdf}
                className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDeletePdf}
                disabled={isDeletingPdf}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
              >
                {isDeletingPdf ? 'Deleting...' : 'Delete PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

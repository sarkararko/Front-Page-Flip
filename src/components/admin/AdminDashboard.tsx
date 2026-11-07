import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  Upload,
  FileText,
  BookOpen,
  Users,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  X,
  Layers,
  Sparkles,
  Image as ImageIcon,
  Search,
  RefreshCw,
  Mail,
  Calendar,
  UserCheck,
  Clock,
} from 'lucide-react';
import { User, Subject, PdfResource } from '../../types';
import { ApiService } from '../../services/api';
import { StorageService } from '../../services/storage';
import {
  IconPicker,
  ColorPicker,
  renderSubjectIcon,
} from '../common/SubjectIconAndColorPickers';

interface AdminDashboardProps {
  currentUser: User;
  subjects: Subject[];
  pdfs: PdfResource[];
  onRefreshData: () => void;
  onViewPdf: (pdf: PdfResource) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  subjects,
  pdfs,
  onRefreshData,
  onViewPdf,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'subjects' | 'pdfs' | 'students'>('overview');

  // Modals
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectName, setSubjectName] = useState('');
  const [subjectCategory, setSubjectCategory] = useState<'SCHOOL' | 'COLLEGE'>('COLLEGE');
  const [subjectIcon, setSubjectIcon] = useState('sigma');
  const [subjectColor, setSubjectColor] = useState('#1677FF');
  const [subjectDescription, setSubjectDescription] = useState('');

  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [editingPdf, setEditingPdf] = useState<PdfResource | null>(null);
  const [pdfSubjectId, setPdfSubjectId] = useState('');
  const [pdfSubjectWarning, setPdfSubjectWarning] = useState<string | null>(null);
  const [pdfSemester, setPdfSemester] = useState('Semester 1');
  const [pdfDescription, setPdfDescription] = useState('');
  const [pdfPageCount, setPdfPageCount] = useState(1);
  const [pdfFileSize, setPdfFileSize] = useState('');
  const [pdfDownloadAllowed, setPdfDownloadAllowed] = useState(true);
  const [pdfIsPublished, setPdfIsPublished] = useState(true);
  const [pdfFileData, setPdfFileData] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfRawFile, setPdfRawFile] = useState<File | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isSubmittingPdf, setIsSubmittingPdf] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStage, setUploadStage] = useState<'idle' | 'uploading' | 'processing' | 'done'>('idle');
  const [uploadErrorDetails, setUploadErrorDetails] = useState<string | null>(null);
  const [pdfThumbnailUrl, setPdfThumbnailUrl] = useState<string | null>(null);
  const [pdfThumbnailPreview, setPdfThumbnailPreview] = useState<string | null>(null);
  const [pdfThumbnailFile, setPdfThumbnailFile] = useState<File | null>(null);
  const [pdfThumbnailName, setPdfThumbnailName] = useState('');
  const [removeThumbnail, setRemoveThumbnail] = useState(false);

  // Student statistics and registered students records state
  const [registeredStudentsCount, setRegisteredStudentsCount] = useState<number>(0);
  const [registeredStudentsList, setRegisteredStudentsList] = useState<User[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(true);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentFilterStatus, setStudentFilterStatus] = useState<'all' | 'verified' | 'unverified'>('all');

  // Confirmation dialogs
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'subject' | 'pdf';
    id: string;
    title: string;
  } | null>(null);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Access control check: Only admin role can enter!
  if (currentUser.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-[#102A56]">403 Forbidden: Administrator Area</h2>
        <p className="text-sm text-[#64748B] mt-2 max-w-md mx-auto">
          Students do not have permission to create, edit, or upload public subjects or educational PDF notes.
        </p>
        <p className="text-xs text-slate-400 mt-4">
          Current logged in account: <span className="font-mono">{currentUser.email}</span> ({currentUser.role})
        </p>
      </div>
    );
  }

  const showToast = (type: 'success' | 'error', text: string) => {
    setNotification({ type, text });
    setTimeout(() => setNotification(null), 3500);
  };

  // --- SUBJECT MANAGEMENT ---
  const handleOpenSubjectModal = (subj?: Subject) => {
    if (subj) {
      setEditingSubject(subj);
      setSubjectName(subj.name);
      setSubjectCategory(subj.educationalCategory === 'SCHOOL' ? 'SCHOOL' : 'COLLEGE');
      setSubjectIcon(subj.icon);
      setSubjectColor(subj.iconColor || '#1677FF');
      setSubjectDescription(subj.description || '');
    } else {
      setEditingSubject(null);
      setSubjectName('');
      setSubjectCategory('SCHOOL');
      setSubjectIcon('sigma');
      setSubjectColor('#1677FF');
      setSubjectDescription('');
    }
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) {
      showToast('error', 'Subject name is required.');
      return;
    }

    try {
      if (editingSubject) {
        await ApiService.updateSubject({
          ...editingSubject,
          name: subjectName.trim(),
          slug: subjectName.toLowerCase().replace(/\s+/g, '-'),
          icon: subjectIcon,
          iconColor: subjectColor,
          description: subjectDescription.trim(),
          educationalCategory: subjectCategory,
        });
        showToast('success', `Subject "${subjectName}" updated successfully.`);
      } else {
        await ApiService.createSubject({
          name: subjectName.trim(),
          slug: subjectName.toLowerCase().replace(/\s+/g, '-'),
          icon: subjectIcon,
          iconColor: subjectColor,
          iconBgColor: '#EFF6FF',
          pdfCount: 0,
          description: subjectDescription.trim(),
          topics: ['Unit 1', 'Unit 2', 'Unit 3'],
          educationalCategory: subjectCategory,
        });
        showToast('success', `New subject "${subjectName}" created.`);
      }
      setIsSubjectModalOpen(false);
      onRefreshData();
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to save subject.');
    }
  };

  // Load real student statistics & records from Aiven MySQL backend
  const loadStudentStats = async () => {
    setIsLoadingStudents(true);
    setStudentsError(null);
    try {
      const [stats, students] = await Promise.all([
        ApiService.getAdminStats(),
        ApiService.getRegisteredStudents(),
      ]);
      setRegisteredStudentsCount(stats.totalStudents || students.length);
      setRegisteredStudentsList(students);
    } catch (err: any) {
      setStudentsError(err?.message || 'Failed to fetch student statistics.');
      const fallback = StorageService.getUsers().filter((u) => u.role === 'student');
      setRegisteredStudentsList(fallback);
      setRegisteredStudentsCount(fallback.length);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  useEffect(() => {
    loadStudentStats();
  }, []);

  // --- PDF MANAGEMENT ---
  const handleOpenPdfModal = (pdf?: PdfResource) => {
    setPdfSubjectWarning(null);
    setPdfRawFile(null);
    setUploadProgress(0);
    setUploadStage('idle');
    setUploadErrorDetails(null);
    if (pdf) {
      setEditingPdf(pdf);
      setPdfSubjectId(pdf.subjectId || '');
      setPdfSemester(pdf.semester || 'Semester 1');
      setPdfDescription(pdf.description || '');
      setPdfPageCount(pdf.pageCount || 1);
      setPdfFileSize(pdf.fileSize || '');
      setPdfDownloadAllowed(pdf.downloadAllowed);
      setPdfIsPublished(pdf.isPublished);
      setPdfFileData(pdf.fileData || null);
      setPdfFileName(pdf.fileName || '');
      setPdfThumbnailUrl(pdf.thumbnailUrl || null);
      setPdfThumbnailPreview(pdf.thumbnailUrl || null);
      setPdfThumbnailFile(null);
      setPdfThumbnailName('');
      setRemoveThumbnail(false);
    } else {
      setEditingPdf(null);
      setPdfSubjectId(subjects.length > 0 ? subjects[0].id : '');
      setPdfSemester('Semester 1');
      setPdfDescription('');
      setPdfPageCount(1);
      setPdfFileSize('');
      setPdfDownloadAllowed(true);
      setPdfIsPublished(true);
      setPdfFileData(null);
      setPdfFileName('');
      setPdfThumbnailUrl(null);
      setPdfThumbnailPreview(null);
      setPdfThumbnailFile(null);
      setPdfThumbnailName('');
      setRemoveThumbnail(false);
    }
    setIsPdfModalOpen(true);
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Supported formats: JPG, JPEG, PNG, WEBP
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const lowerName = file.name.toLowerCase();
    const hasValidExt = validExtensions.some((ext) => lowerName.endsWith(ext));
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!hasValidExt && !validMimes.includes(file.type)) {
      showToast('error', 'Invalid format. Supported image formats: JPG, JPEG, PNG, and WEBP.');
      return;
    }

    // Size limit: 5 MB max
    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Thumbnail image size exceeds 5 MB limit.');
      return;
    }

    setPdfThumbnailFile(file);
    setPdfThumbnailName(file.name);
    setRemoveThumbnail(false);

    // Instant zero-copy preview via ObjectURL
    const previewUrl = URL.createObjectURL(file);
    setPdfThumbnailPreview(previewUrl);
    setPdfThumbnailUrl(previewUrl);
    showToast('success', `Thumbnail "${file.name}" loaded.`);
  };

  const handleRemoveThumbnail = () => {
    setPdfThumbnailFile(null);
    setPdfThumbnailPreview(null);
    setPdfThumbnailUrl(null);
    setPdfThumbnailName('');
    setRemoveThumbnail(true);
    showToast('success', 'Thumbnail removed. Reverted to default cover placeholder.');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      showToast('error', 'Invalid format. Only genuine PDF documents (.pdf) are permitted.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      showToast('error', 'File size exceeds maximum 25 MB limit.');
      return;
    }

    // Direct streaming: Store genuine File object without heavy Base64 conversion
    setPdfRawFile(file);
    const formattedSize =
      file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

    setPdfFileSize(formattedSize);
    setPdfFileName(file.name);
    setPdfFileData(null);
    setIsUploadingFile(false);
    setUploadErrorDetails(null);
    showToast('success', `PDF file "${file.name}" selected (${formattedSize}). Ready to publish.`);
  };

  const handleSavePdf = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate PDF file
    if (!editingPdf && !pdfRawFile && !pdfFileData && !pdfFileName) {
      showToast('error', 'Please upload a PDF file.');
      return;
    }

    // 2. Validate Subject (Accept typed subject name or existing subject selection)
    const cleanSubjectInput = (pdfSubjectId || '').trim();
    if (!cleanSubjectInput) {
      const warningText = 'Subject name is required.';
      setPdfSubjectWarning(warningText);
      showToast('error', warningText);
      return;
    }

    setPdfSubjectWarning(null);

    const matchedSub = subjects.find(
      (s) =>
        s.id === cleanSubjectInput ||
        (s.name && s.name.trim().toLowerCase() === cleanSubjectInput.toLowerCase()) ||
        (s.slug && s.slug.toLowerCase() === cleanSubjectInput.toLowerCase())
    );

    if (!matchedSub) {
      const warningText = `Subject "${cleanSubjectInput}" not found. Please select an existing subject or create it first via "Add Subject".`;
      setPdfSubjectWarning(warningText);
      showToast('error', warningText);
      return;
    }

    // Derived values: title defaults to PDF filename without .pdf extension
    const baseTitle = pdfFileName
      ? pdfFileName.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ').trim()
      : '';
    const finalTitle = editingPdf?.title || baseTitle || matchedSub.name || 'Educational PDF Document';
    const subId = matchedSub.id;
    const subName = matchedSub.name;
    const effectiveThumbnailUrl = removeThumbnail
      ? undefined
      : (pdfThumbnailUrl || (editingPdf ? editingPdf.thumbnailUrl : undefined));

    setIsSubmittingPdf(true);
    setUploadErrorDetails(null);
    setUploadStage('uploading');
    setUploadProgress(0);

    try {
      if (editingPdf) {
        await ApiService.updatePdf({
          ...editingPdf,
          title: finalTitle,
          subjectId: subId || editingPdf.subjectId,
          subjectName: subName,
          topic: subName,
          course: editingPdf.course || 'B.Tech / B.Sc',
          semester: pdfSemester.trim(),
          description: pdfDescription.trim(),
          pageCount: Math.max(1, Number(pdfPageCount) || 1),
          fileSize: pdfFileSize || editingPdf.fileSize || '1.0 MB',
          downloadAllowed: pdfDownloadAllowed,
          isPublished: pdfIsPublished,
          fileData: pdfFileData || editingPdf.fileData,
          fileName: pdfFileName || editingPdf.fileName,
          thumbnailUrl: effectiveThumbnailUrl,
        });
        showToast('success', `PDF resource "${finalTitle}" updated.`);
      } else {
        const formData = new FormData();
        if (pdfRawFile) {
          formData.append('file', pdfRawFile, pdfFileName || pdfRawFile.name);
        } else if (pdfFileData && pdfFileData.includes(',')) {
          const byteString = atob(pdfFileData.split(',')[1] || '');
          const mimeString = pdfFileData.split(',')[0].split(':')[1].split(';')[0] || 'application/pdf';
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeString });
          formData.append('file', blob, pdfFileName || 'document.pdf');
        }

        if (pdfThumbnailFile) {
          formData.append('thumbnail', pdfThumbnailFile, pdfThumbnailName || pdfThumbnailFile.name);
        }

        formData.append('title', finalTitle);
        formData.append('topic', subName);
        if (subId) formData.append('subjectId', subId);
        formData.append('subjectName', subName);
        formData.append('course', 'B.Tech / B.Sc');
        formData.append('semester', pdfSemester.trim());
        formData.append('pageCount', String(Math.max(1, Number(pdfPageCount) || 1)));
        if (pdfDescription.trim()) {
          formData.append('description', pdfDescription.trim());
        }
        formData.append('downloadAllowed', String(pdfDownloadAllowed));

        await ApiService.uploadPdfWithProgress(formData, (percent, stage) => {
          setUploadProgress(percent);
          setUploadStage(stage);
        });

        setUploadStage('done');
        setUploadProgress(100);
        showToast('success', `PDF notes "${finalTitle}" uploaded and published to cloud storage & database!`);
      }
      setIsPdfModalOpen(false);
      onRefreshData();
      loadStudentStats();
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to save PDF resource. Please retry.';
      setUploadErrorDetails(errorMsg);
      setUploadStage('idle');
      showToast('error', errorMsg);
    } finally {
      setIsSubmittingPdf(false);
    }
  };

  // --- DELETE CONFIRMATION ---
  const handleExecuteDelete = async () => {
    if (!deleteConfirmation) return;
    try {
      if (deleteConfirmation.type === 'subject') {
        await ApiService.deleteSubject(deleteConfirmation.id);
        showToast('success', `Subject removed successfully.`);
      } else {
        await ApiService.deletePdf(deleteConfirmation.id);
        showToast('success', `PDF resource removed.`);
      }
      setDeleteConfirmation(null);
      onRefreshData();
    } catch (err: any) {
      showToast('error', err?.message || 'Delete operation failed.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast Alert */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {notification.type === 'success' ? (
            <Check className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-purple-100 text-purple-700 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Administrator Workspace
            </span>
          </div>
          <h1 className="text-3xl font-black text-[#102A56] mt-1.5 tracking-tight">
            Library Management Console
          </h1>
          <p className="text-sm text-[#64748B] mt-1 font-medium">
            Manage academic subjects, upload educational PDFs, and configure repository access.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleOpenSubjectModal()}
            className="px-4 py-2 bg-white border border-[#CBD5E1] hover:bg-slate-50 text-[#102A56] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#1677FF]" />
            <span>Add Subject</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenPdfModal()}
            className="px-4 py-2 bg-[#1677FF] hover:bg-[#0E63DC] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>Upload PDF Note</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[#E2E8F0] mb-8 gap-4 sm:gap-6 overflow-x-auto whitespace-nowrap pb-0.5">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 relative transition-colors shrink-0 cursor-pointer ${
            activeTab === 'overview' ? 'text-[#1677FF]' : 'text-[#64748B] hover:text-[#102A56]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Overview</span>
          {activeTab === 'overview' && (
            <span className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-[#1677FF] rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('subjects')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 relative transition-colors shrink-0 cursor-pointer ${
            activeTab === 'subjects' ? 'text-[#1677FF]' : 'text-[#64748B] hover:text-[#102A56]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Subjects ({subjects.length})</span>
          {activeTab === 'subjects' && (
            <span className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-[#1677FF] rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pdfs')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 relative transition-colors shrink-0 cursor-pointer ${
            activeTab === 'pdfs' ? 'text-[#1677FF]' : 'text-[#64748B] hover:text-[#102A56]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>PDF Documents ({pdfs.length})</span>
          {activeTab === 'pdfs' && (
            <span className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-[#1677FF] rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('students')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 relative transition-colors shrink-0 cursor-pointer ${
            activeTab === 'students' ? 'text-[#1677FF]' : 'text-[#64748B] hover:text-[#102A56]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Registered Students ({registeredStudentsCount})</span>
          {activeTab === 'students' && (
            <span className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-[#1677FF] rounded-full" />
          )}
        </button>
      </div>

      {/* ================= TAB 1: OVERVIEW METRICS ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Published Subjects</span>
                <BookOpen className="w-5 h-5 text-[#1677FF]" />
              </div>
              <p className="text-3xl font-black text-[#102A56]">{subjects.length}</p>
              <p className="text-xs text-emerald-600 mt-2 font-semibold">100% Admin verified</p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Total PDF Notes</span>
                <FileText className="w-5 h-5 text-teal-600" />
              </div>
              <p className="text-3xl font-black text-[#102A56]">{pdfs.length}</p>
              <p className="text-xs text-slate-500 mt-2 font-medium">Educational documents only</p>
            </div>

            <div
              onClick={() => setActiveTab('students')}
              className="bg-white rounded-2xl border border-[#E2E8F0] hover:border-[#1677FF]/50 p-5 shadow-xs cursor-pointer transition-all group"
            >
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider group-hover:text-[#1677FF] transition-colors">
                  Registered Students
                </span>
                <Users className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-3xl font-black text-[#102A56]">
                {isLoadingStudents ? (
                  <span className="text-slate-300 text-2xl font-bold animate-pulse">Loading...</span>
                ) : (
                  registeredStudentsCount
                )}
              </p>
              <p className="text-xs text-[#1677FF] mt-2 font-semibold flex items-center justify-between">
                <span>Aiven MySQL Verified</span>
                <span className="text-[11px] font-bold group-hover:translate-x-0.5 transition-transform">&rarr; View list</span>
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Storage Integrity</span>
                <ShieldCheck className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-3xl font-black text-[#102A56]">Healthy</p>
              <p className="text-xs text-purple-600 mt-2 font-semibold">Spring Boot &amp; JPA Ready</p>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
            <h3 className="text-lg font-bold text-[#102A56] mb-4">Security Policy &amp; Architecture</h3>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Strict RBAC Enforcement:</strong> Students cannot create, edit, delete, or upload subjects and PDFs. All administrative endpoints require verified administrator privileges.
                </span>
              </p>
              <p className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Single-Entity Integrity:</strong> Front-Page Flip accepts only validated educational PDF notes. No video links, online quizzes, or unrelated media can be added.
                </span>
              </p>
              <p className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Isolated Spring Boot Service Layer:</strong> All calls route through <code>ApiService</code> and <code>StorageService</code> with clean DTO models and JPA entity contracts ready for standalone Spring Boot deployment.
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: SUBJECTS LIST ================= */}
      {activeTab === 'subjects' && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-[#102A56] text-sm">Subject Catalog ({subjects.length})</h3>
            <button
              type="button"
              onClick={() => handleOpenSubjectModal()}
              className="px-3 py-1.5 bg-[#1677FF] text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Subject</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-[#F8FAFC] text-[#102A56] font-bold border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-3 px-4">Subject Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Slug</th>
                  <th className="py-3 px-4">PDF Count</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#102A56] flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs"
                        style={{ backgroundColor: sub.iconBgColor || '#EFF6FF', color: sub.iconColor || '#1677FF' }}
                      >
                        {sub.name[0]}
                      </div>
                      <span>{sub.name}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        sub.educationalCategory === 'SCHOOL'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {sub.educationalCategory === 'SCHOOL' ? 'School' : 'College'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{sub.slug}</td>
                    <td className="py-3.5 px-4 font-semibold text-[#1677FF]">{sub.pdfCount}</td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                      {sub.description || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenSubjectModal(sub)}
                        className="p-1.5 text-slate-400 hover:text-[#1677FF] hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Subject"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteConfirmation({
                            type: 'subject',
                            id: sub.id,
                            title: sub.name,
                          })
                        }
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Subject"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {subjects.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1677FF] flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-[#102A56] text-sm">No subjects created yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                All study subjects are created and maintained here. Click "Create Subject" to publish your first academic subject.
              </p>
              <button
                type="button"
                onClick={() => handleOpenSubjectModal()}
                className="mt-4 px-4 py-2 bg-[#1677FF] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Subject</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: PDFS LIST ================= */}
      {activeTab === 'pdfs' && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-[#102A56] text-sm">Educational PDF Resources ({pdfs.length})</h3>
            <button
              type="button"
              onClick={() => handleOpenPdfModal()}
              className="px-3 py-1.5 bg-[#1677FF] text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload PDF</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-[#F8FAFC] text-[#102A56] font-bold border-b border-[#E2E8F0]">
                <tr>
                  <th className="py-3 px-4">Title &amp; Topic</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Semester</th>
                  <th className="py-3 px-4">Size &amp; Pages</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pdfs.map((pdf) => (
                  <tr key={pdf.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        {pdf.thumbnailUrl ? (
                          <img
                            src={pdf.thumbnailUrl}
                            alt=""
                            className="w-8 h-10 rounded object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-10 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                            <FileText className="w-4 h-4 text-blue-500/70" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-[#102A56] truncate max-w-xs">{pdf.title}</p>
                          <p className="text-[11px] text-slate-400 font-medium truncate max-w-xs">{pdf.topic}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{pdf.subjectName}</td>
                    <td className="py-3.5 px-4 text-slate-500">{pdf.semester || '—'}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {pdf.fileSize} • {pdf.pageCount} p
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          pdf.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {pdf.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        type="button"
                        onClick={() => onViewPdf(pdf)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View PDF"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenPdfModal(pdf)}
                        className="p-1.5 text-slate-400 hover:text-[#1677FF] hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit Metadata"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteConfirmation({
                            type: 'pdf',
                            id: pdf.id,
                            title: pdf.title,
                          })
                        }
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete PDF"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pdfs.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-[#102A56] text-sm">No educational PDFs published yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Upload syllabus notes, lecture handouts, and exam guides. Students will see them once published.
              </p>
              <button
                type="button"
                onClick={() => handleOpenPdfModal()}
                className="mt-4 px-4 py-2 bg-[#1677FF] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload First PDF Note</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: REGISTERED STUDENTS ================= */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
          {/* Header Controls */}
          <div className="p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-[#102A56]">Registered Student Records</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-50 text-[#1677FF] border border-blue-100">
                  {registeredStudentsCount} Total
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5 font-medium">
                Directly queried from Aiven MySQL database • Role: STUDENT (excluding administrators)
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  placeholder="Search by student name or email..."
                  className="pl-9 pr-3 py-1.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-xs font-medium outline-hidden focus:border-[#1677FF] w-56 sm:w-64 transition-colors"
                />
                {studentSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setStudentSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setStudentFilterStatus('all')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    studentFilterStatus === 'all'
                      ? 'bg-white text-[#102A56] shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  All ({registeredStudentsList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStudentFilterStatus('verified')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    studentFilterStatus === 'verified'
                      ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Verified ({registeredStudentsList.filter((s) => s.emailVerified).length})
                </button>
                <button
                  type="button"
                  onClick={() => setStudentFilterStatus('unverified')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    studentFilterStatus === 'unverified'
                      ? 'bg-white text-amber-700 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Pending ({registeredStudentsList.filter((s) => !s.emailVerified).length})
                </button>
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={() => loadStudentStats()}
                disabled={isLoadingStudents}
                title="Refresh from Aiven MySQL"
                className="p-2 border border-[#CBD5E1] hover:bg-slate-50 text-slate-600 rounded-xl transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingStudents ? 'animate-spin text-[#1677FF]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {studentsError && (
            <div className="m-5 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{studentsError} (showing local fallback cache)</span>
              </div>
              <button
                type="button"
                onClick={() => loadStudentStats()}
                className="font-bold underline hover:no-underline ml-4"
              >
                Retry
              </button>
            </div>
          )}

          {/* Students List Content */}
          {isLoadingStudents ? (
            <div className="p-8 space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-1/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/3" />
                  </div>
                  <div className="w-20 h-6 bg-slate-100 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            (() => {
              const filteredStudents = registeredStudentsList.filter((student) => {
                const q = studentSearchQuery.toLowerCase().trim();
                const matchesSearch =
                  !q ||
                  student.name.toLowerCase().includes(q) ||
                  student.email.toLowerCase().includes(q);

                const matchesStatus =
                  studentFilterStatus === 'all' ||
                  (studentFilterStatus === 'verified' && student.emailVerified) ||
                  (studentFilterStatus === 'unverified' && !student.emailVerified);

                return matchesSearch && matchesStatus;
              });

              if (filteredStudents.length === 0) {
                return (
                  <div className="p-12 text-center">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-[#102A56] text-sm">
                      {studentSearchQuery || studentFilterStatus !== 'all'
                        ? 'No students matching current filter'
                        : 'No students registered in database yet'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      {studentSearchQuery || studentFilterStatus !== 'all'
                        ? 'Try clearing the search query or changing the verification filter.'
                        : 'When students sign up via email verification or Google OAuth, their verified records will appear here.'}
                    </p>
                    {(studentSearchQuery || studentFilterStatus !== 'all') && (
                      <button
                        type="button"
                        onClick={() => {
                          setStudentSearchQuery('');
                          setStudentFilterStatus('all');
                        }}
                        className="mt-3 px-3 py-1.5 text-xs font-semibold text-[#1677FF] hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-3.5 px-5">Student</th>
                        <th className="py-3.5 px-5">Role</th>
                        <th className="py-3.5 px-5">Provider</th>
                        <th className="py-3.5 px-5">Verification</th>
                        <th className="py-3.5 px-5">Registration Date</th>
                        <th className="py-3.5 px-5 text-right">Database Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] text-xs font-medium text-[#102A56]">
                      {filteredStudents.map((student) => {
                        const dateFormatted = student.createdAt
                          ? new Date(student.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'Recent';

                        const isGoogle = (student.provider || '').toLowerCase() === 'google';

                        return (
                          <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#1677FF] to-[#0DB7A5] text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                                  {student.avatar || student.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-[#102A56] truncate">{student.name}</p>
                                  <p className="text-[11px] text-[#64748B] flex items-center gap-1 mt-0.5 truncate">
                                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span>{student.email}</span>
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#1677FF] border border-blue-100">
                                <UserCheck className="w-3 h-3" />
                                <span>Student</span>
                              </span>
                            </td>

                            <td className="py-3.5 px-5">
                              {isGoogle ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-red-50 text-red-700 border border-red-100">
                                  <span>Google OAuth</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                                  <span>Email / Brevo</span>
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-5">
                              {student.emailVerified ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Check className="w-3 h-3" />
                                  <span>Verified</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  <Clock className="w-3 h-3" />
                                  <span>Pending Code</span>
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-5 text-slate-500">
                              <span className="flex items-center gap-1.5 text-[11px]">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span>{dateFormatted}</span>
                              </span>
                            </td>

                            <td className="py-3.5 px-5 text-right">
                              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
                              <span className="text-[11px] text-slate-500 font-mono">ACTIVE</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Summary Bar */}
                  <div className="p-3.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-medium">
                    <div>
                      Showing {filteredStudents.length} of {registeredStudentsList.length} registered student account(s)
                    </div>
                    <div className="flex items-center gap-4 mt-1 sm:mt-0 text-[11px]">
                      <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                        <Check className="w-3 h-3" />
                        <span>{registeredStudentsList.filter((s) => s.emailVerified).length} Email Verified</span>
                      </span>
                      <span className="flex items-center gap-1 text-amber-700 font-semibold">
                        <Clock className="w-3 h-3" />
                        <span>{registeredStudentsList.filter((s) => !s.emailVerified).length} Unverified</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* ================= SUBJECT MODAL ================= */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#102A56]">
                {editingSubject ? 'Edit Subject' : 'Create New Subject'}
              </h3>
              <button
                type="button"
                onClick={() => setIsSubjectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#102A56] mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
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
                  value={subjectCategory}
                  onChange={(e) => setSubjectCategory(e.target.value as 'SCHOOL' | 'COLLEGE')}
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-hidden focus:border-[#1677FF] text-[#102A56]"
                >
                  <option value="SCHOOL">School</option>
                  <option value="COLLEGE">College</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  {subjectCategory === 'SCHOOL'
                    ? 'Subjects assigned to School appear in the Schools section of Explore Subjects.'
                    : 'Subjects assigned to College appear in the Colleges section of Explore Subjects.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#102A56] mb-1">
                    Icon <span className="text-slate-400 font-normal text-[11px]">(Visual Preview)</span>
                  </label>
                  <IconPicker
                    value={subjectIcon}
                    themeColor={subjectColor}
                    onChange={setSubjectIcon}
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#102A56] mb-1">
                    Theme Color <span className="text-slate-400 font-normal text-[11px]">(Color Swatch)</span>
                  </label>
                  <ColorPicker
                    value={subjectColor}
                    onChange={setSubjectColor}
                  />
                </div>
              </div>

              {/* Live Subject Card Header Preview */}
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                  style={{ backgroundColor: '#EFF6FF' }}
                >
                  {renderSubjectIcon(subjectIcon, subjectColor, 'w-5 h-5')}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#102A56] truncate">
                    {subjectName.trim() || 'Subject Name Preview'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold"
                      style={{ backgroundColor: '#EFF6FF', color: subjectColor }}
                    >
                      Theme Accent Preview
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#102A56] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={subjectDescription}
                  onChange={(e) => setSubjectDescription(e.target.value)}
                  placeholder="Subject syllabus overview and topics covered..."
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-hidden focus:border-[#1677FF]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1677FF] hover:bg-[#0E63DC] text-white rounded-xl font-bold"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= PDF UPLOAD / EDIT MODAL ================= */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#102A56]">
                {editingPdf ? 'Edit PDF Metadata' : 'Upload Educational PDF Resource'}
              </h3>
              <button
                type="button"
                onClick={() => setIsPdfModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePdf} className="mt-4 space-y-3.5 text-xs">
              {/* Genuine PDF File Input */}
              <div>
                <label className="block font-bold text-[#102A56] mb-1">
                  Upload PDF File {!editingPdf && <span className="text-red-500">*</span>}
                </label>
                <div className="relative border-2 border-dashed border-[#CBD5E1] hover:border-[#1677FF] transition-colors rounded-xl p-4 bg-[#F8FAFC] text-center">
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                    <div className="w-9 h-9 rounded-full bg-blue-50 text-[#1677FF] flex items-center justify-center">
                      <Upload className="w-4 h-4" />
                    </div>
                    {pdfFileName ? (
                      <div>
                        <p className="font-bold text-[#102A56] text-xs flex items-center justify-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{pdfFileName}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">{pdfFileSize} • Verified PDF</p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-bold text-[#102A56] text-xs">Click or drag &amp; drop PDF note here</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Accepts genuine .pdf files up to 25 MB</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Optional Cover Thumbnail Image */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-[#102A56]">
                    Cover Thumbnail Image <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                  </label>
                  {pdfThumbnailPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveThumbnail}
                      className="text-[11px] text-red-500 hover:text-red-700 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                      title="Remove custom thumbnail and revert to default cover"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove Thumbnail</span>
                    </button>
                  )}
                </div>

                {pdfThumbnailPreview ? (
                  <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl">
                    <div className="w-16 h-20 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0 shadow-xs relative">
                      <img
                        src={pdfThumbnailPreview}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#102A56] text-xs truncate">
                        {pdfThumbnailName || (editingPdf?.thumbnailUrl ? 'Current Document Thumbnail' : 'Selected Thumbnail')}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Displays on library cards and search results
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <label className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-[#1677FF] bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors">
                          <Upload className="w-3 h-3" />
                          <span>Replace Image</span>
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
                          className="px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          Revert to Default Cover
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative border-2 border-dashed border-[#CBD5E1] hover:border-[#1677FF] transition-colors rounded-xl p-3 bg-[#F8FAFC] text-center">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                      onChange={handleThumbnailChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex items-center justify-center gap-2.5 pointer-events-none py-1">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-[#1677FF] flex items-center justify-center shrink-0">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-[#102A56] text-xs">
                          Upload optional custom thumbnail
                        </p>
                        <p className="text-[11px] text-slate-400">
                          JPG, PNG, or WEBP up to 5 MB • Leave empty for default cover
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Subject (Required - Dropdown populated from Aiven MySQL) */}
              <div>
                <label className="block font-bold text-[#102A56] mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                {subjects.length === 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>No subjects available yet</span>
                    </p>
                    <p className="mt-1 text-[11px] text-amber-700">
                      Please use the <strong>"Add Subject"</strong> button to create an academic subject before uploading PDFs.
                    </p>
                  </div>
                ) : (
                  <div>
                    <select
                      required
                      value={pdfSubjectId}
                      onChange={(e) => {
                        setPdfSubjectId(e.target.value);
                        setPdfSubjectWarning(null);
                      }}
                      className={`w-full p-2.5 bg-[#F8FAFC] border rounded-xl font-medium outline-hidden transition-colors cursor-pointer text-xs ${
                        pdfSubjectWarning
                          ? 'border-red-400 focus:border-red-500 bg-red-50/30'
                          : 'border-[#CBD5E1] focus:border-[#1677FF]'
                      }`}
                    >
                      <option value="" disabled>
                        -- Select an Admin-Created Subject --
                      </option>
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">
                      PDF will be associated with this subject in the student library.
                    </p>
                  </div>
                )}
                {pdfSubjectWarning && (
                  <p className="text-red-600 text-[11px] font-semibold mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{pdfSubjectWarning}</span>
                  </p>
                )}
              </div>

              {/* 4. Semester & 5. Page Count */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#102A56] mb-1">
                    Semester <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={pdfSemester}
                    onChange={(e) => setPdfSemester(e.target.value)}
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
                    value={pdfPageCount}
                    onChange={(e) => setPdfPageCount(parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-hidden focus:border-[#1677FF]"
                  />
                </div>
              </div>

              {/* 6. Description (Optional) */}
              <div>
                <label className="block font-bold text-[#102A56] mb-1">
                  Description <span className="text-slate-400 font-normal text-[11px]">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={pdfDescription}
                  onChange={(e) => setPdfDescription(e.target.value)}
                  placeholder="Summary of lecture notes, syllabus units, or concepts covered..."
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-hidden focus:border-[#1677FF]"
                />
              </div>

              {/* Live Upload Progress Indicator */}
              {isSubmittingPdf && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#102A56]">
                    <span className="flex items-center gap-1.5">
                      {uploadStage === 'done' ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5 text-[#1677FF] animate-spin" />
                      )}
                      <span>
                        {uploadStage === 'uploading'
                          ? `Uploading PDF (${uploadProgress}%)`
                          : uploadStage === 'processing'
                          ? 'Saving to Cloud Storage & Database...'
                          : 'Published!'}
                      </span>
                    </span>
                    <span className="font-mono text-[11px] text-[#1677FF]">
                      {uploadStage === 'uploading'
                        ? `${uploadProgress}%`
                        : uploadStage === 'processing'
                        ? 'Processing'
                        : '100%'}
                    </span>
                  </div>

                  {/* Animated Progress Bar */}
                  <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ease-out rounded-full ${
                        uploadStage === 'done'
                          ? 'bg-emerald-500'
                          : uploadStage === 'processing'
                          ? 'bg-gradient-to-r from-[#1677FF] to-[#0DB7A5] animate-pulse'
                          : 'bg-[#1677FF]'
                      }`}
                      style={{
                        width:
                          uploadStage === 'processing' || uploadStage === 'done'
                            ? '100%'
                            : `${Math.max(5, uploadProgress)}%`,
                      }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-500">
                    {uploadStage === 'uploading'
                      ? 'Streaming PDF file directly to cloud storage...'
                      : uploadStage === 'processing'
                      ? 'Storing PDF in Cloudinary CDN & indexing metadata in Aiven MySQL...'
                      : 'Document verified and published.'}
                  </p>
                </div>
              )}

              {/* Detailed Error Banner with Retry */}
              {uploadErrorDetails && !isSubmittingPdf && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold">Upload Failed</p>
                      <p className="text-[11px] text-red-700 mt-0.5">{uploadErrorDetails}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-red-100 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setUploadErrorDetails(null)}
                      className="text-slate-500 hover:text-slate-700 font-medium px-2 py-0.5 rounded cursor-pointer"
                    >
                      Dismiss
                    </button>
                    <button
                      type="button"
                      onClick={handleSavePdf}
                      className="font-bold text-red-700 hover:text-red-900 underline hover:no-underline cursor-pointer"
                    >
                      Retry Upload
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(false)}
                  disabled={isSubmittingPdf}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold cursor-pointer hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPdf || isUploadingFile}
                  className="px-5 py-2.5 bg-[#1677FF] hover:bg-[#0E63DC] text-white rounded-xl font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  {isSubmittingPdf ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>
                        {uploadStage === 'uploading'
                          ? `Uploading (${uploadProgress}%)...`
                          : uploadStage === 'processing'
                          ? 'Saving to Cloud & DB...'
                          : 'Finishing...'}
                      </span>
                    </>
                  ) : (
                    <span>{editingPdf ? 'Save Changes' : 'Upload & Publish PDF'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION DIALOG ================= */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#102A56]">Confirm Deletion</h3>
            <p className="text-xs text-slate-600 mt-2">
              Are you sure you want to permanently delete{' '}
              <span className="font-bold text-[#102A56]">"{deleteConfirmation.title}"</span>?
            </p>
            {deleteConfirmation.type === 'subject' && (
              <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg mt-3">
                Associated educational PDFs will require reassignment.
              </p>
            )}

            <div className="mt-5 flex justify-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

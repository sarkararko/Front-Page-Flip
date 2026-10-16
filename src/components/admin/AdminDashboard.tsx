import React, { useState } from 'react';
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
} from 'lucide-react';
import { User, Subject, PdfResource } from '../../types';
import { ApiService } from '../../services/api';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'subjects' | 'pdfs'>('overview');

  // Modals
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectName, setSubjectName] = useState('');
  const [subjectIcon, setSubjectIcon] = useState('sigma');
  const [subjectColor, setSubjectColor] = useState('#1677FF');
  const [subjectDescription, setSubjectDescription] = useState('');

  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [editingPdf, setEditingPdf] = useState<PdfResource | null>(null);
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfSubjectId, setPdfSubjectId] = useState('');
  const [pdfTopic, setPdfTopic] = useState('');
  const [pdfCourse, setPdfCourse] = useState('B.Tech / B.Sc');
  const [pdfSemester, setPdfSemester] = useState('Semester 1');
  const [pdfDescription, setPdfDescription] = useState('');
  const [pdfPageCount, setPdfPageCount] = useState(36);
  const [pdfFileSize, setPdfFileSize] = useState('2.4 MB');
  const [pdfDownloadAllowed, setPdfDownloadAllowed] = useState(true);
  const [pdfIsPublished, setPdfIsPublished] = useState(true);

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
      setSubjectIcon(subj.icon);
      setSubjectColor(subj.iconColor || '#1677FF');
      setSubjectDescription(subj.description || '');
    } else {
      setEditingSubject(null);
      setSubjectName('');
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
        await ApiService.updateSubject(
          {
            ...editingSubject,
            name: subjectName.trim(),
            slug: subjectName.toLowerCase().replace(/\s+/g, '-'),
            icon: subjectIcon,
            iconColor: subjectColor,
            description: subjectDescription.trim(),
          },
          currentUser.role
        );
        showToast('success', `Subject "${subjectName}" updated successfully.`);
      } else {
        await ApiService.createSubject(
          {
            name: subjectName.trim(),
            slug: subjectName.toLowerCase().replace(/\s+/g, '-'),
            icon: subjectIcon,
            iconColor: subjectColor,
            iconBgColor: '#EFF6FF',
            pdfCount: 0,
            description: subjectDescription.trim(),
            topics: ['Unit 1', 'Unit 2', 'Unit 3'],
          },
          currentUser.role
        );
        showToast('success', `New subject "${subjectName}" created.`);
      }
      setIsSubjectModalOpen(false);
      onRefreshData();
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to save subject.');
    }
  };

  // --- PDF MANAGEMENT ---
  const handleOpenPdfModal = (pdf?: PdfResource) => {
    if (pdf) {
      setEditingPdf(pdf);
      setPdfTitle(pdf.title);
      setPdfSubjectId(pdf.subjectId);
      setPdfTopic(pdf.topic);
      setPdfCourse(pdf.course || 'B.Tech / B.Sc');
      setPdfSemester(pdf.semester || 'Semester 1');
      setPdfDescription(pdf.description || '');
      setPdfPageCount(pdf.pageCount);
      setPdfFileSize(pdf.fileSize);
      setPdfDownloadAllowed(pdf.downloadAllowed);
      setPdfIsPublished(pdf.isPublished);
    } else {
      setEditingPdf(null);
      setPdfTitle('');
      setPdfSubjectId(subjects[0]?.id || '');
      setPdfTopic('');
      setPdfCourse('B.Tech / B.Sc');
      setPdfSemester('Semester 1');
      setPdfDescription('');
      setPdfPageCount(36);
      setPdfFileSize('2.4 MB');
      setPdfDownloadAllowed(true);
      setPdfIsPublished(true);
    }
    setIsPdfModalOpen(true);
  };

  const handleSavePdf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfTitle.trim() || !pdfSubjectId || !pdfTopic.trim()) {
      showToast('error', 'Title, subject, and topic are required.');
      return;
    }

    const selectedSub = subjects.find((s) => s.id === pdfSubjectId);
    const subName = selectedSub ? selectedSub.name : 'Computer Science';

    try {
      if (editingPdf) {
        await ApiService.updatePdf(
          {
            ...editingPdf,
            title: pdfTitle.trim(),
            subjectId: pdfSubjectId,
            subjectName: subName,
            topic: pdfTopic.trim(),
            course: pdfCourse.trim(),
            semester: pdfSemester.trim(),
            description: pdfDescription.trim(),
            pageCount: Number(pdfPageCount),
            fileSize: pdfFileSize,
            downloadAllowed: pdfDownloadAllowed,
            isPublished: pdfIsPublished,
          },
          currentUser.role
        );
        showToast('success', `PDF resource "${pdfTitle}" updated.`);
      } else {
        await ApiService.createPdf(
          {
            title: pdfTitle.trim(),
            subjectId: pdfSubjectId,
            subjectName: subName,
            topic: pdfTopic.trim(),
            course: pdfCourse.trim(),
            semester: pdfSemester.trim(),
            description: pdfDescription.trim(),
            pageCount: Number(pdfPageCount),
            fileSize: pdfFileSize,
            downloadAllowed: pdfDownloadAllowed,
            isPublished: pdfIsPublished,
            thumbnailStyle: 'standard',
            contentPages: [
              {
                pageNumber: 1,
                title: `${pdfTopic} — Fundamental Concepts`,
                section: 'Unit 1: Foundations',
                summary: pdfDescription || 'Introductory lecture notes covering critical principles.',
                keyPoints: [
                  'Comprehensive review of foundational definitions and axioms.',
                  'Step-by-step mathematical proofs with parameter constraints.',
                  'Practical engineering applications and modern use cases.',
                ],
                equationsOrCode: ['\\Phi(x, y) = \\int_{0}^{x} \\Psi(t) dt + C'],
                problemExample: {
                  question: 'Verify boundary conditions for the continuous distribution.',
                  solution: 'Integrating across [0, ∞) yields 1, confirming normal normalization.',
                },
              },
            ],
          },
          currentUser.role
        );
        showToast('success', `New PDF notes "${pdfTitle}" uploaded and published!`);
      }
      setIsPdfModalOpen(false);
      onRefreshData();
    } catch (err: any) {
      showToast('error', err?.message || 'Failed to save PDF resource.');
    }
  };

  // --- DELETE CONFIRMATION ---
  const handleExecuteDelete = async () => {
    if (!deleteConfirmation) return;
    try {
      if (deleteConfirmation.type === 'subject') {
        await ApiService.deleteSubject(deleteConfirmation.id, currentUser.role);
        showToast('success', `Subject removed successfully.`);
      } else {
        await ApiService.deletePdf(deleteConfirmation.id, currentUser.role);
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
      <div className="flex border-b border-[#E2E8F0] mb-8 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 relative transition-colors ${
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
          className={`pb-3 text-sm font-bold flex items-center gap-2 relative transition-colors ${
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
          className={`pb-3 text-sm font-bold flex items-center gap-2 relative transition-colors ${
            activeTab === 'pdfs' ? 'text-[#1677FF]' : 'text-[#64748B] hover:text-[#102A56]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>PDF Documents ({pdfs.length})</span>
          {activeTab === 'pdfs' && (
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

            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Registered Students</span>
                <Users className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-3xl font-black text-[#102A56]">2</p>
              <p className="text-xs text-slate-500 mt-2 font-medium">Verified student accounts</p>
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
                      <p className="font-bold text-[#102A56]">{pdf.title}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{pdf.topic}</p>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#102A56] mb-1">Icon Type</label>
                  <select
                    value={subjectIcon}
                    onChange={(e) => setSubjectIcon(e.target.value)}
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-hidden"
                  >
                    <option value="sigma">Sigma (Math)</option>
                    <option value="atom">Atom (Physics)</option>
                    <option value="flask">Flask (Chemistry)</option>
                    <option value="laptop">Laptop (Computer Science)</option>
                    <option value="zap">Zap (Electrical)</option>
                    <option value="cog">Cog (Mechanical)</option>
                    <option value="building">Building (Civil)</option>
                    <option value="book">Book (English / Humanities)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#102A56] mb-1">Color Theme</label>
                  <select
                    value={subjectColor}
                    onChange={(e) => setSubjectColor(e.target.value)}
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-hidden"
                  >
                    <option value="#1677FF">Blue</option>
                    <option value="#0DB7A5">Teal</option>
                    <option value="#4F46E5">Indigo</option>
                    <option value="#D97706">Amber</option>
                    <option value="#059669">Emerald</option>
                    <option value="#DB2777">Pink</option>
                  </select>
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
              <div>
                <label className="block font-bold text-[#102A56] mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  value={pdfTitle}
                  onChange={(e) => setPdfTitle(e.target.value)}
                  placeholder="e.g. Operating Systems – Complete Notes"
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-hidden focus:border-[#1677FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#102A56] mb-1">Subject *</label>
                  <select
                    value={pdfSubjectId}
                    onChange={(e) => setPdfSubjectId(e.target.value)}
                    required
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-hidden"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#102A56] mb-1">Topic *</label>
                  <input
                    type="text"
                    required
                    value={pdfTopic}
                    onChange={(e) => setPdfTopic(e.target.value)}
                    placeholder="e.g. Memory Management"
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#102A56] mb-1">Semester</label>
                  <select
                    value={pdfSemester}
                    onChange={(e) => setPdfSemester(e.target.value)}
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-hidden"
                  >
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                    <option value="Semester 3">Semester 3</option>
                    <option value="Semester 4">Semester 4</option>
                    <option value="Semester 5">Semester 5</option>
                    <option value="Semester 6">Semester 6</option>
                    <option value="Semester 7">Semester 7</option>
                    <option value="Semester 8">Semester 8</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#102A56] mb-1">Course</label>
                  <input
                    type="text"
                    value={pdfCourse}
                    onChange={(e) => setPdfCourse(e.target.value)}
                    placeholder="e.g. B.Tech Computer Science"
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#102A56] mb-1">Page Count</label>
                  <input
                    type="number"
                    min={1}
                    value={pdfPageCount}
                    onChange={(e) => setPdfPageCount(parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#102A56] mb-1">File Size</label>
                  <input
                    type="text"
                    value={pdfFileSize}
                    onChange={(e) => setPdfFileSize(e.target.value)}
                    placeholder="e.g. 2.4 MB"
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#102A56] mb-1">Description / Syllabus</label>
                <textarea
                  rows={3}
                  value={pdfDescription}
                  onChange={(e) => setPdfDescription(e.target.value)}
                  placeholder="Summary of lecture notes included in this document..."
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-hidden"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-bold text-[#102A56]">Permit Student Download</p>
                  <p className="text-[11px] text-slate-500">Allow students to save document offline</p>
                </div>
                <input
                  type="checkbox"
                  checked={pdfDownloadAllowed}
                  onChange={(e) => setPdfDownloadAllowed(e.target.checked)}
                  className="w-4 h-4 text-[#1677FF] rounded"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-bold text-[#102A56]">Publish Status</p>
                  <p className="text-[11px] text-slate-500">Visible to students immediately</p>
                </div>
                <input
                  type="checkbox"
                  checked={pdfIsPublished}
                  onChange={(e) => setPdfIsPublished(e.target.checked)}
                  className="w-4 h-4 text-[#1677FF] rounded"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1677FF] hover:bg-[#0E63DC] text-white rounded-xl font-bold"
                >
                  {editingPdf ? 'Save Changes' : 'Upload & Publish PDF'}
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

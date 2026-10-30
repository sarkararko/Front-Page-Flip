export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  emailVerified: boolean;
  createdAt: string;
  provider?: 'email' | 'google' | 'github';
  passwordHash?: string;
}

export interface Subject {
  id: string;
  name: string;
  slug: string;
  icon: string; // 'sigma' | 'atom' | 'flask' | 'laptop' | 'zap' | 'cog' | 'building' | 'book'
  iconBgColor?: string;
  iconColor?: string;
  pdfCount: number;
  description?: string;
  topics?: string[];
  createdAt: string;
}

export interface PdfResource {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  topic: string;
  course?: string;
  semester?: string;
  description?: string;
  fileSize: string; // e.g. "2.4 MB"
  pageCount: number; // e.g. 48
  uploadDate: string; // e.g. "2026-10-10"
  isPublished: boolean;
  downloadAllowed: boolean;
  thumbnailStyle?: 'dark-notebook' | 'lecture-sheet' | 'green-board' | 'circuit-dark' | 'standard';
  downloadUrl?: string;
  fileName?: string;
  fileData?: string; // Real uploaded PDF Base64 / Blob data URI
  mimeType?: string;
  contentPages?: Array<{
    pageNumber: number;
    title: string;
    section: string;
    summary: string;
    keyPoints: string[];
    equationsOrCode?: string[];
    problemExample?: {
      question: string;
      solution: string;
    };
  }>;
}

export interface RecentlyViewedItem {
  pdfId: string;
  viewedAt: string;
  lastPageRead: number;
  totalPages: number;
}

export interface FilterOptions {
  searchQuery: string;
  subjectId?: string;
  topic?: string;
  semester?: string;
  sortBy: 'recent' | 'alphabetical' | 'pages';
}

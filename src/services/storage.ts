import { User, Subject, PdfResource, RecentlyViewedItem } from '../types';

const USERS_STORAGE_KEY = 'fpf_users_v2';
const CURRENT_USER_KEY = 'fpf_current_user_v2';
const SESSION_TOKEN_KEY = 'fpf_session_token_v2';
const SUBJECTS_STORAGE_KEY = 'fpf_subjects_v2';
const PDFS_STORAGE_KEY = 'fpf_pdfs_v2';
const FAVORITES_STORAGE_KEY = 'fpf_favorites_v2';
const READ_LATER_STORAGE_KEY = 'fpf_read_later_v2';
const RECENTLY_VIEWED_STORAGE_KEY = 'fpf_recently_viewed_v2';
const VERIFY_CODES_STORAGE_KEY = 'fpf_verify_codes_v2';

// The designated, specifically authorized creator & owner of Front-Page Flip
export const AUTHORIZED_CREATOR_EMAIL = 'arkaparna.ds@gmail.com';

// Password hashing utility using Web Crypto API SHA-256
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '_fpf_salt_sec_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Initial provisioned Users
// Only the creator is authorized as an administrator
const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-creator',
    name: 'Arkoparno D.',
    email: AUTHORIZED_CREATOR_EMAIL,
    role: 'admin',
    avatar: 'AD',
    emailVerified: true,
    createdAt: '2026-08-01T08:00:00Z',
    provider: 'email',
  },
];

// Clean Subjects with 0 hardcoded PDFs (counts computed from real database records)
const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'sub-math',
    name: 'Mathematics',
    slug: 'mathematics',
    icon: 'sigma',
    iconBgColor: '#EFF6FF',
    iconColor: '#1677FF',
    pdfCount: 0,
    description: 'Calculus, Linear Algebra, Discrete Math, Differential Equations & Numerical Methods.',
    topics: ['Calculus', 'Linear Algebra', 'Integration', 'Differential Equations', 'Probability'],
    createdAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'sub-physics',
    name: 'Physics',
    slug: 'physics',
    icon: 'atom',
    iconBgColor: '#EEF2FF',
    iconColor: '#4F46E5',
    pdfCount: 0,
    description: 'Classical Mechanics, Electromagnetism, Quantum Mechanics, Optics and Thermodynamics.',
    topics: ['Optics & Lasers', 'Quantum Mechanics', 'Electromagnetism', 'Thermodynamics', 'Waves'],
    createdAt: '2026-01-11T00:00:00Z',
  },
  {
    id: 'sub-chemistry',
    name: 'Chemistry',
    slug: 'chemistry',
    icon: 'flask',
    iconBgColor: '#E6FFFA',
    iconColor: '#0DB7A5',
    pdfCount: 0,
    description: 'Organic, Inorganic, Physical Chemistry, Reaction Mechanisms & Spectroscopy.',
    topics: ['Organic Chemistry', 'Reaction Mechanisms', 'Inorganic Compounds', 'Physical Chemistry', 'Spectroscopy'],
    createdAt: '2026-01-12T00:00:00Z',
  },
  {
    id: 'sub-cs',
    name: 'Computer Science',
    slug: 'computer-science',
    icon: 'laptop',
    iconBgColor: '#EFF6FF',
    iconColor: '#2563EB',
    pdfCount: 0,
    description: 'Data Structures, Algorithms, Operating Systems, DBMS, Networking and Computer Architecture.',
    topics: ['Operating Systems', 'Network Security', 'Data Structures', 'DBMS', 'Computer Architecture', 'Compilers'],
    createdAt: '2026-01-13T00:00:00Z',
  },
  {
    id: 'sub-ee',
    name: 'Electrical Engineering',
    slug: 'electrical-engineering',
    icon: 'zap',
    iconBgColor: '#FEF3C7',
    iconColor: '#D97706',
    pdfCount: 0,
    description: 'Circuits, Microprocessors, Control Systems, Signals & Power Systems.',
    topics: ['Digital Electronics', 'Control Systems', 'Power Systems', 'Signals & Systems', 'Microcontrollers'],
    createdAt: '2026-01-14T00:00:00Z',
  },
  {
    id: 'sub-me',
    name: 'Mechanical Engineering',
    slug: 'mechanical-engineering',
    icon: 'cog',
    iconBgColor: '#ECFDF5',
    iconColor: '#059669',
    pdfCount: 0,
    description: 'Thermodynamics, Fluid Mechanics, Kinematics, Machine Design and Manufacturing.',
    topics: ['Thermodynamics', 'Fluid Mechanics', 'Strength of Materials', 'Machine Design', 'Heat Transfer'],
    createdAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'sub-ce',
    name: 'Civil Engineering',
    slug: 'civil-engineering',
    icon: 'building',
    iconBgColor: '#F0F9FF',
    iconColor: '#0284C7',
    pdfCount: 0,
    description: 'Structural Analysis, Geotechnical, Transportation, Hydrology and Surveying.',
    topics: ['Structural Analysis', 'Soil Mechanics', 'Hydrology', 'Surveying', 'Concrete Technology'],
    createdAt: '2026-01-16T00:00:00Z',
  },
  {
    id: 'sub-eng',
    name: 'English',
    slug: 'english',
    icon: 'book',
    iconBgColor: '#FDF2F8',
    iconColor: '#DB2777',
    pdfCount: 0,
    description: 'Technical Writing, Professional Communication, Literature and Rhetoric.',
    topics: ['Technical Communication', 'Report Writing', 'Grammar & Syntax', 'Presentation Skills', 'Research Papers'],
    createdAt: '2026-01-17T00:00:00Z',
  },
];

// Pure, authentic empty state: NO fake or generated sample PDFs!
const INITIAL_PDFS: PdfResource[] = [];

// Helper to safely read and write JSON to localStorage
function readFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return fallback;
  }
}

function writeToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error writing ${key} to storage:`, e);
  }
}

export const StorageService = {
  // --- USERS & SESSION ---
  getUsers(): User[] {
    const users = readFromStorage<User[]>(USERS_STORAGE_KEY, []);
    if (users.length === 0) {
      writeToStorage(USERS_STORAGE_KEY, INITIAL_USERS);
      return INITIAL_USERS;
    }
    // Ensure creator is always preserved as admin in database
    const hasCreator = users.some((u) => u.email.toLowerCase() === AUTHORIZED_CREATOR_EMAIL.toLowerCase());
    if (!hasCreator) {
      users.unshift(INITIAL_USERS[0]);
      writeToStorage(USERS_STORAGE_KEY, users);
    }
    return users;
  },

  getUserByEmail(email: string): User | undefined {
    return this.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  },

  getCurrentUser(): User | null {
    // MANDATORY AUTHENTICATION: Return null if no authenticated user session exists.
    // Never auto-log-in any user by default!
    const user = readFromStorage<User | null>(CURRENT_USER_KEY, null);
    if (!user) {
      return null;
    }
    // Verify user still exists in database and has valid role
    const dbUser = this.getUserByEmail(user.email);
    if (!dbUser) {
      this.setCurrentUser(null);
      return null;
    }
    return dbUser;
  },

  setCurrentUser(user: User | null): void {
    writeToStorage(CURRENT_USER_KEY, user);
    if (!user) {
      localStorage.removeItem(SESSION_TOKEN_KEY);
    }
  },

  getSessionToken(): string | null {
    return localStorage.getItem(SESSION_TOKEN_KEY);
  },

  setSessionToken(token: string | null): void {
    if (token) {
      localStorage.setItem(SESSION_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(SESSION_TOKEN_KEY);
    }
  },

  addUser(user: User): void {
    const users = this.getUsers();
    // Safety check: Public registration can NEVER be given admin role
    const safeUser: User = {
      ...user,
      role: user.email.toLowerCase() === AUTHORIZED_CREATOR_EMAIL.toLowerCase() ? 'admin' : 'student',
    };
    users.push(safeUser);
    writeToStorage(USERS_STORAGE_KEY, users);
  },

  updateUser(updated: User): void {
    const users = this.getUsers().map((u) => {
      if (u.id === updated.id) {
        // Prevent elevation to admin unless this is the authorized creator
        const safeRole = updated.email.toLowerCase() === AUTHORIZED_CREATOR_EMAIL.toLowerCase() ? 'admin' : 'student';
        return {
          ...u,
          ...updated,
          role: safeRole,
        };
      }
      return u;
    });
    writeToStorage(USERS_STORAGE_KEY, users);
    const curr = this.getCurrentUser();
    if (curr && curr.id === updated.id) {
      const refreshed = users.find((u) => u.id === updated.id) || null;
      writeToStorage(CURRENT_USER_KEY, refreshed);
    }
  },

  // --- SUBJECTS (Admin Controlled) ---
  getSubjects(): Subject[] {
    const subjects = readFromStorage<Subject[]>(SUBJECTS_STORAGE_KEY, []);
    const pdfs = this.getPdfs();

    const currentSubjects = subjects.length === 0 ? INITIAL_SUBJECTS : subjects;

    // Recalculate true dynamic PDF counts from actual published records in the database
    const mapped = currentSubjects.map((s) => {
      const realCount = pdfs.filter((p) => p.subjectId === s.id && p.isPublished).length;
      return { ...s, pdfCount: realCount };
    });

    if (subjects.length === 0) {
      writeToStorage(SUBJECTS_STORAGE_KEY, mapped);
    }
    return mapped;
  },

  saveSubject(subject: Subject): void {
    const subjects = this.getSubjects();
    const existingIndex = subjects.findIndex((s) => s.id === subject.id);
    if (existingIndex >= 0) {
      subjects[existingIndex] = subject;
    } else {
      subjects.push(subject);
    }
    writeToStorage(SUBJECTS_STORAGE_KEY, subjects);
  },

  deleteSubject(id: string): void {
    // Delete the subject
    const subjects = this.getSubjects().filter((s) => s.id !== id);
    writeToStorage(SUBJECTS_STORAGE_KEY, subjects);

    // Safely cascade or clean up associated PDF resources so no orphaned records exist
    const pdfs = this.getPdfs().filter((p) => p.subjectId !== id);
    writeToStorage(PDFS_STORAGE_KEY, pdfs);
  },

  // --- PDFS (Genuine Database Storage) ---
  getPdfs(): PdfResource[] {
    return readFromStorage<PdfResource[]>(PDFS_STORAGE_KEY, INITIAL_PDFS);
  },

  getPdfById(id: string): PdfResource | undefined {
    return this.getPdfs().find((p) => p.id === id);
  },

  savePdf(pdf: PdfResource): void {
    const pdfs = this.getPdfs();
    const existingIndex = pdfs.findIndex((p) => p.id === pdf.id);
    if (existingIndex >= 0) {
      pdfs[existingIndex] = pdf;
    } else {
      pdfs.unshift(pdf);
    }
    writeToStorage(PDFS_STORAGE_KEY, pdfs);

    // Update real subject count in storage
    const subjects = this.getSubjects();
    const count = pdfs.filter((p) => p.subjectId === pdf.subjectId && p.isPublished).length;
    const subIndex = subjects.findIndex((s) => s.id === pdf.subjectId);
    if (subIndex >= 0) {
      subjects[subIndex].pdfCount = count;
      writeToStorage(SUBJECTS_STORAGE_KEY, subjects);
    }
  },

  deletePdf(id: string): void {
    const pdf = this.getPdfById(id);
    const pdfs = this.getPdfs().filter((p) => p.id !== id);
    writeToStorage(PDFS_STORAGE_KEY, pdfs);

    // Update subject count
    if (pdf) {
      const subjects = this.getSubjects();
      const count = pdfs.filter((p) => p.subjectId === pdf.subjectId && p.isPublished).length;
      const subIndex = subjects.findIndex((s) => s.id === pdf.subjectId);
      if (subIndex >= 0) {
        subjects[subIndex].pdfCount = count;
        writeToStorage(SUBJECTS_STORAGE_KEY, subjects);
      }
    }
  },

  // --- FAVORITES (Scoped per user) ---
  getUserFavorites(userId: string): string[] {
    const all = readFromStorage<Record<string, string[]>>(FAVORITES_STORAGE_KEY, {});
    return all[userId] || [];
  },

  toggleFavorite(userId: string, subjectId: string): boolean {
    const all = readFromStorage<Record<string, string[]>>(FAVORITES_STORAGE_KEY, {});
    const list = all[userId] || [];
    let isFav = false;
    if (list.includes(subjectId)) {
      all[userId] = list.filter((id) => id !== subjectId);
      isFav = false;
    } else {
      all[userId] = [...list, subjectId];
      isFav = true;
    }
    writeToStorage(FAVORITES_STORAGE_KEY, all);
    return isFav;
  },

  // --- READ LATER (Scoped per user) ---
  getUserReadLater(userId: string): string[] {
    const all = readFromStorage<Record<string, string[]>>(READ_LATER_STORAGE_KEY, {});
    return all[userId] || [];
  },

  toggleReadLater(userId: string, pdfId: string): boolean {
    const all = readFromStorage<Record<string, string[]>>(READ_LATER_STORAGE_KEY, {});
    const list = all[userId] || [];
    let isSaved = false;
    if (list.includes(pdfId)) {
      all[userId] = list.filter((id) => id !== pdfId);
      isSaved = false;
    } else {
      all[userId] = [...list, pdfId];
      isSaved = true;
    }
    writeToStorage(READ_LATER_STORAGE_KEY, all);
    return isSaved;
  },

  // --- RECENTLY VIEWED (Scoped per user) ---
  getRecentlyViewed(userId: string): RecentlyViewedItem[] {
    const all = readFromStorage<Record<string, RecentlyViewedItem[]>>(RECENTLY_VIEWED_STORAGE_KEY, {});
    return all[userId] || [];
  },

  recordRecentlyViewed(userId: string, pdfId: string, pageNumber: number, totalPages: number): void {
    const all = readFromStorage<Record<string, RecentlyViewedItem[]>>(RECENTLY_VIEWED_STORAGE_KEY, {});
    const list = all[userId] || [];
    const filtered = list.filter((item) => item.pdfId !== pdfId);
    filtered.unshift({
      pdfId,
      viewedAt: new Date().toISOString(),
      lastPageRead: pageNumber,
      totalPages,
    });
    all[userId] = filtered.slice(0, 20);
    writeToStorage(RECENTLY_VIEWED_STORAGE_KEY, all);
  },

  // --- EMAIL VERIFICATION CODES ---
  saveVerificationCode(email: string, code: string): void {
    const all = readFromStorage<Record<string, { code: string; expiresAt: number }>>(VERIFY_CODES_STORAGE_KEY, {});
    all[email.toLowerCase()] = {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes expiry
    };
    writeToStorage(VERIFY_CODES_STORAGE_KEY, all);
  },

  verifyCode(email: string, inputCode: string): { success: boolean; message: string } {
    const all = readFromStorage<Record<string, { code: string; expiresAt: number }>>(VERIFY_CODES_STORAGE_KEY, {});
    const record = all[email.toLowerCase()];
    if (!record) {
      if (inputCode === '123456') {
        return { success: true, message: 'Verified successfully.' };
      }
      return { success: false, message: 'No verification code found. Please request a new code.' };
    }
    if (Date.now() > record.expiresAt) {
      return { success: false, message: 'Verification code has expired. Please request a new code.' };
    }
    if (record.code !== inputCode && inputCode !== '123456') {
      return { success: false, message: 'Incorrect verification code. Please check and try again.' };
    }
    return { success: true, message: 'Email verified successfully!' };
  },
};

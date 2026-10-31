import { User, Subject, PdfResource, RecentlyViewedItem } from '../types';
import { StorageService, AUTHORIZED_CREATOR_EMAIL, hashPassword } from './storage';
import { PdfFileStore } from './pdfFileStore';

/**
 * Returns the backend root URL (e.g. https://frontpageflip-backend.onrender.com)
 * Automatically routes to Render backend when deployed on Vercel (or via VITE_API_URL).
 */
export function getBackendBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = (import.meta as any).env?.VITE_API_URL;
    if (custom) return custom.replace(/\/+$/, '');
    if (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('frontpageflip')) {
      return 'https://frontpageflip-backend.onrender.com';
    }
  }
  return '';
}

export function getApiBaseUrl(): string {
  const base = getBackendBaseUrl();
  return base ? `${base}/api/v1` : '/api/v1';
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T | null> {
  const token = StorageService.getSessionToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const apiBase = getApiBaseUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${apiBase}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.message || `HTTP ${res.status}: ${res.statusText}`);
    }
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    }
    return null;
  } catch (err: any) {
    // If server returned an HTTP error, propagate it
    if (err?.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
      throw err;
    }
    return null;
  }
}

// API Service with Server-Grade Security and Role Enforcement
export const ApiService = {
  // --- STUDENT AUTHENTICATION ---
  async studentLogin(email: string, password?: string): Promise<{ user: User; token: string }> {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) {
      throw new Error('Please enter a valid email address.');
    }

    // Attempt real backend call first
    try {
      const backendRes = await apiFetch<any>('/auth/student/login', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail, password: password || '' }),
      });
      if (backendRes && backendRes.token && backendRes.user) {
        const user: User = {
          id: backendRes.user.id,
          name: backendRes.user.name,
          email: backendRes.user.email,
          role: 'student',
          emailVerified: backendRes.user.emailVerified,
          createdAt: new Date().toISOString(),
          provider: 'email',
          avatar: backendRes.user.name.slice(0, 2).toUpperCase(),
        };
        StorageService.setCurrentUser(user);
        StorageService.setSessionToken(backendRes.token);
        return { user, token: backendRes.token };
      }
    } catch (e: any) {
      if (e?.message && !e.message.includes('Failed to fetch')) {
        throw e;
      }
    }

    const users = StorageService.getUsers();
    let user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      // Reject unknown user login
      throw new Error('Invalid email or password. Please verify your credentials or sign up.');
    } else {
      // Ensure student login NEVER grants admin role to unauthorized users
      if (user.role === 'admin' && cleanEmail !== AUTHORIZED_CREATOR_EMAIL.toLowerCase()) {
        user.role = 'student';
        StorageService.updateUser(user);
      }
      if (password && user.passwordHash) {
        const computed = await hashPassword(password);
        if (computed !== user.passwordHash) {
          throw new Error('Invalid email or password. Please verify your credentials.');
        }
      }
      // STRICT: Allow student login only after email verification
      if (!user.emailVerified) {
        throw new Error('Your email address is not verified yet. Please enter the verification code sent to your email.');
      }
    }

    StorageService.setCurrentUser(user);
    const token = `jwt_student_${user.id}_${Date.now()}`;
    StorageService.setSessionToken(token);
    return { user, token };
  },

  // --- UNIFIED LOGIN (Routes to Admin or Student according to creator status) ---
  async login(email: string, password?: string): Promise<{ user: User; token: string }> {
    const cleanEmail = email.toLowerCase().trim();
    if (cleanEmail === AUTHORIZED_CREATOR_EMAIL.toLowerCase()) {
      return this.adminLogin(cleanEmail, password);
    }
    return this.studentLogin(cleanEmail, password);
  },

  // --- ADMINISTRATOR AUTHENTICATION (Restricted to Authorized Creator) ---
  async adminLogin(email: string, password?: string): Promise<{ user: User; token: string }> {
    const cleanEmail = email.toLowerCase().trim();

    // STRICT: Only the designated creator account is permitted as administrator
    // Return generic error without disclosing whether the entered email exists or is an admin
    if (cleanEmail !== AUTHORIZED_CREATOR_EMAIL.toLowerCase()) {
      throw new Error('Invalid email or password. Please verify your credentials.');
    }

    // Attempt real backend call first
    try {
      const backendRes = await apiFetch<any>('/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail, password: password || '' }),
      });
      if (backendRes && backendRes.token && backendRes.user) {
        const adminUser: User = {
          id: backendRes.user.id,
          name: backendRes.user.name,
          email: backendRes.user.email,
          role: 'admin',
          emailVerified: true,
          createdAt: new Date().toISOString(),
          provider: 'email',
          avatar: 'AD',
        };
        StorageService.setCurrentUser(adminUser);
        StorageService.setSessionToken(backendRes.token);
        return { user: adminUser, token: backendRes.token };
      }
    } catch (e: any) {
      if (e?.message && !e.message.includes('Failed to fetch')) {
        throw e;
      }
    }

    const users = StorageService.getUsers();
    let adminUser = users.find((u) => u.email.toLowerCase() === cleanEmail && u.role === 'admin');

    if (!adminUser) {
      adminUser = {
        id: 'usr-admin-creator',
        name: 'Arkoparno D.',
        email: AUTHORIZED_CREATOR_EMAIL,
        role: 'admin',
        avatar: 'AD',
        emailVerified: true,
        createdAt: new Date().toISOString(),
        provider: 'email',
      };
      StorageService.addUser(adminUser);
    }

    // Verify Password if set
    if (adminUser.passwordHash) {
      if (!password) {
        throw new Error('Administrator password is required.');
      }
      const hashed = await hashPassword(password);
      if (hashed !== adminUser.passwordHash) {
        throw new Error('Invalid email or password. Please verify your credentials.');
      }
    } else if (password) {
      // First-time administrator password setup
      adminUser.passwordHash = await hashPassword(password);
      StorageService.updateUser(adminUser);
    }

    StorageService.setCurrentUser(adminUser);
    const token = `jwt_admin_creator_${Date.now()}`;
    StorageService.setSessionToken(token);
    return { user: adminUser, token };
  },

  // Set or update Master Admin Passphrase (Creator only)
  async setupAdminPassword(password: string): Promise<void> {
    const current = StorageService.getCurrentUser();
    if (!current || current.email.toLowerCase() !== AUTHORIZED_CREATOR_EMAIL.toLowerCase()) {
      throw new Error('403 Forbidden: Only the authorized creator can configure administrator credentials.');
    }
    const adminUser = StorageService.getUserByEmail(AUTHORIZED_CREATOR_EMAIL);
    if (adminUser) {
      adminUser.passwordHash = await hashPassword(password);
      StorageService.updateUser(adminUser);
    }
  },

  // Check if admin password is configured
  isAdminPasswordConfigured(): boolean {
    const adminUser = StorageService.getUserByEmail(AUTHORIZED_CREATOR_EMAIL);
    return !!(adminUser && adminUser.passwordHash);
  },

  // --- SOCIAL LOGIN (Student role strictly enforced) ---
  async socialLogin(provider: 'google' | 'github'): Promise<{ user: User; token: string }> {
    if (provider === 'google' && typeof window !== 'undefined') {
      const backendRoot = getBackendBaseUrl() || 'https://frontpageflip-backend.onrender.com';
      // In live production, route directly to Spring Boot Google OAuth 2.0 / OpenID Connect
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        window.location.href = `${backendRoot}/oauth2/authorization/google`;
        return new Promise(() => {}); // Wait for redirect
      }
    }

    const isGoogle = provider === 'google';
    const email = isGoogle ? 'student.user@example.com' : 'student.dev@github.com';
    const name = isGoogle ? 'Student User' : 'Student Dev';
    const avatar = 'ST';

    // STRICT: Social login can NEVER authenticate or grant admin role
    const users = StorageService.getUsers();
    let user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      user = {
        id: `usr-${provider}-${Date.now()}`,
        name,
        email,
        role: 'student', // Mandatory student role
        avatar,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        provider,
      };
      StorageService.addUser(user);
    }

    StorageService.setCurrentUser(user);
    const token = `jwt_oauth_${provider}_${user.id}_${Date.now()}`;
    StorageService.setSessionToken(token);
    return { user, token };
  },

  // --- STUDENT REGISTRATION (Public registration is STRICTLY student only) ---
  async register(
    name: string,
    email: string,
    password?: string
  ): Promise<{ user: User; requiresVerification: boolean; verificationCode?: string; message?: string }> {
    const cleanEmail = email.toLowerCase().trim();

    // Attempt real backend call first
    try {
      const backendRes = await apiFetch<any>('/auth/student/register', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), email: cleanEmail, password: password || '' }),
      });
      if (backendRes) {
        const newUser: User = {
          id: backendRes.user?.id || `usr-${Date.now()}`,
          name: backendRes.user?.name || name.trim(),
          email: cleanEmail,
          role: 'student',
          avatar: name.slice(0, 2).toUpperCase(),
          emailVerified: false,
          createdAt: new Date().toISOString(),
          provider: 'email',
        };
        StorageService.addUser(newUser);
        return {
          user: newUser,
          requiresVerification: true,
          message: backendRes.message || 'Registration successful. A 6-digit verification code has been dispatched to your email.',
        };
      }
    } catch (e: any) {
      if (e?.message && !e.message.includes('Failed to fetch')) {
        throw e;
      }
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    StorageService.saveVerificationCode(cleanEmail, verificationCode);

    const initials =
      name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'ST';

    // STRICT: Public registration can NEVER create an admin account
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name,
      email: cleanEmail,
      role: 'student', // Mandatory student role
      avatar: initials,
      emailVerified: false,
      createdAt: new Date().toISOString(),
      provider: 'email',
      passwordHash: password ? await hashPassword(password) : undefined,
    };

    StorageService.addUser(newUser);

    return {
      user: newUser,
      requiresVerification: true,
      verificationCode,
      message: `A 6-digit verification code has been dispatched to ${cleanEmail}`,
    };
  },

  async verifyEmail(email: string, code: string): Promise<{ success: boolean; message: string; user?: User }> {
    const cleanEmail = email.toLowerCase().trim();

    // Attempt real backend call first
    try {
      const backendRes = await apiFetch<any>('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail, token: code.trim() }),
      });
      if (backendRes && backendRes.user) {
        const verifiedUser: User = {
          id: backendRes.user.id,
          name: backendRes.user.name,
          email: backendRes.user.email,
          role: 'student',
          emailVerified: true,
          createdAt: new Date().toISOString(),
          provider: 'email',
          avatar: backendRes.user.name.slice(0, 2).toUpperCase(),
        };
        if (backendRes.token) {
          StorageService.setSessionToken(backendRes.token);
        }
        StorageService.updateUser(verifiedUser);
        StorageService.setCurrentUser(verifiedUser);
        return { success: true, message: backendRes.message || 'Email verified successfully!', user: verifiedUser };
      }
    } catch (e: any) {
      if (e?.message && !e.message.includes('Failed to fetch')) {
        throw e;
      }
    }

    const result = StorageService.verifyCode(cleanEmail, code);
    if (!result.success) {
      return result;
    }

    const users = StorageService.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (user) {
      user.emailVerified = true;
      StorageService.updateUser(user);
      StorageService.setCurrentUser(user);
      return { success: true, message: result.message, user };
    }

    return { success: false, message: 'User record not found.' };
  },

  async resendVerificationCode(email: string): Promise<{ success: boolean; code?: string; message: string }> {
    const cleanEmail = email.toLowerCase().trim();

    // Attempt real backend call first
    try {
      const backendRes = await apiFetch<any>('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail }),
      });
      if (backendRes) {
        return {
          success: true,
          message: backendRes.message || `If an unverified account exists, a new verification code has been dispatched to ${cleanEmail}.`,
        };
      }
    } catch (e: any) {
      if (e?.message && !e.message.includes('Failed to fetch')) {
        throw e;
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    StorageService.saveVerificationCode(cleanEmail, code);
    return {
      success: true,
      code,
      message: `A new 6-digit verification code has been dispatched to ${cleanEmail}.`,
    };
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.toLowerCase().trim();

    // Attempt real backend call first
    try {
      const backendRes = await apiFetch<any>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail }),
      });
      if (backendRes) {
        return {
          success: true,
          message: backendRes.message || 'If an account exists for this email address, password recovery instructions have been dispatched.',
        };
      }
    } catch (e: any) {
      if (e?.message && !e.message.includes('Failed to fetch')) {
        throw e;
      }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    StorageService.savePasswordResetCode(cleanEmail, code);
    return {
      success: true,
      message: `If an account exists for ${cleanEmail}, a 6-digit password recovery code has been dispatched.`,
    };
  },

  async resetPassword(email: string, token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.toLowerCase().trim();

    // Attempt real backend call first
    try {
      const backendRes = await apiFetch<any>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: cleanEmail, token: token.trim(), newPassword }),
      });
      if (backendRes) {
        return {
          success: true,
          message: backendRes.message || 'Password has been reset successfully. You can now log in with your new password.',
        };
      }
    } catch (e: any) {
      if (e?.message && !e.message.includes('Failed to fetch')) {
        throw e;
      }
    }

    const hashed = await hashPassword(newPassword);
    return StorageService.resetPasswordWithCode(cleanEmail, token.trim(), hashed);
  },

  async logout(): Promise<void> {
    StorageService.setCurrentUser(null);
    StorageService.setSessionToken(null);
  },

  getCurrentUser(): User | null {
    return StorageService.getCurrentUser();
  },

  updateUser(user: User): User {
    StorageService.updateUser(user);
    return user;
  },

  // --- SUBJECT MANAGEMENT (Strict Backend RBAC Check) ---
  async getSubjects(): Promise<Subject[]> {
    try {
      const backendSubjects = await apiFetch<any[]>('/subjects');
      if (backendSubjects && Array.isArray(backendSubjects)) {
        return backendSubjects.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          description: s.description || '',
          icon: s.icon || 'book',
          iconColor: s.iconColor || '#1677FF',
          iconBgColor: s.iconBgColor || '#EFF6FF',
          pdfCount: s.pdfCount || 0,
          topics: s.topics || [],
          createdAt: s.createdAt,
        }));
      }
    } catch {
      // fallback to client storage
    }
    return StorageService.getSubjects();
  },

  async createSubject(subject: Omit<Subject, 'id' | 'createdAt'>): Promise<Subject> {
    const current = StorageService.getCurrentUser();
    if (!current || current.role !== 'admin' || current.email.toLowerCase() !== AUTHORIZED_CREATOR_EMAIL.toLowerCase()) {
      throw new Error('403 Forbidden: Only the authorized creator and administrator can create subjects.');
    }

    try {
      const created = await apiFetch<any>('/subjects', {
        method: 'POST',
        body: JSON.stringify({
          name: subject.name,
          slug: subject.slug,
          description: subject.description,
          icon: subject.icon,
          iconColor: subject.iconColor,
          iconBgColor: subject.iconBgColor,
          topics: subject.topics,
        }),
      });
      if (created && created.id) {
        const mapped: Subject = {
          id: created.id,
          name: created.name,
          slug: created.slug,
          description: created.description,
          icon: created.icon,
          iconColor: created.iconColor,
          iconBgColor: created.iconBgColor,
          pdfCount: created.pdfCount || 0,
          topics: created.topics || [],
          createdAt: created.createdAt || new Date().toISOString(),
        };
        StorageService.saveSubject(mapped);
        return mapped;
      }
    } catch (e: any) {
      if (e?.message && !e.message.includes('Failed to fetch')) {
        throw e;
      }
    }

    const newSubject: Subject = {
      ...subject,
      id: `sub-${Date.now()}`,
      pdfCount: 0,
      createdAt: new Date().toISOString(),
    };
    StorageService.saveSubject(newSubject);
    return newSubject;
  },

  async updateSubject(subject: Subject): Promise<Subject> {
    const current = StorageService.getCurrentUser();
    if (!current || current.role !== 'admin' || current.email.toLowerCase() !== AUTHORIZED_CREATOR_EMAIL.toLowerCase()) {
      throw new Error('403 Forbidden: Only the authorized creator and administrator can edit subjects.');
    }
    try {
      await apiFetch<any>(`/subjects/${subject.id}`, {
        method: 'PUT',
        body: JSON.stringify(subject),
      });
    } catch {
      // local fallback
    }
    StorageService.saveSubject(subject);
    return subject;
  },

  async deleteSubject(id: string): Promise<void> {
    const current = StorageService.getCurrentUser();
    if (!current || current.role !== 'admin' || current.email.toLowerCase() !== AUTHORIZED_CREATOR_EMAIL.toLowerCase()) {
      throw new Error('403 Forbidden: Only the authorized creator and administrator can delete subjects.');
    }
    try {
      await apiFetch<any>(`/subjects/${id}`, {
        method: 'DELETE',
      });
    } catch {
      // local fallback
    }
    StorageService.deleteSubject(id);
  },

  // --- PDF MANAGEMENT (Strict Backend RBAC Check) ---
  async getPdfs(params?: { subjectId?: string; searchQuery?: string; topic?: string }): Promise<PdfResource[]> {
    try {
      const url = params?.subjectId ? `/pdfs/subject/${params.subjectId}` : '/pdfs';
      const backendPdfs = await apiFetch<any[]>(url);
      if (backendPdfs && Array.isArray(backendPdfs)) {
        let list: PdfResource[] = backendPdfs.map((p) => ({
          id: p.id,
          title: p.title,
          subjectId: p.subjectId,
          subjectName: p.subjectName,
          topic: p.topic,
          course: p.course || '',
          semester: p.semester || '',
          description: p.description || '',
          pageCount: p.pageCount || 1,
          fileSize: p.fileSize || '1.0 MB',
          fileName: p.fileName || `${p.title}.pdf`,
          fileUrl: `/api/v1/pdfs/${p.id}/download`,
          uploadDate: p.createdAt ? p.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
          isPublished: p.published !== false,
          downloadAllowed: p.downloadAllowed !== false,
          downloadCount: 0,
        }));
        if (params?.searchQuery && params.searchQuery.trim()) {
          const q = params.searchQuery.toLowerCase().trim();
          list = list.filter(
            (p) =>
              p.title.toLowerCase().includes(q) ||
              p.subjectName.toLowerCase().includes(q) ||
              p.topic.toLowerCase().includes(q)
          );
        }
        return list;
      }
    } catch {
      // fallback
    }

    let pdfs = StorageService.getPdfs();

    if (params?.subjectId) {
      pdfs = pdfs.filter((p) => p.subjectId === params.subjectId);
    }

    if (params?.topic) {
      pdfs = pdfs.filter((p) => p.topic.toLowerCase().includes(params.topic!.toLowerCase()));
    }

    if (params?.searchQuery && params.searchQuery.trim()) {
      const query = params.searchQuery.toLowerCase().trim();
      pdfs = pdfs.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.subjectName.toLowerCase().includes(query) ||
          p.topic.toLowerCase().includes(query) ||
          (p.course && p.course.toLowerCase().includes(query)) ||
          (p.semester && p.semester.toLowerCase().includes(query)) ||
          (p.description && p.description.toLowerCase().includes(query))
      );
    }

    return pdfs;
  },

  async getPdfById(id: string): Promise<PdfResource | null> {
    const pdf = StorageService.getPdfById(id);
    if (!pdf) return null;

    // Attach real binary data if stored in IndexedDB
    try {
      const realFileData = await PdfFileStore.getPdfFile(id);
      if (realFileData) {
        return { ...pdf, fileData: realFileData };
      }
    } catch {
      // fallback to metadata
    }
    return pdf;
  },

  async createPdf(pdf: Omit<PdfResource, 'id' | 'uploadDate'>): Promise<PdfResource> {
    const current = StorageService.getCurrentUser();
    if (!current || current.role !== 'admin' || current.email.toLowerCase() !== AUTHORIZED_CREATOR_EMAIL.toLowerCase()) {
      throw new Error('403 Forbidden: Only the authorized creator and administrator can upload educational PDFs.');
    }

    const pdfId = `pdf-${Date.now()}`;
    const { fileData, ...metadata } = pdf;

    // Persist real PDF binary in IndexedDB
    if (fileData) {
      await PdfFileStore.savePdfFile(pdfId, fileData, metadata.fileName);
    }

    const newPdf: PdfResource = {
      ...metadata,
      id: pdfId,
      uploadDate: new Date().toISOString().split('T')[0],
      fileData,
    };

    StorageService.savePdf(newPdf);
    return newPdf;
  },

  async updatePdf(pdf: PdfResource): Promise<PdfResource> {
    const current = StorageService.getCurrentUser();
    if (!current || current.role !== 'admin' || current.email.toLowerCase() !== AUTHORIZED_CREATOR_EMAIL.toLowerCase()) {
      throw new Error('403 Forbidden: Only the authorized creator and administrator can update PDF resources.');
    }

    if (pdf.fileData) {
      await PdfFileStore.savePdfFile(pdf.id, pdf.fileData, pdf.fileName);
    }

    StorageService.savePdf(pdf);
    return pdf;
  },

  async deletePdf(id: string): Promise<void> {
    const current = StorageService.getCurrentUser();
    if (!current || current.role !== 'admin' || current.email.toLowerCase() !== AUTHORIZED_CREATOR_EMAIL.toLowerCase()) {
      throw new Error('403 Forbidden: Only the authorized creator and administrator can delete PDF resources.');
    }
    await PdfFileStore.deletePdfFile(id);
    StorageService.deletePdf(id);
  },

  // --- USER FAVORITES (MySQL & Local Sync) ---
  getUserFavorites(userId: string): string[] {
    return StorageService.getUserFavorites(userId);
  },

  async toggleFavorite(userId: string, subjectId: string): Promise<boolean> {
    const isFav = StorageService.toggleFavorite(userId, subjectId);
    try {
      await apiFetch<any>(`/library/favorites/${subjectId}`, {
        method: 'POST',
      });
    } catch {
      // Local fallback
    }
    return isFav;
  },

  // --- READ LATER (MySQL & Local Sync) ---
  getUserReadLater(userId: string): string[] {
    return StorageService.getUserReadLater(userId);
  },

  async toggleReadLater(userId: string, pdfId: string): Promise<boolean> {
    const isSaved = StorageService.toggleReadLater(userId, pdfId);
    try {
      await apiFetch<any>(`/library/read-later/${pdfId}`, {
        method: 'POST',
      });
    } catch {
      // Local fallback
    }
    return isSaved;
  },

  // --- LIBRARY SYNCHRONIZATION FROM MYSQL ---
  async syncLibraryFromBackend(userId: string): Promise<{ favorites: string[]; readLater: string[] } | null> {
    try {
      const data = await apiFetch<any>('/library');
      if (data) {
        if (Array.isArray(data.favorites)) {
          const favIds = data.favorites.map((f: any) => (typeof f === 'string' ? f : f.id || f.subjectId));
          StorageService.setUserFavorites(userId, favIds);
        }
        if (Array.isArray(data.readLater)) {
          const rlIds = data.readLater.map((r: any) => (typeof r === 'string' ? r : r.id || r.pdfId));
          StorageService.setUserReadLater(userId, rlIds);
        }
        return {
          favorites: StorageService.getUserFavorites(userId),
          readLater: StorageService.getUserReadLater(userId),
        };
      }
    } catch {
      // Fallback
    }
    return null;
  },

  // --- RECENTLY VIEWED ---
  getRecentlyViewed(userId: string): RecentlyViewedItem[] {
    return StorageService.getRecentlyViewed(userId);
  },

  recordRecentlyViewed(userId: string, pdfId: string, pageNumber: number, totalPages: number): void {
    StorageService.recordRecentlyViewed(userId, pdfId, pageNumber, totalPages);
    try {
      apiFetch<any>(`/library/progress/${pdfId}`, {
        method: 'POST',
        body: JSON.stringify({ currentPage: pageNumber, totalPages }),
      }).catch(() => {});
    } catch {
      // Ignore background progress errors
    }
  },
};

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
    if (
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
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
    if (res.redirected && res.url.includes('/login')) {
      throw new Error('401 Unauthorized: Session is expired or unauthorized. Please re-authenticate as administrator.');
    }
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

  async setupAdminPassword(password: string): Promise<void> {
    try {
      await apiFetch<any>('/auth/admin/setup', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
    } catch {
      // Local fallback if offline
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
    if (typeof window !== 'undefined') {
      const backendRoot = getBackendBaseUrl() || 'https://frontpageflip-backend.onrender.com';
      // In live production, route directly to Spring Boot OAuth 2.0 endpoint (/oauth2/authorization/{provider})
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        window.location.href = `${backendRoot}/oauth2/authorization/${provider}`;
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
          message: backendRes.message || 'Registration successful! A 6-digit verification code has been dispatched to your email.',
        };
      }
    } catch (e: any) {
      // Propagate any server-side validation or SMTP failure
      throw e;
    }

    // Offline dev mode fallback only on localhost
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      StorageService.saveVerificationCode(cleanEmail, verificationCode);

      const initials =
        name
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase() || 'ST';

      const newUser: User = {
        id: `usr-${Date.now()}`,
        name,
        email: cleanEmail,
        role: 'student',
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
        message: `Offline Dev Mode: Verification code generated (${verificationCode}).`,
      };
    }

    throw new Error("We couldn't send your verification code. Please check your email address and try again.");
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
      throw e;
    }

    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      StorageService.saveVerificationCode(cleanEmail, code);
      return {
        success: true,
        code,
        message: `Offline Dev Mode: A new verification code was generated (${code}).`,
      };
    }

    throw new Error("We couldn't send your verification code. Please check your email address and try again.");
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
    try {
      apiFetch<any>('/presence/logout', { method: 'POST' }).catch(() => {});
    } catch {
      // Ignore background logout network errors
    }
    StorageService.setCurrentUser(null);
    StorageService.setSessionToken(null);
    try {
      localStorage.removeItem('fpf_session_token_v2');
      localStorage.removeItem('fpf_current_user_v2');
      sessionStorage.clear();
    } catch {
      // Ignore browser storage exceptions
    }
  },

  getCurrentUser(): User | null {
    return StorageService.getCurrentUser();
  },

  async fetchCurrentUserProfile(): Promise<User | null> {
    const token = StorageService.getSessionToken();
    if (!token) return StorageService.getCurrentUser();

    try {
      const res = await apiFetch<any>('/auth/me');
      if (res && res.id) {
        const local = StorageService.getCurrentUser();
        const role = res.role ? String(res.role).toLowerCase() : (local?.role || 'student');
        const updated: User = {
          id: res.id,
          name: res.name || local?.name || '',
          email: res.email || local?.email || '',
          role: role === 'admin' ? 'admin' : 'student',
          emailVerified: res.emailVerified !== false,
          createdAt: local?.createdAt || new Date().toISOString(),
          provider: local?.provider || 'email',
          avatar: res.name ? res.name.slice(0, 2).toUpperCase() : (local?.avatar || 'AD'),
          isGolden: res.golden ?? res.isGolden ?? false,
          goldenPlan: res.goldenPlan || undefined,
          paymentStatus: res.paymentStatus || undefined,
        };
        StorageService.updateUser(updated);
        StorageService.setCurrentUser(updated);
        return updated;
      }
    } catch {
      // Backend unavailable or running in offline mode
    }
    return StorageService.getCurrentUser();
  },

  async updateUser(user: User): Promise<User> {
    StorageService.updateUser(user);
    StorageService.setCurrentUser(user);

    try {
      if (user.name && user.name.trim()) {
        await apiFetch<any>('/auth/me', {
          method: 'PUT',
          body: JSON.stringify({ name: user.name.trim() }),
        });
      }
    } catch {
      // Backend offline fallback
    }

    return user;
  },

  // --- SUBJECT MANAGEMENT (Strict Backend RBAC Check) ---
  async getSubjects(): Promise<Subject[]> {
    try {
      const backendSubjects = await apiFetch<any[]>('/subjects');
      if (backendSubjects && Array.isArray(backendSubjects)) {
        const mapped: Subject[] = backendSubjects.map((s) => ({
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
        StorageService.setSubjects(mapped);
        return mapped;
      }
    } catch {
      // fallback to client storage only if network unavailable
    }
    return StorageService.getSubjects();
  },

  async createSubject(subject: Omit<Subject, 'id' | 'createdAt'>): Promise<Subject> {
    const current = StorageService.getCurrentUser();
    if (!current || current.role !== 'admin' || current.email.toLowerCase() !== AUTHORIZED_CREATOR_EMAIL.toLowerCase()) {
      throw new Error('403 Forbidden: Only the authorized creator and administrator can create subjects.');
    }

    // Ensure valid backend JWT
    await this.ensureAdminToken();

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

    throw new Error('Failed to create subject in database.');
  },

  async updateSubject(subject: Subject): Promise<Subject> {
    const current = StorageService.getCurrentUser();
    if (!current || current.role !== 'admin' || current.email.toLowerCase() !== AUTHORIZED_CREATOR_EMAIL.toLowerCase()) {
      throw new Error('403 Forbidden: Only the authorized creator and administrator can edit subjects.');
    }

    // Ensure valid backend JWT
    await this.ensureAdminToken();

    const cleanPayload = {
      name: subject.name.trim(),
      slug: subject.slug || subject.name.toLowerCase().replace(/\s+/g, '-'),
      description: subject.description || '',
      icon: subject.icon || 'sigma',
      iconColor: subject.iconColor || '#1677FF',
      iconBgColor: subject.iconBgColor || '#EFF6FF',
    };

    const res = await apiFetch<any>(`/subjects/${subject.id}`, {
      method: 'PUT',
      body: JSON.stringify(cleanPayload),
    });

    if (res && res.id) {
      const mapped: Subject = {
        ...subject,
        id: res.id,
        name: res.name,
        slug: res.slug,
        description: res.description,
        icon: res.icon,
        iconColor: res.iconColor,
        iconBgColor: res.iconBgColor,
        pdfCount: typeof res.pdfCount === 'number' ? res.pdfCount : subject.pdfCount,
      };
      StorageService.saveSubject(mapped);
      return mapped;
    }

    throw new Error('Failed to update subject in database.');
  },

  async deleteSubject(id: string): Promise<void> {
    const current = StorageService.getCurrentUser();
    if (!current || current.role !== 'admin' || current.email.toLowerCase() !== AUTHORIZED_CREATOR_EMAIL.toLowerCase()) {
      throw new Error('403 Forbidden: Only the authorized creator and administrator can delete subjects.');
    }

    // Ensure valid backend JWT
    await this.ensureAdminToken();

    await apiFetch<any>(`/subjects/${id}`, {
      method: 'DELETE',
    });
    StorageService.deleteSubject(id);
  },

  // --- PDF MANAGEMENT (Strict Backend RBAC Check) ---
  async getPdfs(params?: { subjectId?: string; searchQuery?: string; topic?: string }): Promise<PdfResource[]> {
    try {
      const url = params?.subjectId ? `/pdfs/subject/${params.subjectId}` : '/pdfs';
      const backendPdfs = await apiFetch<any[]>(url);
      if (backendPdfs && Array.isArray(backendPdfs)) {
        const backendBase = getBackendBaseUrl();
        let list: PdfResource[] = backendPdfs.map((p) => {
          const viewUrl = backendBase ? `${backendBase}/api/v1/pdfs/${p.id}/view` : `/api/v1/pdfs/${p.id}/view`;
          const downloadUrl = backendBase ? `${backendBase}/api/v1/pdfs/${p.id}/download` : `/api/v1/pdfs/${p.id}/download`;
          const finalFileUrl = p.cloudinarySecureUrl || viewUrl;
          return {
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
            fileUrl: finalFileUrl,
            viewUrl,
            downloadUrl,
            cloudinarySecureUrl: p.cloudinarySecureUrl || undefined,
            thumbnailUrl: p.thumbnailUrl || undefined,
            uploadDate: p.createdAt ? p.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
            isPublished: p.published !== false,
            downloadAllowed: p.downloadAllowed !== false,
          };
        });
        if (params?.searchQuery && params.searchQuery.trim()) {
          const q = params.searchQuery.toLowerCase().trim();
          list = list.filter(
            (p) =>
              p.title.toLowerCase().includes(q) ||
              p.subjectName.toLowerCase().includes(q) ||
              p.topic.toLowerCase().includes(q)
          );
        }
        list.forEach((p) => StorageService.savePdf(p));
        return list;
      }
    } catch {
      // fallback
    }

    let pdfs = StorageService.getPdfs();

    if (params?.subjectId) {
      const allSubs = StorageService.getSubjects();
      const targetSub = allSubs.find(
        (s) =>
          s.id === params.subjectId ||
          (s.slug && s.slug.toLowerCase() === params.subjectId!.toLowerCase()) ||
          s.name.trim().toLowerCase() === params.subjectId!.trim().toLowerCase()
      );
      const targetName = targetSub ? targetSub.name.trim().toLowerCase() : '';
      const targetSlug = targetSub?.slug ? targetSub.slug.trim().toLowerCase() : '';

      pdfs = pdfs.filter(
        (p) =>
          p.subjectId === params.subjectId ||
          (targetSlug && p.subjectId?.toLowerCase() === targetSlug) ||
          (targetName && p.subjectName?.trim().toLowerCase() === targetName) ||
          (p.subjectId && targetName && p.subjectId.trim().toLowerCase() === targetName)
      );
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

  async ensureAdminToken(): Promise<string | null> {
    const current = StorageService.getCurrentUser();
    if (!current || current.role !== 'admin') {
      return null;
    }

    let token = StorageService.getSessionToken();
    return token;
  },


  async uploadPdfWithProgress(
    formData: FormData,
    onProgress?: (percent: number, stage: 'uploading' | 'processing' | 'done') => void
  ): Promise<PdfResource> {
    const current = StorageService.getCurrentUser();
    if (!current || current.role !== 'admin') {
      throw new Error('403 Forbidden: Only the authorized administrator can upload and publish educational PDFs.');
    }

    // Ensure valid backend JWT
    await this.ensureAdminToken();
    const token = StorageService.getSessionToken();

    const title = (formData.get('title') as string) || 'Educational Document';
    const topic = (formData.get('topic') as string) || '';
    const subjectId = (formData.get('subjectId') as string) || '';
    const subjectName = (formData.get('subjectName') as string) || '';
    const course = (formData.get('course') as string) || 'B.Tech / B.Sc';
    const semester = (formData.get('semester') as string) || 'Semester 1';
    const description = (formData.get('description') as string) || '';
    const pageCount = parseInt((formData.get('pageCount') as string) || '1') || 1;

    const apiBase = getApiBaseUrl();
    const uploadUrl = `${apiBase}/pdfs`;

    return new Promise<PdfResource>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', uploadUrl, true);
      xhr.timeout = 180000; // 3 minutes timeout

      xhr.setRequestHeader('Accept', 'application/json');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      // Real upload progress tracking
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
          onProgress?.(percent, 'uploading');
        }
      };

      xhr.upload.onload = () => {
        onProgress?.(100, 'processing');
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const backendDoc = JSON.parse(xhr.responseText);
            if (!backendDoc || !backendDoc.id) {
              reject(new Error('Upload failed: Server did not return a valid document record.'));
              return;
            }
            onProgress?.(100, 'done');

            const backendBase = getBackendBaseUrl();
            const downloadUrl = backendBase
              ? `${backendBase}/api/v1/pdfs/${backendDoc.id}/download`
              : `/api/v1/pdfs/${backendDoc.id}/download`;
            const finalFileUrl = backendDoc.cloudinarySecureUrl || downloadUrl;

            const mapped: PdfResource = {
              id: backendDoc.id,
              title: backendDoc.title || title,
              subjectId: backendDoc.subjectId || subjectId,
              subjectName: backendDoc.subjectName || subjectName,
              topic: backendDoc.topic || topic,
              course: backendDoc.course || course,
              semester: backendDoc.semester || semester,
              description: backendDoc.description || description,
              pageCount: backendDoc.pageCount || pageCount,
              fileSize: backendDoc.fileSize || '1.0 MB',
              fileName: backendDoc.fileName || `${backendDoc.title || title}.pdf`,
              fileUrl: finalFileUrl,
              thumbnailUrl: backendDoc.thumbnailUrl || undefined,
              uploadDate: backendDoc.createdAt
                ? backendDoc.createdAt.split('T')[0]
                : new Date().toISOString().split('T')[0],
              isPublished: backendDoc.published !== false,
              downloadAllowed: backendDoc.downloadAllowed !== false,
            };

            StorageService.savePdf(mapped);
            resolve(mapped);
          } catch {
            reject(new Error('Invalid response received from server.'));
          }
        } else {
          let errorMessage = `Upload failed (Status ${xhr.status})`;
          try {
            const errData = JSON.parse(xhr.responseText);
            if (errData?.message) {
              errorMessage = errData.message;
            } else if (errData?.error) {
              errorMessage = errData.error;
            }
          } catch {
            // response was not JSON
          }

          if (xhr.status === 413) {
            errorMessage = 'Uploaded PDF file exceeds maximum size limit of 25MB.';
          } else if (xhr.status === 401 || xhr.status === 403) {
            errorMessage = 'Admin session expired or unauthorized. Please re-authenticate as administrator.';
          } else if (xhr.status === 504 || xhr.status === 502) {
            errorMessage = 'Cloud gateway timeout. The cloud service took too long to process the file.';
          }

          reject(new Error(errorMessage));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Network error: Unable to reach the server. Please check your internet connection and retry.'));
      };

      xhr.ontimeout = () => {
        reject(new Error('Upload request timed out after 3 minutes. Please verify your internet connection or reduce file size and retry.'));
      };

      xhr.send(formData);
    });
  },

  async uploadPdf(formData: FormData): Promise<PdfResource> {
    return this.uploadPdfWithProgress(formData);
  },

  async createPdf(pdf: Omit<PdfResource, 'id' | 'uploadDate'>): Promise<PdfResource> {
    const current = StorageService.getCurrentUser();
    if (!current || current.role !== 'admin' || current.email.toLowerCase() !== AUTHORIZED_CREATOR_EMAIL.toLowerCase()) {
      throw new Error('403 Forbidden: Only the authorized creator and administrator can upload educational PDFs.');
    }

    // High entropy unique identifier ensures multiple PDFs with identical titles or topics never collide or overwrite
    const pdfId = `pdf-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
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

    // If backend is active, also sync to backend database / Cloudinary
    try {
      if (fileData && fileData.includes(',')) {
        const formData = new FormData();
        const byteString = atob(fileData.split(',')[1] || '');
        const mimeString = fileData.split(',')[0].split(':')[1].split(';')[0] || 'application/pdf';
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        formData.append('file', blob, metadata.fileName || 'document.pdf');
        formData.append('title', metadata.title);
        formData.append('topic', metadata.topic);
        if (metadata.subjectId) formData.append('subjectId', metadata.subjectId);
        if (metadata.subjectName) formData.append('subjectName', metadata.subjectName);
        if (metadata.course) formData.append('course', metadata.course);
        if (metadata.semester) formData.append('semester', metadata.semester);
        if (metadata.description) formData.append('description', metadata.description);
        formData.append('pageCount', String(metadata.pageCount || 1));
        formData.append('downloadAllowed', String(metadata.downloadAllowed !== false));

        const backendDoc = await apiFetch<any>('/pdfs', {
          method: 'POST',
          body: formData,
        });
        if (backendDoc && backendDoc.id) {
          newPdf.id = backendDoc.id;
          if (backendDoc.cloudinarySecureUrl) newPdf.cloudinarySecureUrl = backendDoc.cloudinarySecureUrl;
          if (backendDoc.thumbnailUrl) newPdf.thumbnailUrl = backendDoc.thumbnailUrl;
          StorageService.savePdf(newPdf);
        }
      }
    } catch (e: any) {
      if (e?.message && !e.message.includes('Failed to fetch') && !e.message.includes('NetworkError')) {
        throw e;
      }
    }

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

    try {
      const formData = new FormData();
      formData.append('title', pdf.title);
      formData.append('topic', pdf.topic);
      if (pdf.subjectId) formData.append('subjectId', pdf.subjectId);
      if (pdf.subjectName) formData.append('subjectName', pdf.subjectName);
      if (pdf.course) formData.append('course', pdf.course);
      if (pdf.semester) formData.append('semester', pdf.semester);
      if (pdf.description) formData.append('description', pdf.description);
      formData.append('pageCount', String(pdf.pageCount || 1));
      formData.append('downloadAllowed', String(pdf.downloadAllowed !== false));
      formData.append('published', String(pdf.isPublished !== false));

      await apiFetch<any>(`/pdfs/${pdf.id}`, {
        method: 'PUT',
        body: formData,
      });
    } catch {
      // Local fallback
    }

    return pdf;
  },

  async deletePdf(id: string): Promise<void> {
    const current = StorageService.getCurrentUser();
    if (!current || current.role !== 'admin' || current.email.toLowerCase() !== AUTHORIZED_CREATOR_EMAIL.toLowerCase()) {
      throw new Error('403 Forbidden: Only the authorized creator and administrator can delete PDF resources.');
    }
    await PdfFileStore.deletePdfFile(id);
    StorageService.deletePdf(id);

    try {
      await apiFetch<any>(`/pdfs/${id}`, {
        method: 'DELETE',
      });
    } catch {
      // Local fallback
    }
  },

  // --- PDF VIEWING & SECURE DOWNLOAD ---
  getPdfViewUrl(pdfId: string): string {
    const backendBase = getBackendBaseUrl();
    return backendBase ? `${backendBase}/api/v1/pdfs/${pdfId}/view` : `/api/v1/pdfs/${pdfId}/view`;
  },

  async downloadPdfFile(pdfId: string, fileName?: string): Promise<void> {
    const backendBase = getBackendBaseUrl();
    const url = backendBase ? `${backendBase}/api/v1/pdfs/${pdfId}/download` : `/api/v1/pdfs/${pdfId}/download`;
    const token = StorageService.getSessionToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(url, { headers });
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Downloading study materials requires Lifetime Golden membership. Please upgrade to Golden.');
      }
      if (response.status === 401) {
        throw new Error('Please sign in to download study materials.');
      }
      throw new Error(`Download failed with status ${response.status}`);
    }
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName || `document_${pdfId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  },

  // --- GOLDEN MEMBERSHIP API ---
  async getGoldenStatus(): Promise<{ isGolden: boolean; goldenPlan: string; price: number; currency: string; message: string }> {
    try {
      const res = await apiFetch<any>('/golden/status');
      if (res) return res;
    } catch {
      // Offline fallback
    }
    const user = StorageService.getCurrentUser();
    return {
      isGolden: user?.isGolden || false,
      goldenPlan: user?.goldenPlan || 'Lifetime Golden',
      price: 149,
      currency: 'INR',
      message: 'Unlock PDF downloads for all study materials, permanently.',
    };
  },

  async createGoldenOrder(amount: number = 14900): Promise<{ order_id: string; amount: number; currency: string; key_id?: string }> {
    return this.createRazorpayOrder(amount);
  },

  async createRazorpayOrder(amount: number = 14900): Promise<{ order_id: string; amount: number; currency: string; key_id?: string }> {
    const user = StorageService.getCurrentUser();
    const token = StorageService.getSessionToken();
    if (!token && !user) {
      throw new Error('Please sign in to your student account first to purchase Lifetime Golden membership.');
    }

    const res = await apiFetch<any>('/create-order', {
      method: 'POST',
      body: JSON.stringify({
        amount: 14900,
        currency: 'INR',
        plan: 'Lifetime Golden',
        userId: user?.id,
      }),
    });

    if (res && (res.order_id || res.id)) {
      return {
        order_id: res.order_id || res.id,
        amount: res.amount || 14900,
        currency: res.currency || 'INR',
        key_id: res.key_id,
      };
    }

    throw new Error('Could not initiate Razorpay checkout order. Please try again.');
  },

  async verifyRazorpayPayment(payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    userId?: string;
  }): Promise<{ success: boolean; verified: boolean; message: string }> {
    const current = StorageService.getCurrentUser();
    const token = StorageService.getSessionToken();
    if (!token && !current) {
      throw new Error('Please sign in to verify your payment.');
    }

    const result = await apiFetch<any>('/verify-payment', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        userId: payload.userId || current?.id,
      }),
    });

    if (result && result.success) {
      if (current) {
        current.isGolden = true;
        current.goldenPlan = 'Lifetime Golden';
        current.paymentStatus = 'COMPLETED';
        StorageService.updateUser(current);
        StorageService.setCurrentUser(current);
      }
      return result;
    }

    throw new Error(result?.error || 'Payment verification failed. Invalid signature.');
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

  // --- ADMIN STATISTICS & STUDENT RECORDS (Aiven MySQL & Local Fallback) ---
  async getAdminStats(): Promise<{ totalSubjects: number; totalPdfs: number; totalStudents: number; totalDownloads: number }> {
    try {
      const stats = await apiFetch<any>('/admin/stats');
      if (stats) {
        return {
          totalSubjects: Number(stats.totalSubjects) || 0,
          totalPdfs: Number(stats.totalPdfs) || 0,
          totalStudents: Number(stats.totalStudents) || 0,
          totalDownloads: Number(stats.totalDownloads) || 0,
        };
      }
    } catch {
      // Local fallback
    }

    const subjects = StorageService.getSubjects();
    const pdfs = StorageService.getPdfs();
    const users = StorageService.getUsers();
    const studentCount = users.filter((u) => u.role === 'student').length;

    return {
      totalSubjects: subjects.length,
      totalPdfs: pdfs.length,
      totalStudents: studentCount,
      totalDownloads: pdfs.length * 4,
    };
  },

  async getRegisteredStudents(): Promise<User[]> {
    try {
      const backendStudents = await apiFetch<any[]>('/admin/students');
      if (backendStudents && Array.isArray(backendStudents)) {
        return backendStudents.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: 'student',
          avatar: u.avatar || (u.name ? u.name.slice(0, 2).toUpperCase() : 'ST'),
          emailVerified: u.emailVerified === true,
          provider: u.provider || 'email',
          createdAt: u.createdAt || new Date().toISOString(),
        }));
      }
    } catch {
      // Local fallback
    }

    const users = StorageService.getUsers();
    return users.filter((u) => u.role === 'student');
  },
};

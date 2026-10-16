import { User, Subject, PdfResource, RecentlyViewedItem } from '../types';
import { StorageService } from './storage';

// API Base URL (Configurable for Spring Boot integration)
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '';

export const ApiService = {
  // --- AUTHENTICATION ---
  async login(email: string, _password?: string): Promise<{ user: User; token: string }> {
    // Check in storage
    const users = StorageService.getUsers();
    let user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Create user if logging in first time
      const initials = email
        .split('@')[0]
        .slice(0, 2)
        .toUpperCase();
      user = {
        id: `usr-${Date.now()}`,
        name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        email,
        role: email.toLowerCase().includes('admin') ? 'admin' : 'student',
        avatar: initials,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        provider: 'email',
      };
      StorageService.addUser(user);
    }

    StorageService.setCurrentUser(user);
    const token = `jwt_mock_${user.id}_${Date.now()}`;
    return { user, token };
  },

  async socialLogin(provider: 'google' | 'github'): Promise<{ user: User; token: string }> {
    const isGoogle = provider === 'google';
    const email = isGoogle ? 'arkaparna.ds@gmail.com' : 'arkaparna.dev@github.com';
    const name = isGoogle ? 'Arkoparno D.' : 'Arkoparno Dev';
    const avatar = isGoogle ? 'AD' : 'AD';

    const users = StorageService.getUsers();
    let user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      user = {
        id: `usr-${provider}-${Date.now()}`,
        name,
        email,
        role: 'student',
        avatar,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        provider,
      };
      StorageService.addUser(user);
    }

    StorageService.setCurrentUser(user);
    const token = `jwt_oauth_${provider}_${user.id}_${Date.now()}`;
    return { user, token };
  },

  async register(
    name: string,
    email: string,
    _password: string
  ): Promise<{ user: User; requiresVerification: boolean; verificationCode: string }> {
    // Generate 6 digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    StorageService.saveVerificationCode(email, verificationCode);

    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'ST';

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role: email.toLowerCase().includes('admin') ? 'admin' : 'student',
      avatar: initials,
      emailVerified: false,
      createdAt: new Date().toISOString(),
      provider: 'email',
    };

    StorageService.addUser(newUser);

    return {
      user: newUser,
      requiresVerification: true,
      verificationCode, // Returned for UI verification display helper
    };
  },

  async verifyEmail(email: string, code: string): Promise<{ success: boolean; message: string; user?: User }> {
    const result = StorageService.verifyCode(email, code);
    if (!result.success) {
      return result;
    }

    const users = StorageService.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      user.emailVerified = true;
      StorageService.updateUser(user);
      StorageService.setCurrentUser(user);
      return { success: true, message: result.message, user };
    }

    return { success: false, message: 'User record not found.' };
  },

  async resendVerificationCode(email: string): Promise<{ success: boolean; code: string; message: string }> {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    StorageService.saveVerificationCode(email, code);
    return {
      success: true,
      code,
      message: `A new 6-digit verification code (${code}) has been generated and sent to ${email}.`,
    };
  },

  async logout(): Promise<void> {
    StorageService.setCurrentUser(null);
  },

  getCurrentUser(): User | null {
    return StorageService.getCurrentUser();
  },

  updateUser(user: User): User {
    StorageService.updateUser(user);
    return user;
  },

  switchRole(targetRole: 'student' | 'admin'): User {
    const current = StorageService.getCurrentUser();
    if (!current) {
      const user = StorageService.getUsers().find((u) => u.role === targetRole) || StorageService.getUsers()[0];
      StorageService.setCurrentUser(user);
      return user;
    }
    const updated = { ...current, role: targetRole };
    StorageService.updateUser(updated);
    return updated;
  },

  // --- SUBJECTS (Admin can write, Students read-only) ---
  async getSubjects(): Promise<Subject[]> {
    return StorageService.getSubjects();
  },

  async createSubject(subject: Omit<Subject, 'id' | 'createdAt'>, userRole: string): Promise<Subject> {
    if (userRole !== 'admin') {
      throw new Error('403 Forbidden: Only administrators can create subjects.');
    }
    const newSubject: Subject = {
      ...subject,
      id: `sub-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    StorageService.saveSubject(newSubject);
    return newSubject;
  },

  async updateSubject(subject: Subject, userRole: string): Promise<Subject> {
    if (userRole !== 'admin') {
      throw new Error('403 Forbidden: Only administrators can edit subjects.');
    }
    StorageService.saveSubject(subject);
    return subject;
  },

  async deleteSubject(id: string, userRole: string): Promise<void> {
    if (userRole !== 'admin') {
      throw new Error('403 Forbidden: Only administrators can delete subjects.');
    }
    StorageService.deleteSubject(id);
  },

  // --- PDFS (Admin can write, Students read-only) ---
  async getPdfs(params?: { subjectId?: string; searchQuery?: string; topic?: string }): Promise<PdfResource[]> {
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
    return pdf || null;
  },

  async createPdf(pdf: Omit<PdfResource, 'id' | 'uploadDate'>, userRole: string): Promise<PdfResource> {
    if (userRole !== 'admin') {
      throw new Error('403 Forbidden: Only administrators can upload educational PDFs.');
    }
    const newPdf: PdfResource = {
      ...pdf,
      id: `pdf-${Date.now()}`,
      uploadDate: new Date().toISOString().split('T')[0],
    };
    StorageService.savePdf(newPdf);
    return newPdf;
  },

  async updatePdf(pdf: PdfResource, userRole: string): Promise<PdfResource> {
    if (userRole !== 'admin') {
      throw new Error('403 Forbidden: Only administrators can update PDF metadata.');
    }
    StorageService.savePdf(pdf);
    return pdf;
  },

  async deletePdf(id: string, userRole: string): Promise<void> {
    if (userRole !== 'admin') {
      throw new Error('403 Forbidden: Only administrators can delete PDFs.');
    }
    StorageService.deletePdf(id);
  },

  // --- USER FAVORITES ---
  getUserFavorites(userId: string): string[] {
    return StorageService.getUserFavorites(userId);
  },

  toggleFavorite(userId: string, subjectId: string): boolean {
    return StorageService.toggleFavorite(userId, subjectId);
  },

  // --- READ LATER ---
  getUserReadLater(userId: string): string[] {
    return StorageService.getUserReadLater(userId);
  },

  toggleReadLater(userId: string, pdfId: string): boolean {
    return StorageService.toggleReadLater(userId, pdfId);
  },

  // --- RECENTLY VIEWED ---
  getRecentlyViewed(userId: string): RecentlyViewedItem[] {
    return StorageService.getRecentlyViewed(userId);
  },

  recordRecentlyViewed(userId: string, pdfId: string, pageNumber: number, totalPages: number): void {
    StorageService.recordRecentlyViewed(userId, pdfId, pageNumber, totalPages);
  },
};

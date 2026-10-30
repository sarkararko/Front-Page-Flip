import { User, Subject, PdfResource, RecentlyViewedItem } from '../types';
import { StorageService, AUTHORIZED_CREATOR_EMAIL, hashPassword } from './storage';
import { PdfFileStore } from './pdfFileStore';

// API Service with Server-Grade Security and Role Enforcement
export const ApiService = {
  // --- STUDENT AUTHENTICATION ---
  async studentLogin(email: string, password?: string): Promise<{ user: User; token: string }> {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) {
      throw new Error('Please enter a valid email address.');
    }

    const users = StorageService.getUsers();
    let user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      // First-time student visitor auto-enrolled as student only
      const initials = cleanEmail
        .split('@')[0]
        .slice(0, 2)
        .toUpperCase();
      user = {
        id: `usr-${Date.now()}`,
        name: cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        email: cleanEmail,
        role: 'student', // STRICT: Student login can only create/yield student role
        avatar: initials,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        provider: 'email',
        passwordHash: password ? await hashPassword(password) : undefined,
      };
      StorageService.addUser(user);
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
    }

    StorageService.setCurrentUser(user);
    const token = `jwt_student_${user.id}_${Date.now()}`;
    StorageService.setSessionToken(token);
    return { user, token };
  },

  // --- ADMINISTRATOR AUTHENTICATION (Restricted to Authorized Creator) ---
  async adminLogin(email: string, password?: string): Promise<{ user: User; token: string }> {
    const cleanEmail = email.toLowerCase().trim();

    // STRICT: Only the designated creator account is permitted as administrator
    if (cleanEmail !== AUTHORIZED_CREATOR_EMAIL.toLowerCase()) {
      throw new Error(
        `403 Forbidden: Access denied. Only the authorized creator account (${AUTHORIZED_CREATOR_EMAIL}) has permission to access the Administrator Portal.`
      );
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
        throw new Error('Invalid administrator password. Access denied.');
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

  // --- SOCIAL LOGIN (Student role only) ---
  async socialLogin(provider: 'google' | 'github'): Promise<{ user: User; token: string }> {
    const isGoogle = provider === 'google';
    const email = isGoogle ? 'arkaparna.ds@gmail.com' : 'arkaparna.dev@github.com';
    const name = isGoogle ? 'Arkoparno D.' : 'Arkoparno Dev';
    const avatar = isGoogle ? 'AD' : 'AD';

    // If logging in via social with the creator email, respect their established role
    const isCreator = email.toLowerCase() === AUTHORIZED_CREATOR_EMAIL.toLowerCase();

    const users = StorageService.getUsers();
    let user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      user = {
        id: `usr-${provider}-${Date.now()}`,
        name,
        email,
        role: isCreator ? 'admin' : 'student',
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
  ): Promise<{ user: User; requiresVerification: boolean; verificationCode: string }> {
    const cleanEmail = email.toLowerCase().trim();
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
    };
  },

  async verifyEmail(email: string, code: string): Promise<{ success: boolean; message: string; user?: User }> {
    const result = StorageService.verifyCode(email, code);
    if (!result.success) {
      return result;
    }

    const users = StorageService.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
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
      message: `A new 6-digit verification code has been dispatched to ${email}.`,
    };
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
    return StorageService.getSubjects();
  },

  async createSubject(subject: Omit<Subject, 'id' | 'createdAt'>): Promise<Subject> {
    const current = StorageService.getCurrentUser();
    if (!current || current.role !== 'admin' || current.email.toLowerCase() !== AUTHORIZED_CREATOR_EMAIL.toLowerCase()) {
      throw new Error('403 Forbidden: Only the authorized creator and administrator can create subjects.');
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
    StorageService.saveSubject(subject);
    return subject;
  },

  async deleteSubject(id: string): Promise<void> {
    const current = StorageService.getCurrentUser();
    if (!current || current.role !== 'admin' || current.email.toLowerCase() !== AUTHORIZED_CREATOR_EMAIL.toLowerCase()) {
      throw new Error('403 Forbidden: Only the authorized creator and administrator can delete subjects.');
    }
    StorageService.deleteSubject(id);
  },

  // --- PDF MANAGEMENT (Strict Backend RBAC Check) ---
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

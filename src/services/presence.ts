import { StorageService } from './storage';
import { getApiBaseUrl } from './api';

export interface PresenceResponse {
  count?: number;
  totalStudents?: number;
  activeCount?: number;
  windowMinutes?: number;
  status?: string;
}
export const PresenceService = {
  /**
   * Fetches both active and total registered students count in a single request.
   * Gracefully falls back to local user store on any network or server error.
   */
  async getStudentCounts(): Promise<{ activeCount: number; totalStudents: number }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/presence/active-students-count?window=5`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data: PresenceResponse = await res.json();
        const active = typeof data.activeCount === 'number' ? data.activeCount : (data.count ?? 0);
        const total = typeof data.totalStudents === 'number' ? data.totalStudents : (data.count ?? 0);
        try {
          sessionStorage.setItem('fpf_last_known_student_count', String(total));
        } catch {}
        return { activeCount: active, totalStudents: total };
      }
    } catch {
      clearTimeout(timeoutId);
      // Backend offline, sleeping or network unreachable: use local fallback
    }

    // If we previously fetched a live count from Aiven MySQL, preserve it instead of dropping to 0
    let cachedCount: number | null = null;
    try {
      const stored = sessionStorage.getItem('fpf_last_known_student_count');
      if (stored) cachedCount = parseInt(stored, 10);
    } catch {}

    const students = StorageService.getUsers().filter((u) => u.role === 'student');
    const currentUser = StorageService.getCurrentUser();
    const active = currentUser && currentUser.role === 'student' ? 1 : 0;
    return {
      activeCount: active,
      totalStudents: cachedCount !== null && !isNaN(cachedCount) ? cachedCount : students.length,
    };
  },

  /**
   * Fetches the total distinct registered students count directly from MySQL via the backend.
   * Admins are strictly excluded.
   */
  async getRegisteredStudentCount(): Promise<number> {
    try {
      const counts = await this.getStudentCounts();
      return counts.totalStudents;
    } catch {
      const students = StorageService.getUsers().filter((u) => u.role === 'student');
      return students.length;
    }
  },

  /**
   * Fetches the current live count of active students directly from MySQL via the backend.
   * Admins are strictly excluded.
   */
  async getActiveStudentsCount(windowMinutes = 5): Promise<number> {
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/presence/active-students-count?window=${windowMinutes}`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data: PresenceResponse = await res.json();
        const active = typeof data.activeCount === 'number' ? data.activeCount : data.count;
        if (typeof active === 'number') {
          return active;
        }
      }
    } catch {
      // Backend offline or running in mock demo mode
    }

    // Local fallback when backend isn't reached:
    // Count currently logged in student session (exclude admins)
    const currentUser = StorageService.getCurrentUser();
    if (currentUser && currentUser.role === 'student') {
      return 1;
    }
    return 0;
  },

  /**
   * Sends a heartbeat update to record the authenticated student's presence timestamp in MySQL.
   */
  async sendHeartbeat(): Promise<void> {
    const currentUser = StorageService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'student') {
      return; // Admins are strictly excluded from presence count
    }

    const token = StorageService.getSessionToken();
    try {
      const apiBase = getApiBaseUrl();
      await fetch(`${apiBase}/presence/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch {
      // Ignore network errors on background heartbeat
    }
  },

  /**
   * Clears the user's presence timestamp on explicit sign out.
   */
  async sendLogout(): Promise<void> {
    const token = StorageService.getSessionToken();
    try {
      const apiBase = getApiBaseUrl();
      await fetch(`${apiBase}/presence/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch {
      // Ignore
    }
  },
};

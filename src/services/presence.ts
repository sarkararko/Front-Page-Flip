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
   * Fetches the total distinct registered students count directly from MySQL via the backend.
   * Admins are strictly excluded. Uses cache: 'no-store' to guarantee fresh data.
   */
  async getRegisteredStudentCount(): Promise<number> {
    try {
      const apiBase = getApiBaseUrl();
      const res = await fetch(`${apiBase}/presence/student-count`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (res.ok) {
        const data: PresenceResponse = await res.json();
        const count = data.totalStudents ?? data.count;
        if (typeof count === 'number') {
          return count;
        }
      }
    } catch {
      // Backend offline or running in fallback mode
    }

    const students = StorageService.getUsers().filter((u) => u.role === 'student');
    return students.length;
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
        cache: 'no-store',
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

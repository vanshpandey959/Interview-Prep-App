import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Auth state shared across the app.
 * role: 'admin' | 'candidate' | null
 * candidateId: only set when role === 'candidate'
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      role: null,
      candidateId: null,

      loginAsAdmin: (token) => set({ token, role: 'admin', candidateId: null }),
      loginAsCandidate: (token, candidateId) => set({ token, role: 'candidate', candidateId }),
      logout: () => set({ token: null, role: null, candidateId: null }),

      isAuthenticated: () => !!get().token,
    }),
    { name: 'signal-auth' }
  )
);

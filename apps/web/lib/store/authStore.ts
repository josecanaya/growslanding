'use client';

import { create } from 'zustand';

import type { SessionUser } from '@/lib/types/auth';

type AuthStore = {
  user: SessionUser | null;
  setUser: (user: SessionUser | null) => void;
  reset: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  reset: () => set({ user: null }),
}));

'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { AppRouterInstance } from 'next/navigation';
import type { Route } from 'next';

import { IS_DEV_MODE } from '@/lib/config';
import { useAuthStore } from '@/lib/store/authStore';
import type { Database } from '@/lib/types/supabase.gen';

const LOCAL_STORAGE_KEYS = ['user', 'isConnected', 'isOnBreak'];

export function clearClientSessionArtifacts() {
  if (typeof window === 'undefined') {
    return;
  }

  LOCAL_STORAGE_KEYS.forEach((key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore storage errors
    }
  });
}

type LogoutOptions = {
  router: AppRouterInstance;
  redirectTo?: Route | string;
};

export async function logout({ router, redirectTo = '/auth/login' }: LogoutOptions) {
  clearClientSessionArtifacts();
  useAuthStore.getState().reset();

  if (!IS_DEV_MODE) {
    const supabase = createClientComponentClient<Database>();
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('[LOGOUT_ERROR]', error);
    }
  } else if (typeof window !== 'undefined') {
    window.alert('Desconectado (modo dev)');
  }

  router.replace(redirectTo as Route);
}

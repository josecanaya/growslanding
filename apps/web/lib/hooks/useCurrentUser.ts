'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

import { useDevMode } from '@/lib/dev-mode-context';
import { mockUser, type MockUser } from '@/lib/mockUser';
import { supabase } from '@/lib/supabase';

export type CurrentUser = MockUser | User | null;

export function useCurrentUser(): CurrentUser {
  const { devModeEnabled } = useDevMode();
  const [user, setUser] = useState<CurrentUser>(null);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      if (devModeEnabled) {
        setUser(mockUser);
        return;
      }

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (active) {
        setUser(authUser ?? null);
      }
    }

    loadUser();

    return () => {
      active = false;
    };
  }, [devModeEnabled]);

  return user;
}

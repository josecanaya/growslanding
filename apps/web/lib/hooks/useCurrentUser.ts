'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Session } from '@supabase/supabase-js';
import { usePathname, useRouter } from 'next/navigation';

import { clearClientSessionArtifacts } from '@/lib/auth';
import { useDevMode } from '@/lib/dev-mode-context';
import { mockUser } from '@/lib/mockUser';
import { useAuthStore } from '@/lib/store/authStore';
import type { Database } from '@/lib/types/supabase.gen';
import type { SessionUser } from '@/lib/types/auth';
import { normalizeRole } from '@/lib/roles';

const AUTH_PREFIX = '/auth';

function mapSessionToUser(session: Session): SessionUser {
  const appMeta = (session.user.app_metadata ?? {}) as Record<string, unknown>;
  const userMeta = (session.user.user_metadata ?? {}) as Record<string, unknown>;

  const role =
    normalizeRole(
      (appMeta.role as string | undefined) ?? (userMeta.role as string | undefined)
    ) ?? null;

  const orgId =
    (userMeta.org_id as string | undefined) ??
    (appMeta.org_id as string | undefined) ??
    null;

  const orgName =
    (userMeta.org_name as string | undefined) ??
    (appMeta.org_name as string | undefined) ??
    null;

  const fullName =
    (userMeta.full_name as string | undefined) ??
    (userMeta.name as string | undefined) ??
    session.user.email ??
    null;

  return {
    id: session.user.id,
    email: session.user.email ?? null,
    name: fullName,
    role,
    orgId,
    orgName,
    isDevUser: false,
  };
}

const devSessionUser: SessionUser = {
  id: mockUser.id,
  email: mockUser.email,
  name: mockUser.name,
  role: mockUser.role,
  orgId: mockUser.orgId,
  orgName: mockUser.orgName,
  isDevUser: true,
};

export function useCurrentUser(): SessionUser | null {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const { devModeEnabled } = useDevMode();
  const setStoreUser = useAuthStore((state) => state.setUser);
  const resetStore = useAuthStore((state) => state.reset);
  const [user, setUser] = useState<SessionUser | null>(null);

  const supabase = useMemo(
    () => createClientComponentClient<Database>(),
    []
  );

  useEffect(() => {
    let active = true;

    if (devModeEnabled) {
      setStoreUser(devSessionUser);
      setUser(devSessionUser);
      return () => {
        active = false;
      };
    }

    async function syncInitialSession() {
      const { data } = await supabase.auth.getSession();
      if (!active) {
        return;
      }

      if (!data.session) {
        clearClientSessionArtifacts();
        resetStore();
        setUser(null);
        if (!pathname.startsWith(AUTH_PREFIX)) {
          router.replace('/auth/login');
        }
        return;
      }

      const mapped = mapSessionToUser(data.session);
      setStoreUser(mapped);
      setUser(mapped);
    }

    void syncInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) {
        return;
      }

      if (!session) {
        clearClientSessionArtifacts();
        resetStore();
        setUser(null);
        if (!pathname.startsWith(AUTH_PREFIX)) {
          router.replace('/auth/login');
        }
        return;
      }

      const mapped = mapSessionToUser(session);
      setStoreUser(mapped);
      setUser(mapped);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [devModeEnabled, supabase, pathname, router, setStoreUser, resetStore]);

  return user;
}

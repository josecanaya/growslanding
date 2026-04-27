'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Session } from '@supabase/supabase-js';
import { usePathname, useRouter } from 'next/navigation';

import { clearClientSessionArtifacts } from '@/lib/auth';
import { useAuthStore } from '@/lib/store/authStore';
import type { Database } from '@/lib/types/supabase.gen';
import type { SessionUser } from '@/lib/types/auth';
import { normalizeRole } from '@/lib/roles';

const AUTH_PREFIX = '/auth';

// Función global para verificar rate limit en localStorage
function hasActiveRateLimit(): boolean {
  if (typeof window === 'undefined') return false;
  const rateLimitUntil = localStorage.getItem('supabase_rate_limit_until');
  if (!rateLimitUntil) return false;
  const untilTime = parseInt(rateLimitUntil, 10);
  const now = Date.now();
  if (now >= untilTime) {
    // Rate limit expiró, limpiar
    localStorage.removeItem('supabase_rate_limit_until');
    return false;
  }
  return true;
}

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

export function useCurrentUser(): SessionUser | null {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const setStoreUser = useAuthStore((state) => state.setUser);
  const resetStore = useAuthStore((state) => state.reset);
  const [user, setUser] = useState<SessionUser | null>(null);
  
  // Protección contra loops: rastrear si ya estamos redirigiendo o si hay rate limit
  const isRedirectingRef = useRef(false);
  const hasRateLimitRef = useRef(false);
  const sessionCheckRef = useRef(false);

  const supabase = useMemo(
    () => createClientComponentClient<Database>(),
    []
  );

  // Ref para pathname: evita re-ejecutar el effect en cada navegación (reduce getSession y evita rate limit/loop)
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  useEffect(() => {
    let active = true;

    const currentPath = pathnameRef.current;
    if (currentPath.startsWith(AUTH_PREFIX)) {
      return;
    }

    if (isRedirectingRef.current) {
      return;
    }

    if (hasActiveRateLimit()) {
      hasRateLimitRef.current = true;
      console.warn('[useCurrentUser] Rate limit activo detectado en localStorage, evitando peticiones');
      return;
    }

    if (hasRateLimitRef.current) {
      return;
    }

    async function syncInitialSession() {
      if (sessionCheckRef.current) {
        return;
      }
      sessionCheckRef.current = true;

      try {
        const { data, error } = await supabase.auth.getSession();

        if (!active) {
          return;
        }

        if (error) {
          const isRateLimit =
            error.message?.toLowerCase().includes('rate limit') ||
            error.message?.toLowerCase().includes('too many requests') ||
            error.status === 429;

          if (isRateLimit) {
            console.warn('[useCurrentUser] Rate limit detectado, evitando más peticiones');
            hasRateLimitRef.current = true;
            if (typeof window !== 'undefined') {
              const rateLimitUntil = Date.now() + 20 * 60 * 1000;
              localStorage.setItem('supabase_rate_limit_until', rateLimitUntil.toString());
            }
            return;
          }
        }

        if (!data.session) {
          clearClientSessionArtifacts();
          resetStore();
          setUser(null);
          if (!pathnameRef.current.startsWith(AUTH_PREFIX) && !isRedirectingRef.current) {
            isRedirectingRef.current = true;
            router.replace('/auth/login');
          }
          return;
        }

        const mapped = mapSessionToUser(data.session);
        setStoreUser(mapped);
        setUser(mapped);
        hasRateLimitRef.current = false;
      } catch (err) {
        console.error('[useCurrentUser] Error obteniendo sesión:', err);
      } finally {
        sessionCheckRef.current = false;
      }
    }

    void syncInitialSession();

    let subscription: { unsubscribe: () => void } | null = null;

    if (!hasActiveRateLimit() && !hasRateLimitRef.current) {
      const {
        data: { subscription: authSubscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!active) return;
        if (hasActiveRateLimit()) {
          hasRateLimitRef.current = true;
          return;
        }
        if (hasRateLimitRef.current && !session) return;

        if (!session) {
          clearClientSessionArtifacts();
          resetStore();
          setUser(null);
          if (!pathnameRef.current.startsWith(AUTH_PREFIX) && !isRedirectingRef.current) {
            isRedirectingRef.current = true;
            router.replace('/auth/login');
          }
          return;
        }

        hasRateLimitRef.current = false;
        isRedirectingRef.current = false;
        const mapped = mapSessionToUser(session);
        setStoreUser(mapped);
        setUser(mapped);
      });
      subscription = authSubscription;
    }

    return () => {
      active = false;
      if (subscription) subscription.unsubscribe();
      isRedirectingRef.current = false;
      sessionCheckRef.current = false;
    };
    // Sin pathname en deps: solo montaje (y dev/supabase/store). Evita getSession en cada navegación.
  }, [supabase, router, setStoreUser, resetStore]);

  return user;
}

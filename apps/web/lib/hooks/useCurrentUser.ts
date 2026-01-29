'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
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
  
  // Protección contra loops: rastrear si ya estamos redirigiendo o si hay rate limit
  const isRedirectingRef = useRef(false);
  const hasRateLimitRef = useRef(false);
  const sessionCheckRef = useRef(false);

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

    // Si ya estamos en una ruta de auth, no hacer nada más
    if (pathname.startsWith(AUTH_PREFIX)) {
      return;
    }

    // Si ya estamos redirigiendo, no hacer nada
    if (isRedirectingRef.current) {
      return;
    }

    // Verificar rate limit en localStorage PRIMERO (antes de cualquier llamada)
    if (hasActiveRateLimit()) {
      hasRateLimitRef.current = true;
      console.warn('[useCurrentUser] Rate limit activo detectado en localStorage, evitando peticiones');
      return;
    }

    // Si detectamos rate limit en ref, no hacer más peticiones
    if (hasRateLimitRef.current) {
      return;
    }

    async function syncInitialSession() {
      // Evitar múltiples llamadas simultáneas
      if (sessionCheckRef.current) {
        return;
      }
      sessionCheckRef.current = true;

      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (!active) {
          return;
        }

        // Detectar rate limit
        if (error) {
          const isRateLimit = 
            error.message?.toLowerCase().includes('rate limit') ||
            error.message?.toLowerCase().includes('too many requests') ||
            error.status === 429;
          
          if (isRateLimit) {
            console.warn('[useCurrentUser] Rate limit detectado, evitando más peticiones');
            hasRateLimitRef.current = true;
            // Guardar en localStorage para prevenir llamadas futuras
            if (typeof window !== 'undefined') {
              const rateLimitUntil = Date.now() + (20 * 60 * 1000); // 20 minutos
              localStorage.setItem('supabase_rate_limit_until', rateLimitUntil.toString());
            }
            // No hacer nada más, dejar que el usuario use la app en modo limitado
            return;
          }
        }

        if (!data.session) {
          clearClientSessionArtifacts();
          resetStore();
          setUser(null);
          
          // Solo redirigir si no estamos ya en auth y no estamos ya redirigiendo
          if (!pathname.startsWith(AUTH_PREFIX) && !isRedirectingRef.current) {
            isRedirectingRef.current = true;
            router.replace('/auth/login');
          }
          return;
        }

        const mapped = mapSessionToUser(data.session);
        setStoreUser(mapped);
        setUser(mapped);
        hasRateLimitRef.current = false; // Reset rate limit flag si tenemos sesión
      } catch (err) {
        console.error('[useCurrentUser] Error obteniendo sesión:', err);
        if (!active) return;
        
        // Si hay error de red o similar, no intentar redirigir inmediatamente
        // para evitar loops
      } finally {
        sessionCheckRef.current = false;
      }
    }

    void syncInitialSession();

    // Solo suscribirse a cambios de auth si NO hay rate limit activo
    let subscription: { unsubscribe: () => void } | null = null;
    
    if (!hasActiveRateLimit() && !hasRateLimitRef.current) {
      const {
        data: { subscription: authSubscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!active) {
          return;
        }

        // Verificar rate limit antes de procesar
        if (hasActiveRateLimit()) {
          hasRateLimitRef.current = true;
          return;
        }

        // Si detectamos rate limit, no procesar cambios
        if (hasRateLimitRef.current && !session) {
          return;
        }

      if (!session) {
        clearClientSessionArtifacts();
        resetStore();
        setUser(null);
        
        // Solo redirigir si no estamos ya en auth y no estamos ya redirigiendo
        if (!pathname.startsWith(AUTH_PREFIX) && !isRedirectingRef.current) {
          isRedirectingRef.current = true;
          router.replace('/auth/login');
        }
        return;
      }

      // Reset flags si tenemos sesión válida
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
      if (subscription) {
        subscription.unsubscribe();
      }
      // Reset flags al desmontar
      isRedirectingRef.current = false;
      sessionCheckRef.current = false;
    };
  }, [devModeEnabled, supabase, pathname, router, setStoreUser, resetStore]);

  return user;
}

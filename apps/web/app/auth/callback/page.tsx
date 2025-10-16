'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import { useDevMode } from '@/lib/dev-mode-context';
import type { Database } from '@/lib/types/supabase.gen';
import { getDefaultRouteForRole, normalizeRole } from '@/lib/roles';

function sanitizeRedirect(target: string | null): string | null {
  if (!target) {
    return null;
  }

  if (!target.startsWith('/')) {
    return null;
  }

  if (target.startsWith('/auth')) {
    return null;
  }

  return target;
}

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { devModeEnabled } = useDevMode();
  const supabase = useMemo(
    () => createClientComponentClient<Database>(),
    []
  );
  const defaultDevRoute = getDefaultRouteForRole('ADMIN');
  const redirectParam = searchParams?.get('redirect') ?? null;
  const redirectTarget = sanitizeRedirect(redirectParam);

  useEffect(() => {
    let active = true;

    async function resolveSession() {
      if (devModeEnabled) {
        const target = redirectTarget ?? defaultDevRoute;
        router.replace(target);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!active) {
        return;
      }

      if (!data.session) {
        router.replace('/auth/login');
        return;
      }

      const sessionUser = data.session.user;
      const role = normalizeRole(
        (sessionUser.app_metadata as Record<string, unknown> | undefined)?.role ??
          (sessionUser.user_metadata as Record<string, unknown> | undefined)?.role
      );

      if (!role) {
        const selectionPath = redirectTarget
          ? `/auth/select-role?redirect=${encodeURIComponent(redirectTarget)}`
          : '/auth/select-role';
        router.replace(selectionPath);
        return;
      }

      const target = redirectTarget ?? getDefaultRouteForRole(role);
      router.replace(target);
    }

    void resolveSession();

    return () => {
      active = false;
    };
  }, [
    devModeEnabled,
    defaultDevRoute,
    redirectTarget,
    router,
    supabase,
  ]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F6F7] px-4 text-[#0D3B3B]">
      <p className="text-center text-lg font-semibold">
        Verificando sesión segura…
      </p>
    </div>
  );
}

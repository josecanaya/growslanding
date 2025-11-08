'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation';
import type { Route } from 'next';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import { Button } from '@/components/ui/button';
import { useDevMode } from '@/lib/dev-mode-context';
import { mockUser } from '@/lib/mockUser';
import type { Database } from '@/lib/types/supabase.gen';
import { getDefaultRouteForRole, normalizeRole } from '@/lib/roles';

const AUTH_LOGIN_PATH = '/auth/login';
const MISSING_ROLE_MESSAGE =
  'Tu cuenta no tiene rol asignado. Contacta a soporte.';

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

function StatusMessage({ text }: { text: string | null }) {
  if (!text) {
    return null;
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {text}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { devModeEnabled } = useDevMode();
  const supabase = useMemo(
    () => createClientComponentClient<Database>(),
    []
  );

  const [googleError, setGoogleError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [missingRole, setMissingRole] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const redirectParam = searchParams?.get('redirect') ?? null;
  const redirectTarget = sanitizeRedirect(redirectParam);
  const errorParam = searchParams?.get('error') ?? null;
  const defaultDevRoute = getDefaultRouteForRole('ADMIN');

  useEffect(() => {
    if (errorParam === 'missing-role') {
      setMissingRole(true);
      setStatusMessage(MISSING_ROLE_MESSAGE);
      return;
    }

    setMissingRole(false);

    if (errorParam === 'unauthorized') {
      setStatusMessage('No tienes acceso a la seccion solicitada.');
      return;
    }

    if (errorParam) {
      setStatusMessage('No se pudo validar tu sesion. Intenta nuevamente.');
      return;
    }

    setStatusMessage(null);
  }, [errorParam]);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      if (devModeEnabled) {
        const target = redirectTarget ?? defaultDevRoute;
        if (pathname !== target) {
          router.replace(target as Route);
        }
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!active || !data.session) {
        return;
      }

      const sessionUser = data.session.user;
      const role = normalizeRole(
        (sessionUser.app_metadata as Record<string, unknown> | undefined)?.role ??
          (sessionUser.user_metadata as Record<string, unknown> | undefined)?.role
      );

      if (!role) {
        setMissingRole(true);
        setStatusMessage(MISSING_ROLE_MESSAGE);
        return;
      }

      setMissingRole(false);
      setStatusMessage(null);

      const defaultRoute = getDefaultRouteForRole(role);
      const target = redirectTarget ?? defaultRoute;

      if (pathname === target) {
        return;
      }

      if (pathname === AUTH_LOGIN_PATH && target === AUTH_LOGIN_PATH) {
        return;
      }

      router.replace(target as Route);
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, [
    devModeEnabled,
    defaultDevRoute,
    redirectTarget,
    router,
    supabase,
    pathname,
  ]);

  async function handleGoogleLogin() {
    setIsLoading(true);
    setGoogleError(null);

    if (devModeEnabled) {
      const target = redirectTarget ?? defaultDevRoute;
      if (pathname !== target) {
        router.replace(target as Route);
      }
      return;
    }

    try {
      const origin = window.location.origin;
      const redirectUrl = new URL('/auth/callback', origin);
      if (redirectTarget) {
        redirectUrl.searchParams.set('redirect', redirectTarget);
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl.toString(),
          queryParams: {
            prompt: 'consent',
            access_type: 'offline',
          },
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('[GOOGLE_LOGIN_ERROR]', error);
      setGoogleError(
        error instanceof Error
          ? error.message
          : 'No fue posible iniciar sesion con Google. Intenta nuevamente.'
      );
      setIsLoading(false);
    }
  }

  if (missingRole && !devModeEnabled) {
    const selectionPath = redirectTarget
      ? `/auth/select-role?redirect=${encodeURIComponent(redirectTarget)}`
      : '/auth/select-role';

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0D3B3B] px-4 py-12 text-[#FFFFFF]">
        <div className="w-full max-w-md space-y-6 rounded-3xl bg-[#F5F6F7] p-10 text-center text-[#333333] shadow-2xl">
          <StatusMessage text={MISSING_ROLE_MESSAGE} />
          <p className="text-sm text-[#333333]">
            Elegí el rol que mejor describe tu perfil para personalizar tu experiencia en GROWS.
          </p>
          <Button
            asChild
            className="mx-auto w-full max-w-xs bg-[#FFD700] text-[#0D3B3B] hover:bg-[#e6c200]"
          >
            <Link href={selectionPath as Route}>Elegir mi rol</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D3B3B] px-4 py-12 text-[#FFFFFF]">
      <div className="w-full max-w-md space-y-6 rounded-3xl bg-[#F5F6F7] p-10 text-center text-[#333333] shadow-2xl">
        {statusMessage && statusMessage !== MISSING_ROLE_MESSAGE ? (
          <StatusMessage text={statusMessage} />
        ) : null}

        <header className="space-y-2">
          <div className="text-3xl font-extrabold tracking-tight text-[#0D3B3B]">
            GROWS
          </div>
          <p className="text-sm text-[#333333] opacity-80">
            Plataforma constructiva inteligente
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-[#0D3B3B]">
            Iniciar Sesion en GROWS
          </h2>
          <p className="text-sm text-[#333333] opacity-70">
            Accede con tu cuenta corporativa para continuar.
          </p>
        </section>

        <Button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FFD700] px-4 py-3 text-base font-bold text-[#0D3B3B] shadow-lg transition-all hover:bg-[#e6c200] focus-visible:ring-2 focus-visible:ring-[#0D3B3B]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path
              fill="#FFC107"
              d="M43.6 20.5H42V20H24v8h11.3C33.9 32.9 29.4 36 24 36 16.8 36 11 30.2 11 23s5.8-13 13-13c3.3 0 6.3 1.2 8.6 3.2l5.7-5.7C34.2 4.3 29.4 2 24 2 12.9 2 4 10.9 4 22s8.9 20 20 20c11.6 0 19.6-8.1 19.6-19.5 0-1.3-.1-2.3-.4-3z"
            />
            <path
              fill="#FF3D00"
              d="M6.3 14.7l6.6 4.8C14.6 16.1 18.9 13 24 13c3.3 0 6.3 1.2 8.6 3.2l5.7-5.7C34.2 4.3 29.4 2 24 2 16 2 9.1 6.5 6.3 14.7z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.3 0 10.1-1.7 13.9-4.6l-6.4-5.2C29.3 36.9 26.8 37.8 24 37.8c-5.4 0-9.9-3.6-11.6-8.5l-6.6 5C9.1 39.5 16 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.6 20.5H42V20H24v8h11.3C34.9 32.9 29.4 36 24 36c-5.4 0-9.9-3.6-11.6-8.5l-6.6 5C9.1 39.5 16 44 24 44c11.6 0 19.6-8.1 19.6-19.5 0-1.3-.1-2.3-.4-3z"
            />
          </svg>
          {isLoading ? 'Conectando con Google…' : 'Continuar con Google'}
        </Button>

        {googleError ? (
          <p className="text-sm font-medium text-red-600">{googleError}</p>
        ) : null}

        {devModeEnabled ? (
          <div className="rounded-lg bg-[#0D3B3B]/10 px-4 py-3 text-sm text-[#0D3B3B]">
            Modo desarrollador activo. Acceso directo disponible con{' '}
            <span className="font-semibold">{mockUser.email}</span>.
          </div>
        ) : null}

        <footer className="pt-4 text-sm text-[#333333] opacity-70">
          Al continuar aceptas nuestras politicas de uso y privacidad.
        </footer>
      </div>
    </div>
  );
}

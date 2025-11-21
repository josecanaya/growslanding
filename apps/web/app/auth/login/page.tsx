'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import {
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation';
import type { Route } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useDevMode } from '@/lib/dev-mode-context';
import { mockUser } from '@/lib/mockUser';
import type { Database } from '@/lib/types/supabase.gen';
import { getDefaultRouteForRole, normalizeRole } from '@/lib/roles';
import { getAppWebUrl } from '@/lib/config';

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

function LoginPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { devModeEnabled } = useDevMode();
  const supabase = useMemo(
    () => createClientComponentClient<Database>(),
    []
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [missingRole, setMissingRole] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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

  async function handleEmailPasswordLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);
    setGoogleError(null);

    if (devModeEnabled) {
      const target = redirectTarget ?? defaultDevRoute;
      if (pathname !== target) {
        router.replace(target as Route);
      }
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.session) {
        throw new Error('No se pudo crear la sesión');
      }

      const sessionUser = data.session.user;
      const role = normalizeRole(
        (sessionUser.app_metadata as Record<string, unknown> | undefined)?.role ??
          (sessionUser.user_metadata as Record<string, unknown> | undefined)?.role
      );

      if (!role) {
        setMissingRole(true);
        setStatusMessage(MISSING_ROLE_MESSAGE);
        setIsLoading(false);
        return;
      }

      const defaultRoute = getDefaultRouteForRole(role);
      const target = redirectTarget ?? defaultRoute;
      router.replace(target as Route);
    } catch (error) {
      console.error('[EMAIL_PASSWORD_LOGIN_ERROR]', error);
      setStatusMessage(
        error instanceof Error
          ? error.message
          : 'Credenciales inválidas. Intenta nuevamente.'
      );
      setIsLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setIsGoogleLoading(true);
    setGoogleError(null);
    setStatusMessage(null);

    if (devModeEnabled) {
      const target = redirectTarget ?? defaultDevRoute;
      if (pathname !== target) {
        router.replace(target as Route);
      }
      return;
    }

    try {
      const appBaseUrl = getAppWebUrl();
      const redirectUrl = new URL('/auth/callback', appBaseUrl);
      if (redirectTarget) {
        redirectUrl.searchParams.set('redirect', redirectTarget);
      }

      const redirectToUrl = redirectUrl.toString();
      console.log('[GOOGLE_LOGIN] Redirect URL:', redirectToUrl);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectToUrl,
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
      setIsGoogleLoading(false);
    }
  }

  if (missingRole && !devModeEnabled) {
    const selectionPath = redirectTarget
      ? `/auth/select-role?redirect=${encodeURIComponent(redirectTarget)}`
      : '/auth/select-role';

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F4F4] px-4 py-12">
        <div className="flex w-full max-w-6xl flex-col items-center justify-center gap-16 md:flex-row">
          {/* Columna izquierda: Mensaje de error */}
          <div className="flex w-full max-w-md items-center justify-center">
            <Card className="w-full rounded-lg border border-gray-200 bg-white p-10 shadow-sm">
              <CardContent className="space-y-6 p-0 text-center">
                <StatusMessage text={MISSING_ROLE_MESSAGE} />
                <p className="text-sm text-gray-600">
                  Elegí el rol que mejor describe tu perfil para personalizar tu experiencia en GROWS.
                </p>
                <Button
                  asChild
                  className="h-12 w-full rounded-md bg-[#002E5D] text-white shadow-sm transition-colors hover:bg-[#003d7a]"
                >
                  <Link href={selectionPath as Route}>Elegir mi rol</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Columna derecha: Imagen (oculta en mobile) */}
          <div className="hidden h-[600px] w-full max-w-[460px] items-center justify-center md:flex">
            <div className="relative h-full w-full">
              <Image
                src="/images/Login.png"
                alt="GROWS Login"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F4F4] px-4 py-12">
      <div className="flex w-full max-w-6xl flex-col items-center justify-center gap-16 md:flex-row">
        {/* Columna izquierda: Formulario */}
        <div className="flex w-full max-w-md items-center justify-center">
          <Card className="w-full rounded-lg border border-gray-200 bg-white p-10 shadow-sm">
            <CardContent className="space-y-6 p-0">
              <div className="space-y-2 text-center">
                <h1 className="text-2xl font-semibold text-[#002E5D]">
                  Ingresar a GROWS
                </h1>
              </div>

              {statusMessage && statusMessage !== MISSING_ROLE_MESSAGE ? (
                <StatusMessage text={statusMessage} />
              ) : null}

              {googleError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {googleError}
                </div>
              ) : null}

              <form onSubmit={handleEmailPasswordLogin} className="space-y-5">
                <div className="space-y-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Correo electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading || isGoogleLoading}
                    className="h-12 w-full rounded-md placeholder:text-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading || isGoogleLoading}
                    className="h-12 w-full rounded-md placeholder:text-gray-400"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  className="h-12 w-full rounded-md bg-[#002E5D] text-white shadow-sm transition-colors hover:bg-[#003d7a] disabled:opacity-50"
                >
                  {isLoading ? 'Ingresando…' : 'Ingresar'}
                </Button>
              </form>

              <div className="flex items-center gap-2">
                <span className="h-px flex-1 bg-gray-200" />
                <span className="text-xs uppercase text-gray-400">o</span>
                <span className="h-px flex-1 bg-gray-200" />
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                disabled={isLoading || isGoogleLoading}
                className="h-12 w-full rounded-md border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-[#f8f8f8] disabled:opacity-50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  className="mr-2 h-5 w-5"
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
                {isGoogleLoading ? 'Conectando…' : 'Ingresar con Google'}
              </Button>

              <div className="pt-4 text-center text-sm text-gray-600">
                <span className="text-gray-500">¿No tenés cuenta? </span>
                <Link
                  href="/auth/register"
                  className="font-medium text-[#002E5D] transition-colors hover:underline"
                >
                  Registrate
                </Link>
              </div>

              {devModeEnabled ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  Modo desarrollador activo. Acceso directo disponible con{' '}
                  <span className="font-semibold">{mockUser.email}</span>.
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha: Imagen (oculta en mobile) */}
        <div className="hidden h-[600px] w-full max-w-[460px] items-center justify-center md:flex">
          <div className="relative h-full w-full">
            <Image
              src="/images/Login.png"
              alt="GROWS Login"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F4F4F4] px-4 py-12">
          <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-[#002E5D] shadow-sm">
            Preparando inicio de sesión…
          </div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}

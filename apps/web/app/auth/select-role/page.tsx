'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useDevMode } from '@/lib/dev-mode-context';
import { mockUser } from '@/lib/mockUser';
import type { Database } from '@/lib/types/supabase.gen';
import {
  getDefaultRouteForRole,
  normalizeRole,
  type UserRole,
} from '@/lib/roles';

const ROLE_CHOICES: Array<{ key: UserRole; title: string; description: string }> =
  [
    {
      key: 'CLIENTE_TECNICO',
      title: 'Soy Cliente Técnico',
      description: 'Gestiono obras, coordino a socios y valido avances.',
    },
    {
      key: 'SOCIO',
      title: 'Soy Socio Constructor',
      description: 'Ejecuto tareas en obra y reporto avances con mi equipo.',
    },
  ];

function SelectRolePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { devModeEnabled } = useDevMode();
  const supabase = useMemo(
    () => createClientComponentClient<Database>(),
    []
  );

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const redirectParam = searchParams?.get('redirect') ?? null;
  const redirectTarget =
    redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('/auth')
      ? redirectParam
      : null;

  useEffect(() => {
    let active = true;

    async function ensureSession() {
      if (devModeEnabled) {
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!active) {
        return;
      }

      if (!data.session) {
        router.replace('/auth/login' as Route);
      } else {
        const role =
          (data.session.user.app_metadata as Record<string, unknown> | undefined)?.role ??
          (data.session.user.user_metadata as Record<string, unknown> | undefined)?.role;

        if (typeof role === 'string' && role.length > 0) {
          const target = redirectTarget ?? getDefaultRouteForRole(role as UserRole);
          router.replace(target as Route);
        }
      }
    }

    void ensureSession();

    return () => {
      active = false;
    };
  }, [devModeEnabled, router, supabase, redirectTarget]);

  async function handleRoleSelection(role: UserRole) {
    if (loading) {
      return;
    }

    setStatusMessage('Guardando tu rol...');

    if (devModeEnabled && role === 'ADMIN') {
      const target = redirectTarget ?? getDefaultRouteForRole('ADMIN');
      router.replace(target as Route);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { role },
      });

      if (error) {
        throw error;
      }

      let resolvedRole = role;
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionRole = sessionData.session
        ? normalizeRole(
            (sessionData.session.user.app_metadata as Record<string, unknown> | undefined)
              ?.role ??
              (sessionData.session.user.user_metadata as Record<string, unknown> | undefined)
                ?.role
          )
        : null;

      if (!sessionRole) {
        const { data: refreshed, error: refreshError } =
          await supabase.auth.refreshSession();

        if (!refreshError && refreshed.session) {
          const refreshedRole = normalizeRole(
            (refreshed.session.user.app_metadata as Record<string, unknown> | undefined)?.role ??
              (refreshed.session.user.user_metadata as Record<string, unknown> | undefined)?.role
          );

          if (refreshedRole) {
            resolvedRole = refreshedRole;
          }
        }
      } else {
        resolvedRole = sessionRole;
      }

      const target = redirectTarget ?? getDefaultRouteForRole(resolvedRole);
      setStatusMessage(null);
      router.replace(target as Route);
    } catch (error) {
      console.error('[SELECT_ROLE_ERROR]', error);
      setStatusMessage(
        error instanceof Error
          ? error.message
          : 'No pudimos guardar tu rol. Intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F4F4] px-4 py-12">
      <div className="flex w-full max-w-6xl flex-col items-center justify-center gap-16 md:flex-row">
        {/* Columna izquierda: Formulario */}
        <div className="flex w-full max-w-2xl items-center justify-center">
          <Card className="w-full rounded-lg border border-gray-200 bg-white p-10 shadow-sm">
            <CardContent className="space-y-8 p-0">
              <header className="space-y-2 text-center">
                <h1 className="text-2xl font-semibold text-[#002E5D]">
                  Bienvenido a GROWS
                </h1>
                <p className="text-sm text-gray-600">
                  Elegí tu rol para configurar la experiencia adecuada.
                </p>
              </header>

              {statusMessage ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {statusMessage}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                {ROLE_CHOICES.map((choice) => (
                  <button
                    key={choice.key}
                    type="button"
                    disabled={loading}
                    onClick={() => handleRoleSelection(choice.key)}
                    className="group flex h-full flex-col items-center justify-between rounded-lg border border-gray-200 bg-white px-6 py-8 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-[#002E5D] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="space-y-3 text-center">
                      <h2 className="text-lg font-semibold text-[#002E5D]">
                        {choice.title}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {choice.description}
                      </p>
                    </div>
                    <span className="mt-6 inline-flex items-center rounded-md bg-[#002E5D] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors group-hover:bg-[#003d7a]">
                      Continuar
                    </span>
                  </button>
                ))}
              </div>

              {devModeEnabled ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-5 text-sm text-blue-700">
                  <p className="mb-3 font-medium">
                    Opciones de prueba (solo visibles en modo desarrollador)
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button
                      variant="outline"
                      className="rounded-md border-gray-300 text-[#002E5D] hover:bg-gray-50"
                      disabled={loading}
                      onClick={() => handleRoleSelection('ADMIN')}
                    >
                      Entrar como ADMIN (modo prueba)
                    </Button>
                    <p className="text-xs text-gray-600">
                      No se guarda en Supabase; acceso directo como {mockUser.role}.
                    </p>
                  </div>
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
              alt="GROWS Select Role"
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

export default function SelectRolePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F4F4F4] px-4 py-12">
          <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-[#002E5D] shadow-sm">
            Cargando…
          </div>
        </div>
      }
    >
      <SelectRolePageContent />
    </Suspense>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import { Button } from '@/components/ui/button';
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

export default function SelectRolePage() {
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
    <div className="flex min-h-screen items-center justify-center bg-[#0D3B3B] px-4 py-12 text-white">
      <div className="w-full max-w-2xl space-y-8 rounded-3xl bg-[#F5F6F7] p-10 text-center text-[#333333] shadow-2xl">
        <header className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0D3B3B]">
            Bienvenido a GROWS
          </h1>
          <p className="text-sm text-[#333333] opacity-70">
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
              className="group flex h-full flex-col items-center justify-between rounded-2xl border border-[#0D3B3B]/15 bg-white px-6 py-8 text-left shadow-sm transition hover:-translate-y-1 hover:border-[#FFD700] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-75"
            >
              <div className="space-y-3 text-center">
                <h2 className="text-xl font-semibold text-[#0D3B3B]">
                  {choice.title}
                </h2>
                <p className="text-sm text-[#333333]/80">
                  {choice.description}
                </p>
              </div>
              <span className="mt-6 inline-flex items-center rounded-full bg-[#FFD700] px-4 py-2 text-sm font-semibold text-[#0D3B3B] shadow transition group-hover:bg-[#e6c200]">
                Continuar
              </span>
            </button>
          ))}
        </div>

        {devModeEnabled ? (
          <div className="rounded-2xl border border-dashed border-[#FFD700]/60 bg-[#FFD700]/10 p-5 text-sm text-[#0D3B3B]">
            <p className="mb-3 font-medium">
              Opciones de prueba (solo visibles en modo desarrollador)
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="outline"
                className="border-[#FFD700] text-[#0D3B3B] hover:bg-[#FFD700] hover:text-[#0D3B3B]"
                disabled={loading}
                onClick={() => handleRoleSelection('ADMIN')}
              >
                Entrar como ADMIN (modo prueba)
              </Button>
              <p className="text-xs text-[#0D3B3B]/70">
                No se guarda en Supabase; acceso directo como {mockUser.role}.
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

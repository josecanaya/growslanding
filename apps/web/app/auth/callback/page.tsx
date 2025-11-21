"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

import type { Database } from "@/lib/types/supabase.gen";
import { getDefaultRouteForRole, normalizeRole } from "@/lib/roles";

function sanitizeRedirect(target: string | null): string | null {
  if (!target) {
    return null;
  }

  if (!target.startsWith("/")) {
    return null;
  }

  if (target.startsWith("/auth")) {
    return null;
  }

  return target;
}

function CallbackPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClientComponentClient<Database>(), []);
  const redirectParam = searchParams?.get("redirect") ?? null;
  const redirectTarget = sanitizeRedirect(redirectParam);

  const hasRunRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function resolveSession() {
      // Prevenir ejecuciones múltiples
      if (hasRunRef.current) {
        return;
      }
      hasRunRef.current = true;
      try {
        // Intercambiar código OAuth por sesión si está presente en la URL
        const code = searchParams?.get("code");
        if (code) {
          // Intentar intercambiar código UNA SOLA VEZ (sin retry para evitar loops)
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error(
              "[OAUTH_CALLBACK_ERROR] Error al intercambiar código:",
              exchangeError
            );
            
            // Detectar error de rate limit específicamente
            const isRateLimit = 
              exchangeError.message?.toLowerCase().includes('rate limit') ||
              exchangeError.message?.toLowerCase().includes('too many requests') ||
              exchangeError.status === 429;
            
            if (active) {
              // Redirigir inmediatamente sin reintentar para evitar más requests
              if (isRateLimit) {
                router.replace("/auth/login?error=rate_limit" as Route);
              } else {
                router.replace("/auth/login?error=oauth_failed" as Route);
              }
            }
            return;
          }
        }

        const { data, error: sessionError } = await supabase.auth.getSession();

        if (!active) {
          return;
        }

        if (sessionError) {
          console.error(
            "[OAUTH_CALLBACK_ERROR] Error al obtener sesión:",
            sessionError
          );
          router.replace("/auth/login?error=session_error" as Route);
          return;
        }

        if (!data.session) {
          router.replace("/auth/login?error=no_session" as Route);
          return;
        }

        const sessionUser = data.session.user;
        const role = normalizeRole(
          (sessionUser.app_metadata as Record<string, unknown> | undefined)
            ?.role ??
            (sessionUser.user_metadata as Record<string, unknown> | undefined)
              ?.role
        );

        if (!role) {
          const selectionPath = redirectTarget
            ? `/auth/select-role?redirect=${encodeURIComponent(redirectTarget)}`
            : "/auth/select-role";
          router.replace(selectionPath as Route);
          return;
        }

        const target = redirectTarget ?? getDefaultRouteForRole(role);
        router.replace(target as Route);
      } catch (error) {
        console.error("[OAUTH_CALLBACK_ERROR] Error inesperado:", error);
        if (active) {
          router.replace("/auth/login?error=unexpected" as Route);
        }
      }
    }

    void resolveSession();

    return () => {
      active = false;
    };
  }, [
    redirectTarget,
    router,
    searchParams,
    supabase,
  ]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F6F7] px-4 text-[#0D3B3B]">
      <div className="text-center">
        <p className="text-lg font-semibold callback-loading-message">
          Verificando sesión segura…
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Si ves un error de límite de velocidad, espera 10-15 minutos antes de intentar nuevamente.
        </p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F5F6F7] px-4 text-[#0D3B3B]">
          <p className="text-center text-lg font-semibold">
            Verificando sesión…
          </p>
        </div>
      }
    >
      <CallbackPageContent />
    </Suspense>
  );
}

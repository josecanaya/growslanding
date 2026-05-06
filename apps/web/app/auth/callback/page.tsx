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

const PKCE_STORAGE_PREFIX = "grows_pkce:";

function pkceStorageKey(code: string) {
  return `${PKCE_STORAGE_PREFIX}${code}`;
}

/** Strict Mode puede dejar “running”; no spamear getSession (provoca 429 y loop OAuth). */
async function waitForPkcePeer(
  supabase: ReturnType<typeof createClientComponentClient<Database>>,
  code: string,
  maxMs = 15_000,
) {
  const key = pkceStorageKey(code);
  const start = Date.now();
  const intervalMs = 450;

  while (Date.now() - start < maxMs) {
    if (typeof window !== "undefined" && sessionStorage.getItem(key) === "done") {
      return;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  return;
}

function CallbackPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClientComponentClient<Database>(), []);
  const redirectParam = searchParams?.get("redirect") ?? null;
  const redirectTarget = sanitizeRedirect(redirectParam);

  const hasRunRef = useRef(false);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function resolveSession() {
      // Prevenir ejecuciones múltiples
      if (hasRunRef.current || isProcessingRef.current) {
        return;
      }
      // Si ya detectamos rate limit recientemente, no volver a golpear auth.
      if (typeof window !== 'undefined') {
        const rateLimitUntil = localStorage.getItem('supabase_rate_limit_until');
        if (rateLimitUntil) {
          const untilTime = parseInt(rateLimitUntil, 10);
          if (Date.now() < untilTime) {
            if (active) {
              router.replace("/auth/login?error=rate_limit" as Route);
            }
            return;
          }
          localStorage.removeItem('supabase_rate_limit_until');
        }
      }
      hasRunRef.current = true;
      isProcessingRef.current = true;
      try {
        const rawCode = searchParams?.get("code");
        const code = rawCode?.trim() ? rawCode.trim() : "";

        if (code && typeof window !== "undefined") {
          const pkceKey = pkceStorageKey(code);
          const peerState = sessionStorage.getItem(pkceKey);

          if (peerState === "done") {
            // Ya intercambiado en este tab (p. ej. segundo montaje de Strict Mode)
          } else if (peerState === "running") {
            await waitForPkcePeer(supabase, code);
          } else {
            sessionStorage.setItem(pkceKey, "running");
            try {
              const { error: exchangeError } =
                await supabase.auth.exchangeCodeForSession(code);

              if (exchangeError) {
                console.error(
                  "[OAUTH_CALLBACK_ERROR] Error al intercambiar código:",
                  exchangeError,
                );

                const isRateLimit =
                  exchangeError.message?.toLowerCase().includes("rate limit") ||
                  exchangeError.message?.toLowerCase().includes("too many requests") ||
                  exchangeError.status === 429;

                if (isRateLimit) {
                  console.warn(
                    "[OAUTH_CALLBACK] Rate limit alcanzado, redirigiendo a login",
                  );
                  sessionStorage.removeItem(pkceKey);
                  const rateLimitUntil = Date.now() + 60 * 1000;
                  localStorage.setItem(
                    "supabase_rate_limit_until",
                    rateLimitUntil.toString(),
                  );
                  if (active) {
                    router.replace("/auth/login?error=rate_limit" as Route);
                  }
                  return;
                }

                const errMsg = (exchangeError.message ?? "").toLowerCase();
                const isPkceError =
                  errMsg.includes("code verifier") ||
                  errMsg.includes("code_verifier") ||
                  errMsg.includes("both auth code and code verifier") ||
                  errMsg.includes("should be non-empty");

                sessionStorage.removeItem(pkceKey);

                if (isPkceError) {
                  const loginPath =
                    "/auth/login?error=pkce_error" +
                    (redirectTarget
                      ? `&redirect=${encodeURIComponent(redirectTarget)}`
                      : "");
                  if (active) {
                    router.replace(loginPath as Route);
                  }
                  return;
                }

                console.error(
                  "[OAUTH_CALLBACK] Error OAuth no manejado:",
                  exchangeError,
                );
                if (active) {
                  router.replace("/auth/login?error=oauth_failed" as Route);
                }
                return;
              }
              sessionStorage.setItem(pkceKey, "done");
            } catch (e) {
              sessionStorage.removeItem(pkceKey);
              throw e;
            }
          }
        }

        const result = await supabase.auth.getSession();
        const sessionData = result.data;
        const sessionError = result.error;

        if (!active) {
          return;
        }

        if (sessionError) {
          const isRateLimit =
            sessionError.message?.toLowerCase().includes('rate limit') ||
            sessionError.message?.toLowerCase().includes('too many requests') ||
            sessionError.status === 429;
          if (isRateLimit) {
            if (typeof window !== 'undefined') {
              const rateLimitUntil = Date.now() + (60 * 1000);
              localStorage.setItem('supabase_rate_limit_until', rateLimitUntil.toString());
            }
            router.replace("/auth/login?error=rate_limit" as Route);
            return;
          }
          console.error(
            "[OAUTH_CALLBACK_ERROR] Error al obtener sesión:",
            sessionError
          );
          router.replace("/auth/login?error=session_error" as Route);
          return;
        }

        if (!sessionData?.session) {
          router.replace("/auth/login?error=no_session" as Route);
          return;
        }

        const sessionUser = sessionData.session.user;
        
        // Verificar si viene del registro con Google para CLIENTE_TECNICO
        const roleParam = searchParams?.get('role');
        const isClienteTecnicoRegistration = roleParam === 'CLIENTE_TECNICO';

        const role = normalizeRole(
          (sessionUser.app_metadata as Record<string, unknown> | undefined)
            ?.role ??
            (sessionUser.user_metadata as Record<string, unknown> | undefined)
              ?.role
        );

        // Si viene del registro con Google como CLIENTE_TECNICO y no tiene rol, asignarlo
        if (!role && isClienteTecnicoRegistration) {
          try {
            // Llamar al endpoint para crear organización y asignar rol
            const response = await fetch('/api/auth/crear-cliente-tecnico', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: sessionUser.id,
                email: sessionUser.email,
                nombre: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'Usuario',
                telefono: sessionUser.user_metadata?.telefono || '',
                ciudad: sessionUser.user_metadata?.ciudad || '',
              }),
            });

            const result = await response.json();

            if (result.success) {
              console.log('[OAUTH_CALLBACK] CLIENTE_TECNICO configurado correctamente');
              // Evitar más lecturas de sesión acá para no disparar rate-limit en local.
              const target = redirectTarget ?? '/cliente/dashboard';
              router.replace(target as Route);
              return;
            } else {
              console.error('[OAUTH_CALLBACK] Error al configurar CLIENTE_TECNICO:', result.error);
              // Continuar con flujo normal
            }
          } catch (err) {
            console.error('[OAUTH_CALLBACK] Error al crear CLIENTE_TECNICO:', err);
            // Continuar con flujo normal
          }
        }

        // Si no tiene rol, verificar si es un socio invitado (Google Auth)
        if (!role) {
          // Buscar socio por email o teléfono
          const userEmail = sessionUser.email;
          const userPhone = (sessionUser.user_metadata as Record<string, unknown> | undefined)?.telefono as string | undefined;

          if (userEmail || userPhone) {
            try {
              // Llamar al endpoint del servidor para vincular socio
              const response = await fetch('/api/auth/vincular-socio', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: sessionUser.id,
                  email: userEmail,
                  telefono: userPhone,
                }),
              });

              const result = await response.json();

              if (result.success) {
                console.log('[OAUTH_CALLBACK] Socio vinculado correctamente');
                // Redirigir al panel del socio
                router.replace('/panel' as Route);
                return;
              } else {
                // No es un socio invitado, mostrar mensaje
                router.replace(
                  `/auth/login?error=${encodeURIComponent(
                    result.error || 'No estás invitado. Pedile a tu arquitecto que te registre.'
                  )}` as Route
                );
                return;
              }
            } catch (err) {
              console.error('[OAUTH_CALLBACK] Error al buscar socio:', err);
              // Continuar con flujo normal de selección de rol
            }
          }

          // Si no es socio, mostrar selección de rol
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
      } finally {
        isProcessingRef.current = false;
      }
    }

    void resolveSession();

    return () => {
      active = false;
      isProcessingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    redirectTarget,
    // No incluir supabase en dependencias (es estable)
    // No incluir searchParams completo (solo necesitamos el code una vez)
    // No incluir router (es estable en Next.js)
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

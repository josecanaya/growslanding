"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Session } from "@supabase/supabase-js";

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

/** Lock distinto al estado del intercambio: evita doble `exchangeCodeForSession` en Strict Mode (429). */
const PKCE_LOCK_PREFIX = "grows_pkce_lock:";

function pkceStorageKey(code: string) {
  return `${PKCE_STORAGE_PREFIX}${code}`;
}

function pkceLockKey(code: string) {
  return `${PKCE_LOCK_PREFIX}${code}`;
}

/**
 * Solo una instancia (incl. remount Strict Mode) debe intercambiar el código.
 * Debe llamarse de forma síncrona antes del primer `await` del flujo PKCE.
 */
function tryClaimPkceExchange(code: string): "leader" | "waiter" | "skip_done" {
  if (typeof window === "undefined") return "leader";
  const stateKey = pkceStorageKey(code);
  const lockKey = pkceLockKey(code);
  const state = sessionStorage.getItem(stateKey);
  if (state === "done" || state === "rate_limited") {
    return "skip_done";
  }
  const lock = sessionStorage.getItem(lockKey);
  if (lock === "1") {
    return "waiter";
  }
  sessionStorage.setItem(lockKey, "1");
  return "leader";
}

function releasePkceLock(code: string) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(pkceLockKey(code));
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
    if (typeof window === "undefined") break;
    const v = sessionStorage.getItem(key);
    if (v === "done" || v === "rate_limited") {
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

        let resolvedSession: Session | null = null;

        const applySessionFetchError = (
          sessionError: { message?: string; status?: number } | null,
        ) => {
          if (!sessionError) return false;
          const isRateLimit =
            sessionError.message?.toLowerCase().includes("rate limit") ||
            sessionError.message?.toLowerCase().includes("too many requests") ||
            sessionError.status === 429;
          if (isRateLimit) {
            if (typeof window !== "undefined") {
              const rateLimitUntil = Date.now() + 5 * 60 * 1000;
              localStorage.setItem(
                "supabase_rate_limit_until",
                rateLimitUntil.toString(),
              );
            }
            router.replace("/auth/login?error=rate_limit" as Route);
            return true;
          }
          console.error(
            "[OAUTH_CALLBACK_ERROR] Error al obtener sesión:",
            sessionError,
          );
          router.replace("/auth/login?error=session_error" as Route);
          return true;
        };

        if (code && typeof window !== "undefined") {
          const pkceKey = pkceStorageKey(code);
          const peerState = sessionStorage.getItem(pkceKey);

          if (peerState === "rate_limited") {
            if (active) {
              router.replace("/auth/login?error=rate_limit" as Route);
            }
            return;
          }

          if (peerState === "done") {
            // Strict Mode / segundo render: no volver a intercambiar el código (gasta cuota Supabase).
            const result = await supabase.auth.getSession();
            if (!active) return;
            if (applySessionFetchError(result.error)) return;
            resolvedSession = result.data.session ?? null;
          } else if (peerState === "running") {
            await waitForPkcePeer(supabase, code);
            if (!active) return;
            const after = sessionStorage.getItem(pkceKey);
            if (after === "rate_limited") {
              if (active) {
                router.replace("/auth/login?error=rate_limit" as Route);
              }
              return;
            }
            const result = await supabase.auth.getSession();
            if (!active) return;
            if (applySessionFetchError(result.error)) return;
            resolvedSession = result.data.session ?? null;
          } else {
            const claim = tryClaimPkceExchange(code);

            if (claim === "skip_done") {
              const result = await supabase.auth.getSession();
              if (!active) return;
              if (applySessionFetchError(result.error)) return;
              resolvedSession = result.data.session ?? null;
            } else if (claim === "waiter") {
              await waitForPkcePeer(supabase, code);
              if (!active) return;
              const afterWait = sessionStorage.getItem(pkceKey);
              if (afterWait === "rate_limited") {
                if (active) {
                  router.replace("/auth/login?error=rate_limit" as Route);
                }
                return;
              }
              const result = await supabase.auth.getSession();
              if (!active) return;
              if (applySessionFetchError(result.error)) return;
              resolvedSession = result.data.session ?? null;
            } else {
              /** Leader: un solo intercambio PKCE; el lock en sessionStorage evita doble POST en Strict Mode. */
              sessionStorage.setItem(pkceKey, "running");
              const runExchange = async (): Promise<boolean> => {
              // Otro contexto bajo el mismo lock pudo terminar antes: no re-intercambiar (rompe PKCE).
              if (typeof window !== "undefined") {
                const donePeek = sessionStorage.getItem(pkceKey);
                if (donePeek === "done") {
                  const { data: peeked, error: peekErr } =
                    await supabase.auth.getSession();
                  if (peekErr) {
                    console.error(
                      "[OAUTH_CALLBACK_ERROR] Error al obtener sesión (post-done):",
                      peekErr,
                    );
                    if (active) {
                      router.replace("/auth/login?error=session_error" as Route);
                    }
                    return false;
                  }
                  resolvedSession = peeked.session ?? null;
                  return true;
                }
                if (donePeek === "rate_limited") {
                  if (active) {
                    router.replace("/auth/login?error=rate_limit" as Route);
                  }
                  return false;
                }
              }

              const { data: exchanged, error: exchangeError } =
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
                  sessionStorage.setItem(pkceKey, "rate_limited");
                  const rateLimitUntil = Date.now() + 5 * 60 * 1000;
                  localStorage.setItem(
                    "supabase_rate_limit_until",
                    rateLimitUntil.toString(),
                  );
                  if (active) {
                    router.replace("/auth/login?error=rate_limit" as Route);
                  }
                  return false;
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
                  return false;
                }

                console.error(
                  "[OAUTH_CALLBACK] Error OAuth no manejado:",
                  exchangeError,
                );
                if (active) {
                  router.replace("/auth/login?error=oauth_failed" as Route);
                }
                return false;
              }

              sessionStorage.setItem(pkceKey, "done");
              resolvedSession = exchanged.session ?? null;
              return true;
            };

              let exchangeOk = true;
              try {
                if (typeof navigator !== "undefined" && navigator.locks) {
                  exchangeOk = await navigator.locks.request(
                    `grows-oauth-pkce:${code}`,
                    runExchange,
                  );
                } else {
                  exchangeOk = await runExchange();
                }
              } catch (e) {
                sessionStorage.removeItem(pkceKey);
                throw e;
              } finally {
                releasePkceLock(code);
              }

              if (!active) return;
              if (!exchangeOk) return;
            }
          }
        }

        if (resolvedSession === null) {
          const result = await supabase.auth.getSession();
          if (!active) {
            return;
          }
          if (applySessionFetchError(result.error)) return;
          resolvedSession = result.data.session ?? null;
        }

        if (!resolvedSession) {
          router.replace("/auth/login?error=no_session" as Route);
          return;
        }

        const sessionUser = resolvedSession.user;
        
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

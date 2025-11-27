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
              // Recargar sesión para obtener el rol actualizado
              const { data: newSession } = await supabase.auth.getSession();
              if (newSession.session) {
                const newRole = normalizeRole(
                  (newSession.session.user.app_metadata as Record<string, unknown> | undefined)?.role ??
                  (newSession.session.user.user_metadata as Record<string, unknown> | undefined)?.role
                );
                if (newRole) {
                  const target = redirectTarget ?? getDefaultRouteForRole(newRole);
                  router.replace(target as Route);
                  return;
                }
              }
              // Si no se pudo obtener el nuevo rol, redirigir de todas formas
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

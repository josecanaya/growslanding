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
  const sessionFromPkceRef = useRef<{ session: any; user: any } | null>(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    let active = true;

    async function resolveSession() {
      // Prevenir ejecuciones múltiples
      if (hasRunRef.current || isProcessingRef.current) {
        return;
      }
      hasRunRef.current = true;
      isProcessingRef.current = true;
      try {
        // Intercambiar código OAuth por sesión si está presente en la URL
        const code = searchParams?.get("code");
        if (code && !sessionFromPkceRef.current) {
          // Intentar intercambiar código UNA SOLA VEZ (sin retry para evitar loops)
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error(
              "[OAUTH_CALLBACK_ERROR] Error al intercambiar código:",
              exchangeError
            );
            
            // Detectar error de rate limit PRIMERO - no hacer más peticiones
            const isRateLimit = 
              exchangeError.message?.toLowerCase().includes('rate limit') ||
              exchangeError.message?.toLowerCase().includes('too many requests') ||
              exchangeError.status === 429;
            
            if (isRateLimit) {
              // Error 429: NO hacer más peticiones, redirigir inmediatamente
              console.warn("[OAUTH_CALLBACK] Rate limit alcanzado, redirigiendo a login");
              if (active) {
                router.replace("/auth/login?error=rate_limit" as Route);
              }
              return;
            }
            
            // Si el error es por falta de code_verifier (PKCE)
            const isPkceError = 
              exchangeError.message?.toLowerCase().includes('code verifier') ||
              exchangeError.message?.toLowerCase().includes('invalid request') ||
              exchangeError.message?.toLowerCase().includes('both auth code and code verifier') ||
              exchangeError.message?.toLowerCase().includes('code_verifier');
            
            if (isPkceError) {
              // Este error ocurre cuando:
              // 1. El code_verifier no está en localStorage (cookies bloqueadas, modo incógnito, etc.)
              // 2. Múltiples pestañas intentando autenticar al mismo tiempo
              // 3. El code_verifier fue eliminado o expiró
              
              console.warn("[OAUTH_CALLBACK] Error PKCE - code_verifier faltante. Limpiando URL y redirigiendo.");
              
              // PRIMERO limpiar la URL para evitar que el código se vuelva a ejecutar
              if (active && typeof window !== 'undefined') {
                // Remover el parámetro 'code' de la URL inmediatamente
                const url = new URL(window.location.href);
                url.searchParams.delete('code');
                url.searchParams.delete('state');
                if (redirectTarget) {
                  url.searchParams.set('redirect', redirectTarget);
                }
                // Usar replaceState para cambiar la URL sin recargar
                window.history.replaceState({}, '', url.toString());
                // Marcar que ya procesamos este código para evitar loops
                hasRunRef.current = true;
              }
              
              // Intentar obtener sesión SOLO UNA VEZ (puede que ya esté autenticado en otra pestaña)
              // Si falla, redirigir sin más intentos
              try {
                const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
                
                // Si hay una sesión válida, guardarla y continuar con el flujo
                if (!sessionErr && sessionData?.session) {
                  // Sesión válida encontrada, guardarla para usar más abajo
                  sessionFromPkceRef.current = {
                    session: sessionData.session,
                    user: sessionData.session.user,
                  };
                  console.log("[OAUTH_CALLBACK] Sesión encontrada a pesar del error PKCE, continuando...");
                  // NO retornar aquí, dejar que el código continúe con el flujo normal usando esta sesión
                } else {
                  // No hay sesión válida, redirigir a login
                  console.warn("[OAUTH_CALLBACK] No se encontró sesión válida después de error PKCE");
                  if (active) {
                    router.replace("/auth/login?error=pkce_error" as Route);
                  }
                  return;
                }
              } catch (sessionCheckError) {
                // Si falla el getSession, redirigir directamente sin más intentos
                console.error("[OAUTH_CALLBACK] Error al verificar sesión después de PKCE:", sessionCheckError);
                if (active) {
                  router.replace("/auth/login?error=pkce_error" as Route);
                }
                return;
              }
            } else {
              // Otro tipo de error, redirigir sin reintentar
              console.error("[OAUTH_CALLBACK] Error OAuth no manejado:", exchangeError);
              if (active) {
                router.replace("/auth/login?error=oauth_failed" as Route);
              }
              return;
            }
          }
        }

        // Si ya tenemos una sesión del manejo PKCE, usarla; si no, obtenerla normalmente
        let sessionData;
        let sessionError;
        
        if (sessionFromPkceRef.current) {
          // Usar la sesión que ya obtuvimos durante el manejo de PKCE
          sessionData = { session: sessionFromPkceRef.current.session };
          sessionError = null;
        } else {
          // Obtener sesión normalmente
          const result = await supabase.auth.getSession();
          sessionData = result.data;
          sessionError = result.error;
        }

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

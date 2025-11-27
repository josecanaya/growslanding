'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';

function InviteAcceptPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(
    () => createClientComponentClient<Database>(),
    []
  );

  useEffect(() => {
    let active = true;

    async function handleInviteAccept() {
      const socioId = searchParams?.get('socio_id');
      const code = searchParams?.get('code');
      const error = searchParams?.get('error');
      const errorCode = searchParams?.get('error_code');
      const errorDescription = searchParams?.get('error_description');

      // Si hay error en los parámetros (OTP expirado, etc.)
      if (error) {
        console.error('[INVITE_ACCEPT_ERROR]', {
          error,
          errorCode,
          errorDescription,
        });
        
        // Redirigir a login con mensaje de error
        router.replace(
          `/auth/login?error=${encodeURIComponent(
            errorDescription || 'El link de invitación expiró o es inválido'
          )}` as Route
        );
        return;
      }

      // Si hay código, intentar intercambiarlo por sesión
      if (code) {
        try {
          const { data: { session }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError || !session) {
            console.error('[INVITE_ACCEPT_EXCHANGE_ERROR]', exchangeError);
            router.replace(
              `/auth/login?error=${encodeURIComponent(
                'Error al autenticar. Por favor, solicita un nuevo link de invitación.'
              )}` as Route
            );
            return;
          }

          // Obtener socio_id desde URL o desde metadata del usuario
          let socioIdFinal = socioId;
          if (!socioIdFinal && session.user) {
            const metadata = session.user.user_metadata || {};
            socioIdFinal = metadata.socio_id || null;
          }

          // Si hay socio_id, actualizar el estado del socio a activo
          // NOTA: user_id no existe en la tabla socios, solo actualizamos el estado
          if (socioIdFinal && session.user) {
            try {
              const { error: linkError } = await (supabase as any)
                .from('socios')
                .update({ 
                  estado: 'activo',
                })
                .eq('id', socioIdFinal);

              if (linkError) {
                console.warn('[INVITE_ACCEPT_LINK_WARNING]', linkError);
                // Continuar aunque falle el update, el usuario ya está autenticado
              } else {
                console.log('[INVITE_ACCEPT] Socio activado correctamente');
              }
            } catch (linkErr: any) {
              console.warn('[INVITE_ACCEPT_LINK_EXCEPTION]', linkErr);
            }
          }

          // Redirigir al panel del socio
          router.replace('/panel' as Route);
        } catch (err) {
          console.error('[INVITE_ACCEPT_EXCEPTION]', err);
          router.replace(
            `/auth/login?error=${encodeURIComponent(
              'Error inesperado. Por favor, intenta nuevamente.'
            )}` as Route
          );
        }
        return;
      }

      // Si no hay código ni error, verificar si ya hay sesión
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Obtener socio_id desde URL o desde metadata del usuario
        let socioIdFinal = socioId;
        if (!socioIdFinal && session.user) {
          const metadata = session.user.user_metadata || {};
          socioIdFinal = metadata.socio_id || null;
        }

        // Si hay socio_id y usuario autenticado, actualizar estado del socio
        // NOTA: user_id no existe en la tabla socios, solo actualizamos el estado
        if (socioIdFinal) {
          try {
            const { error: linkError } = await (supabase as any)
              .from('socios')
              .update({ 
                estado: 'activo',
              })
              .eq('id', socioIdFinal);

            if (linkError) {
              console.warn('[INVITE_ACCEPT_LINK_WARNING]', linkError);
            } else {
              console.log('[INVITE_ACCEPT] Socio activado correctamente');
            }
          } catch (linkErr: any) {
            console.warn('[INVITE_ACCEPT_LINK_EXCEPTION]', linkErr);
          }
        }
        
        // Redirigir al panel
        router.replace('/panel' as Route);
        return;
      }

      // Si no hay código ni sesión, redirigir a login
      router.replace(
        ('/auth/login?error=' +
          encodeURIComponent('Por favor, inicia sesión para aceptar la invitación.')) as Route
      );
    }

    void handleInviteAccept();

    return () => {
      active = false;
    };
  }, [router, searchParams, supabase]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F6F7] px-4 text-[#0D3B3B]">
      <div className="text-center">
        <p className="text-lg font-semibold mb-2">
          Procesando invitación...
        </p>
        <p className="text-sm text-gray-600">
          Por favor, espera mientras verificamos tu invitación.
        </p>
      </div>
    </div>
  );
}

export default function InviteAcceptPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F5F6F7] px-4 text-[#0D3B3B]">
          <p className="text-center text-lg font-semibold">
            Procesando invitación…
          </p>
        </div>
      }
    >
      <InviteAcceptPageContent />
    </Suspense>
  );
}


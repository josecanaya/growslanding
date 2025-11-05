'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';

export default function InviteAcceptPage() {
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
        router.replace(`/auth/login?error=${encodeURIComponent(errorDescription || 'El link de invitación expiró o es inválido')}`);
        return;
      }

      // Si hay código, intentar intercambiarlo por sesión
      if (code) {
        try {
          const { data: { session }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError || !session) {
            console.error('[INVITE_ACCEPT_EXCHANGE_ERROR]', exchangeError);
            router.replace(`/auth/login?error=${encodeURIComponent('Error al autenticar. Por favor, solicita un nuevo link de invitación.')}`);
            return;
          }

          // Si hay socio_id, intentar vincular el usuario con el socio
          // (puede que el campo user_id no exista en la tabla)
          if (socioId && session.user) {
            try {
              const { error: linkError } = await supabase
                .from('socios')
                .update({ 
                  user_id: session.user.id,
                })
                .eq('id', socioId);

              if (linkError) {
                // Si el error es porque el campo no existe, ignorarlo
                if (linkError.message?.includes('column') || linkError.code === 'PGRST204' || linkError.code === '42703') {
                  console.log('[INVITE_ACCEPT] Campo user_id no disponible en tabla socios, continuando sin vincular');
                } else {
                  console.warn('[INVITE_ACCEPT_LINK_WARNING]', linkError);
                }
                // Continuar aunque falle el link, el usuario ya está autenticado
              } else {
                console.log('[INVITE_ACCEPT] Usuario vinculado correctamente al socio');
              }
            } catch (linkErr: any) {
              // Si el error es porque el campo no existe, ignorarlo
              if (linkErr?.message?.includes('column') || linkErr?.code === 'PGRST204' || linkErr?.code === '42703') {
                console.log('[INVITE_ACCEPT] Campo user_id no disponible en tabla socios, continuando sin vincular');
              } else {
                console.warn('[INVITE_ACCEPT_LINK_EXCEPTION]', linkErr);
              }
            }
          }

          // Redirigir al panel del socio
          router.replace('/panel');
        } catch (err) {
          console.error('[INVITE_ACCEPT_EXCEPTION]', err);
          router.replace(`/auth/login?error=${encodeURIComponent('Error inesperado. Por favor, intenta nuevamente.')}`);
        }
        return;
      }

      // Si no hay código ni error, verificar si ya hay sesión
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Si hay socio_id y usuario autenticado, intentar vincularlos
        // (puede que el campo user_id no exista en la tabla)
        if (socioId) {
          try {
            const { error: linkError } = await supabase
              .from('socios')
              .update({ 
                user_id: session.user.id,
              })
              .eq('id', socioId);

            if (linkError) {
              // Si el error es porque el campo no existe, ignorarlo
              if (linkError.message?.includes('column') || linkError.code === 'PGRST204' || linkError.code === '42703') {
                console.log('[INVITE_ACCEPT] Campo user_id no disponible en tabla socios, continuando sin vincular');
              } else {
                console.warn('[INVITE_ACCEPT_LINK_WARNING]', linkError);
              }
            } else {
              console.log('[INVITE_ACCEPT] Usuario vinculado correctamente al socio');
            }
          } catch (linkErr: any) {
            // Si el error es porque el campo no existe, ignorarlo
            if (linkErr?.message?.includes('column') || linkErr?.code === 'PGRST204' || linkErr?.code === '42703') {
              console.log('[INVITE_ACCEPT] Campo user_id no disponible en tabla socios, continuando sin vincular');
            } else {
              console.warn('[INVITE_ACCEPT_LINK_EXCEPTION]', linkErr);
            }
          }
        }
        
        // Redirigir al panel
        router.replace('/panel');
        return;
      }

      // Si no hay código ni sesión, redirigir a login
      router.replace('/auth/login?error=' + encodeURIComponent('Por favor, inicia sesión para aceptar la invitación.'));
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


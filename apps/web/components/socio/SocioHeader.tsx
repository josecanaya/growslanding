'use client';

import { Bell } from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';
import { USE_MOCK_DATA } from '@/lib/mocks/socioMockData';
import type { Route } from 'next';

const RUTA_CUENTA = '/socio/cuenta' as Route;
const RUTA_NOTIF = '/socio/notificaciones' as Route;

/**
 * Top app bar: avatar (cuenta/ajustes) · marca · campana (notificaciones).
 * Sin menú hamburguesa; el resto de secciones se accede desde el home / panel.
 */
export function SocioHeader() {
  const currentUser = useCurrentUser();
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);

  useEffect(() => {
    if (USE_MOCK_DATA || !currentUser?.orgId) {
      if (USE_MOCK_DATA) setNotificacionesNoLeidas(2);
      return;
    }

    const fetchNotificaciones = async () => {
      try {
        const { data: socioData } = await (supabase as any)
          .from('socios')
          .select('id')
          .eq('org_id', currentUser.orgId)
          .or(`email.eq.${currentUser.email || ''},user_id.eq.${currentUser.id || ''}`)
          .maybeSingle();

        if (!socioData?.id) return;

        const { count } = await (supabase as any)
          .from('notificaciones')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', currentUser.orgId)
          .eq('socio_id', socioData.id)
          .eq('leida', false);

        if (count !== null) {
          setNotificacionesNoLeidas(count);
        }
      } catch {
        // silencioso
      }
    };

    void fetchNotificaciones();
    const interval = setInterval(fetchNotificaciones, 30000);
    return () => clearInterval(interval);
  }, [currentUser?.orgId, currentUser?.email, currentUser?.id, supabase]);

  const handleAjustesClick = () => {
    router.push(RUTA_CUENTA);
  };

  const handleNotificacionesClick = () => {
    router.push(RUTA_NOTIF);
  };

  const handleLogoClick = () => {
    router.push('/socio/panel');
  };

  const getInitials = () => {
    if (currentUser?.name) {
      return currentUser.name.charAt(0).toUpperCase();
    }
    return 'G';
  };

  return (
    <header className="relative sticky top-0 z-50 flex w-full items-center justify-between border-b border-slate-200/60 bg-slate-50/95 px-4 py-3.5 font-stitch-body backdrop-blur-sm sm:px-5">
      <button
        type="button"
        onClick={handleAjustesClick}
        className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border-2 border-stitch-surface-container-high bg-stitch-primary/10 text-sm font-bold text-stitch-primary transition-opacity hover:opacity-90"
        aria-label="Ajustes y cuenta"
      >
        <span className="flex h-full w-full items-center justify-center">{getInitials()}</span>
      </button>

      <button
        type="button"
        onClick={handleLogoClick}
        className="font-stitch-headline absolute left-1/2 -translate-x-1/2 text-lg font-bold tracking-tight text-stitch-primary"
      >
        Grows
      </button>

      <button
        type="button"
        onClick={handleNotificacionesClick}
        className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-stitch-primary transition-colors hover:bg-stitch-surface-container/80"
        aria-label="Notificaciones"
      >
        <Bell className="h-6 w-6" strokeWidth={2} />
        {notificacionesNoLeidas > 0 && (
          <span className="absolute right-0 top-0 flex h-4 min-w-[16px] items-center justify-center rounded-full border-2 border-slate-50 bg-stitch-error px-0.5 text-[9px] font-bold text-white">
            {notificacionesNoLeidas > 9 ? '9+' : notificacionesNoLeidas}
          </span>
        )}
      </button>
    </header>
  );
}

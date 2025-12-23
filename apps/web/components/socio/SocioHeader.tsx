'use client';

import { Menu, Bell } from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';

/**
 * Header fijo para todas las páginas del socio
 * Muestra menú hamburguesa, logo GROWS y avatar con badge de notificaciones
 */
export function SocioHeader() {
  const currentUser = useCurrentUser();
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);

  useEffect(() => {
    if (!currentUser?.orgId) return;

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
      } catch (error) {
        // Error silencioso
      }
    };

    fetchNotificaciones();
    // Recargar cada 30 segundos
    const interval = setInterval(fetchNotificaciones, 30000);
    return () => clearInterval(interval);
  }, [currentUser?.orgId, currentUser?.email, currentUser?.id, supabase]);

  const handleMenuClick = () => {
    // Disparar evento para abrir el menú lateral
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('grows:open-side-menu'));
    }
  };

  const handleAvatarClick = () => {
    router.push('/socio/notificaciones');
  };

  const handleLogoClick = () => {
    router.push('/socio');
  };

  const getInitials = () => {
    if (currentUser?.name) {
      return currentUser.name.charAt(0).toUpperCase();
    }
    return '👷';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-[#071A34] py-3 px-4 flex items-center justify-between shadow-md">
      {/* Menú hamburguesa */}
      <button
        onClick={handleMenuClick}
        className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
        aria-label="Abrir menú"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Logo GROWS centrado - clickeable */}
      <button
        onClick={handleLogoClick}
        className="text-[#D4AF37] text-xl font-bold tracking-wider absolute left-1/2 transform -translate-x-1/2 hover:opacity-80 transition-opacity cursor-pointer"
        aria-label="Ir al inicio"
      >
        GROWS
      </button>

      {/* Avatar con badge de notificaciones */}
      <button
        onClick={handleAvatarClick}
        className="relative p-0 hover:opacity-80 transition-opacity"
        aria-label="Ver notificaciones"
      >
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-sm">
          {getInitials()}
        </div>
        {notificacionesNoLeidas > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white border-2 border-[#071A34]">
            {notificacionesNoLeidas > 9 ? '9+' : notificacionesNoLeidas}
          </span>
        )}
      </button>
    </header>
  );
}


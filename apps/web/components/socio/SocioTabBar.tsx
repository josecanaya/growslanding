'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, CheckSquare, MessageSquare, Menu, Bell, Clock, ClipboardList, NotebookPen, Users, User, X, Wallet } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { logout } from '@/lib/auth';
import { ROLE_LABELS, normalizeRole } from '@/lib/roles';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';
import type { Route } from 'next';

/**
 * TabBar fijo para todas las páginas del socio
 * Muestra 4 pestañas: Inicio, Mis tareas, Mensajes, Menú
 */
export function SocioTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const currentUser = useCurrentUser();
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [unreadNotificacionesSocio, setUnreadNotificacionesSocio] = useState(0);
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0);
  const [user, setUser] = useState({
    name: 'Socio',
    avatar: '👷',
  });
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    if (currentUser?.name) {
      setUser({
        name: currentUser.name ?? 'Socio',
        avatar: currentUser.name
          ? currentUser.name.charAt(0).toUpperCase()
          : '👷',
      });
    }
  }, [currentUser?.name]);

  // Escuchar custom event para abrir el drawer desde el botón Menú
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = () => {
      setShowSideMenu(true);
    };

    window.addEventListener('grows:open-side-menu', handler);
    return () => window.removeEventListener('grows:open-side-menu', handler);
  }, []);

  // Escuchar custom event para actualizar contador de notificaciones no leídas
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ rol: string; count: number }>;
      if (custom.detail?.rol === 'socio') {
        setUnreadNotificacionesSocio(custom.detail.count ?? 0);
      }
    };

    window.addEventListener('grows:notificaciones-unread-count', handler);
    return () => window.removeEventListener('grows:notificaciones-unread-count', handler);
  }, []);

  // Cargar mensajes no leídos (solo cuando el usuario está en la página de mensajes o cuando cambia el usuario)
  useEffect(() => {
    if (!currentUser?.orgId) {
      setMensajesNoLeidos(0);
      return;
    }

    let mounted = true;

    const cargarMensajesNoLeidos = async () => {
      if (!mounted || !currentUser?.orgId) return;

      try {
        const supabaseAny = supabase as any;
        
        // Obtener socio_id
        const { data: socioData } = await supabaseAny
          .from('socios')
          .select('id')
          .eq('org_id', currentUser.orgId)
          .or(`email.eq.${currentUser.email || ''},user_id.eq.${currentUser.id || ''}`)
          .maybeSingle();

        if (!mounted || !socioData?.id) return;

        // Contar mensajes no leídos donde el socio es destinatario
        const { count, error } = await supabaseAny
          .from('mensajes')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', currentUser.orgId)
          .eq('destinatario_id', socioData.id)
          .eq('leido', false);

        if (mounted && !error && count !== null) {
          setMensajesNoLeidos(count);
        }
      } catch (error) {
        if (mounted) {
          console.error('[SocioTabBar] Error cargando mensajes no leídos:', error);
        }
      }
    };

    // Cargar inmediatamente solo una vez
    cargarMensajesNoLeidos();
    
    // Recargar cada 60 segundos (aumentado de 30 a 60 para reducir carga)
    const interval = setInterval(() => {
      if (mounted) {
        cargarMensajesNoLeidos();
      }
    }, 60000);
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.orgId, currentUser?.email, currentUser?.id]);

  const roleLabel = normalizeRole(currentUser?.role)
    ? ROLE_LABELS[normalizeRole(currentUser?.role)!] ?? 'Socio'
    : 'Socio';

  const handleLogout = () => {
    logout({ router });
  };

  const menuItems = [
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell, route: '/socio/notificaciones' as Route },
    { id: 'ahora', label: 'Ahora', icon: Clock, route: '/socio/ahora' as Route },
    { id: 'tareas', label: 'Tareas', icon: ClipboardList, route: '/socio/tareas' as Route },
    { id: 'presupuestos', label: 'Presupuesta', icon: NotebookPen, route: '/socio/presupuestos' as Route },
    { id: 'billetera', label: 'Billetera', icon: Wallet, route: '/socio/billetera' as Route },
    { id: 'cuadrilla', label: 'Mi Cuadrilla', icon: Users, route: '/socio/cuadrilla' as Route },
    { id: 'cuenta', label: 'Cuenta', icon: User, route: '/socio/cuenta' as Route },
  ];

  const handleMenuClick = (route: Route) => {
    router.push(route);
    setShowSideMenu(false);
  };

  const isActive = (route: string) => {
    return pathname === route || pathname?.startsWith(`${route}/`);
  };

  const handleMensajesClick = () => {
    router.push('/socio/mensajes');
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 md:hidden">
        <div className="grid grid-cols-4 h-16">
          <button
            onClick={() => router.push('/socio/ahora')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              pathname === '/socio/ahora' ? 'text-[#276EF1]' : 'text-gray-500'
            }`}
          >
            <Home className="h-6 w-6" />
            <span className="text-[10px] font-medium">Inicio</span>
          </button>
          <button
            onClick={() => router.push('/socio/tareas')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              pathname === '/socio/tareas' || pathname?.startsWith('/socio/tareas/')
                ? 'text-[#276EF1]'
                : 'text-gray-500'
            }`}
          >
            <CheckSquare className="h-6 w-6" />
            <span className="text-[10px] font-medium">Mis tareas</span>
          </button>
          <button
            onClick={handleMensajesClick}
            className={`flex flex-col items-center justify-center gap-1 transition-colors relative ${
              pathname === '/socio/mensajes' || pathname?.startsWith('/socio/mensajes/')
                ? 'text-[#276EF1]'
                : 'text-gray-500'
            }`}
          >
            <div className="relative">
              <MessageSquare className="h-6 w-6" />
              {mensajesNoLeidos > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {mensajesNoLeidos > 9 ? '9+' : mensajesNoLeidos}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">Mensajes</span>
          </button>
          <button
            onClick={() => setShowSideMenu(true)}
            className="flex flex-col items-center justify-center gap-1 text-gray-500 transition-colors"
          >
            <Menu className="h-6 w-6" />
            <span className="text-[10px] font-medium">Menú</span>
          </button>
        </div>
      </div>

      {/* Side Menu Drawer */}
      {showSideMenu ? (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setShowSideMenu(false)}
          />
          <aside className="fixed top-0 left-0 z-50 h-full w-80 bg-grows-blue shadow-xl">
            <div className="flex h-full flex-col">
              <div className="border-b border-white/20 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-grows-blue-light text-xl text-grows-text">
                      {user.avatar}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        {user.name}
                      </h2>
                      <p className="text-sm text-white/70">
                        {roleLabel}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSideMenu(false)}
                    className="text-white transition hover:text-white/70"
                    aria-label="Cerrar menu"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-grows-blue py-6">
                <nav className="space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.route);
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleMenuClick(item.route)}
                        className={`flex w-full items-center space-x-4 px-6 py-4 text-left text-white transition hover:bg-white/10 ${
                          active ? 'bg-white/15 font-semibold' : ''
                        }`}
                      >
                        <div className="relative">
                          <Icon className="h-6 w-6" />
                          {item.id === 'notificaciones' && unreadNotificacionesSocio > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                              {unreadNotificacionesSocio > 9 ? '9+' : unreadNotificacionesSocio}
                            </span>
                          )}
                        </div>
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-white/20 bg-grows-blue p-6">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center space-x-4 rounded-lg px-4 py-3 text-left text-white transition hover:bg-white/10"
                >
                  <span className="text-lg">↩</span>
                  <span className="font-medium">Cerrar sesion</span>
                </button>
              </div>
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}


'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, CheckSquare, MessageSquare, Menu, Bell, Clock, ClipboardList, NotebookPen, Users, User, X, Wallet, TrendingUp, Calendar, Camera, HelpCircle, Building, Play, Briefcase } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { logout } from '@/lib/auth';
import { ROLE_LABELS, normalizeRole } from '@/lib/roles';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';
import type { Route } from 'next';
import { useToast } from '@/components/ui/use-toast';

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
  const { toast } = useToast();
  const [jornadaActiva, setJornadaActiva] = useState(false);
  const [iniciando, setIniciando] = useState(false);

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

  // Verificar jornada activa
  useEffect(() => {
    const verificarJornada = async () => {
      if (!currentUser?.id || !currentUser?.orgId) {
        setJornadaActiva(false);
        return;
      }

      try {
        const { data: socioData } = await (supabase as any)
          .from('socios')
          .select('id')
          .eq('org_id', currentUser.orgId)
          .or(`email.eq.${currentUser.email || ''},user_id.eq.${currentUser.id || ''}`)
          .maybeSingle();

        if (!socioData?.id) {
          setJornadaActiva(false);
          return;
        }

        const hoy = new Date().toISOString().split('T')[0];
        const { data: jornadaData } = await (supabase as any)
          .from('jornadas_socio')
          .select('id')
          .eq('socio_id', socioData.id)
          .eq('fecha', hoy)
          .is('hora_fin', null)
          .maybeSingle();

        setJornadaActiva(!!jornadaData);
      } catch (error) {
        setJornadaActiva(false);
      }
    };

    verificarJornada();
    // Verificar cada 30 segundos
    const interval = setInterval(verificarJornada, 30000);
    return () => clearInterval(interval);
  }, [currentUser?.id, currentUser?.orgId, currentUser?.email, supabase]);

  const handleIniciarJornada = async () => {
    if (!currentUser?.id || iniciando) return;

    setIniciando(true);

    try {
      const { data: socioData } = await (supabase as any)
        .from('socios')
        .select('id')
        .eq('org_id', currentUser.orgId)
        .or(`email.eq.${currentUser.email || ''},user_id.eq.${currentUser.id || ''}`)
        .maybeSingle();

      if (!socioData?.id) {
        throw new Error('Socio no encontrado');
      }

      const hoy = new Date().toISOString().split('T')[0];
      const ahora = new Date().toISOString();

      const { data: nuevaJornada, error: jornadaError } = await (supabase as any)
        .from('jornadas_socio')
        .insert({
          socio_id: socioData.id,
          fecha: hoy,
          hora_inicio: ahora,
          hora_fin: null,
        })
        .select('id')
        .single();

      if (jornadaError) {
        throw jornadaError;
      }

      setJornadaActiva(true);
      router.push('/socio/ahora');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo iniciar la jornada',
        variant: 'destructive',
      });
    } finally {
      setIniciando(false);
    }
  };

  const handleInicioClick = () => {
    if (jornadaActiva) {
      router.push('/socio/ahora');
    } else {
      handleIniciarJornada();
    }
  };

  const roleLabel = normalizeRole(currentUser?.role)
    ? ROLE_LABELS[normalizeRole(currentUser?.role)!] ?? 'Socio'
    : 'Socio';

  const handleLogout = () => {
    logout({ router });
  };

  const menuItems = [
    { id: 'inicio', label: 'Inicio', icon: Home, route: '/socio' as Route, separator: false },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell, route: '/socio/notificaciones' as Route, separator: true },
    { id: 'tareas', label: 'Tareas', icon: ClipboardList, route: '/socio/tareas' as Route, separator: false },
    { id: 'jornadas', label: 'Jornadas', icon: Calendar, route: '/socio/jornadas' as Route, separator: true },
    { id: 'oportunidades', label: 'Oportunidades', icon: Briefcase, route: '/socio/oportunidades' as Route, separator: false },
    { id: 'presupuestos', label: 'Presupuestos', icon: NotebookPen, route: '/socio/presupuestos' as Route, separator: false },
    { id: 'obras', label: 'Obras', icon: Building, route: '/socio/obras' as Route, separator: true },
    { id: 'billetera', label: 'Billetera', icon: Wallet, route: '/socio/billetera' as Route, separator: true },
    { id: 'cuadrilla', label: 'Mi Cuadrilla', icon: Users, route: '/socio/cuadrilla' as Route, separator: false },
  ];

  const handleMenuClick = (route: Route) => {
    router.push(route);
    setShowSideMenu(false);
  };

  const isActive = (route: string) => {
    return pathname === route || pathname?.startsWith(`${route}/`);
  };

  const isHomeActive = () => {
    return pathname === '/socio' || pathname === '/socio/';
  };

  const handleMensajesClick = () => {
    router.push('/socio/mensajes');
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 md:hidden">
        <div className="grid grid-cols-5 h-16">
          <button
            onClick={() => router.push('/socio')}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              isHomeActive() ? 'text-[#276EF1]' : 'text-gray-500'
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
          {/* Botón central grande verde INICIO */}
          <button
            onClick={handleInicioClick}
            disabled={iniciando}
            className={`
              flex flex-col items-center justify-center gap-1
              bg-green-500 hover:bg-green-600
              text-white
              rounded-t-2xl
              -mt-2
              h-20
              shadow-lg
              transition-all duration-200
              active:scale-95
              ${iniciando ? 'opacity-70 cursor-not-allowed' : ''}
            `}
          >
            <div className={`
              w-10 h-10
              rounded-full
              bg-white/20
              flex items-center justify-center
              ${jornadaActiva ? 'bg-white/30' : ''}
            `}>
              {iniciando ? (
                <Clock className="h-5 w-5 animate-spin" />
              ) : (
                <Play className="h-5 w-5" fill="currentColor" />
              )}
            </div>
            <span className="text-[10px] font-bold">INICIO</span>
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
                <nav className="space-y-0">
                  {menuItems.map((item, index) => {
                    const Icon = item.icon;
                    const active = isActive(item.route);
                    return (
                      <div key={item.id}>
                        {item.separator && index > 0 && (
                          <div className="border-t border-white/10 mx-6 my-2" />
                        )}
                        <button
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
                      </div>
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


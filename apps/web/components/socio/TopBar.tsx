'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Bell, Clock, ClipboardList, NotebookPen, Users, User, X } from 'lucide-react';
import type { Route } from 'next';

interface TopBarProps {
  isConnected: boolean;
  isOnBreak: boolean;
  onConnectionToggle: () => void;
  onBreakToggle: () => void;
  onLogout: () => void;
  user: {
    name: string;
    avatar: string;
  };
  roleLabel?: string;
  onSectionChange?: (section: string) => void; // Mantener opcional para compatibilidad
}

export function TopBar({
  user,
  roleLabel,
  onLogout,
  onSectionChange,
}: TopBarProps) {
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [unreadNotificacionesSocio, setUnreadNotificacionesSocio] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    // 1. Notificaciones - usar la ruta actual de notificaciones que ya existe
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell, route: '/socio/notificaciones' as Route },
    // 2. Ahora - usar la ruta donde hoy se muestran las tareas del día (antes "tareas")
    { id: 'ahora', label: 'Ahora', icon: Clock, route: '/socio/ahora' as Route },
    // 3. Tareas - usar la ruta actual donde hoy se accede a "Mis tareas" completas (antes "mis-tareas")
    { id: 'tareas', label: 'Tareas', icon: ClipboardList, route: '/socio/tareas' as Route },
    // 4. Presupuesta (NUEVA) - placeholder /socio/presupuestos
    { id: 'presupuestos', label: 'Presupuesta', icon: NotebookPen, route: '/socio/presupuestos' as Route },
    // 5. Mi Cuadrilla - mantener la ruta actual que ya funciona
    { id: 'cuadrilla', label: 'Mi Cuadrilla', icon: Users, route: '/socio/cuadrilla' as Route },
    // 6. Cuenta - mantener la ruta actual
    { id: 'cuenta', label: 'Cuenta', icon: User, route: '/socio/cuenta' as Route },
  ];

  const handleMenuClick = (route: Route, sectionId: string) => {
    router.push(route);
    // Mantener compatibilidad con sistema anterior si existe
    if (onSectionChange) {
      onSectionChange(sectionId);
    }
    setShowSideMenu(false);
  };

  const isActive = (route: string) => {
    return pathname === route || pathname?.startsWith(`${route}/`);
  };

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

  return (
    <>
      <header className="sticky top-0 z-40 bg-grows-blue shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setShowSideMenu(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-grows-blue-light text-xl text-grows-text shadow-md transition hover:bg-grows-blue-light/90 hover:shadow-lg"
            aria-label="Abrir menu"
          >
            {user.avatar}
          </button>
          <div />
        </div>
      </header>

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
                        {roleLabel ?? 'Socio'}
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
                        onClick={() => handleMenuClick(item.route, item.id)}
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
                  onClick={onLogout}
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


'use client';

import { useState, useEffect } from 'react';
import { Bell, Menu } from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { useDeviceType } from '@/lib/hooks/useDeviceType';
import { DrawerMobile } from './DrawerMobile';

interface TopBarMobileProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function TopBarMobile({ activeSection, onSectionChange }: TopBarMobileProps) {
  const deviceType = useDeviceType();
  const currentUser = useCurrentUser();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Escuchar custom event para actualizar contador de notificaciones no leídas
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ rol: string; count: number }>;
      if (custom.detail?.rol === 'cliente') {
        setUnreadCount(custom.detail.count ?? 0);
      }
    };

    window.addEventListener('grows:notificaciones-unread-count', handler);
    return () => window.removeEventListener('grows:notificaciones-unread-count', handler);
  }, []);

  // Solo mostrar en mobile/tablet
  if (deviceType === 'desktop') return null;

  const displayName = currentUser?.name ?? 'Usuario';
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 shadow-sm z-50">
        <div className="flex items-center justify-between h-full px-4">
          {/* Botón hamburguesa */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="h-6 w-6 text-gray-700" />
          </button>

          {/* Logo/Marca "Grows" */}
          <div className="flex-1 flex items-center justify-center">
            <h1 className="text-lg font-bold text-gray-900">Grows</h1>
          </div>

          {/* Derecha: Notificaciones + Avatar */}
          <div className="flex items-center gap-2">
            {/* Botón notificaciones */}
            <button
              onClick={() => onSectionChange('notificaciones')}
              className="relative flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Notificaciones"
            >
              <Bell className="h-5 w-5 text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Avatar/Iniciales */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white text-sm font-semibold">
              {initials}
            </div>
          </div>
        </div>
      </div>

      {/* Drawer */}
      <DrawerMobile
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeSection={activeSection}
        onSectionChange={onSectionChange}
      />
    </>
  );
}


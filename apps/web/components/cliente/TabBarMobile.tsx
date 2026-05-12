'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { Home, Building2, ClipboardList, Wallet, Bell } from 'lucide-react';
import { useDeviceType } from '@/lib/hooks/useDeviceType';

interface TabBarMobileProps {
  activeSection: string;
}

export function TabBarMobile({ activeSection }: TabBarMobileProps) {
  const router = useRouter();
  const deviceType = useDeviceType();
  const [unreadCount, setUnreadCount] = useState(0);

  // Escuchar custom event para actualizar contador de notificaciones no leídas
  // IMPORTANTE: Este hook debe ejecutarse siempre, antes de cualquier return condicional
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

  // Solo mostrar en mobile - DESPUÉS de todos los hooks
  if (deviceType !== 'mobile') return null;

  const items = [
    { id: 'home', label: 'Home', icon: Home, href: '/cliente/dashboard' },
    { id: 'obras', label: 'Obras', icon: Building2, href: '/cliente/dashboard?section=obras' },
    { id: 'tareas', label: 'Tareas', icon: ClipboardList, href: '/cliente/dashboard?section=tareas' },
    { id: 'billetera', label: 'Billetera', icon: Wallet, href: '/cliente/billetera' },
    { id: 'notificaciones', label: 'Notif.', icon: Bell, href: '/cliente/dashboard?section=notificaciones' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 shadow-[0_-2px_8px_rgba(0,0,0,0.05)] z-50">
      <div className="grid grid-cols-5 h-full">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          const hasBadge = item.id === 'notificaciones' && unreadCount > 0;
          
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href as Route)}
              className={`
                flex flex-col items-center justify-center gap-1
                transition-colors min-h-[44px] min-w-[44px]
                ${isActive ? 'text-blue-600' : 'text-gray-500'}
              `}
              aria-label={item.label}
            >
              <div className="relative">
                <Icon className={`h-6 w-6 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                {hasBadge && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}


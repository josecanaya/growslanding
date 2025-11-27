'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageCircle,
  Building2,
  Users,
  User,
  Bell,
  Calendar,
  ClipboardList,
  HelpCircle,
  LogOut,
} from 'lucide-react';

import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { ROLE_LABELS, normalizeRole } from '@/lib/roles';
import { logout } from '@/lib/auth';

interface SidebarClienteTecnicoProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function SidebarClienteTecnico({
  activeSection,
  onSectionChange,
}: SidebarClienteTecnicoProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [unreadNotificacionesCliente, setUnreadNotificacionesCliente] = useState(0);
  const currentUser = useCurrentUser();
  const router = useRouter();

  const displayName = useMemo(
    () => currentUser?.name ?? 'Equipo GROWS',
    [currentUser?.name]
  );

  const displayRole = useMemo(() => {
    const normalized = normalizeRole(currentUser?.role);
    if (!normalized) {
      return 'Rol pendiente';
    }

    return ROLE_LABELS[normalized] ?? normalized;
  }, [currentUser?.role]);

  // Escuchar custom event para actualizar contador de notificaciones no leídas
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ rol: string; count: number }>;
      if (custom.detail?.rol === 'cliente') {
        setUnreadNotificacionesCliente(custom.detail.count ?? 0);
      }
    };

    window.addEventListener('grows:notificaciones-unread-count', handler);
    return () => window.removeEventListener('grows:notificaciones-unread-count', handler);
  }, []);

  const menuItems = [
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'obras', label: 'Obras', icon: Building2 },
    { id: 'tareas', label: 'Tareas', icon: ClipboardList },
    { id: 'cuadrillas', label: 'Cuadrillas', icon: Users },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
    { id: 'calendario', label: 'Calendario', icon: Calendar },
    { id: 'cuenta', label: 'Cuenta', icon: User },
  ];

  return (
    <div
      className={`fixed left-0 top-0 flex h-full flex-col border-r border-[#4A6FA520] bg-[#0C1D36] text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.3),inset_0_-2px_4px_rgba(0,0,0,0.3)] transition-all duration-300 ease-in-out ${
        isExpanded ? 'w-64' : 'w-28'
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="border-b border-white/20 p-6">
        <div className="flex flex-col items-center text-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-grows-secondary bg-grows-secondary hover:bg-[#E8C547] transition-colors duration-200"
          >
            <span className="text-lg font-semibold text-grows-text-primary">
              {displayName.slice(0, 2).toUpperCase()}
            </span>
          </button>
          {isExpanded && (
            <>
              <h1 className="text-xl font-bold">{displayName}</h1>
              <p className="text-sm text-white/70">{displayRole}</p>
            </>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={`group flex w-full items-center rounded-xl px-4 py-3 text-left font-medium transition-all duration-200 ${
                    isExpanded ? 'gap-3 justify-start' : 'justify-center'
                  } ${
                    isActive
                    ? 'bg-[#4A6FA530] text-[#4A6FA5] border-l-4 border-[#4A6FA5]'
                      : 'text-white hover:bg-[#E8C54720] hover:text-[#E8C547]'
                  }`}
                  title={!isExpanded ? item.label : undefined}
                >
                  <div className="relative">
                    <Icon
                      className={`h-5 w-5 flex-shrink-0 transition-colors duration-200 ${
                        isActive ? 'text-[#4A6FA5]' : 'text-white group-hover:text-[#E8C547]'
                      }`}
                    />
                    {item.id === 'notificaciones' && unreadNotificacionesCliente > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {unreadNotificacionesCliente > 9 ? '9+' : unreadNotificacionesCliente}
                      </span>
                    )}
                  </div>
                  {isExpanded && <span>{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/20 p-4 space-y-2">
        <button
          onClick={async () => {
            if (isLoggingOut) return;
            setIsLoggingOut(true);
            try {
              await logout({ router, redirectTo: '/auth/login' });
            } catch (error) {
              console.error('[LOGOUT_ERROR]', error);
              setIsLoggingOut(false);
            }
          }}
          disabled={isLoggingOut}
          className={`group flex w-full items-center rounded-xl px-4 py-3 text-left font-medium transition-all duration-200 ${
            isExpanded ? 'gap-3 justify-start' : 'justify-center'
          } text-white hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed`}
          title={!isExpanded ? 'Cerrar sesión' : undefined}
        >
          <LogOut
            className={`h-5 w-5 flex-shrink-0 transition-colors duration-200 text-white group-hover:text-red-400 ${
              isLoggingOut ? 'animate-pulse' : ''
            }`}
          />
          {isExpanded && (
            <span>{isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}</span>
          )}
        </button>
        {isExpanded && <p className="text-center text-xs text-white/50 mt-2">v1.0</p>}
      </div>
    </div>
  );
}

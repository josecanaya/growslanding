'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Users,
  User,
  Bell,
  Calendar,
  ClipboardList,
  HelpCircle,
  LogOut,
  Wallet,
  Home,
  X,
} from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { ROLE_LABELS, normalizeRole } from '@/lib/roles';
import { logout } from '@/lib/auth';

interface DrawerMobileProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function DrawerMobile({
  isOpen,
  onClose,
  activeSection,
  onSectionChange,
}: DrawerMobileProps) {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const [unreadNotificacionesCliente, setUnreadNotificacionesCliente] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const displayName = currentUser?.name ?? 'Equipo GROWS';
  const displayRole = (() => {
    const normalized = normalizeRole(currentUser?.role);
    if (!normalized) return 'Rol pendiente';
    return ROLE_LABELS[normalized] ?? normalized;
  })();

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

  // Cerrar drawer con ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Prevenir scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'obras', label: 'Obras', icon: Building2 },
    { id: 'tareas', label: 'Tareas', icon: ClipboardList },
    { id: 'cuadrillas', label: 'Cuadrillas', icon: Users },
    { id: 'billetera', label: 'Billetera', icon: Wallet },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
    { id: 'calendario', label: 'Calendario', icon: Calendar },
    { id: 'cuenta', label: 'Cuenta', icon: User },
  ];

  const handleItemClick = (itemId: string) => {
    onSectionChange(itemId);
    if (itemId === 'home') {
      router.push('/cliente/dashboard');
    } else {
      router.push(`/cliente/dashboard?section=${itemId}`);
    }
    onClose();
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout({ router, redirectTo: '/auth/login' });
    } catch (error) {
      console.error('[LOGOUT_ERROR]', error);
      setIsLoggingOut(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay oscuro */}
      <div
        className="fixed inset-0 bg-black/50 z-[55] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed top-0 left-0 h-full w-[80%] max-w-[320px] bg-white shadow-2xl z-[60] transform transition-transform duration-300 ease-in-out"
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)'
        }}
      >
        {/* Header del drawer */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-blue-600 bg-blue-600">
              <span className="text-lg font-semibold text-white">
                {displayName.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">{displayName}</h2>
              <p className="text-xs text-gray-500">{displayRole}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5 text-gray-700" />
          </button>
        </div>

        {/* Lista de navegación */}
        <nav className="flex-1 overflow-y-auto py-2">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              const hasBadge = item.id === 'notificaciones' && unreadNotificacionesCliente > 0;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleItemClick(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium
                      transition-all duration-200 min-h-[44px]
                      ${
                        isActive
                          ? 'bg-[#4A6FA530] text-[#4A6FA5] border-l-4 border-[#4A6FA5]'
                          : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <div className="relative">
                      <Icon
                        className={`h-5 w-5 flex-shrink-0 ${
                          isActive ? 'text-[#4A6FA5]' : 'text-gray-600'
                        }`}
                      />
                      {hasBadge && (
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                          {unreadNotificacionesCliente > 9 ? '9+' : unreadNotificacionesCliente}
                        </span>
                      )}
                    </div>
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer: Cerrar sesión */}
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium text-red-600 hover:bg-red-50 transition-all duration-200 min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span>{isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}</span>
          </button>
        </div>
      </div>
    </>
  );
}


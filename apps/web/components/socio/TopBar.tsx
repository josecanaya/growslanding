'use client';

import { useState } from 'react';
import { Home, Users, Bell, User, X, ClipboardList } from 'lucide-react';

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
  onSectionChange: (section: string) => void;
}

export function TopBar({
  user,
  roleLabel,
  onSectionChange,
  onLogout,
}: TopBarProps) {
  const [showSideMenu, setShowSideMenu] = useState(false);

  const menuItems = [
    { id: 'tareas', label: 'Tareas', icon: Home },
    { id: 'mis-tareas', label: 'Mis Tareas', icon: ClipboardList },
    { id: 'cuadrilla', label: 'Cuadrilla', icon: Users },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
    { id: 'cuenta', label: 'Perfil', icon: User },
  ];

  const handleMenuClick = (sectionId: string) => {
    onSectionChange(sectionId);
    setShowSideMenu(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-primario shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setShowSideMenu(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-acento text-xl text-oscuro shadow-md transition hover:shadow-lg"
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
          <aside className="fixed top-0 left-0 z-50 h-full w-80 bg-primario shadow-xl">
            <div className="flex h-full flex-col">
              <div className="border-b border-white/20 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-acento text-xl text-oscuro">
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

              <div className="flex-1 bg-primario py-6">
                <nav className="space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleMenuClick(item.id)}
                        className="flex w-full items-center space-x-4 px-6 py-4 text-left text-white transition hover:bg-white/10"
                      >
                        <Icon className="h-6 w-6" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="border-t border-white/20 bg-primario p-6">
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


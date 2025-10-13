'use client';

import { useState } from 'react';
import { Menu, Home, Users, Bell, User, X } from 'lucide-react';

interface User {
  name: string;
  avatar: string;
  rating: number;
  level: string;
}

interface TopBarProps {
  isConnected: boolean;
  isOnBreak: boolean;
  onConnectionToggle: () => void;
  onBreakToggle: () => void;
  onLogout: () => void;
  user: User;
  onSectionChange: (section: string) => void;
}

export function TopBar({ 
  user,
  onSectionChange
}: TopBarProps) {
  const [showSideMenu, setShowSideMenu] = useState(false);

  const menuItems = [
    { id: 'tareas', label: 'Tareas', icon: Home },
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
      {/* Header minimalista - solo avatar */}
      <header className="sticky top-0 z-40 shadow-lg bg-primario">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Avatar clickeable */}
          <button
            onClick={() => setShowSideMenu(true)}
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-md hover:shadow-lg transition-smooth bg-acento text-oscuro"
          >
            {user.avatar}
          </button>
          
          {/* Espacio para balance visual */}
          <div></div>
        </div>
      </header>

      {/* Menú lateral (hamburguesa) */}
      {showSideMenu && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setShowSideMenu(false)}
          />
          
          {/* Menú lateral */}
          <div className="fixed top-0 left-0 h-full w-80 shadow-xl z-50 transform transition-transform duration-300 ease-in-out bg-primario">
            <div className="flex flex-col h-full">
              {/* Header del menú */}
              <div className="p-6 border-b border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl bg-acento text-oscuro">
                      {user.avatar}
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg text-white">{user.name}</h2>
                      <p className="text-sm text-white/70">Líder de cuadrilla</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSideMenu(false)}
                    className="transition-smooth text-white"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Items del menú */}
              <div className="flex-1 py-6 bg-primario">
                <nav className="space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleMenuClick(item.id)}
                        className="w-full flex items-center space-x-4 px-6 py-4 text-left transition-smooth hover:bg-white/10 text-white"
                      >
                        <Icon className="h-6 w-6 text-white" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Footer del menú */}
              <div className="p-6 border-t border-white/20 bg-primario">
                <button
                  onClick={() => {
                    localStorage.removeItem('user');
                    localStorage.removeItem('isConnected');
                    localStorage.removeItem('isOnBreak');
                    window.location.href = '/auth/login';
                  }}
                  className="w-full flex items-center space-x-4 px-4 py-3 text-left rounded-lg transition-smooth hover:bg-white/10 text-white"
                >
                  <span className="text-lg">🚪</span>
                  <span className="font-medium">Cerrar sesión</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
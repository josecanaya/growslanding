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
      <header className="sticky top-0 z-40 shadow-lg" style={{ backgroundColor: '#1A202C' }}>
        <div className="flex items-center justify-between px-4 py-3">
          {/* Avatar clickeable */}
          <button
            onClick={() => setShowSideMenu(true)}
            className="w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-md hover:shadow-lg transition-shadow"
            style={{ backgroundColor: '#FFFFFF', color: '#1A202C' }}
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
          <div className="fixed top-0 left-0 h-full w-80 shadow-xl z-50 transform transition-transform duration-300 ease-in-out" style={{ backgroundColor: '#1A202C' }}>
            <div className="flex flex-col h-full">
              {/* Header del menú */}
              <div className="p-6 border-b" style={{ borderColor: '#008080' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: '#FFFFFF', color: '#1A202C' }}>
                      {user.avatar}
                    </div>
                    <div>
                      <h2 className="font-semibold text-lg" style={{ color: '#FFFFFF' }}>{user.name}</h2>
                      <p className="text-sm" style={{ color: '#A0AEC0' }}>Líder de cuadrilla</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSideMenu(false)}
                    className="transition-colors"
                    style={{ color: '#FFFFFF' }}
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Items del menú */}
              <div className="flex-1 py-6" style={{ backgroundColor: '#1A202C' }}>
                <nav className="space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleMenuClick(item.id)}
                        className="w-full flex items-center space-x-4 px-6 py-4 text-left transition-colors hover:opacity-80"
                        style={{ backgroundColor: '#1A202C', color: '#FFFFFF' }}
                      >
                        <Icon className="h-6 w-6" style={{ color: '#FFFFFF' }} />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Footer del menú */}
              <div className="p-6 border-t" style={{ borderColor: '#008080', backgroundColor: '#1A202C' }}>
                <button
                  onClick={() => {
                    localStorage.removeItem('user');
                    localStorage.removeItem('isConnected');
                    localStorage.removeItem('isOnBreak');
                    window.location.href = '/auth/login';
                  }}
                  className="w-full flex items-center space-x-4 px-4 py-3 text-left rounded-lg transition-colors hover:opacity-80"
                  style={{ backgroundColor: '#1A202C', color: '#FFFFFF' }}
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
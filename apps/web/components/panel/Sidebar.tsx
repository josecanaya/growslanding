'use client';

import { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Building2, 
  Users, 
  Bell, 
  Calendar, 
  Wallet, 
  User,
  Menu,
  X,
  Sun,
  Moon
} from 'lucide-react';

interface User {
  name: string;
  avatar: string;
  rating: number;
  level: string;
}

interface SidebarProps {
  user: User;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function Sidebar({ user, activeSection, onSectionChange }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Cargar tema guardado
    const saved = localStorage.getItem('theme');
    if (saved) {
      setTheme(saved as 'light' | 'dark');
    } else {
      // Detectar preferencia del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    // Aplicar tema inmediatamente
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
  };

  const menuItems = [
    { id: 'tareas', label: 'Tareas en curso', icon: CheckSquare },
    { id: 'obras', label: 'Obras', icon: Building2 },
    { id: 'cuadrilla', label: 'Mi cuadrilla', icon: Users },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
    { id: 'calendario', label: 'Calendario', icon: Calendar },
    { id: 'presupuesto', label: 'Presupuesto', icon: Wallet },
    { id: 'cuenta', label: 'Cuenta', icon: User },
  ];

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'bronce': return 'text-amber-600';
      case 'plata': return 'text-gray-500';
      case 'oro': return 'text-yellow-500';
      case 'platino': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.floor(rating) ? 'text-accent' : 'text-gray-400'}>
        ★
      </span>
    ));
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 text-white p-2 rounded-lg"
        style={{backgroundColor: '#1B263B'}}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <div 
        className={`
          fixed lg:static inset-y-0 left-0 z-40 w-64 text-white transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{backgroundColor: '#1B263B'}}
      >
        <div className="flex flex-col h-full">
          {/* User Profile */}
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center space-x-3 mb-4">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                style={{
                  backgroundColor: '#f4e27e',
                  color: '#10161a'
                }}
              >
                {user.avatar}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{user.name}</h3>
                <p className={`text-sm font-medium ${getLevelColor(user.level)}`}>
                  {user.level}
                </p>
              </div>
            </div>
            
            {/* Rating */}
            <div className="flex items-center space-x-2">
              <div className="flex">
                {renderStars(user.rating)}
              </div>
              <span className="text-sm text-white/70">{user.rating}</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        onSectionChange(item.id);
                        setIsMobileOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-300 ease-in-out font-medium"
                      style={{
                        backgroundColor: activeSection === item.id ? '#f4e27e' : 'transparent',
                        color: activeSection === item.id ? '#10161a' : 'rgba(255, 255, 255, 0.9)',
                        fontWeight: activeSection === item.id ? '600' : '500'
                      }}
                      onMouseEnter={(e) => {
                        if (activeSection !== item.id) {
                          e.currentTarget.style.backgroundColor = '#24324D';
                          e.currentTarget.style.color = 'white';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (activeSection !== item.id) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                        }
                      }}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-white/20">
            {/* Theme Toggle */}
            <div className="flex justify-center mb-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg border border-white/20 hover:bg-white/10 transition-colors duration-200"
                title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-yellow-400" />
                ) : (
                  <Moon className="h-5 w-5 text-blue-300" />
                )}
              </button>
            </div>
            
            <div className="text-center">
              <p className="text-xs text-white/50">GROWS Panel</p>
              <p className="text-xs text-white/50">v1.0.0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}

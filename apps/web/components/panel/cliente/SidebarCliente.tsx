'use client';

import { useState } from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Calendar, 
  FileText, 
  Settings, 
  Bell,
  BarChart3,
  Menu,
  X
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  company: string;
  role: string;
  rating: number;
  level: string;
  obrasActivas: number;
  cuadrillasAsignadas: number;
}

interface SidebarClienteProps {
  user: User;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function SidebarCliente({ user, activeSection, onSectionChange }: SidebarClienteProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'obras', label: 'Mis Obras', icon: Building2 },
    { id: 'cuadrillas', label: 'Cuadrillas', icon: Users },
    { id: 'calendario', label: 'Calendario', icon: Calendar },
    { id: 'reportes', label: 'Reportes', icon: BarChart3 },
    { id: 'plantillas', label: 'Plantillas', icon: FileText },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Experto': return 'text-acento';
      case 'Avanzado': return 'text-blue-400';
      case 'Intermedio': return 'text-green-400';
      default: return 'text-white/70';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.floor(rating) ? 'text-acento' : 'text-white/30'}>
        ★
      </span>
    ));
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-primario text-white p-2 rounded-lg"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-primario text-white transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* User Profile */}
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-acento rounded-full flex items-center justify-center text-oscuro text-2xl">
                {user.avatar}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{user.name}</h3>
                <p className={`text-sm font-medium ${getLevelColor(user.level)}`}>
                  {user.level}
                </p>
              </div>
            </div>

            {/* Company Info */}
            <div className="mb-4">
              <p className="text-sm text-white/70">{user.company}</p>
              <p className="text-sm text-white/60">{user.role}</p>
            </div>

            {/* Rating */}
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex">
                {renderStars(user.rating)}
              </div>
              <span className="text-sm text-white/70">{user.rating}</span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-primario/30 rounded-lg p-2">
                <div className="text-lg font-bold text-acento">{user.obrasActivas}</div>
                <div className="text-xs text-white/70">Obras Activas</div>
              </div>
              <div className="bg-primario/30 rounded-lg p-2">
                <div className="text-lg font-bold text-acento">{user.cuadrillasAsignadas}</div>
                <div className="text-xs text-white/70">Cuadrillas</div>
              </div>
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
                      className={`
                        w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-smooth font-medium
                        ${activeSection === item.id
                          ? 'bg-acento text-oscuro font-semibold'
                          : 'text-white/70 hover:text-white hover:bg-gradient-to-r hover:from-primario hover:to-[#24324D]'
                        }
                      `}
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
            <div className="text-center">
              <p className="text-xs text-white/50">GROWS Cliente</p>
              <p className="text-xs text-white/50">v1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

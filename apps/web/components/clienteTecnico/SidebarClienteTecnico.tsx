'use client';

import { MessageCircle, Building2, Users, CheckSquare, User, Bell, Calendar, ClipboardList } from 'lucide-react';

interface SidebarClienteTecnicoProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function SidebarClienteTecnico({ activeSection, onSectionChange }: SidebarClienteTecnicoProps) {
  const menuItems = [
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'obras', label: 'Obras', icon: Building2 },
    { id: 'tareas', label: 'Tareas', icon: ClipboardList },
    { id: 'cuadrillas', label: 'Cuadrillas', icon: Users },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
    { id: 'calendario', label: 'Calendario', icon: Calendar },
    { id: 'cuenta', label: 'Cuenta', icon: User },
  ];

  // Debug: Log para verificar que el sidebar se está renderizando
  console.log('SidebarClienteTecnico renderizado, activeSection:', activeSection);

  return (
    <div className="fixed left-0 top-0 h-full w-[220px] bg-primario text-white flex flex-col">
      {/* Logo/Avatar */}
      <div className="p-6 border-b border-white/20">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-acento rounded-full flex items-center justify-center mb-3 border-2 border-acento">
            <img 
              src="/images/avatar.svg" 
              alt="Avatar" 
              className="w-12 h-12 rounded-full object-cover"
            />
          </div>
          <h1 className="text-xl font-bold">Grows</h1>
          <p className="text-sm text-white/70">Cliente Técnico</p>
        </div>
      </div>

      {/* Menú */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 font-medium
                    ${activeSection === item.id
                      ? 'bg-acento text-primario'
                      : 'text-white hover:bg-acento hover:text-primario'
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

      {/* Versión */}
      <div className="p-4 border-t border-white/20">
        <p className="text-xs text-white/50 text-center">v1.0</p>
      </div>
    </div>
  );
}

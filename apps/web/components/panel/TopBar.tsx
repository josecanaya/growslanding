'use client';

import { Power, Coffee, LogOut } from 'lucide-react';

interface TopBarProps {
  isConnected: boolean;
  isOnBreak: boolean;
  onConnectionToggle: () => void;
  onBreakToggle: () => void;
  onLogout: () => void;
}

export function TopBar({ 
  isConnected, 
  isOnBreak, 
  onConnectionToggle, 
  onBreakToggle, 
  onLogout 
}: TopBarProps) {
  return (
    <div className="bg-oscuro text-white p-4 border-b border-white/20">
      <div className="flex items-center justify-between">
        {/* Left side - Info */}
        <div className="flex items-center space-x-6">
          <div className="text-sm">
            <span className="text-white/70">Tarea:</span>
            <span className="ml-2 font-medium">Replanteo de cimientos</span>
          </div>
          <div className="text-sm">
            <span className="text-white/70">Obra:</span>
            <span className="ml-2 font-medium">Casa Familiar</span>
          </div>
          <div className="text-sm">
            <span className="text-white/70">Tiempo:</span>
            <span className="ml-2 font-medium">2h 30m</span>
          </div>
          <div className="text-sm">
            <span className="text-white/70">Acumulado:</span>
            <span className="ml-2 font-medium">$15,200</span>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-3">
          {/* Connection Toggle */}
          <button
            onClick={onConnectionToggle}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200
              ${isConnected 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-red-600 hover:bg-red-700'
              }
            `}
          >
            <Power className="h-4 w-4" />
            <span className="text-sm font-medium">
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </button>

          {/* Break Toggle */}
          <button
            onClick={onBreakToggle}
            className={`
              flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200
              ${isOnBreak 
                ? 'bg-acento text-oscuro hover:bg-acento/90' 
                : 'bg-white/10 hover:bg-white/20'
              }
            `}
          >
            <Coffee className="h-4 w-4" />
            <span className="text-sm font-medium">
              {isOnBreak ? 'En descanso' : 'Descanso'}
            </span>
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { TopBar } from '@/components/panel/TopBar';
import { PanelViewer } from '@/components/panel/PanelViewer';
import { SwipeUpCameraButton } from '@/components/panel/SwipeUpCameraButton';

export default function PanelPage() {
  const [activeSection, setActiveSection] = useState('tareas');
  const [isConnected, setIsConnected] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [user, setUser] = useState({
    name: 'Juan Pérez',
    avatar: '👷‍♂️',
    rating: 4.8,
    level: 'Oro'
  });

  // Simular datos de localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedConnection = localStorage.getItem('isConnected');
    const savedBreak = localStorage.getItem('isOnBreak');
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    if (savedConnection) {
      setIsConnected(JSON.parse(savedConnection));
    }
    if (savedBreak) {
      setIsOnBreak(JSON.parse(savedBreak));
    }
  }, []);

  const handleConnectionToggle = () => {
    const newConnection = !isConnected;
    setIsConnected(newConnection);
    localStorage.setItem('isConnected', JSON.stringify(newConnection));
  };

  const handleBreakToggle = () => {
    const newBreak = !isOnBreak;
    setIsOnBreak(newBreak);
    localStorage.setItem('isOnBreak', JSON.stringify(newBreak));
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('isConnected');
    localStorage.removeItem('isOnBreak');
    window.location.href = '/auth/login';
  };

  return (
    <div className="min-h-screen flex flex-col bg-claro">
      {/* Top Bar Fijo */}
      <TopBar 
        isConnected={isConnected}
        isOnBreak={isOnBreak}
        onConnectionToggle={handleConnectionToggle}
        onBreakToggle={handleBreakToggle}
        onLogout={handleLogout}
        user={user}
        onSectionChange={setActiveSection}
      />
      
      {/* Contenido Principal - Una sola columna scrolleable */}
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="px-4 py-6 space-y-6">
          <PanelViewer 
            activeSection={activeSection}
            user={user}
          />
        </div>
      </main>
      
      {/* Botón deslizable para cámara */}
      <SwipeUpCameraButton />
    </div>
  );
}
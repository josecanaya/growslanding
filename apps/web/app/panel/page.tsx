'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/panel/Sidebar';
import { TopBar } from '@/components/panel/TopBar';
import { PanelViewer } from '@/components/panel/PanelViewer';
import { FooterPanel } from '@/components/panel/FooterPanel';

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
    <div className="min-h-screen bg-secundario">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar 
          user={user}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <TopBar 
            isConnected={isConnected}
            isOnBreak={isOnBreak}
            onConnectionToggle={handleConnectionToggle}
            onBreakToggle={handleBreakToggle}
            onLogout={handleLogout}
          />
          
          {/* Panel Viewer */}
          <div className="flex-1 p-6">
            <PanelViewer 
              activeSection={activeSection}
              user={user}
            />
          </div>
          
          {/* Footer Panel */}
          <FooterPanel />
        </div>
      </div>
    </div>
  );
}

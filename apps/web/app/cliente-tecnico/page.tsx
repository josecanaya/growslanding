'use client';

import { useState } from 'react';
import { SidebarClienteTecnico } from '@/components/clienteTecnico/SidebarClienteTecnico';
import { ChatSection } from '@/components/clienteTecnico/ChatSection';
import ObrasSection from '@/components/clienteTecnico/ObrasSection';
import CuadrillasPage from '@/app/cuadrillas/page';
import { ValidarTareasSection } from '@/components/clienteTecnico/ValidarTareasSection';
import { CuentaSection } from '@/components/clienteTecnico/CuentaSection';
import { TareasSection } from '@/components/clienteTecnico/TareasSection';
import { NotificacionesSection } from '@/components/clienteTecnico/NotificacionesSection';
import { CalendarioSection } from '@/components/clienteTecnico/CalendarioSection';

export default function ClienteTecnicoPage() {
  const [activeSection, setActiveSection] = useState('obras');

  // Debug: Log para verificar que la página se está renderizando
  console.log('ClienteTecnicoPage renderizado, activeSection:', activeSection);

  const renderSection = () => {
    console.log('Renderizando sección:', activeSection);
    switch (activeSection) {
      case 'chat':
        return <ChatSection onNavigate={setActiveSection} />;
      case 'obras':
        return <ObrasSection />;
      case 'tareas':
        return <TareasSection />;
      case 'cuadrillas':
        return <CuadrillasPage />;
      case 'notificaciones':
        return <NotificacionesSection />;
      case 'calendario':
        return <CalendarioSection />;
      case 'cuenta':
        return <CuentaSection />;
      default:
        return <ObrasSection />;
    }
  };

  return (
    <div className="min-h-screen bg-secundario flex">
      {/* Sidebar */}
      <SidebarClienteTecnico 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      
      {/* Contenedor principal */}
      <div className="flex-1 ml-[220px] p-8">
        {renderSection()}
      </div>
    </div>
  );
}

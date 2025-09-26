'use client';

import { useState } from 'react';
import { SidebarClienteTecnico } from '@/components/clienteTecnico/SidebarClienteTecnico';
import { ChatSection } from '@/components/clienteTecnico/ChatSection';
import { ObrasSection } from '@/components/clienteTecnico/ObrasSection';
import { PresupuestoSection } from '@/components/clienteTecnico/PresupuestoSection';
import { ValidarTareasSection } from '@/components/clienteTecnico/ValidarTareasSection';
import { CuentaSection } from '@/components/clienteTecnico/CuentaSection';

export default function ClienteTecnicoPage() {
  const [activeSection, setActiveSection] = useState('chat');

  const renderSection = () => {
    switch (activeSection) {
      case 'chat':
        return <ChatSection onNavigate={setActiveSection} />;
      case 'obras':
        return <ObrasSection />;
      case 'presupuesto':
        return <PresupuestoSection />;
      case 'validar':
        return <ValidarTareasSection />;
      case 'cuenta':
        return <CuentaSection />;
      default:
        return <ChatSection onNavigate={setActiveSection} />;
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

'use client';

import { DashboardCliente } from './sections/DashboardCliente';
import { ObrasCliente } from './sections/ObrasCliente';
import { CuadrillasCliente } from './sections/CuadrillasCliente';
import { CalendarioCliente } from './sections/CalendarioCliente';
import { ReportesCliente } from './sections/ReportesCliente';
import { PlantillasCliente } from './sections/PlantillasCliente';
import { NotificacionesCliente } from './sections/NotificacionesCliente';
import { ConfiguracionCliente } from './sections/ConfiguracionCliente';

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

interface PanelViewerClienteProps {
  activeSection: string;
  user: User;
}

export function PanelViewerCliente({ activeSection, user }: PanelViewerClienteProps) {
  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardCliente user={user} />;
      case 'obras':
        return <ObrasCliente user={user} />;
      case 'cuadrillas':
        return <CuadrillasCliente user={user} />;
      case 'calendario':
        return <CalendarioCliente user={user} />;
      case 'reportes':
        return <ReportesCliente user={user} />;
      case 'plantillas':
        return <PlantillasCliente user={user} />;
      case 'notificaciones':
        return <NotificacionesCliente user={user} />;
      case 'configuracion':
        return <ConfiguracionCliente user={user} />;
      default:
        return <DashboardCliente user={user} />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg min-h-[600px]">
      {renderSection()}
    </div>
  );
}

'use client';

import { TareasEnCurso } from './sections/TareasEnCurso';
import { Obras } from './sections/Obras';
import { MiCuadrilla } from './sections/MiCuadrilla';
import { Notificaciones } from './sections/Notificaciones';
import { Calendario } from './sections/Calendario';
import { Presupuesto } from './sections/Presupuesto';
import { Cuenta } from './sections/Cuenta';

interface User {
  name: string;
  avatar: string;
  rating: number;
  level: string;
}

interface PanelViewerProps {
  activeSection: string;
  user: User;
}

export function PanelViewer({ activeSection, user }: PanelViewerProps) {
  const renderSection = () => {
    switch (activeSection) {
      case 'tareas':
        return <TareasEnCurso user={user} />;
      case 'obras':
        return <Obras user={user} />;
      case 'cuadrilla':
        return <MiCuadrilla user={user} />;
      case 'notificaciones':
        return <Notificaciones user={user} />;
      case 'calendario':
        return <Calendario user={user} />;
      case 'presupuesto':
        return <Presupuesto user={user} />;
      case 'cuenta':
        return <Cuenta user={user} />;
      default:
        return <TareasEnCurso user={user} />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg min-h-[600px]">
      {renderSection()}
    </div>
  );
}

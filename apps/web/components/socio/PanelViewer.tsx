'use client';

import { TareasEnCurso } from './sections/TareasEnCurso';
import { Obras } from './sections/Obras';
import { MiCuadrilla } from './sections/MiCuadrilla';
import { Notificaciones } from './sections/Notificaciones';
import { CuentaSection } from './sections/CuentaSection';
import { MisTareas } from './sections/MisTareas';

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
      case 'mis-tareas':
        return <MisTareas user={user} />;
      case 'cuadrilla':
        return <MiCuadrilla user={user} />;
      case 'notificaciones':
        return <Notificaciones user={user} />;
      case 'cuenta':
        return <CuentaSection user={user} />;
      default:
        return <TareasEnCurso user={user} />;
    }
  };

  return (
    <div className="w-full">
      {renderSection()}
    </div>
  );
}


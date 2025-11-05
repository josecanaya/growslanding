'use client';

import { TareasEnCurso } from '../panel/sections/TareasEnCurso';
import { Obras } from '../panel/sections/Obras';
import { MiCuadrilla } from '../panel/sections/MiCuadrilla';
import { Notificaciones } from '../panel/sections/Notificaciones';
import { CuentaSection } from '../panel/sections/CuentaSection';
import { MisTareas } from '../panel/sections/MisTareas';

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
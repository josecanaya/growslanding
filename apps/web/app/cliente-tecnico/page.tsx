'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { SidebarClienteTecnico } from '@/components/clienteTecnico/SidebarClienteTecnico';
import { ChatSection } from '@/components/clienteTecnico/ChatSection';
import ObrasSection from '@/components/clienteTecnico/ObrasSection';
import CuadrillasPage from '@/app/cuadrillas/page';
import { ValidarTareasSection } from '@/components/clienteTecnico/ValidarTareasSection';
import { CuentaSection } from '@/components/clienteTecnico/CuentaSection';
import { TareasSection } from '@/components/clienteTecnico/TareasSection';
import { NotificacionesSection } from '@/components/clienteTecnico/NotificacionesSection';
import { CalendarioSection } from '@/components/clienteTecnico/CalendarioSection';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { normalizeRole } from '@/lib/roles';

export default function ClienteTecnicoPage() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const [activeSection, setActiveSection] = useState('chat');

  const normalizedRole = useMemo(
    () => normalizeRole(currentUser?.role),
    [currentUser?.role]
  );

  useEffect(() => {
    if (!currentUser || currentUser.isDevUser) {
      return;
    }

    if (normalizedRole === 'CLIENTE_TECNICO' && !currentUser.orgId) {
      router.replace('/onboarding');
    }
  }, [currentUser, normalizedRole, router]);

  const renderSection = () => {
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

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secundario text-white">
        <p className="text-sm text-white/70">Cargando panel…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-secundario">
      <SidebarClienteTecnico
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      <div className="ml-[220px] flex-1 p-8">{renderSection()}</div>
    </div>
  );
}

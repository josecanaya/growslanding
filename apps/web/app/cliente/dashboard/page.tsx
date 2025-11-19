'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';

import { SidebarClienteTecnico } from '@/components/cliente/SidebarClienteTecnico';
import { ChatSection } from '@/components/cliente/ChatSection';
import ObrasSection from '@/components/cliente/ObrasSection';
import { CuadrillasSection } from '@/components/cliente/CuadrillasSection';
import { ValidarTareasSection } from '@/components/cliente/ValidarTareasSection';
import { CuentaSection } from '@/components/cliente/CuentaSection';
import { TareasSection } from '@/components/cliente/TareasSection';
import { NotificacionesSection } from '@/components/cliente/NotificacionesSection';
import { CalendarioSection } from '@/components/cliente/CalendarioSection';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { normalizeRole } from '@/lib/roles';
import { useOnboardingCliente } from '@/hooks/useOnboardingCliente';

export default function ClienteDashboardPage() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const [activeSection, setActiveSection] = useState('obras');
  const { startOnboarding } = useOnboardingCliente();

  const normalizedRole = useMemo(
    () => normalizeRole(currentUser?.role),
    [currentUser?.role]
  );

  // Leer parámetro de sección desde la URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sectionParam = params.get('section');
      if (sectionParam && ['chat', 'obras', 'tareas', 'cuadrillas', 'notificaciones', 'calendario', 'cuenta'].includes(sectionParam)) {
        setActiveSection(sectionParam);
        // Limpiar el parámetro de la URL después de leerlo
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, []);

  useEffect(() => {
    if (!currentUser || currentUser.isDevUser) {
      return;
    }

    if (normalizedRole === 'CLIENTE_TECNICO' && !currentUser.orgId) {
      router.replace('/onboarding' as Route);
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
        return <CuadrillasSection onNavigate={setActiveSection} />;
      case 'notificaciones':
        return <NotificacionesSection onNavigate={setActiveSection} />;
      case 'calendario':
        return <CalendarioSection onNavigate={setActiveSection} />;
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
        onStartTutorial={startOnboarding}
      />

      <div className="ml-[220px] flex-1 p-8">{renderSection()}</div>
    </div>
  );
}


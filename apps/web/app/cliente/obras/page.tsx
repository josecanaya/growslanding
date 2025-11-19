'use client';

import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { SidebarClienteTecnico } from '@/components/cliente/SidebarClienteTecnico';
import { ObrasListContainer } from '@/components/obras/containers/ObrasListContainer';
import { useOnboardingCliente } from '@/hooks/useOnboardingCliente';

export default function ObrasPage() {
  const router = useRouter();
  const { startOnboarding } = useOnboardingCliente();

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <SidebarClienteTecnico 
        activeSection="obras"
        onSectionChange={(section) => {
          if (section !== 'obras') {
            router.push((`/cliente/dashboard?section=${section}`) as Route);
          }
        }}
        onStartTutorial={startOnboarding}
      />
      
      {/* Contenedor principal */}
      <div className="flex-1 ml-[220px]">
        <ObrasListContainer />
      </div>
    </div>
  );
}


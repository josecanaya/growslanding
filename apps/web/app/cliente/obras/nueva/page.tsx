'use client';

import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { SidebarClienteTecnico } from '@/components/cliente/SidebarClienteTecnico';
import { WizardCrearObraLayout } from '@/components/obras/wizardNuevo/WizardCrearObraLayout';
import { TopBarMobile } from '@/components/cliente/TopBarMobile';
import { TabBarMobile } from '@/components/cliente/TabBarMobile';
import { useDeviceType } from '@/lib/hooks/useDeviceType';
import { useState } from 'react';

export default function NuevaObraPage() {
  const router = useRouter();
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'mobile';
  const [activeSection, setActiveSection] = useState('obras');

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar solo en desktop */}
      {!isMobile && (
        <SidebarClienteTecnico
          activeSection={activeSection}
          onSectionChange={(section) => {
            setActiveSection(section);
            if (section === 'obras') {
              router.push('/cliente/obras' as Route);
              return;
            }
            router.push((`/cliente/dashboard?section=${section}`) as Route);
          }}
        />
      )}

      {/* TopBar solo en mobile/tablet */}
      {isMobile && (
        <TopBarMobile
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
      )}

      <div className={`
        flex-1 w-full
        ${isMobile ? 'ml-0 pt-14 pb-20' : 'ml-[220px]'}
        overflow-x-hidden
      `}>
        <WizardCrearObraLayout />
      </div>

      {/* TabBar solo en mobile */}
      {isMobile && (
        <TabBarMobile
          activeSection={activeSection}
        />
      )}
    </div>
  );
}


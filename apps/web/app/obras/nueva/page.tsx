'use client';

import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { SidebarClienteTecnico } from '@/components/cliente/SidebarClienteTecnico';
import { WizardCrearObraLayout } from '@/components/obras/wizardNuevo/WizardCrearObraLayout';

export default function NuevaObraPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-secundario flex">
      <SidebarClienteTecnico
        activeSection="obras"
        onSectionChange={(section) => {
          if (section === 'obras') {
            router.push('/cliente/obras' as Route);
            return;
          }

          router.push((`/cliente/dashboard?section=${section}`) as Route);
        }}
      />

      <div className="flex-1 ml-[220px]">
        <WizardCrearObraLayout />
      </div>
    </div>
  );
}


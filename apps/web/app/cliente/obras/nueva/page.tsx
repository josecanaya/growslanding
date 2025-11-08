'use client';

import { useRouter } from 'next/navigation';
import { SidebarClienteTecnico } from '@/components/cliente/SidebarClienteTecnico';
import { WizardCrearObraLayout } from '@/components/obras/wizardNuevo/WizardCrearObraLayout';

export default function NuevaObraPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-secundario flex">
      <SidebarClienteTecnico
        activeSection="obras"
        onSectionChange={(section) => {
          if (section !== 'obras') {
            router.push('/cliente/dashboard');
          } else {
            router.push('/cliente/obras');
          }
        }}
      />

      <div className="flex-1 ml-[220px]">
        <WizardCrearObraLayout />
      </div>
    </div>
  );
}


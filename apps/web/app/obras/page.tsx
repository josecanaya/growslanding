'use client';

import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { SidebarClienteTecnico } from '@/components/cliente/SidebarClienteTecnico';
import { ObrasListContainer } from '@/components/obras/containers/ObrasListContainer';

export default function ObrasPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-grows-background flex">
      {/* Sidebar */}
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
      
      {/* Contenedor principal */}
      <div className="flex-1 ml-[220px]">
        <ObrasListContainer />
      </div>
    </div>
  );
}

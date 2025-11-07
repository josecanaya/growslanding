'use client';

import { useRouter } from 'next/navigation';
import { SidebarClienteTecnico } from '@/components/cliente/SidebarClienteTecnico';
import { ObrasListContainer } from '@/components/obras/containers/ObrasListContainer';

export default function ObrasPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <SidebarClienteTecnico 
        activeSection="obras"
        onSectionChange={(section) => {
          if (section !== 'obras') {
            router.push('/cliente/dashboard');
          }
        }}
      />
      
      {/* Contenedor principal */}
      <div className="flex-1 ml-[220px]">
        <ObrasListContainer />
      </div>
    </div>
  );
}


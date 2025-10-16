'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarClienteTecnico } from '@/components/clienteTecnico/SidebarClienteTecnico';
import ObrasSection from '@/components/clienteTecnico/ObrasSection';

export default function ObrasPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-grows-background flex">
      {/* Sidebar */}
      <SidebarClienteTecnico 
        activeSection="obras"
        onSectionChange={(section) => {
          if (section !== 'obras') {
            router.push('/cliente-tecnico');
          }
        }}
      />
      
      {/* Contenedor principal */}
      <div className="flex-1 ml-[220px]">
        <ObrasSection />
      </div>
    </div>
  );
}

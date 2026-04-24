'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { Loader2 } from 'lucide-react';
import { SidebarClienteTecnico } from '@/components/cliente/SidebarClienteTecnico';
import { ObrasListContainer } from '@/components/obras/containers/ObrasListContainer';

function ObrasListFallback() {
  return (
    <div className="flex min-h-[240px] items-center justify-center text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
    </div>
  );
}

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
        <Suspense fallback={<ObrasListFallback />}>
          <ObrasListContainer />
        </Suspense>
      </div>
    </div>
  );
}

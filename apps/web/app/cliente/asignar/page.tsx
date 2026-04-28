'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { SectionLayout } from '@/components/ui/grows';
import { AsignarSection } from '@/components/cliente/AsignarSection';

function AsignarSectionFallback() {
  return (
    <div className="flex min-h-[200px] items-center justify-center text-muted-foreground">
      <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
    </div>
  );
}

export default function ClienteAsignarPage() {
  return (
    <SectionLayout
      title="Asignar cuadrillas"
      subtitle="Usá socios agendados en tu agenda de contactos de obra para asignar tareas y solicitar presupuestos."
    >
      <Suspense fallback={<AsignarSectionFallback />}>
        <AsignarSection />
      </Suspense>
    </SectionLayout>
  );
}

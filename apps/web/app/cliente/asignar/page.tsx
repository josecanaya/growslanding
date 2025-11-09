'use client';

import { SectionLayout } from '@/components/ui/grows';
import { AsignarSection } from '@/components/cliente/AsignarSection';

export default function ClienteAsignarPage() {
  return (
    <SectionLayout
      title="Asignar cuadrillas"
      subtitle="Solicitá presupuestos, compará propuestas y asigná la cuadrilla ideal para cada tarea."
    >
      <AsignarSection />
    </SectionLayout>
  );
}

'use client';

import { useSearchParams } from 'next/navigation';

import { SectionLayout } from '@/components/ui/grows';
import { ResumenTareasLayout } from '@/components/tareas/ResumenTareasLayout';

export default function ResumenTareasPage() {
  const searchParams = useSearchParams();
  const obraId = searchParams.get('obraId');

  return (
    <SectionLayout
      title="Resumen de tareas"
      subtitle="Visualizá el estado general de las tareas para la obra seleccionada."
    >
      <ResumenTareasLayout initialObraId={obraId} />
    </SectionLayout>
  );
}



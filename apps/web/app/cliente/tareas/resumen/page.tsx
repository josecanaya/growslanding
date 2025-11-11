'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { SectionLayout } from '@/components/ui/grows';
import { ResumenTareasLayout } from '@/components/tareas/ResumenTareasLayout';

function ResumenTareasPageContent() {
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

export default function ResumenTareasPage() {
  return (
    <Suspense fallback={<SectionLayout title="Resumen de tareas" subtitle="Cargando datos…"><div /></SectionLayout>}>
      <ResumenTareasPageContent />
    </Suspense>
  );
}



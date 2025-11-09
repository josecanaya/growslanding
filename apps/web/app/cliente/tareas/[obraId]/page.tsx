'use client';

import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

import { ResumenTareasLayout } from '@/components/tareas/ResumenTareasLayout';
import { Button, SectionLayout } from '@/components/ui/grows';

export default function ClienteTareasObraResumenPage() {
  const router = useRouter();
  const params = useParams<{ obraId: string }>();
  const obraId = params?.obraId ?? '';

  return (
    <SectionLayout
      title="Resumen de tareas"
      subtitle="Visualizá el estado general de las tareas asociadas a esta obra."
      headerAction={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/cliente/tareas')}
          className="text-[#0052CC] hover:bg-[#0052CC]/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      }
    >
      <ResumenTareasLayout initialObraId={obraId} />
    </SectionLayout>
  );
}


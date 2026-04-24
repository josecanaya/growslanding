'use client';

import type { Route } from 'next';
import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/grows';
import { SectionHeader } from '@/components/cliente/SectionHeader';
import { TareaCard } from '@/components/cliente/TareaCard';
import { obraById, tareasByObra } from '@/lib/mocks/clienteMockData';

export default function ClienteTareasObraResumenPage() {
  const router = useRouter();
  const params = useParams<{ obraId: string }>();
  const obraId = params?.obraId ?? '';
  const obra = obraById(obraId);
  const tareas = tareasByObra(obra.id);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/cliente/tareas' as Route)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => router.push(`/cliente/tareas/${obra.id}/editor` as Route)}
        >
          Abrir editor (mock)
        </Button>
      </div>
      <SectionHeader
        eyebrow={obra.tipo}
        title={obra.nombre}
        description={`Resumen de tareas · ${obra.ubicacion} · Cuadrilla: ${obra.cuadrillaNombre}`}
      />
      <div className="space-y-3">
        {tareas.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
            No hay tareas mock para esta obra.
          </p>
        ) : (
          tareas.map((t) => <TareaCard key={t.id} {...t} />)
        )}
      </div>
    </div>
  );
}

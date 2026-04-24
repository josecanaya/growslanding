'use client';

import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { Building2, ArrowRight } from 'lucide-react';
import { Card, Button, Badge, EmptyState } from '@/components/ui/grows';
import { SectionHeader } from '@/components/cliente/SectionHeader';
import { MOCK_OBRAS } from '@/lib/mocks/clienteMockData';

function estadoVariant(estado: string) {
  if (estado === 'En progreso') return 'success';
  if (estado === 'Para validar') return 'warning';
  if (estado === 'Planificación') return 'default';
  return 'default';
}

export default function TareasPage() {
  const router = useRouter();
  const obrasActivas = MOCK_OBRAS.filter((o) => o.estado === 'En progreso' || o.estado === 'Para validar');

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <SectionHeader
        eyebrow="Planificación"
        title="Tareas por obra"
        description="Elegí una obra para ver el resumen y el editor de planificación (mock)."
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {obrasActivas.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              title="No hay obras en ejecución"
              description="Activá una obra en el listado o usá el prototipo completo."
              icon={<Building2 className="h-16 w-16" />}
            />
          </div>
        ) : (
          obrasActivas.map((obra) => (
            <Card
              key={obra.id}
              footer={
                <div className="flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push(`/cliente/tareas/${obra.id}/editor` as Route)}
                  >
                    Editor
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<ArrowRight className="h-4 w-4" />}
                    onClick={() => router.push(`/cliente/tareas/${obra.id}` as Route)}
                  >
                    Resumen
                  </Button>
                </div>
              }
            >
              <div className="mb-4 flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-grows-primary">{obra.nombre}</h3>
                  <p className="mt-1 text-sm text-grows-text-secondary">{obra.ubicacion}</p>
                </div>
                <Badge variant={estadoVariant(obra.estado)}>{obra.estado}</Badge>
              </div>
              <div className="mb-2 flex justify-between text-sm text-grows-text-secondary">
                <span>Avance</span>
                <span>{obra.avancePct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-grows-neutral">
                <div
                  className="h-2 rounded-full bg-grows-secondary transition-all"
                  style={{ width: `${obra.avancePct}%` }}
                />
              </div>
              <p className="mt-3 text-xs text-grows-text-secondary">
                {obra.tareasActivas} tareas activas · {obra.tareasParaValidar} para validar
              </p>
            </Card>
          ))
        )}
      </div>

      {obrasActivas.length > 0 ? (
        <Card title="Resumen rápido (mock)">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-grows-primary">{obrasActivas.length}</div>
              <div className="text-sm text-grows-text-secondary">Obras con tareas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-grows-secondary">
                {Math.round(obrasActivas.reduce((a, o) => a + o.avancePct, 0) / obrasActivas.length)}%
              </div>
              <div className="text-sm text-grows-text-secondary">Avance promedio</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-grows-primary">
                {obrasActivas.reduce((acc, o) => acc + o.tareasActivas, 0)}
              </div>
              <div className="text-sm text-grows-text-secondary">Tareas activas (suma)</div>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

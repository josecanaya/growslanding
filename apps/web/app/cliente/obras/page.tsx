'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { Plus, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { SectionHeader } from '@/components/cliente/SectionHeader';
import { ObraCard } from '@/components/cliente/ObraCard';
import { Button } from '@/components/ui/grows';
import { useClienteObras, type ClienteObraListaItem } from '@/lib/hooks/useClienteObras';

function estadoLabel(e: string | null | undefined): string {
  if (!e) return '—';
  const u = e.toLowerCase();
  if (u === 'activa') return 'En progreso';
  if (u === 'pausada') return 'Pausada';
  if (u === 'finalizada' || u === 'finalizado') return 'Validada';
  return e;
}

export default function ObrasPage() {
  const { obras, loading, error, refresh } = useClienteObras();
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleEliminarObra = async (id: string) => {
    const obra = obras.find((o: ClienteObraListaItem) => o.id === id);
    const nombre = obra?.name || 'esta obra';
    if (
      !window.confirm(
        `¿Eliminar "${nombre}"? Se borrará en el servidor. Si hay tareas u otros datos vinculados, puede fallar por restricciones de la base.`,
      )
    ) {
      return;
    }
    setEliminandoId(id);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/obras/${encodeURIComponent(id)}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof json.error === 'string'
            ? json.error
            : typeof json.message === 'string'
              ? json.message
              : 'No se pudo eliminar la obra';
        throw new Error(msg);
      }
      await refresh();
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Error al eliminar');
    } finally {
      setEliminandoId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <SectionHeader
        eyebrow="Proyecto vivo"
        title="Proyectos"
        description="IDEA → transformación → estado. Las obras clásicas siguen en el editor de planificación."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href={'/cliente/proyectos/nuevo' as Route}>
              <Button variant="primary" size="sm" icon={<Plus className="h-4 w-4" />}>
                Desde una idea
              </Button>
            </Link>
            <Link href={'/cliente/obras/nueva' as Route}>
              <Button variant="secondary" size="sm" icon={<Plus className="h-4 w-4" />}>
                Plan clásico
              </Button>
            </Link>
          </div>
        }
      />
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>
      )}
      {deleteError && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{deleteError}</p>
      )}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando obras…
        </div>
      ) : obras.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-600">
          No hay proyectos. Empezá desde una idea para abrir el grafo vivo.
          <span className="mt-4 block">
            <Link href={'/cliente/proyectos/nuevo' as Route}>
              <Button variant="primary" size="sm" icon={<Plus className="h-4 w-4" />}>
                Desde una idea
              </Button>
            </Link>
          </span>
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {obras.map((o: ClienteObraListaItem) => {
            const tareas = o._count?.tareas ?? 0;
            const avance = Math.min(100, tareas > 0 ? 15 : 0);
            return (
              <ObraCard
                key={o.id}
                id={o.id}
                nombre={o.name || 'Sin nombre'}
                tipo="Obra"
                ubicacion={o.address || 'Sin ubicación'}
                estado={estadoLabel(o.estado)}
                avancePct={avance}
                href={
                  (o.graphMode === 'proyecto_vivo'
                    ? `/cliente/proyectos/${o.id}/grafo`
                    : `/cliente/tareas/${o.id}/editor`) as Route
                }
                onEliminar={handleEliminarObra}
                eliminando={eliminandoId === o.id}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

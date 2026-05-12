'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { Plus, Loader2 } from 'lucide-react';
import { SectionHeader } from '@/components/cliente/SectionHeader';
import { ObraCard } from '@/components/cliente/ObraCard';
import { Button } from '@/components/ui/grows';

type ApiObra = {
  id: string;
  name: string;
  address: string | null;
  estado: string | null;
  _count?: { tareas: number };
};

function estadoLabel(e: string | null | undefined): string {
  if (!e) return '—';
  const u = e.toLowerCase();
  if (u === 'activa') return 'En progreso';
  if (u === 'pausada') return 'Pausada';
  if (u === 'finalizada' || u === 'finalizado') return 'Validada';
  return e;
}

export default function ObrasPage() {
  const [obras, setObras] = useState<ApiObra[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch('/api/obras', { cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json.message || json.error || 'Error al cargar obras');
        }
        if (active) {
          setObras(Array.isArray(json.data) ? json.data : []);
        }
      } catch (e) {
        if (active) {
          setErr(e instanceof Error ? e.message : 'Error');
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleEliminarObra = async (id: string) => {
    const obra = obras.find((o) => o.id === id);
    const nombre = obra?.name || 'esta obra';
    if (
      !window.confirm(
        `¿Eliminar "${nombre}"? Se borrará en el servidor. Si hay tareas u otros datos vinculados, puede fallar por restricciones de la base.`,
      )
    ) {
      return;
    }
    setEliminandoId(id);
    setErr(null);
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
      setObras((prev) => prev.filter((o) => o.id !== id));
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al eliminar');
    } finally {
      setEliminandoId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <SectionHeader
        eyebrow="Proyectos"
        title="Obras"
        description="Obras de tu organización (Supabase)."
        action={
          <Link href={'/cliente/obras/nueva' as Route}>
            <Button variant="primary" size="sm" icon={<Plus className="h-4 w-4" />}>
              Nueva obra
            </Button>
          </Link>
        }
      />
      {err && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{err}</p>
      )}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Cargando obras…
        </div>
      ) : obras.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-600">
          No hay obras. Creá la primera o pedí acceso a tu organización.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {obras.map((o) => {
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
                href={`/cliente/obras/${o.id}` as Route}
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

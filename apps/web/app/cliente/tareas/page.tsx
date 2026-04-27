'use client';

import { useEffect, useState } from 'react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { Building2, ArrowRight, Loader2 } from 'lucide-react';
import { Card, Button, Badge, EmptyState } from '@/components/ui/grows';
import { SectionHeader } from '@/components/cliente/SectionHeader';

type ApiObra = {
  id: string;
  name: string;
  address: string | null;
  estado: string | null;
  _count?: { tareas: number };
};

function estadoVariant(estado: string) {
  const u = estado.toLowerCase();
  if (u.includes('progreso') || u === 'activa') return 'success';
  if (u.includes('validar') || u.includes('valid')) return 'warning';
  if (u.includes('planif')) return 'default';
  return 'default';
}

function estadoLabel(e: string | null | undefined): string {
  if (!e) return '—';
  const u = e.toLowerCase();
  if (u === 'activa') return 'En progreso';
  return e;
}

export default function TareasPage() {
  const router = useRouter();
  const [obras, setObras] = useState<ApiObra[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let a = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch('/api/obras', { cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message || 'Error');
        if (a) setObras(Array.isArray(json.data) ? json.data : []);
      } catch (e) {
        if (a) setErr(e instanceof Error ? e.message : 'Error');
      } finally {
        if (a) setLoading(false);
      }
    })();
    return () => {
      a = false;
    };
  }, []);

  const obrasActivas = obras.filter((o) => {
    const u = (o.estado || '').toLowerCase();
    return u === 'activa' || u === 'pausada' || o._count?.tareas;
  });

  if (loading) {
    return (
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 py-24 text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin" />
        Cargando…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <SectionHeader
        eyebrow="Planificación"
        title="Tareas por obra"
        description="Elegí una obra con datos reales (Supabase)."
      />
      {err && <p className="text-sm text-red-600">{err}</p>}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {obrasActivas.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              title="No hay obras"
              description="Creá una obra o sincronizá con tu organización."
              icon={<Building2 className="h-16 w-16" />}
            />
          </div>
        ) : (
          obrasActivas.map((obra) => {
            const tareasN = obra._count?.tareas ?? 0;
            const avance = Math.min(100, tareasN > 0 ? Math.min(95, 10 + tareasN * 3) : 0);
            return (
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
                    <h3 className="text-lg font-semibold text-grows-primary">
                      {obra.name || 'Sin nombre'}
                    </h3>
                    <p className="mt-1 text-sm text-grows-text-secondary">
                      {obra.address || '—'}
                    </p>
                  </div>
                  <Badge variant={estadoVariant(estadoLabel(obra.estado))}>
                    {estadoLabel(obra.estado)}
                  </Badge>
                </div>
                <div className="mb-2 flex justify-between text-sm text-grows-text-secondary">
                  <span>Indicador</span>
                  <span>{avance}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-grows-neutral">
                  <div
                    className="h-2 rounded-full bg-grows-secondary transition-all"
                    style={{ width: `${avance}%` }}
                  />
                </div>
                <p className="mt-3 text-xs text-grows-text-secondary">
                  {tareasN} tarea(s) en la obra
                </p>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

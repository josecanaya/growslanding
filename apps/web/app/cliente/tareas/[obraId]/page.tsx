'use client';

import type { Route } from 'next';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/grows';
import { SectionHeader } from '@/components/cliente/SectionHeader';
import { TareaCard } from '@/components/cliente/TareaCard';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import {
  mapEstadoDbToTareaCardLabel,
  mapPrioridadDb,
  type ApiTareaRow,
} from '@/lib/mappers/tarea-api-to-ui';

function formatVence(fecha: string | null | undefined): string {
  if (!fecha) return '—';
  try {
    return new Date(fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

export default function ClienteTareasObraResumenPage() {
  const router = useRouter();
  const params = useParams<{ obraId: string }>();
  const obraId = params?.obraId ?? '';
  const user = useCurrentUser();
  const [obraNombre, setObraNombre] = useState<string>('');
  const [obraAddress, setObraAddress] = useState<string>('');
  const [tareas, setTareas] = useState<ApiTareaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!obraId) return;
    let a = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const rObra = await fetch(`/api/obras/${encodeURIComponent(obraId)}`, { cache: 'no-store' });
        const jObra = await rObra.json().catch(() => ({}));
        if (a && rObra.ok && jObra?.data) {
          setObraNombre(jObra.data.name || 'Obra');
          setObraAddress(jObra.data.address || '');
        } else if (a) {
          setObraNombre('Obra');
        }

        const orgId = user?.orgId;
        const tUrl =
          orgId != null
            ? `/api/tareas?obra_id=${encodeURIComponent(obraId)}&org_id=${encodeURIComponent(orgId)}`
            : `/api/tareas?obra_id=${encodeURIComponent(obraId)}`;
        const rT = await fetch(tUrl, { cache: 'no-store' });
        const jT = await rT.json().catch(() => ({}));
        if (!a) return;
        if (!rT.ok) {
          setErr(jT.error || 'No se pudieron cargar las tareas');
          setTareas([]);
          return;
        }
        setTareas(Array.isArray(jT.data) ? jT.data : []);
      } catch {
        if (a) setErr('Error de red');
      } finally {
        if (a) setLoading(false);
      }
    })();
    return () => {
      a = false;
    };
  }, [obraId, user?.orgId]);

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
          onClick={() => router.push(`/cliente/tareas/${obraId}/editor` as Route)}
        >
          Abrir editor
        </Button>
      </div>
      <SectionHeader
        eyebrow="Obra"
        title={loading ? 'Cargando…' : obraNombre}
        description={
          obraAddress
            ? `${obraAddress}${tareas.length ? ` · ${tareas.length} tarea(s)` : ''}`
            : tareas.length
              ? `${tareas.length} tarea(s)`
              : 'Resumen de tareas de la obra'
        }
      />
      {err ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{err}</p>
      ) : null}
      <div className="space-y-3">
        {loading ? (
          <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
            Cargando tareas…
          </p>
        ) : tareas.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
            No hay tareas para esta obra todavía.
          </p>
        ) : (
          tareas.map((t) => (
            <TareaCard
              key={t.id}
              id={t.id}
              obraId={obraId}
              titulo={t.title}
              estado={mapEstadoDbToTareaCardLabel(t.estado)}
              responsable={t.responsable || '—'}
              avancePct={Math.min(100, Math.max(0, t.avance ?? 0))}
              vence={formatVence(t.fecha_fin_estimada || t.fecha_inicio_estimada)}
              prioridad={mapPrioridadDb(t.prioridad)}
            />
          ))
        )}
      </div>
    </div>
  );
}

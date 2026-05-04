'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import { SolicitudOportunidadCard } from '@/components/socio/oportunidades/SolicitudOportunidadCard';
import {
  USE_MOCK_DATA,
  MOCK_SOLICITUDES,
  ordenarSolicitudesPorPrioridad,
} from '@/lib/mocks/socioMockData';
import { STITCH_INNER, StitchStickySubheader } from '@/components/socio/stitch/socioStitchUi';
import { cn } from '@/lib/utils';

type FiltroOpo = 'todos' | 'cerca' | 'urgentes' | 'nuevas';

interface Solicitud {
  obra_id: string;
  obra_name: string;
  direccion_completa: string;
  zona: string;
  fecha_inicio_estimada: string | null;
  duracion_estimada_dias: number | null;
  tipo_trabajo: string;
  etapa: string | null;
  estado_solicitud: 'RECIBIENDO_PRESUPUESTOS' | 'PRESUPUESTO_ENVIADO';
  tiene_presupuesto_socio: boolean;
  urgencia?: 'ALTA' | 'MEDIA' | 'BAJA';
  cantidad_tareas?: number;
}

function OportunidadesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const obraIdHighlight = searchParams.get('obra_id');

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroOpo>('todos');

  useEffect(() => {
    const fetchSolicitudes = async () => {
      setLoading(true);
      setError(null);

      try {
        if (USE_MOCK_DATA) {
          const ordenadas = ordenarSolicitudesPorPrioridad(MOCK_SOLICITUDES);
          const solicitudesFormateadas: Solicitud[] = ordenadas.map((mock) => ({
            obra_id: mock.obra_id,
            obra_name: mock.obra_name,
            direccion_completa: mock.direccion_completa,
            zona: mock.zona,
            fecha_inicio_estimada: mock.fecha_inicio_estimada,
            duracion_estimada_dias: mock.duracion_estimada_dias,
            tipo_trabajo: mock.tipo_trabajo,
            etapa: mock.etapa,
            estado_solicitud: mock.estado,
            tiene_presupuesto_socio: mock.socio_ya_presupuesto,
            urgencia: mock.urgencia,
            cantidad_tareas: mock.cantidad_tareas,
          }));
          setSolicitudes(solicitudesFormateadas);
        } else {
          const response = await fetch('/api/socio/solicitudes', {
            credentials: 'include',
            cache: 'no-store',
          });
          if (!response.ok) {
            throw new Error('Error al cargar solicitudes');
          }
          const data = await response.json();
          const todasSolicitudes = data.solicitudes || [];
          const conDefaults = todasSolicitudes.map((s: Record<string, unknown>) => ({
            ...s,
            urgencia: (s.urgencia as Solicitud['urgencia']) || 'MEDIA',
            cantidad_tareas: Number(s.cantidad_tareas ?? 0),
          }));
          // Backend puede no cumplir del todo el tipo `MockSolicitud`; el orden es el mismo criterio.
          const ordenadas = ordenarSolicitudesPorPrioridad(
            conDefaults as Parameters<typeof ordenarSolicitudesPorPrioridad>[0],
          );
          setSolicitudes(ordenadas as unknown as Solicitud[]);
        }
      } catch {
        setError('No se pudieron cargar las oportunidades');
      } finally {
        setLoading(false);
      }
    };

    void fetchSolicitudes();
  }, []);

  const filas = useMemo(() => {
    let list = solicitudes;
    if (filtro === 'urgentes') {
      list = list.filter((s) => s.urgencia === 'ALTA');
    } else if (filtro === 'nuevas') {
      list = list.filter((s) => !s.tiene_presupuesto_socio);
    } else if (filtro === 'cerca') {
      // Heurística: obras cuyo nombre o zona sugiere proximidad (demo: mitad de lista)
      list = list.filter((_, i) => i % 2 === 0);
    }
    return list;
  }, [solicitudes, filtro]);

  const filtros: { id: FiltroOpo; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'cerca', label: 'Cerca' },
    { id: 'urgentes', label: 'Urgentes' },
    { id: 'nuevas', label: 'Nuevas' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-stitch-surface font-stitch-body">
        <StitchStickySubheader>
          <div className="flex items-center gap-2 px-1">
            <button
              type="button"
              onClick={() => router.push('/socio/panel')}
              className="rounded-lg p-1.5 transition-colors hover:bg-stitch-surface-container"
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5 text-stitch-on-surface" />
            </button>
            <div>
              <h1 className="font-stitch-headline text-lg font-extrabold text-stitch-primary">Oportunidades</h1>
              <p className="text-xs text-stitch-on-surface/60">Cargando…</p>
            </div>
          </div>
        </StitchStickySubheader>
        <div className={STITCH_INNER + ' space-y-0 pt-0'}>
          <div className="divide-y divide-stitch-surface-container/80 overflow-hidden rounded-xl border border-stitch-surface-container bg-stitch-surface-container-lowest">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-2 px-4 py-4">
                <div className="h-4 w-3/4 animate-pulse rounded bg-stitch-surface-container-high" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-stitch-surface-container-high" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-stitch-surface-container-high" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stitch-surface">
        <div className={STITCH_INNER}>
          <button
            type="button"
            onClick={() => router.push('/socio/panel')}
            className="mb-3 flex items-center gap-1 text-sm font-semibold text-stitch-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
          <div className="rounded-lg border border-red-200 bg-red-50/90 p-4">
            <p className="text-sm text-red-800">{error}. Intentá nuevamente.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stitch-surface font-stitch-body">
      <StitchStickySubheader>
        <div className="flex items-start gap-2 px-1">
          <button
            type="button"
            onClick={() => router.push('/socio/panel')}
            className="mt-0.5 rounded-lg p-1.5 transition-colors hover:bg-stitch-surface-container"
            aria-label="Volver"
          >
            <ArrowLeft className="h-5 w-5 text-stitch-on-surface" />
          </button>
          <div>
            <h1 className="font-stitch-headline text-xl font-extrabold text-stitch-primary">Oportunidades</h1>
            <p className="text-xs text-stitch-on-surface/60">Solicitudes para presupuestar</p>
            <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
              {filtros.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFiltro(f.id)}
                  className={cn(
                    'whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold shadow-sm transition',
                    filtro === f.id
                      ? 'bg-stitch-primary text-white'
                      : 'border border-stitch-outline/30 bg-stitch-surface-container-high/90 text-stitch-on-surface/80',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </StitchStickySubheader>

      <div className={STITCH_INNER + ' pt-2'}>
        {filas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stitch-outline/35 bg-stitch-surface-container-lowest py-12 text-center text-sm text-stitch-on-surface/65">
            No hay oportunidades con este criterio.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-stitch-surface-container bg-white shadow-sm">
            <div className="divide-y divide-stitch-surface-container/80">
              {filas.map((solicitud) => (
                <div
                  key={solicitud.obra_id}
                  className={cn(obraIdHighlight === solicitud.obra_id && 'bg-stitch-primary/[0.06]')}
                >
                  <SolicitudOportunidadCard solicitud={solicitud} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OportunidadesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-stitch-surface">
          <Loader2 className="h-8 w-8 animate-spin text-stitch-primary" />
        </div>
      }
    >
      <OportunidadesContent />
    </Suspense>
  );
}

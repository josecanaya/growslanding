'use client';

import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';
import { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import { USE_MOCK_DATA, MOCK_TRABAJOS_HOY } from '@/lib/mocks/socioMockData';

type TrabajoResumen = {
  id: string;
  obra_name: string;
  tarea_title: string;
  bloque_actual: number;
  bloques_totales: number;
  estado: string;
  tiempo_estimado?: string | null;
};

/**
 * Bloque "Trabajo actual" (ref. `stitch_socio` panel home): tarjeta con gradiente, play, barra de progreso.
 */
export function TrabajosHoySection() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const supabase = createClientComponentClient<Database>();
  const [trabajos, setTrabajos] = useState<TrabajoResumen[]>(() =>
    USE_MOCK_DATA
      ? MOCK_TRABAJOS_HOY.map((t) => ({
          id: t.id,
          obra_name: t.obra_name,
          tarea_title: t.tarea_title,
          bloque_actual: t.bloque_actual,
          bloques_totales: t.bloques_totales,
          estado: t.estado,
          tiempo_estimado: t.tiempo_estimado,
        }))
      : [],
  );
  const [loading, setLoading] = useState(() => !USE_MOCK_DATA);

  useEffect(() => {
    if (USE_MOCK_DATA) {
      return;
    }

    const cargarTrabajos = async () => {
      if (!currentUser?.id || !currentUser?.orgId) {
        setTrabajos([]);
        setLoading(false);
        return;
      }

      try {
        const { data: socioData } = await (supabase as any)
          .from('socios')
          .select('id')
          .eq('org_id', currentUser.orgId)
          .or(`email.eq.${currentUser.email || ''},user_id.eq.${currentUser.id || ''}`)
          .maybeSingle();

        if (!socioData?.id) {
          setTrabajos([]);
          setLoading(false);
          return;
        }

        const { data: tareasData } = await (supabase as any)
          .from('tareas')
          .select(`
            id,
            title,
            estado,
            obras(name),
            tareas_subtareas(
              id,
              orden,
              bloque_index,
              estado
            )
          `)
          .eq('org_id', currentUser.orgId)
          .eq('responsable_socio_id', socioData.id)
          .eq('estado', 'en_progreso')
          .limit(3);

        if (tareasData && tareasData.length > 0) {
          const trabajosFormateados: TrabajoResumen[] = tareasData.map((tarea: any) => {
            const subtareas = tarea.tareas_subtareas || [];
            const subtareaEnProgreso = subtareas.find((st: any) => st.estado === 'en_progreso');
            const idx = subtareaEnProgreso?.bloque_index ?? subtareaEnProgreso?.orden ?? 1;
            return {
              id: tarea.id,
              obra_name: tarea.obras?.name || 'Obra sin nombre',
              tarea_title: tarea.title || 'Tarea sin título',
              bloque_actual: idx,
              bloques_totales: Math.max(subtareas.length, 1),
              estado: tarea.estado,
            };
          });
          setTrabajos(trabajosFormateados);
        } else {
          setTrabajos([]);
        }
      } catch {
        setTrabajos([]);
      } finally {
        setLoading(false);
      }
    };

    void cargarTrabajos();
  }, [currentUser?.id, currentUser?.orgId, currentUser?.email, supabase]);

  if (loading) {
    return (
      <section className="animate-pulse space-y-3 rounded-xl bg-stitch-surface-container p-6 shadow-sm">
        <div className="h-3 w-24 rounded bg-stitch-surface-container-high" />
        <div className="h-6 w-3/4 max-w-xs rounded bg-stitch-surface-container-high" />
        <div className="h-4 w-1/2 rounded bg-stitch-surface-container-high" />
        <div className="h-1.5 w-full rounded-full bg-stitch-surface-container-high" />
      </section>
    );
  }

  if (trabajos.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-stitch-outline/40 bg-stitch-surface-container-lowest p-6 text-center shadow-sm">
        <p className="text-sm text-stitch-on-surface/70">
          No tenés trabajo en curso. Cuando te asignen una tarea, podrás reanudarla desde acá.
        </p>
        <button
          type="button"
          className="mt-4 rounded-lg border border-stitch-primary/30 px-4 py-2 text-sm font-semibold text-stitch-primary"
          onClick={() => router.push('/socio/tareas')}
        >
          Ver tareas
        </button>
      </section>
    );
  }

  const actual = trabajos[0];
  const progressPct = Math.min(
    100,
    Math.max(0, Math.round((actual.bloque_actual / actual.bloques_totales) * 100)) || 0,
  );
  const masTrabajos = trabajos.length > 1;

  return (
    <div className="space-y-4">
      <section className="relative overflow-hidden rounded-xl bg-gradient-to-br from-stitch-primary to-stitch-primary-container p-6 text-stitch-on-primary shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-stitch-on-primary/85">
              Trabajo actual
            </p>
            <h2 className="font-stitch-headline text-xl font-extrabold tracking-tight">
              {actual.obra_name}
            </h2>
            <p className="text-sm font-medium text-stitch-on-primary-container">{actual.tarea_title}</p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/socio/ahora')}
            className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-transform active:scale-95"
            aria-label="Continuar"
          >
            <Play className="h-8 w-8" fill="currentColor" />
          </button>
        </div>
        <div className="space-y-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-emerald-400 transition-[width] duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight text-stitch-on-primary/90">
            <span>Progreso: {progressPct}%</span>
            <span>
              Bloque {actual.bloque_actual} de {actual.bloques_totales}
            </span>
          </div>
        </div>
      </section>

      {masTrabajos ? (
        <p className="px-1 text-center text-xs text-stitch-outline">
          +{trabajos.length - 1} tarea{trabajos.length - 1 > 1 ? 's' : ''} más en curso.{' '}
          <button
            type="button"
            className="font-semibold text-stitch-primary"
            onClick={() => router.push('/socio/tareas')}
          >
            Ver listado
          </button>
        </p>
      ) : null}
    </div>
  );
}

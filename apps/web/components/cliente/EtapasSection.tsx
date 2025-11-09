'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2, TrendingUp } from 'lucide-react';

import { Card, EmptyState } from '@/components/ui/grows';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import type { Database } from '@/lib/types/supabase.gen';

const STAGE_DEFINITIONS = [
  {
    key: 'estructura' as const,
    label: 'Estructura',
    description: 'Fundaciones, columnas y vigas principales de la obra.',
    color: '#0057D8',
    surface: '#E6F0FF',
  },
  {
    key: 'obra gris' as const,
    label: 'Obra gris',
    description: 'Mampostería, instalaciones y cerramientos estructurales.',
    color: '#475569',
    surface: '#F1F5F9',
  },
  {
    key: 'terminaciones' as const,
    label: 'Terminaciones',
    description: 'Revoques, pintura, carpinterías y detalles finales.',
    color: '#00C896',
    surface: '#E6FFF6',
  },
];

const COMPLETED_STATES = new Set(['validado', 'finalizado', 'aprobada', 'aprobado']);

type StageKey = (typeof STAGE_DEFINITIONS)[number]['key'];

type EtapasSectionProps = {
  obraId?: string | null;
  requireSelection?: boolean;
};

type RawTarea = Record<string, any> & {
  id: string;
  etapa?: string | null;
  tipo?: string | null;
  category?: string | null;
  fase?: string | null;
  estado: string | null;
  obra_id: string;
};

type StageProgress = {
  key: StageKey;
  label: string;
  description: string;
  color: string;
  surface: string;
  total: number;
  completadas: number;
};

function normalizeStage(value: string | null | undefined): StageKey | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized.includes('estructura')) return 'estructura';
  if (normalized.includes('gris')) return 'obra gris';
  if (normalized.includes('termin')) return 'terminaciones';
  return null;
}

function isCompleted(value: string | null | undefined): boolean {
  if (!value) return false;
  const normalized = value.toLowerCase();
  if (COMPLETED_STATES.has(normalized)) return true;
  // estados como "finalizada" o "validada"
  if (normalized.endsWith('da')) {
    const trimmed = normalized.replace('da', 'do');
    if (COMPLETED_STATES.has(trimmed)) return true;
  }
  return false;
}

export function EtapasSection({ obraId, requireSelection = false }: EtapasSectionProps) {
  const currentUser = useCurrentUser();
  const supabase = useMemo(
    () => createClientComponentClient<Database>(),
    []
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tareas, setTareas] = useState<RawTarea[]>([]);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!currentUser?.orgId) {
        setTareas([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let obraIds: string[] = [];

        if (obraId) {
          obraIds = [obraId];
        } else {
          const { data: obrasData, error: obrasError } = await supabase
            .from('obras')
            .select('id')
            .eq('org_id', currentUser.orgId);

          if (obrasError) {
            throw obrasError;
          }

          obraIds = (obrasData ?? []).map((obra) => obra.id as string).filter(Boolean);
        }

        if (!obraIds.length) {
          if (!active) return;
          setTareas([]);
          setLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from('tareas')
          .select('*')
          .in('obra_id', obraIds);

        if (!active) return;

        if (fetchError) {
          throw fetchError;
        }

        const mapped = (data ?? []).map((row: RawTarea) => {
          const rawStage =
            row.etapa ??
            row.tipo ??
            row.category ??
            (row as any).stage ??
            row.fase ??
            null;

          return {
            id: row.id,
            etapa: rawStage ? String(rawStage) : null,
            estado: row.estado ?? null,
            obra_id: row.obra_id,
          } as RawTarea;
        });

        setTareas(mapped);
      } catch (err) {
        const errorMessage =
          err && typeof err === 'object' && 'message' in err
            ? (err as { message: string }).message
            : String(err);
        console.error('[EtapasSection] Error fetching tareas', errorMessage, err);
        if (!active) return;
        setError('No se pudieron obtener las tareas de esta obra.');
        setTareas([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [obraId, currentUser?.orgId, supabase]);

  const progressByStage: StageProgress[] = useMemo(() => {
    const base: Record<StageKey, StageProgress> = STAGE_DEFINITIONS.reduce(
      (acc, stage) => {
        acc[stage.key] = {
          ...stage,
          total: 0,
          completadas: 0,
        };
        return acc;
      },
      {} as Record<StageKey, StageProgress>
    );

    for (const tarea of tareas) {
      const key = normalizeStage(tarea.etapa);
      if (!key) continue;
      base[key].total += 1;
      if (isCompleted(tarea.estado)) {
        base[key].completadas += 1;
      }
    }

    return Object.values(base);
  }, [tareas]);

  if (!currentUser?.orgId) {
    return (
      <EmptyState
        title="Necesitás acceder con tu organización"
        description="Iniciá sesión nuevamente para ver el avance por etapas."
      />
    );
  }

  if (!obraId && requireSelection) {
    return (
      <EmptyState
        title="Seleccioná una obra"
        description="Elegí una obra activa para ver el avance por etapas."
      />
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[160px] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Cargando etapas…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border border-amber-200 bg-amber-50 text-amber-700">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-5 w-5" />
          <div>
            <h3 className="font-semibold">No pudimos cargar las etapas</h3>
            <p className="text-sm opacity-80">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  const noTasks = progressByStage.every((stage) => stage.total === 0);

  if (noTasks) {
    return (
      <EmptyState
        title="Todavía no cargaste tareas"
        description="Cuando registres tareas en esta obra vas a ver el progreso de cada etapa."
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {progressByStage.map((stage) => {
        const porcentaje = stage.total > 0 ? Math.round((stage.completadas / stage.total) * 100) : 0;

        return (
          <Card
            key={stage.key}
            className="rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
          >
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{stage.label}</h3>
                <p className="text-sm text-slate-500">{stage.description}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs uppercase text-slate-500">
                  <span>Avance</span>
                  <span className="text-sm font-semibold text-slate-700">{porcentaje}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: stage.surface }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${porcentaje}%`,
                      backgroundColor: stage.color,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{stage.completadas} completadas</span>
                  <span>{stage.total} tareas</span>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

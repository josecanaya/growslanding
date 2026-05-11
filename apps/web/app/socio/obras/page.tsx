'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Building, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/grows/Badge';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';
import type { Route } from 'next';
import {
  USE_MOCK_DATA,
  MOCK_OBRAS,
} from '@/lib/mocks/socioMockData';
import { STITCH_INNER, StitchH2Page } from '@/components/socio/stitch/socioStitchUi';
import { estadoPresupuestoEsAprobado } from '@/lib/domain/aprobacion-presupuesto-tarea';

interface ObraConPresupuesto {
  obra_id: string;
  obra_name: string;
  direccion_completa: string | null;
  fecha_inicio: string | null;
  presupuestos_aprobados: number;
  tareas_en_progreso: number;
}

export default function ObrasPage() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const supabase = createClientComponentClient<Database>();
  // Estado separado para obras (no compartido)
  const [obras, setObras] = useState<ObraConPresupuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchObras = async () => {
      setLoading(true);
      setError(null);

      try {
        if (USE_MOCK_DATA) {
          // Usar mocks
          const obrasFormateadas: ObraConPresupuesto[] = MOCK_OBRAS.map((mock) => ({
            obra_id: mock.obra_id,
            obra_name: mock.obra_name,
            direccion_completa: mock.direccion_completa,
            fecha_inicio: mock.fecha_inicio,
            presupuestos_aprobados: mock.presupuestos_aprobados,
            tareas_en_progreso: mock.tareas_en_progreso,
          }));

          // Ordenar: obras con más tareas en progreso primero
          const sorted = obrasFormateadas.sort((a, b) => b.tareas_en_progreso - a.tareas_en_progreso);

          setObras(sorted);
          setLoading(false);
          return;
        }

        // Usar datos reales
        if (!currentUser?.id || !currentUser?.orgId) {
          setLoading(false);
          return;
        }

        // Obtener socio_id
        const { data: socioData } = await (supabase as any)
          .from('socios')
          .select('id')
          .eq('org_id', currentUser.orgId)
          .or(`email.eq.${currentUser.email || ''},user_id.eq.${currentUser.id || ''}`)
          .maybeSingle();

        if (!socioData?.id) {
          setLoading(false);
          return;
        }

        // Obtener presupuestos aprobados del socio
        const { data: presupuestosRows, error: presupuestosError } = await (supabase as any)
          .from('tareas_presupuestos')
          .select(`
            estado,
            obra_id,
            tareas!inner(
              id,
              title,
              estado,
              obras!inner(
                id,
                name,
                address
              )
            )
          `)
          .eq('socio_id', socioData.id)
          .limit(800);

        if (presupuestosError) {
          throw new Error(presupuestosError.message);
        }

        const presupuestosAprobados = (presupuestosRows ?? []).filter((p: { estado?: string | null }) =>
          estadoPresupuestoEsAprobado(p.estado),
        );
        // Agrupar por obra
        const obrasMap = new Map<string, ObraConPresupuesto>();

        if (presupuestosAprobados) {
          for (const presupuesto of presupuestosAprobados) {
            const obraId = presupuesto.obra_id || presupuesto.tareas?.obras?.id;
            if (!obraId) continue;

            if (!obrasMap.has(obraId)) {
              obrasMap.set(obraId, {
                obra_id: obraId,
                obra_name: presupuesto.tareas?.obras?.name || 'Obra sin nombre',
                direccion_completa: presupuesto.tareas?.obras?.address || null,
                fecha_inicio: null,
                presupuestos_aprobados: 0,
                tareas_en_progreso: 0,
              });
            }

            const obra = obrasMap.get(obraId)!;
            obra.presupuestos_aprobados += 1;
          }
        }

        // Contar tareas en progreso por obra
        for (const obra of obrasMap.values()) {
          const { count } = await (supabase as any)
            .from('tareas')
            .select('*', { count: 'exact', head: true })
            .eq('org_id', currentUser.orgId)
            .eq('obra_id', obra.obra_id)
            .eq('responsable_socio_id', socioData.id)
            .eq('estado', 'en_progreso');

          obra.tareas_en_progreso = count || 0;
        }

          setObras(Array.from(obrasMap.values()));
      } catch (err: any) {
        setError(err.message || 'Error al cargar obras');
      } finally {
        setLoading(false);
      }
    };

    fetchObras();
  }, [currentUser?.id, currentUser?.orgId, currentUser?.email, supabase]);

  const formatFecha = (dateString: string | null) => {
    if (!dateString) return 'Fecha no definida';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleVerObra = (obraId: string) => {
    router.push(`/socio/presupuestos?obra_id=${obraId}` as Route);
  };

  if (loading) {
    return (
      <div className={STITCH_INNER}>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-stitch-primary" />
          <p className="ml-3 text-sm text-stitch-on-surface/70">Cargando obras…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={STITCH_INNER}>
        <div className="rounded-lg border border-red-200 bg-red-50/90 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={STITCH_INNER + ' space-y-6 font-stitch-body'}>
      <StitchH2Page
        kicker="Gestión de proyectos"
        title="Mis obras activas"
        description="Obras con presupuestos aprobados y tareas a tu cargo."
      />

      {obras.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stitch-outline/35 bg-stitch-surface-container-lowest p-8 text-center shadow-sm">
          <Building className="mx-auto mb-3 h-12 w-12 text-stitch-outline" />
          <p className="font-medium text-stitch-on-surface">No tenés obras activas</p>
          <p className="mt-1 text-sm text-stitch-on-surface/65">Cuando un presupuesto sea aprobado, aparecerá acá.</p>
          <Button
            onClick={() => router.push('/socio/presupuestos' as Route)}
            className="mt-4 bg-stitch-primary text-white hover:bg-stitch-primary-container"
          >
            Ver presupuestos
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {obras.map((obra) => (
            <div
              key={obra.obra_id}
              className="rounded-xl border border-stitch-surface-container bg-stitch-surface-container-lowest p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Building className="h-5 w-5 flex-shrink-0 text-stitch-primary" />
                    <h3 className="font-stitch-headline text-base font-bold text-stitch-on-surface">
                      {obra.obra_name}
                    </h3>
                  </div>
                  {obra.direccion_completa && (
                    <div className="flex items-center gap-2 text-sm text-stitch-on-surface/70">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span>{obra.direccion_completa}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant="success" size="sm">
                      {obra.presupuestos_aprobados} presupuesto{obra.presupuestos_aprobados !== 1 ? 's' : ''}{' '}
                      aprobado{obra.presupuestos_aprobados !== 1 ? 's' : ''}
                    </Badge>
                    {obra.tareas_en_progreso > 0 && (
                      <Badge variant="info" size="sm">
                        {obra.tareas_en_progreso} tarea{obra.tareas_en_progreso !== 1 ? 's' : ''} en curso
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => handleVerObra(obra.obra_id)}
                  variant="outline"
                  className="flex flex-shrink-0 items-center gap-1 border-stitch-surface-container text-stitch-primary"
                >
                  Ver
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


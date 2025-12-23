'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import type { Database } from '@/lib/types/supabase.gen';
import {
  USE_MOCK_DATA,
  MOCK_TRABAJO_ACTIVO,
  MOCK_TRABAJO_SIN_ACTIVO,
  type MockTrabajoActual,
} from '@/lib/mocks/socioMockData';

// Escenario: false = sin trabajo activo, true = con trabajo activo
const MOCK_TRABAJO_ACTIVO_SCENARIO = false; // Cambiar a true para simular trabajo activo

export function HomeTrabajoActualSection() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const supabase = createClientComponentClient<Database>();
  // Estado separado para trabajo actual (no compartido)
  const [trabajoActual, setTrabajoActual] = useState<{
    obra_name: string | null;
    tarea_title: string | null;
    subtarea_orden: number | null;
    bloque_actual?: number;
    bloques_totales?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrabajoActual = async () => {
      if (USE_MOCK_DATA) {
        // Usar mocks
        const mockTrabajo = MOCK_TRABAJO_ACTIVO_SCENARIO
          ? MOCK_TRABAJO_ACTIVO
          : MOCK_TRABAJO_SIN_ACTIVO;

        if (mockTrabajo.estado === 'EN_PROGRESO') {
          setTrabajoActual({
            obra_name: mockTrabajo.obra_name,
            tarea_title: mockTrabajo.tarea_title,
            subtarea_orden: mockTrabajo.subtarea_orden,
            bloque_actual: mockTrabajo.bloque_actual,
            bloques_totales: mockTrabajo.bloques_totales,
          });
        } else {
          setTrabajoActual(null);
        }
        setLoading(false);
        return;
      }

      // Usar datos reales
      if (!currentUser?.id || !currentUser?.orgId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // Buscar tareas en progreso del socio
        const { data: tareasData } = await (supabase as any)
          .from('tareas')
          .select(`
            id,
            title,
            estado,
            obras (
              id,
              name
            )
          `)
          .eq('org_id', currentUser.orgId)
          .eq('responsable', currentUser.id)
          .eq('estado', 'en_progreso')
          .limit(1);

        if (tareasData && tareasData.length > 0) {
          const tarea = tareasData[0];
          
          // Buscar subtarea en progreso
          const { data: subtareasData } = await (supabase as any)
            .from('tareas_subtareas')
            .select('id, orden, estado')
            .eq('tarea_id', tarea.id)
            .eq('estado', 'en_progreso')
            .order('orden', { ascending: true })
            .limit(1);

          setTrabajoActual({
            obra_name: tarea.obras?.name || null,
            tarea_title: tarea.title || null,
            subtarea_orden: subtareasData && subtareasData.length > 0 ? subtareasData[0].orden : null,
          });
        } else {
          setTrabajoActual(null);
        }
      } catch (error) {
        setTrabajoActual(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTrabajoActual();
  }, [currentUser?.id, currentUser?.orgId, supabase]);

  if (loading) {
    return null; // No mostrar skeleton, se carga rápido
  }

  if (!trabajoActual) {
    return null; // Ocultar sección si no hay trabajo activo
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          Trabajo actual
        </h2>
        <p className="text-sm text-gray-600">
          Tu trabajo en curso
        </p>
      </div>

      <Card className="border border-[#276EF1] shadow-sm bg-blue-50/50">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#276EF1] flex items-center justify-center flex-shrink-0">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 space-y-1">
              {trabajoActual.obra_name && (
                <p className="font-semibold text-gray-900">
                  {trabajoActual.obra_name}
                </p>
              )}
              {trabajoActual.tarea_title && (
                <p className="text-sm text-gray-700">
                  {trabajoActual.tarea_title}
                </p>
              )}
              {trabajoActual.subtarea_orden !== null && (
                <p className="text-xs text-gray-600">
                  Bloque {trabajoActual.subtarea_orden}
                  {trabajoActual.bloques_totales && ` de ${trabajoActual.bloques_totales}`}
                </p>
              )}
            </div>
          </div>

          <Button
            onClick={() => router.push('/socio/ahora')}
            className="w-full bg-[#276EF1] hover:bg-[#1E56D9] text-white"
            size="default"
          >
            Continuar trabajando
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

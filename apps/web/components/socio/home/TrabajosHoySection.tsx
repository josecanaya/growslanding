'use client';

import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Clock, CheckCircle2 } from 'lucide-react';
import { USE_MOCK_DATA } from '@/lib/mocks/socioMockData';

// Mock data para trabajos de hoy
const MOCK_TRABAJOS_HOY = [
  {
    id: 'trabajo-1',
    obra_name: 'Obra San Martín 325',
    tarea_title: 'Revoque exterior',
    bloque_actual: 3,
    bloques_totales: 12,
    estado: 'en_progreso',
    tiempo_estimado: '4 horas',
  },
];

export function TrabajosHoySection() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const supabase = createClientComponentClient<Database>();
  const [trabajos, setTrabajos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarTrabajos = async () => {
      if (USE_MOCK_DATA) {
        // Usar mock data
        setTrabajos(MOCK_TRABAJOS_HOY);
        setLoading(false);
        return;
      }

      if (!currentUser?.id || !currentUser?.orgId) {
        setTrabajos([]);
        setLoading(false);
        return;
      }

      try {
        // Obtener socio_id
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

        // Buscar tareas en progreso del socio
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
              estado
            )
          `)
          .eq('org_id', currentUser.orgId)
          .eq('responsable_socio_id', socioData.id)
          .eq('estado', 'en_progreso')
          .limit(3);

        if (tareasData && tareasData.length > 0) {
          const trabajosFormateados = tareasData.map((tarea: any) => {
            const subtareas = tarea.tareas_subtareas || [];
            const subtareaEnProgreso = subtareas.find((st: any) => st.estado === 'en_progreso');
            
            return {
              id: tarea.id,
              obra_name: tarea.obras?.name || 'Obra sin nombre',
              tarea_title: tarea.title || 'Tarea sin título',
              bloque_actual: subtareaEnProgreso?.orden || 1,
              bloques_totales: subtareas.length || 1,
              estado: tarea.estado,
            };
          });

          setTrabajos(trabajosFormateados);
        } else {
          setTrabajos([]);
        }
      } catch (error) {
        setTrabajos([]);
      } finally {
        setLoading(false);
      }
    };

    cargarTrabajos();
  }, [currentUser?.id, currentUser?.orgId, currentUser?.email, supabase]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">Trabajos para hoy</h2>
        </div>
        <Card className="border-2 border-green-300 bg-green-50">
          <CardContent className="p-4">
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determinar qué trabajos mostrar
  const trabajosAMostrar = trabajos.length > 0 ? trabajos : (USE_MOCK_DATA ? MOCK_TRABAJOS_HOY : []);
  
  if (trabajosAMostrar.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 opacity-0 animate-[fadeIn_0.5s_ease-in-out_forwards]">
      {/* Título con ícono */}
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-green-600" />
        <h2 className="text-lg font-semibold text-gray-900">Trabajos para hoy</h2>
      </div>
      
      {/* Card verde suave con animación */}
      <div className="space-y-3">
        {trabajosAMostrar.map((trabajo) => (
          <Card 
            key={trabajo.id} 
            className="border-2 border-green-300 bg-green-50 shadow-sm opacity-0 animate-[fadeInSlide_0.4s_ease-out_0.1s_forwards]"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">
                    {trabajo.obra_name}
                  </h3>
                  <p className="text-xs text-gray-600 mb-2">
                    {trabajo.tarea_title}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Bloque {trabajo.bloque_actual} de {trabajo.bloques_totales}</span>
                    </div>
                    {trabajo.tiempo_estimado && (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{trabajo.tiempo_estimado}</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => router.push('/socio/ahora')}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white text-xs h-9 px-4 shadow-md"
                >
                  <Play className="h-4 w-4 mr-1.5" fill="currentColor" />
                  Continuar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


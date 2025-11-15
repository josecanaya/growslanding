'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { GaleriaEvidencias } from '@/components/socio/evidencias/GaleriaEvidencias';
import { fetchEvidenciasPorSocioYObraCliente } from '@/lib/services/evidencias';
import type { Evidencia } from '@/lib/services/evidencias';

export default function EvidenciasPage() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const supabase = createClientComponentClient();
  const [evidencias, setEvidencias] = useState<Evidencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [obraId, setObraId] = useState<string | null>(null);
  const [obraNombre, setObraNombre] = useState<string>('');

  useEffect(() => {
    const cargarEvidencias = async () => {
      if (!currentUser?.email) {
        console.log('[EVIDENCIAS] Esperando usuario...');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Obtener obra_id desde las tareas del socio
        // Usar el mismo método que TareasEnCurso: buscar por responsable de forma flexible
        let obraId: string | null = null;
        let obraNombre: string = '';

        // Primero intentar obtener el socio para tener más información
        const { data: socioData } = await supabase
          .from('socios')
          .select('id, nombre, email, telefono, org_id')
          .eq('email', currentUser.email)
          .maybeSingle();

        console.log('[EVIDENCIAS] Socio encontrado:', socioData);

        // Construir filtros flexibles como en el endpoint /api/socios/[id]/tareas
        const filtros: string[] = [];
        if (currentUser.email) {
          filtros.push(`responsable.eq.${currentUser.email}`);
          filtros.push(`responsable.ilike.%${currentUser.email}%`);
        }
        if (socioData?.telefono) {
          filtros.push(`responsable.eq.${socioData.telefono}`);
        }
        if (socioData?.nombre) {
          filtros.push(`responsable.ilike.%${socioData.nombre}%`);
        }

        // Buscar tareas del socio por responsable (búsqueda flexible)
        let tareasQuery = supabase
          .from('tareas')
          .select('obra_id, obra:obras(id, name)')
          .limit(10); // Obtener varias para encontrar la obra

        if (filtros.length > 0) {
          tareasQuery = tareasQuery.or(filtros.join(','));
        } else {
          // Si no hay filtros, buscar por email directamente
          tareasQuery = tareasQuery.eq('responsable', currentUser.email);
        }

        const { data: tareasData, error: tareasError } = await tareasQuery;

        if (tareasError) {
          console.error('[EVIDENCIAS] Error al obtener tareas:', tareasError);
        } else if (tareasData && tareasData.length > 0) {
          // Tomar la primera tarea que tenga obra_id
          const tareaConObra = tareasData.find((t: any) => t.obra_id);
          if (tareaConObra) {
            const obra = tareaConObra.obra as any;
            obraId = tareaConObra.obra_id;
            obraNombre = obra?.name || 'Obra actual';
          }
        }

        // Si aún no encontramos obra, buscar desde eventos (donde se subieron las evidencias)
        if (!obraId) {
          console.log('[EVIDENCIAS] Buscando obra desde eventos...');
          const { data: eventosData } = await supabase
            .from('eventos')
            .select('tarea:tareas!inner(obra_id, obra:obras(id, name))')
            .ilike('actor_name', `%${currentUser.email}%`)
            .limit(5);

          if (eventosData && eventosData.length > 0) {
            const eventoConObra = eventosData.find((e: any) => e.tarea?.obra_id);
            if (eventoConObra) {
              const tarea = eventoConObra.tarea as any;
              obraId = tarea.obra_id;
              const obra = tarea.obra as any;
              obraNombre = obra?.name || 'Obra actual';
            }
          }
        }

        if (!obraId) {
          console.warn('[EVIDENCIAS] No se encontró obra para el socio');
          setLoading(false);
          return;
        }

        setObraId(obraId);
        setObraNombre(obraNombre);

        console.log('[EVIDENCIAS] Obra encontrada:', { obraId, obraNombre });

        // Obtener evidencias
        const evidenciasData = await fetchEvidenciasPorSocioYObraCliente(
          obraId,
          currentUser.email,
          supabase
        );

        console.log('[EVIDENCIAS] Evidencias obtenidas:', evidenciasData.length);
        setEvidencias(evidenciasData);
      } catch (error) {
        console.error('[EVIDENCIAS] Error al cargar evidencias:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarEvidencias();
  }, [currentUser, supabase]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-6 w-6 text-gray-700" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Evidencias</h1>
                {obraNombre && (
                  <p className="text-sm text-gray-600 mt-1">{obraNombre}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <ImageIcon className="h-5 w-5" />
              <span>{evidencias.length} {evidencias.length === 1 ? 'evidencia' : 'evidencias'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <GaleriaEvidencias evidencias={evidencias} loading={loading} />
      </div>
    </div>
  );
}


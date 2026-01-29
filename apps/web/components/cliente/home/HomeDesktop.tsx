'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';
import { QuickActionsRow } from './QuickActionsRow';
import { ObraActivaCard } from './ObraActivaCard';
import { PeriodSelectorGlobal } from './PeriodSelectorGlobal';
import { CardResumenTareas } from './CardResumenTareas';
import { CardResumenEscrow } from './CardResumenEscrow';
import { Dialog } from '@/components/ui/dialog';

interface Obra {
  id: string;
  name: string;
  estado: string;
}

export function HomeDesktop() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const supabase = createClientComponentClient<Database>();
  const [obras, setObras] = useState<Obra[]>([]);
  const [obraSeleccionada, setObraSeleccionada] = useState<string | null>(null);
  const [isObraDialogOpen, setIsObraDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [periodRange, setPeriodRange] = useState(8);
  
  // Datos de resumen (placeholder - se cargarán con datos reales cuando estén disponibles)
  const [tareasPendientes, setTareasPendientes] = useState(0);
  const [tareasVencidas, setTareasVencidas] = useState(0);
  const [tareasProximas7d, setTareasProximas7d] = useState(0);
  const [presupuestoEjecutado, setPresupuestoEjecutado] = useState(0);
  const [presupuestoAprobado, setPresupuestoAprobado] = useState(0);
  const [semanasSinEjecucion, setSemanasSinEjecucion] = useState(0);

  useEffect(() => {
    if (!currentUser?.orgId) {
      setLoading(false);
      return;
    }

    const loadObras = async () => {
      try {
        if (!currentUser?.orgId) return;
        
        const { data, error } = await supabase
          .from('obras')
          .select('id, name, estado')
          .eq('org_id', currentUser.orgId)
          .order('updated_at', { ascending: false });

        if (error) throw error;
        
        const obrasData = ((data || []) as Array<{ id: string; name: string | null; estado: string | null }>).map(o => ({
          id: o.id,
          name: o.name || 'Sin nombre',
          estado: o.estado || 'ACTIVA',
        }));
        
        setObras(obrasData);
        
        // Seleccionar primera obra por defecto si no hay ninguna seleccionada
        if (obrasData.length > 0 && !obraSeleccionada) {
          setObraSeleccionada(obrasData[0].id);
        }
      } catch (error) {
        console.error('Error cargando obras:', error);
      } finally {
        setLoading(false);
      }
    };

    loadObras();
  }, [currentUser?.orgId, supabase]);

  const obraActual = useMemo(
    () => obras.find((o) => o.id === obraSeleccionada) || null,
    [obras, obraSeleccionada]
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleObraClick = () => {
    if (obraSeleccionada) {
      router.push(`/cliente/obras?obraId=${obraSeleccionada}` as Route);
    }
  };

  // Calcular semanas totales (placeholder - se calculará con datos reales)
  const totalSemanas = 26; // Placeholder

  // Datos para las cards (placeholder - se cargarán con datos reales)
  const completadasUltimos7d = [0, 0, 0, 0, 0, 0, 0]; // Placeholder
  const avance = 0; // Placeholder

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="space-y-6">
          {/* Obra Activa */}
          {!loading && obraActual && (
            <div onClick={handleObraClick} className="cursor-pointer">
              <ObraActivaCard
                obra={obraActual}
                tareasEstaSemana={tareasPendientes}
                presupuestoEstaSemana={presupuestoEjecutado}
                avance={avance}
                formatCurrency={formatCurrency}
                onCambiarObra={() => {
                  setIsObraDialogOpen(true);
                }}
              />
            </div>
          )}

          {loading && (
            <div className="bg-white rounded-2xl p-6 border border-gray-200/70 shadow-sm animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-5 bg-gray-200 rounded w-1/2" />
            </div>
          )}

          {/* Quick Actions Row */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200/70 shadow-sm">
            <QuickActionsRow obraId={obraSeleccionada} />
          </div>

          {/* Selector de período global */}
          {!loading && obraActual && (
            <div className="bg-white rounded-2xl p-6 border border-gray-200/70 shadow-sm">
              <PeriodSelectorGlobal
                periodRange={periodRange}
                totalSemanas={totalSemanas}
                onPeriodChange={setPeriodRange}
              />
            </div>
          )}

          {/* Resumen operativo */}
          {!loading && obraActual && (
            <div className="grid grid-cols-2 gap-6">
              <CardResumenTareas
                obraId={obraSeleccionada}
                tareasPendientes={tareasPendientes}
                tareasVencidas={tareasVencidas}
                tareasProximas7d={tareasProximas7d}
                completadasUltimos7d={completadasUltimos7d}
              />
              <CardResumenEscrow
                ejecutado={presupuestoEjecutado}
                aprobado={presupuestoAprobado}
                semanasSinEjecucion={semanasSinEjecucion}
                formatCurrency={formatCurrency}
              />
            </div>
          )}

          {/* Empty state: Sin obra activa */}
          {!loading && !obraActual && obras.length === 0 && (
            <div className="bg-white rounded-2xl p-12 border border-gray-200/70 shadow-sm text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Crear tu primera obra
              </h3>
              <p className="text-base text-gray-500 mb-8 max-w-md mx-auto">
                Comienza creando una nueva obra para gestionar tu proyecto
              </p>
              <button
                onClick={() => router.push('/cliente/obras/nueva' as Route)}
                className="px-8 py-3 bg-blue-600 text-white text-base font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Crear obra
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal para cambiar obra (en desktop) - simple overlay */}
      {isObraDialogOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsObraDialogOpen(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Seleccionar obra</h3>
              <button
                onClick={() => setIsObraDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {obras.map((obra) => (
                <button
                  key={obra.id}
                  onClick={() => {
                    setObraSeleccionada(obra.id);
                    setIsObraDialogOpen(false);
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    obraSeleccionada === obra.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-gray-900">{obra.name}</div>
                  <div className="text-sm text-gray-500">{obra.estado}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

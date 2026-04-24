'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
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

// Mocks fijos (desconectado de la base de datos) — mismo criterio que /cliente y HomeMobile
const OBRAS_MOCK: Obra[] = [
  { id: 'demo-obra-1-casa-familiar', name: 'Casa familiar – Juan Pérez', estado: 'En ejecución' },
  { id: 'demo-obra-2-reforma-bano', name: 'Reforma Baño – María González', estado: 'Pendiente' },
  { id: 'demo-obra-3-ampliacion-cocina', name: 'Ampliación Cocina – Carlos López', estado: 'Creada' },
];

const MOCK_CASA_FAMILIAR = {
  tareasEstaSemana: 8,
  presupuestoEstaSemana: 32000,
  avance: 85,
  tareasPendientes: 8,
  tareasVencidas: 3,
  tareasProximas7d: 9,
  presupuestoEjecutado: 350000,
  presupuestoAprobado: 600000,
  semanasSinEjecucion: 0,
  completadasUltimos7d: [1, 2, 2, 3, 2, 2, 2] as number[],
};

export function HomeDesktop() {
  const router = useRouter();
  const [obras, setObras] = useState<Obra[]>(OBRAS_MOCK);
  const [obraSeleccionada, setObraSeleccionada] = useState<string | null>(OBRAS_MOCK[0].id);
  const [isObraDialogOpen, setIsObraDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [periodRange, setPeriodRange] = useState(8);

  useEffect(() => {
    setLoading(false);
  }, []);

  const obraActual = useMemo(
    () => obras.find((o) => o.id === obraSeleccionada) || obras[0] || null,
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

  const totalSemanas = 26;
  const isCasaFamiliar = obraSeleccionada === OBRAS_MOCK[0].id;
  const tareasPendientes = isCasaFamiliar ? MOCK_CASA_FAMILIAR.tareasPendientes : 0;
  const tareasVencidas = isCasaFamiliar ? MOCK_CASA_FAMILIAR.tareasVencidas : 0;
  const tareasProximas7d = isCasaFamiliar ? MOCK_CASA_FAMILIAR.tareasProximas7d : 0;
  const presupuestoEjecutado = isCasaFamiliar ? MOCK_CASA_FAMILIAR.presupuestoEjecutado : 0;
  const presupuestoAprobado = isCasaFamiliar ? MOCK_CASA_FAMILIAR.presupuestoAprobado : 0;
  const semanasSinEjecucion = isCasaFamiliar ? MOCK_CASA_FAMILIAR.semanasSinEjecucion : 0;
  const completadasUltimos7d = isCasaFamiliar ? MOCK_CASA_FAMILIAR.completadasUltimos7d : [0, 0, 0, 0, 0, 0, 0];
  const tareasEstaSemana = isCasaFamiliar ? MOCK_CASA_FAMILIAR.tareasEstaSemana : 0;
  const presupuestoEstaSemana = isCasaFamiliar ? MOCK_CASA_FAMILIAR.presupuestoEstaSemana : 0;
  const avance = isCasaFamiliar ? MOCK_CASA_FAMILIAR.avance : 0;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="space-y-6">
          {/* Obra Activa */}
          {!loading && obraActual && (
            <div onClick={handleObraClick} className="cursor-pointer">
              <ObraActivaCard
                obra={obraActual}
                tareasEstaSemana={tareasEstaSemana}
                presupuestoEstaSemana={presupuestoEstaSemana}
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

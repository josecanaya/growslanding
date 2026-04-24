'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useDeviceType } from '@/lib/hooks/useDeviceType';
import { QuickActionsRow } from './QuickActionsRow';
import { ObraActivaCard } from './ObraActivaCard';
import { BottomSheetObras } from './BottomSheetObras';
import { PeriodSelectorGlobal } from './PeriodSelectorGlobal';
import { CardResumenTareas } from './CardResumenTareas';
import { CardResumenEscrow } from './CardResumenEscrow';

interface Obra {
  id: string;
  name: string;
  estado: string;
}

// Mocks fijos (desconectado de la base de datos) — mismo criterio que /cliente y dashboard
const OBRAS_MOCK: Obra[] = [
  { id: 'demo-obra-1-casa-familiar', name: 'Casa familiar – Juan Pérez', estado: 'En ejecución' },
  { id: 'demo-obra-2-reforma-bano', name: 'Reforma Baño – María González', estado: 'Pendiente' },
  { id: 'demo-obra-3-ampliacion-cocina', name: 'Ampliación Cocina – Carlos López', estado: 'Creada' },
];

// Datos realistas para Casa Familiar (demo)
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

export function HomeMobile() {
  const deviceType = useDeviceType();
  const router = useRouter();
  const [obras, setObras] = useState<Obra[]>(OBRAS_MOCK);
  const [obraSeleccionada, setObraSeleccionada] = useState<string | null>(OBRAS_MOCK[0].id);
  const [isObraSheetOpen, setIsObraSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [periodRange, setPeriodRange] = useState(8);

  // Solo mostrar en mobile
  if (deviceType !== 'mobile') {
    return null;
  }

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
    <div className="space-y-3 pb-4 bg-gray-50 min-h-screen pt-4">
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
              setIsObraSheetOpen(true);
            }}
          />
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-2xl p-3.5 border border-gray-200/70 shadow-sm animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      )}

      {/* Quick Actions Row */}
      <QuickActionsRow obraId={obraSeleccionada} />

      {/* Selector de período global */}
      {!loading && obraActual && (
        <PeriodSelectorGlobal
          periodRange={periodRange}
          totalSemanas={totalSemanas}
          onPeriodChange={setPeriodRange}
        />
      )}

      {/* Resumen operativo */}
      {!loading && obraActual && (
        <div className="grid grid-cols-2 gap-3">
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
        <div className="bg-white rounded-2xl p-6 border border-gray-200/70 shadow-sm text-center">
          <h3 className="text-base font-semibold text-gray-900 mb-2">
            Crear tu primera obra
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Comienza creando una nueva obra para gestionar tu proyecto
          </p>
          <button
            onClick={() => router.push('/cliente/obras/nueva' as Route)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Crear obra
          </button>
        </div>
      )}

      {/* Bottom Sheet Obras */}
      <BottomSheetObras
        isOpen={isObraSheetOpen}
        onClose={() => setIsObraSheetOpen(false)}
        obras={obras}
        obraSeleccionada={obraSeleccionada || ''}
        onSelectObra={setObraSeleccionada}
      />
    </div>
  );
}


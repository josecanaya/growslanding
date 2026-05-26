'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { QuickActionsRow } from './QuickActionsRow';
import { ObraActivaCard } from './ObraActivaCard';
import { PeriodSelectorGlobal } from './PeriodSelectorGlobal';
import { CardResumenTareas } from './CardResumenTareas';
import { CardResumenEscrow } from './CardResumenEscrow';
import { useClienteObras, type ClienteObraListaItem } from '@/lib/hooks/useClienteObras';
import { useClienteObraTareasResumen } from '@/lib/hooks/useClienteObraTareasResumen';

interface ObraCardModel {
  id: string;
  name: string;
  estado: string;
}

function toObraCardModel(o: ClienteObraListaItem): ObraCardModel {
  return {
    id: o.id,
    name: o.name?.trim() ? o.name : 'Sin nombre',
    estado: (o.estado || 'PENDIENTE').trim(),
  };
}

export function HomeDesktop() {
  const router = useRouter();
  const { obras, loading: obrasLoading, error: obrasError } = useClienteObras();
  const [obraSeleccionada, setObraSeleccionada] = useState<string | null>(null);
  const [isObraDialogOpen, setIsObraDialogOpen] = useState(false);
  const [periodRange, setPeriodRange] = useState(8);

  useEffect(() => {
    if (obrasLoading) return;
    if (obras.length === 0) {
      setObraSeleccionada(null);
      return;
    }
    setObraSeleccionada((prev) => {
      if (prev && obras.some((o) => o.id === prev)) return prev;
      return obras[0].id;
    });
  }, [obras, obrasLoading]);

  const obraRow = useMemo(
    () => (obraSeleccionada ? obras.find((o) => o.id === obraSeleccionada) : undefined),
    [obras, obraSeleccionada],
  );

  const { loading: tareasLoading, error: tareasError, kpis } = useClienteObraTareasResumen(
    obraRow?.id ?? null,
    obraRow?.orgId ?? null,
  );

  const obraActual = obraRow ? toObraCardModel(obraRow) : null;
  const obrasCardModels = useMemo(() => obras.map(toObraCardModel), [obras]);

  const loading = obrasLoading;

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
  const tareasPendientes = kpis.desktop.tareasPendientes;
  const tareasVencidas = kpis.desktop.tareasVencidas;
  const tareasProximas7d = kpis.desktop.tareasProximas7d;
  const presupuestoEjecutado = 0;
  const presupuestoAprobado = 0;
  const semanasSinEjecucion = 0;
  const completadasUltimos7d = kpis.desktop.completadasUltimos7d;
  const tareasEstaSemana = kpis.tareasEstaSemana;
  const presupuestoEstaSemana = 0;
  const avance = kpis.avancePct;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="space-y-6">
          {obrasError && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {obrasError}
            </p>
          )}
          {tareasError && obraActual && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              {tareasError}
            </p>
          )}

          {/* Obra Activa */}
          {!loading && obraActual && (
            <div onClick={handleObraClick} className="cursor-pointer">
              <ObraActivaCard
                obra={obraActual}
                tareasEstaSemana={tareasLoading ? 0 : tareasEstaSemana}
                presupuestoEstaSemana={presupuestoEstaSemana}
                avance={tareasLoading ? 0 : avance}
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
                tareasPendientes={tareasLoading ? 0 : tareasPendientes}
                tareasVencidas={tareasLoading ? 0 : tareasVencidas}
                tareasProximas7d={tareasLoading ? 0 : tareasProximas7d}
                completadasUltimos7d={tareasLoading ? [] : completadasUltimos7d}
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
          {!loading && !obraActual && obras.length === 0 && !obrasError && (
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
              {obrasCardModels.map((obra) => (
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

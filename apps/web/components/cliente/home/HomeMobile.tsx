'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useDeviceType } from '@/lib/hooks/useDeviceType';
import { QuickActionsRow } from './QuickActionsRow';
import { ObraActivaCard } from './ObraActivaCard';
import { BottomSheetObras } from './BottomSheetObras';
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

export function HomeMobile() {
  const deviceType = useDeviceType();
  const router = useRouter();
  const { obras, loading: obrasLoading, error: obrasError } = useClienteObras();
  const [obraSeleccionada, setObraSeleccionada] = useState<string | null>(null);
  const [isObraSheetOpen, setIsObraSheetOpen] = useState(false);
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

  const obrasCards = useMemo(() => obras.map(toObraCardModel), [obras]);

  if (deviceType !== 'mobile') {
    return null;
  }

  const obraActual = obraRow ? toObraCardModel(obraRow) : null;

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
  const loading = obrasLoading;

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
    <div className="space-y-3 pb-4 bg-gray-50 min-h-screen pt-4">
      {obrasError && (
        <p className="mx-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {obrasError}
        </p>
      )}
      {tareasError && obraActual && (
        <p className="mx-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
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

      <QuickActionsRow obraId={obraSeleccionada} />

      {!loading && obraActual && (
        <PeriodSelectorGlobal
          periodRange={periodRange}
          totalSemanas={totalSemanas}
          onPeriodChange={setPeriodRange}
        />
      )}

      {!loading && obraActual && (
        <div className="grid grid-cols-2 gap-3">
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

      {!loading && !obraActual && obras.length === 0 && !obrasError && (
        <div className="bg-white rounded-2xl p-6 border border-gray-200/70 shadow-sm text-center">
            <h3 className="text-base font-semibold text-gray-900 mb-2">
              Empezá desde una idea
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Un nodo IDEA y el grafo de transformaciones.
            </p>
            <button
              onClick={() => router.push('/cliente/proyectos/nuevo' as Route)}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Crear proyecto
            </button>
        </div>
      )}

      <BottomSheetObras
        isOpen={isObraSheetOpen}
        onClose={() => setIsObraSheetOpen(false)}
        obras={obrasCards}
        obraSeleccionada={obraSeleccionada || ''}
        onSelectObra={setObraSeleccionada}
      />
    </div>
  );
}

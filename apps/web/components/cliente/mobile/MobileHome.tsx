'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useDeviceType } from '@/lib/hooks/useDeviceType';
import { GlobalPeriodSelector } from './GlobalPeriodSelector';
import { ObrasCarousel } from './ObrasCarousel';
import { QuickActionsGrid } from './QuickActionsGrid';
import { CardTareasCompact } from './CardTareasCompact';
import { CardPresupuestoEscrow } from './CardPresupuestoEscrow';
import { CardActividadPreview } from './CardActividadPreview';
import { ModalActividadDetalle } from './ModalActividadDetalle';
import { useClienteObras, type ClienteObraListaItem } from '@/lib/hooks/useClienteObras';
import { useClienteObraTareasResumen } from '@/lib/hooks/useClienteObraTareasResumen';

function obraToCarousel(o: ClienteObraListaItem) {
  return {
    id: o.id,
    name: o.name?.trim() ? o.name : 'Sin nombre',
    estado: (o.estado || 'PENDIENTE').toUpperCase(),
  };
}

export function MobileHome() {
  const deviceType = useDeviceType();
  const router = useRouter();
  const [periodRange, setPeriodRange] = useState<number>(8);
  const [obraSeleccionada, setObraSeleccionada] = useState<string>('');
  const [isActividadModalOpen, setIsActividadModalOpen] = useState(false);

  const { obras, loading: obrasLoading, error: obrasError } = useClienteObras();

  useEffect(() => {
    if (obrasLoading) return;
    if (obras.length === 0) {
      setObraSeleccionada('');
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

  const obrasCarousel = useMemo(() => obras.map(obraToCarousel), [obras]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleVerTodasObras = () => {
    router.push('/cliente/dashboard?section=obras' as Route);
  };

  const handleVerTareas = () => {
    router.push(`/cliente/dashboard?section=tareas&obra=${obraSeleccionada}` as Route);
  };

  const handleVerPresupuesto = () => {
    router.push('/cliente/billetera' as Route);
  };

  if (deviceType !== 'mobile') {
    return null;
  }

  if (obrasLoading) {
    return (
      <div className="space-y-4 pb-4 px-4 pt-4 min-h-screen">
        <div className="animate-pulse h-28 bg-white rounded-xl border border-gray-200" />
        <div className="animate-pulse h-24 bg-white rounded-xl border border-gray-200" />
      </div>
    );
  }

  if (obras.length === 0) {
    return (
      <div className="space-y-4 pb-4 px-4 pt-4 bg-gray-50 min-h-screen">
        {obrasError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {obrasError}
          </p>
        ) : (
          <div className="bg-white rounded-2xl p-8 border border-gray-200/70 shadow-sm text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin obras aún</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
              Creá tu primera obra para ver el resumen en esta pantalla.
            </p>
            <button
              type="button"
              onClick={() => router.push('/cliente/obras/nueva' as Route)}
              className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Crear obra
            </button>
          </div>
        )}
      </div>
    );
  }

  const m = kpis.mobile;
  const tareasCards = tareasLoading
    ? { ...m.tareas, enCurso: 0, paraValidar: 0, completadas: 0, bloqueadas: 0, total: 0, vencidas: 0, proximas7d: 0, ritmoPromedio: 0 }
    : m.tareas;

  const totalSemanas = Math.max(
    8,
    m.weeklyCompleted.length || 0,
    m.actividad.tareasCompletadasPorSemana.length || 0,
    22,
  );

  return (
    <div className="space-y-4 pb-4">
      {obrasError && (
        <p className="mx-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {obrasError}
        </p>
      )}
      {tareasError && (
        <p className="mx-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {tareasError}
        </p>
      )}

      <div className="sticky top-14 z-40 -mx-4 px-4 pt-2 pb-2 bg-white border-b border-gray-200 mb-4">
        <GlobalPeriodSelector
          periodRange={periodRange}
          totalSemanas={totalSemanas}
          onPeriodChange={setPeriodRange}
        />
      </div>

      <div className="space-y-4">
        <ObrasCarousel
          obras={obrasCarousel}
          obraSeleccionada={obraSeleccionada}
          onObraSelect={setObraSeleccionada}
          onVerTodas={handleVerTodasObras}
        />

        <QuickActionsGrid router={router} />

        <div className="grid grid-cols-2 gap-3">
          <CardTareasCompact tareas={tareasCards} periodRange={periodRange} onVerTareas={handleVerTareas} />
          <CardPresupuestoEscrow
            presupuesto={m.presupuesto}
            presupuestoSemanal={m.presupuestoSemanal}
            periodRange={periodRange}
            formatCurrency={formatCurrency}
            onVerDetalle={handleVerPresupuesto}
          />
        </div>

        <CardActividadPreview
          actividad={m.actividad}
          periodRange={periodRange}
          onVerActividad={() => setIsActividadModalOpen(true)}
        />

        <ModalActividadDetalle
          isOpen={isActividadModalOpen}
          onClose={() => setIsActividadModalOpen(false)}
          actividad={m.actividad}
          periodRange={periodRange}
          onPeriodChange={setPeriodRange}
          onVerTareasSemana={(semana) => {
            router.push(
              `/cliente/dashboard?section=tareas&obra=${obraSeleccionada}&semana=${semana}` as Route,
            );
          }}
        />
      </div>
    </div>
  );
}

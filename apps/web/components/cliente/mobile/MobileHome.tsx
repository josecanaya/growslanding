'use client';

import { useState, useMemo } from 'react';
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

// Datos mock para 3 obras
const MOCK_OBRAS = [
  {
    id: '1',
    name: 'Casa familiar – Aquiles Bailo',
    estado: 'ACTIVA',
    tareas: {
      enCurso: 8,
      paraValidar: 2,
      completadas: 58,
      bloqueadas: 0,
      total: 68,
      vencidas: 3,
      proximas7d: 9,
      ritmoPromedio: 3.1,
      weeklyCompleted: [0, 1, 2, 2, 3, 1, 4, 2, 3, 2, 4, 3, 2, 3, 4, 2, 3, 4, 2, 3, 2, 2, 1, 0],
      last2WeeksCompleted: 3,
      prev2WeeksCompleted: 2,
    },
    presupuesto: { presupuestado: 600000, ejecutado: 350000 },
    presupuestoSemanal: [
      { semana: 1, proyectado: 20000, ejecutado: 18000 },
      { semana: 2, proyectado: 25000, ejecutado: 22000 },
      { semana: 3, proyectado: 28000, ejecutado: 27000 },
      { semana: 4, proyectado: 30000, ejecutado: 29000 },
      { semana: 5, proyectado: 32000, ejecutado: 30000 },
      { semana: 6, proyectado: 30000, ejecutado: 0 },
      { semana: 7, proyectado: 28000, ejecutado: 0 },
      { semana: 8, proyectado: 35000, ejecutado: 32000 },
      { semana: 9, proyectado: 30000, ejecutado: 28000 },
      { semana: 10, proyectado: 28000, ejecutado: 26000 },
      { semana: 11, proyectado: 27000, ejecutado: 26000 },
      { semana: 12, proyectado: 26000, ejecutado: 25000 },
      { semana: 13, proyectado: 25000, ejecutado: 0 },
      { semana: 14, proyectado: 30000, ejecutado: 28000 },
      { semana: 15, proyectado: 28000, ejecutado: 27000 },
      { semana: 16, proyectado: 24000, ejecutado: 23000 },
      { semana: 17, proyectado: 22000, ejecutado: 21000 },
      { semana: 18, proyectado: 20000, ejecutado: 20000 },
      { semana: 19, proyectado: 18000, ejecutado: 17000 },
      { semana: 20, proyectado: 16000, ejecutado: 0 },
      { semana: 21, proyectado: 15000, ejecutado: 14000 },
      { semana: 22, proyectado: 14000, ejecutado: 12000 },
      { semana: 23, proyectado: 13000, ejecutado: 12000 },
      { semana: 24, proyectado: 12000, ejecutado: 10000 },
    ],
    actividad: {
      tareasCompletadasPorSemana: Array.from({ length: 22 }, (_, i) => ({
        semana: i + 1,
        completadas: i * 2 + 1,
        planificadas: i * 2.5 + 2,
      })),
    },
  },
  {
    id: '2',
    name: 'Departamento Centro',
    estado: 'ACTIVA',
    tareas: {
      enCurso: 9,
      paraValidar: 3,
      completadas: 20,
      bloqueadas: 2,
      total: 34,
      vencidas: 5,
      proximas7d: 6,
      ritmoPromedio: 2.5,
      weeklyCompleted: [0, 1, 0, 1, 2, 1, 1, 1, 2, 0, 2, 1, 1, 0, 2, 1, 1, 2, 1, 0, 1, 0, 0, 0],
      last2WeeksCompleted: 2,
      prev2WeeksCompleted: 1,
    },
    presupuesto: { presupuestado: 450000, ejecutado: 180000 },
    presupuestoSemanal: Array.from({ length: 18 }, (_, i) => ({
      semana: i + 1,
      proyectado: 25000 - i * 500,
      ejecutado: (25000 - i * 500) * (0.7 + Math.random() * 0.2),
    })),
    actividad: {
      tareasCompletadasPorSemana: Array.from({ length: 18 }, (_, i) => ({
        semana: i + 1,
        completadas: Math.floor(i * 1.5 + 1),
        planificadas: Math.floor(i * 2 + 2),
      })),
    },
  },
  {
    id: '3',
    name: 'Oficina Comercial',
    estado: 'PAUSADA',
    tareas: {
      enCurso: 5,
      paraValidar: 1,
      completadas: 45,
      bloqueadas: 0,
      total: 51,
      vencidas: 0,
      proximas7d: 3,
      ritmoPromedio: 4.2,
      weeklyCompleted: [2, 3, 4, 3, 5, 4, 4, 5, 3, 4, 5, 4, 3, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0],
      last2WeeksCompleted: 0,
      prev2WeeksCompleted: 4,
    },
    presupuesto: { presupuestado: 800000, ejecutado: 520000 },
    presupuestoSemanal: Array.from({ length: 16 }, (_, i) => ({
      semana: i + 1,
      proyectado: 50000 - i * 1000,
      ejecutado: i < 14 ? (50000 - i * 1000) * 0.85 : 0,
    })),
    actividad: {
      tareasCompletadasPorSemana: Array.from({ length: 16 }, (_, i) => ({
        semana: i + 1,
        completadas: i < 14 ? Math.floor(i * 3 + 2) : 45,
        planificadas: Math.floor(i * 3.5 + 3),
      })),
    },
  },
];

export function MobileHome() {
  const deviceType = useDeviceType();
  const router = useRouter();
  const [periodRange, setPeriodRange] = useState<number>(8);
  const [obraSeleccionada, setObraSeleccionada] = useState<string>(MOCK_OBRAS[0].id);
  const [isActividadModalOpen, setIsActividadModalOpen] = useState(false);

  // Solo mostrar en mobile
  if (deviceType !== 'mobile') {
    return null;
  }

  const obraActual = useMemo(
    () => MOCK_OBRAS.find((o) => o.id === obraSeleccionada) || MOCK_OBRAS[0],
    [obraSeleccionada]
  );

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
    router.push(`/cliente/dashboard?section=billetera&obra=${obraSeleccionada}` as Route);
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Selector global de período sticky */}
      <div className="sticky top-14 z-40 -mx-4 px-4 pt-2 pb-2 bg-white border-b border-gray-200 mb-4">
        <GlobalPeriodSelector
          periodRange={periodRange}
          totalSemanas={Math.max(
            obraActual.tareas.weeklyCompleted?.length || 24,
            obraActual.presupuestoSemanal.length || 24,
            obraActual.actividad.tareasCompletadasPorSemana?.length || 22
          )}
          onPeriodChange={setPeriodRange}
        />
      </div>

      <div className="space-y-4">

      {/* Obra activa - selector tipo carousel */}
      <ObrasCarousel
        obras={MOCK_OBRAS}
        obraSeleccionada={obraSeleccionada}
        onObraSelect={setObraSeleccionada}
        onVerTodas={handleVerTodasObras}
      />

      {/* Acciones rápidas - grid 2x2 */}
      <QuickActionsGrid router={router} />

      {/* Cards resumen - lado a lado */}
      <div className="grid grid-cols-2 gap-3">
        {/* Card Tareas compacta */}
        <CardTareasCompact
          tareas={obraActual.tareas}
          periodRange={periodRange}
          onVerTareas={handleVerTareas}
        />

        {/* Card Presupuesto Escrow compacta */}
        <CardPresupuestoEscrow
          presupuesto={obraActual.presupuesto}
          presupuestoSemanal={obraActual.presupuestoSemanal}
          periodRange={periodRange}
          formatCurrency={formatCurrency}
          onVerDetalle={handleVerPresupuesto}
        />
      </div>

      {/* Card Actividad Preview */}
      <CardActividadPreview
        actividad={obraActual.actividad}
        periodRange={periodRange}
        onVerActividad={() => setIsActividadModalOpen(true)}
      />

      {/* Modal Actividad Detalle */}
      <ModalActividadDetalle
        isOpen={isActividadModalOpen}
        onClose={() => setIsActividadModalOpen(false)}
        actividad={obraActual.actividad}
        periodRange={periodRange}
        onPeriodChange={setPeriodRange}
        onVerTareasSemana={(semana) => {
          router.push(
            `/cliente/dashboard?section=tareas&obra=${obraSeleccionada}&semana=${semana}` as Route
          );
        }}
      />
      </div>
    </div>
  );
}


'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { Building, Layers, FilePlus, Activity, ClipboardList } from 'lucide-react';
import { useElementosStore } from '../elementos/useElementosStore';
import { Button } from '@/components/ui/button';
import { FloorSelector } from './FloorSelector';
import { KpiPanel } from './KpiPanel';
import { useObraStore } from './useObraStore';
import type { PisoResumen } from './useObraStore';
import { TasksChart } from './charts/TasksChart';
import { BudgetChart } from './charts/BudgetChart';
import { ActivityChart } from './charts/ActivityChart';
import { PeriodSelector } from './charts/PeriodSelector';

interface Obra {
  id: string;
  nombre: string;
  cliente: string;
  tipoObra: 'nueva' | 'reforma' | 'ampliacion';
  fechaInicio: string;
  numeroPermiso?: string;
  progreso: number;
  tareasActivas: number;
  tareasCompletadas: number;
  estado: 'activa' | 'pausada' | 'finalizada';
}

interface Tarea {
  id: string;
  nombre: string;
  obraId: string;
  lider: string;
  fechaInicio: string;
  fechaFin: string;
  etapa: 'estructura' | 'obra_gris' | 'terminaciones';
  estado: 'pendiente' | 'en_progreso' | 'completada' | 'bloqueada';
}

interface Planta {
  id: string;
  nombre: string;
}

type ObraResumenContainerProps = {
  obra: Obra;
  tareas: Tarea[];
  plantas?: Planta[];
  onEditarInfo?: () => void;
  onVerDetallePlanta?: (plantaId: string) => void;
  onAbrirElementos?: (plantaId: string) => void;
  onAbrirLegajo?: (plantaId: string) => void;
};

export default function ObraResumenContainer({
  obra,
  tareas,
  plantas = [],
  onEditarInfo,
  onVerDetallePlanta,
  onAbrirElementos,
  onAbrirLegajo
}: ObraResumenContainerProps) {
  const router = useRouter();
  const elementos = useElementosStore((state) => state.elementos);
  const pisoSeleccionado = useObraStore((state) => state.pisoId);
  
  // Calcular métricas globales
  const totalElementos = elementos.length;
  const plantasActivas = new Set(elementos.map(e => e.plantaId || 'General')).size;
  const tareasPendientes = tareas.filter(t => t.estado === 'pendiente').length;
  
  // Calcular progreso por planta con información de elementos
  const progresoPorPlanta = useMemo(() => {
    return plantas.map((planta) => {
      const tareasPlanta = tareas.filter(t => true);
      const elementosPlanta = elementos.filter(e =>
        (e.plantaId === planta.id) || (!e.plantaId && planta.id === 'PB')
      );

      const elementosCompletados = elementosPlanta.length > 0
        ? Math.floor(elementosPlanta.length * 0.5)
        : 0;
      const elementosEnProgreso = elementosPlanta.length > 0
        ? Math.floor(elementosPlanta.length * 0.3)
        : 0;
      const elementosPendientes = Math.max(0, elementosPlanta.length - elementosCompletados - elementosEnProgreso);

      const plantaMetrics = planta as unknown as {
        metrosCubiertos?: number;
        metrosDescubiertos?: number;
        metrosTotales?: number;
        metros_cubiertos?: number;
        metros_descubiertos?: number;
        metros_totales?: number;
      };

      const metrosCubiertos =
        Number(
          plantaMetrics.metrosCubiertos ??
            plantaMetrics.metros_cubiertos ??
            (planta as any).cubiertos,
        ) || elementosPlanta.length * 15;

      const metrosDescubiertos =
        Number(
          plantaMetrics.metrosDescubiertos ??
            plantaMetrics.metros_descubiertos ??
            (planta as any).descubiertos,
        ) || elementosPlanta.length * 5;

      const metrosTotales =
        Number(
          plantaMetrics.metrosTotales ??
            plantaMetrics.metros_totales ??
            (planta as any).total ??
            metrosCubiertos + metrosDescubiertos,
        ) || metrosCubiertos + metrosDescubiertos;

      const tareasCompletadas = tareasPlanta.filter(t => t.estado === 'completada').length;
      const totalTareas = tareasPlanta.length;

      const porcentajePorTareas = totalTareas > 0 ? (tareasCompletadas / totalTareas) * 100 : 0;
      const porcentajePorElementos = elementosPlanta.length > 0
        ? (elementosCompletados / elementosPlanta.length) * 100
        : 0;
      const porcentajeTotal = totalTareas > 0
        ? (porcentajePorTareas * 0.6 + porcentajePorElementos * 0.4)
        : porcentajePorElementos;

      const etapas = [
        {
          etapa: 'estructura' as const,
          nombre: 'Estructura',
          porcentaje: (() => {
            const tareasEtapa = tareasPlanta.filter(t => t.etapa === 'estructura');
            return tareasEtapa.length > 0
              ? (tareasEtapa.filter(t => t.estado === 'completada').length / tareasEtapa.length) * 100
              : 0;
          })()
        },
        {
          etapa: 'obra_gris' as const,
          nombre: 'Obra Gris',
          porcentaje: (() => {
            const tareasEtapa = tareasPlanta.filter(t => t.etapa === 'obra_gris');
            return tareasEtapa.length > 0
              ? (tareasEtapa.filter(t => t.estado === 'completada').length / tareasEtapa.length) * 100
              : 0;
          })()
        },
        {
          etapa: 'terminaciones' as const,
          nombre: 'Terminaciones',
          porcentaje: (() => {
            const tareasEtapa = tareasPlanta.filter(t => t.etapa === 'terminaciones');
            return tareasEtapa.length > 0
              ? (tareasEtapa.filter(t => t.estado === 'completada').length / tareasEtapa.length) * 100
              : 0;
          })()
        }
      ];

      const categorias = (() => {
        if (elementosPlanta.length === 0) return [];

        const acumulado = new Map<string, number>();
        elementosPlanta.forEach((elemento) => {
          const nombre = elemento.grupo ?? 'General';
          acumulado.set(nombre, (acumulado.get(nombre) ?? 0) + 1);
        });

        return Array.from(acumulado.entries())
          .map(([nombre, cantidad]) => ({
            nombre,
            elementos: cantidad,
            porcentaje: Math.min(100, cantidad * 15),
          }))
          .sort((a, b) => b.porcentaje - a.porcentaje);
      })();

      return {
        planta,
        porcentajeTotal,
        etapas,
        elementosCompletados,
        elementosEnProgreso,
        elementosPendientes,
        totalElementos: elementosPlanta.length,
        metrosCubiertos,
        metrosDescubiertos,
        metrosTotales,
        categorias,
      };
    });
  }, [plantas, tareas, elementos]);

  useEffect(() => {
    const pisosResumen: PisoResumen[] = progresoPorPlanta.map(
      ({
        planta,
        porcentajeTotal,
        metrosTotales,
        metrosCubiertos,
        metrosDescubiertos,
        totalElementos,
        categorias,
      }) => ({
        id: planta.id,
        nombre: planta.nombre,
        porcentaje: porcentajeTotal,
        metrosTotales,
        metrosCubiertos,
        metrosDescubiertos,
        elementos: totalElementos,
        categorias,
      }),
    );

    const signature = JSON.stringify(pisosResumen);
    const currentState = useObraStore.getState();
    const fallbackId = pisosResumen[0]?.id ?? null;
    const nextId =
      currentState.pisoId && pisosResumen.some((piso) => piso.id === currentState.pisoId)
        ? currentState.pisoId
        : fallbackId;

    if (currentState.signature === signature && currentState.pisoId === (nextId ?? null)) {
      return;
    }

    currentState.setSnapshot({
      pisos: pisosResumen,
      pisoId: nextId ?? null,
      signature,
    });
  }, [progresoPorPlanta]);

  const totalMetrosCubiertos = useMemo(
    () => progresoPorPlanta.reduce((acc, item) => acc + item.metrosCubiertos, 0),
    [progresoPorPlanta],
  );

  const totalMetrosDescubiertos = useMemo(
    () => progresoPorPlanta.reduce((acc, item) => acc + item.metrosDescubiertos, 0),
    [progresoPorPlanta],
  );

  const totalMetrosTotales = useMemo(
    () => progresoPorPlanta.reduce((acc, item) => acc + item.metrosTotales, 0),
    [progresoPorPlanta],
  );

  const categoriasBase = useMemo(() => {
    const desdeElementos = Array.from(
      new Set(
        elementos
          .map((elemento) => elemento.grupo)
          .filter((nombre): nombre is string => Boolean(nombre)),
      ),
    );

    if (desdeElementos.length === 0) {
      return [
        'Fundaciones y Estructuras',
        'Muros y Cerramientos',
        'Instalaciones',
      ];
    }

    return desdeElementos;
  }, [elementos]);

  const progresoPorCategoria = useMemo(() => {
    return categoriasBase.map((nombre) => {
      const elementosCategoria = elementos.filter((elemento) => elemento.grupo === nombre);
      const total = elementosCategoria.length;

      if (total === 0) {
        return {
          nombre,
          porcentaje: 0,
          elementos: 0,
        };
      }

      const porcentaje = Math.min(100, total * 15);

      return {
        nombre,
        porcentaje,
        elementos: total,
      };
    });
  }, [categoriasBase, elementos]);

  const topCategorias = useMemo(() => {
    return [...progresoPorCategoria]
      .sort((a, b) => b.porcentaje - a.porcentaje)
      .slice(0, 3);
  }, [progresoPorCategoria]);

  const actividadReciente = useMemo(() => {
    const actividades: Array<{
      id: string;
      titulo: string;
      detalle: string;
      usuario: string;
      timestamp: number;
    }> = [];

    elementos.forEach((elem) => {
      const fecha = elem.fechaCreacion ? new Date(elem.fechaCreacion) : new Date();
      actividades.push({
        id: `elem-${elem.id}`,
        titulo: `Configuración de ${elem.nombreElemento ?? 'Elemento'}`,
        detalle: `${elem.grupo ?? 'General'} · ${elem.plantaId ?? 'General'}`,
        usuario: 'Sistema',
        timestamp: fecha.getTime(),
      });
    });

    tareas.forEach((tarea) => {
      const fecha = tarea.fechaFin ? new Date(tarea.fechaFin) : new Date(tarea.fechaInicio);
      actividades.push({
        id: `tarea-${tarea.id}`,
        titulo: tarea.nombre,
        detalle: `${tarea.etapa} · ${tarea.estado}`,
        usuario: tarea.lider,
        timestamp: fecha.getTime(),
      });
    });

    return actividades
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);
  }, [elementos, tareas]);

  const estadoConfig: Record<Obra['estado'], { label: string; className: string }> = {
    activa: {
      label: 'En progreso',
      className: 'bg-blue-50 text-blue-700 border border-blue-200',
    },
    pausada: {
      label: 'Pausada',
      className: 'bg-amber-50 text-amber-700 border border-amber-200',
    },
    finalizada: {
      label: 'Finalizada',
      className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    },
  };

  const estadoInfo = estadoConfig[obra.estado] ?? estadoConfig.activa;
  const fechaInicio = new Date(obra.fechaInicio).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const ultimaActualizacion = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const progresoTotal = Math.round(obra.progreso ?? 0);
  const defaultPlantaId = plantas[0]?.id ?? 'general';
  const plantaParaAcciones = pisoSeleccionado ?? defaultPlantaId;

  // Estado para gráficos
  const [rangoTemporal, setRangoTemporal] = useState(12);
  const [hoveredSemana, setHoveredSemana] = useState<number | null>(null);

  // Preparar datos para TasksChart
  const tareasData = useMemo(() => {
    const enCurso = tareas.filter(t => t.estado === 'en_progreso').length;
    const paraValidar = tareas.filter(t => t.estado === 'para_validar').length;
    const completadas = tareas.filter(t => t.estado === 'completada').length;
    const bloqueadas = tareas.filter(t => t.estado === 'bloqueada').length;
    const total = tareas.length;
    
    // Calcular tareas vencidas (comparar fechaFin con hoy)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const vencidas = tareas.filter(t => {
      if (!t.fechaFin || t.estado === 'completada') return false;
      const fechaFin = new Date(t.fechaFin);
      fechaFin.setHours(0, 0, 0, 0);
      return fechaFin < hoy;
    }).length;

    // Calcular próximas 7 días
    const en7Dias = new Date(hoy);
    en7Dias.setDate(en7Dias.getDate() + 7);
    const proximas7d = tareas.filter(t => {
      if (!t.fechaFin || t.estado === 'completada') return false;
      const fechaFin = new Date(t.fechaFin);
      fechaFin.setHours(0, 0, 0, 0);
      return fechaFin >= hoy && fechaFin <= en7Dias;
    }).length;

    // Calcular completadas por semana (últimas 12 semanas)
    const fechaInicioObra = new Date(obra.fechaInicio);
    const semanasDesdeInicio = Math.ceil((hoy.getTime() - fechaInicioObra.getTime()) / (1000 * 60 * 60 * 24 * 7));
    const totalSemanas = Math.max(12, semanasDesdeInicio);
    const weeklyCompleted: number[] = [];
    for (let i = 0; i < totalSemanas; i++) {
      const semanaInicio = new Date(fechaInicioObra);
      semanaInicio.setDate(semanaInicio.getDate() + i * 7);
      const semanaFin = new Date(semanaInicio);
      semanaFin.setDate(semanaFin.getDate() + 7);
      const completadasSemana = tareas.filter(t => {
        if (t.estado !== 'completada' || !t.fechaFin) return false;
        const fechaCompletada = new Date(t.fechaFin);
        return fechaCompletada >= semanaInicio && fechaCompletada < semanaFin;
      }).length;
      weeklyCompleted.push(completadasSemana);
    }

    const last2WeeksCompleted = weeklyCompleted.slice(-2).reduce((a, b) => a + b, 0);
    const prev2WeeksCompleted = weeklyCompleted.slice(-4, -2).reduce((a, b) => a + b, 0);

    return {
      enCurso,
      paraValidar,
      completadas,
      bloqueadas,
      total,
      vencidas,
      proximas7d,
      ritmoPromedio: totalSemanas > 0 ? completadas / totalSemanas : 0,
      weeklyCompleted,
      last2WeeksCompleted,
      prev2WeeksCompleted,
    };
  }, [tareas, obra.fechaInicio]);

  // Preparar datos para BudgetChart (placeholder - necesita datos reales del presupuesto)
  const presupuestoSemanalData = useMemo(() => {
    // Por ahora, crear datos placeholder basados en las tareas
    // TODO: Reemplazar con datos reales del presupuesto/escrow
    const fechaInicioObra = new Date(obra.fechaInicio);
    const hoy = new Date();
    const semanasDesdeInicio = Math.ceil((hoy.getTime() - fechaInicioObra.getTime()) / (1000 * 60 * 60 * 24 * 7));
    const totalSemanas = Math.max(12, semanasDesdeInicio);
    
    const data: Array<{ semana: number; proyectado: number; ejecutado: number; tareasPagadas: number }> = [];
    for (let i = 1; i <= totalSemanas; i++) {
      data.push({
        semana: i,
        proyectado: 0, // TODO: Obtener de presupuesto real
        ejecutado: 0, // TODO: Obtener de escrow real
        tareasPagadas: 0, // TODO: Contar tareas pagadas esa semana
      });
    }
    return data;
  }, [obra.fechaInicio]);

  // Preparar datos para ActivityChart
  const actividadData = useMemo(() => {
    const fechaInicioObra = new Date(obra.fechaInicio);
    const hoy = new Date();
    const semanasDesdeInicio = Math.ceil((hoy.getTime() - fechaInicioObra.getTime()) / (1000 * 60 * 60 * 24 * 7));
    const totalSemanas = Math.max(12, semanasDesdeInicio);
    
    const tareasCompletadasPorSemana: Array<{ semana: number; completadas: number }> = [];
    const actividadProyectada: Array<{ semana: number; proyectado: number }> = [];
    
    let acumuladoCompletadas = 0;
    const promedioSemanal = tareas.length / totalSemanas;
    
    for (let i = 1; i <= totalSemanas; i++) {
      const semanaInicio = new Date(fechaInicioObra);
      semanaInicio.setDate(semanaInicio.getDate() + (i - 1) * 7);
      const semanaFin = new Date(semanaInicio);
      semanaFin.setDate(semanaFin.getDate() + 7);
      
      const completadasSemana = tareas.filter(t => {
        if (t.estado !== 'completada' || !t.fechaFin) return false;
        const fechaCompletada = new Date(t.fechaFin);
        return fechaCompletada >= semanaInicio && fechaCompletada < semanaFin;
      }).length;
      
      acumuladoCompletadas += completadasSemana;
      tareasCompletadasPorSemana.push({ semana: i, completadas: acumuladoCompletadas });
      actividadProyectada.push({ semana: i, proyectado: Math.round(promedioSemanal * i) });
    }

    return {
      tareasCompletadasPorSemana,
      actividadProyectada,
      milestones: [],
      insight: 'success' as const,
    };
  }, [tareas, obra.fechaInicio]);

  const totalSemanas = Math.max(12, presupuestoSemanalData.length);

  return (
    <div className="space-y-4 md:space-y-6 bg-[#F8FAFC] p-3 md:p-4 lg:p-6 xl:p-8">
      <div className="grid gap-4 md:gap-6 lg:grid-cols-12">
        <div className="space-y-4 md:space-y-6 lg:col-span-5">
          <div className="rounded-2xl md:rounded-3xl border border-slate-200 bg-white p-3 md:p-4 lg:p-5 shadow-[0_2px_6px_rgba(15,23,42,0.05)]" data-onboarding="plantas-proyecto">
            <div className="flex items-center justify-between">
              <h3 className="text-xs md:text-sm font-semibold text-slate-700">Plantas del proyecto</h3>
              <span className="text-[10px] md:text-xs font-medium text-slate-500">
                {plantasActivas} activas
              </span>
            </div>
            <p className="mt-1 text-[10px] md:text-xs text-slate-500">
              Seleccioná una planta para ver indicadores y métricas específicas.
            </p>
            <div className="mt-4">
              <FloorSelector
                onSelect={(id) => {
                  onVerDetallePlanta?.(id);
                }}
              />
            </div>
          </div>

        </div>

        <div className="space-y-4 md:space-y-6 lg:col-span-7">
          <KpiPanel
            global={{
              metrosTotales: totalMetrosTotales,
              metrosCubiertos: totalMetrosCubiertos,
              metrosDescubiertos: totalMetrosDescubiertos,
              progreso: progresoTotal,
              tareasActivas: obra.tareasActivas,
              tareasCompletadas: obra.tareasCompletadas,
              totalElementos,
              categorias: topCategorias,
            }}
          />

          <div className="rounded-2xl md:rounded-3xl border border-slate-200 bg-white p-3 md:p-4 lg:p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3 md:h-4 md:w-4 text-[#0052CC]" />
              <h3 className="text-xs md:text-sm font-semibold text-slate-700">Actividad reciente</h3>
            </div>
            <div className="mt-3 md:mt-4 space-y-2 md:space-y-3">
              {actividadReciente.length === 0 ? (
                <p className="rounded-lg md:rounded-xl border border-dashed border-slate-200 bg-slate-50 px-2 md:px-3 py-3 md:py-4 text-xs md:text-sm text-slate-500">
                  Aún no se registraron actividades recientes en esta obra.
                </p>
              ) : (
                actividadReciente.map((item) => (
                  <div key={item.id} className="flex items-start gap-2 md:gap-3 rounded-lg md:rounded-xl border border-slate-200 bg-slate-50 px-2 md:px-3 py-2 md:py-3">
                    <div className="mt-0.5 md:mt-1 flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-lg md:rounded-xl bg-blue-100 text-[#0052CC] flex-shrink-0">
                      <Activity className="h-3 w-3 md:h-4 md:w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm font-semibold text-slate-700 truncate">{item.titulo}</p>
                      <p className="text-[10px] md:text-xs text-slate-500 truncate">{item.detalle}</p>
                      <p className="text-[9px] md:text-[11px] text-slate-400">
                        {new Date(item.timestamp).toLocaleDateString('es-AR')} · {item.usuario}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl md:rounded-3xl border border-slate-200 bg-white p-3 md:p-4 lg:p-5 shadow-sm" data-onboarding="acciones-rapidas">
            <h3 className="text-xs md:text-sm font-semibold text-slate-700">Acciones rápidas</h3>
            <div className="mt-3 md:mt-4 flex flex-col gap-2 md:gap-3 sm:flex-row">
              <Button
                className="flex-1 rounded-xl bg-[#0052CC] text-white hover:bg-[#0044a8]"
                onClick={() => onAbrirElementos?.(plantaParaAcciones)}
              >
                <Layers className="mr-2 h-4 w-4" /> Ver elementos
              </Button>
              <Button
                variant="outline"
                className="flex-1 rounded-xl border border-[#0052CC]/30 bg-blue-50 text-[#0052CC] hover:bg-blue-100"
                onClick={() => router.push(`/cliente/dashboard?section=tareas&obraId=${obra.id}` as Route)}
              >
                <ClipboardList className="mr-2 h-4 w-4" /> Tareas
              </Button>
              <Button
                variant="outline"
                className="flex-1 rounded-xl border border-[#0052CC]/30 bg-blue-50 text-[#0052CC] hover:bg-blue-100"
                onClick={() => onAbrirLegajo?.(plantaParaAcciones)}
              >
                <FilePlus className="mr-2 h-4 w-4" /> Agregar legajo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="space-y-6">
        {/* Selector de período global */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Análisis de la obra</h2>
          <PeriodSelector
            rangoTemporal={rangoTemporal}
            totalSemanas={totalSemanas}
            onPeriodChange={setRangoTemporal}
          />
        </div>

        {/* Gráfico de Tareas */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm md:text-base font-semibold text-slate-900">Tareas</h3>
          </div>
          <TasksChart
            tareas={tareasData}
            rangoTemporal={rangoTemporal}
            obraId={obra.id}
          />
        </div>

        {/* Gráfico de Presupuesto */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm md:text-base font-semibold text-slate-900">Ejecución presupuestaria</h3>
          </div>
          <BudgetChart
            presupuestoSemanal={presupuestoSemanalData}
            rangoTemporal={rangoTemporal}
            onHover={setHoveredSemana}
            hoveredSemana={hoveredSemana}
          />
        </div>

        {/* Gráfico de Actividad */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm md:text-base font-semibold text-slate-900">Actividad de la obra</h3>
          </div>
          <ActivityChart
            actividad={actividadData}
            rangoTemporal={rangoTemporal}
            onHover={setHoveredSemana}
            hoveredSemana={hoveredSemana}
          />
        </div>
      </div>
    </div>
  );
}


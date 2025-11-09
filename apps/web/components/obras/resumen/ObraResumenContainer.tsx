'use client';

import { useEffect, useMemo } from 'react';
import { Building, Layers, FilePlus, Activity } from 'lucide-react';
import { useElementosStore } from '../elementos/useElementosStore';
import { Button } from '@/components/ui/button';
import { FloorSelector } from './FloorSelector';
import { KpiPanel } from './KpiPanel';
import { useObraStore } from './useObraStore';
import type { PisoResumen } from './useObraStore';

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

  return (
    <div className="space-y-6 bg-[#F8FAFC] p-6 lg:p-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0052CC]/10 text-[#0052CC]">
              <Building className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold text-[#1E293B]">{obra.nombre}</h2>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${estadoInfo.className}`}>
                  {estadoInfo.label}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                Cliente: {obra.cliente} · Tipo: {obra.tipoObra}
              </p>
              <p className="text-xs text-slate-400">
                Inicio: {fechaInicio} · Última actualización: {ultimaActualizacion}
              </p>
            </div>
          </div>
          {onEditarInfo && (
            <Button variant="outline" className="rounded-xl border-slate-200" onClick={onEditarInfo}>
              Editar información
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_2px_6px_rgba(15,23,42,0.05)]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Plantas del proyecto</h3>
              <span className="text-xs font-medium text-slate-500">
                {plantasActivas} activas
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
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

        <div className="space-y-6 lg:col-span-7">
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

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#0052CC]" />
              <h3 className="text-sm font-semibold text-slate-700">Actividad reciente</h3>
            </div>
            <div className="mt-4 space-y-3">
              {actividadReciente.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                  Aún no se registraron actividades recientes en esta obra.
                </p>
              ) : (
                actividadReciente.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-[#0052CC]">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{item.titulo}</p>
                      <p className="text-xs text-slate-500">{item.detalle}</p>
                      <p className="text-[11px] text-slate-400">
                        {new Date(item.timestamp).toLocaleDateString('es-AR')} · {item.usuario}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700">Acciones rápidas</h3>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button
                className="flex-1 rounded-xl bg-[#0052CC] text-white hover:bg-[#0044a8]"
                onClick={() => onAbrirElementos?.(plantaParaAcciones)}
              >
                <Layers className="mr-2 h-4 w-4" /> Ver elementos
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
    </div>
  );
}


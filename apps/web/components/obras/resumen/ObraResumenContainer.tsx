'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { Layers, FilePlus, Activity, ClipboardList } from 'lucide-react';
import { useElementosStore } from '../elementos/useElementosStore';
import { Button } from '@/components/ui/button';
import { FloorSelector } from './FloorSelector';
import { KpiPanel } from './KpiPanel';
import { useObraStore } from './useObraStore';
import type { PisoResumen } from './useObraStore';

// Demo video: datos mock para el Resumen cuando la obra es la demo (sin base de datos)
const DEMO_OBRA_ID = 'demo-obra-1-casa-familiar';
const MOCK_PISOS_RESUMEN_DEMO: PisoResumen[] = [
  { id: 'PB', nombre: 'Planta Baja', porcentaje: 42, metrosTotales: 120, metrosCubiertos: 95, metrosDescubiertos: 25, elementos: 18, categorias: [{ nombre: 'Fundaciones y Estructuras', porcentaje: 85, elementos: 8 }, { nombre: 'Muros y Cerramientos', porcentaje: 60, elementos: 6 }, { nombre: 'Instalaciones', porcentaje: 30, elementos: 4 }] },
  { id: 'P1', nombre: 'Primer Piso', porcentaje: 28, metrosTotales: 100, metrosCubiertos: 85, metrosDescubiertos: 15, elementos: 12, categorias: [{ nombre: 'Muros y Cerramientos', porcentaje: 45, elementos: 5 }, { nombre: 'Cubiertas', porcentaje: 20, elementos: 3 }, { nombre: 'Terminaciones', porcentaje: 10, elementos: 4 }] },
];
const MOCK_TOP_CATEGORIAS_DEMO = [
  { nombre: 'Fundaciones y Estructuras', porcentaje: 85, elementos: 8 },
  { nombre: 'Muros y Cerramientos', porcentaje: 52, elementos: 11 },
  { nombre: 'Instalaciones', porcentaje: 30, elementos: 4 },
];

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

  const isDemoObra = obra.id === DEMO_OBRA_ID;
  
  // Calcular métricas globales (demo: usar mocks)
  const totalElementos = isDemoObra
    ? MOCK_PISOS_RESUMEN_DEMO.reduce((acc, p) => acc + p.elementos, 0)
    : elementos.length;
  const plantasActivas = isDemoObra
    ? MOCK_PISOS_RESUMEN_DEMO.length
    : new Set(elementos.map(e => e.plantaId || 'General')).size;
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
    const pisosResumen: PisoResumen[] = isDemoObra
      ? MOCK_PISOS_RESUMEN_DEMO
      : progresoPorPlanta.map(
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
  }, [progresoPorPlanta, isDemoObra]);

  const totalMetrosCubiertos = useMemo(
    () =>
      isDemoObra
        ? MOCK_PISOS_RESUMEN_DEMO.reduce((acc, p) => acc + p.metrosCubiertos, 0)
        : progresoPorPlanta.reduce((acc, item) => acc + item.metrosCubiertos, 0),
    [progresoPorPlanta, isDemoObra],
  );

  const totalMetrosDescubiertos = useMemo(
    () =>
      isDemoObra
        ? MOCK_PISOS_RESUMEN_DEMO.reduce((acc, p) => acc + p.metrosDescubiertos, 0)
        : progresoPorPlanta.reduce((acc, item) => acc + item.metrosDescubiertos, 0),
    [progresoPorPlanta, isDemoObra],
  );

  const totalMetrosTotales = useMemo(
    () =>
      isDemoObra
        ? MOCK_PISOS_RESUMEN_DEMO.reduce((acc, p) => acc + p.metrosTotales, 0)
        : progresoPorPlanta.reduce((acc, item) => acc + item.metrosTotales, 0),
    [progresoPorPlanta, isDemoObra],
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
    if (isDemoObra) return MOCK_TOP_CATEGORIAS_DEMO;
    return [...progresoPorCategoria]
      .sort((a, b) => b.porcentaje - a.porcentaje)
      .slice(0, 3);
  }, [progresoPorCategoria, isDemoObra]);

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

  const LIMIT_ACTIVIDAD_RECIENTE = 3;
  const [actividadExpandida, setActividadExpandida] = useState(false);
  const actividadesVisibles = actividadExpandida
    ? actividadReciente
    : actividadReciente.slice(0, LIMIT_ACTIVIDAD_RECIENTE);
  const hayMasActividad = actividadReciente.length > LIMIT_ACTIVIDAD_RECIENTE;

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
    <div className="space-y-2 md:space-y-3 bg-[#F8FAFC] p-2 md:p-3 lg:p-4">
      <div className="grid gap-2 md:gap-3 lg:grid-cols-12">
        <div className="space-y-2 md:space-y-3 lg:col-span-5">
          <div className="rounded-xl md:rounded-2xl border border-slate-200 bg-white p-2 md:p-3 shadow-[0_2px_6px_rgba(15,23,42,0.05)]" data-onboarding="plantas-proyecto">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-700">Plantas del proyecto</h3>
              <span className="text-[10px] font-medium text-slate-500">
                {plantasActivas} activas
              </span>
            </div>
            <p className="mt-0.5 text-[10px] text-slate-500">
              Seleccioná una planta para ver indicadores y métricas específicas.
            </p>
            <div className="mt-2">
              <FloorSelector
                onSelect={(id) => {
                  onVerDetallePlanta?.(id);
                }}
              />
            </div>
          </div>

        </div>

        <div className="space-y-2 md:space-y-3 lg:col-span-7">
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

          <div className="rounded-xl md:rounded-2xl border border-slate-200 bg-white p-2 md:p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Activity className="h-3 w-3 text-[#0052CC]" />
              <h3 className="text-xs font-semibold text-slate-700">Actividad reciente</h3>
            </div>
            <div className="mt-2 space-y-1.5">
              {actividadReciente.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-2 py-2 text-[10px] text-slate-500">
                  Aún no se registraron actividades recientes en esta obra.
                </p>
              ) : (
                <>
                  {actividadesVisibles.map((item) => (
                    <div key={item.id} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
                      <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-[#0052CC] flex-shrink-0">
                        <Activity className="h-3 w-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-700 truncate">{item.titulo}</p>
                        <p className="text-[10px] text-slate-500 truncate">{item.detalle}</p>
                        <p className="text-[9px] text-slate-400">
                          {new Date(item.timestamp).toLocaleDateString('es-AR')} · {item.usuario}
                        </p>
                      </div>
                    </div>
                  ))}
                  {hayMasActividad && (
                    <button
                      type="button"
                      onClick={() => setActividadExpandida((v) => !v)}
                      className="w-full rounded-lg border border-dashed border-slate-200 bg-slate-50/50 py-1.5 text-[10px] font-medium text-[#0052CC] hover:bg-slate-100 transition"
                    >
                      {actividadExpandida ? 'Ver menos' : `Ver más (${actividadReciente.length - LIMIT_ACTIVIDAD_RECIENTE} más)`}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="rounded-xl md:rounded-2xl border border-slate-200 bg-white p-2 md:p-3 shadow-sm" data-onboarding="acciones-rapidas">
            <h3 className="text-xs font-semibold text-slate-700">Acciones rápidas</h3>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
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
    </div>
  );
}


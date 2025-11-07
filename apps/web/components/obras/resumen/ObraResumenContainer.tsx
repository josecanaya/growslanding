'use client';

import { useMemo } from 'react';
import { Building, Layers, FilePlus, TrendingUp, Activity } from 'lucide-react';
import Building3DWithWindows from './Building3DWithWindows';
import { useElementosStore } from '../elementos/useElementosStore';
import { Button } from '@/components/ui/button';

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
  plantas = [{ id: 'PB', nombre: 'Planta Baja' }, { id: '1', nombre: '1er Piso' }],
  onEditarInfo,
  onVerDetallePlanta,
  onAbrirElementos,
  onAbrirLegajo
}: ObraResumenContainerProps) {
  const elementos = useElementosStore((state) => state.elementos);
  
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

      const metrosCubiertos = elementosPlanta.length * 15;
      const metrosDescubiertos = elementosPlanta.length * 5;
      const metrosTotales = metrosCubiertos + metrosDescubiertos;

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
      };
    });
  }, [plantas, tareas, elementos]);

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
              <h3 className="text-sm font-semibold text-slate-700">Vista del proyecto</h3>
            </div>
            <div className="mt-4">
              <Building3DWithWindows
                pisos={progresoPorPlanta.length}
                plantas={progresoPorPlanta.map(({ planta, metrosTotales, metrosCubiertos, metrosDescubiertos, totalElementos }) => ({
                  id: planta.id,
                  nombre: planta.nombre,
                  metrosTotales,
                  metrosCubiertos,
                  metrosDescubiertos,
                  totalElementos,
                }))}
                onClickPiso={(index) => {
                  const plantaIndex = plantas.length - 1 - index;
                  const planta = plantas[plantaIndex];
                  if (planta && onVerDetallePlanta) {
                    onVerDetallePlanta(planta.id);
                  }
                }}
                onAbrirElementos={(plantaId) => {
                  if (onAbrirElementos) {
                    onAbrirElementos(plantaId);
                  }
                }}
                onAbrirLegajo={(plantaId) => {
                  if (onAbrirLegajo) {
                    onAbrirLegajo(plantaId);
                  }
                }}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_2px_6px_rgba(15,23,42,0.05)]">
            <h3 className="text-sm font-semibold text-slate-700">Estructura del proyecto</h3>
            <div className="mt-4 space-y-3">
              {progresoPorPlanta.map(({ planta, porcentajeTotal }) => (
                <div
                  key={planta.id}
                  className="rounded-xl border border-blue-100 bg-blue-50/60 p-3"
                >
                  <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                    <span>{planta.nombre}</span>
                    <span className="text-[#0052CC]">{Math.round(porcentajeTotal)}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-blue-100">
                    <div
                      className="h-2 rounded-full bg-[#0052CC] transition-all"
                      style={{ width: `${Math.min(100, Math.round(porcentajeTotal))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-7">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">Metros totales</p>
              <p className="text-2xl font-semibold text-slate-800">{totalMetrosTotales} m²</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">Cubiertos</p>
              <p className="text-2xl font-semibold text-[#0052CC]">{totalMetrosCubiertos} m²</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">Descubiertos</p>
              <p className="text-2xl font-semibold text-[#22C55E]">{totalMetrosDescubiertos} m²</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-700">Avance general</h3>
                  <p className="text-xs text-slate-500">Seguimiento del progreso del proyecto</p>
                </div>
                <span className="text-lg font-semibold text-[#0052CC]">{progresoTotal}%</span>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-[#0052CC]"
                  style={{ width: `${Math.min(100, progresoTotal)}%` }}
                />
              </div>
              <div className="mt-3 grid grid-cols-3 text-xs text-slate-500">
                <span>{obra.tareasActivas} tareas activas</span>
                <span>{obra.tareasCompletadas} completadas</span>
                <span>{totalElementos} elementos</span>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#0052CC]" />
                <h3 className="text-sm font-semibold text-slate-700">Categorías destacadas</h3>
              </div>
              <div className="mt-4 space-y-3">
                {topCategorias.map((cat) => (
                  <div key={cat.nombre} className="flex items-center justify-between rounded-xl border border-blue-100/80 bg-blue-50/50 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-slate-700">{cat.nombre}</p>
                      <p className="text-xs text-slate-500">{cat.elementos} elementos</p>
                    </div>
                    <span className="text-sm font-semibold text-[#0052CC]">{Math.round(cat.porcentaje)}%</span>
                  </div>
                ))}
                {topCategorias.length === 0 && (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    Todavía no hay categorías con elementos cargados.
                  </p>
                )}
              </div>
            </div>
          </div>

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
                onClick={() => onAbrirElementos?.(defaultPlantaId)}
              >
                <Layers className="mr-2 h-4 w-4" /> Ver elementos
              </Button>
              <Button
                variant="outline"
                className="flex-1 rounded-xl border border-[#0052CC]/30 bg-blue-50 text-[#0052CC] hover:bg-blue-100"
                onClick={() => onAbrirLegajo?.(defaultPlantaId)}
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


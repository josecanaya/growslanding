'use client';

import { useMemo } from 'react';
import { Building, CheckCircle, Clock, AlertCircle, FileText, Users, Calendar, Edit3, Layers } from 'lucide-react';
import KPI from './KPI';
import ProgressBar from './ProgressBar';
import Building3DWithWindows from './Building3DWithWindows';
import CategoryCard from './CategoryCard';
import ActivityList from './ActivityList';
import { useElementosStore } from '../elementos/useElementosStore';

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

// Mock de datos para categorías constructivas
const categoriasConstructivas = [
  { nombre: 'Fundaciones y Estructuras', iconColor: '#3b82f6' },
  { nombre: 'Muros', iconColor: '#8b5cf6' },
  { nombre: 'Pisos', iconColor: '#10b981' },
  { nombre: 'Cubiertas', iconColor: '#f59e0b' },
  { nombre: 'Escaleras', iconColor: '#ef4444' },
  { nombre: 'Carpinterías', iconColor: '#6366f1' }
];

export default function ObraResumenContainer({ 
  obra, 
  tareas, 
  plantas = [{ id: 'PB', nombre: 'Planta Baja' }, { id: '1', nombre: '1er Piso' }],
  onEditarInfo,
  onVerDetallePlanta,
  onAbrirElementos,
  onAbrirLegajo
}: ObraResumenContainerProps) {
  const elementos = useElementosStore((s) => s.elementos);
  
  // Calcular métricas globales
  const totalElementos = elementos.length;
  const plantasActivas = new Set(elementos.map(e => e.plantaId || 'General')).size;
  const tareasPendientes = tareas.filter(t => t.estado === 'pendiente').length;
  
  // Calcular progreso por planta con información de elementos
  const progresoPorPlanta = useMemo(() => {
    return plantas.map((planta) => {
      // Filtrar tareas por planta (mock por ahora - usar todas las tareas)
      const tareasPlanta = tareas.filter(t => 
        // Por ahora usamos todas las tareas como mock
        // En el futuro se asociarán por plantaId
        true
      );
      
      // Obtener elementos de esta planta
      const elementosPlanta = elementos.filter(e => 
        (e.plantaId === planta.id) || (!e.plantaId && planta.id === 'PB')
      );
      
      // Calcular estados de elementos (mock determinista basado en cantidad de elementos)
      // En producción, esto vendría de un estado real de cada elemento
      const elementosCompletados = elementosPlanta.length > 0 
        ? Math.floor(elementosPlanta.length * 0.5) // Mock: 50% completados
        : 0;
      const elementosEnProgreso = elementosPlanta.length > 0
        ? Math.floor(elementosPlanta.length * 0.3) // Mock: 30% en progreso
        : 0;
      const elementosPendientes = Math.max(0, elementosPlanta.length - elementosCompletados - elementosEnProgreso);
      
      const tareasCompletadas = tareasPlanta.filter(t => t.estado === 'completada').length;
      const totalTareas = tareasPlanta.length;
      
      // Calcular porcentaje total combinando tareas y elementos
      const porcentajePorTareas = totalTareas > 0 ? (tareasCompletadas / totalTareas) * 100 : 0;
      const porcentajePorElementos = elementosPlanta.length > 0 
        ? (elementosCompletados / elementosPlanta.length) * 100 
        : 0;
      const porcentajeTotal = totalTareas > 0 
        ? (porcentajePorTareas * 0.6 + porcentajePorElementos * 0.4) // 60% tareas, 40% elementos
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
        totalElementos: elementosPlanta.length
      };
    });
  }, [plantas, tareas, elementos]);

  // Calcular progreso por categoría constructiva
  const progresoPorCategoria = useMemo(() => {
    return categoriasConstructivas.map((cat) => {
      const elementosCategoria = elementos.filter(e => e.grupo === cat.nombre);
      const total = elementosCategoria.length;
      
      if (total === 0) {
        return {
          ...cat,
          porcentaje: 0,
          estado: 'pendiente' as const,
          elementosActivos: []
        };
      }
      
      // Mock: asumimos que si hay elementos configurados, está en progreso
      const porcentaje = Math.min(100, total * 15); // Mock progress
      const estado = porcentaje === 100 ? 'completado' : porcentaje > 0 ? 'en_progreso' : 'pendiente';
      
      return {
        ...cat,
        porcentaje,
        estado,
        elementosActivos: elementosCategoria.slice(0, 3).map(e => e.nombreElemento)
      };
    });
  }, [elementos]);

  // Actividad reciente (mock por ahora)
  const actividadReciente = useMemo(() => {
    const actividades: any[] = [];
    
    // Agregar actividades de elementos
    elementos.slice(0, 3).forEach((elem) => {
      actividades.push({
        id: `elem-${elem.id}`,
        tipo: 'elemento' as const,
        accion: `Configuración de ${elem.nombreElemento}`,
        usuario: 'Usuario Sistema',
        planta: elem.plantaId || 'General',
        categoria: elem.grupo,
        fecha: new Date(elem.fechaCreacion).toLocaleDateString('es-AR'),
        icon: 'brick' as const
      });
    });
    
    // Agregar actividades de tareas
    tareas.slice(0, 2).forEach((tarea) => {
      actividades.push({
        id: `tarea-${tarea.id}`,
        tipo: 'tarea' as const,
        accion: tarea.nombre,
        usuario: tarea.lider,
        fecha: new Date(tarea.fechaInicio).toLocaleDateString('es-AR'),
        icon: 'check' as const
      });
    });
    
    return actividades.sort((a, b) => 
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    ).slice(0, 5);
  }, [elementos, tareas]);

  return (
    <div className="p-8" style={{ backgroundColor: '#f6f7f9' }}>
      {/* Visualización del Edificio por Plantas (Building 3D With Windows) */}
      <div className="mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <Building3DWithWindows
            pisos={plantas.length}
            plantas={progresoPorPlanta.map(({ planta, totalElementos }) => {
              const elementosPlanta = elementos.filter(e => 
                (e.plantaId === planta.id) || (!e.plantaId && planta.id === 'PB')
              );
              
              // Calcular superficies mock (en producción vendría de la base de datos)
              const metrosCubiertos = elementosPlanta.length * 15; // Mock: ~15 m² por elemento
              const metrosDescubiertos = elementosPlanta.length * 5; // Mock: ~5 m² por elemento
              const metrosTotales = metrosCubiertos + metrosDescubiertos;

              return {
                id: planta.id,
                nombre: planta.nombre,
                metrosTotales,
                metrosCubiertos,
                metrosDescubiertos,
                totalElementos: elementosPlanta.length
              };
            })}
            onClickPiso={(index) => {
              // Mapear el índice invertido a la planta correcta
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

      {/* Avance por Categoría Constructiva */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-6" style={{ color: '#003C6E' }}>Avance por Categoría Constructiva</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {progresoPorCategoria.map((cat) => (
            <CategoryCard
              key={cat.nombre}
              nombre={cat.nombre}
              porcentaje={cat.porcentaje}
              estado={cat.estado}
              elementosActivos={cat.elementosActivos}
              iconColor={cat.iconColor}
            />
          ))}
        </div>
      </div>

      {/* Actividad Reciente */}
      <div>
        <h3 className="text-xl font-semibold mb-6" style={{ color: '#003C6E' }}>Actividad Reciente</h3>
        <ActivityList items={actividadReciente} maxItems={5} />
      </div>
    </div>
  );
}


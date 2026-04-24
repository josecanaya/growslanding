'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { 
  ArrowLeft, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Play, 
  Pause, 
  FolderOpen, 
  Upload, 
  Trash2, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Home, 
  Building, 
  Wrench, 
  Paintbrush, 
  ShoppingCart, 
  X,
  Settings,
  BarChart3,
  Users,
  Calendar,
  MapPin,
  Edit3,
  Eye,
  Download,
  ClipboardList
} from 'lucide-react';
import { ModalCrearTarea } from './modals/ModalCrearTarea';
// import { LegajoTecnicoSection } from './LegajoTecnicoSection';
import { EditorVisualTareas } from './EditorVisualTareas';
import PasoElementosConstructivos from './PasoElementosConstructivos';
import CargaElementosPanel from '@/components/cliente/CargaElementosPanel';
import ObraResumenContainer from '@/components/obras/resumen/ObraResumenContainer';
import LegajoSection from './Legajo/LegajoSection';
import type { Seleccion } from '@/components/cliente/SubgrupoAccordion';
import { elementos } from '@/lib/elementos-vivienda';
import { ElementoSeleccionado, ExpansorElementos } from '@/lib/services/expansorElementos';
import { ModalSeleccionCantidad } from './modals/ModalSeleccionCantidad';

export interface LegajoDocumento {
  id: string;
  nombre: string;
  categoria: 'planos' | 'permisos' | 'contratos' | 'seguridad' | 'otros';
  responsable: string;
  fechaSubida: string;
  estado: 'pendiente' | 'aprobado' | 'observado';
}

interface Obra {
  id: string;
  nombre: string;
  cliente: string;
  tipoObra: 'nueva' | 'reforma' | 'ampliacion';
  fechaInicio: string;
  fechaFin?: string;
  descripcion?: string;
  numeroPermiso?: string;
  progreso: number;
  tareasActivas: number;
  tareasCompletadas: number;
  estado: 'activa' | 'pausada' | 'finalizada';
  legajoTecnico: LegajoDocumento[];
}

interface Tarea {
  id: string;
  nombre: string;
  obraId: string;
  lider: string;
  fechaInicio: string;
  fechaFin: string;
  plantilla: string;
  checklist: string[];
  evidencias: string[];
  estado: 'pendiente' | 'en_progreso' | 'completada' | 'bloqueada';
  etapa: 'estructura' | 'obra_gris' | 'terminaciones';
  precedencia: string[];
  duracion: number; // duración en días
  esCritica: boolean; // si está en el camino crítico
  tiempoTemprano: number; // tiempo de inicio temprano
  tiempoTardio: number; // tiempo de inicio tardío
}

interface DetalleObraProps {
  obra: Obra;
  tareas: Tarea[];
  onVolver: () => void;
  onActualizarTarea: (tarea: Tarea) => void;
  onCrearTarea: (tarea: Omit<Tarea, 'id' | 'estado' | 'evidencias'>) => void;
  onCrearTareas?: (tareas: Omit<Tarea, 'id' | 'estado' | 'evidencias'>[]) => void; // Agregar esta línea
  onEliminarTarea: (tareaId: string) => void;
  onActualizarObra: (obra: Obra) => void;
  tabInicial?: 'resumen' | 'elementos' | 'legajo'; // Tab inicial cuando se abre el detalle
}

type PlantaResumen = {
  id: string;
  nombre: string;
  metrosCubiertos?: number;
  metrosDescubiertos?: number;
  metrosTotales?: number;
  orden?: number;
};

const FALLBACK_PLANTAS: PlantaResumen[] = [
  {
    id: 'general',
    nombre: 'General / Sin asignar',
    metrosCubiertos: 0,
    metrosDescubiertos: 0,
    metrosTotales: 0,
    orden: 1,
  },
];

// Obra demo: no llamar API, usar plantas mock para el video
const DEMO_OBRA_ID = 'demo-obra-1-casa-familiar';
const MOCK_PLANTAS_DEMO: PlantaResumen[] = [
  { id: 'PB', nombre: 'Planta Baja', metrosCubiertos: 95, metrosDescubiertos: 25, metrosTotales: 120, orden: 1 },
  { id: 'P1', nombre: 'Primer Piso', metrosCubiertos: 85, metrosDescubiertos: 15, metrosTotales: 100, orden: 2 },
];

const etapas = [
  { key: 'estructura', nombre: 'Estructura', color: 'bg-blue-100 text-blue-800', icon: Building },
  { key: 'obra_gris', nombre: 'Obra Gris', color: 'bg-gray-100 text-gray-800', icon: Wrench },
  { key: 'terminaciones', nombre: 'Terminaciones', color: 'bg-green-100 text-green-800', icon: Paintbrush }
];

// Iconos para las categorías de elementos
const iconosCategorias = {
  'Fundaciones y Estructuras': Building,
  'Muros': Home,
  'Pisos': Home,
  'Cubiertas': Home,
  'Escaleras': Home,
  'Carpinterías': Wrench
};

const lideresDisponibles = [
  'Juan Pérez',
  'María López',
  'Carlos Rodríguez',
  'Ana García',
  'Pedro Martínez'
];

export function DetalleObra({ 
  obra, 
  tareas, 
  onVolver, 
  onActualizarTarea, 
  onCrearTarea, 
  onCrearTareas, // Agregar esta línea
  onEliminarTarea, 
  onActualizarObra,
  tabInicial = 'resumen'
}: DetalleObraProps) {
  const router = useRouter();
  const [showModalTarea, setShowModalTarea] = useState(false);
  const [etapaSeleccionada, setEtapaSeleccionada] = useState<'estructura' | 'obra_gris' | 'terminaciones'>('estructura');
  const [vistaActual, setVistaActual] = useState<'elementos' | 'tareas' | 'legajo' | 'resumen'>(tabInicial);
  const [plantaFiltroLegajo, setPlantaFiltroLegajo] = useState<string | undefined>(undefined);
  const [vistaTareas, setVistaTareas] = useState<'lista' | 'timeline' | 'editor'>('editor');
  const [tareaEditando, setTareaEditando] = useState<Tarea | null>(null);
  const [gestionObraMinimizada, setGestionObraMinimizada] = useState(false);
  const [seleccionesElementos, setSeleccionesElementos] = useState<Seleccion[]>([]);

  // Resetear filtro de planta cuando cambia la vista (opcional, si querés mantenerlo entre vistas)
  
  // Estados para la carga de elementos
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [elementosCarrito, setElementosCarrito] = useState<ElementoSeleccionado[]>([]);
  const [showModalCantidad, setShowModalCantidad] = useState(false);
  const [elementoParaModal, setElementoParaModal] = useState<any>(null);
  const [tareasCreadas, setTareasCreadas] = useState<any[]>([]);
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [plantasObra, setPlantasObra] = useState<PlantaResumen[]>(FALLBACK_PLANTAS);
  
  // Estados para el modal de edición
  const [showModalEditar, setShowModalEditar] = useState(false);
  const [formData, setFormData] = useState<{
    nombre: string;
    cliente: string;
    tipoObra: string;
    localizacion: string;
    plantas: number;
    terreno: number;
    superficies: { planta: number; cubiertos: number; descubiertos: number }[];
    fecha_inicio_estimada?: string;
  }>({
    nombre: obra.nombre,
    cliente: obra.cliente,
    tipoObra: obra.tipoObra,
    localizacion: (obra as any).localizacion || '',
    plantas: (obra as any).plantas || 1,
    terreno: (obra as any).terreno || 0,
    superficies: (obra as any).superficies || [{ planta: 1, cubiertos: 0, descubiertos: 0 }],
    fecha_inicio_estimada: (obra as any).fecha_inicio_estimada || undefined
  });

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completada':
        return 'bg-green-100 text-green-800';
      case 'en_progreso':
        return 'bg-blue-100 text-blue-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'bloqueada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'completada':
        return <CheckCircle className="h-4 w-4" />;
      case 'en_progreso':
        return <Play className="h-4 w-4" />;
      case 'pendiente':
        return <Clock className="h-4 w-4" />;
      case 'bloqueada':
        return <Pause className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Algoritmo CPM para calcular camino crítico
  const calcularCaminoCritico = (tareasEtapa: Tarea[]) => {
    const tareas = [...tareasEtapa];
    
    // Inicializar tiempos
    tareas.forEach(tarea => {
      tarea.tiempoTemprano = 0;
      tarea.tiempoTardio = 0;
      tarea.esCritica = false;
    });

    // Calcular tiempos tempranos (forward pass)
    const calcularTiemposTempranos = (tarea: Tarea) => {
      if (tarea.tiempoTemprano > 0) return tarea.tiempoTemprano;
      
      let maxTiempoPrecedencia = 0;
      tarea.precedencia.forEach(idPrecedencia => {
        const tareaPrecedencia = tareas.find(t => t.id === idPrecedencia);
        if (tareaPrecedencia) {
          const tiempoPrecedencia = calcularTiemposTempranos(tareaPrecedencia);
          maxTiempoPrecedencia = Math.max(maxTiempoPrecedencia, tiempoPrecedencia + tareaPrecedencia.duracion);
        }
      });
      
      tarea.tiempoTemprano = maxTiempoPrecedencia;
      return tarea.tiempoTemprano;
    };

    // Calcular tiempos tardíos (backward pass)
    const calcularTiemposTardios = (tarea: Tarea) => {
      if (tarea.tiempoTardio > 0) return tarea.tiempoTardio;
      
      // Encontrar tareas que dependen de esta
      const tareasDependientes = tareas.filter(t => t.precedencia.includes(tarea.id));
      
      if (tareasDependientes.length === 0) {
        // Tarea final
        tarea.tiempoTardio = tarea.tiempoTemprano;
      } else {
        // Tiempo tardío = mínimo tiempo temprano de las dependientes - duración
        let minTiempoDependiente = Infinity;
        tareasDependientes.forEach(tareaDep => {
          const tiempoDep = calcularTiemposTardios(tareaDep);
          minTiempoDependiente = Math.min(minTiempoDependiente, tiempoDep);
        });
        tarea.tiempoTardio = minTiempoDependiente - tarea.duracion;
      }
      
      return tarea.tiempoTardio;
    };

    // Ejecutar cálculos
    tareas.forEach(calcularTiemposTempranos);
    tareas.forEach(calcularTiemposTardios);

    // Identificar camino crítico
    tareas.forEach(tarea => {
      tarea.esCritica = tarea.tiempoTemprano === tarea.tiempoTardio;
    });

    return tareas;
  };

  // Obtener tiempo total del proyecto
  const obtenerTiempoTotalProyecto = (tareasEtapa: Tarea[]) => {
    const tareasConCPM = calcularCaminoCritico(tareasEtapa);
    return Math.max(...tareasConCPM.map(t => t.tiempoTemprano + t.duracion));
  };

  const cambiarEstadoTarea = (tarea: Tarea, nuevoEstado: Tarea['estado']) => {
    const tareaActualizada = { ...tarea, estado: nuevoEstado };
    onActualizarTarea(tareaActualizada);
  };

  const puedeCrearTarea = (etapa: string) => {
    // Siempre se puede crear tareas en cualquier etapa
    // La precedencia se maneja a nivel individual de tarea
    return true;
  };

  const tareasPorEtapa = (etapa: string) => {
    console.log('🔍 Filtrando tareas por etapa:', etapa);
    console.log('📋 Tareas disponibles:', tareas);
    console.log('📊 Etapas de las tareas:', tareas.map(t => ({ id: t.id, nombre: t.nombre, etapa: t.etapa })));
    
    const tareasFiltradas = tareas.filter(t => t.etapa === etapa);
    console.log('✅ Tareas filtradas para etapa', etapa, ':', tareasFiltradas);
    
    return tareasFiltradas.sort((a, b) => {
      // Ordenar por precedencia
      if (a.precedencia.includes(b.id)) return 1;
      if (b.precedencia.includes(a.id)) return -1;
      return 0;
    });
  };

  const handleCrearTarea = (nuevaTarea: Omit<Tarea, 'id' | 'estado' | 'evidencias'>) => {
    onCrearTarea({
      ...nuevaTarea,
      etapa: etapaSeleccionada
    });
    setShowModalTarea(false);
  };

  const handleCrearTareas = (nuevasTareas: Omit<Tarea, 'id' | 'estado' | 'evidencias'>[]) => {
    console.log('📝 handleCrearTareas llamado con:', nuevasTareas.length, 'tareas');
    
    if (onCrearTareas) {
      // Usar la función optimizada para múltiples tareas
      onCrearTareas(nuevasTareas.map(tarea => ({
        ...tarea,
        etapa: etapaSeleccionada
      })));
    } else {
      // Fallback: crear una por una
      nuevasTareas.forEach(tarea => {
        onCrearTarea({
          ...tarea,
          etapa: etapaSeleccionada
        });
      });
    }
    
    setShowModalTarea(false);
  };

  const handleUploadLegajo = async (archivos: File[]) => {
    const nuevosDocumentos: LegajoDocumento[] = archivos.map((archivo, index) => ({
      id: `${obra.id}-${Date.now()}-${index}`,
      nombre: archivo.name,
      categoria: 'otros',
      responsable: 'Por asignar',
      fechaSubida: new Date().toISOString(),
      estado: 'pendiente'
    }));

    const obraActualizada = {
      ...obra,
      legajoTecnico: [...obra.legajoTecnico, ...nuevosDocumentos]
    };

    onActualizarObra(obraActualizada);
  };

  useEffect(() => {
    let mounted = true;

    async function fetchPlantas() {
      // Demo video: no llamar API, usar plantas mock
      if (obra.id === DEMO_OBRA_ID) {
        setPlantasObra(MOCK_PLANTAS_DEMO);
        return;
      }

      try {
        const response = await fetch(`/api/obras/${obra.id}/plantas`);
        if (!response.ok) {
          throw new Error(`Status ${response.status}`);
        }
        const payload = await response.json();
        if (!mounted) return;

        const data = Array.isArray(payload?.data) ? payload.data : [];
        if (!data.length) {
          setPlantasObra(FALLBACK_PLANTAS);
          return;
        }

        const normalizadas: PlantaResumen[] = data.map((item: any, index: number) => {
          const orden = Number(
            item?.orden ?? item?.planta ?? item?.numero ?? item?.idx ?? index + 1,
          );
          const metrosCubiertos = Number(
            item?.metrosCubiertos ?? item?.metros_cubiertos ?? item?.cubiertos ?? 0,
          );
          const metrosDescubiertos = Number(
            item?.metrosDescubiertos ??
              item?.metros_descubiertos ??
              item?.descubiertos ??
              0,
          );
          const metrosTotales = Number(
            item?.metrosTotales ??
              item?.metros_totales ??
              item?.total ??
              metrosCubiertos + metrosDescubiertos,
          );

          return {
            id: String(item?.id ?? orden ?? index + 1),
            nombre:
              item?.nombre ??
              item?.label ??
              item?.alias ??
              item?.rotulo ??
              `Planta ${orden || index + 1}`,
            metrosCubiertos: Number.isFinite(metrosCubiertos) ? metrosCubiertos : 0,
            metrosDescubiertos: Number.isFinite(metrosDescubiertos)
              ? metrosDescubiertos
              : 0,
            metrosTotales: Number.isFinite(metrosTotales)
              ? metrosTotales
              : metrosCubiertos + metrosDescubiertos,
            orden: Number.isFinite(orden) ? orden : index + 1,
          };
        });

        normalizadas.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
        setPlantasObra(normalizadas);
      } catch (error) {
        console.error('[DETALLE_OBRA] Error cargando plantas de la obra:', error);
        if (mounted) {
          setPlantasObra(FALLBACK_PLANTAS);
        }
      } finally {
        // noop
      }
    }

    fetchPlantas();
    return () => {
      mounted = false;
    };
  }, [obra.id]);

  const handleDeleteDocumento = (documentoId: string) => {
    const obraActualizada = {
      ...obra,
      legajoTecnico: obra.legajoTecnico.filter(doc => doc.id !== documentoId)
    };

    onActualizarObra(obraActualizada);
  };

  const handleUpdateDocumento = (documentoId: string, updates: Partial<LegajoDocumento>) => {
    const obraActualizada = {
      ...obra,
      legajoTecnico: obra.legajoTecnico.map(doc => 
        doc.id === documentoId ? { ...doc, ...updates } : doc
      )
    };

    onActualizarObra(obraActualizada);
  };

﻿  const esUUID = (valor: string | null | undefined): valor is string => {
    if (typeof valor !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(valor);
  };

  const normalizarUnidadMedida = (unidad: string | null | undefined) => {
    if (!unidad) return 'unidad';
    const lower = unidad.toLowerCase();
    if (lower.includes('m2') || lower.includes('m²')) return 'm²';
    if (lower.includes('m3') || lower.includes('m³')) return 'm³';
    if (lower.includes('ml')) return 'ml';
    if (lower.includes('kg')) return 'kg';
    if (lower.includes('l')) return 'l';
    return 'unidad';
  };

  const normalizarFaseBackend = (fase: string | undefined) => {
    switch (fase) {
      case 'estructura':
        return 'ESTRUCTURA';
      case 'obra_gris':
      case 'obra gris':
        return 'OBRA_GRIS';
      case 'terminaciones':
        return 'TERMINACIONES';
      default:
        return 'ESTRUCTURA';
    }
  };

  const inferirEtapaPrincipal = (categoria: string, tipo: string) => {
    const categoriaInfo = elementos.find(cat => cat.categoria === categoria);
    const tipoInfo = categoriaInfo?.tipos.find(t => t.nombre === tipo);
    if (!tipoInfo) return 'ESTRUCTURA';
    if (tipoInfo.fases.estructura.length > 0) return 'ESTRUCTURA';
    if (tipoInfo.fases.obra_gris.length > 0) return 'OBRA_GRIS';
    if (tipoInfo.fases.terminaciones.length > 0) return 'TERMINACIONES';
    return 'ESTRUCTURA';
  };

  const construirDescripcionTarea = (tareaElemento: any) => {
    const origen = tareaElemento.elementoOrigen || {};
    const cantidad = origen.cantidad ?? tareaElemento.cantidad ?? 0;
    const unidad = normalizarUnidadMedida(origen.unidad || tareaElemento.unidad);
    const tipo = origen.tipo || 'Elemento';
    return tareaElemento.nombre + ' - ' + tipo + ' (' + cantidad + ' ' + unidad + ')';
  };

  const extraerDetalleError = async (response: Response) => {
    try {
      const data = await response.clone().json();
      if (typeof data === 'string') return data;
      if (data?.error) return data.error;
      if (data?.message) return data.message;
      return 'Error ' + response.status;
    } catch {
      try {
        const text = await response.text();
        return text || 'Error ' + response.status;
      } catch {
        return 'Error ' + response.status;
      }
    }
  };

  const handleCrearTareasDesdeElementos = async (tareasElementos: any[]) => {
    const elementosSeleccionados = [...elementosCarrito];
    const headersBase: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-organizacion-id': 'demo-org',
      'x-usuario-id': 'user-demo',
    };

    const sincronizarConBackend = esUUID(obra.id);
    const elementosBackend = new Map<string, string>();
    const erroresSincronizacion: string[] = [];

    if (sincronizarConBackend && elementosSeleccionados.length > 0) {
      for (const elemento of elementosSeleccionados) {
        const key = `${elemento.categoria}|${elemento.tipo}`;
        if (elementosBackend.has(key)) {
          continue;
        }

        const payloadElemento = {
          nombre: elemento.tipo,
          categoria: elemento.categoria,
          etapaPrincipal: inferirEtapaPrincipal(elemento.categoria, elemento.tipo),
          unidad: normalizarUnidadMedida(elemento.unidad),
          cantidad: elemento.cantidad,
        };

        try {
          const response = await fetch(`/api/obras/${obra.id}/elementos`, {
            method: 'POST',
            headers: headersBase,
            body: JSON.stringify(payloadElemento),
          });

          if (!response.ok) {
            erroresSincronizacion.push('Elemento "' + elemento.tipo + '": ' + await extraerDetalleError(response));
            continue;
          }

          const data = await response.json().catch(() => null) as { data?: { id?: string }; id?: string } | null;
          const elementoId = data?.data?.id ?? data?.id;

          if (elementoId) {
            elementosBackend.set(key, String(elementoId));
          } else {
            erroresSincronizacion.push('Elemento "' + elemento.tipo + '": respuesta sin identificador.');
          }
        } catch (error) {
          erroresSincronizacion.push('Elemento "' + elemento.tipo + '": ' + (error as Error).message);
        }
      }
    } else if (!sincronizarConBackend) {
      console.warn('Sincronización con backend omitida: la obra no posee un UUID válido. Se mantendrán solo en memoria.');
    }

    const ahora = new Date();

    const tareasParaEstadoLocal = tareasElementos.map((tareaElemento) => {
      const fechaFin = new Date(ahora.getTime() + (tareaElemento.tiempoEstimado || 7) * 24 * 60 * 60 * 1000);
      return {
        nombre: tareaElemento.nombre,
        obraId: obra.id,
        lider: 'Por asignar',
        fechaInicio: ahora.toISOString().split('T')[0],
        fechaFin: fechaFin.toISOString().split('T')[0],
        plantilla: 'elemento',
        checklist: ['Revisar especificaciones', 'Ejecutar tarea', 'Verificar calidad'],
        etapa: tareaElemento.fase,
        precedencia: [],
        duracion: tareaElemento.tiempoEstimado || 7,
        esCritica: false,
        tiempoTemprano: 0,
        tiempoTardio: 0,
      };
    });

    handleCrearTareas(tareasParaEstadoLocal);

    if (sincronizarConBackend && elementosBackend.size > 0) {
      for (const tareaElemento of tareasElementos) {
        const key = `${tareaElemento.elementoOrigen?.categoria}|${tareaElemento.elementoOrigen?.tipo}`;
        const elementoId = key ? elementosBackend.get(key) : undefined;

        if (!elementoId) {
          erroresSincronizacion.push('Tarea "' + tareaElemento.nombre + '": no se pudo asociar el elemento creado.');
          continue;
        }

        const payloadTarea = {
          elementoId,
          plantillaTareaId: undefined,
          nombre: tareaElemento.nombre,
          descripcion: construirDescripcionTarea(tareaElemento),
          etapa: normalizarFaseBackend(tareaElemento.fase),
          cantidad: tareaElemento.cantidad,
          unidad: normalizarUnidadMedida(tareaElemento.unidad),
          duracionEstimada: Math.max(1, Math.round(tareaElemento.tiempoEstimado || 1)),
        };

        try {
          const response = await fetch('/api/tareas', {
            method: 'POST',
            headers: headersBase,
            body: JSON.stringify(payloadTarea),
          });

          if (!response.ok) {
            erroresSincronizacion.push('Tarea "' + tareaElemento.nombre + '": ' + await extraerDetalleError(response));
          }
        } catch (error) {
          erroresSincronizacion.push('Tarea "' + tareaElemento.nombre + '": ' + (error as Error).message);
        }
      }
    }

    return erroresSincronizacion;
  };


  // Funciones para la carga de elementos
  const getCategoriaSeleccionada = () => {
    return elementos.find(e => e.categoria === categoriaSeleccionada);
  };

  const handleSeleccionarTipo = (tipo: any) => {
    setElementoParaModal({
      categoria: categoriaSeleccionada,
      tipo: tipo.nombre,
      fases: tipo.fases
    });
    setShowModalCantidad(true);
  };

  const handleConfirmarCantidad = (cantidad: number, unidad: 'm²' | 'm³' | 'unidad') => {
    if (elementoParaModal) {
      const nuevoElemento: ElementoSeleccionado = {
        id: `${elementoParaModal.categoria}-${elementoParaModal.tipo}-${Date.now()}`,
        categoria: elementoParaModal.categoria,
        tipo: elementoParaModal.tipo,
        cantidad,
        unidad
      };
      
      setElementosCarrito(prev => [...prev, nuevoElemento]);
      setShowModalCantidad(false);
      setElementoParaModal(null);
    }
  };

  const handleEliminarElemento = (id: string) => {
    setElementosCarrito(prev => prev.filter(e => e.id !== id));
  };

  const handleConfirmarCarrito = async () => {
    try {
      if (elementosCarrito.length === 0) {
        alert('Selecciona al menos un elemento antes de generar tareas.');
        return;
      }

      const tareasGeneradas = ExpansorElementos.expandirElementos(elementosCarrito);

      if (tareasGeneradas.length === 0) {
        alert('No se pudieron generar tareas. Verifica que los elementos seleccionados sean válidos.');
        return;
      }

      setTareasCreadas(tareasGeneradas);
      setMostrarResultado(true);

      const errores = await handleCrearTareasDesdeElementos(tareasGeneradas);

      if (errores.length > 0) {
        console.warn('Sincronización parcial de tareas:', errores);
        alert('Las tareas se agregaron a la vista, pero algunas no pudieron sincronizarse con el backend. Revisa la consola para más detalles.');
      }
    } catch (error) {
      console.error('Error al expandir elementos:', error);
      alert(`Error al procesar elementos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  };
;

  const handleVolverAElementos = () => {
    setMostrarResultado(false);
    setTareasCreadas([]);
    setElementosCarrito([]);
  };

  const getTotalTareas = () => {
    return elementosCarrito.reduce((total, elemento) => {
      const categoriaElemento = elementos.find(cat => cat.categoria === elemento.categoria);
      const tipoElemento = categoriaElemento?.tipos.find(tipo => tipo.nombre === elemento.tipo);
      if (tipoElemento) {
        return total + tipoElemento.fases.estructura.length + tipoElemento.fases.obra_gris.length + tipoElemento.fases.terminaciones.length;
      }
      return total;
    }, 0);
  };

  // Funciones para el modal de edición
  const handleAbrirModalEditar = () => {
    setFormData({
      nombre: obra.nombre,
      cliente: obra.cliente,
      tipoObra: obra.tipoObra,
      localizacion: (obra as any).localizacion || '',
      plantas: (obra as any).plantas || 1,
      terreno: (obra as any).terreno || 0,
      superficies: (obra as any).superficies || [{ planta: 1, cubiertos: 0, descubiertos: 0 }],
      fecha_inicio_estimada: (obra as any).fecha_inicio_estimada || undefined
    });
    setShowModalEditar(true);
  };

  const handleCerrarModalEditar = () => {
    setShowModalEditar(false);
  };

  const handleGuardarCambios = () => {
    const obraActualizada = {
      ...obra,
      ...formData
    } as any;
    onActualizarObra(obraActualizada);
    setShowModalEditar(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen" style={{backgroundColor: '#eaf0f6'}}>
      <div className="max-w-7xl mx-auto p-3 md:p-4 lg:p-6">
        {/* Header Principal */}
        <div className="rounded-xl shadow-sm border mb-4 md:mb-6" style={{backgroundColor: '#E6F2FF', borderColor: '#B3D9FF'}}>
          <div className="px-3 md:px-4 lg:px-6 py-4 md:py-5 lg:py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">
              <div className="flex items-center space-x-2 md:space-x-4 min-w-0 flex-1">
                <button
                  onClick={onVolver}
                  className="p-2 rounded-lg transition-all duration-300 ease-in-out"
                  style={{color: '#5b5f6a'}}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f7fa';
                    e.currentTarget.style.color = '#1B263B';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#5b5f6a';
                  }}
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg md:text-xl lg:text-2xl font-bold truncate" style={{color: '#1B263B'}}>
                    {obra.cliente ? obra.cliente.toUpperCase() : 'SIN CLIENTE'} {obra.tipoObra ? `(${obra.tipoObra})` : ''}
                  </h1>
                  <div className="flex flex-col md:flex-row md:items-center md:space-x-3 lg:space-x-4 gap-1 md:gap-0 mt-2 text-xs md:text-sm" style={{color: '#4a4e57'}}>
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                      <span className="truncate">Cliente: {obra.cliente || 'No especificado'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Building className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                      <span className="truncate">Tipo: {obra.tipoObra ? obra.tipoObra.charAt(0).toUpperCase() + obra.tipoObra.slice(1) : 'No especificado'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                      <span>Inicio: {new Date(obra.fechaInicio).toLocaleDateString('es-AR')}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-3 md:gap-4 flex-shrink-0">
                <div className="text-right md:text-left">
                  <div className="text-xl md:text-2xl lg:text-3xl font-bold" style={{color: '#1B263B'}}>{obra.progreso}%</div>
                  <div className="text-xs md:text-sm" style={{color: '#5b5f6a'}}>Progreso General</div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={handleAbrirModalEditar}
                    className="flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-2 rounded-lg font-medium transition-all duration-300 ease-in-out text-xs md:text-sm"
                    style={{backgroundColor: '#1B263B', color: 'white'}}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#162033';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#1B263B';
                    }}
                  >
                    <Edit3 className="h-3 w-3 md:h-4 md:w-4" />
                    <span className="hidden md:inline">Editar información</span>
                    <span className="md:hidden">Editar</span>
                  </button>
                  <button className="p-2 rounded-lg transition-all duration-300 ease-in-out" style={{color: '#5b5f6a'}} onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f7fa';
                    e.currentTarget.style.color = '#1B263B';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#5b5f6a';
                  }}>
                    <Download className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs de Navegación */}
        <div className="rounded-xl shadow-sm border mb-4 md:mb-6" style={{backgroundColor: 'white', borderColor: '#dce3ea'}}>
          <div style={{borderBottomColor: '#dce3ea'}} className="border-b">
            <nav className="flex space-x-2 md:space-x-4 lg:space-x-8 px-3 md:px-4 lg:px-6 overflow-x-auto scrollbar-hide">
              {[
                { key: 'resumen', label: 'Resumen', icon: BarChart3 },
                { key: 'elementos', label: 'Elementos', icon: Layers },
                { key: 'legajo', label: 'Legajo', icon: FileText },
                { key: 'tareas', label: 'Tareas', icon: ClipboardList, isAction: true }
              ].map(({ key, label, icon: Icon, isAction }) => (
                <button
                  key={key}
                  onClick={() => {
                    if (isAction) {
                      router.push(`/cliente/dashboard?section=tareas&obraId=${obra.id}` as Route);
                    } else {
                      setVistaActual(key as any);
                    }
                  }}
                  className={`flex items-center space-x-1 md:space-x-2 py-3 md:py-4 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm transition-all duration-300 ease-in-out flex-shrink-0 ${
                    vistaActual === key
                      ? 'border-b-2'
                      : 'border-transparent'
                  }`}
                  style={{
                    borderBottomColor: vistaActual === key ? '#0066FF' : 'transparent',
                    color: vistaActual === key ? '#0066FF' : '#5b5f6a'
                  }}
                  onMouseEnter={(e) => {
                    if (vistaActual !== key) {
                      e.currentTarget.style.color = '#0066FF';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (vistaActual !== key) {
                      e.currentTarget.style.color = '#5b5f6a';
                    }
                  }}
                >
                  <Icon className="h-3 w-3 md:h-4 md:w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Contenido de las Tabs */}
        <div className="rounded-xl shadow-sm border" style={{backgroundColor: 'white', borderColor: '#dce3ea'}}>
          {/* Tab: Resumen */}
          {vistaActual === 'resumen' && (
            <div className="p-0">
              <ObraResumenContainer
                obra={obra}
                tareas={tareas}
                plantas={plantasObra?.length ? plantasObra : FALLBACK_PLANTAS}
                onEditarInfo={() => {}}
                onVerDetallePlanta={(plantaId) => {
                  console.log('Ver detalle de planta', plantaId);
                  // TODO: Implementar navegación a vista de planta específica
                }}
                onAbrirElementos={(plantaId) => {
                  // Navegar a la pestaña de elementos
                  setVistaActual('elementos');
                  // TODO: Filtrar elementos por planta si es necesario
                }}
                onAbrirLegajo={(plantaId) => {
                  // Navegar a la pestaña de legajo y filtrar por planta
                  setVistaActual('legajo');
                  setPlantaFiltroLegajo(plantaId);
                }}
              />
            </div>
          )}

          {/* Tab: Elementos */}
          {vistaActual === 'elementos' && (
            <div className="p-0">
              <CargaElementosPanel
                obraId={obra.id}
                plantas={(plantasObra?.length ? plantasObra : FALLBACK_PLANTAS).map((planta) => ({
                  id: planta.id,
                  nombre: planta.nombre,
                }))}
              />
            </div>
          )}


          {/* Tab: Legajo */}
          {vistaActual === 'legajo' && (
            <div className="p-6">
              <LegajoSection obraId={obra.id} />
            </div>
          )}
        </div>

        {/* Modal Editar Información */}
        {showModalEditar && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 md:p-4">
            <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold" style={{color: '#1B263B'}}>Editar información de obra</h2>
                  <button
                    onClick={handleCerrarModalEditar}
                    className="p-2 rounded-lg transition-all duration-300 ease-in-out"
                    style={{color: '#5b5f6a'}}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f5f7fa';
                      e.currentTarget.style.color = '#1B263B';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#5b5f6a';
                    }}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: '#1B263B'}}>Nombre de obra</label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => handleInputChange('nombre', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg transition-all duration-300 ease-in-out"
                      style={{borderColor: '#d3dae3', backgroundColor: '#ffffff'}}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#1B263B';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d3dae3';
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: '#1B263B'}}>Dirección</label>
                    <input
                      type="text"
                      value={formData.localizacion}
                      onChange={(e) => handleInputChange('localizacion', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg transition-all duration-300 ease-in-out"
                      style={{borderColor: '#d3dae3', backgroundColor: '#ffffff'}}
                      placeholder="Calle, número, ciudad"
                      onFocus={(e) => {
                        e.target.style.borderColor = '#1B263B';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d3dae3';
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: '#1B263B'}}>Cliente</label>
                    <input
                      type="text"
                      value={formData.cliente}
                      onChange={(e) => handleInputChange('cliente', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg transition-all duration-300 ease-in-out"
                      style={{borderColor: '#d3dae3', backgroundColor: '#ffffff'}}
                      placeholder="Nombre y apellido"
                      onFocus={(e) => {
                        e.target.style.borderColor = '#1B263B';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d3dae3';
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: '#1B263B'}}>Tipo de proyecto</label>
                    <select
                      value={formData.tipoObra}
                      onChange={(e) => handleInputChange('tipoObra', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg transition-all duration-300 ease-in-out"
                      style={{borderColor: '#d3dae3', backgroundColor: '#ffffff'}}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#1B263B';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d3dae3';
                      }}
                    >
                      <option value="Casa familiar">Casa familiar</option>
                      <option value="Ampliación">Ampliación</option>
                      <option value="Reforma">Reforma</option>
                      <option value="Local comercial">Local comercial</option>
                      <option value="Edificio pequeño">Edificio pequeño</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: '#1B263B'}}>
                      Fecha de inicio estimada
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={formData.fecha_inicio_estimada || ''}
                      onChange={(e) => {
                        const selectedDate = e.target.value;
                        const today = new Date().toISOString().split('T')[0];
                        
                        if (selectedDate && selectedDate < today) {
                          return;
                        }
                        
                        setFormData(prev => ({ ...prev, fecha_inicio_estimada: selectedDate || undefined }));
                      }}
                      className="w-full px-3 py-2 border rounded-lg transition-all duration-300 ease-in-out"
                      style={{borderColor: '#d3dae3', backgroundColor: '#ffffff'}}
                      placeholder="Seleccioná la fecha estimada de inicio"
                      onFocus={(e) => {
                        e.target.style.borderColor = '#1B263B';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#d3dae3';
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{color: '#1B263B'}}>Cantidad de plantas</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={formData.plantas}
                        onChange={(e) => {
                          const plantas = parseInt(e.target.value) || 1;
                          const plantasValidas = Math.max(1, Math.min(5, plantas));
                          const nuevasSuperficies = Array.from({ length: plantasValidas }, (_, i) => {
                            const index = i;
                            return formData.superficies[index] || { planta: index + 1, cubiertos: 0, descubiertos: 0 };
                          });
                          setFormData(prev => ({
                            ...prev,
                            plantas: plantasValidas,
                            superficies: nuevasSuperficies
                          }));
                        }}
                        className="w-full px-3 py-2 border rounded-lg transition-all duration-300 ease-in-out"
                        style={{borderColor: '#d3dae3', backgroundColor: '#ffffff'}}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#1B263B';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d3dae3';
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{color: '#1B263B'}}>Terreno (m²)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.terreno}
                        onChange={(e) => {
                          const terreno = parseFloat(e.target.value) || 0;
                          setFormData(prev => ({ ...prev, terreno }));
                        }}
                        className="w-full px-3 py-2 border rounded-lg transition-all duration-300 ease-in-out"
                        style={{borderColor: '#d3dae3', backgroundColor: '#ffffff'}}
                        placeholder="0"
                        onFocus={(e) => {
                          e.target.style.borderColor = '#1B263B';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#d3dae3';
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{color: '#1B263B'}}>Superficies por planta (m²)</label>
                    <div className="space-y-3">
                      {formData.superficies.map((superficie: { planta: number; cubiertos: number; descubiertos: number }, index: number) => (
                        <div key={index} className="grid grid-cols-3 gap-3 p-3 border rounded-lg" style={{borderColor: '#d3dae3', backgroundColor: '#f9fafb'}}>
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{color: '#5b5f6a'}}>Planta {superficie.planta}</label>
                            <div className="text-sm font-semibold" style={{color: '#1B263B'}}>{superficie.planta}</div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{color: '#5b5f6a'}}>Cubiertos (m²)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={superficie.cubiertos}
                              onChange={(e) => {
                                const cubiertos = parseFloat(e.target.value) || 0;
                                const nuevasSuperficies = [...formData.superficies];
                                nuevasSuperficies[index] = { ...superficie, cubiertos };
                                setFormData(prev => ({ ...prev, superficies: nuevasSuperficies }));
                              }}
                              className="w-full px-2 py-1 text-sm border rounded"
                              style={{borderColor: '#d3dae3', backgroundColor: '#ffffff'}}
                              placeholder="0"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium mb-1" style={{color: '#5b5f6a'}}>Descubiertos (m²)</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={superficie.descubiertos}
                              onChange={(e) => {
                                const descubiertos = parseFloat(e.target.value) || 0;
                                const nuevasSuperficies = [...formData.superficies];
                                nuevasSuperficies[index] = { ...superficie, descubiertos };
                                setFormData(prev => ({ ...prev, superficies: nuevasSuperficies }));
                              }}
                              className="w-full px-2 py-1 text-sm border rounded"
                              style={{borderColor: '#d3dae3', backgroundColor: '#ffffff'}}
                              placeholder="0"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t" style={{borderTopColor: '#dce3ea'}}>
                  <button
                    onClick={handleCerrarModalEditar}
                    className="px-4 py-2 rounded-lg font-medium transition-all duration-300 ease-in-out"
                    style={{backgroundColor: '#f5f7fa', color: '#1B263B', border: '1px solid #dce3ea'}}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e8ecf0';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f5f7fa';
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleGuardarCambios}
                    className="px-4 py-2 rounded-lg font-medium transition-all duration-300 ease-in-out"
                    style={{backgroundColor: '#1B263B', color: 'white'}}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#162033';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#1B263B';
                    }}
                  >
                    Guardar cambios
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

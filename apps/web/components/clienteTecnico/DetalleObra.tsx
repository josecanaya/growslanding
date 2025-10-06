'use client';

import { useState } from 'react';
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
  Download
} from 'lucide-react';
import { ModalCrearTarea } from './modals/ModalCrearTarea';
// import { LegajoTecnicoSection } from './LegajoTecnicoSection';
import { EditorVisualTareas } from './EditorVisualTareas';
import { CargaElementosSection } from './CargaElementosSection';
import { elementos } from '@/lib/elementos-vivienda';
import { ElementoSeleccionado, ExpansorElementos } from '@/lib/services/expansorElementos';
import { ModalSeleccionCantidad } from './modals/ModalSeleccionCantidad';

interface LegajoDocumento {
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
}

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
  onActualizarObra 
}: DetalleObraProps) {
  const [showModalTarea, setShowModalTarea] = useState(false);
  const [etapaSeleccionada, setEtapaSeleccionada] = useState<'estructura' | 'obra_gris' | 'terminaciones'>('estructura');
  const [vistaActual, setVistaActual] = useState<'elementos' | 'tareas' | 'legajo' | 'resumen'>('resumen'); // Cambio: resumen primero
  const [vistaTareas, setVistaTareas] = useState<'lista' | 'timeline' | 'editor'>('editor');
  const [tareaEditando, setTareaEditando] = useState<Tarea | null>(null);
  const [gestionObraMinimizada, setGestionObraMinimizada] = useState(false);
  
  // Estados para la carga de elementos
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [elementosCarrito, setElementosCarrito] = useState<ElementoSeleccionado[]>([]);
  const [showModalCantidad, setShowModalCantidad] = useState(false);
  const [elementoParaModal, setElementoParaModal] = useState<any>(null);
  const [tareasCreadas, setTareasCreadas] = useState<any[]>([]);
  const [mostrarResultado, setMostrarResultado] = useState(false);

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
          const response = await fetch(`/api/obras/${obra.id}-elementos`, {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Principal */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={onVolver}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{obra.nombre}</h1>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>Cliente: {obra.cliente}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Building className="h-4 w-4" />
                      <span>Tipo: {obra.tipoObra.charAt(0).toUpperCase() + obra.tipoObra.slice(1)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Inicio: {new Date(obra.fechaInicio).toLocaleDateString('es-AR')}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">{obra.progreso}%</div>
                  <div className="text-sm text-gray-600">Progreso General</div>
                </div>
                <div className="flex space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Settings className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Download className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs de Navegación */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'resumen', label: 'Resumen', icon: BarChart3 },
                { key: 'elementos', label: 'Elementos', icon: Layers },
                { key: 'tareas', label: 'Tareas', icon: CheckCircle },
                { key: 'legajo', label: 'Legajo', icon: FileText }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setVistaActual(key as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    vistaActual === key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Contenido de las Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Tab: Resumen */}
          {vistaActual === 'resumen' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Estadísticas Generales */}
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Tareas</p>
                      <p className="text-2xl font-bold text-gray-900">{tareas.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Completadas</p>
                      <p className="text-2xl font-bold text-gray-900">{obra.tareasCompletadas}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">En Progreso</p>
                      <p className="text-2xl font-bold text-gray-900">{obra.tareasActivas}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FileText className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Documentos</p>
                      <p className="text-2xl font-bold text-gray-900">{obra.legajoTecnico.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progreso por Etapas */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Progreso por Etapas</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {etapas.map((etapa) => {
                    const IconComponent = etapa.icon;
                    const tareasEtapa = tareas.filter(t => t.etapa === etapa.key);
                    const completadas = tareasEtapa.filter(t => t.estado === 'completada').length;
                    const total = tareasEtapa.length;
                    const progresoEtapa = total > 0 ? (completadas / total) * 100 : 0;

                    return (
                      <div key={etapa.key} className="bg-gray-50 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${etapa.color}`}>
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{etapa.nombre}</h4>
                              <p className="text-sm text-gray-600">{completadas}/{total} tareas</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900">{Math.round(progresoEtapa)}%</div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${progresoEtapa}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tareas Recientes */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Tareas Recientes</h3>
                  <button
                    onClick={() => setVistaActual('tareas')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Ver todas →
                  </button>
                </div>
                <div className="space-y-3">
                  {tareas.slice(0, 5).map((tarea) => (
                    <div key={tarea.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          tarea.estado === 'completada' ? 'bg-green-100 text-green-600' :
                          tarea.estado === 'en_progreso' ? 'bg-blue-100 text-blue-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          <CheckCircle className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{tarea.nombre}</p>
                          <p className="text-sm text-gray-600">{tarea.lider}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tarea.estado === 'completada' ? 'bg-green-100 text-green-800' :
                          tarea.estado === 'en_progreso' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {tarea.estado.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Elementos */}
          {vistaActual === 'elementos' && (
            <div className="p-6">
              {mostrarResultado ? (
                <div className="bg-white border border-gray-200 rounded-lg overflow-y-auto">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800">Tareas creadas exitosamente</h3>
                        <p className="text-gray-600">
                          Se generaron {tareasCreadas.length} tareas desde {elementosCarrito.length} elementos seleccionados
                        </p>
                      </div>
                      <button
                        onClick={handleVolverAElementos}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Cargar más elementos
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tareasCreadas.map((tarea, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-800">{tarea.nombre}</h4>
                              <p className="text-sm text-gray-600">Código: {tarea.id}</p>
                              <p className="text-sm text-gray-600">Fase: {tarea.fase}</p>
                            </div>
                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                          </div>

                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Cantidad:</span>
                              <span className="font-medium">{tarea.cantidad} {tarea.unidad}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Tiempo estimado:</span>
                              <span className="font-medium">{tarea.tiempoEstimado} días</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-[640px] bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="w-1/4 bg-gray-50 border-r border-gray-200 overflow-y-auto">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-md font-semibold text-gray-800">Categorías</h3>
                      <p className="text-sm text-gray-600">Selecciona una categoría</p>
                    </div>

                    <div className="p-2">
                      {elementos.map((elemento, index) => (
                        <div key={index} className="mb-1">
                          <button
                            onClick={() => setCategoriaSeleccionada(elemento.categoria)}
                            className={`w-full p-3 text-left rounded-lg transition-colors flex items-center justify-between ${
                              categoriaSeleccionada === elemento.categoria
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <FolderOpen className="h-4 w-4" />
                              <span className="font-medium">{elemento.categoria}</span>
                            </div>
                            <span className="text-xs text-gray-500">{elemento.tipos.length}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="w-1/3 bg-white border-r border-gray-200 overflow-y-auto">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-md font-semibold text-gray-800">
                        {getCategoriaSeleccionada()?.categoria || 'Selecciona una categoría'}
                      </h3>
                      <p className="text-sm text-gray-600">Tipos de elementos</p>
                    </div>

                    {getCategoriaSeleccionada() && (
                      <div className="p-2">
                        {getCategoriaSeleccionada()!.tipos.map((tipo, index) => (
                          <div key={index} className="mb-1">
                            <button
                              onClick={() => handleSeleccionarTipo(tipo)}
                              className="w-full p-3 text-left rounded-lg transition-colors hover:bg-gray-100 text-gray-700"
                            >
                              <div className="font-medium">{tipo.nombre}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {tipo.fases.estructura.length + tipo.fases.obra_gris.length + tipo.fases.terminaciones.length} tareas
                              </div>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 bg-white">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800">Carrito de Obra</h3>
                      <p className="text-sm text-gray-600">
                        {elementosCarrito.length} elemento{elementosCarrito.length !== 1 ? 's' : ''} seleccionado{elementosCarrito.length !== 1 ? 's' : ''}
                      </p>
                    </div>

                    <div className="p-4 overflow-y-auto">
                      {elementosCarrito.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          <p>El carrito está vacío</p>
                          <p className="text-sm">Selecciona elementos para comenzar</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {elementosCarrito.map((elemento) => (
                            <div key={elemento.id} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-800 text-sm">{elemento.tipo}</h4>
                                  <p className="text-xs text-gray-600">{elemento.categoria}</p>
                                  <p className="text-sm text-gray-700 mt-1">
                                    {elemento.cantidad} {elemento.unidad}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleEliminarElemento(elemento.id)}
                                  className="text-red-600 hover:text-red-800 transition-colors text-sm"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          ))}

                          <div className="pt-4 border-t border-gray-200">
                            <button
                              onClick={handleConfirmarCarrito}
                              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                              disabled={elementosCarrito.length === 0}
                            >
                              Crear Tareas ({getTotalTareas()} tareas)
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <ModalSeleccionCantidad
                isOpen={showModalCantidad}
                onClose={() => setShowModalCantidad(false)}
                onConfirm={handleConfirmarCantidad}
                elemento={elementoParaModal || { tipo: '', categoria: '', fases: { estructura: [], obra_gris: [], terminaciones: [] } }}
              />
            </div>
          )}

          {/* Tab: Tareas */}
          {vistaActual === 'tareas' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Gestión de Tareas</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setVistaTareas('lista')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      vistaTareas === 'lista' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Lista
                  </button>
                  <button
                    onClick={() => setVistaTareas('timeline')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      vistaTareas === 'timeline' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Timeline
                  </button>
                  <button
                    onClick={() => setVistaTareas('editor')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      vistaTareas === 'editor' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Editor Visual
                  </button>
                </div>
              </div>

              {vistaTareas === 'editor' ? (
                <EditorVisualTareas
                  tareas={tareas.filter(t => t.etapa === etapaSeleccionada)}
                  etapa={etapaSeleccionada}
                  onActualizarTarea={onActualizarTarea}
                  onEliminarTarea={onEliminarTarea}
                  onCrearTarea={onCrearTarea}
                />
              ) : (
                <div className="space-y-4">
                  {tareas.filter(t => t.etapa === etapaSeleccionada).map((tarea) => (
                    <div key={tarea.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            tarea.estado === 'completada' ? 'bg-green-100 text-green-600' :
                            tarea.estado === 'en_progreso' ? 'bg-blue-100 text-blue-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            <CheckCircle className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{tarea.nombre}</h4>
                            <p className="text-sm text-gray-600">{tarea.lider}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            tarea.estado === 'completada' ? 'bg-green-100 text-green-800' :
                            tarea.estado === 'en_progreso' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {tarea.estado.replace('_', ' ')}
                          </span>
                          <button className="p-1 text-gray-400 hover:text-gray-600">
                            <Edit3 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Legajo */}
          {vistaActual === 'legajo' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Legajo Técnico</h3>
                <button className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  <Upload className="h-4 w-4" />
                  <span>Subir Documento</span>
                </button>
              </div>
              <div className="text-center py-12">
                <Building className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Legajo Técnico</h3>
                <p className="text-gray-600">Esta sección estará disponible próximamente</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

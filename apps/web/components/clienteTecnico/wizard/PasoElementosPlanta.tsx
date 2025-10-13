// ⚠️ COMPONENTE DESHABILITADO - NO SE USA MÁS
// Este componente contiene la funcionalidad de elementos por planta que fue eliminada del wizard
// 'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Minus, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  ChevronUp, 
  ChevronDown,
  Settings,
  Calculator,
  Layers,
  Building2,
  Zap,
  Home,
  Palette,
  TreePine,
  Wrench
} from 'lucide-react';
import { elementosConstructivos, ElementoConstructivo } from '@/lib/elementos-constructivos';
import { ModalOpcionesElemento } from './ModalOpcionesElemento';

// Tipos de datos
interface ConfiguracionTecnica {
  [key: string]: any;
}

interface ElementoSeleccionado {
  id: string;
  nombre: string;
  categoria: string;
  planta: number;
  seleccionado: boolean;
  cantidad: number;
  configuracion: ConfiguracionTecnica;
  expandido: boolean;
  opcionesAdicionales?: Record<string, any>;
}

interface PasoElementosPlantaProps {
  data: {
    numero: number;
    nombre: string;
    elementos: ElementoSeleccionado[];
  };
  onChange: (data: any) => void;
  onNext: () => void;
  onPrevious: () => void;
  isLastPlanta: boolean;
}

export function PasoElementosPlanta({ data, onChange, onNext, onPrevious, isLastPlanta }: PasoElementosPlantaProps) {
  const [activeCategory, setActiveCategory] = useState<string>('Fundación y Estructura');
  const [modalOpciones, setModalOpciones] = useState<{
    isOpen: boolean;
    elemento: ElementoConstructivo | null;
    elementoSeleccionado: ElementoSeleccionado | null;
  }>({
    isOpen: false,
    elemento: null,
    elementoSeleccionado: null
  });

  // Estado para controlar qué grupos están colapsados
  const [gruposColapsados, setGruposColapsados] = useState<Record<string, boolean>>({});

  // Función para alternar el estado de colapso de un grupo
  const toggleGrupoColapsado = (grupoKey: string) => {
    setGruposColapsados(prev => ({
      ...prev,
      [grupoKey]: !prev[grupoKey]
    }));
  };

  // Función para verificar si un grupo está colapsado
  const isGrupoColapsado = (grupoKey: string) => {
    return gruposColapsados[grupoKey] !== false; // Por defecto todos están colapsados
  };

  // Obtener categorías únicas de los elementos constructivos
  const categorias = [...new Set(elementosConstructivos.map(e => e.categoria))];

  // Función para obtener configuración por defecto según el elemento
  const getConfiguracionPorDefecto = (elemento: ElementoConstructivo): ConfiguracionTecnica => {
    const config: ConfiguracionTecnica = {};
    
    // Configuraciones específicas por elemento
    const configuraciones = {
      'EXC_MAN001': { profundidad: 1.0, tipo_suelo: 'arcilloso' },
      'EXC_MEC001': { profundidad: 1.0, tipo_suelo: 'arcilloso', tipo_maquina: 'retroexcavadora' },
      'HOR_PLA001': { espesor: 0.15, resistencia: 'H-21', dosificacion: '1:2:3' },
      'HOR_ZAP001': { dimensiones: '0.6x0.6x0.8', resistencia: 'H-21', dosificacion: '1:2:3' },
      'HOR_COL001': { dimensiones: '0.3x0.3', altura: 3.0, resistencia: 'H-21' },
      'HOR_VIG001': { dimensiones: '0.3x0.6', longitud: 4.0, resistencia: 'H-21' },
      'MUR_LAD15_001': { espesor: 0.15, tipo_ladrillo: 'común', terminacion: 'revoque' },
      'MUR_LAD30_001': { espesor: 0.30, tipo_ladrillo: 'común', terminacion: 'revoque' },
      'MUR_RET15_001': { espesor: 0.15, tipo_retak: 'estructural', terminacion: 'revoque' },
      'MUR_RET20_001': { espesor: 0.20, tipo_retak: 'estructural', terminacion: 'revoque' },
      'PLO_SAN_1B001': { cantidad_banios: 1, tipo_cañeria: 'PVC', diametro: '110mm', tipo_tanque: 'Superior' },
      'PLO_SAN_2B001': { cantidad_banios: 2, tipo_cañeria: 'PVC', diametro: '110mm', tipo_tanque: 'Superior' },
      'PLO_SAN_3B001': { cantidad_banios: 3, tipo_cañeria: 'PVC', diametro: '110mm', tipo_tanque: 'Superior' },
      'PLO_SAN_TAN_SUP001': { capacidad: '1000L', tipo_tanque: 'Superior', material: 'Polietileno' },
      'PLO_ELE_BAS001': { potencia: '3KW', tipo_instalacion: 'monofasica', seccion_cable: '4mm2' },
      'PLO_ELE_ALT001': { potencia: '6KW', tipo_instalacion: 'trifasica', seccion_cable: '6mm2' },
      'PLO_GAS001': { tipo_cañeria: 'polietileno', diametro: '32mm', presion: 'media' },
      'CUB_CHA001': { tipo_chapa: 'galvanizada', pendiente: '15%', aislacion: 'lana_roca' },
      'CUB_LOS001': { espesor: 0.12, resistencia: 'H-21', terminacion: 'membrana' },
      'PIS_CER001': { tipo_ceramica: 'porcelanato', dimensiones: '60x60cm', espesor: '10mm' },
      'PIS_MAD001': { tipo_madera: 'parquet', dimensiones: '15x90cm', espesor: '14mm' },
      'TER_REV001': { tipo_revoque: 'hidrófugo', espesor: '2cm', terminacion: 'fino' },
      'TER_PIN001': { tipo_pintura: 'látex', color: 'blanco', acabado: 'mate' },
      'AME_PAR001': { tipo_parrilla: 'hierro', dimensiones: '1x0.6m', altura: '0.8m' },
      'AME_QUI001': { tipo_quincho: 'cerrado', dimensiones: '3x4m', altura: '2.5m' },
      'AME_PIL001': { tipo_pileta: 'fibrocemento', dimensiones: '8x4m', profundidad: '1.5m' },
      'PAR_JAR001': { tipo_jardin: 'natural', superficie: '50m2', riego: 'automático' },
      'PAR_SEN001': { tipo_sendero: 'ladrillo', ancho: '1.2m', longitud: '20m' },
      'PAR_ILU001': { tipo_iluminacion: 'led', cantidad: 8, potencia: '20W' }
    };

    return configuraciones[elemento.id as keyof typeof configuraciones] || {};
  };

  // Función para inicializar elementos
  const inicializarElementos = (): ElementoSeleccionado[] => {
    const elementosInicializados: ElementoSeleccionado[] = elementosConstructivos.map(elemento => ({
      id: elemento.id,
      nombre: elemento.nombre,
      categoria: elemento.categoria,
      planta: data.numero,
      seleccionado: false,
      cantidad: 1,
      configuracion: getConfiguracionPorDefecto(elemento),
      expandido: false,
      opcionesAdicionales: {}
    }));

    return elementosInicializados;
  };

  // Inicializar elementos si no existen
  useEffect(() => {
    if (data.elementos.length === 0) {
      const elementosInicializados = inicializarElementos();
      onChange({ ...data, elementos: elementosInicializados });
    }
  }, [data.numero]);

  // Función para obtener elementos por categoría
  const getElementosPorCategoria = (categoria: string) => {
    return data.elementos.filter(e => e.categoria === categoria);
  };

  // Función para agrupar elementos por tipo dentro de cada categoría
  const getElementosAgrupados = (categoria: string) => {
    const elementos = getElementosPorCategoria(categoria);
    const grupos: { [key: string]: ElementoSeleccionado[] } = {};

    elementos.forEach(elemento => {
      // Determinar el grupo basado en el nombre del elemento
      let grupo = 'Otros';
      
      if (elemento.nombre.includes('Excavación')) grupo = 'Excavación';
      else if (elemento.nombre.includes('Hormigón')) grupo = 'Hormigón';
      else if (elemento.nombre.includes('Bases')) grupo = 'Bases';
      else if (elemento.nombre.includes('Zapata')) grupo = 'Zapatas';
      else if (elemento.nombre.includes('Columna')) grupo = 'Columnas';
      else if (elemento.nombre.includes('Viga')) grupo = 'Vigas';
      else if (elemento.nombre.includes('Losa')) grupo = 'Losas';
      else if (elemento.nombre.includes('Ladrillo')) grupo = 'Ladrillo';
      else if (elemento.nombre.includes('Retak')) grupo = 'Retak';
      else if (elemento.nombre.includes('Cerámico')) grupo = 'Cerámico';
      else if (elemento.nombre.includes('Bloque')) grupo = 'Bloque';
      else if (elemento.nombre.includes('Panel')) grupo = 'Panel';
      else if (elemento.nombre.includes('Cortina')) grupo = 'Cortina';
      else if (elemento.nombre.includes('Sanitaria')) grupo = 'Sanitaria';
      else if (elemento.nombre.includes('Eléctrica')) grupo = 'Eléctrica';
      else if (elemento.nombre.includes('Gas')) grupo = 'Gas';
      else if (elemento.nombre.includes('Pluvial')) grupo = 'Pluvial';
      else if (elemento.nombre.includes('Climatización')) grupo = 'Climatización';
      else if (elemento.nombre.includes('Chapa')) grupo = 'Chapa';
      else if (elemento.nombre.includes('Losa')) grupo = 'Losa';
      else if (elemento.nombre.includes('Cerámica')) grupo = 'Cerámica';
      else if (elemento.nombre.includes('Madera')) grupo = 'Madera';
      else if (elemento.nombre.includes('Revoque')) grupo = 'Revoque';
      else if (elemento.nombre.includes('Pintura')) grupo = 'Pintura';
      else if (elemento.nombre.includes('Parrilla')) grupo = 'Parrilla';
      else if (elemento.nombre.includes('Quincho')) grupo = 'Quincho';
      else if (elemento.nombre.includes('Pileta')) grupo = 'Pileta';
      else if (elemento.nombre.includes('Jardín')) grupo = 'Jardín';
      else if (elemento.nombre.includes('Sendero')) grupo = 'Sendero';
      else if (elemento.nombre.includes('Iluminación')) grupo = 'Iluminación';

      if (!grupos[grupo]) {
        grupos[grupo] = [];
      }
      grupos[grupo].push(elemento);
    });

    return grupos;
  };

  // Función para obtener icono por categoría
  const getIconForCategory = (categoria: string) => {
    switch (categoria) {
      case 'Fundación y Estructura':
        return Building2;
      case 'Muros y Cerramientos':
        return Home;
      case 'Instalaciones':
        return Zap;
      case 'Cubiertas':
        return Home;
      case 'Suelos / Pisos':
        return Home;
      case 'Terminaciones':
        return Palette;
      case 'Amenities':
        return Wrench;
      case 'Parquizado':
        return TreePine;
      default:
        return Layers;
    }
  };

  // Función para alternar selección de elemento
  const toggleElemento = (elementoId: string) => {
    const elementosActualizados = data.elementos.map(elemento => 
      elemento.id === elementoId 
        ? { ...elemento, seleccionado: !elemento.seleccionado }
        : elemento
    );
    onChange({ ...data, elementos: elementosActualizados });
  };

  // Función para alternar expansión de elemento
  const toggleExpansion = (elementoId: string) => {
    const elementosActualizados = data.elementos.map(elemento => 
      elemento.id === elementoId 
        ? { ...elemento, expandido: !elemento.expandido }
        : elemento
    );
    onChange({ ...data, elementos: elementosActualizados });
  };

  // Función para actualizar cantidad
  const actualizarCantidad = (elementoId: string, nuevaCantidad: number) => {
    if (nuevaCantidad < 1) return;
    
    const elementosActualizados = data.elementos.map(elemento => 
      elemento.id === elementoId 
        ? { ...elemento, cantidad: nuevaCantidad }
        : elemento
    );
    onChange({ ...data, elementos: elementosActualizados });
  };

  // Función para actualizar configuración técnica
  const actualizarConfiguracion = (elementoId: string, key: string, value: any) => {
    const elementosActualizados = data.elementos.map(elemento => 
      elemento.id === elementoId 
        ? { 
            ...elemento, 
            configuracion: { 
              ...elemento.configuracion, 
              [key]: value 
            } 
          }
        : elemento
    );
    onChange({ ...data, elementos: elementosActualizados });
  };

  // Función para obtener elementos seleccionados por categoría
  const getElementosSeleccionadosPorCategoria = (categoria: string) => {
    return data.elementos.filter(e => e.categoria === categoria && e.seleccionado);
  };

  // Función para obtener todos los elementos seleccionados
  const getElementosSeleccionados = () => {
    return data.elementos.filter(e => e.seleccionado);
  };

  // Función para abrir modal de opciones
  const abrirModalOpciones = (elementoSeleccionado: ElementoSeleccionado) => {
    const elementoOriginal = elementosConstructivos.find(e => e.id === elementoSeleccionado.id);
    if (elementoOriginal) {
      setModalOpciones({
        isOpen: true,
        elemento: elementoOriginal,
        elementoSeleccionado: elementoSeleccionado
      });
    }
  };

  // Función para cerrar modal de opciones
  const cerrarModalOpciones = () => {
    setModalOpciones({
      isOpen: false,
      elemento: null,
      elementoSeleccionado: null
    });
  };

  // Función para guardar opciones adicionales
  const guardarOpcionesAdicionales = (opciones: Record<string, any>) => {
    if (!modalOpciones.elementoSeleccionado) return;

    const elementosActualizados = data.elementos.map(elemento => 
      elemento.id === modalOpciones.elementoSeleccionado!.id 
        ? { ...elemento, opcionesAdicionales: opciones }
        : elemento
    );
    onChange({ ...data, elementos: elementosActualizados });
    cerrarModalOpciones();
  };

  const renderElementosCategoria = (categoria: string) => {
    const elementosAgrupados = getElementosAgrupados(categoria);
    const totalElementos = Object.values(elementosAgrupados).flat().length;
    
    if (totalElementos === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Layers className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay elementos en esta categoria
          </h3>
          <p className="text-gray-500">
            Los elementos de esta categoria apareceran aqui cuando esten disponibles.
          </p>
        </div>
      );
    }
    return (
      <div className="space-y-6">
        {Object.entries(elementosAgrupados).map(([nombreGrupo, elementos]) => {
          const elementosSeleccionados = elementos.filter(e => e.seleccionado);
          const totalEnGrupo = elementos.length;
          const seleccionadosEnGrupo = elementosSeleccionados.length;
          
          return (
            <div key={nombreGrupo} className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200 shadow-sm">
              {/* Header del grupo */}
              <div className="flex items-center justify-between mb-6">
                <div 
                  className="flex items-center space-x-4 cursor-pointer flex-1"
                  onClick={() => toggleGrupoColapsado(`${categoria}-${nombreGrupo}`)}
                >
                  <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-200">
                    <Layers className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{nombreGrupo}</h3>
                    <p className="text-sm text-gray-600">
                      {seleccionadosEnGrupo} de {totalEnGrupo} elementos seleccionados
                    </p>
                  </div>
                </div>
                
                {/* Indicador de progreso y botón de colapsar */}
                <div className="flex items-center space-x-3">
                  <div className="w-20 h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
                      style={{ width: `${(seleccionadosEnGrupo / totalEnGrupo) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-700 min-w-[3rem]">
                    {Math.round((seleccionadosEnGrupo / totalEnGrupo) * 100)}%
                  </span>
                  
                  {/* Botón de colapsar */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleGrupoColapsado(`${categoria}-${nombreGrupo}`);
                    }}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    title={isGrupoColapsado(`${categoria}-${nombreGrupo}`) ? "Expandir grupo" : "Colapsar grupo"}
                  >
                    <div className={`w-4 h-4 transition-transform duration-200 ${isGrupoColapsado(`${categoria}-${nombreGrupo}`) ? 'rotate-180' : ''}`}>
                      <svg viewBox="0 0 12 12" fill="currentColor" className="text-gray-600">
                        <path d="M6 9L2 5h8z"/>
                      </svg>
                    </div>
                  </button>
                </div>
              </div>

              {/* Grid de elementos del grupo - Solo mostrar si no está colapsado */}
              {!isGrupoColapsado(`${categoria}-${nombreGrupo}`) && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {elementos.map((elemento) => {
                    const isSelected = elemento.seleccionado;
                    const Icon = getIconForCategory(categoria);

                    return (
                      <div
                        key={elemento.id}
                        className={`relative rounded-2xl border-2 transition-all duration-300 cursor-pointer group ${
                          isSelected
                            ? 'bg-white border-blue-500 shadow-xl scale-105 ring-4 ring-blue-100'
                            : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-lg hover:scale-102 hover:bg-blue-50'
                        }`}
                        onClick={() => toggleElemento(elemento.id)}
                      >
                        {/* Indicador de selección */}
                        {isSelected && (
                          <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                            <Check className="h-5 w-5 text-white" />
                          </div>
                        )}

                        {/* Header del elemento */}
                        <div className="p-5">
                          <div className="flex items-start space-x-4">
                            <div className={`p-3 rounded-xl shadow-sm ${
                              isSelected ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-blue-100'
                            }`}>
                              <Icon className={`h-6 w-6 ${
                                isSelected ? 'text-blue-600' : 'text-gray-600 group-hover:text-blue-500'
                              }`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className={`font-bold text-sm leading-tight ${
                                isSelected ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'
                              }`}>
                                {elemento.nombre}
                              </h4>
                              <p className="text-xs text-gray-500 mt-1 font-mono">ID: {elemento.id}</p>
                            </div>
                          </div>
                        </div>

                        {/* Botón de expansión */}
                        {isSelected && (
                          <div className="px-5 pb-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpansion(elemento.id);
                              }}
                              className="w-full flex items-center justify-center space-x-2 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                              <span>Configurar Elemento</span>
                              {elemento.expandido ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Configuración expandida para elementos seleccionados */}
              {!isGrupoColapsado(`${categoria}-${nombreGrupo}`) && elementosSeleccionados.map((elemento) => {
                if (!elemento.expandido) return null;

                return (
                  <div key={`config-${elemento.id}`} className="mt-6 bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">{elemento.nombre}</h4>
                        <p className="text-sm text-gray-500">ID: {elemento.id}</p>
                      </div>
                      <button
                        onClick={() => toggleExpansion(elemento.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        <ChevronUp className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Cantidad */}
                      <div className="bg-gray-50 rounded-xl p-6">
                        <label className="block text-sm font-bold text-gray-700 mb-4">
                          Cantidad
                        </label>
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => actualizarCantidad(elemento.id, elemento.cantidad - 1)}
                            className="p-3 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl transition-colors shadow-sm"
                          >
                            <Minus className="h-5 w-5" />
                          </button>
                          <input
                            type="number"
                            value={elemento.cantidad}
                            onChange={(e) => actualizarCantidad(elemento.id, parseInt(e.target.value) || 1)}
                            className="w-24 px-4 py-3 border-2 border-gray-300 rounded-xl text-center text-lg font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="1"
                          />
                          <button
                            onClick={() => actualizarCantidad(elemento.id, elemento.cantidad + 1)}
                            className="p-3 bg-green-100 hover:bg-green-200 text-green-600 rounded-xl transition-colors shadow-sm"
                          >
                            <Plus className="h-5 w-5" />
                          </button>
                        </div>
                      </div>

                      {/* Configuración técnica */}
                      <div className="bg-blue-50 rounded-xl p-6">
                        <h5 className="text-sm font-bold text-gray-700 mb-4">Configuración Técnica</h5>
                        <div className="space-y-3">
                          {Object.entries(elemento.configuracion).map(([key, value]) => (
                            <div key={key} className="flex flex-col space-y-1">
                              <label className="text-xs font-medium text-gray-600 capitalize">
                                {key.replace(/_/g, ' ')}:
                              </label>
                              {typeof value === 'number' ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={value}
                                  onChange={(e) => actualizarConfiguracion(elemento.id, key, parseFloat(e.target.value) || 0)}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={String(value)}
                                  onChange={(e) => actualizarConfiguracion(elemento.id, key, e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Botón de opciones adicionales */}
                    <div className="mt-6">
                      <button
                        onClick={() => abrirModalOpciones(elemento)}
                        className="w-full flex items-center justify-center space-x-2 py-3 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <Settings className="h-4 w-4" />
                        <span>+ Detalles y Opciones</span>
                      </button>
                    </div>

                    {/* Mostrar opciones guardadas */}
                    {elemento.opcionesAdicionales && Object.keys(elemento.opcionesAdicionales).length > 0 && (
                      <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
                        <div className="flex items-center space-x-3 mb-4">
                          <Check className="h-6 w-6 text-green-600" />
                          <span className="text-lg font-bold text-green-700">Opciones configuradas:</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.entries(elemento.opcionesAdicionales).map(([key, value]) => (
                            <div key={key} className="flex justify-between items-center bg-white p-3 rounded-lg border border-green-200">
                              <span className="font-bold text-sm text-green-700">{key}:</span>
                              <span className="text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full">
                                {Array.isArray(value) ? value.join(', ') : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const renderResumenCategoria = (categoria: string) => {
    const elementosSeleccionados = getElementosSeleccionadosPorCategoria(categoria);

    if (elementosSeleccionados.length === 0) return null;

    return (
      <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
              <Calculator className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Resumen de {categoria}</h3>
              <p className="text-sm text-gray-600">Elementos seleccionados y configurados</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{elementosSeleccionados.length}</div>
            <div className="text-sm text-gray-600">elementos</div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {elementosSeleccionados.map((elemento) => (
            <div key={elemento.id} className="bg-white p-5 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-sm mb-1">{elemento.nombre}</h4>
                  <p className="text-xs text-gray-500 font-mono">ID: {elemento.id}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">{elemento.cantidad}</div>
                  <div className="text-xs text-gray-500">cantidad</div>
                </div>
              </div>
              
              {/* Mostrar opciones configuradas */}
              {elemento.opcionesAdicionales && Object.keys(elemento.opcionesAdicionales).length > 0 && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-bold text-green-700">Opciones configuradas</span>
                  </div>
                  <div className="space-y-1">
                    {Object.entries(elemento.opcionesAdicionales).slice(0, 2).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center text-xs">
                        <span className="text-green-600 font-medium">{key}:</span>
                        <span className="text-green-700">{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                      </div>
                    ))}
                    {Object.keys(elemento.opcionesAdicionales).length > 2 && (
                      <div className="text-xs text-green-600 font-medium">
                        +{Object.keys(elemento.opcionesAdicionales).length - 2} más...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-8 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2" style={{ color: '#1A202C' }}>
                Elementos Constructivos - {data.nombre}
              </h2>
              <p className="text-lg text-gray-600">Selecciona los elementos constructivos para la Planta {data.numero}</p>
            </div>
            <div className="text-right">
              <div className="text-sm mb-1 text-gray-600">Elementos Seleccionados</div>
              <div className="text-4xl font-bold px-4 py-2 rounded-2xl" style={{ backgroundColor: '#FEEB70', color: '#1A202C' }}>
                {getElementosSeleccionados().length}
              </div>
            </div>
          </div>
        </div>

        {/* Navegación por categorías */}
        <div className="bg-gray-50 border-b border-gray-200 p-6">
          <div className="flex flex-wrap gap-3">
            {categorias.map((categoria) => {
              const Icon = getIconForCategory(categoria);
              const elementosSeleccionados = getElementosSeleccionadosPorCategoria(categoria);
              
              return (
                <button
                  key={categoria}
                  onClick={() => setActiveCategory(categoria)}
                  className={`py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 flex items-center space-x-3 ${
                    activeCategory === categoria
                      ? 'shadow-lg transform scale-105'
                      : 'hover:shadow-md'
                  }`}
                  style={{
                    backgroundColor: activeCategory === categoria ? '#FEEB70' : '#FFFFFF',
                    color: '#1A202C'
                  }}
                >
                  <Icon className="h-5 w-5" />
                  <span className="hidden md:inline">{categoria}</span>
                  <span className="md:hidden">{categoria.split(' ')[0]}</span>
                  <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                    activeCategory === categoria
                      ? 'bg-black bg-opacity-20 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}>
                    {elementosSeleccionados.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenido de la categoría activa */}
        <div className="p-8">
          {renderElementosCategoria(activeCategory)}
          {renderResumenCategoria(activeCategory)}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 p-6">
          <div className="flex justify-between">
            <button
              onClick={onPrevious}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg font-medium transition-colors duration-200 shadow-sm"
              style={{ 
                color: '#1A202C',
                backgroundColor: '#FEEB70'
              }}
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Anterior</span>
            </button>

            <button
              onClick={onNext}
              className="flex items-center space-x-2 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg"
              style={{ backgroundColor: '#22C55E' }}
            >
              <span>{isLastPlanta ? 'Finalizar Plantas' : 'Siguiente Planta'}</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de opciones adicionales */}
      {modalOpciones.isOpen && modalOpciones.elemento && (
        <ModalOpcionesElemento
          isOpen={modalOpciones.isOpen}
          onClose={cerrarModalOpciones}
          onSave={guardarOpcionesAdicionales}
          elemento={modalOpciones.elemento}
          opcionesIniciales={modalOpciones.elementoSeleccionado?.opcionesAdicionales || {}}
        />
      )}
    </div>
  );
}
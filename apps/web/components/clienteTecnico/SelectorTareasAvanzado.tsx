'use client';

import { useState } from 'react';
import { X, Trash2, ShoppingCart, Check } from 'lucide-react';
import { tareasConstructivas, type TareaConstructiva } from '@/lib/tareas-construccion';

interface SelectorTareasAvanzadoProps {
  onClose: () => void;
  onTareaSeleccionada: (tarea: TareaConstructiva | TareaConstructiva[], fase: string) => void;
  etapaFija?: 'estructura' | 'obra_gris' | 'terminaciones';
}

interface TareaEnCarrito {
  tarea: TareaConstructiva;
  cantidad: number;
  horasTotales: number;
  diasEstimados: number;
  trabajadores: number;
}

type VistaActual = 'estructura' | 'obra_gris' | 'terminaciones';
type SubcategoriaSeleccionada = string | null;

// Mapeo de subcategorías por prefijo
const subcategoriasPorPrefijo: { [key: string]: string } = {
  'R0': 'Replanteo',
  'D': 'Demolición', 
  'M': 'Mampostería',
  'H': 'Hormigón',
  'S': 'Suelo',
  'C': 'Cubierta',
  'R': 'Revoque',
  'EL': 'Electricidad',
  'PL': 'Plomería',
  'TE': 'Terminaciones'
};

// Función para obtener subcategoría por ID de tarea
const getSubcategoria = (id: string): string => {
  if (id.startsWith('R0')) return 'R0'; // Replanteo específico
  const prefijo = id.match(/^[A-Z]+/)?.[0] || '';
  return prefijo;
};

export function SelectorTareasAvanzado({ onClose, onTareaSeleccionada, etapaFija }: SelectorTareasAvanzadoProps) {
  const [vistaActual, setVistaActual] = useState<VistaActual>(etapaFija || 'estructura');
  const [subcategoriaSeleccionada, setSubcategoriaSeleccionada] = useState<SubcategoriaSeleccionada>(null);
  const [tareasVisibles, setTareasVisibles] = useState<TareaConstructiva[]>([]);
  const [cantidadMetros, setCantidadMetros] = useState<string>('');
  const [carrito, setCarrito] = useState<TareaEnCarrito[]>([]);
  const [tareaSeleccionada, setTareaSeleccionada] = useState<TareaConstructiva | null>(null);
  const [busquedaTarea, setBusquedaTarea] = useState<string>('');
  const numeroTrabajadores = 3; // Fijo en 3 trabajadores

  const handleVistaChange = (vista: VistaActual) => {
    if (etapaFija) return; // No permitir cambio si hay etapa fija
    setVistaActual(vista);
    setSubcategoriaSeleccionada(null);
    setTareasVisibles([]);
    setCantidadMetros('');
    setTareaSeleccionada(null);
    setBusquedaTarea('');
  };

  const handleSubcategoriaClick = (subcategoria: string) => {
    setSubcategoriaSeleccionada(subcategoria);
    
    // Filtrar tareas por vista actual (fase) y subcategoría específica
    const tareasFiltradas = tareasConstructivas.filter(tarea => {
      const esVistaCorrecta = tarea.fase === vistaActual;
      const esSubcategoriaCorrecta = getSubcategoria(tarea.id) === subcategoria;
      return esVistaCorrecta && esSubcategoriaCorrecta;
    });
    
    setTareasVisibles(tareasFiltradas);
  };

  const handleTareaClick = (tarea: TareaConstructiva) => {
    setTareaSeleccionada(tarea);
    setCantidadMetros(''); // Limpiar cantidad anterior
  };

  const handleConfirmarTarea = () => {
    if (!tareaSeleccionada || !cantidadMetros) return;
    
    const cantidad = parseFloat(cantidadMetros);
    const trabajadores = numeroTrabajadores; // Siempre 3 trabajadores
    const horasTotales = cantidad * tareaSeleccionada.coef_operativo;
    const horasPorDia = 8; // Jornada estándar de 8 horas
    const diasEstimados = Math.ceil(horasTotales / (trabajadores * horasPorDia));
    
    const nuevaTareaEnCarrito: TareaEnCarrito = {
      tarea: tareaSeleccionada,
      cantidad,
      horasTotales,
      diasEstimados,
      trabajadores
    };
    
    setCarrito([...carrito, nuevaTareaEnCarrito]);
    setTareaSeleccionada(null);
    setCantidadMetros('');
  };

  const handleEliminarDelCarrito = (index: number) => {
    setCarrito(carrito.filter((_, i) => i !== index));
  };

  const handleLimpiarCarrito = () => {
    setCarrito([]);
  };

  // Filtrar tareas por búsqueda
  const tareasFiltradas = tareasVisibles.filter(tarea => {
    if (!busquedaTarea) return true;
    return tarea.nombre.toLowerCase().includes(busquedaTarea.toLowerCase()) ||
           tarea.id.toLowerCase().includes(busquedaTarea.toLowerCase());
  });

  const handleConfigurarTodas = () => {
    console.log('🔵 SelectorTareasAvanzado: handleConfigurarTodas called');
    console.log('🔵 Carrito:', carrito);
    
    // Procesar todas las tareas del carrito como un array
    const tareasConCantidad = carrito.map(item => ({
      ...item.tarea,
      cantidad: item.cantidad,
      cantidadTexto: `${item.cantidad} ${item.tarea.unidad}`,
      horasTotales: item.horasTotales,
      diasEstimados: item.diasEstimados,
      trabajadores: item.trabajadores
    }));
    
    console.log('🔵 Tareas procesadas:', tareasConCantidad);
    
    // Enviar todas las tareas de una vez
    onTareaSeleccionada(tareasConCantidad, vistaActual);
    
    console.log('🔵 onTareaSeleccionada called, NOT closing modal yet');
    
    // Limpiar el carrito después de procesar
    setCarrito([]);
    
    // NO cerrar el modal automáticamente - dejar que el ModalCrearTarea maneje el cierre
  };

  // Íconos SVG para subcategorías
  const IconoReplanteo = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <line x1="20" y1="20" x2="80" y2="20" stroke="currentColor" strokeWidth="3"/>
      <line x1="20" y1="20" x2="20" y2="80" stroke="currentColor" strokeWidth="3"/>
      <circle cx="20" cy="20" r="3" fill="currentColor"/>
      <line x1="15" y1="15" x2="25" y2="25" stroke="currentColor" strokeWidth="2"/>
      <text x="50" y="50" textAnchor="middle" className="text-xs fill-current">T</text>
    </svg>
  );

  const IconoDemolicion = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect x="20" y="40" width="60" height="30" fill="currentColor" opacity="0.3"/>
      <path d="M30 35 L45 20 L55 20 L70 35" stroke="currentColor" strokeWidth="3" fill="none"/>
      <circle cx="50" cy="25" r="3" fill="currentColor"/>
      <path d="M25 45 L35 35 M75 45 L65 35" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );

  const IconoMamposteria = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect x="20" y="30" width="15" height="8" fill="currentColor"/>
      <rect x="40" y="30" width="15" height="8" fill="currentColor"/>
      <rect x="60" y="30" width="15" height="8" fill="currentColor"/>
      <rect x="30" y="40" width="15" height="8" fill="currentColor"/>
      <rect x="50" y="40" width="15" height="8" fill="currentColor"/>
      <rect x="20" y="50" width="15" height="8" fill="currentColor"/>
      <rect x="40" y="50" width="15" height="8" fill="currentColor"/>
      <rect x="60" y="50" width="15" height="8" fill="currentColor"/>
    </svg>
  );

  const IconoHormigon = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect x="35" y="20" width="30" height="60" fill="currentColor" opacity="0.7"/>
      <rect x="30" y="75" width="40" height="10" fill="currentColor"/>
      <circle cx="25" cy="40" r="8" fill="currentColor" opacity="0.5"/>
      <circle cx="75" cy="60" r="6" fill="currentColor" opacity="0.5"/>
      <path d="M20 30 L30 35 M70 45 L80 50" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );

  const IconoSuelo = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <path d="M10 60 Q30 55 50 60 T90 60" stroke="currentColor" strokeWidth="3" fill="none"/>
      <rect x="20" y="65" width="60" height="15" fill="currentColor" opacity="0.3"/>
      <path d="M30 30 L40 25 L50 30 L60 25 L70 30" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  );

  const IconoCubierta = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <path d="M20 60 L50 30 L80 60" stroke="currentColor" strokeWidth="3" fill="currentColor" opacity="0.3"/>
      <path d="M15 65 L50 25 L85 65" stroke="currentColor" strokeWidth="2" fill="none"/>
      <line x1="30" y1="50" x2="70" y2="50" stroke="currentColor" strokeWidth="1"/>
    </svg>
  );

  const IconoRevoque = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect x="20" y="20" width="60" height="40" fill="currentColor" opacity="0.2"/>
      <path d="M30 70 L35 65 L45 70 L50 65 L60 70" stroke="currentColor" strokeWidth="3" fill="none"/>
      <rect x="45" y="60" width="20" height="3" fill="currentColor"/>
      <path d="M25 30 Q35 25 45 30 T65 30" stroke="currentColor" strokeWidth="2" fill="none"/>
    </svg>
  );

  const IconoElectricidad = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <path d="M40 20 L30 50 L45 50 L35 80 L65 45 L50 45 L60 20 Z" fill="currentColor"/>
      <circle cx="25" cy="25" r="5" fill="currentColor" opacity="0.7"/>
      <circle cx="75" cy="35" r="4" fill="currentColor" opacity="0.7"/>
    </svg>
  );

  const IconoPlomeria = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect x="20" y="40" width="60" height="6" fill="currentColor"/>
      <rect x="35" y="30" width="6" height="40" fill="currentColor"/>
      <circle cx="38" cy="33" r="8" fill="none" stroke="currentColor" strokeWidth="2"/>
      <path d="M50 20 Q60 25 70 20 Q80 25 90 20" stroke="currentColor" strokeWidth="2" fill="none"/>
      <circle cx="65" cy="70" r="3" fill="currentColor"/>
      <circle cx="75" cy="75" r="2" fill="currentColor"/>
    </svg>
  );

  const IconoTerminaciones = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <rect x="20" y="30" width="20" height="30" fill="currentColor" opacity="0.3"/>
      <path d="M15 25 L25 15 L30 20 L35 10 L45 20" stroke="currentColor" strokeWidth="2" fill="none"/>
      <rect x="60" y="35" width="15" height="10" fill="currentColor" opacity="0.5"/>
      <rect x="55" y="50" width="25" height="15" fill="currentColor" opacity="0.2"/>
      <circle cx="67" cy="40" r="2" fill="currentColor"/>
    </svg>
  );

  const getIconoSubcategoria = (subcategoria: string) => {
    switch (subcategoria) {
      case 'R0': return <IconoReplanteo />;
      case 'D': return <IconoDemolicion />;
      case 'M': return <IconoMamposteria />;
      case 'H': return <IconoHormigon />;
      case 'S': return <IconoSuelo />;
      case 'C': return <IconoCubierta />;
      case 'R': return <IconoRevoque />;
      case 'EL': return <IconoElectricidad />;
      case 'PL': return <IconoPlomeria />;
      case 'TE': return <IconoTerminaciones />;
      default: return null;
    }
  };

  // Obtener subcategorías disponibles para la vista actual
  const getSubcategoriasDisponibles = () => {
    const tareasVista = tareasConstructivas.filter(t => t.fase === vistaActual);
    const subcategorias = [...new Set(tareasVista.map(t => getSubcategoria(t.id)))];
    return subcategorias.filter(sub => sub && subcategoriasPorPrefijo[sub]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-claro px-6 py-4 border-b border-claro flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primario">Seleccionar Tarea de Construcción</h3>
          <button
            onClick={onClose}
            className="text-primario/70 hover:text-primario transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row h-[80vh]">
          {/* Panel principal - Vistas de la casa */}
          <div className="lg:w-2/3 p-6 bg-gradient-to-br from-claro to-secundario">
            {/* Selector de vista - Solo si no hay etapa fija */}
            {!etapaFija && (
              <div className="mb-6">
                <h4 className="text-xl font-semibold text-primario mb-4 text-center">
                  Selecciona la fase de construcción
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { key: 'estructura', label: 'Estructura', desc: 'Cimientos, paredes, estructura básica' },
                    { key: 'obra_gris', label: 'Obra Gris', desc: 'Instalaciones, revoques, acabados básicos' },
                    { key: 'terminaciones', label: 'Terminaciones', desc: 'Pintura, pisos, aberturas, detalles finales' }
                  ].map((vista) => (
                    <button
                      key={vista.key}
                      onClick={() => handleVistaChange(vista.key as VistaActual)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                        vistaActual === vista.key
                          ? 'border-primario bg-primario text-white shadow-lg'
                          : 'border-claro bg-white text-primario hover:border-primario/50 hover:bg-primario/5'
                      }`}
                    >
                      <div className="font-semibold text-lg mb-1">{vista.label}</div>
                      <div className="text-sm opacity-80">{vista.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Imagen de la casa según la vista */}
            <div className="flex justify-center mb-6">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="relative">
                  {vistaActual === 'estructura' && (
                    <div className="text-center">
                      <img 
                        src="/images/Estructura.png" 
                        alt="Estructura de la casa" 
                        className="w-full max-w-xs mx-auto rounded-lg shadow-md"
                      />
                      <div className="mt-4 text-primario font-medium text-lg">
                        Estructura
                      </div>
                    </div>
                  )}

                  {vistaActual === 'obra_gris' && (
                    <div className="text-center">
                      <img 
                        src="/images/Obra gris.png" 
                        alt="Obra gris de la casa" 
                        className="w-full max-w-xs mx-auto rounded-lg shadow-md"
                      />
                      <div className="mt-4 text-primario font-medium text-lg">
                        Obra Gris
                      </div>
                    </div>
                  )}

                  {vistaActual === 'terminaciones' && (
                    <div className="text-center">
                      <img 
                        src="/images/Terminaciones.png" 
                        alt="Terminaciones de la casa" 
                        className="w-full max-w-xs mx-auto rounded-lg shadow-md"
                      />
                      <div className="mt-4 text-primario font-medium text-lg">
                        Terminaciones
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Subgrupos de tareas */}
            {vistaActual && (
              <div>
                <h5 className="text-lg font-semibold text-primario mb-4 text-center">
                  Selecciona el tipo de trabajo
                </h5>
                <div className="max-h-48 overflow-y-auto border border-claro rounded-lg p-4 bg-white">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {getSubcategoriasDisponibles().map((subcategoria) => (
                      <button
                        key={subcategoria}
                        onClick={() => handleSubcategoriaClick(subcategoria)}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center space-y-2 ${
                          subcategoriaSeleccionada === subcategoria
                            ? 'border-primario bg-primario text-white shadow-lg'
                            : 'border-claro bg-white text-primario hover:border-primario/50 hover:bg-primario/5'
                        }`}
                      >
                        <div className="w-8 h-8">
                          {getIconoSubcategoria(subcategoria)}
                        </div>
                        <span className="text-xs font-medium text-center">
                          {subcategoriasPorPrefijo[subcategoria]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Panel lateral - Lista de tareas */}
          <div className="lg:w-1/3 bg-white border-l border-claro">
            {!subcategoriaSeleccionada ? (
              <div className="p-6 text-center">
                <div className="text-primario/50 text-4xl mb-4">🔧</div>
                <h4 className="text-lg font-semibold text-primario mb-2">
                  Selecciona un tipo de trabajo
                </h4>
                <p className="text-primario/70 text-sm">
                  Primero elige la fase de construcción, luego selecciona el tipo de trabajo para ver las tareas disponibles
                </p>
              </div>
            ) : (
              <div className="p-4">
                <div className="mb-4 pb-4 border-b border-claro">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-primario">
                        {subcategoriasPorPrefijo[subcategoriaSeleccionada]}
                      </h4>
                      <p className="text-sm text-primario/70">
                        {vistaActual.replace('_', ' ')} • {tareasVisibles.length} tareas disponibles
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSubcategoriaSeleccionada(null);
                        setTareasVisibles([]);
                        setTareaSeleccionada(null);
                        setCantidadMetros('');
                        setCarrito([]); // Limpiar carrito al cambiar subgrupo
                      }}
                      className="text-primario/70 hover:text-primario text-sm px-2 py-1 rounded border border-primario/30 hover:border-primario/50"
                    >
                      Cambiar
                    </button>
                  </div>
                </div>

                {/* Buscador de tareas */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-primario mb-2">
                    Buscar tarea
                  </label>
                  <input
                    type="text"
                    value={busquedaTarea}
                    onChange={(e) => setBusquedaTarea(e.target.value)}
                    placeholder="Ej: mampostería, hormigón, cimientos..."
                    className="w-full px-3 py-2 border border-claro rounded-lg focus:outline-none focus:ring-2 focus:ring-primario focus:border-transparent text-primario"
                  />
                </div>

                {/* Tarea seleccionada y cantidad */}
                {tareaSeleccionada && (
                  <div className="mb-4 p-3 bg-acento/20 rounded-lg border border-acento">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-primario text-sm">
                        Tarea seleccionada
                      </h5>
                      <button
                        onClick={() => setTareaSeleccionada(null)}
                        className="text-primario/70 hover:text-primario text-sm"
                      >
                        Cambiar
                      </button>
                    </div>
                    <div className="text-sm text-primario/80 mb-2">
                      {tareaSeleccionada.nombre} ({tareaSeleccionada.id})
                    </div>
                    <div className="text-xs text-primario/70 mb-3">
                      {tareaSeleccionada.coef_operativo}h por {tareaSeleccionada.unidad}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={cantidadMetros}
                        onChange={(e) => setCantidadMetros(e.target.value)}
                        placeholder="Cantidad"
                        min="0"
                        step="0.1"
                        className="flex-1 px-3 py-2 border border-claro rounded-lg focus:outline-none focus:ring-2 focus:ring-primario focus:border-transparent text-primario text-sm"
                      />
                      <span className="text-sm text-primario/70 whitespace-nowrap">
                        {tareaSeleccionada.unidad}
                      </span>
                      <button
                        onClick={handleConfirmarTarea}
                        disabled={!cantidadMetros}
                        className="bg-primario text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-primario/90 disabled:bg-primario/50 disabled:cursor-not-allowed"
                      >
                        ✓
                      </button>
                    </div>
                    
                    {cantidadMetros && (
                      <div className="mt-2 space-y-1 text-xs">
                        <div className="text-acento font-semibold">
                          Total: {(parseFloat(cantidadMetros) * tareaSeleccionada.coef_operativo).toFixed(1)}h
                        </div>
                        <div className="text-primario/80">
                          Días estimados: {Math.ceil((parseFloat(cantidadMetros) * tareaSeleccionada.coef_operativo) / (numeroTrabajadores * 8))} días
                        </div>
                        <div className="text-primario/70">
                          ({numeroTrabajadores} trabajadores × 8h/día)
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="max-h-96 overflow-y-auto space-y-2">
                  {tareasFiltradas.length === 0 ? (
                    <div className="text-center py-8 text-primario/70">
                      {busquedaTarea ? 'No se encontraron tareas con ese criterio' : 'No hay tareas disponibles para esta fase'}
                    </div>
                  ) : (
                    tareasFiltradas.map((tarea) => (
                      <button
                        key={tarea.id}
                        onClick={() => handleTareaClick(tarea)}
                        className={`w-full text-left p-3 border rounded-lg transition-all duration-200 group ${
                          tareaSeleccionada?.id === tarea.id
                            ? 'border-primario bg-primario/10'
                            : 'border-claro hover:bg-claro/50 hover:border-primario/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-primario group-hover:text-primario/90 text-sm">
                              {tarea.nombre}
                            </div>
                            <div className="text-xs text-primario/70 mt-1 flex items-center space-x-2">
                              <span className="font-mono bg-claro px-2 py-1 rounded">
                                {tarea.id}
                              </span>
                              <span>{tarea.unidad}</span>
                              <span>•</span>
                              <span>{tarea.coef_operativo}h/ud</span>
                            </div>
                          </div>
                          <div className="text-primario/30 group-hover:text-primario/70 transition-colors duration-200">
                            {tareaSeleccionada?.id === tarea.id ? '✓' : '→'}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Carrito de tareas */}
                {carrito.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-claro">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-lg font-semibold text-primario flex items-center space-x-2">
                        <ShoppingCart className="h-5 w-5" />
                        <span>Carrito de {subcategoriasPorPrefijo[subcategoriaSeleccionada]} ({carrito.length})</span>
                      </h5>
                      <div className="flex space-x-2">
                        {carrito.length > 0 && (
                          <button
                            onClick={handleLimpiarCarrito}
                            className="bg-red-500 text-white px-3 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors duration-200 text-sm flex items-center space-x-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Limpiar</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            console.log('🟢 Botón Confirmar clickeado');
                            handleConfigurarTodas();
                          }}
                          className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors duration-200 text-sm flex items-center space-x-2"
                        >
                          <Check className="h-4 w-4" />
                          <span>Confirmar</span>
                        </button>
                      </div>
                    </div>
                    
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {carrito.map((item, index) => (
                        <div key={`${item.tarea.id}-${index}`} className="bg-claro p-3 rounded-lg border border-claro">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-primario text-sm">
                                {item.tarea.nombre}
                              </div>
                              <div className="text-xs text-primario/70 mt-1 flex items-center space-x-2">
                                <span className="font-mono bg-white px-2 py-1 rounded">
                                  {item.tarea.id}
                                </span>
                                <span>{item.cantidad} {item.tarea.unidad}</span>
                                <span>•</span>
                                <span className="font-semibold text-acento">
                                  {item.horasTotales.toFixed(1)}h total
                                </span>
                                <span>•</span>
                                <span className="font-semibold text-primario">
                                  {item.diasEstimados} días
                                </span>
                              </div>
                              <div className="text-xs text-primario/60 mt-1">
                                {item.trabajadores} trabajadores × 8h/día
                              </div>
                            </div>
                            <button
                              onClick={() => handleEliminarDelCarrito(index)}
                              className="text-red-500 hover:text-red-700 transition-colors duration-200 ml-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-claro">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-primario/70">Total de horas:</span>
                          <span className="font-semibold text-primario">
                            {carrito.reduce((sum, item) => sum + item.horasTotales, 0).toFixed(1)}h
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-primario/70">Días estimados:</span>
                          <span className="font-semibold text-primario">
                            {carrito.reduce((sum, item) => sum + item.diasEstimados, 0)} días
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

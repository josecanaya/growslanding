'use client';

import { useEffect, useState } from 'react';
import { CONFIGURACIONES_TECNICAS } from '@/lib/cliente/config/configuracionesTecnicas';
import { useElementosStore } from './useElementosStore';

type Tipo = {
  nombre: string;
  fases: { estructura: any[]; obra_gris: any[]; terminaciones: any[] };
  elementoCompleto?: {
    id?: string;
    nombre: string;
    unidad: string;
    opciones?: Record<string, string[]>;
    tareas?: string[];
  };
};

type GrupoGridPanelProps = {
  titulo: string;
  tipos: Tipo[];
  plantaId?: string;
  tareasObra?: Array<{ id: string; nombre: string; codigo?: string }>; // Tareas ya cargadas en la obra
  obraId?: string;
  subcategoria?: string;
  elementoSeleccionadoInicial?: string; // Elemento preseleccionado desde CategoriaGridPanel
  onSelectElemento?: (nombre: string) => void;
  onConfigOpen?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
};

// Mapeo de códigos cortos a nombres descriptivos
const mapeoCodigosANombres: Record<string, string> = {
  'R00': 'Replanteo general',
  'R01': 'Replanteo de columnas',
  'R02': 'Replanteo de vigas',
  'R03': 'Replanteo de losas',
  'R04': 'Replanteo de cubierta',
  'D01': 'Excavación',
  'D03': 'Demolición',
  'H01': 'Hormigón de columnas',
  'H11': 'Hormigón de bases',
  'H15': 'Hormigón de encadenado',
  'H16': 'Hormigón de losa',
  'H17': 'Hormigón de vigas',
  'M01': 'Mampostería',
  'M02': 'Mampostería adicional',
  'M25': 'Mampostería doble muro',
  'M27': 'Mampostería de muros',
  'RV01': 'Revoque grueso exterior',
  'RV02': 'Revoque fino exterior',
  'RV03': 'Revoque grueso interior',
  'RV04': 'Revoque fino interior',
  'RV05': 'Pintura exterior',
  'RV06': 'Pintura interior',
  'EL01': 'Instalación eléctrica cubierta',
  'EL02': 'Instalación eléctrica general',
  'EL03': 'Puntos eléctricos',
  'C01': 'Estructura de cubierta chapa',
  'C02': 'Cubierta de chapa',
  'C03': 'Estructura de cubierta teja',
  'C04': 'Cubierta de teja',
  'C05': 'Estructura escalera metálica',
  'C06': 'Montaje escalera metálica',
  'C07': 'Carpintería puerta madera',
  'C08': 'Instalación puerta madera',
  'C09': 'Carpintería ventana madera',
  'C10': 'Instalación ventana madera',
  'C11': 'Carpintería puerta aluminio',
  'C12': 'Instalación puerta aluminio',
  'C13': 'Carpintería ventana aluminio',
  'C14': 'Instalación ventana aluminio',
  'TE01': 'Contrapiso',
  'TE02': 'Nivelación de piso',
  'TE03': 'Cerámica',
  'TE04': 'Porcelanato',
  'TE05': 'Impermeabilización techo',
  'TE06': 'Terminación techo',
  'TE07': 'Terminación cubierta chapa',
  'TE08': 'Terminación cubierta teja',
  'TE09': 'Revoque escalera',
  'TE10': 'Terminación escalera hormigón',
  'TE11': 'Terminación escalera metálica',
  'TE12': 'Terminación puerta madera',
  'TE13': 'Terminación ventana madera',
  'TE14': 'Terminación puerta aluminio',
  'TE15': 'Terminación ventana aluminio',
  'TE30': 'Terminación de muros'
};

const obtenerNombreTarea = (codigo: string): string => {
  return mapeoCodigosANombres[codigo] || codigo;
};

export default function GrupoGridPanel({ titulo, tipos, plantaId, tareasObra = [], obraId, subcategoria, elementoSeleccionadoInicial, onSelectElemento, onConfigOpen, onPrev, onNext }: GrupoGridPanelProps) {
  const addElemento = useElementosStore((s) => s.addElemento);
  const getElementoPorNombre = useElementosStore((s) => s.getElementoPorNombre);
  const tareas = new Set<string>();
  tipos.forEach((t) => {
    if (t.fases?.estructura?.length) tareas.add('Estructura');
    if (t.fases?.obra_gris?.length) tareas.add('Obra gris');
    if (t.fases?.terminaciones?.length) tareas.add('Terminaciones');
  });

  const [selected, setSelected] = useState<string | null>(elementoSeleccionadoInicial || null);
  const [unidad, setUnidad] = useState<string>('m²');
  const [cantidad, setCantidad] = useState<number>(0);
  const [configValues, setConfigValues] = useState<Record<string, any>>({});
  const [showTecnico, setShowTecnico] = useState(false);
  const [tareaSeleccionadaPrecedencia, setTareaSeleccionadaPrecedencia] = useState<string | null>(null);
  const [precedencias, setPrecedencias] = useState<Record<string, string[]>>({}); // codigoTarea -> [codigosPrecedencias]

  /**
   * Obtiene las configuraciones para un elemento combinando:
   * 1. Configuraciones del JSON del catálogo (opciones)
   * 2. Configuraciones hardcodeadas en CONFIGURACIONES_TECNICAS
   */
  const obtenerConfiguracionesElemento = (nombre: string): Record<string, any> => {
    const elemento = tipos.find(t => t.nombre === nombre);
    const configs: Record<string, any> = {};

    // 1. Configuraciones desde el JSON del catálogo (opciones)
    if (elemento?.elementoCompleto?.opciones) {
      Object.entries(elemento.elementoCompleto.opciones).forEach(([key, opciones]) => {
        configs[key] = {
          label: key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          type: 'select',
          options: opciones,
          source: 'catalogo'
        };
      });
    }

    // 2. Configuraciones hardcodeadas (tienen prioridad si hay conflicto de nombres)
    const configsHardcoded: any = (CONFIGURACIONES_TECNICAS as any)[nombre] || {};
    Object.entries(configsHardcoded).forEach(([key, cfg]: any) => {
      configs[key] = {
        ...cfg,
        source: 'hardcoded'
      };
    });

    return configs;
  };

  const handleSelect = (nombre: string) => {
    const elemento = tipos.find(t => t.nombre === nombre);
    
    // Establecer unidad desde el elemento completo si existe
    if (elemento?.elementoCompleto?.unidad) {
      setUnidad(elemento.elementoCompleto.unidad);
    } else {
      setUnidad('m²'); // Default
    }

    setSelected(nombre);
    onSelectElemento?.(nombre);
    setShowTecnico(false);
    const configs = obtenerConfiguracionesElemento(nombre);
    const init: Record<string, any> = {};
    Object.entries(configs).forEach(([k, cfg]: any) => {
      init[k] = cfg.default ?? (cfg.type === 'checkbox' ? false : '');
    });
    setConfigValues(init);
  };

  // Función para validar UUID
  const esUUID = (valor: string | null | undefined): boolean => {
    if (!valor || typeof valor !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(valor);
  };

  const handleApply = async () => {
    if (!selected || !elementoEncontrado) return;
    
    console.log('[GrupoGridPanel] handleApply - obraId:', obraId, 'selected:', selected);
    console.log('[GrupoGridPanel] obraId es UUID válido:', esUUID(obraId));
    
    // Verificar que tenemos obraId y que es un UUID válido antes de continuar
    if (!obraId || !esUUID(obraId)) {
      console.error('[GrupoGridPanel] No hay obraId válido disponible. obraId recibido:', obraId);
      alert(`Error: No se pudo identificar la obra correctamente. El elemento "${selected}" se guardó solo en memoria local.\n\nObraId recibido: ${obraId || 'undefined'}\n\nPor favor, recargá la página e intentá nuevamente desde la vista de detalle de la obra.`);
      
      // Guardar en el store local como fallback
      addElemento({
        nombreElemento: selected,
        grupo: titulo,
        plantaId,
        unidad,
        cantidad,
        configuraciones: configValues,
        tareas: elementoEncontrado.fases,
        precedencias: precedencias,
      });
      return;
    }
    
    try {
      // Obtener unidad del elemento completo si existe, sino usar la seleccionada
      const elementoCompleto = elementoEncontrado?.elementoCompleto;
      const unidadFinal = elementoCompleto?.unidad || unidad || 'unidad';

      // Crear descripción con las configuraciones
      const descripcionConfig = Object.entries(configValues)
        .filter(([_, value]) => value !== '' && value !== null && value !== undefined && value !== false)
        .map(([key, value]) => {
          const configs = obtenerConfiguracionesElemento(selected);
          const label = configs[key]?.label || key;
          return `${label}: ${value}`;
        })
        .join('; ');

      const payloadElemento = {
        nombre: selected,
        categoria: titulo,
        subcategoria: subcategoria || null,
        unidad: unidadFinal,
        cantidad: cantidad || 1,
        planta_id: plantaId || null,
        costo_unitario: 0,
        descripcion: descripcionConfig || null,
      };

      console.log('[GrupoGridPanel] Guardando elemento en Supabase:', payloadElemento);

      const response = await fetch(`/api/obras/${obraId}/elementos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payloadElemento),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[GrupoGridPanel] Error guardando elemento "${selected}":`, errorText);
        alert(`Error al guardar el elemento en Supabase: ${errorText}`);
        return;
      }

      const result = await response.json();
      console.log('[GrupoGridPanel] Elemento guardado exitosamente:', result);

      // Guardar también en el store local (para compatibilidad)
      addElemento({
        nombreElemento: selected,
        grupo: titulo,
        plantaId,
        unidad,
        cantidad,
        configuraciones: configValues,
        tareas: elementoEncontrado.fases,
        precedencias: precedencias,
      });

      // Mostrar confirmación
      alert(`Elemento "${selected}" guardado correctamente en Supabase`);
      
      // Disparar evento personalizado para que ElementosContainer recargue
      window.dispatchEvent(new CustomEvent('elemento-agregado'));
      
      // Resetear selección
      setSelected(null);
      setCantidad(0);
      setUnidad('m²');
      setConfigValues({});
      setPrecedencias({});
    } catch (err) {
      console.error(`[GrupoGridPanel] Error guardando elemento "${selected}":`, err);
      alert(`Error al guardar el elemento: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  // Sincronizar con elemento seleccionado inicial desde CategoriaGridPanel
  useEffect(() => {
    if (elementoSeleccionadoInicial && elementoSeleccionadoInicial !== selected) {
      const elemento = tipos.find(t => t.nombre === elementoSeleccionadoInicial);
      if (elemento) {
        if (elemento?.elementoCompleto?.unidad) {
          setUnidad(elemento.elementoCompleto.unidad);
        } else {
          setUnidad('m²');
        }
        setSelected(elementoSeleccionadoInicial);
        onSelectElemento?.(elementoSeleccionadoInicial);
        setShowTecnico(false);
        const configs = obtenerConfiguracionesElemento(elementoSeleccionadoInicial);
        const init: Record<string, any> = {};
        Object.entries(configs).forEach(([k, cfg]: any) => {
          init[k] = cfg.default ?? (cfg.type === 'checkbox' ? false : '');
        });
        setConfigValues(init);
      }
    }
  }, [elementoSeleccionadoInicial, tipos]);

  // Si hay subcategoria y tipos disponibles pero no hay selección, seleccionar el primer elemento automáticamente
  useEffect(() => {
    if (subcategoria && tipos.length > 0 && !selected && !elementoSeleccionadoInicial) {
      const primerElemento = tipos[0].nombre;
      handleSelect(primerElemento);
    }
  }, [subcategoria, tipos.length, elementoSeleccionadoInicial]);

  useEffect(() => {
    if (!selected) return;
    const configs = obtenerConfiguracionesElemento(selected);
    const init: Record<string, any> = {};
    Object.entries(configs).forEach(([k, cfg]: any) => {
      init[k] = configValues[k] ?? (cfg.default ?? (cfg.type === 'checkbox' ? false : ''));
    });
    setConfigValues(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // Matching flexible para encontrar elementos
  const elementoEncontrado = selected ? (
    tipos.find(t => t.nombre.toLowerCase().trim() === selected.toLowerCase().trim()) ||
    tipos.find(t => 
      selected.toLowerCase().includes(t.nombre.split(" ")[0].toLowerCase()) ||
      t.nombre.toLowerCase().includes(selected.split(" ")[0].toLowerCase())
    ) ||
    tipos[0] // fallback
  ) : null;
  
  const fasesSeleccionadas = elementoEncontrado?.fases || { estructura: [], obra_gris: [], terminaciones: [] };
  const updatePrecedencias = useElementosStore((s) => s.updatePrecedencias);
  
  // Cargar datos existentes cuando se selecciona un elemento
  useEffect(() => {
    if (!selected || !plantaId) return;
    const existente = getElementoPorNombre(selected, plantaId);
    if (existente) {
      setUnidad(existente.unidad);
      setCantidad(existente.cantidad);
      setConfigValues(existente.configuraciones);
      setPrecedencias(existente.precedencias || {});
    } else {
      // Reset some default values
      setUnidad('m²');
      setCantidad(0);
      setPrecedencias({});
    }
  }, [selected, plantaId, getElementoPorNombre]);
  
  // Debug: mostrar en consola solo si realmente no se encontró ningún match (ni siquiera por fallback)
  if (selected && !elementoEncontrado && tipos.length > 0) {
    console.warn('Elemento no encontrado:', selected, 'Tipos disponibles:', tipos.map(t => t.nombre));
  } else if (selected && elementoEncontrado && elementoEncontrado.nombre !== selected) {
    // Si se encontró por matching flexible, log informativo
    console.log(`[GrupoGridPanel] Elemento encontrado por matching flexible: "${selected}" → "${elementoEncontrado.nombre}"`);
  }

  // Si se está usando dentro de CategoriaGridPanel, no mostrar el header duplicado
  const mostrarHeader = !subcategoria; // Solo mostrar header si no hay subcategoría (uso standalone)

  return (
    <div className={mostrarHeader ? "rounded-xl overflow-hidden border border-gray-200 shadow-sm" : "h-full"}>
      {/* Header grande - solo si es uso standalone */}
      {mostrarHeader && (
        <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: '#1f5a8a' }}>
          <button
            type="button"
            onClick={onPrev}
            className="rounded-md border border-white/30 text-white/90 hover:bg-white/10 px-2 py-1"
            aria-label="Anterior"
          >
            ‹
          </button>
          <h2 className="text-white text-2xl font-bold tracking-wide text-center flex-1">{titulo.toUpperCase()}</h2>
          <button
            type="button"
            onClick={onNext}
            className="rounded-md border border-white/30 text-white/90 hover:bg-white/10 px-2 py-1"
            aria-label="Siguiente"
          >
            ›
          </button>
        </div>
      )}

      {/* Contenido: Si hay subcategoría, solo mostrar configuraciones y tareas */}
      {mostrarHeader ? (
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Columna izquierda: elementos */}
          <div className="border-r border-gray-200">
            {tipos.length === 0 && (
              <div className="p-4 text-sm text-gray-500">Sin elementos definidos</div>
            )}
            {tipos.map((t) => (
              <button
                key={t.nombre}
                type="button"
                onClick={() => handleSelect(t.nombre)}
                className={`w-full px-6 py-4 text-left border-b border-gray-200 transition ${selected === t.nombre ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
              >
                <span className="text-gray-800">{t.nombre}</span>
              </button>
            ))}
          </div>

          {/* Columna derecha: configuraciones */}
          <div className="hidden md:block p-6">
          <h3 className="text-center text-sm font-medium text-gray-700">CONFIGURACIONES</h3>
          {!selected ? (
            <div className="mt-4 h-40 rounded-lg border border-dashed border-gray-300 grid place-items-center text-gray-400 text-sm">
              Seleccioná un elemento de la lista para configurarlo
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="text-sm text-gray-700">
                Elemento seleccionado: <span className="font-semibold">{selected}</span>
                {subcategoria && (
                  <span className="ml-2 text-xs text-gray-500">({subcategoria})</span>
                )}
              </div>
              <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                {Object.entries(obtenerConfiguracionesElemento(selected)).length === 0 ? (
                  <div className="text-xs text-gray-500">Sin configuraciones técnicas específicas para este elemento.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(obtenerConfiguracionesElemento(selected)).map(([k, cfg]: any) => (
                      <div key={k} className="bg-white border border-gray-200 rounded-md px-3 py-2">
                        <label className="block text-xs text-gray-600 mb-1">{cfg.label}</label>
                        {cfg.type === 'select' && (
                          <select
                            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                            value={configValues[k] ?? ''}
                            onChange={(e) => setConfigValues((prev) => ({ ...prev, [k]: e.target.value }))}
                          >
                            <option value="">Seleccionar...</option>
                            {(cfg.options || []).map((op: string) => (
                              <option key={op} value={op}>{op}</option>
                            ))}
                          </select>
                        )}
                        {cfg.type === 'number' && (
                          <input
                            type="number"
                            min={cfg.min}
                            max={cfg.max}
                            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                            value={configValues[k] ?? cfg.default ?? ''}
                            onChange={(e) => setConfigValues((prev) => ({ ...prev, [k]: e.target.value }))}
                          />
                        )}
                        {cfg.type === 'text' && (
                          <input
                            type="text"
                            placeholder={cfg.placeholder}
                            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                            value={configValues[k] ?? ''}
                            onChange={(e) => setConfigValues((prev) => ({ ...prev, [k]: e.target.value }))}
                          />
                        )}
                        {cfg.type === 'checkbox' && (
                          <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={!!configValues[k]}
                              onChange={(e) => setConfigValues((prev) => ({ ...prev, [k]: e.target.checked }))}
                            />
                            <span>{cfg.label}</span>
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Unidad</label>
                  <select
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    value={unidad}
                    onChange={(e) => setUnidad(e.target.value)}
                  >
                    <option value="m²">m²</option>
                    <option value="m³">m³</option>
                    <option value="unidad">unidad</option>
                    <option value="ml">ml</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Cantidad</label>
                  <input
                    type="number"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    value={cantidad}
                    onChange={(e) => setCantidad(Number(e.target.value))}
                    min={0}
                  />
                </div>
              </div>
              <div className="text-right">
                <button
                  type="button"
                  onClick={handleApply}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Aplicar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Fila inferior: TAREAS y Precedencias */}
        <div className="col-span-1 md:col-span-2 border-t border-gray-200">
          <div className="px-6 py-3 text-center text-sm font-semibold text-gray-700 border-b border-gray-200">TAREAS</div>
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Tareas */}
            <div className="border-r border-gray-200 p-4">
              {!selected ? (
                <div className="text-sm text-gray-500">Seleccioná un elemento para ver sus tareas asociadas.</div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-semibold text-gray-800 mb-2">Estructura</div>
                    {fasesSeleccionadas.estructura.length === 0 ? (
                      <div className="text-xs text-gray-500">Sin tareas</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {fasesSeleccionadas.estructura.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setTareaSeleccionadaPrecedencia(c)}
                            className={`px-3 py-1 border rounded-md text-xs transition ${tareaSeleccionadaPrecedencia === c ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-800 bg-gray-50 hover:bg-gray-100'}`}
                            title={obtenerNombreTarea(c)}
                          >
                            {obtenerNombreTarea(c)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800 mb-2">Obra gris</div>
                    {fasesSeleccionadas.obra_gris.length === 0 ? (
                      <div className="text-xs text-gray-500">Sin tareas</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {fasesSeleccionadas.obra_gris.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setTareaSeleccionadaPrecedencia(c)}
                            className={`px-3 py-1 border rounded-md text-xs transition ${tareaSeleccionadaPrecedencia === c ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-800 bg-gray-50 hover:bg-gray-100'}`}
                            title={obtenerNombreTarea(c)}
                          >
                            {obtenerNombreTarea(c)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800 mb-2">Terminaciones</div>
                    {fasesSeleccionadas.terminaciones.length === 0 ? (
                      <div className="text-xs text-gray-500">Sin tareas</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {fasesSeleccionadas.terminaciones.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setTareaSeleccionadaPrecedencia(c)}
                            className={`px-3 py-1 border rounded-md text-xs transition ${tareaSeleccionadaPrecedencia === c ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-800 bg-gray-50 hover:bg-gray-100'}`}
                            title={obtenerNombreTarea(c)}
                          >
                            {obtenerNombreTarea(c)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Precedencias */}
            <div className="p-4">
              <h4 className="text-center text-sm font-medium text-gray-700 mb-2">
                Precedencias
                {tareaSeleccionadaPrecedencia && (
                  <span className="ml-2 text-xs text-gray-500 font-normal">
                    ({obtenerNombreTarea(tareaSeleccionadaPrecedencia)})
                  </span>
                )}
              </h4>
              {!tareaSeleccionadaPrecedencia ? (
                <div className="h-28 rounded-lg border border-dashed border-gray-300 grid place-items-center text-gray-400 text-sm">
                  Seleccioná una tarea para definir precedencias
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-gray-600 mb-2">Tareas disponibles en la obra:</div>
                  {tareasObra.length === 0 ? (
                    <div className="text-xs text-gray-500 py-4">No hay tareas cargadas en la obra aún.</div>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {tareasObra.map((tarea) => {
                        const precedenciasTarea = precedencias[tareaSeleccionadaPrecedencia] || [];
                        const estaSeleccionada = precedenciasTarea.includes(tarea.codigo || tarea.id);
                        return (
                          <label key={tarea.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={estaSeleccionada}
                             ราะ onChange={(e) => {
                                const nuevasPrecedencias = e.target.checked
                                  ? [...precedenciasTarea, tarea.codigo || tarea.id]
                                  : precedenciasTarea.filter(p => p !== (tarea.codigo || tarea.id));
                                const nuevasPrecedenciasObj = {
                                  ...precedencias,
                                  [tareaSeleccionadaPrecedencia]: nuevasPrecedencias
                                };
                                setPrecedencias(nuevasPrecedenciasObj);
                                
                                // Guardar en store si hay un elemento guardado
                                if (selected && plantaId) {
                                  const existente = getElementoPorNombre(selected, plantaId);
                                  if (existente && tareaSeleccionadaPrecedencia) {
                                    updatePrecedencias(existente.id, tareaSeleccionadaPrecedencia, nuevasPrecedencias);
                                  }
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-gray-800">{tarea.nombre}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      ) : (
        /* Modo sin header: solo configuraciones y tareas (dentro de CategoriaGridPanel) */
        <div className="h-full flex flex-col">
          {/* Configuraciones */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-center text-sm font-medium text-gray-700 mb-4">CONFIGURACIONES</h3>
            {!selected ? (
              <div className="h-40 rounded-lg border border-dashed border-gray-300 grid place-items-center text-gray-400 text-sm">
                Seleccioná un elemento de la lista para configurarlo
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-gray-700">
                  Elemento seleccionado: <span className="font-semibold">{selected}</span>
                  {subcategoria && (
                    <span className="ml-2 text-xs text-gray-500">({subcategoria})</span>
                  )}
                </div>
                <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                  {Object.entries(obtenerConfiguracionesElemento(selected)).length === 0 ? (
                    <div className="text-xs text-gray-500">Sin configuraciones técnicas específicas para este elemento.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(obtenerConfiguracionesElemento(selected)).map(([k, cfg]: any) => (
                        <div key={k} className="bg-white border border-gray-200 rounded-md px-3 py-2">
                          <label className="block text-xs text-gray-600 mb-1">{cfg.label}</label>
                          {cfg.type === 'select' && (
                            <select
                              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                              value={configValues[k] ?? ''}
                              onChange={(e) => setConfigValues((prev) => ({ ...prev, [k]: e.target.value }))}
                            >
                              <option value="">Seleccionar...</option>
                              {(cfg.options || []).map((op: string) => (
                                <option key={op} value={op}>{op}</option>
                              ))}
                            </select>
                          )}
                          {cfg.type === 'number' && (
                            <input
                              type="number"
                              min={cfg.min}
                              max={cfg.max}
                              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                              value={configValues[k] ?? cfg.default ?? ''}
                              onChange={(e) => setConfigValues((prev) => ({ ...prev, [k]: e.target.value }))}
                            />
                          )}
                          {cfg.type === 'text' && (
                            <input
                              type="text"
                              placeholder={cfg.placeholder}
                              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                              value={configValues[k] ?? ''}
                              onChange={(e) => setConfigValues((prev) => ({ ...prev, [k]: e.target.value }))}
                            />
                          )}
                          {cfg.type === 'checkbox' && (
                            <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                              <input
                                type="checkbox"
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={!!configValues[k]}
                                onChange={(e) => setConfigValues((prev) => ({ ...prev, [k]: e.target.checked }))}
                              />
                              <span>{cfg.label}</span>
                            </label>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Unidad</label>
                    <select
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                      value={unidad}
                      onChange={(e) => setUnidad(e.target.value)}
                    >
                      <option value="m²">m²</option>
                      <option value="m³">m³</option>
                      <option value="unidad">unidad</option>
                      <option value="ml">ml</option>
                      <option value="kg">kg</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Cantidad</label>
                    <input
                      type="number"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                      value={cantidad}
                      onChange={(e) => setCantidad(Number(e.target.value))}
                      min={0}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={handleApply}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* TAREAS y Precedencias */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-3 text-center text-sm font-semibold text-gray-700 border-b border-gray-200">TAREAS</div>
            <div className="grid grid-cols-1 md:grid-cols-2 h-full">
              {/* Tareas */}
              <div className="border-r border-gray-200 p-4">
                {!selected ? (
                  <div className="text-sm text-gray-500">Seleccioná un elemento para ver sus tareas asociadas.</div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-semibold text-gray-800 mb-2">Estructura</div>
                      {fasesSeleccionadas.estructura.length === 0 ? (
                        <div className="text-xs text-gray-500">Sin tareas</div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {fasesSeleccionadas.estructura.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setTareaSeleccionadaPrecedencia(c)}
                              className={`px-3 py-1 border rounded-md text-xs transition ${tareaSeleccionadaPrecedencia === c ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-800 bg-gray-50 hover:bg-gray-100'}`}
                              title={obtenerNombreTarea(c)}
                            >
                              {obtenerNombreTarea(c)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800 mb-2">Obra gris</div>
                      {fasesSeleccionadas.obra_gris.length === 0 ? (
                        <div className="text-xs text-gray-500">Sin tareas</div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {fasesSeleccionadas.obra_gris.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setTareaSeleccionadaPrecedencia(c)}
                              className={`px-3 py-1 border rounded-md text-xs transition ${tareaSeleccionadaPrecedencia === c ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-800 bg-gray-50 hover:bg-gray-100'}`}
                              title={obtenerNombreTarea(c)}
                            >
                              {obtenerNombreTarea(c)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800 mb-2">Terminaciones</div>
                      {fasesSeleccionadas.terminaciones.length === 0 ? (
                        <div className="text-xs text-gray-500">Sin tareas</div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {fasesSeleccionadas.terminaciones.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setTareaSeleccionadaPrecedencia(c)}
                              className={`px-3 py-1 border rounded-md text-xs transition ${tareaSeleccionadaPrecedencia === c ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-800 bg-gray-50 hover:bg-gray-100'}`}
                              title={obtenerNombreTarea(c)}
                            >
                              {obtenerNombreTarea(c)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {/* Precedencias */}
              <div className="p-4">
                <div className="text-sm font-semibold text-gray-800 mb-3">Precedencias</div>
                {!tareaSeleccionadaPrecedencia ? (
                  <div className="text-sm text-gray-500">Seleccioná una tarea para definir precedencias</div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-700 mb-2">
                      Tarea seleccionada: <span className="font-semibold">{obtenerNombreTarea(tareaSeleccionadaPrecedencia)}</span>
                    </div>
                    <div className="text-xs text-gray-600 mb-3">Seleccioná las tareas que deben completarse antes de esta:</div>
                    {tareasObra.length === 0 ? (
                      <div className="text-xs text-gray-500">No hay tareas disponibles en la obra</div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {tareasObra
                          .filter(t => t.id !== tareaSeleccionadaPrecedencia)
                          .map((tarea) => {
                            const precs = precedencias[tareaSeleccionadaPrecedencia] || [];
                            const isPrecedencia = precs.includes(tarea.id);
                            return (
                              <label key={tarea.id} className="flex items-center gap-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isPrecedencia}
                                  onChange={() => {
                                    const nuevasPrecedencias = { ...precedencias };
                                    if (!nuevasPrecedencias[tareaSeleccionadaPrecedencia]) {
                                      nuevasPrecedencias[tareaSeleccionadaPrecedencia] = [];
                                    }
                                    if (isPrecedencia) {
                                      nuevasPrecedencias[tareaSeleccionadaPrecedencia] = nuevasPrecedencias[tareaSeleccionadaPrecedencia].filter(id => id !== tarea.id);
                                    } else {
                                      nuevasPrecedencias[tareaSeleccionadaPrecedencia].push(tarea.id);
                                    }
                                    setPrecedencias(nuevasPrecedencias);
                                  }}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-xs text-gray-700">{tarea.nombre}</span>
                              </label>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Configuración técnica mostrada inline; no se usa modal aquí */}
    </div>
  );
}



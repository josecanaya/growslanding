'use client';

import { useState, useMemo } from 'react';
import GrupoGridPanel from './GrupoGridPanel';
import { ChevronDown, ChevronRight } from 'lucide-react';

type ElementoCatalogo = {
  id: string;
  nombre: string;
  unidad: string;
  opciones?: Record<string, string[]>;
  tareas?: string[];
};

type SubcategoriaData = {
  id: string;
  nombre: string;
  elementos: ElementoCatalogo[];
};

type CategoriaGridPanelProps = {
  categoriaId: string;
  categoriaNombre: string;
  subcategorias: SubcategoriaData[];
  plantaId?: string;
  tareasObra?: Array<{ id: string; nombre: string; codigo?: string }>;
  obraId?: string;
  elementosCargados?: Set<string>;
  onSelectElemento?: (nombre: string) => void;
};

export default function CategoriaGridPanel({
  categoriaId,
  categoriaNombre,
  subcategorias,
  plantaId,
  tareasObra,
  obraId,
  elementosCargados = new Set(),
  onSelectElemento
}: CategoriaGridPanelProps) {
  const [subcategoriaActiva, setSubcategoriaActiva] = useState<string | null>(
    subcategorias[0]?.id || null
  );
  const [subcategoriasAbiertas, setSubcategoriasAbiertas] = useState<Set<string>>(
    new Set([subcategorias[0]?.id].filter(Boolean) as string[])
  );

  // Mapear tareas a fases
  const mapearTareasAFases = (tareas: string[] = []) => {
    const fases = {
      estructura: [] as string[],
      obra_gris: [] as string[],
      terminaciones: [] as string[]
    };

    tareas.forEach(tarea => {
      const tareaLower = tarea.toLowerCase();
      if (
        tareaLower.includes('replanteo') ||
        tareaLower.includes('excavación') ||
        tareaLower.includes('excavacion') ||
        tareaLower.includes('hormigon') ||
        tareaLower.includes('estructura')
      ) {
        fases.estructura.push(tarea);
      } else if (
        tareaLower.includes('mampostería') ||
        tareaLower.includes('revoque') ||
        tareaLower.includes('instalación') ||
        tareaLower.includes('instalacion')
      ) {
        fases.obra_gris.push(tarea);
      } else {
        fases.terminaciones.push(tarea);
      }
    });

    return fases;
  };

  const [elementoSeleccionado, setElementoSeleccionado] = useState<string | null>(null);
  
  // Preparar elementos de la subcategoría activa para GrupoGridPanel
  const subcategoriaSeleccionada = subcategorias.find(s => s.id === subcategoriaActiva);
  const tiposParaPanel = useMemo(() => {
    if (!subcategoriaSeleccionada) return [];
    
    return subcategoriaSeleccionada.elementos.map(el => ({
      nombre: el.nombre,
      fases: mapearTareasAFases(el.tareas),
      elementoCompleto: el
    }));
  }, [subcategoriaSeleccionada]);

  const toggleSubcategoria = (subcategoriaId: string) => {
    setSubcategoriasAbiertas(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(subcategoriaId)) {
        nuevo.delete(subcategoriaId);
      } else {
        nuevo.add(subcategoriaId);
      }
      return nuevo;
    });
  };

  return (
    <div className="w-full">
      {/* Panel principal con subcategorías y elementos */}
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Columna izquierda: Lista de subcategorías y elementos */}
        <div className="border-r border-gray-200 bg-white">
          {/* Subcategorías colapsables */}
          {subcategorias.map((subcategoria) => {
            const isOpen = subcategoriasAbiertas.has(subcategoria.id);
            const cantidadCargados = subcategoria.elementos.filter(el => 
              elementosCargados.has(el.nombre)
            ).length;
            const cantidadTotal = subcategoria.elementos.length;

            return (
              <div key={subcategoria.id}>
                <button
                  type="button"
                  onClick={() => {
                    toggleSubcategoria(subcategoria.id);
                    setSubcategoriaActiva(subcategoria.id);
                  }}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-200"
                  style={{ backgroundColor: subcategoriaActiva === subcategoria.id ? '#E6EEF7' : 'white' }}
                >
                  <div className="flex items-center gap-2">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 text-gray-600" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-600" />
                    )}
                    <span className="font-medium text-gray-800 text-sm">{subcategoria.nombre}</span>
                    <span className="text-xs text-gray-500">
                      ({cantidadCargados}/{cantidadTotal})
                    </span>
                  </div>
                  {cantidadCargados > 0 && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      {cantidadCargados}
                    </span>
                  )}
                </button>

                {/* Elementos de esta subcategoría */}
                {isOpen && (
                  <div className="bg-gray-50">
                    {subcategoria.elementos.map((elemento) => {
                      const isSelected = elementoSeleccionado === elemento.nombre;
                      const isCargado = elementosCargados.has(elemento.nombre);
                      return (
                        <button
                          key={elemento.id}
                          type="button"
                          onClick={() => {
                            setSubcategoriaActiva(subcategoria.id);
                            setElementoSeleccionado(elemento.nombre);
                            // También disparar la selección en GrupoGridPanel
                            if (onSelectElemento) {
                              onSelectElemento(elemento.nombre);
                            }
                          }}
                          className={`w-full px-6 py-3 text-left border-b border-gray-100 transition text-sm ${
                            isSelected ? 'bg-blue-50 text-blue-900' : 'hover:bg-blue-50 text-gray-700'
                          }`}
                        >
                          {elemento.nombre}
                          {isCargado && (
                            <span className="ml-2 text-xs text-green-600">✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Columna derecha: Configuraciones y Tareas */}
        <div className="bg-white h-full">
          {subcategoriaSeleccionada && tiposParaPanel.length > 0 ? (
            <GrupoGridPanel
              titulo={categoriaNombre}
              tipos={tiposParaPanel}
              plantaId={plantaId}
              tareasObra={tareasObra}
              obraId={obraId}
              subcategoria={subcategoriaSeleccionada.nombre}
              elementoSeleccionadoInicial={elementoSeleccionado || undefined}
              onSelectElemento={(nombre) => {
                setElementoSeleccionado(nombre);
                console.log('Elemento seleccionado en GrupoGridPanel:', nombre);
              }}
            />
          ) : (
            <div className="p-6 text-center text-gray-500">
              <p>Seleccioná una subcategoría para ver sus elementos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


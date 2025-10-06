'use client';

import { useState } from 'react';
import { Settings, Package, Layers, Calendar, Plus, Check } from 'lucide-react';
import { CATALOGO_ELEMENTOS, ElementoConstructivo, OpcionElemento } from '../catalogo-elementos';
import { ConfiguracionTecnicaModal } from '../ConfiguracionTecnicaModalNuevo';

interface Seleccion {
  subgrupo: string;
  elementoNombre: string;
  opcionId: string;
  opcionLabel: string;
  unidad?: string;
  duracionEstimadaDias?: number;
  tareasSugeridas?: string[];
  configuracionTecnica?: Record<string, any>;
}

interface PasoMurosProps {
  elementosSeleccionados: Seleccion[];
  onElementosChange: (elementos: Seleccion[]) => void;
}

export function PasoMuros({ elementosSeleccionados, onElementosChange }: PasoMurosProps) {
  const [elementoSeleccionado, setElementoSeleccionado] = useState<{elemento: ElementoConstructivo, opcion: OpcionElemento} | null>(null);
  const [showConfiguracion, setShowConfiguracion] = useState(false);

  const elementosMuros = CATALOGO_ELEMENTOS.filter(el => el.categoria === 'Muros y Cerramientos');
  const seleccionesMuros = elementosSeleccionados.filter(s => s.subgrupo === 'Muros y Cerramientos');

  const handleElementoSeleccionado = (elemento: ElementoConstructivo, opcion: OpcionElemento, configuracion: Record<string, any>) => {
    const nuevaSeleccion: Seleccion = {
      subgrupo: elemento.categoria,
      elementoNombre: elemento.nombre,
      opcionId: `${elemento.id}-${opcion.id}`,
      opcionLabel: `${opcion.nombre} - ${Object.entries(configuracion).map(([key, value]) => `${key}: ${value}`).join(', ')}`,
      unidad: 'm²',
      duracionEstimadaDias: 4,
      tareasSugeridas: ['M01', 'M02', 'M03'],
      configuracionTecnica: configuracion
    };

    onElementosChange([...elementosSeleccionados.filter(s => s.opcionId !== nuevaSeleccion.opcionId), nuevaSeleccion]);
    setShowConfiguracion(false);
  };

  const handleConfigurarElemento = (elemento: ElementoConstructivo, opcion: OpcionElemento) => {
    setElementoSeleccionado({ elemento, opcion });
    setShowConfiguracion(true);
  };

  const handleQuitarSeleccion = (opcionId: string) => {
    onElementosChange(elementosSeleccionados.filter(s => s.opcionId !== opcionId));
  };

  return (
    <div className="min-h-full bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header de la Etapa */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 rounded-xl bg-green-100">
              <span className="text-3xl">🧱</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                Muros y Cerramientos
              </h3>
              <p className="text-gray-600">
                Muros portantes y divisorios
              </p>
            </div>
          </div>

          {seleccionesMuros.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">
                {seleccionesMuros.length} elementos configurados en esta etapa.
              </p>
            </div>
          )}
        </div>

        {/* Grid de Elementos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {elementosMuros.map((elemento) => (
            <div key={elemento.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{elemento.icono}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">{elemento.nombre}</h4>
                    <p className="text-sm text-gray-600">{elemento.descripcion}</p>
                  </div>
                </div>
              </div>

              {/* Opciones del Elemento */}
              <div className="space-y-3">
                {elemento.opciones.map((opcion) => {
                  const yaSeleccionado = seleccionesMuros.some(s => s.opcionId === `${elemento.id}-${opcion.id}`);
                  
                  return (
                    <div key={opcion.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 text-sm">{opcion.nombre}</h5>
                          <p className="text-xs text-gray-600">{opcion.descripcion}</p>
                        </div>
                        <button
                          onClick={() => handleConfigurarElemento(elemento, opcion)}
                          className={`ml-3 px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${
                            yaSeleccionado
                              ? 'bg-green-100 text-green-700 border border-green-300'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300'
                          }`}
                        >
                          {yaSeleccionado ? (
                            <>
                              <Check className="h-3 w-3" />
                              <span>Configurado</span>
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3" />
                              <span>Configurar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Resumen de Selecciones */}
        {seleccionesMuros.length > 0 && (
          <div className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Elementos Seleccionados</h4>
            <div className="space-y-3">
              {seleccionesMuros.map((seleccion) => (
                <div key={seleccion.opcionId} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div>
                    <span className="font-medium text-gray-900">{seleccion.elementoNombre}</span>
                    <span className="text-gray-600 ml-2">- {seleccion.opcionLabel}</span>
                  </div>
                  <button
                    onClick={() => handleQuitarSeleccion(seleccion.opcionId)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Quitar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal de Configuración */}
        {showConfiguracion && elementoSeleccionado && (
          <ConfiguracionTecnicaModal
            elemento={elementoSeleccionado.elemento}
            opcion={elementoSeleccionado.opcion}
            subgrupo="Muros y Cerramientos"
            onClose={() => setShowConfiguracion(false)}
            onAgregar={handleElementoSeleccionado}
            elementosSeleccionados={elementosSeleccionados}
          />
        )}
      </div>
    </div>
  );
}
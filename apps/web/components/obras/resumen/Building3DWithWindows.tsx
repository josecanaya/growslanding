'use client';

import { useState } from 'react';
import { Layers, ArrowRight, FileText } from 'lucide-react';

interface PlantaData {
  id: string;
  nombre: string;
  metrosTotales?: number;
  metrosCubiertos?: number;
  metrosDescubiertos?: number;
  totalElementos?: number;
}

interface Building3DWithWindowsProps {
  pisos?: number;
  plantas?: PlantaData[];
  onClickPiso?: (index: number) => void;
  onAbrirElementos?: (plantaId: string) => void;
  onAbrirLegajo?: (plantaId: string) => void;
  className?: string;
}

export default function Building3DWithWindows({ 
  pisos = 4, 
  plantas = [],
  onClickPiso,
  onAbrirElementos,
  onAbrirLegajo,
  className = '' 
}: Building3DWithWindowsProps) {
  const [selectedPiso, setSelectedPiso] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  const handleClick = (piso: number, index: number) => {
    const newSelected = selectedPiso === piso ? null : piso;
    setSelectedPiso(newSelected);
    if (onClickPiso) {
      onClickPiso(index);
    }
  };

  // Obtener datos de la planta seleccionada
  const plantaSeleccionada = selectedPiso ? (() => {
    // selectedPiso es el pisoLabel: 3 (arriba), 2 (medio), 1 (abajo)
    // El mapeo visual: pisoLabel 3 → plantas[2], pisoLabel 2 → plantas[1], pisoLabel 1 → plantas[0]
    // Entonces: indiceOriginal = pisos - selectedPiso
    const indicePlanta = pisos - selectedPiso;
    return plantas[indicePlanta] || null;
  })() : null;

  return (
    <div className={`flex w-full h-[380px] bg-transparent justify-center items-center ${className}`}>
      {/* Bloque principal: edificio + panel */}
      <div className="flex flex-row gap-10 w-full max-w-[900px] h-full items-center justify-center">
        {/* Edificio - centrado horizontalmente, base abajo */}
        <div className="flex flex-col justify-end items-center w-[220px] h-[320px] relative">
          {/* Cornisa superior - parte del edificio */}
          <div className="w-[150px] h-[10px] bg-slate-400/60 rounded-t-md shadow-sm mb-0"></div>
          
          {/* Pisos apilados desde arriba hacia abajo - el array plantas viene [PB, 1er, 2do...] */}
          {/* Necesitamos mostrar: 2do arriba, 1er medio, PB abajo */}
          {[...Array(pisos)].reverse().map((_, i) => {
            // i=0 → mostrar plantas[pisos-1] (último del array) arriba
            // i=1 → mostrar plantas[pisos-2] (penúltimo) medio
            // i=pisos-1 → mostrar plantas[0] (primero = PB) abajo
            const indiceOriginal = pisos - 1 - i; // Índice en el array original de plantas
            const isPlantaBaja = indiceOriginal === 0; // PB es siempre plantas[0]
            const pisoLabel = pisos - i; // Etiqueta para tracking (3, 2, 1...)
            const plantaActual = plantas[indiceOriginal];
            const tono = indiceOriginal % 2 === 0 ? 'bg-white' : 'bg-slate-50';
            
            return (
              <div key={indiceOriginal} className="flex flex-col items-center">
                <div
                  onMouseEnter={() => setHovered(pisoLabel)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => handleClick(pisoLabel, indiceOriginal)}
                  className={`group relative w-[150px] h-[65px] border border-slate-300 flex flex-col justify-center items-center cursor-pointer transition-all duration-300 rounded-sm ${tono} ${
                    hovered === pisoLabel ? '-translate-y-[2px] shadow-md scale-[1.01]' : ''
                  } ${selectedPiso === pisoLabel ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-200' : ''}`}
                >
                {/* Indicador de selección */}
                {selectedPiso === pisoLabel && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full"></div>
                )}

                {/* Etiqueta */}
                <span className="absolute left-2 top-1 text-[11px] text-slate-600 select-none font-medium">
                  {plantaActual?.nombre || `Piso ${pisoLabel}`}
                </span>

                {/* Ventanas o puerta */}
                {!isPlantaBaja ? (
                  <div className="flex justify-center gap-3 mt-2">
                    {[...Array(3)].map((_, j) => (
                      <div
                        key={j}
                        className={`w-7 h-9 border border-slate-300 rounded-sm shadow-[inset_0_1px_3px_rgba(0,0,0,0.08)] transition-all duration-300 ${
                          hovered === pisoLabel || selectedPiso === pisoLabel
                            ? 'bg-sky-300/70'
                            : 'bg-slate-200/60'
                        }`}
                      ></div>
                    ))}
                  </div>
                ) : (
                  // Planta baja (puerta)
                  <div
                    className={`w-10 h-14 rounded-sm mt-2 transition-all duration-300 ${
                      hovered === pisoLabel || selectedPiso === pisoLabel
                        ? 'bg-sky-700'
                        : 'bg-slate-700'
                    } relative shadow-[inset_0_-2px_4px_rgba(0,0,0,0.2)]`}
                  >
                    {/* Manija de la puerta */}
                    <div className="absolute bottom-3 right-2 w-[4px] h-[4px] bg-white/80 rounded-full"></div>
                  </div>
                )}
                </div>
              </div>
            );
          })}

          {/* Base del edificio */}
          <div className="w-[180px] h-[25px] bg-slate-700 mt-1 rounded-t-sm shadow-md"></div>
        </div>

        {/* Panel derecho con datos reales */}
        <div
          className={`flex-1 max-w-[500px] transition-all duration-500 ${
            selectedPiso ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-6 pointer-events-none'
          }`}
        >
          {selectedPiso && plantaSeleccionada ? (
            <div className="h-full p-5 bg-white rounded-lg border border-slate-200 shadow-sm">
              <h3 className="text-slate-800 font-semibold text-lg mb-2">
                {plantaSeleccionada.nombre}
              </h3>
              
              {/* Datos de superficies */}
              <div className="mb-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Metros Totales</p>
                    <p className="text-lg font-bold text-slate-800">
                      {plantaSeleccionada.metrosTotales || 
                       ((plantaSeleccionada.metrosCubiertos || 0) + (plantaSeleccionada.metrosDescubiertos || 0)) || 
                       'N/A'}
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-xs text-gray-500 mb-1">Cubiertos</p>
                    <p className="text-lg font-bold text-blue-700">
                      {plantaSeleccionada.metrosCubiertos || 0} m²
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <p className="text-xs text-gray-500 mb-1">Descubiertos</p>
                    <p className="text-lg font-bold text-green-700">
                      {plantaSeleccionada.metrosDescubiertos || 0} m²
                    </p>
                  </div>
                </div>
              </div>

              {/* Información adicional */}
              <div className="mb-4 pt-3 border-t border-gray-200">
                <p className="text-sm text-slate-600 mb-2">
                  <span className="font-medium">{plantaSeleccionada.totalElementos || 0}</span> elementos configurados
                </p>
              </div>

              {/* Botones de acción */}
              <div className="space-y-3">
                {/* Botón para abrir elementos */}
                {onAbrirElementos && (
                  <button
                    onClick={() => {
                      if (plantaSeleccionada) {
                        onAbrirElementos(plantaSeleccionada.id);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-white transition"
                    style={{ backgroundColor: '#003C6E' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#004a8c'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#003C6E'}
                  >
                    <Layers className="h-4 w-4" />
                    <span>Ver elementos de {plantaSeleccionada.nombre}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}

                {/* Botón para agregar legajos */}
                {onAbrirLegajo && (
                  <button
                    onClick={() => {
                      if (plantaSeleccionada) {
                        onAbrirLegajo(plantaSeleccionada.id);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-white transition"
                    style={{ backgroundColor: '#0055A4' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0066cc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0055A4'}
                  >
                    <FileText className="h-4 w-4" />
                    <span>Agregar legajos de {plantaSeleccionada.nombre}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ) : selectedPiso ? (
            <div className="h-full p-5 bg-white rounded-lg border border-slate-200 shadow-sm">
              <h3 className="text-slate-800 font-semibold text-lg mb-2">
                Piso {selectedPiso}
              </h3>
              <p className="text-sm text-slate-600 mb-3">
                Elementos configurados para este nivel:
              </p>
              <ul className="text-sm text-slate-700 list-disc list-inside space-y-1">
                <li>Muros perimetrales</li>
                <li>Ventanas</li>
                <li>Revoque exterior</li>
                <li>Columna estructural</li>
              </ul>
              <div className="mt-4 space-y-3">
                {onAbrirElementos && (
                  <button
                    onClick={() => onAbrirElementos(String(selectedPiso))}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-white transition"
                    style={{ backgroundColor: '#003C6E' }}
                  >
                    <Layers className="h-4 w-4" />
                    <span>Ver elementos</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
                {onAbrirLegajo && (
                  <button
                    onClick={() => onAbrirLegajo(String(selectedPiso))}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-white transition"
                    style={{ backgroundColor: '#0055A4' }}
                  >
                    <FileText className="h-4 w-4" />
                    <span>Agregar legajos</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 italic">
              Seleccioná un piso para ver sus elementos
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

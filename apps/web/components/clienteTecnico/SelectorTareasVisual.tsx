'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { getTareasPorFase, type TareaConstructiva } from '@/lib/tareas-construccion';

interface SelectorTareasVisualProps {
  onClose: () => void;
  onTareaSeleccionada: (tarea: TareaConstructiva, fase: string) => void;
}

type ParteCasa = 'cimientos' | 'paredes' | 'techo' | null;

const fasesPorParte = {
  cimientos: 'estructura' as const,
  paredes: 'obra_gris' as const,  
  techo: 'terminaciones' as const
};

export function SelectorTareasVisual({ onClose, onTareaSeleccionada }: SelectorTareasVisualProps) {
  const [parteSeleccionada, setParteSeleccionada] = useState<ParteCasa>(null);
  const [tareasDisponibles, setTareasDisponibles] = useState<TareaConstructiva[]>([]);

  const handleParteClick = (parte: ParteCasa) => {
    if (!parte) return;
    
    setParteSeleccionada(parte);
    const fase = fasesPorParte[parte];
    const tareas = getTareasPorFase(fase);
    setTareasDisponibles(tareas);
  };

  const handleTareaClick = (tarea: TareaConstructiva) => {
    if (!parteSeleccionada) return;
    
    const fase = fasesPorParte[parteSeleccionada];
    onTareaSeleccionada(tarea, fase);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
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

        <div className="flex flex-col lg:flex-row">
          {/* Panel izquierdo - Casa SVG */}
          <div className="lg:w-1/2 p-8 bg-gradient-to-br from-claro to-secundario">
            <div className="text-center mb-6">
              <h4 className="text-xl font-semibold text-primario mb-2">
                Selecciona una parte de la construcción
              </h4>
              <p className="text-primario/70">
                Haz clic en cimientos, paredes o techo para ver las tareas disponibles
              </p>
            </div>

            {/* SVG Casa Isométrica */}
            <div className="flex justify-center">
              <svg
                width="400"
                height="300"
                viewBox="0 0 400 300"
                className="w-full max-w-md h-auto"
              >
                {/* Cimientos */}
                <polygon
                  points="50,250 150,200 350,200 250,250"
                  fill={parteSeleccionada === 'cimientos' ? '#1B263B' : '#eaf0f6'}
                  stroke="#1B263B"
                  strokeWidth="2"
                  className="cursor-pointer transition-all duration-200 hover:fill-primario/20"
                  onClick={() => handleParteClick('cimientos')}
                />
                <text
                  x="200"
                  y="230"
                  textAnchor="middle"
                  className="fill-primario text-sm font-medium pointer-events-none"
                >
                  Cimientos
                </text>

                {/* Paredes */}
                <g onClick={() => handleParteClick('paredes')} className="cursor-pointer">
                  {/* Pared frontal izquierda */}
                  <polygon
                    points="50,250 150,200 150,120 50,170"
                    fill={parteSeleccionada === 'paredes' ? '#1B263B' : '#f5f7fa'}
                    stroke="#1B263B"
                    strokeWidth="2"
                    className="transition-all duration-200 hover:fill-primario/20"
                  />
                  
                  {/* Pared frontal derecha */}
                  <polygon
                    points="250,250 350,200 350,120 250,170"
                    fill={parteSeleccionada === 'paredes' ? '#1B263B' : '#f5f7fa'}
                    stroke="#1B263B"
                    strokeWidth="2"
                    className="transition-all duration-200 hover:fill-primario/20"
                  />
                  
                  {/* Pared lateral */}
                  <polygon
                    points="150,200 350,200 350,120 150,120"
                    fill={parteSeleccionada === 'paredes' ? '#1B263B' : '#e5e7eb'}
                    stroke="#1B263B"
                    strokeWidth="2"
                    className="transition-all duration-200 hover:fill-primario/20"
                  />
                </g>
                <text
                  x="200"
                  y="190"
                  textAnchor="middle"
                  className="fill-primario text-sm font-medium pointer-events-none"
                >
                  Paredes
                </text>

                {/* Techo */}
                <g onClick={() => handleParteClick('techo')} className="cursor-pointer">
                  {/* Cara izquierda del techo */}
                  <polygon
                    points="50,170 150,120 200,80 100,130"
                    fill={parteSeleccionada === 'techo' ? '#1B263B' : '#f4e27e'}
                    stroke="#1B263B"
                    strokeWidth="2"
                    className="transition-all duration-200 hover:fill-acento/80"
                  />
                  
                  {/* Cara derecha del techo */}
                  <polygon
                    points="200,80 350,120 250,170 100,130"
                    fill={parteSeleccionada === 'techo' ? '#1B263B' : '#f1d65e'}
                    stroke="#1B263B"
                    strokeWidth="2"
                    className="transition-all duration-200 hover:fill-acento/80"
                  />
                </g>
                <text
                  x="200"
                  y="110"
                  textAnchor="middle"
                  className="fill-primario text-sm font-medium pointer-events-none"
                >
                  Techo
                </text>

                {/* Detalles adicionales */}
                {/* Puerta */}
                <rect
                  x="90"
                  y="190"
                  width="20"
                  height="40"
                  fill="#8B4513"
                  stroke="#1B263B"
                  strokeWidth="1"
                />
                
                {/* Ventana */}
                <rect
                  x="280"
                  y="150"
                  width="30"
                  height="20"
                  fill="#87CEEB"
                  stroke="#1B263B"
                  strokeWidth="1"
                />
              </svg>
            </div>

            {/* Leyenda */}
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-white rounded-lg border border-claro">
                <div className="w-4 h-4 bg-claro border border-primario mx-auto mb-2"></div>
                <span className="text-xs text-primario/70">Estructura</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-claro">
                <div className="w-4 h-4 bg-secundario border border-primario mx-auto mb-2"></div>
                <span className="text-xs text-primario/70">Obra Gris</span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-claro">
                <div className="w-4 h-4 bg-acento border border-primario mx-auto mb-2"></div>
                <span className="text-xs text-primario/70">Terminaciones</span>
              </div>
            </div>
          </div>

          {/* Panel derecho - Lista de tareas */}
          <div className="lg:w-1/2 bg-white">
            {!parteSeleccionada ? (
              <div className="p-8 text-center">
                <div className="text-primario/50 text-6xl mb-4">🏗️</div>
                <h4 className="text-xl font-semibold text-primario mb-2">
                  Selecciona una parte de la casa
                </h4>
                <p className="text-primario/70">
                  Haz clic en cimientos, paredes o techo para ver las tareas disponibles
                </p>
              </div>
            ) : (
              <div className="p-6">
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-primario mb-2">
                    Tareas de {parteSeleccionada.charAt(0).toUpperCase() + parteSeleccionada.slice(1)}
                  </h4>
                  <p className="text-sm text-primario/70">
                    Fase: {fasesPorParte[parteSeleccionada].replace('_', ' ')}
                  </p>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2">
                  {tareasDisponibles.map((tarea) => (
                    <button
                      key={tarea.id}
                      onClick={() => handleTareaClick(tarea)}
                      className="w-full text-left p-4 border border-claro rounded-lg hover:bg-claro/50 hover:border-primario/50 transition-all duration-200 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-primario group-hover:text-primario/90">
                            {tarea.nombre}
                          </div>
                          <div className="text-sm text-primario/70 mt-1">
                            <span className="font-mono bg-claro px-2 py-1 rounded text-xs mr-2">
                              {tarea.id}
                            </span>
                            <span>{tarea.unidad}</span>
                            <span className="mx-2">•</span>
                            <span>{tarea.coef_operativo}h/unidad</span>
                          </div>
                        </div>
                        <div className="text-primario/30 group-hover:text-primario/70 transition-colors duration-200">
                          →
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {tareasDisponibles.length === 0 && (
                  <div className="text-center py-8 text-primario/70">
                    No hay tareas disponibles para esta fase
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

'use client';

import { useState } from 'react';
import { Calendar, Clock, Building, Wrench, Paintbrush, ChevronDown, ChevronRight } from 'lucide-react';
import { TimelineEvent } from '@/lib/types/elementos';

interface TimelineObraProps {
  eventos: TimelineEvent[];
}

export function TimelineObra({ eventos }: TimelineObraProps) {
  const [fasesExpandidas, setFasesExpandidas] = useState<{ [key: string]: boolean }>({
    estructura: true,
    obra_gris: true,
    terminaciones: true
  });

  const toggleFase = (fase: string) => {
    setFasesExpandidas(prev => ({
      ...prev,
      [fase]: !prev[fase]
    }));
  };

  const agruparPorFase = () => {
    return eventos.reduce((acc, evento) => {
      if (!acc[evento.fase]) {
        acc[evento.fase] = [];
      }
      acc[evento.fase].push(evento);
      return acc;
    }, {} as Record<string, TimelineEvent[]>);
  };

  const getIconoFase = (fase: string) => {
    const iconos = {
      estructura: Building,
      obra_gris: Wrench,
      terminaciones: Paintbrush
    };
    return iconos[fase as keyof typeof iconos] || Building;
  };

  const getColorFase = (fase: string) => {
    const colores = {
      estructura: 'bg-gray-800 text-white',
      obra_gris: 'bg-gray-500 text-white',
      terminaciones: 'bg-orange-500 text-white'
    };
    return colores[fase as keyof typeof colores] || 'bg-gray-500 text-white';
  };

  const getNombreFase = (fase: string) => {
    const nombres = {
      estructura: 'Estructura',
      obra_gris: 'Obra Gris',
      terminaciones: 'Terminaciones'
    };
    return nombres[fase as keyof typeof nombres] || fase;
  };

  const calcularDuracionTotal = () => {
    if (eventos.length === 0) return 0;
    const fechaInicio = Math.min(...eventos.map(e => e.fechaInicio.getTime()));
    const fechaFin = Math.max(...eventos.map(e => e.fechaFin.getTime()));
    return Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24));
  };

  const eventosPorFase = agruparPorFase();

  if (eventos.length === 0) {
    return (
      <div className="flex-1 bg-white flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">Timeline Vacío</h3>
          <p>Confirma el carrito para generar el timeline automáticamente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white overflow-y-auto">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Timeline de Obra</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>Duración total: {calcularDuracionTotal()} días</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{eventos.length} tareas programadas</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {Object.entries(eventosPorFase).map(([fase, eventosFase]) => {
            const IconoFase = getIconoFase(fase);
            const isExpanded = fasesExpandidas[fase];

            return (
              <div key={fase} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFase(fase)}
                  className={`w-full p-4 ${getColorFase(fase)} hover:opacity-90 transition-opacity flex items-center justify-between`}
                >
                  <div className="flex items-center space-x-3">
                    <IconoFase className="h-5 w-5" />
                    <span className="font-semibold">{getNombreFase(fase)}</span>
                    <span className="text-sm opacity-90">
                      ({eventosFase.length} tareas)
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </button>

                {isExpanded && (
                  <div className="p-4 bg-gray-50">
                    <div className="space-y-3">
                      {eventosFase.map((evento) => (
                        <div key={evento.id} className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-800">{evento.tarea.nombre}</h4>
                              <p className="text-sm text-gray-600">
                                {evento.tarea.cantidad} {evento.tarea.unidad}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-800">
                                {evento.duracion} día{evento.duracion !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {evento.fechaInicio.toLocaleDateString()} - {evento.fechaFin.toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {evento.tarea.dependencias.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <p className="text-xs text-gray-500">
                                <strong>Dependencias:</strong> {evento.tarea.dependencias.join(', ')}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}




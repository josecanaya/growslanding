'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Check } from 'lucide-react';
import { Seleccion } from './SubgrupoAccordion';

interface ElementoCardProps {
  elemento: any;
  subgrupo: string;
  elementosSeleccionados: Seleccion[];
  onElementoSeleccionado: (seleccion: Seleccion) => void;
}

// Mapeo de opciones/variantes basado en el nombre del elemento
const reglasOpciones: { [key: string]: string[] } = {
  "Muro común 15 cm": ["15 cm", "30 cm (doble muro)"],
  "Muro común 30 cm (doble muro portante)": ["15 cm", "30 cm (doble muro)"],
  "Muro de ladrillo visto": ["Visto simple", "Visto con junta"],
  "Muro de Retak": ["15 cm", "20 cm", "30 cm"],
  "Tabique interior 15 cm": ["15 cm", "12 cm"],
  "Losa de hormigón armado": ["Maciza", "Alivianada", "Pretensada"],
  "Contrapiso de hormigón": ["5 cm", "8 cm", "10 cm"],
  "Piso de cerámica": ["30x30 cm", "45x45 cm", "60x60 cm"],
  "Piso de porcelanato": ["30x30 cm", "60x60 cm", "80x80 cm"],
  "Losa de techo": ["Maciza", "Alivianada", "Pretensada"],
  "Cubierta de chapa": ["Chapa galvanizada", "Chapa prepintada", "Chapa de aluminio"],
  "Cubierta de teja": ["Teja colonial", "Teja francesa", "Teja plana"],
  "Escalera de hormigón": ["Escalera recta", "Escalera en L", "Escalera en U"],
  "Escalera metálica": ["Estructura simple", "Estructura con barandas"],
  "Puerta de madera": ["Maciza", "Hueca", "Con vidrio"],
  "Ventana de madera": ["Simple", "Doble", "Corrediza"],
  "Puerta de aluminio": ["Simple", "Doble", "Corrediza"],
  "Ventana de aluminio": ["Simple", "Doble", "Corrediza"],
  "Cimiento corrido": ["Superficial", "Profundo"],
  "Base aislada": ["Superficial", "Profunda"],
  "Columna hormigón armado": ["15x15 cm", "20x20 cm", "25x25 cm"],
  "Encadenado fundación": ["15x20 cm", "20x20 cm", "20x25 cm"],
  "Losa de fundación (platea)": ["15 cm", "20 cm", "25 cm"],
  "Viga hormigón armado": ["15x20 cm", "20x20 cm", "20x25 cm"]
};

// Función para derivar información de las tareas
function derivarInfoElemento(elemento: any) {
  const todasLasTareas = [
    ...elemento.fases.estructura,
    ...elemento.fases.obra_gris,
    ...elemento.fases.terminaciones
  ];
  
  const duracionEstimada = todasLasTareas.length * 2; // Estimación simple: 2 días por tarea
  
  return {
    tareasSugeridas: todasLasTareas,
    duracionEstimadaDias: duracionEstimada,
    unidad: "m²" // Unidad por defecto, se puede ajustar según el elemento
  };
}

export function ElementoCard({ 
  elemento, 
  subgrupo, 
  elementosSeleccionados,
  onElementoSeleccionado 
}: ElementoCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Obtener opciones para este elemento
  const opciones = reglasOpciones[elemento.nombre] || [elemento.nombre];
  const infoElemento = derivarInfoElemento(elemento);
  
  // Verificar si hay opciones seleccionadas para este elemento
  const opcionesSeleccionadas = elementosSeleccionados.filter(s => 
    s.subgrupo === subgrupo && s.elementoNombre === elemento.nombre
  );
  
  const handleAgregarOpcion = (opcion: string) => {
    const opcionId = `${elemento.nombre}-${opcion}-${Date.now()}`;
    
    const nuevaSeleccion: Seleccion = {
      subgrupo,
      elementoNombre: elemento.nombre,
      opcionId,
      opcionLabel: opcion,
      unidad: infoElemento.unidad,
      duracionEstimadaDias: infoElemento.duracionEstimadaDias,
      tareasSugeridas: infoElemento.tareasSugeridas
    };
    
    onElementoSeleccionado(nuevaSeleccion);
  };
  
  const isOpcionSeleccionada = (opcion: string) => {
    return opcionesSeleccionadas.some(s => s.opcionLabel === opcion);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
      <div className="flex flex-col h-full">
        {/* Header del elemento */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                {elemento.nombre}
              </h4>
              <div className="flex flex-wrap gap-1 mb-2">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  {infoElemento.unidad}
                </span>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  {infoElemento.duracionEstimadaDias}d
                </span>
                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  {infoElemento.tareasSugeridas.length} tareas
                </span>
              </div>
            </div>
            
            {opciones.length > 1 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        </div>
        
        {/* Opciones/Variantes */}
        {opciones.length > 1 && isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <h5 className="text-xs font-medium text-gray-700 mb-2">Opciones disponibles:</h5>
            <div className="space-y-2">
              {opciones.map((opcion, index) => {
                const yaSeleccionada = isOpcionSeleccionada(opcion);
                
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded-lg border ${
                      yaSeleccionada 
                        ? 'bg-green-50 border-green-300' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <span className="text-sm text-gray-700">{opcion}</span>
                    <button
                      onClick={() => handleAgregarOpcion(opcion)}
                      disabled={yaSeleccionada}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-200 flex items-center space-x-1 ${
                        yaSeleccionada
                          ? 'bg-green-100 text-green-700 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {yaSeleccionada ? (
                        <>
                          <Check className="h-3 w-3" />
                          <span>Agregado</span>
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3" />
                          <span>Agregar</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Botón simple si solo hay una opción */}
        {opciones.length === 1 && (
          <button
            onClick={() => handleAgregarOpcion(opciones[0])}
            disabled={isOpcionSeleccionada(opciones[0])}
            className={`mt-3 w-full py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2 ${
              isOpcionSeleccionada(opciones[0])
                ? 'bg-green-100 text-green-700 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isOpcionSeleccionada(opciones[0]) ? (
              <>
                <Check className="h-4 w-4" />
                <span>Agregado</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Agregar</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}


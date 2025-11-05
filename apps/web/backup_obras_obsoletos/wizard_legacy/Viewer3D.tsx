'use client';

import { useEffect, useRef, useState } from 'react';

interface ElementoIFC {
  id: string;
  nombre: string;
  tipo: string;
  propiedades?: any;
  geometria?: any;
  mapeado?: {
    elemento_catalogo?: string;
    opciones_disponibles?: string[];
    estado: 'mapeado' | 'no_mapeado' | 'pendiente';
    confianza?: number;
  };
}

interface Viewer3DProps {
  elementos: ElementoIFC[];
  elementoSeleccionado?: ElementoIFC | null;
  onElementoSeleccionado?: (elemento: ElementoIFC | null) => void;
  archivoIFC?: File | null;
}

declare global {
  interface Window {
    THREE: any;
    IFCAPI: any;
  }
}

export function Viewer3D({ 
  elementos, 
  elementoSeleccionado, 
  onElementoSeleccionado,
  archivoIFC 
}: Viewer3DProps) {
  const [mostrarCapas, setMostrarCapas] = useState({
    mapeados: true,
    noMapeados: true,
    estructura: true,
    muros: true,
    cubiertas: true,
    instalaciones: true
  });

  // Función para manejar clicks en elementos
  const handleElementoClick = (elemento: ElementoIFC) => {
    if (onElementoSeleccionado) {
      onElementoSeleccionado(elemento);
    }
  };

  return (
    <div className="w-full h-full relative bg-gray-100">
      {/* Vista simplificada de elementos */}
      <div className="w-full h-full p-4">
        <div className="bg-white rounded-lg shadow-sm h-full overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Elementos del Modelo IFC</h3>
            <p className="text-sm text-gray-600">Haz clic en un elemento para seleccionarlo</p>
          </div>
          
          <div className="p-4 space-y-3">
            {elementos.map((elemento) => (
              <div
                key={elemento.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  elementoSeleccionado?.id === elemento.id
                    ? 'border-blue-500 bg-blue-50'
                    : elemento.mapeado?.estado === 'mapeado'
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
                onClick={() => handleElementoClick(elemento)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        elemento.mapeado?.estado === 'mapeado' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">{elemento.nombre}</h4>
                        <p className="text-xs text-gray-500">{elemento.tipo}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {elemento.mapeado?.estado === 'mapeado' ? (
                      <div>
                        <div className="text-xs font-medium text-green-600">Mapeado</div>
                        <div className="text-xs text-gray-400">
                          {Math.round((elemento.mapeado?.confianza || 0) * 100)}%
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-red-600">No mapeado</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Información del elemento seleccionado */}
      {elementoSeleccionado && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
          <h4 className="font-semibold text-gray-900 mb-2">
            {elementoSeleccionado.nombre}
          </h4>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Tipo:</span> {elementoSeleccionado.tipo}</p>
            <p><span className="font-medium">Estado:</span> 
              <span className={`ml-1 px-2 py-1 rounded text-xs ${
                elementoSeleccionado.mapeado?.estado === 'mapeado' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {elementoSeleccionado.mapeado?.estado === 'mapeado' ? 'Mapeado' : 'No mapeado'}
              </span>
            </p>
            {elementoSeleccionado.mapeado?.elemento_catalogo && (
              <p><span className="font-medium">Elemento:</span> {elementoSeleccionado.mapeado.elemento_catalogo}</p>
            )}
            {elementoSeleccionado.propiedades?.nivel && (
              <p><span className="font-medium">Nivel:</span> {elementoSeleccionado.propiedades.nivel}</p>
            )}
            {elementoSeleccionado.propiedades?.material && (
              <p><span className="font-medium">Material:</span> {elementoSeleccionado.propiedades.material}</p>
            )}
          </div>
        </div>
      )}

      {/* Leyenda */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">Leyenda</h4>
        <div className="space-y-1 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Elementos mapeados</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Elementos no mapeados</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>Elemento seleccionado</span>
          </div>
        </div>
      </div>
    </div>
  );
}

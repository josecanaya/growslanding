'use client';

import { useState } from 'react';
import { 
  ChevronRight,
  ChevronLeft,
  Check,
  Building2,
  Calculator,
  FileText,
  Download,
  Edit
} from 'lucide-react';

interface ElementoSeleccionado {
  id: string;
  nombre: string;
  categoria: string;
  planta: number;
  seleccionado: boolean;
  cantidad: number;
}

interface PlantaData {
  numero: number;
  nombre: string;
  elementos: ElementoSeleccionado[];
}

interface PasoResumenFinalProps {
  plantas: PlantaData[];
  obraData: any;
  onPrevious: () => void;
  onFinalizar: () => void;
}

export function PasoResumenFinal({ plantas, obraData, onPrevious, onFinalizar }: PasoResumenFinalProps) {
  const [isGenerando, setIsGenerando] = useState(false);

  const getTotalElementos = () => {
    return plantas.reduce((total, planta) => total + planta.elementos.filter(e => e.seleccionado).length, 0);
  };

  const getElementosPorCategoria = () => {
    const categorias: { [key: string]: { total: number, plantas: string[] } } = {};
    
    plantas.forEach(planta => {
      planta.elementos.filter(e => e.seleccionado).forEach(elemento => {
        if (!categorias[elemento.categoria]) {
          categorias[elemento.categoria] = { total: 0, plantas: [] };
        }
        categorias[elemento.categoria].total += elemento.cantidad;
        if (!categorias[elemento.categoria].plantas.includes(planta.nombre)) {
          categorias[elemento.categoria].plantas.push(planta.nombre);
        }
      });
    });

    return categorias;
  };

  const handleFinalizar = async () => {
    setIsGenerando(true);
    
    // Simular generación de obra
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    onFinalizar();
    setIsGenerando(false);
  };

  const categorias = getElementosPorCategoria();

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                <Check className="h-8 w-8 text-green-600" />
                <span>Resumen Final de la Obra</span>
              </h2>
              <p className="text-gray-600 mt-2">Revisa todos los elementos seleccionados antes de crear la obra</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Total Elementos</div>
              <div className="text-3xl font-bold text-blue-600">
                {getTotalElementos()}
              </div>
            </div>
          </div>
        </div>

        {/* Información de la Obra */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <span>Información de la Obra</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Datos Generales</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Nombre:</span> {obraData.nombre}</p>
                <p><span className="font-medium">Cliente:</span> {obraData.cliente}</p>
                <p><span className="font-medium">Ubicación:</span> {obraData.direccion_completa}</p>
                <p><span className="font-medium">Fecha inicio:</span> {obraData.fecha_inicio}</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Especificaciones</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Tipo:</span> {obraData.tipo_proyecto}</p>
                <p><span className="font-medium">Plantas:</span> {obraData.cantidad_plantas}</p>
                <p><span className="font-medium">Superficie total:</span> {obraData.superficie_total} m²</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Plantas Configuradas</h4>
              <div className="space-y-1 text-sm text-gray-600">
                {plantas.map((planta, index) => (
                  <p key={planta.numero}>
                    <span className="font-medium">{planta.nombre}:</span> {planta.elementos.filter(e => e.seleccionado).length} elementos
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Resumen por Categorías */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            <span>Resumen por Categorías</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(categorias).map(([categoria, data]) => (
              <div key={categoria} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-2">{categoria}</h4>
                <div className="space-y-1 text-sm">
                  <p className="text-blue-600 font-medium">
                    {data.total} elementos seleccionados
                  </p>
                  <p className="text-gray-600">
                    En plantas: {data.plantas.join(', ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detalle por Planta */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>Detalle por Planta</span>
          </h3>
          <div className="space-y-4">
            {plantas.map((planta) => {
              const elementosSeleccionados = planta.elementos.filter(e => e.seleccionado);
              
              return (
                <div key={planta.numero} className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    {planta.nombre} - {elementosSeleccionados.length} elementos
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {elementosSeleccionados.map((elemento) => (
                      <div key={elemento.id} className="bg-white p-3 rounded border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-gray-900 text-sm">{elemento.nombre}</h5>
                            <p className="text-xs text-gray-500">ID: {elemento.id}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-blue-600">
                              {elemento.cantidad}x
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex justify-between">
            <button
              onClick={onPrevious}
              className="flex items-center space-x-2 px-6 py-3 text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg font-medium transition-colors duration-200 shadow-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Anterior</span>
            </button>

            <button
              onClick={handleFinalizar}
              disabled={isGenerando}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg"
            >
              {isGenerando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generando Obra...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Crear Obra</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

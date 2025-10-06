'use client';

import { useState } from 'react';
import { 
  Plus,
  Minus,
  ChevronRight,
  Building2,
  Layers
} from 'lucide-react';

interface NumeroPlantasData {
  cantidad_plantas: number;
}

interface PasoNumeroPlantasProps {
  data: NumeroPlantasData;
  onChange: (data: Partial<NumeroPlantasData>) => void;
  onNext: () => void;
}

export function PasoNumeroPlantas({ data, onChange, onNext }: PasoNumeroPlantasProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (data.cantidad_plantas <= 0) newErrors.cantidad_plantas = 'Debe haber al menos 1 planta';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  const incrementPlantas = () => {
    if (data.cantidad_plantas < 10) {
      onChange({ cantidad_plantas: data.cantidad_plantas + 1 });
    }
  };

  const decrementPlantas = () => {
    if (data.cantidad_plantas > 1) {
      onChange({ cantidad_plantas: data.cantidad_plantas - 1 });
    }
  };

  const renderPlantasPreview = () => {
    const plantas = [];
    for (let i = 1; i <= data.cantidad_plantas; i++) {
      plantas.push(
        <div key={i} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">
              {i === 1 ? 'Planta Baja' : 
               i === data.cantidad_plantas ? 'Planta Alta' : 
               `Planta ${i}`}
            </h4>
            <p className="text-sm text-gray-600">Planta {i}</p>
          </div>
        </div>
      );
    }
    return plantas;
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <div className="p-4 bg-blue-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <Building2 className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Número de Plantas</h2>
          <p className="text-gray-600">Define cuántas plantas tendrá el edificio</p>
        </div>

        <div className="space-y-8">
          {/* Selector de número de plantas */}
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Cantidad de Plantas</h3>
            
            <div className="flex items-center justify-center space-x-6 mb-6">
              <button
                onClick={decrementPlantas}
                disabled={data.cantidad_plantas <= 1}
                className="p-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-full transition-colors duration-200 shadow-lg"
              >
                <Minus className="h-6 w-6" />
              </button>
              
              <div className="bg-white rounded-lg border-2 border-blue-500 p-6 min-w-[120px]">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {data.cantidad_plantas}
                </div>
                <div className="text-sm text-gray-600">
                  {data.cantidad_plantas === 1 ? 'Planta' : 'Plantas'}
                </div>
              </div>
              
              <button
                onClick={incrementPlantas}
                disabled={data.cantidad_plantas >= 10}
                className="p-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-full transition-colors duration-200 shadow-lg"
              >
                <Plus className="h-6 w-6" />
              </button>
            </div>

            <div className="text-sm text-gray-500">
              Mínimo: 1 planta | Máximo: 10 plantas
            </div>
          </div>

          {/* Vista previa de plantas */}
          {data.cantidad_plantas > 0 && (
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Vista Previa de Plantas</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {renderPlantasPreview()}
              </div>
              <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Total:</strong> {data.cantidad_plantas} {data.cantidad_plantas === 1 ? 'planta' : 'plantas'} 
                  {data.cantidad_plantas > 1 && ' (incluyendo escalera automática)'}
                </p>
              </div>
            </div>
          )}
        </div>

        {errors.cantidad_plantas && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.cantidad_plantas}</p>
          </div>
        )}

        <div className="flex justify-end pt-8">
          <button
            onClick={handleNext}
            disabled={data.cantidad_plantas <= 0}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg"
          >
            <span>Configurar Plantas</span>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

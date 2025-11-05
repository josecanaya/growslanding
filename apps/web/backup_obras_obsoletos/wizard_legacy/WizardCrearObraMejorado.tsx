'use client';

import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Building2,
  Layers,
  CheckCircle,
  Settings,
  X,
  Home
} from 'lucide-react';
import { PasoDatosGeneralesMejorado } from './PasoDatosGeneralesMejorado';
import { PasoTipoObra } from './PasoTipoObra';
import { PasoNumeroPlantas } from './PasoNumeroPlantas';
// COMPONENTES DE PLANTAS COMENTADOS - NO SE USAN MÁS (solo el diseño del plano)
// import { WizardPlanta } from './WizardPlanta';
import { PasoElementosPlanta } from './PasoElementosPlanta';

// Tipos de datos
interface DatosGeneralesData {
  cliente: string;
  direccion: string;
  fecha_inicio: string;
}

interface TipoObraData {
  tipo_obra: string;
}

interface NumeroPlantasData {
  cantidad_plantas: number;
}

interface DimensionesPlanta {
  ancho: number;
  largo: number;
  superficie: number;
}

interface Ambiente {
  id: string;
  tipo: string;
  cantidad: number;
  superficie?: number;
}

interface EspacioAdicional {
  id: string;
  tipo: string;
  seleccionado: boolean;
}

interface PlanoBloque {
  id: string;
  tipo: string;
  x: number;
  y: number;
  ancho: number;
  largo: number;
  superficie: number;
}

interface ElementoSeleccionado {
  id: string;
  nombre: string;
  categoria: string;
  planta: number;
  seleccionado: boolean;
  cantidad?: number;
  configuracion?: Record<string, any>;
}

interface PlantaData {
  numero: number;
  nombre: string;
  dimensiones: DimensionesPlanta;
  ambientes: Ambiente[];
  espacios_adicionales: EspacioAdicional[];
  bloques: PlanoBloque[];
  elementos: ElementoSeleccionado[];
}

interface ObraDataCompleta {
  datos_generales: DatosGeneralesData;
  tipo_obra: TipoObraData;
  numero_plantas: NumeroPlantasData;
  plantas: PlantaData[];
}

interface WizardCrearObraMejoradoProps {
  onSuccess: (obra: any) => void;
  onCancel: () => void;
}

export function WizardCrearObraMejorado({ onSuccess, onCancel }: WizardCrearObraMejoradoProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentPlanta, setCurrentPlanta] = useState(0);
  const [loading, setLoading] = useState(false);

  const [obraData, setObraData] = useState<ObraDataCompleta>({
    datos_generales: {
      cliente: '',
      direccion: '',
      fecha_inicio: ''
    },
    tipo_obra: {
      tipo_obra: ''
    },
    numero_plantas: {
      cantidad_plantas: 1
    },
    plantas: []
  });

  const steps = [
    { id: 'datos_generales', title: 'Datos Generales', icon: Building2 },
    { id: 'tipo_obra', title: 'Tipo de Obra', icon: Layers },
    { id: 'numero_plantas', title: 'Número de Plantas', icon: Settings },
    { id: 'elementos_plantas', title: 'Elementos por Planta', icon: CheckCircle }
  ];

  const getCurrentStepTitle = () => {
    if (currentStep === 3) {
      return `Planta ${currentPlanta + 1} - Elementos`;
    }
    return steps[currentStep]?.title || '';
  };

  const getCurrentStepIcon = () => {
    if (currentStep === 3) {
      return Home;
    }
    return steps[currentStep]?.icon || Building2;
  };

  const initializePlantas = (cantidad: number) => {
    const nuevasPlantas: PlantaData[] = [];
    
    for (let i = 0; i < cantidad; i++) {
      nuevasPlantas.push({
        numero: i + 1,
        nombre: i === 0 ? 'Planta Baja' : i === cantidad - 1 ? 'Planta Alta' : `Planta ${i + 1}`,
        dimensiones: {
          ancho: 0,
          largo: 0,
          superficie: 0
        },
        ambientes: [],
        espacios_adicionales: [
          { id: 'AMB006', tipo: 'Garage', seleccionado: false },
          { id: 'AMB007', tipo: 'Quincho', seleccionado: false },
          { id: 'AMB008', tipo: 'Galería', seleccionado: false },
          { id: 'AMB009', tipo: 'Balcón', seleccionado: false },
          { id: 'AMB010', tipo: 'Terraza', seleccionado: false },
          { id: 'AMB011', tipo: 'Patio', seleccionado: false }
        ],
        bloques: [],
        elementos: []
      });
    }
    
    setObraData(prev => ({ ...prev, plantas: nuevasPlantas }));
  };

  const handleDatosGeneralesChange = (data: Partial<DatosGeneralesData>) => {
    setObraData(prev => ({
      ...prev,
      datos_generales: { ...prev.datos_generales, ...data }
    }));
  };

  const handleTipoObraChange = (data: Partial<TipoObraData>) => {
    setObraData(prev => ({
      ...prev,
      tipo_obra: { ...prev.tipo_obra, ...data }
    }));
  };

  const handleNumeroPlantasChange = (data: Partial<NumeroPlantasData>) => {
    const cantidad = data.cantidad_plantas || 1;
    setObraData(prev => ({
      ...prev,
      numero_plantas: { ...prev.numero_plantas, ...data }
    }));
    
    // Inicializar plantas cuando se cambia la cantidad
    if (data.cantidad_plantas) {
      initializePlantas(data.cantidad_plantas);
      // Resetear currentPlanta cuando cambia la cantidad
      setCurrentPlanta(0);
    }
  };

  const handlePlantaChange = (plantaData: PlantaData) => {
    const plantasActualizadas = obraData.plantas.map(planta => 
      planta.numero === plantaData.numero ? plantaData : planta
    );
    setObraData(prev => ({ ...prev, plantas: plantasActualizadas }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleNextPlanta = () => {
    if (currentPlanta < obraData.numero_plantas.cantidad_plantas - 1) {
      setCurrentPlanta(prev => prev + 1);
    } else {
      // Terminar configuración de elementos
      handleFinish();
    }
  };

  const handlePreviousPlanta = () => {
    if (currentPlanta > 0) {
      setCurrentPlanta(prev => prev - 1);
    } else {
      // Volver al paso anterior
      handlePrevious();
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      // Aquí se haría la llamada a la API para crear la obra
      // Por ahora simulamos el éxito
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const nuevaObra = {
        id: Date.now().toString(),
        ...obraData,
        created_at: new Date().toISOString()
      };
      
      onSuccess(nuevaObra);
    } catch (error) {
      console.error('Error al crear la obra:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Datos Generales
        return (
          <PasoDatosGeneralesMejorado
            data={obraData.datos_generales}
            onChange={handleDatosGeneralesChange}
            onNext={handleNext}
          />
        );
      
      case 1: // Tipo de Obra
        return (
          <PasoTipoObra
            data={obraData.tipo_obra}
            onChange={handleTipoObraChange}
            onNext={handleNext}
          />
        );
      
      case 2: // Número de Plantas
        return (
          <PasoNumeroPlantas
            data={obraData.numero_plantas}
            onChange={handleNumeroPlantasChange}
            onNext={handleNext}
          />
        );
      
      case 3: // Elementos por Planta
        const plantaElementos = obraData.plantas[currentPlanta];
        if (!plantaElementos) return null;
        
        const plantaElementosData = {
          numero: plantaElementos.numero,
          nombre: plantaElementos.nombre,
          elementos: plantaElementos.elementos,
          elementos_precargados: []
        };
        
        return (
          <PasoElementosPlanta
            data={plantaElementosData}
            onChange={(data) => {
              const plantaActualizada = { ...plantaElementos, elementos: data.elementos };
              handlePlantaChange(plantaActualizada);
            }}
            onNext={handleNextPlanta}
            onPrevious={handlePreviousPlanta}
            isLastPlanta={currentPlanta === obraData.numero_plantas.cantidad_plantas - 1}
          />
        );
      
      default:
        return null;
    }
  };

  const getProgressPercentage = () => {
    if (currentStep <= 2) {
      return ((currentStep + 1) / steps.length) * 100;
    } else if (currentStep === 3) {
      const plantasCompletadas = currentPlanta;
      const totalPlantas = obraData.numero_plantas.cantidad_plantas;
      const baseProgress = (3 / steps.length) * 100;
      const plantaProgress = (plantasCompletadas / totalPlantas) * (1 / steps.length) * 100;
      return baseProgress + plantaProgress;
    }
    return 100;
  };

  return (
    <div className="w-full h-full bg-white overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Crear Nueva Obra</h1>
              <p className="text-sm text-gray-600">
                {currentStep === 3 
                  ? `Paso ${currentStep + 1}: ${getCurrentStepTitle()}`
                  : `Paso ${currentStep + 1} de ${steps.length}: ${getCurrentStepTitle()}`
                }
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progreso</span>
            <span className="text-sm text-gray-600">{Math.round(getProgressPercentage())}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
          
          {/* Indicador de plantas actuales */}
          {currentStep === 3 && (
            <div className="mt-2 text-xs text-gray-500">
              Planta {currentPlanta + 1} de {obraData.numero_plantas.cantidad_plantas}
            </div>
          )}
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 min-h-0">
        <div className="h-full">
          {renderStepContent()}
        </div>
      </div>

      {/* Footer - Solo mostrar en pasos que no tienen su propio footer */}
      {currentStep < 3 && (
        <div className="bg-white border-t border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center space-x-2 px-6 py-3 text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 border border-gray-300 rounded-lg font-medium transition-colors duration-200 shadow-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Anterior</span>
            </button>

            <div className="flex space-x-3">
              <button
                onClick={onCancel}
                className="px-6 py-3 text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg font-medium transition-colors duration-200 shadow-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleNext}
                className="flex items-center space-x-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-lg"
              >
                <span>Siguiente</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

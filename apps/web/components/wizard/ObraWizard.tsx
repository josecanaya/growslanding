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
  MapPin
} from 'lucide-react';
import { PasoFundacion } from './pasos/PasoFundacion';
import { PasoMuros } from './pasos/PasoMuros';
import { PasoInstalaciones } from './pasos/PasoInstalaciones';
import { PasoCubiertas } from './pasos/PasoCubiertas';
import { PasoSuelos } from './pasos/PasoSuelos';
import { PasoAmenities } from './pasos/PasoAmenities';
import { PasoParquizado } from './pasos/PasoParquizado';
import { PasoResumen } from './pasos/PasoResumen';
import { PasoConfirmacion } from './pasos/PasoConfirmacion';
import { PasoDatosGenerales } from '../clienteTecnico/wizard/PasoDatosGenerales';
import { PasoConfirmacion as PasoConfirmacionDatos } from '../clienteTecnico/wizard/PasoConfirmacion';

// Tipos de datos
interface ObraData {
  nombre: string;
  localizacion: string;
  estado: string;
  fecha_inicio: string;
  tipo_obra: string;
  
  // Nuevos campos para datos generales
  cantidad_plantas: number;
  superficie_por_planta: number;
  superficie_total: number;
  ancho_terreno: number;
  largo_terreno: number;
  ancho_planta: number;
  largo_planta: number;
  tipo_proyecto: string;
  coordenadas_lat: number | null;
  coordenadas_lng: number | null;
  direccion_completa: string;
  cliente: string;
  presupuesto: string;
  descripcion: string;
}

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

interface Tarea {
  id: string;
  nombre: string;
  duracion: number;
  dependencias: string[];
  fase: string;
}


// Componente principal del wizard
export function ObraWizard({ 
  onSuccess, 
  onCancel 
}: { 
  onSuccess: (obra: any) => void; 
  onCancel: () => void; 
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [obraData, setObraData] = useState<ObraData>({
    nombre: '',
    localizacion: '',
    estado: 'ACTIVA',
    fecha_inicio: '',
    tipo_obra: '',
    
    // Nuevos campos para datos generales
    cantidad_plantas: 1,
    superficie_por_planta: 0,
    superficie_total: 0,
    ancho_terreno: 0,
    largo_terreno: 0,
    ancho_planta: 0,
    largo_planta: 0,
    tipo_proyecto: '',
    coordenadas_lat: null,
    coordenadas_lng: null,
    direccion_completa: '',
    cliente: '',
    presupuesto: '',
    descripcion: ''
  });
  const [elementos, setElementos] = useState<Seleccion[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(false);

  const steps = [
    { id: 'datos_generales', title: 'Datos Generales', icon: Building2 },
    { id: 'confirmacion_datos', title: 'Confirmación', icon: CheckCircle },
    { id: 'fundacion', title: 'Fundación', icon: Layers },
    { id: 'muros', title: 'Muros', icon: Layers },
    { id: 'instalaciones', title: 'Instalaciones', icon: Settings },
    { id: 'cubiertas', title: 'Cubiertas', icon: Layers },
    { id: 'suelos', title: 'Suelos', icon: Layers },
    { id: 'amenities', title: 'Amenities', icon: Layers },
    { id: 'parquizado', title: 'Parquizado', icon: Layers },
    { id: 'resumen', title: 'Resumen', icon: CheckCircle },
    { id: 'confirmacion', title: 'Confirmación Final', icon: CheckCircle }
  ];

  const handleObraDataChange = (data: Partial<ObraData>) => {
    setObraData(prev => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
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
        created_at: new Date().toISOString(),
        elementos,
        tareas
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
          <PasoDatosGenerales
            data={obraData}
            onChange={handleObraDataChange}
            onNext={handleNext}
          />
        );
      case 1: // Confirmación de Datos
        return (
          <PasoConfirmacionDatos
            data={obraData}
            onEdit={() => setCurrentStep(0)}
            onConfirm={handleNext}
          />
        );
      case 2: // Fundación
        return (
          <PasoFundacion
            elementosSeleccionados={elementos}
            onElementosChange={setElementos}
          />
        );
      case 3: // Muros
        return (
          <PasoMuros
            elementosSeleccionados={elementos}
            onElementosChange={setElementos}
          />
        );
      case 4: // Instalaciones
        return (
          <PasoInstalaciones
            elementosSeleccionados={elementos}
            onElementosChange={setElementos}
          />
        );
      case 5: // Cubiertas
        return (
          <PasoCubiertas
            elementosSeleccionados={elementos}
            onElementosChange={setElementos}
          />
        );
      case 6: // Suelos
        return (
          <PasoSuelos
            elementosSeleccionados={elementos}
            onElementosChange={setElementos}
          />
        );
      case 7: // Amenities
        return (
          <PasoAmenities
            elementosSeleccionados={elementos}
            onElementosChange={setElementos}
          />
        );
      case 8: // Parquizado
        return (
          <PasoParquizado
            elementosSeleccionados={elementos}
            onElementosChange={setElementos}
          />
        );
      case 9: // Resumen
        return (
          <PasoResumen
            obraData={obraData}
            elementosSeleccionados={elementos}
            onEditarCategoria={(categoria: string) => {
              // Mapear categoría al paso correcto (ajustado por los nuevos pasos)
              const categoriaToStep: { [key: string]: number } = {
                'Fundaciones y Estructuras': 2,
                'Muros': 3,
                'Instalaciones': 4,
                'Cubiertas': 5,
                'Pisos': 6,
                'Carpinterías': 7,
                'Parquizado': 8
              };
              
              const step = categoriaToStep[categoria] || 2;
              setCurrentStep(step);
            }}
          />
        );
      case 10: // Confirmación Final
        return (
          <PasoConfirmacion
            obraData={obraData}
            elementosSeleccionados={elementos}
            onConfirmar={handleFinish}
            loading={loading}
          />
        );
      default:
        return null;
    }
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
              <p className="text-sm text-gray-600">Paso {currentStep + 1} de {steps.length}: {steps[currentStep].title}</p>
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
          <div className="flex items-center justify-between overflow-x-auto">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={step.id} className="flex items-center min-w-0 flex-shrink-0">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                      : isCompleted 
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="ml-3 min-w-0">
                    <p className={`text-sm font-medium transition-colors duration-200 truncate ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                    <p className={`text-xs transition-colors duration-200 ${
                      isActive ? 'text-blue-500' : isCompleted ? 'text-green-500' : 'text-gray-400'
                    }`}>
                      {index === currentStep ? 'Actual' : isCompleted ? 'Completado' : 'Pendiente'}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-3 transition-all duration-200 ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 min-h-0">
        <div className="h-full">
          {renderStepContent()}
        </div>
      </div>

      {/* Footer */}
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
            {currentStep === steps.length - 1 ? (
              <button
                onClick={handleFinish}
                disabled={loading}
                className="flex items-center space-x-2 px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg font-medium transition-colors duration-200 shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creando...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    <span>Crear Obra</span>
                  </>
                )}
              </button>
            ) : currentStep === 1 ? ( // Paso de confirmación de datos
              <button
                onClick={handleNext}
                className="flex items-center space-x-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-lg"
              >
                <Check className="h-5 w-5" />
                <span>Continuar con Elementos</span>
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center space-x-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 shadow-lg"
              >
                <span>Siguiente</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

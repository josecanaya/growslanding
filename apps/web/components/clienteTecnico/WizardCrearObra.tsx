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
  X
} from 'lucide-react';
import { PasoElementosConstructivos } from './PasoElementosConstructivos';
import { PasoResumenSeleccion } from './PasoResumenSeleccion';
import { Seleccion } from '@/components/cliente/SubgrupoAccordion';
import PasoRevisionTareas from './PasoRevisionTareas';
import PasoConfiguracionDependencias from './PasoConfiguracionDependencias';
import { PasoDatosGenerales } from './PasoDatosGenerales';
import { PasoConfirmacion } from './PasoConfirmacion';

// Tipos de datos
interface ObraData {
  nombre: string;
  localizacion: string;
  cliente: string;
  fecha_inicio: string;
  presupuesto: string;
  descripcion: string;
  
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
}


interface Tarea {
  id: string;
  nombre: string;
  descripcion: string;
  elementoId: string;
  fase: string;
  cantidad: number;
  unidad: string;
  duracionEstimada: number;
  estado: string;
  dependencias: string[];
}

interface WizardCrearObraProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (obra: any) => void;
}

// Componente para el paso de datos básicos (mantenido para compatibilidad)
const PasoDatosBasicos = ({ 
  data, 
  onChange, 
  onNext 
}: { 
  data: ObraData; 
  onChange: (data: Partial<ObraData>) => void; 
  onNext: () => void; 
}) => {
  return (
    <PasoDatosGenerales 
      data={data} 
      onChange={onChange} 
      onNext={onNext} 
    />
  );
};

// Componente principal del Wizard
export default function WizardCrearObra({ isOpen, onClose, onSuccess }: WizardCrearObraProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [obraData, setObraData] = useState<ObraData>({
    nombre: '',
    localizacion: '',
    cliente: '',
    fecha_inicio: '',
    presupuesto: '',
    descripcion: '',
    
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
    direccion_completa: ''
  });
  const [elementos, setElementos] = useState<Seleccion[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(false);

  const steps = [
    { id: 'datos', title: 'Datos Generales', icon: Building2 },
    { id: 'fundacion', title: 'Fundación', icon: Layers },
    { id: 'muros', title: 'Muros', icon: Layers },
    { id: 'instalaciones', title: 'Instalaciones', icon: Settings },
    { id: 'cubiertas', title: 'Cubiertas', icon: Layers },
    { id: 'suelos', title: 'Suelos', icon: Layers },
    { id: 'amenities', title: 'Amenities', icon: Layers },
    { id: 'parquizado', title: 'Parquizado', icon: Layers },
    { id: 'resumen', title: 'Resumen', icon: CheckCircle },
    { id: 'tareas', title: 'Tareas', icon: CheckCircle },
    { id: 'dependencias', title: 'Dependencias', icon: Settings }
  ];

  const handleObraDataChange = (data: Partial<ObraData>) => {
    setObraData(prev => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      try {
        setCurrentStep(currentStep + 1);
        console.log(`✅ Navegando al paso ${currentStep + 1}: ${steps[currentStep + 1]?.title}`);
      } catch (error) {
        console.error('❌ Error al navegar al siguiente paso:', error);
        alert('Error al avanzar al siguiente paso. Por favor, intenta nuevamente.');
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      try {
        setCurrentStep(currentStep - 1);
        console.log(`✅ Navegando al paso ${currentStep - 1}: ${steps[currentStep - 1]?.title}`);
      } catch (error) {
        console.error('❌ Error al navegar al paso anterior:', error);
        alert('Error al retroceder. Por favor, intenta nuevamente.');
      }
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      // Crear la obra con todos los datos
      const obraPayload = {
        ...obraData,
        elementos,
        tareas,
        estado: 'ACTIVA'
      };

      const response = await fetch('/api/obras', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organizacion-id': 'demo-org',
          'x-usuario-id': 'user-demo',
        },
        body: JSON.stringify(obraPayload),
      });

      if (!response.ok) {
        throw new Error('Error al crear la obra');
      }

      const nuevaObra = await response.json();
      onSuccess(nuevaObra);
      onClose();
    } catch (error) {
      console.error('Error al crear la obra:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditarCategoria = (categoria: string) => {
    // Mapear categoría al paso correcto
    const categoriaToStep: { [key: string]: number } = {
      'Fundaciones y Estructuras': 1,
      'Muros': 2,
      'Instalaciones': 3,
      'Cubiertas': 4,
      'Pisos': 5,
      'Carpinterías': 6,
      'Parquizado': 7
    };
    const step = categoriaToStep[categoria] || 1; // Default a Fundación
    setCurrentStep(step);
  };

  const renderStepContent = () => {
    try {
      console.log(`🎯 Renderizando paso ${currentStep}: ${steps[currentStep]?.title}`);
      
      switch (currentStep) {
      case 0: // Datos Generales
        return (
          <PasoDatosBasicos
            data={obraData}
            onChange={handleObraDataChange}
            onNext={handleNext}
          />
        );
      case 1: // Fundación
        return (
          <PasoElementosConstructivos
            elementosSeleccionados={elementos}
            onElementosChange={setElementos}
            etapaActual={0} // Fundación
          />
        );
      case 2: // Muros
        return (
          <PasoElementosConstructivos
            elementosSeleccionados={elementos}
            onElementosChange={setElementos}
            etapaActual={1} // Muros
          />
        );
      case 3: // Instalaciones
        return (
          <PasoElementosConstructivos
            elementosSeleccionados={elementos}
            onElementosChange={setElementos}
            etapaActual={2} // Instalaciones
          />
        );
      case 4: // Cubiertas
        return (
          <PasoElementosConstructivos
            elementosSeleccionados={elementos}
            onElementosChange={setElementos}
            etapaActual={3} // Cubiertas
          />
        );
      case 5: // Suelos
        return (
          <PasoElementosConstructivos
            elementosSeleccionados={elementos}
            onElementosChange={setElementos}
            etapaActual={4} // Suelos (Pisos)
          />
        );
      case 6: // Amenities
        return (
          <PasoElementosConstructivos
            elementosSeleccionados={elementos}
            onElementosChange={setElementos}
            etapaActual={5} // Amenities (Carpinterías)
          />
        );
      case 7: // Parquizado
        return (
          <PasoElementosConstructivos
            elementosSeleccionados={elementos}
            onElementosChange={setElementos}
            etapaActual={6} // Parquizado
          />
        );
      case 8: // Resumen
        return (
          <PasoResumenSeleccion
            elementosSeleccionados={elementos}
            onElementosChange={setElementos}
            onEditarCategoria={handleEditarCategoria}
            onConfirmar={handleNext}
          />
        );
      case 9: // Tareas
        return (
          <PasoRevisionTareas
            elementos={elementos}
            tareas={tareas}
            onTareasChange={setTareas}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 10: // Dependencias
        return (
          <PasoConfiguracionDependencias
            tareas={tareas}
            onTareasChange={setTareas}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      default:
        return (
          <div className="p-8 text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error: Paso no encontrado</h3>
              <p className="text-red-600">No se pudo renderizar el paso {currentStep}.</p>
            </div>
          </div>
        );
      }
    } catch (error) {
      console.error('❌ Error al renderizar paso:', error);
      return (
        <div className="p-8 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error de Renderizado</h3>
            <p className="text-red-600 mb-4">Ocurrió un error al cargar este paso del wizard.</p>
            <div className="text-sm text-red-500">
              <p><strong>Paso:</strong> {currentStep}</p>
              <p><strong>Error:</strong> {error instanceof Error ? error.message : 'Error desconocido'}</p>
            </div>
            <button
              onClick={() => setCurrentStep(0)}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      );
    }
  };

  if (!isOpen) return null;

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
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                      : isCompleted 
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {isCompleted ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium transition-colors duration-200 ${
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
                    <div className={`w-16 h-0.5 mx-4 transition-all duration-200 ${
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
            <ChevronLeft className="h-5 w-5" />
            <span>Anterior</span>
          </button>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
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
            ) : currentStep === 1 ? (
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
'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, User, MapPin, Calendar, Building2, Layers } from 'lucide-react';
import { ImportarIFC } from './ImportarIFC';
import { WizardCrearObraMejorado } from './WizardCrearObraMejorado';

// Interfaces para el nuevo wizard
interface DatosGenerales {
  cliente: string;
  direccion: string;
  fecha_inicio: string;
  tipo_proyecto: 'unifamiliar' | 'multifamiliar' | 'ampliacion' | 'refaccion';
  numero_plantas: number;
  superficie_estimada_por_planta?: number;
}

interface MetodoCarga {
  tipo: 'manual' | 'bim';
  archivo_ifc?: File;
  elementos_mapeados?: any[];
  datos_manual?: any; // Datos del wizard manual
}

interface WizardData {
  datos_generales: DatosGenerales;
  metodo_carga: MetodoCarga;
  elementos_seleccionados: any[];
}

interface WizardCrearObraNuevoProps {
  onComplete: (data: WizardData) => void;
  onCancel: () => void;
}

export function WizardCrearObraNuevo({ onComplete, onCancel }: WizardCrearObraNuevoProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState<WizardData>({
    datos_generales: {
      cliente: 'Cliente por defecto',
      direccion: 'Dirección por defecto',
      fecha_inicio: new Date().toISOString().split('T')[0],
      tipo_proyecto: 'unifamiliar',
      numero_plantas: 1,
      superficie_estimada_por_planta: undefined
    },
    metodo_carga: {
      tipo: 'manual'
    },
    elementos_seleccionados: []
  });
  const [mostrarWizardManual, setMostrarWizardManual] = useState(false);
  const [mostrarImportadorBIM, setMostrarImportadorBIM] = useState(false);

  const totalSteps = 2;

  const handleDatosGeneralesChange = (data: Partial<DatosGenerales>) => {
    setWizardData(prev => ({
      ...prev,
      datos_generales: { ...prev.datos_generales, ...data }
    }));
  };

  const handleMetodoCargaChange = (data: Partial<MetodoCarga>) => {
    setWizardData(prev => ({
      ...prev,
      metodo_carga: { ...prev.metodo_carga, ...data }
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      // Si estamos en el paso 1 (método de carga) y se selecciona un método, mostrar el wizard correspondiente
      if (currentStep === 1) {
        if (wizardData.metodo_carga.tipo === 'manual') {
          setMostrarWizardManual(true);
        } else if (wizardData.metodo_carga.tipo === 'bim') {
          setMostrarImportadorBIM(true);
        }
        return;
      }
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete(wizardData);
  };

  const handleWizardManualCompletado = (datosManual: any) => {
    setWizardData(prev => ({
      ...prev,
      metodo_carga: {
        ...prev.metodo_carga,
        datos_manual: datosManual
      },
      elementos_seleccionados: datosManual.elementos || []
    }));
    setMostrarWizardManual(false);
    setCurrentStep(2); // Ir al paso de confirmación
  };

  const handleElementosBIMImportados = (elementos: any[]) => {
    const elementosAdaptados = elementos.map((item: any) => {
      const guid = item.guid ?? item.id ?? `ifc-${Math.random().toString(36).slice(2, 11)}`;
      const nombre = item.name ?? item.nombre ?? 'Elemento IFC';
      const tipo = item.ifcType ?? item.tipo ?? item.type ?? 'IfcElement';
      const opciones = item.opcionesCatalogo ?? item.opciones_disponibles ?? item.mapeado?.opciones_disponibles ?? [];
      const estado = item.mapped === true || item.mapeado?.estado === 'mapeado' ? 'mapeado' : 'no_mapeado';
      const idCatalogo = item.idCatalogo ?? item.mapeado?.elemento_catalogo ?? null;
      const confianza = item.confidence ?? item.mapeado?.confianza ?? 0;

      return {
        id: guid,
        guid,
        nombre,
        tipo,
        ifcType: tipo,
        mapeado: {
          elemento_catalogo: idCatalogo ?? undefined,
          opciones_disponibles: opciones,
          estado,
          confianza
        },
        raw: item
      };
    });

    setWizardData(prev => ({
      ...prev,
      metodo_carga: {
        ...prev.metodo_carga,
        elementos_mapeados: elementosAdaptados
      },
      elementos_seleccionados: elementosAdaptados
    }));
    setMostrarImportadorBIM(false);
    setCurrentStep(2);
  };

  const handleVolverAMetodo = () => {
    setMostrarWizardManual(false);
    setMostrarImportadorBIM(false);
    setCurrentStep(1);
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return wizardData.metodo_carga.tipo !== undefined;
      case 2:
        return true;
      default:
        return false;
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div key={i} className="flex items-center">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold transition-all duration-300 ${
              i + 1 <= currentStep
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {i + 1}
          </div>
          {i < totalSteps - 1 && (
            <div
              className={`w-20 h-2 mx-4 rounded-full transition-all duration-300 ${
                i + 1 < currentStep ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mb-6 shadow-lg">
          <Building2 className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Método de Carga de Elementos
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Selecciona la forma en que deseas configurar los elementos constructivos de tu proyecto
        </p>
      </div>

      {/* Method Selection Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Método Manual */}
        <div 
          className={`group relative p-8 rounded-3xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
            wizardData.metodo_carga.tipo === 'manual'
              ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-xl ring-4 ring-blue-100'
              : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-lg'
          }`}
          onClick={() => handleMetodoCargaChange({ tipo: 'manual' })}
        >
          {/* Selection Indicator */}
          {wizardData.metodo_carga.tipo === 'manual' && (
            <div className="absolute top-4 right-4 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          )}
          
          <div className="text-center">
            {/* Icon */}
            <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              wizardData.metodo_carga.tipo === 'manual'
                ? 'bg-blue-500 shadow-lg'
                : 'bg-gray-100 group-hover:bg-blue-100'
            }`}>
              <Building2 className={`h-10 w-10 transition-colors duration-300 ${
                wizardData.metodo_carga.tipo === 'manual' ? 'text-white' : 'text-gray-600 group-hover:text-blue-600'
              }`} />
            </div>
            
            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Carga Manual</h3>
            
            {/* Description */}
            <p className="text-gray-600 mb-6 leading-relaxed">
              Configura elementos constructivos seleccionando desde nuestra base de datos organizada por categorías
            </p>
            
            {/* Features List */}
            <div className="space-y-3 text-left">
              {[
                'Fundación y Estructura',
                'Muros y Cerramientos', 
                'Instalaciones Eléctricas',
                'Cubiertas y Techos',
                'Suelos y Pisos',
                'Amenities y Servicios',
                'Parquizado y Exteriores'
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    wizardData.metodo_carga.tipo === 'manual' ? 'bg-blue-500' : 'bg-gray-400'
                  }`}></div>
                  <span className={`text-sm ${
                    wizardData.metodo_carga.tipo === 'manual' ? 'text-gray-700' : 'text-gray-500'
                  }`}>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Método BIM */}
        <div 
          className={`group relative p-8 rounded-3xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
            wizardData.metodo_carga.tipo === 'bim'
              ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-xl ring-4 ring-emerald-100'
              : 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow-lg'
          }`}
          onClick={() => handleMetodoCargaChange({ tipo: 'bim' })}
        >
          {/* Selection Indicator */}
          {wizardData.metodo_carga.tipo === 'bim' && (
            <div className="absolute top-4 right-4 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          )}
          
          <div className="text-center">
            {/* Icon */}
            <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all duration-300 ${
              wizardData.metodo_carga.tipo === 'bim'
                ? 'bg-emerald-500 shadow-lg'
                : 'bg-gray-100 group-hover:bg-emerald-100'
            }`}>
              <Layers className={`h-10 w-10 transition-colors duration-300 ${
                wizardData.metodo_carga.tipo === 'bim' ? 'text-white' : 'text-gray-600 group-hover:text-emerald-600'
              }`} />
            </div>
            
            {/* Title */}
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Importación BIM</h3>
            
            {/* Description */}
            <p className="text-gray-600 mb-6 leading-relaxed">
              Importa modelos IFC y aprovecha el mapeo automático inteligente de elementos constructivos
            </p>
            
            {/* Features List */}
            <div className="space-y-3 text-left">
              {[
                'Importación de archivos .ifc',
                'Mapeo automático inteligente',
                'Vista previa 3D interactiva',
                'Edición manual de mapeos',
                'Validación con base de datos',
                'Exportación optimizada',
                'Colaboración en tiempo real'
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    wizardData.metodo_carga.tipo === 'bim' ? 'bg-emerald-500' : 'bg-gray-400'
                  }`}></div>
                  <span className={`text-sm ${
                    wizardData.metodo_carga.tipo === 'bim' ? 'text-gray-700' : 'text-gray-500'
                  }`}>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recommendation Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Recomendación</h4>
            <p className="text-gray-700 leading-relaxed">
              {wizardData.metodo_carga.tipo === 'manual' 
                ? 'La carga manual es ideal para proyectos nuevos o cuando necesitas control total sobre cada elemento.'
                : 'La importación BIM es perfecta cuando ya tienes un modelo 3D desarrollado y quieres acelerar el proceso.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl mb-6 shadow-lg">
          <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Confirmación del Proyecto
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Revisa todos los detalles antes de crear tu obra. Puedes modificar cualquier información si es necesario.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Datos Generales Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Datos Generales</h3>
                <p className="text-blue-100 text-sm">Información básica del proyecto</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <span className="text-sm font-medium text-gray-500">Cliente</span>
                <p className="text-gray-900 font-semibold">{wizardData.datos_generales.cliente}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <span className="text-sm font-medium text-gray-500">Dirección</span>
                <p className="text-gray-900 font-semibold">{wizardData.datos_generales.direccion}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <span className="text-sm font-medium text-gray-500">Fecha de inicio</span>
                <p className="text-gray-900 font-semibold">{wizardData.datos_generales.fecha_inicio}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <span className="text-sm font-medium text-gray-500">Tipo de proyecto</span>
                <p className="text-gray-900 font-semibold capitalize">{wizardData.datos_generales.tipo_proyecto}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <span className="text-sm font-medium text-gray-500">Número de plantas</span>
                <p className="text-gray-900 font-semibold">{wizardData.datos_generales.numero_plantas}</p>
              </div>
            </div>
            {wizardData.datos_generales.superficie_estimada_por_planta && (
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Superficie por planta</span>
                  <p className="text-gray-900 font-semibold">{wizardData.datos_generales.superficie_estimada_por_planta} m²</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Método de Carga Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className={`p-6 ${wizardData.metodo_carga.tipo === 'manual' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-emerald-500 to-emerald-600'}`}>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                {wizardData.metodo_carga.tipo === 'manual' ? (
                  <Building2 className="h-6 w-6 text-white" />
                ) : (
                  <Layers className="h-6 w-6 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Método de Carga</h3>
                <p className="text-white/80 text-sm">Configuración de elementos</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                wizardData.metodo_carga.tipo === 'manual' ? 'bg-blue-100' : 'bg-emerald-100'
              }`}>
                {wizardData.metodo_carga.tipo === 'manual' ? (
                  <Building2 className={`h-8 w-8 ${wizardData.metodo_carga.tipo === 'manual' ? 'text-blue-600' : 'text-emerald-600'}`} />
                ) : (
                  <Layers className={`h-8 w-8 ${wizardData.metodo_carga.tipo === 'manual' ? 'text-blue-600' : 'text-emerald-600'}`} />
                )}
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">
                {wizardData.metodo_carga.tipo === 'manual' ? 'Carga Manual' : 'Importación BIM'}
              </h4>
              <p className="text-gray-600 text-sm leading-relaxed">
                {wizardData.metodo_carga.tipo === 'manual' 
                  ? 'Elementos seleccionados manualmente desde la base de datos'
                  : 'Elementos importados desde modelo IFC con mapeo automático'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Elementos Constructivos Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Elementos</h3>
                <p className="text-purple-100 text-sm">Constructivos configurados</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {wizardData.elementos_seleccionados.length}
                </div>
                <div className="text-sm text-gray-600">Total de elementos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {wizardData.metodo_carga.tipo === 'manual' 
                    ? Object.keys(wizardData.metodo_carga.datos_manual?.plantas || {}).length || 0
                    : new Set(wizardData.elementos_seleccionados.map((e: any) => e.tipo)).size
                  }
                </div>
                <div className="text-sm text-gray-600">
                  {wizardData.metodo_carga.tipo === 'manual' ? 'Plantas configuradas' : 'Tipos de elementos'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600 mb-1">
                  {wizardData.metodo_carga.tipo === 'bim' 
                    ? Math.round((wizardData.elementos_seleccionados.filter((e: any) => e.mapeado?.estado === 'mapeado').length / wizardData.elementos_seleccionados.length) * 100) || 0
                    : 100
                  }%
                </div>
                <div className="text-sm text-gray-600">
                  {wizardData.metodo_carga.tipo === 'manual' ? 'Configuración completa' : 'Elementos mapeados'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setCurrentStep(1)}
          className="flex items-center space-x-3 px-8 py-4 border-2 border-gray-300 rounded-2xl font-semibold text-gray-700 hover:border-gray-400 hover:shadow-md transition-all duration-300"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span>Editar Configuración</span>
        </button>
        
        <button
          onClick={handleComplete}
          className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl font-semibold hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Crear Obra</span>
        </button>
      </div>

      {/* Success Preview */}
      <div className="mt-12 bg-gradient-to-r from-emerald-50 to-green-50 rounded-3xl p-8 border border-emerald-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Todo listo!</h3>
          <p className="text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Tu obra será creada con la configuración seleccionada. Podrás acceder a ella desde el panel principal y comenzar a gestionar los elementos constructivos inmediatamente.
          </p>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2" style={{ color: '#1A202C' }}>
                ConfirmaciÃ³n del Proyecto
              </h2>
              <p className="text-lg text-gray-600">Revisa los datos antes de crear la obra</p>
            </div>
            <div className="text-right">
              <div className="text-sm mb-1 text-gray-600">Paso 2 de {totalSteps}</div>
              <div className="text-4xl font-bold px-4 py-2 rounded-2xl" style={{ backgroundColor: '#FEEB70', color: '#1A202C' }}>
                Resumen
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="space-y-6">
            {/* Datos Generales */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Datos Generales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Cliente:</span>
                  <p className="text-gray-900">{wizardData.datos_generales.cliente}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">DirecciÃ³n:</span>
                  <p className="text-gray-900">{wizardData.datos_generales.direccion}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Fecha de inicio:</span>
                  <p className="text-gray-900">{wizardData.datos_generales.fecha_inicio}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Tipo de proyecto:</span>
                  <p className="text-gray-900 capitalize">{wizardData.datos_generales.tipo_proyecto}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">NÃºmero de plantas:</span>
                  <p className="text-gray-900">{wizardData.datos_generales.numero_plantas}</p>
                </div>
                {wizardData.datos_generales.superficie_estimada_por_planta && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Superficie por planta:</span>
                    <p className="text-gray-900">{wizardData.datos_generales.superficie_estimada_por_planta} mÂ²</p>
                  </div>
                )}
              </div>
            </div>

            {/* MÃ©todo de Carga */}
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">MÃ©todo de Carga</h3>
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  wizardData.metodo_carga.tipo === 'manual' ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  {wizardData.metodo_carga.tipo === 'manual' ? (
                    <Building2 className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Layers className="h-4 w-4 text-green-600" />
                  )}
                </div>
                <span className="text-gray-900 font-medium">
                  {wizardData.metodo_carga.tipo === 'manual' ? 'Carga Manual' : 'ImportaciÃ³n BIM (IFC)'}
                </span>
              </div>
            </div>

            {/* Elementos Cargados */}
            <div className="bg-green-50 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Elementos Constructivos</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {wizardData.elementos_seleccionados.length}
                  </div>
                  <div className="text-sm text-gray-600">Total de elementos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {wizardData.metodo_carga.tipo === 'manual' 
                      ? Object.keys(wizardData.metodo_carga.datos_manual?.plantas || {}).length || 0
                      : new Set(wizardData.elementos_seleccionados.map((e: any) => e.tipo)).size
                    }
                  </div>
                  <div className="text-sm text-gray-600">
                    {wizardData.metodo_carga.tipo === 'manual' ? 'Plantas configuradas' : 'Tipos de elementos'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {wizardData.metodo_carga.tipo === 'bim' 
                      ? Math.round((wizardData.elementos_seleccionados.filter((e: any) => e.mapeado?.estado === 'mapeado').length / wizardData.elementos_seleccionados.length) * 100) || 0
                      : 100
                    }%
                  </div>
                  <div className="text-sm text-gray-600">
                    {wizardData.metodo_carga.tipo === 'manual' ? 'ConfiguraciÃ³n completa' : 'Elementos mapeados'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    // Si se estÃ¡ mostrando el wizard manual
    if (mostrarWizardManual) {
      return (
        <WizardCrearObraMejorado
          onSuccess={handleWizardManualCompletado}
          onCancel={handleVolverAMetodo}
        />
      );
    }

    // Si se estÃ¡ mostrando el importador BIM
    if (mostrarImportadorBIM) {
      return (
        <ImportarIFC
          onElementosImportados={handleElementosBIMImportados}
          onCancel={handleVolverAMetodo}
        />
      );
    }

    // Renderizar pasos normales del wizard
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      default:
        return renderStep1();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Step Indicator */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 py-8 shadow-sm">
        <div className="max-w-6xl mx-auto px-6">
          {renderStepIndicator()}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1">
        {renderCurrentStep()}
      </div>

      {/* Navigation */}
      <div className="bg-white/90 backdrop-blur-sm border-t border-gray-200 py-8 shadow-lg">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center space-x-3 px-8 py-4 border-2 border-gray-300 rounded-2xl font-semibold transition-all duration-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-400 hover:shadow-md disabled:hover:border-gray-300 disabled:hover:shadow-sm"
              style={{
                color: '#374151',
                backgroundColor: currentStep === 1 ? '#f9fafb' : '#ffffff'
              }}
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Anterior</span>
            </button>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500 font-medium">
                Paso {currentStep} de {totalSteps}
              </span>
              <div className="flex space-x-2">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      i + 1 <= currentStep ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {currentStep < totalSteps ? (
              <button
                onClick={handleNext}
                disabled={!isStepValid(currentStep)}
                className="flex items-center space-x-3 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100"
                style={{ 
                  backgroundColor: isStepValid(currentStep) ? '#3b82f6' : '#9ca3af',
                  backgroundImage: isStepValid(currentStep) ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : 'none'
                }}
              >
                <span>Siguiente</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="flex items-center space-x-3 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                style={{ 
                  backgroundColor: '#10b981',
                  backgroundImage: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                }}
              >
                <span>Crear Obra</span>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



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
      cliente: '',
      direccion: '',
      fecha_inicio: '',
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

  const totalSteps = 3;

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
      // Si estamos en el paso 2 y se selecciona un mÃ©todo, mostrar el wizard correspondiente
      if (currentStep === 2) {
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
    setCurrentStep(3); // Ir al paso de confirmaciÃ³n
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
    setCurrentStep(3);
  };

  const handleVolverAMetodo = () => {
    setMostrarWizardManual(false);
    setMostrarImportadorBIM(false);
    setCurrentStep(2);
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(wizardData.datos_generales.cliente && 
                 wizardData.datos_generales.direccion && 
                 wizardData.datos_generales.fecha_inicio);
      case 2:
        return wizardData.metodo_carga.tipo !== undefined;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {Array.from({ length: totalSteps }, (_, i) => (
        <div key={i} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
              i + 1 <= currentStep
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {i + 1}
          </div>
          {i < totalSteps - 1 && (
            <div
              className={`w-16 h-1 mx-2 ${
                i + 1 < currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2" style={{ color: '#1A202C' }}>
                Datos Generales del Proyecto
              </h2>
              <p className="text-lg text-gray-600">Ingresa la informaciÃ³n bÃ¡sica de la obra</p>
            </div>
            <div className="text-right">
              <div className="text-sm mb-1 text-gray-600">Paso 1 de {totalSteps}</div>
              <div className="text-4xl font-bold px-4 py-2 rounded-2xl" style={{ backgroundColor: '#FEEB70', color: '#1A202C' }}>
                Datos BÃ¡sicos
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Cliente */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-bold text-gray-700">
                <User className="h-4 w-4" />
                <span>Cliente *</span>
              </label>
              <input
                type="text"
                value={wizardData.datos_generales.cliente}
                onChange={(e) => handleDatosGeneralesChange({ cliente: e.target.value })}
                placeholder="Nombre del cliente"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* DirecciÃ³n */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-bold text-gray-700">
                <MapPin className="h-4 w-4" />
                <span>DirecciÃ³n de la obra *</span>
              </label>
              <input
                type="text"
                value={wizardData.datos_generales.direccion}
                onChange={(e) => handleDatosGeneralesChange({ direccion: e.target.value })}
                placeholder="DirecciÃ³n completa"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Fecha de inicio */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-bold text-gray-700">
                <Calendar className="h-4 w-4" />
                <span>Fecha de inicio *</span>
              </label>
              <input
                type="date"
                value={wizardData.datos_generales.fecha_inicio}
                onChange={(e) => handleDatosGeneralesChange({ fecha_inicio: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Tipo de proyecto */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-bold text-gray-700">
                <Building2 className="h-4 w-4" />
                <span>Tipo de proyecto *</span>
              </label>
              <select
                value={wizardData.datos_generales.tipo_proyecto}
                onChange={(e) => handleDatosGeneralesChange({ tipo_proyecto: e.target.value as any })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="unifamiliar">Vivienda Unifamiliar</option>
                <option value="multifamiliar">Vivienda Multifamiliar</option>
                <option value="ampliacion">AmpliaciÃ³n</option>
                <option value="refaccion">RefacciÃ³n</option>
              </select>
            </div>

            {/* NÃºmero de plantas */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-bold text-gray-700">
                <Layers className="h-4 w-4" />
                <span>NÃºmero de plantas *</span>
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={wizardData.datos_generales.numero_plantas}
                onChange={(e) => handleDatosGeneralesChange({ numero_plantas: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Superficie estimada por planta (opcional) */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 text-sm font-bold text-gray-700">
                <span>Superficie estimada por planta (mÂ²)</span>
                <span className="text-xs text-gray-500">(opcional)</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={wizardData.datos_generales.superficie_estimada_por_planta || ''}
                onChange={(e) => handleDatosGeneralesChange({ 
                  superficie_estimada_por_planta: parseFloat(e.target.value) || undefined 
                })}
                placeholder="Ej: 120.5"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2" style={{ color: '#1A202C' }}>
                MÃ©todo de Carga de Elementos
              </h2>
              <p className="text-lg text-gray-600">Elige cÃ³mo quieres cargar los elementos constructivos</p>
            </div>
            <div className="text-right">
              <div className="text-sm mb-1 text-gray-600">Paso 2 de {totalSteps}</div>
              <div className="text-4xl font-bold px-4 py-2 rounded-2xl" style={{ backgroundColor: '#FEEB70', color: '#1A202C' }}>
                MÃ©todo
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* MÃ©todo Manual */}
            <div 
              className={`p-8 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                wizardData.metodo_carga.tipo === 'manual'
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
              onClick={() => handleMetodoCargaChange({ tipo: 'manual' })}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Cargar Manualmente</h3>
                <p className="text-gray-600 mb-4">
                  Selecciona elementos constructivos de nuestra base de datos por categorÃ­as
                </p>
                <ul className="text-sm text-gray-500 space-y-1 text-left">
                  <li>â€¢ FundaciÃ³n y Estructura</li>
                  <li>â€¢ Muros y Cerramientos</li>
                  <li>â€¢ Instalaciones</li>
                  <li>â€¢ Cubiertas</li>
                  <li>â€¢ Suelos y Pisos</li>
                  <li>â€¢ Amenities</li>
                  <li>â€¢ Parquizado</li>
                </ul>
              </div>
            </div>

            {/* MÃ©todo BIM */}
            <div 
              className={`p-8 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                wizardData.metodo_carga.tipo === 'bim'
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
              }`}
              onClick={() => handleMetodoCargaChange({ tipo: 'bim' })}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <Layers className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Importar Modelo BIM (IFC)</h3>
                <p className="text-gray-600 mb-4">
                  Importa un modelo IFC y mapea automÃ¡ticamente los elementos constructivos
                </p>
                <ul className="text-sm text-gray-500 space-y-1 text-left">
                  <li>â€¢ ImportaciÃ³n de archivos .ifc</li>
                  <li>â€¢ Mapeo automÃ¡tico de elementos</li>
                  <li>â€¢ Vista previa 3D del modelo</li>
                  <li>â€¢ EdiciÃ³n manual de mapeos</li>
                  <li>â€¢ ValidaciÃ³n con base de datos</li>
                </ul>
              </div>
            </div>
          </div>
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
              <div className="text-sm mb-1 text-gray-600">Paso 3 de {totalSteps}</div>
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
      case 3:
        return renderStep3();
      default:
        return renderStep1();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Step Indicator */}
      <div className="bg-white border-b border-gray-200 py-6">
        {renderStepIndicator()}
      </div>

      {/* Step Content */}
      {renderCurrentStep()}

      {/* Navigation */}
      <div className="bg-white border-t border-gray-200 p-6">
        <div className="max-w-4xl mx-auto flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg font-medium transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              color: '#1A202C',
              backgroundColor: currentStep === 1 ? '#f3f4f6' : '#FEEB70'
            }}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Anterior</span>
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              disabled={!isStepValid(currentStep)}
              className="flex items-center space-x-2 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: isStepValid(currentStep) ? '#22C55E' : '#9CA3AF' }}
            >
              <span>Siguiente</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleComplete}
              className="flex items-center space-x-2 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200 shadow-lg"
              style={{ backgroundColor: '#22C55E' }}
            >
              <span>Crear Obra</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}



'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Settings, Eye } from 'lucide-react';
import './tecnico-wizard.css';
import { elementos } from '../../lib/catalogos/elementos';
import { Seleccion } from './SubgrupoAccordion';
import { ConfiguracionTecnicaModal } from './ConfiguracionTecnicaModal';
import { ResumenModal } from './ResumenModal';

// Mapeo de etapas en orden técnico
const ETAPAS_CONSTRUCCION = [
  { 
    id: 'fundaciones', 
    nombre: 'Fundaciones y Estructuras', 
    icono: '🏗️',
    descripcion: 'Elementos estructurales de base',
    color: 'blue'
  },
  { 
    id: 'muros', 
    nombre: 'Muros', 
    icono: '🧱',
    descripcion: 'Muros portantes y divisorios',
    color: 'green'
  },
  { 
    id: 'instalaciones', 
    nombre: 'Instalaciones', 
    icono: '⚡',
    descripcion: 'Instalaciones eléctricas y sanitarias',
    color: 'orange'
  },
  { 
    id: 'cubiertas', 
    nombre: 'Cubiertas', 
    icono: '🏘️',
    descripcion: 'Sistemas de cubierta',
    color: 'purple'
  },
  { 
    id: 'pisos', 
    nombre: 'Pisos', 
    icono: '🏠',
    descripcion: 'Losas y contrapisos',
    color: 'yellow'
  },
  { 
    id: 'carpinterias', 
    nombre: 'Carpinterías', 
    icono: '🚪',
    descripcion: 'Puertas y ventanas',
    color: 'indigo'
  },
  { 
    id: 'parquizado', 
    nombre: 'Parquizado', 
    icono: '🌱',
    descripcion: 'Paisajismo y espacios verdes',
    color: 'green'
  }
];

interface TecnicoElementosWizardProps {
  onSeleccionesChange: (selecciones: Seleccion[]) => void;
  etapaActual?: number;
  onEtapaChange?: (etapa: number) => void;
}

export function TecnicoElementosWizard({ 
  onSeleccionesChange, 
  etapaActual = 0, 
  onEtapaChange 
}: TecnicoElementosWizardProps) {
  const [elementosSeleccionados, setElementosSeleccionados] = useState<Seleccion[]>([]);
  const [elementoSeleccionado, setElementoSeleccionado] = useState<any>(null);
  const [showConfiguracion, setShowConfiguracion] = useState(false);
  const [showResumen, setShowResumen] = useState(false);

  const etapa = ETAPAS_CONSTRUCCION[etapaActual];
  const categoria = elementos.find(cat => cat.categoria === etapa.nombre);

  const handleElementoSeleccionado = (seleccion: Seleccion) => {
    const nuevasSelecciones = [...elementosSeleccionados, seleccion];
    setElementosSeleccionados(nuevasSelecciones);
    onSeleccionesChange(nuevasSelecciones);
  };

  const handleQuitarSeleccion = (opcionId: string) => {
    const nuevasSelecciones = elementosSeleccionados.filter(s => s.opcionId !== opcionId);
    setElementosSeleccionados(nuevasSelecciones);
    onSeleccionesChange(nuevasSelecciones);
  };

  const handleConfigurarElemento = (elemento: any) => {
    setElementoSeleccionado(elemento);
    setShowConfiguracion(true);
  };


  const seleccionesEnEtapa = elementosSeleccionados.filter(s => s.subgrupo === etapa.nombre);

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header del Wizard */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Selección de Elementos Constructivos
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Configuración técnica paso a paso
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowResumen(true)}
                className="btn-primary flex items-center space-x-2 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                <Eye className="h-4 w-4" />
                <span>Ver Resumen</span>
                {elementosSeleccionados.length > 0 && (
                  <span className="bg-blue-800 text-white text-xs px-2 py-1 rounded-full">
                    {elementosSeleccionados.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              {ETAPAS_CONSTRUCCION.map((etapa, index) => {
                const isActive = index === etapaActual;
                const isCompleted = index < etapaActual;
                const isUpcoming = index > etapaActual;
                
                return (
                  <div key={etapa.id} className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                      isActive 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : isCompleted 
                          ? 'bg-green-600 border-green-600 text-white'
                          : 'bg-white border-gray-300 text-gray-400'
                    }`}>
                      <span className="text-lg">{etapa.icono}</span>
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${
                        isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {etapa.nombre}
                      </p>
                      <p className="text-xs text-gray-500">
                        {seleccionesEnEtapa.length} elementos
                      </p>
                    </div>
                    {index < ETAPAS_CONSTRUCCION.length - 1 && (
                      <div className={`w-16 h-0.5 mx-4 ${
                        isCompleted ? 'bg-green-600' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header de la Etapa Actual */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className={`p-3 rounded-xl bg-${etapa.color}-100`}>
              <span className="text-3xl">{etapa.icono}</span>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {etapa.nombre}
              </h3>
              <p className="text-gray-600">
                {etapa.descripcion}
              </p>
            </div>
          </div>
          
          {seleccionesEnEtapa.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm">
                ✅ {seleccionesEnEtapa.length} elemento(s) seleccionado(s) en esta etapa
              </p>
            </div>
          )}
        </div>

        {/* Grid de Elementos */}
        {categoria && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoria.tipos.map((elemento) => {
              const yaSeleccionado = elementosSeleccionados.some(s => 
                s.subgrupo === etapa.nombre && s.elementoNombre === elemento.nombre
              );
              
              const tareasTotal = [
                ...elemento.fases.estructura,
                ...elemento.fases.obra_gris,
                ...elemento.fases.terminaciones
              ].length;
              
              const duracionEstimada = tareasTotal * 2; // Estimación simple
              
              return (
                <div
                  key={elemento.nombre}
                  className={`elemento-card config-card p-6 cursor-pointer ${
                    yaSeleccionado ? 'seleccionado' : ''
                  }`}
                  onClick={() => handleConfigurarElemento(elemento)}
                >
                  <div className="flex flex-col h-full">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 text-lg leading-tight">
                          {elemento.nombre}
                        </h4>
                        {yaSeleccionado && (
                          <span className="badge badge-green">
                            Configurado
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">{tareasTotal}</div>
                          <div className="text-xs text-gray-600">Tareas</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-600">{duracionEstimada}d</div>
                          <div className="text-xs text-gray-600">Duración</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Unidad:</span>
                          <span className="font-medium">m²</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Fases:</span>
                          <span className="font-medium">
                            {Object.keys(elemento.fases).filter(fase => elemento.fases[fase as keyof typeof elemento.fases].length > 0).join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfigurarElemento(elemento);
                        }}
                        className={`w-full py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center space-x-2 ${
                          yaSeleccionado
                            ? 'bg-green-100 text-green-700'
                            : 'btn-primary text-white'
                        }`}
                      >
                        <Settings className="h-4 w-4" />
                        <span>
                          {yaSeleccionado ? 'Reconfigurar' : 'Configurar'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>


      {/* Modales */}
      {showConfiguracion && elementoSeleccionado && (
        <ConfiguracionTecnicaModal
          elemento={elementoSeleccionado}
          subgrupo={etapa.nombre}
          onClose={() => setShowConfiguracion(false)}
          onAgregar={handleElementoSeleccionado}
          elementosSeleccionados={elementosSeleccionados}
        />
      )}

      {showResumen && (
        <ResumenModal
          elementosSeleccionados={elementosSeleccionados}
          onClose={() => setShowResumen(false)}
          onQuitarSeleccion={handleQuitarSeleccion}
        />
      )}
    </div>
  );
}

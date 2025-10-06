'use client';

import React from 'react';
import {
  CheckCircle,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  ArrowRight
} from 'lucide-react';

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

interface ObraData {
  nombre: string;
  localizacion: string;
  estado: string;
  fecha_inicio: string;
  tipo_obra: string;
}

interface PasoConfirmacionProps {
  obraData: ObraData;
  elementosSeleccionados: Seleccion[];
  onConfirmar: () => void;
  loading: boolean;
}

export function PasoConfirmacion({ obraData, elementosSeleccionados, onConfirmar, loading }: PasoConfirmacionProps) {
  const totalTareas = elementosSeleccionados.reduce((total, sel) => total + (sel.tareasSugeridas?.length || 0), 0);
  const totalDias = elementosSeleccionados.reduce((total, sel) => total + (sel.duracionEstimadaDias || 0), 0);
  const totalCategorias = new Set(elementosSeleccionados.map(el => el.subgrupo)).size;

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="p-4 bg-green-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-2">¡Listo para Crear!</h3>
          <p className="text-gray-600 text-lg">
            Revisa todos los datos antes de crear tu obra
          </p>
        </div>

        {/* Resumen de la Obra */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-8">
          <div className="p-6 border-b border-gray-100">
            <h4 className="text-xl font-semibold text-gray-900 flex items-center">
              <Building2 className="h-5 w-5 mr-2 text-blue-600" />
              Información de la Obra
            </h4>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center">
                    <Building2 className="h-4 w-4 mr-1" />
                    Nombre de la Obra
                  </label>
                  <p className="text-gray-900 font-medium">{obraData.nombre}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Ubicación
                  </label>
                  <p className="text-gray-900 font-medium">{obraData.localizacion}</p>
                </div>

              </div>

              <div className="space-y-4">
                {obraData.fecha_inicio && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Fecha de Inicio
                    </label>
                    <p className="text-gray-900 font-medium">
                      {new Date(obraData.fecha_inicio).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-500">Tipo de Obra</label>
                  <p className="text-gray-900 font-medium">{obraData.tipo_obra || 'No especificado'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Estado</label>
                  <p className="text-gray-900 font-medium">{obraData.estado}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas de Elementos */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-8">
          <div className="p-6 border-b border-gray-100">
            <h4 className="text-xl font-semibold text-gray-900">Resumen de Elementos Constructivos</h4>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">{elementosSeleccionados.length}</div>
                <div className="text-sm text-gray-600">Elementos Seleccionados</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">{totalCategorias}</div>
                <div className="text-sm text-gray-600">Categorías</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-1">{totalTareas}</div>
                <div className="text-sm text-gray-600">Tareas Generadas</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">{totalDias}</div>
                <div className="text-sm text-gray-600">Días Estimados</div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Categorías */}
        {elementosSeleccionados.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-8">
            <div className="p-6 border-b border-gray-100">
              <h4 className="text-xl font-semibold text-gray-900">Categorías Incluidas</h4>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.from(new Set(elementosSeleccionados.map(el => el.subgrupo))).map((categoria) => {
                  const cantidad = elementosSeleccionados.filter(el => el.subgrupo === categoria).length;
                  return (
                    <div key={categoria} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <span className="font-medium text-gray-900">{categoria}</span>
                      <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full">
                        {cantidad} elementos
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Mensaje de confirmación */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
          <h4 className="text-lg font-semibold text-green-900 mb-2">
            ¡Todo listo para crear tu obra!
          </h4>
          <p className="text-green-700 mb-4">
            Al confirmar, se creará la obra con todos los elementos y configuraciones seleccionados.
            Podrás acceder a ella desde el dashboard de obras.
          </p>
          <button
            onClick={onConfirmar}
            disabled={loading || elementosSeleccionados.length === 0}
            className="inline-flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-8 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Creando Obra...</span>
              </>
            ) : (
              <>
                <ArrowRight className="h-5 w-5" />
                <span>Crear Obra</span>
              </>
            )}
          </button>
        </div>

        {elementosSeleccionados.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <h4 className="text-lg font-semibold text-yellow-900 mb-2">
              ⚠️ No hay elementos seleccionados
            </h4>
            <p className="text-yellow-700">
              Debes seleccionar al menos un elemento constructivo para crear la obra.
              Ve a las etapas anteriores para agregar elementos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

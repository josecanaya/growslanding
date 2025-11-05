'use client';

import { CheckCircle, Clock, Users, Calendar, AlertTriangle, TrendingUp } from 'lucide-react';
import { ObraData, ElementoConstructivo, TareaGenerada } from '../WizardCrearObra';

interface PasoConfirmacionFinalProps {
  obraData: ObraData;
  elementos: ElementoConstructivo[];
  tareas: TareaGenerada[];
}

export function PasoConfirmacionFinal({ obraData, elementos, tareas }: PasoConfirmacionFinalProps) {
  const duracionTotal = tareas.reduce((total, tarea) => total + tarea.duracion, 0);
  const tareasCriticas = tareas.filter(t => t.esCritica);
  const tareasPorEtapa = {
    estructura: tareas.filter(t => t.etapa === 'estructura'),
    obra_gris: tareas.filter(t => t.etapa === 'obra_gris'),
    terminaciones: tareas.filter(t => t.etapa === 'terminaciones')
  };

  const duracionPorEtapa = {
    estructura: tareasPorEtapa.estructura.reduce((total, tarea) => total + tarea.duracion, 0),
    obra_gris: tareasPorEtapa.obra_gris.reduce((total, tarea) => total + tarea.duracion, 0),
    terminaciones: tareasPorEtapa.terminaciones.reduce((total, tarea) => total + tarea.duracion, 0)
  };

  const semanasEstimadas = Math.ceil(duracionTotal / 7);
  const mesesEstimados = Math.ceil(duracionTotal / 30);

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-primario mb-2">Confirmación Final</h3>
          <p className="text-primario/70">
            Revisa todos los detalles antes de crear tu obra
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Resumen de la obra */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información básica */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-primario mb-4 flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Información de la Obra</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Nombre</label>
                  <p className="text-primario font-medium">{obraData.nombre}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Cliente</label>
                  <p className="text-primario font-medium">{obraData.cliente}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Ubicación</label>
                  <p className="text-primario font-medium">{obraData.localizacion}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Tipo de Obra</label>
                  <p className="text-primario font-medium capitalize">{obraData.tipoObra}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Fecha de Inicio</label>
                  <p className="text-primario font-medium">{obraData.fechaInicio}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Fecha de Finalización</label>
                  <p className="text-primario font-medium">{obraData.fechaFin || 'No especificada'}</p>
                </div>
                {obraData.numeroPermiso && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-600">Número de Permiso</label>
                    <p className="text-primario font-medium">{obraData.numeroPermiso}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Resumen de tareas por etapa */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-primario mb-4 flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <span>Distribución de Tareas por Etapa</span>
              </h4>
              <div className="space-y-4">
                {Object.entries(tareasPorEtapa).map(([etapa, tareasEtapa]) => {
                  const duracion = duracionPorEtapa[etapa as keyof typeof duracionPorEtapa];
                  const porcentaje = duracionTotal > 0 ? Math.round((duracion / duracionTotal) * 100) : 0;
                  
                  return (
                    <div key={etapa} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-primario capitalize">
                          {etapa === 'obra_gris' ? 'Obra Gris' : etapa}
                        </h5>
                        <div className="text-sm text-gray-600">
                          {tareasEtapa.length} tareas • {duracion} días
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primario h-2 rounded-full transition-all duration-300"
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{porcentaje}% del total</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lista de tareas críticas */}
            {tareasCriticas.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-red-800 mb-4 flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span>Tareas Críticas</span>
                </h4>
                <div className="space-y-2">
                  {tareasCriticas.map(tarea => (
                    <div key={tarea.id} className="flex items-center justify-between bg-white border border-red-200 rounded-lg p-3">
                      <div>
                        <h5 className="font-medium text-red-800">{tarea.nombre}</h5>
                        <p className="text-sm text-red-600">{tarea.descripcion}</p>
                      </div>
                      <div className="text-sm text-red-600 font-medium">
                        {tarea.duracion} días
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Panel de resumen */}
          <div className="space-y-6">
            {/* Estadísticas generales */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-primario mb-4 flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span>Resumen General</span>
              </h4>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primario">{duracionTotal}</div>
                  <div className="text-sm text-gray-600">Días totales</div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-xl font-semibold text-primario">{semanasEstimadas}</div>
                    <div className="text-xs text-gray-600">Semanas</div>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-primario">{mesesEstimados}</div>
                    <div className="text-xs text-gray-600">Meses</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primario">{elementos.length}</div>
                  <div className="text-sm text-gray-600">Elementos constructivos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primario">{tareas.length}</div>
                  <div className="text-sm text-gray-600">Tareas generadas</div>
                </div>
              </div>
            </div>

            {/* Elementos constructivos */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-primario mb-4 flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-500" />
                <span>Elementos Seleccionados</span>
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {elementos.map(elemento => (
                  <div key={elemento.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{elemento.icono}</span>
                      <span className="text-sm font-medium text-primario">{elemento.nombre}</span>
                    </div>
                    <span className="text-xs text-gray-600">{elemento.duracion}d</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cronograma estimado */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-primario mb-4 flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-purple-500" />
                <span>Cronograma Estimado</span>
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Inicio estimado:</span>
                  <span className="text-sm font-medium text-primario">{obraData.fechaInicio}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Finalización estimada:</span>
                  <span className="text-sm font-medium text-primario">
                    {obraData.fechaFin || 'Por calcular'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Duración total:</span>
                  <span className="text-sm font-medium text-primario">{duracionTotal} días</span>
                </div>
              </div>
            </div>

            {/* Advertencias */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h5 className="font-medium text-yellow-800 mb-2">⚠️ Consideraciones</h5>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Las duraciones son estimaciones</li>
                <li>• Considera factores climáticos</li>
                <li>• Revisa permisos y regulaciones</li>
                <li>• Planifica recursos necesarios</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


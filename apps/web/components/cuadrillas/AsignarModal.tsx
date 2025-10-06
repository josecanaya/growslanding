'use client';

import { useState } from 'react';
import { X, Search, Filter, MapPin, Calendar } from 'lucide-react';
import { useCuadrillasStore } from '@/lib/store/cuadrillasStore';

export function AsignarModal() {
  const { 
    showModalAsignacion, 
    cerrarModalAsignacion, 
    cuadrillaSeleccionada, 
    obras, 
    tareas, 
    asignarTarea 
  } = useCuadrillasStore();

  const [busquedaObra, setBusquedaObra] = useState('');
  const [busquedaTarea, setBusquedaTarea] = useState('');
  const [obraSeleccionada, setObraSeleccionada] = useState<string>('');
  const [etapaFiltro, setEtapaFiltro] = useState<string>('');
  const [tareaSeleccionada, setTareaSeleccionada] = useState<string>('');

  if (!showModalAsignacion || !cuadrillaSeleccionada) return null;

  // Filtrar obras
  const obrasFiltradas = obras.filter(obra => 
    obra.nombre.toLowerCase().includes(busquedaObra.toLowerCase())
  );

  // Filtrar tareas
  const tareasFiltradas = tareas.filter(tarea => {
    const matchObra = obraSeleccionada ? tarea.obraId === obraSeleccionada : true;
    const matchBusqueda = tarea.nombre.toLowerCase().includes(busquedaTarea.toLowerCase());
    const matchEtapa = etapaFiltro ? tarea.etapa === etapaFiltro : true;
    const sinAsignar = !tarea.cuadrillaId; // Solo tareas sin asignar
    
    return matchObra && matchBusqueda && matchEtapa && sinAsignar;
  });

  const obraSeleccionadaData = obras.find(o => o.id === obraSeleccionada);

  const getEtapaColor = (etapa: string) => {
    const colores = {
      'estructura': 'bg-blue-100 text-blue-800',
      'obra_gris': 'bg-gray-100 text-gray-800',
      'terminaciones': 'bg-green-100 text-green-800'
    };
    return colores[etapa as keyof typeof colores] || 'bg-gray-100 text-gray-800';
  };

  const getEstadoColor = (estado: string) => {
    const colores = {
      'PENDIENTE': 'bg-yellow-100 text-yellow-800',
      'ASIGNADA': 'bg-blue-100 text-blue-800',
      'EN_EJECUCION': 'bg-purple-100 text-purple-800',
      'TERMINADA': 'bg-green-100 text-green-800',
      'VALIDADA': 'bg-indigo-100 text-indigo-800'
    };
    return colores[estado as keyof typeof colores] || 'bg-gray-100 text-gray-800';
  };

  const handleAsignar = () => {
    if (tareaSeleccionada) {
      asignarTarea(cuadrillaSeleccionada.id, tareaSeleccionada);
      cerrarModalAsignacion();
      // Reset form
      setObraSeleccionada('');
      setTareaSeleccionada('');
      setBusquedaObra('');
      setBusquedaTarea('');
      setEtapaFiltro('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Asignar Tarea</h3>
            <p className="text-sm text-gray-600">
              Cuadrilla: {cuadrillaSeleccionada.nombre}
            </p>
          </div>
          <button
            onClick={cerrarModalAsignacion}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel izquierdo - Selección de obra */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Seleccionar Obra
              </h4>
              
              {/* Búsqueda de obra */}
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={busquedaObra}
                  onChange={(e) => setBusquedaObra(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Buscar obra..."
                />
              </div>

              {/* Lista de obras */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {obrasFiltradas.map((obra) => (
                  <button
                    key={obra.id}
                    onClick={() => setObraSeleccionada(obra.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors duration-200 ${
                      obraSeleccionada === obra.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{obra.nombre}</p>
                        <p className="text-sm text-gray-600">{obra.estado}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        obra.estado === 'ACTIVA' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {obra.estado}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Panel derecho - Selección de tarea */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Seleccionar Tarea
              </h4>

              {/* Filtros de tarea */}
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={busquedaTarea}
                    onChange={(e) => setBusquedaTarea(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Buscar tarea..."
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={etapaFiltro}
                    onChange={(e) => setEtapaFiltro(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todas las etapas</option>
                    <option value="estructura">Estructura</option>
                    <option value="obra_gris">Obra Gris</option>
                    <option value="terminaciones">Terminaciones</option>
                  </select>
                </div>
              </div>

              {/* Lista de tareas */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {tareasFiltradas.map((tarea) => {
                  const obra = obras.find(o => o.id === tarea.obraId);
                  return (
                    <button
                      key={tarea.id}
                      onClick={() => setTareaSeleccionada(tarea.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors duration-200 ${
                        tareaSeleccionada === tarea.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">{tarea.nombre}</p>
                          <p className="text-xs text-gray-600 mt-1">{obra?.nombre}</p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEtapaColor(tarea.etapa)}`}>
                              {tarea.etapa}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(tarea.estado)}`}>
                              {tarea.estado}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
                
                {tareasFiltradas.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No hay tareas disponibles</p>
                    <p className="text-xs mt-1">Selecciona una obra para ver las tareas</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Información de la asignación */}
          {tareaSeleccionada && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">Resumen de Asignación</h5>
              {(() => {
                const tarea = tareas.find(t => t.id === tareaSeleccionada);
                const obra = obras.find(o => o.id === tarea?.obraId);
                return tarea ? (
                  <div className="text-sm text-blue-800">
                    <p><span className="font-medium">Cuadrilla:</span> {cuadrillaSeleccionada.nombre}</p>
                    <p><span className="font-medium">Obra:</span> {obra?.nombre}</p>
                    <p><span className="font-medium">Tarea:</span> {tarea.nombre}</p>
                    <p><span className="font-medium">Etapa:</span> {tarea.etapa}</p>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={cerrarModalAsignacion}
            className="px-4 py-2 text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg font-medium transition-colors duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleAsignar}
            disabled={!tareaSeleccionada}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors duration-200"
          >
            Asignar Tarea
          </button>
        </div>
      </div>
    </div>
  );
}

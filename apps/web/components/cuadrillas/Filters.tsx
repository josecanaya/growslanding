'use client';

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { useCuadrillasStore } from '@/lib/store/cuadrillasStore';
import { Especialidad, EstadoCuadrilla } from '@/lib/types/cuadrillas';

export function Filters() {
  const { filtros, setFiltros } = useCuadrillasStore();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const especialidades: Especialidad[] = [
    'AlbaÃ±ilerÃ­a', 'YeserÃ­a', 'CarpinterÃ­a', 'Electricidad', 'PlomerÃ­a', 'Estructura', 'Pintura'
  ];

  const estados: EstadoCuadrilla[] = ['Activa', 'Sin asignaciones', 'Inactiva'];

  const handleBusquedaChange = (value: string) => {
    setFiltros({ busqueda: value || undefined });
  };

  const handleEspecialidadChange = (especialidad: Especialidad | '') => {
    setFiltros({ especialidad: especialidad || undefined });
  };

  const handleEstadoChange = (estado: EstadoCuadrilla | '') => {
    setFiltros({ estado: estado || undefined });
  };

  const clearFilters = () => {
    setFiltros({});
  };

  const hasActiveFilters = filtros.busqueda || filtros.especialidad || filtros.estado;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filtros y BÃºsqueda</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              showAdvanced 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span>Filtros</span>
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors duration-200"
            >
              <X className="h-4 w-4" />
              <span>Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* BÃºsqueda principal */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={filtros.busqueda || ''}
          onChange={(e) => handleBusquedaChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Buscar cuadrillas por nombre, encargado o especialidad..."
        />
      </div>

      {/* Filtros avanzados */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          {/* Filtro por especialidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Especialidad
            </label>
            <select
              value={filtros.especialidad || ''}
              onChange={(e) => handleEspecialidadChange(e.target.value as Especialidad)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas las especialidades</option>
              {especialidades.map((esp) => (
                <option key={esp} value={esp}>{esp}</option>
              ))}
            </select>
          </div>

          {/* Filtro por estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={filtros.estado || ''}
              onChange={(e) => handleEstadoChange(e.target.value as EstadoCuadrilla)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              {estados.map((estado) => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Filtros activos */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
          <span className="text-sm text-gray-600">Filtros activos:</span>
          {filtros.busqueda && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              Busqueda: {filtros.busqueda}
            </span>
          )}
          {filtros.especialidad && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              Especialidad: {filtros.especialidad}
            </span>
          )}
          {filtros.estado && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
              Estado: {filtros.estado}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

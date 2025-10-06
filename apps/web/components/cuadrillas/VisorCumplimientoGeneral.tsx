'use client';

import React from 'react';
import { useCuadrillasStore } from '@/lib/store/cuadrillasStore';
import { Cuadrilla, Especialidad } from '@/lib/types/cuadrillas';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  PieChart,
  Target,
  Calendar,
  Building2,
  Users
} from 'lucide-react';

interface VisorCumplimientoGeneralProps {
  onClose: () => void;
}

// Componente simple de gráfico de barras
const BarChart: React.FC<{ 
  data: Array<{ label: string; value: number; color: string }>;
  title: string;
}> = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-20 text-sm text-gray-600 truncate">{item.label}</div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-6">
                <div 
                  className={`h-6 rounded-full flex items-center justify-end pr-2 text-xs font-medium text-white`}
                  style={{ 
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color
                  }}
                >
                  {item.value}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente simple de gráfico donut
const DonutChart: React.FC<{
  data: Array<{ label: string; value: number; color: string }>;
  title: string;
  centerValue: string;
  centerLabel: string;
}> = ({ data, title, centerValue, centerLabel }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="flex items-center justify-center">
        <div className="relative w-48 h-48">
          {/* SVG del gráfico donut */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const startAngle = cumulativePercentage * 3.6; // 3.6 grados por porcentaje
              const endAngle = (cumulativePercentage + percentage) * 3.6;
              
              const x1 = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
              const y1 = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
              const x2 = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
              const y2 = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);
              
              const largeArcFlag = percentage > 50 ? 1 : 0;
              const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
              
              cumulativePercentage += percentage;
              
              return (
                <path
                  key={index}
                  d={pathData}
                  fill={item.color}
                  stroke="white"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
          
          {/* Texto central */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{centerValue}</span>
            <span className="text-sm text-gray-600">{centerLabel}</span>
          </div>
        </div>
      </div>
      
      {/* Leyenda */}
      <div className="mt-4 space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            ></div>
            <span className="text-sm text-gray-600">{item.label}</span>
            <span className="text-sm font-medium text-gray-900">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export function VisorCumplimientoGeneral({ onClose }: VisorCumplimientoGeneralProps) {
  const { cuadrillas } = useCuadrillasStore();

  // Calcular cumplimiento por cuadrilla
  const cumplimientoPorCuadrilla = cuadrillas.map(cuadrilla => ({
    label: cuadrilla.nombre,
    value: cuadrilla.cumplimientoTiempo,
    color: cuadrilla.cumplimientoTiempo >= 90 ? '#10B981' : 
           cuadrilla.cumplimientoTiempo >= 75 ? '#F59E0B' : '#EF4444'
  }));

  // Calcular cumplimiento por especialidad
  const especialidades: Especialidad[] = [
    'Albañilería / Estructura',
    'Yesería / Terminaciones',
    'Carpintería',
    'Plomería / Gas',
    'Electricidad',
    'Pintura'
  ];

  const cumplimientoPorEspecialidad = especialidades.map(especialidad => {
    const cuadrillasEspecialidad = cuadrillas.filter(c => c.especialidad === especialidad);
    const promedio = cuadrillasEspecialidad.length > 0 
      ? cuadrillasEspecialidad.reduce((sum, c) => sum + c.cumplimientoTiempo, 0) / cuadrillasEspecialidad.length
      : 0;
    
    return {
      label: especialidad,
      value: Math.round(promedio),
      color: promedio >= 90 ? '#10B981' : 
             promedio >= 75 ? '#F59E0B' : '#EF4444'
    };
  }).filter(item => item.value > 0);

  // Estadísticas generales
  const cumplimientoPromedio = cuadrillas.length > 0 
    ? Math.round(cuadrillas.reduce((sum, c) => sum + c.cumplimientoTiempo, 0) / cuadrillas.length)
    : 0;

  const cuadrillasExcelentes = cuadrillas.filter(c => c.cumplimientoTiempo >= 90).length;
  const cuadrillasBuenas = cuadrillas.filter(c => c.cumplimientoTiempo >= 75 && c.cumplimientoTiempo < 90).length;
  const cuadrillasRegulares = cuadrillas.filter(c => c.cumplimientoTiempo < 75).length;

  const distribucionCumplimiento = [
    { label: 'Excelente (≥90%)', value: cuadrillasExcelentes, color: '#10B981' },
    { label: 'Bueno (75-89%)', value: cuadrillasBuenas, color: '#F59E0B' },
    { label: 'Regular (<75%)', value: cuadrillasRegulares, color: '#EF4444' }
  ];

  // Histórico de obras (mock)
  const historicoObras = [
    { mes: 'Ene', obras: 8, cumplimiento: 85 },
    { mes: 'Feb', obras: 12, cumplimiento: 92 },
    { mes: 'Mar', obras: 15, cumplimiento: 88 },
    { mes: 'Abr', obras: 18, cumplimiento: 95 },
    { mes: 'May', obras: 14, cumplimiento: 90 },
    { mes: 'Jun', obras: 16, cumplimiento: 87 }
  ];

  return (
    <div className="absolute inset-0 bg-white z-40 overflow-y-auto">
      {/* Header fijo */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-4 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Cumplimiento General</h1>
            <p className="text-gray-600 mt-1">
              Análisis de rendimiento y métricas de cumplimiento
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-8">
        {/* KPIs principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-green-900">{cumplimientoPromedio}%</p>
                <p className="text-green-700">Cumplimiento Promedio</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-blue-900">{cuadrillasExcelentes}</p>
                <p className="text-blue-700">Cuadrillas Excelentes</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-yellow-900">{cuadrillasBuenas}</p>
                <p className="text-yellow-700">Cuadrillas Buenas</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 p-6 rounded-lg border border-red-200">
            <div className="flex items-center">
              <TrendingDown className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-red-900">{cuadrillasRegulares}</p>
                <p className="text-red-700">Necesitan Mejora</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gráfico donut - Distribución general */}
          <DonutChart
            data={distribucionCumplimiento}
            title="Distribución de Cumplimiento"
            centerValue={`${cumplimientoPromedio}%`}
            centerLabel="Promedio General"
          />

          {/* Gráfico de barras - Por especialidad */}
          <BarChart
            data={cumplimientoPorEspecialidad}
            title="Cumplimiento por Especialidad"
          />
        </div>

        {/* Gráficos secundarios */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gráfico de barras - Por cuadrilla */}
          <BarChart
            data={cumplimientoPorCuadrilla}
            title="Cumplimiento por Cuadrilla"
          />

          {/* Histórico de obras */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Obras</h3>
            <div className="space-y-4">
              {historicoObras.map((mes, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">{mes.mes}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{mes.obras} obras</p>
                      <p className="text-xs text-gray-500">Completadas</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${mes.cumplimiento >= 90 ? 'text-green-600' : mes.cumplimiento >= 75 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {mes.cumplimiento}%
                      </p>
                      <p className="text-xs text-gray-500">Cumplimiento</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabla de ranking de cuadrillas */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ranking de Cuadrillas por Cumplimiento</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Posición</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Cuadrilla</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Especialidad</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Encargado</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Obras</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Cumplimiento</th>
                </tr>
              </thead>
              <tbody>
                {cuadrillas
                  .sort((a, b) => b.cumplimientoTiempo - a.cumplimientoTiempo)
                  .map((cuadrilla, index) => (
                    <tr key={cuadrilla.id} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-amber-100 text-amber-800' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900">{cuadrilla.nombre}</td>
                      <td className="py-3 px-4 text-gray-600">{cuadrilla.especialidad}</td>
                      <td className="py-3 px-4 text-gray-600">{cuadrilla.encargado}</td>
                      <td className="py-3 px-4 text-gray-600">{cuadrilla.obrasParticipadas}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          cuadrilla.cumplimientoTiempo >= 90 ? 'bg-green-100 text-green-800' :
                          cuadrilla.cumplimientoTiempo >= 75 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {cuadrilla.cumplimientoTiempo}%
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

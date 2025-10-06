'use client';

import { useCuadrillasStore } from '@/lib/store/cuadrillasStore';
import { Users, CheckCircle, Clock, AlertTriangle, Info } from 'lucide-react';

interface TopStatsProps {
  onOpenVisor: (visorType: 'cuadrillas' | 'tareas' | 'cumplimiento' | 'alertas') => void;
}

export function TopStats({ onOpenVisor }: TopStatsProps) {
  const { cuadrillas } = useCuadrillasStore();

  // Calcular KPIs esenciales
  const totalCuadrillas = cuadrillas.length;
  const cuadrillasActivas = cuadrillas.filter(c => c.estado === 'Disponible' || c.estado === 'En obra').length;
  const totalTareasEnEjecucion = cuadrillas.reduce((sum, c) => sum + c.kpi.tareasEnEjecucion, 0);
  const totalTareasAsignadas = cuadrillas.reduce((sum, c) => sum + c.kpi.tareasAsignadas, 0);
  const totalTareasTerminadas = cuadrillas.reduce((sum, c) => sum + c.kpi.tareasTerminadas, 0);
  
  // Cumplimiento promedio general
  const cumplimientoPromedio = totalTareasAsignadas > 0 
    ? Math.round((totalTareasTerminadas / totalTareasAsignadas) * 100)
    : 0;

  // Riesgo laboral - alertas críticas
  const cuadrillasSinSeguro = cuadrillas.filter(c => 
    c.integrantes.some(i => !i.seguroVigente)
  ).length;
  const documentosVencidos = cuadrillas.reduce((sum, c) => 
    sum + c.documentos.filter(d => !d.vigente).length, 0
  );
  const totalAlertas = cuadrillasSinSeguro + documentosVencidos;

  const stats = [
    {
      title: 'Cuadrillas Activas',
      value: cuadrillasActivas,
      total: totalCuadrillas,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      subtitle: 'Disponibles y en obra',
      visorType: 'cuadrillas' as const
    },
    {
      title: 'Tareas en Ejecución',
      value: totalTareasEnEjecucion,
      icon: Clock,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      subtitle: 'Actualmente trabajando',
      visorType: 'tareas' as const
    },
    {
      title: 'Cumplimiento General',
      value: `${cumplimientoPromedio}%`,
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      subtitle: 'Promedio de entrega',
      visorType: 'cumplimiento' as const
    },
    {
      title: 'Alertas de Riesgo',
      value: totalAlertas,
      icon: AlertTriangle,
      color: totalAlertas > 0 ? 'bg-red-500' : 'bg-gray-500',
      bgColor: totalAlertas > 0 ? 'bg-red-50' : 'bg-gray-50',
      textColor: totalAlertas > 0 ? 'text-red-700' : 'text-gray-700',
      subtitle: 'Seguros y documentación',
      visorType: 'alertas' as const
    }
  ];

  return (
    <div className="space-y-4">
      {/* KPIs principales - simplificados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index} 
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all duration-200"
              onClick={() => onOpenVisor(stat.visorType)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.textColor}`} />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <div className="flex items-baseline">
                      <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                      {stat.total !== undefined && typeof stat.value === 'number' && (
                        <p className="ml-1 text-sm text-gray-500">/ {stat.total}</p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{stat.subtitle}</p>
                  </div>
                </div>
                {stat.title === 'Alertas de Riesgo' && totalAlertas > 0 && (
                  <div className="flex flex-col items-end">
                    {cuadrillasSinSeguro > 0 && (
                      <span className="text-xs text-red-600 mb-1">
                        {cuadrillasSinSeguro} sin seguro
                      </span>
                    )}
                    {documentosVencidos > 0 && (
                      <span className="text-xs text-red-600">
                        {documentosVencidos} docs vencidos
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Barra de progreso solo para cuadrillas activas */}
              {stat.title === 'Cuadrillas Activas' && stat.total !== undefined && stat.total > 0 && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.round((stat.value / stat.total) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Resumen ejecutivo simplificado */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-blue-600">{cumplimientoPromedio}%</span>
              <span className="text-blue-700 font-medium">cumplimiento general</span>
            </div>
            {totalAlertas > 0 && (
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-red-600 font-medium">{totalAlertas} alertas críticas</span>
              </div>
            )}
          </div>
          <button className="p-1 text-blue-500 hover:text-blue-700" title="Información sobre métricas">
            <Info className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
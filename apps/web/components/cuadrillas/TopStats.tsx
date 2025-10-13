'use client';

import { useCuadrillasStore } from '@/lib/store/cuadrillasStore';
import { Users, CheckCircle, Clock } from 'lucide-react';

interface TopStatsProps {
  onOpenVisor: (visorType: 'cuadrillas' | 'tareas' | 'cumplimiento') => void;
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

  const stats = [
    {
      title: 'Cuadrillas Activas',
      value: cuadrillasActivas,
      total: totalCuadrillas,
      icon: Users,
      iconText: '👷',
      color: '#1B263B',
      subtitle: 'Disponibles y en obra',
      visorType: 'cuadrillas' as const
    },
    {
      title: 'Tareas en Ejecución',
      value: totalTareasEnEjecucion,
      icon: Clock,
      iconText: '🕓',
      color: '#f4e27e',
      subtitle: 'Actualmente trabajando',
      visorType: 'tareas' as const
    },
    {
      title: 'Cumplimiento General',
      value: `${cumplimientoPromedio}%`,
      icon: CheckCircle,
      iconText: '✅',
      color: '#2ecc71',
      subtitle: 'Promedio de entrega',
      visorType: 'cumplimiento' as const
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {stats.map((stat, index) => {
        return (
          <div 
            key={index} 
            className="rounded-lg shadow-sm border p-5 cursor-pointer transition-all duration-200"
            style={{
              backgroundColor: '#ffffff',
              borderColor: '#dce3ea'
            }}
            onClick={() => onOpenVisor(stat.visorType)}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
              e.currentTarget.style.borderColor = '#c5cdd5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0,0,0,0.1)';
              e.currentTarget.style.borderColor = '#dce3ea';
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div 
                className="text-3xl w-12 h-12 flex items-center justify-center rounded-lg"
                style={{
                  backgroundColor: `${stat.color}15`,
                  border: `1px solid ${stat.color}40`
                }}
              >
                {stat.iconText}
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: '#5b5f6a' }}>
                {stat.title}
              </p>
              <div className="flex items-baseline mb-1">
                <p className="text-3xl font-bold" style={{ color: '#10161a' }}>
                  {stat.value}
                </p>
                {stat.total !== undefined && typeof stat.value === 'number' && (
                  <p className="ml-2 text-lg" style={{ color: '#9aa3af' }}>
                    / {stat.total}
                  </p>
                )}
              </div>
              <p className="text-xs" style={{ color: '#9aa3af' }}>
                {stat.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
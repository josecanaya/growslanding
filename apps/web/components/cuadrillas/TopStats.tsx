'use client';

import { useCuadrillasStore } from '@/lib/store/cuadrillasStore';
import { Users, CheckCircle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/grows';

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
      color: 'grows-primary',
      subtitle: 'Disponibles y en obra',
      visorType: 'cuadrillas' as const
    },
    {
      title: 'Tareas en Ejecución',
      value: totalTareasEnEjecucion,
      icon: Clock,
      color: 'grows-secondary',
      subtitle: 'Actualmente trabajando',
      visorType: 'tareas' as const
    },
    {
      title: 'Cumplimiento General',
      value: `${cumplimientoPromedio}%`,
      icon: CheckCircle,
      color: 'grows-primary',
      subtitle: 'Promedio de entrega',
      visorType: 'cumplimiento' as const
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {stats.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <Card
            key={stat.title}
            title={stat.title}
            onClick={() => onOpenVisor(stat.visorType)}
            className="cursor-pointer transition-all duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-grows-lg bg-grows-blue-light/10">
                  <IconComponent className="h-6 w-6 text-growsBlueLight" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-growsBlue">
                    {stat.value}
                    {stat.total && (
                      <span className="text-sm text-growsTextMuted font-normal">
                        /{stat.total}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-growsTextMuted">
                    {stat.subtitle}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
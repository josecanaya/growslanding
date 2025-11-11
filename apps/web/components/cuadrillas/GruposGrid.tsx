'use client';

import { useState } from 'react';
import { Especialidad } from '@/lib/types/cuadrillas';
import { useCuadrillasStore } from '@/lib/store/cuadrillasStore';
import { AlertCircle, CheckCircle, Hammer, PaintRoller, Ruler, Wrench, Zap, Paintbrush, User, BarChart, Users, Award, Edit, ClipboardList } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui/grows';

const especialidades: Especialidad[] = [
  'Albañilería / Estructura',
  'Yesería / Terminaciones', 
  'Carpintería',
  'Plomería / Gas',
  'Electricidad',
  'Pintura'
];

interface GrupoCardProps {
  especialidad: Especialidad;
  totalCuadrillas: number;
  disponibles: number;
  tareasActivas: number;
  alertas: number;
  onDoubleClick: () => void;
}

function GrupoCard({ especialidad, totalCuadrillas, disponibles, tareasActivas, alertas, onDoubleClick }: GrupoCardProps) {
  const getEspecialidadIcon = (especialidad: string) => {
    const iconos = {
      'Albañilería / Estructura': Hammer,
      'Yesería / Terminaciones': PaintRoller,
      'Carpintería': Ruler,
      'Plomería / Gas': Wrench,
      'Electricidad': Zap,
      'Pintura': Paintbrush
    };
    return iconos[especialidad as keyof typeof iconos] || Hammer;
  };

  const getEstadoVariant = () => {
    if (totalCuadrillas === 0) return 'default';
    if (disponibles === 0) return 'error';
    if (disponibles === totalCuadrillas) return 'success';
    return 'warning';
  };

  const getEstadoLabel = () => {
    if (totalCuadrillas === 0) return 'Sin cuadrillas';
    if (disponibles === 0) return 'Todas ocupadas';
    if (disponibles === totalCuadrillas) return 'Todas disponibles';
    return 'Parcialmente disponible';
  };

  const estado = getEstadoLabel();
  const IconComponent = getEspecialidadIcon(especialidad);
  const isInactive = totalCuadrillas === 0;

  return (
    <Card
      title={especialidad}
      subtitle={`${totalCuadrillas} cuadrilla${totalCuadrillas !== 1 ? 's' : ''} - ${disponibles} disponible${disponibles !== 1 ? 's' : ''}`}
      icon={<IconComponent className="h-6 w-6" />}
      onClick={onDoubleClick}
      className={`cursor-pointer transition-all duration-200 ${isInactive ? 'opacity-60' : 'hover:shadow-grows-md'}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Badge variant={getEstadoVariant()}>
            {estado}
          </Badge>
          {alertas > 0 && (
            <Badge variant="error">
              {alertas} alerta{alertas !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <div className="text-right">
          <div className="text-sm text-grows-text-secondary">
            {tareasActivas} tarea{tareasActivas !== 1 ? 's' : ''} activa{tareasActivas !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="ghost" size="sm">
          Click para ver
        </Button>
      </div>
    </Card>
  );
}

interface DetalleGrupoProps {
  especialidad: Especialidad;
  cuadrillas: any[];
  onBack: () => void;
}

function DetalleGrupo({ especialidad, cuadrillas, onBack }: DetalleGrupoProps) {
  const getEspecialidadIcon = (especialidad: string) => {
    const iconos = {
      'Albañilería / Estructura': Hammer,
      'Yesería / Terminaciones': PaintRoller,
      'Carpintería': Ruler,
      'Plomería / Gas': Wrench,
      'Electricidad': Zap,
      'Pintura': Paintbrush
    };
    return iconos[especialidad as keyof typeof iconos] || Hammer;
  };

  const IconComponent = getEspecialidadIcon(especialidad);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-grows-secondary/10 rounded-grows-lg">
              <IconComponent className="h-6 w-6 text-grows-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-grows-primary">{especialidad}</h2>
              <p className="text-grows-text-secondary">
                {cuadrillas.length} cuadrilla{cuadrillas.length !== 1 ? 's' : ''} en esta especialidad
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={onBack}>
            ← Volver
          </Button>
        </div>
      </Card>

      {/* Lista de cuadrillas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cuadrillas.map((cuadrilla) => (
          <Card
            key={cuadrilla.id}
            title={cuadrilla.nombre}
            subtitle={`Encargado: ${cuadrilla.encargado}`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-grows-text-secondary">Estado:</span>
                <span className="font-medium text-grows-primary">
                  {cuadrilla.estado ?? 'Sin estado'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-grows-text-secondary">Integrantes:</span>
                <span className="font-medium text-grows-primary">{cuadrilla.integrantes?.length || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-grows-text-secondary">Tareas activas:</span>
                <span className="font-medium text-grows-primary">{cuadrilla.kpi?.tareasEnEjecucion || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-grows-text-secondary">Cumplimiento:</span>
                <span className="font-medium text-grows-primary">
                  {cuadrilla.kpi?.cumplimientoPct || 0}%
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function GruposGrid() {
  const { cuadrillas, setFiltros } = useCuadrillasStore();
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<Especialidad | null>(null);

  const handleOpenGrupo = (especialidad: Especialidad) => {
    setGrupoSeleccionado(especialidad);
    setFiltros({ especialidad });
  };

  const handleBack = () => {
    setGrupoSeleccionado(null);
    setFiltros({ especialidad: undefined });
  };

  // Calcular estadísticas por especialidad
  const getEstadisticasGrupo = (especialidad: Especialidad) => {
    const cuadrillasGrupo = cuadrillas.filter(c => c.especialidad === especialidad);
    const disponibles = cuadrillasGrupo.filter(c => 
      c.estado === 'Disponible' || c.estado.toLowerCase() === 'disponible'
    ).length;
    
    // Calcular tareas activas desde los KPIs reales
    const tareasActivas = cuadrillasGrupo.reduce((sum, c) => {
      return sum + (c.kpi?.tareasEnEjecucion || 0);
    }, 0);
    
    // Calcular alertas (cuadrillas inactivas o con problemas)
    const alertas = cuadrillasGrupo.filter(c => {
      return c.estado === 'Inactiva' || c.estado.toLowerCase() === 'inactiva' || 
             (!c.telefonoEncargado && !c.emailEncargado); // Datos incompletos
    }).length;

    return {
      totalCuadrillas: cuadrillasGrupo.length,
      disponibles,
      tareasActivas,
      alertas
    };
  };

  // Si hay un grupo seleccionado, mostrar la vista de detalle
  if (grupoSeleccionado) {
    const cuadrillasGrupo = cuadrillas.filter(c => c.especialidad === grupoSeleccionado);
    
    return (
      <DetalleGrupo
        especialidad={grupoSeleccionado}
        cuadrillas={cuadrillasGrupo}
        onBack={handleBack}
      />
    );
  }

  // Vista de grid principal
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {especialidades.map((especialidad) => {
        const stats = getEstadisticasGrupo(especialidad);

        return (
          <GrupoCard
            key={especialidad}
            especialidad={especialidad}
            totalCuadrillas={stats.totalCuadrillas}
            disponibles={stats.disponibles}
            tareasActivas={stats.tareasActivas}
            alertas={stats.alertas}
            onDoubleClick={() => handleOpenGrupo(especialidad)}
          />
        );
      })}
    </div>
  );
}

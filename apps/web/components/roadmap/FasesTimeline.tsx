'use client';

import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { FASES, calcularProgresoFase, getEstadoFase } from '@/lib/roadmap/fases';
import { Objective } from '@/lib/roadmap/types';

interface FasesTimelineProps {
  objetivos: Objective[];
}

export function FasesTimeline({ objetivos }: FasesTimelineProps) {
  const progresoGeneral = Math.round(
    FASES.reduce((sum, fase) => sum + calcularProgresoFase(fase.id, objetivos), 0) / FASES.length
  );

  return (
    <div className="bg-white rounded-lg border p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">📅 Timeline de Fases del MVP</h3>
        <Badge variant="outline" className="text-sm">
          Progreso General: {progresoGeneral}%
        </Badge>
      </div>
      
      <div className="space-y-3">
        {FASES.map((fase) => {
          const progreso = calcularProgresoFase(fase.id, objetivos);
          const estado = getEstadoFase(fase.id, objetivos);
          const objetivosFase = objetivos.filter(obj => fase.objetivos.includes(obj.id));
          
          return (
            <div key={fase.id} className="flex items-center gap-4">
              {/* Indicador de fase */}
              <div className="flex items-center gap-2 min-w-[200px]">
                <div 
                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: fase.color }}
                />
                <span className="text-sm font-medium">{fase.id}.</span>
                <span className="text-sm">{fase.nombre}</span>
              </div>
              
              {/* Barra de progreso */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Progress 
                    value={progreso} 
                    className="flex-1 h-2"
                  />
                  <span className="text-xs text-gray-600 min-w-[40px]">
                    {progreso}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{objetivosFase.length} objetivos</span>
                  <Badge 
                    variant={estado === 'COMPLETO' ? 'default' : estado === 'EN_CURSO' ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {estado}
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Progreso general */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progreso General del MVP</span>
          <span className="text-sm text-gray-600">{progresoGeneral}%</span>
        </div>
        <Progress value={progresoGeneral} className="h-3" />
      </div>
    </div>
  );
}

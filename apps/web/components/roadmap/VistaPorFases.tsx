'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { FASES } from '@/lib/roadmap/fases';
import { Objective, getObjectiveStats } from '@/lib/roadmap/types';
import { SimpleObjectiveModal } from './SimpleObjectiveModal';

interface VistaPorFasesProps {
  objetivos: Objective[];
  onObjectiveClick: (objective: Objective) => void;
  onToggleTask: (objectiveId: string, taskId: string) => void;
  useDatabase: boolean;
}

export function VistaPorFases({ 
  objetivos, 
  onObjectiveClick, 
  onToggleTask, 
  useDatabase 
}: VistaPorFasesProps) {
  const [openFases, setOpenFases] = useState<number[]>([1, 2]); // Fases 1 y 2 abiertas por defecto

  const toggleFase = (faseId: number) => {
    setOpenFases(prev => 
      prev.includes(faseId) 
        ? prev.filter(id => id !== faseId)
        : [...prev, faseId]
    );
  };

  const normalizeObjectiveStatus = (objective: Objective): 'COMPLETO' | 'EN_CURSO' | 'PENDIENTE' => {
    const rawStatus = (objective.status ?? (objective as unknown as { estado?: string }).estado ?? '')
      .toString()
      .toUpperCase();

    if (rawStatus.includes('COMPLE')) {
      return 'COMPLETO';
    }

    if (rawStatus.includes('CUR') || rawStatus.includes('REV')) {
      return 'EN_CURSO';
    }

    const stats = getObjectiveStats(objective);
    if (stats.progress >= 100) {
      return 'COMPLETO';
    }

    if (stats.progress > 0) {
      return 'EN_CURSO';
    }

    return 'PENDIENTE';
  };

  return (
    <div className="space-y-6">
      {FASES.map((fase) => {
        const objetivosFase = objetivos.filter(obj => fase.objetivos.includes(obj.id));
        const objetivosEnFase = objetivosFase.map((objetivo) => ({
          objetivo,
          stats: getObjectiveStats(objetivo),
          status: normalizeObjectiveStatus(objetivo),
        }));

        const progreso = objetivosEnFase.length
          ? Math.round(
              objetivosEnFase.reduce((sum, entry) => sum + entry.stats.progress, 0) /
              objetivosEnFase.length
            )
          : 0;

        const estado =
          progreso >= 100
            ? 'COMPLETO'
            : progreso > 0 || objetivosEnFase.some(entry => entry.status === 'EN_CURSO')
              ? 'EN_CURSO'
              : 'PENDIENTE';

        console.log(`[roadmap:fases] Fase ${fase.id} (${fase.nombre})`, {
          objetivosFase: objetivosEnFase.length,
          progreso,
          estado,
          objetivos: objetivosEnFase.map(entry => ({
            id: entry.objetivo.id,
            status: entry.status,
            progreso: entry.stats.progress,
          })),
        });
        const isOpen = openFases.includes(fase.id);
        
        return (
          <Card 
            key={fase.id} 
            className="border border-[#e0e3eb] shadow-sm bg-white/90 backdrop-blur-sm"
            style={{ borderLeft: `4px solid ${fase.color}` }}
          >
            <Collapsible open={isOpen} onOpenChange={() => toggleFase(fase.id)}>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-[#f8f9fc] transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: fase.color }}
                      />
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                      <div>
                        <CardTitle className="text-lg">
                          FASE {fase.id} – {fase.nombre}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {fase.descripcion}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-medium">{progreso}%</div>
                        <Progress value={progreso} className="w-20 h-2 mt-1" />
                      </div>
                      <Badge 
                        variant={estado === 'COMPLETO' ? 'default' : estado === 'EN_CURSO' ? 'secondary' : 'outline'}
                        className="min-w-[100px]"
                      >
                        {estado}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {objetivosEnFase.map(({ objetivo, stats, status }) => {
                      const totalTareas = stats.total;
                      const tareasCompletadas = stats.completed;
                      const progresoObjetivo = stats.progress;
                      
                      return (
                        <Card 
                          key={objetivo.id}
                          className="cursor-pointer bg-white border border-[#e0e3eb] hover:border-[#cfd6e0] hover:shadow-md transition-all"
                          onClick={() => onObjectiveClick(objetivo)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-sm font-medium line-clamp-2">
                                  {objetivo.title}
                                </CardTitle>
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {objetivo.description}
                                </p>
                              </div>
                              <Badge 
                                variant={status === 'COMPLETO' ? 'default' : status === 'EN_CURSO' ? 'secondary' : 'outline'}
                                className="ml-2 text-xs"
                              >
                                {status}
                              </Badge>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="pt-0">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span>Tareas</span>
                                <span>{tareasCompletadas}/{totalTareas}</span>
                              </div>
                              <Progress value={progresoObjetivo} className="h-2" />
                              <div className="flex items-center justify-between text-xs text-gray-600">
                                <span>Progreso</span>
                                <span>{progresoObjetivo}%</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  
                  {objetivosFase.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No hay objetivos asignados a esta fase.</p>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}
    </div>
  );
}

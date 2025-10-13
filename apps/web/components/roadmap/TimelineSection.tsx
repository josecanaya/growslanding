'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Objective, 
  getAllTasksFromObjective,
  getObjectiveStats,
} from '@/lib/roadmap/types';

interface TimelineSectionProps {
  objectives: Objective[];
  onObjectiveClick: (objective: Objective) => void;
  viewMode: 'vertical' | 'horizontal';
}

export function TimelineSection({ objectives, onObjectiveClick, viewMode }: TimelineSectionProps) {
  const [expandedObjective, setExpandedObjective] = useState<string | null>(null);

  const sortedObjectives = [...objectives].sort((a, b) => {
    const aWeek = a.startWeek || 0;
    const bWeek = b.startWeek || 0;
    return aWeek - bWeek;
  });

  // Usar la función oficial del sistema
  const getStats = (objective: Objective) => {
    return getObjectiveStats(objective);
  };

  const getStatusBadgeColor = (progress: number) => {
    if (progress === 100) return 'text-white bg-[#4ade80]';
    if (progress >= 70) return 'text-white bg-[#6c63ff]';
    if (progress >= 30) return 'text-white bg-[#6c63ff]';
    return 'text-white bg-[#3B82F6]';
  };

  if (viewMode === 'horizontal') {
    return (
      <div className="bg-white border border-[#e0e3eb] rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold mb-4 text-[#1b263b]">
          Timeline Cronológico del MVP
        </h3>
        
        <div className="flex overflow-x-auto gap-6 snap-x snap-mandatory pb-4">
          {sortedObjectives.map((objective, index) => {
            const stats = getStats(objective);
            const allTasks = getAllTasksFromObjective(objective);
            const isExpanded = expandedObjective === objective.id;
            
            return (
              <div key={objective.id} className="min-w-[320px] snap-start flex-shrink-0">
                <div 
                  className={`bg-white border border-[#e0e3eb] cursor-pointer hover:shadow-md transition-all duration-300 border-l-4 rounded-xl p-4 ${
                    stats.progress === 100 ? 'border-l-[#4ade80]' :
                    stats.progress >= 70 ? 'border-l-[#6c63ff]' :
                    stats.progress >= 30 ? 'border-l-[#6c63ff]' :
                    'border-l-[#3B82F6]'
                  }`}
                  onClick={() => onObjectiveClick(objective)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {stats.progress === 100 ? '✅' : 
                         stats.progress >= 70 ? '🟣' : 
                         stats.progress >= 30 ? '🔵' : '🟡'}
                      </span>
                      <div>
                        <h4 className="font-semibold text-[#1b263b] text-lg">
                          {objective.title}
                        </h4>
                        <p className="text-sm text-[#8c8fa3]">
                          {objective.startWeek && objective.endWeek 
                            ? `🗓️ Semana ${objective.startWeek}-${objective.endWeek}`
                            : `📅 Etapa ${index + 1} del MVP`
                          }
                        </p>
                      </div>
                    </div>
                    <div className={`text-sm font-medium px-3 py-1 rounded-lg ${getStatusBadgeColor(stats.progress)}`}>
                      {stats.progress}% completado
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[#8c8fa3]">Progreso de la etapa</span>
                      <span className="font-medium text-[#1b263b]">{stats.completed}/{stats.total} tareas completadas</span>
                    </div>
                    <div className="h-3 rounded-full bg-[#e0e3eb]">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${
                          stats.progress === 100 ? 'bg-[#4ade80]' : 
                          stats.progress >= 70 ? 'bg-[#6c63ff]' : 
                          stats.progress >= 30 ? 'bg-[#6c63ff]' : 'bg-[#3B82F6]'
                        }`}
                        style={{ width: `${stats.progress}%` }}
                      />
                    </div>

                    <p className="text-sm text-[#8c8fa3] mb-3 line-clamp-2">
                      {objective.description}
                    </p>

                    {allTasks.length > 0 && (
                      <div className="space-y-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedObjective(isExpanded ? null : objective.id);
                          }}
                        >
                          {isExpanded ? '🔼 Ocultar tareas' : `📋 Ver ${allTasks.length} tareas`}
                        </Button>
                        
                        {isExpanded && (
                          <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                            {allTasks.slice(0, 5).map((task) => (
                              <div 
                                key={task.id}
                                className="flex items-center gap-2 text-xs p-2 bg-slate-50 dark:bg-slate-700 rounded"
                              >
                                <span className={task.done ? 'text-green-500' : 'text-slate-400'}>
                                  {task.done ? '✅' : '⏳'}
                                </span>
                                <span className={`flex-1 ${task.done ? 'line-through text-slate-500' : ''}`}>
                                  {task.text}
                                </span>
                              </div>
                            ))}
                            {allTasks.length > 5 && (
                              <div className="text-xs text-slate-500 text-center">
                                +{allTasks.length - 5} tareas más...
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#e0e3eb] rounded-xl shadow-sm p-6">
      <h3 className="text-xl font-semibold mb-6 text-[#1b263b]">
        📅 Timeline Cronológico del MVP
      </h3>
      
      <div className="space-y-6">
        {sortedObjectives.map((objective, index) => {
          const stats = getStats(objective);
          const allTasks = getAllTasksFromObjective(objective);
          const isExpanded = expandedObjective === objective.id;
          
          return (
            <div key={objective.id} className="relative">
              {index < sortedObjectives.length - 1 && (
                <div className="absolute left-6 top-16 w-0.5 h-16 bg-[#e0e3eb]"></div>
              )}
              
              <div className="flex gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  stats.progress === 100 ? 'bg-[#4ade80]' :
                  stats.progress >= 70 ? 'bg-[#6c63ff]' :
                  stats.progress >= 30 ? 'bg-[#6c63ff]' :
                  'bg-[#3B82F6]'
                }`}>
                  {index + 1}
                </div>
                
                <div 
                  className={`flex-1 bg-white border border-[#e0e3eb] rounded-xl p-4 cursor-pointer hover:shadow-md transition-all ${
                    stats.progress === 100 ? 'border-l-4 border-l-[#4ade80]' :
                    stats.progress >= 70 ? 'border-l-4 border-l-[#6c63ff]' :
                    stats.progress >= 30 ? 'border-l-4 border-l-[#6c63ff]' :
                    'border-l-4 border-l-[#3B82F6]'
                  }`}
                  onClick={() => onObjectiveClick(objective)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-[#1b263b] text-lg">{objective.title}</h4>
                    <div className={`text-sm font-medium px-3 py-1 rounded-lg ${getStatusBadgeColor(stats.progress)}`}>
                      {stats.progress}%
                    </div>
                  </div>
                  
                  <p className="text-[#8c8fa3] text-sm mb-3">{objective.description}</p>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[#8c8fa3]">Progreso</span>
                      <span className="font-medium text-[#1b263b]">{stats.completed}/{stats.total} tareas</span>
                    </div>
                    <div className="h-2 rounded-full bg-[#e0e3eb]">
                      <div 
                        className={`h-2 rounded-full transition-all duration-500 ${
                          stats.progress === 100 ? 'bg-[#4ade80]' : 
                          stats.progress >= 70 ? 'bg-[#6c63ff]' : 
                          stats.progress >= 30 ? 'bg-[#6c63ff]' : 'bg-[#3B82F6]'
                        }`}
                        style={{ width: `${stats.progress}%` }}
                      />
                    </div>
                  </div>

                  {allTasks.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedObjective(isExpanded ? null : objective.id);
                      }}
                    >
                      {isExpanded ? '🔼 Ocultar tareas' : `📋 Ver ${allTasks.length} tareas`}
                    </Button>
                  )}
                  
                  {isExpanded && allTasks.length > 0 && (
                    <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                      {allTasks.map((task) => (
                        <div 
                          key={task.id}
                          className="flex items-center gap-2 text-xs p-2 bg-[#f8f9fc] rounded-lg"
                        >
                          <span className={task.done ? 'text-[#4ade80]' : 'text-[#8c8fa3]'}>
                            {task.done ? '✅' : '⏳'}
                          </span>
                          <span className={`flex-1 ${task.done ? 'line-through text-[#8c8fa3]' : 'text-[#1b263b]'}`}>
                            {task.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

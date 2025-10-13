'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  ProjectRoadmap,
  Objective,
  Priority,
  ViewMode,
  calculateProjectProgress,
  getTotalTasks,
  getObjectiveStats,
  getProjectTimeStats,
  migrateObjectiveToV2,
  getAllTasksFromObjective,
} from '@/lib/roadmap/types';
import { SimpleObjectiveModal } from '@/components/roadmap/SimpleObjectiveModal';
import { TimelineSection } from '@/components/roadmap/TimelineSection';
import { CacheBuster } from '@/components/roadmap/CacheBuster';
import { ColorVerifier } from '@/components/roadmap/ColorVerifier';
import { FormObjetivo } from '@/components/roadmap/FormObjetivo';
import { ViewModeSelector } from '@/components/roadmap/ViewModeSelector';
import { VistaPorFases } from '@/components/roadmap/VistaPorFases';
import { FasesTimeline } from '@/components/roadmap/FasesTimeline';
import { colorClasses, getProgressClasses, getStatusColor } from '@/lib/roadmap/colors';
import initialData from '@/data/roadmap.initial.json';

export default function RoadmapEditorPage() {
  const [currentProjectName, setCurrentProjectName] = useState<string>('GROWS');
  const [roadmap, setRoadmap] = useState<ProjectRoadmap | null>(null);
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [timelineOrientation, setTimelineOrientation] = useState<'vertical' | 'horizontal'>('vertical');
  
  // Estados para formularios CRUD
  const [isFormObjetivoOpen, setIsFormObjetivoOpen] = useState(false);
  const [objetivoToEdit, setObjetivoToEdit] = useState<Objective | null>(null);
  const [useDatabase, setUseDatabase] = useState(false); // Toggle para usar DB o localStorage

  // Load project from localStorage or DB
  useEffect(() => {
    if (useDatabase) {
      loadFromDatabase();
    } else {
      loadProject(currentProjectName);
    }
  }, [currentProjectName, useDatabase]);

  // Auto-save on roadmap changes
  useEffect(() => {
    if (roadmap) {
      saveToLocalStorage(roadmap);
    }
  }, [roadmap]);

  function loadProject(projectName: string) {
    const storageKey = `roadmap:${projectName}:v3`;
    const legacyKeyV2 = `roadmap:${projectName}:v2`;
    
    // Try to load v3 first
    const storedV3 = localStorage.getItem(storageKey);
    if (storedV3) {
      try {
        const parsed = JSON.parse(storedV3) as ProjectRoadmap;
        setRoadmap(parsed);
        return;
      } catch (error) {
        console.error('Error parsing stored roadmap v3:', error);
      }
    }
    
    // Try to migrate from v2
    const storedV2 = localStorage.getItem(legacyKeyV2);
    if (storedV2) {
      try {
        const parsed = JSON.parse(storedV2) as ProjectRoadmap;
        const migrated: ProjectRoadmap = {
          ...parsed,
          objectives: parsed.objectives.map(migrateObjectiveToV2),
        };
        setRoadmap(migrated);
        localStorage.setItem(storageKey, JSON.stringify(migrated));
        return;
      } catch (error) {
        console.error('Error migrating roadmap:', error);
      }
    }
    
    // Load from seed
    loadFromSeed(projectName);
  }

  function loadFromSeed(projectName: string) {
    const seedData = (initialData as any).projects.find(
      (p: ProjectRoadmap) => p.projectName === projectName
    );
    
    if (seedData) {
      const roadmapData: ProjectRoadmap = {
        ...seedData,
        updatedAt: new Date().toISOString(),
        objectives: seedData.objectives.map(migrateObjectiveToV2),
      };
      setRoadmap(roadmapData);
    }
  }

  function saveToLocalStorage(data: ProjectRoadmap) {
    const storageKey = `roadmap:${data.projectName}:v3`;
    localStorage.setItem(storageKey, JSON.stringify(data));
  }

  // Cargar objetivos desde la base de datos
  async function loadFromDatabase() {
    try {
      const response = await fetch('/api/roadmap/objetivos');
      if (!response.ok) throw new Error('Error al cargar objetivos');
      
      const objetivos = await response.json();
      
      // Convertir formato DB a formato Roadmap
      const roadmapData: ProjectRoadmap = {
        projectName: currentProjectName,
        version: '3.0',
        updatedAt: new Date().toISOString(),
        objectives: objetivos.map(mapDbToObjective),
      };
      
      setRoadmap(roadmapData);
    } catch (error) {
      console.error('Error al cargar desde DB:', error);
      // Fallback a localStorage
      loadProject(currentProjectName);
    }
  }

  // Mapear objeto de DB a formato Objective
  function mapDbToObjective(dbObj: any): Objective {
    return {
      id: dbObj.id,
      title: dbObj.titulo,
      description: dbObj.descripcion,
      priority: dbObj.prioridad,
      status: dbObj.estado,
      targetWeeks: dbObj.targetWeeks,
      startWeek: dbObj.startWeek,
      endWeek: dbObj.endWeek,
      dueDate: dbObj.dueDate,
      collapsed: dbObj.collapsed,
      tasks: dbObj.tareas?.filter((t: any) => !t.grupoId).map((t: any) => ({
        id: t.id,
        text: t.texto,
        description: t.descripcion,
        done: t.done,
        status: t.estado,
        estimateHrs: t.estimateHrs,
        responsable: t.responsable,
      })) || [],
      taskGroups: dbObj.gruposTareas?.map((g: any) => ({
        id: g.id,
        title: g.titulo,
        description: g.descripcion,
        tasks: g.tareas?.map((t: any) => ({
          id: t.id,
          text: t.texto,
          description: t.descripcion,
          done: t.done,
          status: t.estado,
          estimateHrs: t.estimateHrs,
          responsable: t.responsable,
        })) || [],
      })) || [],
    };
  }

  // Recargar datos después de operaciones CRUD
  async function refetchData() {
    if (useDatabase) {
      await loadFromDatabase();
    } else {
      loadProject(currentProjectName);
    }
  }

  // Crear nuevo objetivo
  function handleCrearObjetivo() {
    setObjetivoToEdit(null);
    setIsFormObjetivoOpen(true);
  }

  // Eliminar objetivo
  async function handleEliminarObjetivo(id: string) {
    if (!confirm('¿Estás seguro de eliminar este objetivo y todas sus tareas?')) {
      return;
    }

    try {
      if (useDatabase) {
        const response = await fetch(`/api/roadmap/objetivos?id=${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Error al eliminar');
        await refetchData();
      } else {
        // Eliminar de localStorage
        if (!roadmap) return;
        const updated: ProjectRoadmap = {
          ...roadmap,
          objectives: roadmap.objectives.filter(obj => obj.id !== id),
          updatedAt: new Date().toISOString(),
        };
        setRoadmap(updated);
      }
    } catch (error) {
      console.error('Error al eliminar objetivo:', error);
      alert('Error al eliminar el objetivo');
    }
  }

  function handleObjectiveClick(objective: Objective) {
    console.log('Clicking objective:', objective.title);
    setSelectedObjective(objective);
    setIsEditorOpen(true);
  }

  async function handleObjectiveSave(updatedObjective: Objective) {
    if (!roadmap) return;
    
    if (useDatabase) {
      // Guardar en DB
      try {
        // Actualizar todas las tareas modificadas
        const allTasks = getAllTasksFromObjective(updatedObjective);
        for (const task of allTasks) {
          await fetch('/api/roadmap/tareas', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: task.id,
              texto: task.text,
              estado: task.status,
              done: task.done,
            }),
          });
        }
        
        // Recargar datos
        await refetchData();
      } catch (error) {
        console.error('Error al guardar en DB:', error);
        alert('Error al guardar los cambios');
      }
    } else {
      // Guardar en localStorage
      const updated: ProjectRoadmap = {
        ...roadmap,
        updatedAt: new Date().toISOString(),
        objectives: roadmap.objectives.map(obj =>
          obj.id === updatedObjective.id ? updatedObjective : obj
        ),
      };
      
      setRoadmap(updated);
    }
  }

  function handleExportJSON() {
    if (!roadmap) return;
    
    const dataStr = JSON.stringify(roadmap, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `roadmap-${roadmap.projectName}-v3-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleImportJSON() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const imported = JSON.parse(event.target?.result as string) as ProjectRoadmap;
            setRoadmap(imported);
          } catch (error) {
            console.error('Error importing roadmap:', error);
            alert('Error al importar el archivo. Verifica que sea un JSON válido.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  if (!roadmap) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-8 h-8 bg-blue-500 rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Cargando roadmap...</p>
        </div>
      </div>
    );
  }

  const projectProgress = calculateProjectProgress(roadmap);
  const { total: totalTasks, done: doneTasks } = getTotalTasks(roadmap);
  const timeStats = getProjectTimeStats(roadmap);

  const priorityConfig: Record<Priority, { color: string; bgColor: string }> = {
    ALTA: { color: 'text-petrol-600 dark:text-petrol-400', bgColor: 'bg-petrol-50 dark:bg-petrol-900/20' },
    MEDIA: { color: 'text-violet-600 dark:text-violet-400', bgColor: 'bg-violet-50 dark:bg-violet-900/20' },
    BAJA: { color: 'text-gold-600 dark:text-gold-400', bgColor: 'bg-gold-50 dark:bg-gold-900/20' },
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] font-['Inter',sans-serif] transition-all duration-300">
      <style jsx global>{`
        /* 🎨 SISTEMA DE COLORES CORPORATIVOS GROWS */
        *[style*="rgb(255, 255, 0)"],
        *[style*="yellow"] {
          background-color: #facc15 !important;
          color: #1b263b !important;
        }
        
        div[style*="rgb(255, 255, 0)"] {
          background-color: #ffffff !important;
        }
        
        button[style*="rgb(255, 255, 0)"] {
          background-color: #6c63ff !important;
          color: #ffffff !important;
        }
        
        /* Colores corporativos para el roadmap */
        .roadmap-card {
          background-color: #ffffff !important;
          border-color: #e0e3eb !important;
          border-radius: 0.75rem !important;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06) !important;
        }
        
        .roadmap-card:hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
        }
        
        .roadmap-progress-high {
          background-color: #4ade80 !important;
        }
        
        .roadmap-progress-medium {
          background-color: #6c63ff !important;
        }
        
        .roadmap-progress-low {
          background-color: #6c63ff !important;
        }
        
        .roadmap-progress-pending {
          background-color: #facc15 !important;
        }
      `}</style>
      <CacheBuster />
      <ColorVerifier />
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-[#e0e3eb] sticky top-0 z-30">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1b263b]">
                Roadmap Editor Interactivo
              </h1>
              <p className="text-[#6c63ff] font-medium mt-1 text-sm">
                Modo Construcción MVP • Proyecto: {roadmap.projectName}
              </p>
            </div>
            
            <div className="flex gap-3 flex-wrap items-center">
              {/* Botón Crear Objetivo */}
              <Button
                className="bg-[#6c63ff] hover:bg-[#5850ec] text-white font-medium px-4 py-2 rounded-lg"
                onClick={handleCrearObjetivo}
              >
                ➕ Nuevo Objetivo
              </Button>

              {/* Toggle DB / LocalStorage */}
              <div className="flex items-center gap-2 px-3 py-2 bg-[#f8f9fc] border border-[#e0e3eb] rounded-lg">
                <input
                  type="checkbox"
                  checked={useDatabase}
                  onChange={(e) => setUseDatabase(e.target.checked)}
                  className="w-4 h-4 text-[#6c63ff] border-gray-300 rounded focus:ring-[#6c63ff]"
                />
                <span className="text-xs text-[#1b263b] font-medium">
                  {useDatabase ? '💾 DB' : '📦 Local'}
                </span>
              </div>

              <select
                value={currentProjectName}
                onChange={(e) => setCurrentProjectName(e.target.value)}
                className="px-4 py-2 border border-[#e0e3eb] rounded-lg bg-white text-sm text-[#1b263b] focus:ring-2 focus:ring-[#6c63ff] focus:border-[#6c63ff]"
              >
                <option value="GROWS">GROWS</option>
                <option value="OTRO_MVP">OTRO_MVP</option>
              </select>
              
              <ViewModeSelector 
                currentMode={viewMode} 
                onModeChange={setViewMode} 
              />

              {viewMode === 'timeline' && (
                <>
                  <Button
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      timelineOrientation === 'horizontal' 
                        ? 'bg-[#6c63ff] hover:bg-[#5850ec] text-white' 
                        : 'bg-white border border-[#e0e3eb] text-[#1b263b] hover:bg-[#f8f9fc]'
                    }`}
                    size="sm"
                    onClick={() => setTimelineOrientation('horizontal')}
                  >
                    Horizontal
                  </Button>
                  <Button
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      timelineOrientation === 'vertical' 
                        ? 'bg-[#6c63ff] hover:bg-[#5850ec] text-white' 
                        : 'bg-white border border-[#e0e3eb] text-[#1b263b] hover:bg-[#f8f9fc]'
                    }`}
                    size="sm"
                    onClick={() => setTimelineOrientation('vertical')}
                  >
                    Vertical
                  </Button>
                </>
              )}
              
              <Button 
                className="bg-white border border-[#e0e3eb] text-[#1b263b] hover:bg-[#f8f9fc] px-4 py-2 rounded-lg font-medium transition-all"
                size="sm" 
                onClick={handleImportJSON}
              >
                Importar
              </Button>
              
              <Button 
                className="bg-white border border-[#e0e3eb] text-[#1b263b] hover:bg-[#f8f9fc] px-4 py-2 rounded-lg font-medium transition-all"
                size="sm" 
                onClick={handleExportJSON}
              >
                Exportar
              </Button>
            </div>
          </div>

          {/* Métricas Globales */}
          <div className="bg-white border border-[#e0e3eb] rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-[#1b263b] mb-4 text-lg">Resumen General del MVP</h3>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-[#8c8fa3] mb-1">Progreso Total</div>
                <div className="text-3xl font-bold text-[#1b263b]">{projectProgress}%</div>
                <div className="mt-3 h-2 rounded-full bg-[#e0e3eb]">
                  <div 
                    className="h-2 rounded-full bg-[#6c63ff] transition-all duration-500" 
                    style={{ width: `${projectProgress}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="text-sm text-[#8c8fa3] mb-1">Tareas</div>
                <div className="text-3xl font-bold text-[#1b263b]">
                  {doneTasks} / {totalTasks}
                </div>
                <div className="text-xs text-[#8c8fa3] mt-1">
                  {totalTasks - doneTasks} pendientes
                </div>
              </div>
              
              <div>
                <div className="text-sm text-[#8c8fa3] mb-1">Tiempo</div>
                <div className="text-3xl font-bold text-[#1b263b]">
                  {timeStats.completed}h / {timeStats.estimated}h
                </div>
                <div className="text-xs text-[#8c8fa3] mt-1">
                  {timeStats.remaining}h restantes
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        {/* Timeline de Fases - siempre visible */}
        <FasesTimeline objetivos={roadmap.objectives} />
        
        {viewMode === 'timeline' ? (
          <TimelineSection 
            objectives={roadmap.objectives}
            onObjectiveClick={handleObjectiveClick}
            viewMode={timelineOrientation}
          />
        ) : viewMode === 'phases' ? (
          <VistaPorFases
            objetivos={roadmap.objectives}
            onObjectiveClick={handleObjectiveClick}
            onToggleTask={() => {}} // Placeholder - no se usa en vista por fases
            useDatabase={useDatabase}
          />
        ) : viewMode === 'modules' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roadmap.objectives.map((objective) => {
              const stats = getObjectiveStats(objective);
              const statusColor = objective.status === 'COMPLETO' ? 'border-l-4 border-[#4ade80]' :
                                objective.status === 'EN_CURSO' ? 'border-l-4 border-[#6c63ff]' :
                                'border-l-4 border-[#facc15]';
              
              return (
                <div
                  key={objective.id}
                  className={`bg-white border border-[#e0e3eb] ${statusColor} rounded-xl shadow-sm p-5 hover:shadow-md transition-all cursor-pointer hover:scale-[1.01]`}
                  onClick={() => handleObjectiveClick(objective)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {objective.priority === 'ALTA' ? '🔴' : 
                         objective.priority === 'MEDIA' ? '🟣' : '🟡'}
                      </span>
                      <h3 className="font-semibold text-[#1b263b] text-lg">{objective.title}</h3>
                    </div>
                    <span className="text-[#8c8fa3] text-xl">▸</span>
                  </div>
                  
                  <p className="text-[#8c8fa3] text-sm mb-4 line-clamp-2">
                    {objective.description}
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-[#8c8fa3]">Progreso</span>
                        <span className="font-semibold text-[#1b263b]">{stats.progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#e0e3eb]">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            stats.progress === 100 ? 'bg-[#4ade80]' : 
                            stats.progress >= 70 ? 'bg-[#6c63ff]' : 
                            stats.progress >= 30 ? 'bg-[#6c63ff]' : 'bg-[#facc15]'
                          }`}
                          style={{ width: `${stats.progress}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="bg-[#f8f9fc] text-[#1b263b] px-3 py-1 rounded-lg font-medium">
                        {stats.completed} / {stats.total} tareas
                      </span>
                      <span 
                        className={`px-3 py-1 rounded-lg font-medium ${
                          objective.status === 'COMPLETO' ? 'bg-[#4ade80] text-white' :
                          objective.status === 'EN_CURSO' ? 'bg-[#6c63ff] text-white' :
                          'bg-[#facc15] text-[#1b263b]'
                        }`}
                      >
                        {objective.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-[#e0e3eb] rounded-xl shadow-sm p-8 min-h-[600px]">
            <h2 className="text-2xl font-bold mb-6 text-[#1b263b]">
              Mapa Completo del Proyecto
            </h2>
            <div className="grid grid-cols-2 gap-6">
              {roadmap.objectives.map((objective) => {
                const stats = getObjectiveStats(objective);
                
                return (
                  <div
                    key={objective.id}
                    className="bg-white border-2 border-[#e0e3eb] rounded-xl p-5 hover:border-[#6c63ff] cursor-pointer transition-all hover:shadow-md"
                    onClick={() => handleObjectiveClick(objective)}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span className="text-2xl">
                        {objective.priority === 'ALTA' ? '🔴' : 
                         objective.priority === 'MEDIA' ? '🟣' : '🟡'}
                      </span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#1b263b] text-lg">
                          {objective.title}
                        </h3>
                        <p className="text-sm text-[#8c8fa3] line-clamp-2 mt-1">
                          {objective.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-[#e0e3eb]">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-[#8c8fa3]">{stats.completed}/{stats.total} tareas</span>
                        <span className="font-semibold text-[#1b263b]">{stats.progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#e0e3eb]">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            stats.progress === 100 ? 'bg-[#4ade80]' : 
                            stats.progress >= 70 ? 'bg-[#6c63ff]' : 
                            stats.progress >= 30 ? 'bg-[#6c63ff]' : 'bg-[#facc15]'
                          }`}
                          style={{ width: `${stats.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Editor Modal */}
      <SimpleObjectiveModal
        objective={selectedObjective}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setSelectedObjective(null);
        }}
        onSave={handleObjectiveSave}
        onDelete={handleEliminarObjetivo}
        onEdit={(obj) => {
          setObjetivoToEdit(obj);
          setIsFormObjetivoOpen(true);
          setIsEditorOpen(false);
        }}
      />

      {/* Formulario Crear/Editar Objetivo */}
      <FormObjetivo
        objetivo={objetivoToEdit}
        isOpen={isFormObjetivoOpen}
        onClose={() => {
          setIsFormObjetivoOpen(false);
          setObjetivoToEdit(null);
        }}
        onSave={refetchData}
      />
    </div>
  );
}


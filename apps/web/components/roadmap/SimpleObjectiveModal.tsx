'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { 
  Objective, 
  Task, 
  TaskGroup, 
  TaskStatus,
  getAllTasksFromObjective,
  getObjectiveStats,
  getTaskStatusConfig,
  normalizeTaskStatus as normalizeTaskStatusGlobal,
} from '@/lib/roadmap/types';

interface SimpleObjectiveModalProps {
  objective: Objective | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (objective: Objective) => void;
  onDelete?: (id: string) => void;
  onEdit?: (objective: Objective) => void;
}

export function SimpleObjectiveModal({ objective, isOpen, onClose, onSave, onDelete, onEdit }: SimpleObjectiveModalProps) {
  const [editedObjective, setEditedObjective] = useState<Objective | null>(objective);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    setEditedObjective(objective);
  }, [objective]);

  if (!editedObjective) return null;

  // Recalcular estadísticas cada vez que cambie el objetivo editado
  const stats = getObjectiveStats(editedObjective);
  const allTasks = getAllTasksFromObjective(editedObjective);

  // Helper functions for task status
  const getNormalizedTaskStatus = (task: Task): TaskStatus => {
    return normalizeTaskStatusGlobal(task.status, task.done);
  };

  const getTaskStatusDisplay = (task: Task) => {
    const normalized = getNormalizedTaskStatus(task);
    const config = getTaskStatusConfig(normalized);
    switch (normalized) {
      case 'done':
        return { icon: '✅', label: config.label, color: 'text-green-500' };
      case 'inProgress':
        return { icon: '🚧', label: config.label, color: 'text-[#6c63ff]' };
      case 'review':
        return { icon: '🔎', label: config.label, color: 'text-purple-500' };
      default:
        return { icon: '⏳', label: config.label, color: 'text-red-500' };
    }
  };

const handleTaskToggle = (taskId: string, groupId: string | null) => {
    const updated = { ...editedObjective };
    
    if (groupId && updated.taskGroups) {
      const group = updated.taskGroups.find(g => g.id === groupId);
      if (group) {
        const task = group.tasks.find(t => t.id === taskId);
        if (task) {
          const previousStatus = getNormalizedTaskStatus(task);
          task.done = !task.done;
          task.status = task.done ? 'done' : (previousStatus !== 'done' ? previousStatus : 'inProgress');
        }
      }
    } else if (updated.tasks) {
      const task = updated.tasks.find(t => t.id === taskId);
      if (task) {
        const previousStatus = getNormalizedTaskStatus(task);
        task.done = !task.done;
        task.status = task.done ? 'done' : (previousStatus !== 'done' ? previousStatus : 'inProgress');
      }
    }
    
    setEditedObjective(updated);
  };

  const handleStatusChange = (taskId: string, groupId: string | null, newStatus: TaskStatus) => {
    const updated = { ...editedObjective };
    
    if (groupId && updated.taskGroups) {
      const group = updated.taskGroups.find(g => g.id === groupId);
      if (group) {
        const task = group.tasks.find(t => t.id === taskId);
        if (task) {
          task.status = newStatus;
          task.done = newStatus === 'done'; // Mantener compatibilidad
        }
      }
    } else if (updated.tasks) {
      const task = updated.tasks.find(t => t.id === taskId);
      if (task) {
        task.status = newStatus;
        task.done = newStatus === 'done'; // Mantener compatibilidad
      }
    }
    
    setEditedObjective(updated);
  };

  const handleSave = () => {
    onSave(editedObjective);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-white border border-[#e0e3eb] rounded-2xl">
        <DialogHeader className="border-b border-[#e0e3eb] pb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-[#1b263b]">{editedObjective.title}</DialogTitle>
              <DialogDescription className="text-[#8c8fa3] text-sm">{editedObjective.description}</DialogDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={editMode}
                  onCheckedChange={setEditMode}
                />
                <span className="text-sm font-medium text-[#1b263b]">✏️ Modo edición real</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Summary */}
          <div className="bg-[#f8f9fc] border border-[#e0e3eb] p-4 rounded-xl">
            <h3 className="font-semibold mb-2 text-[#1b263b]">📊 Progreso del Objetivo</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-[#8c8fa3] mb-1">Progreso Total</div>
                <div className="text-2xl font-bold text-[#1b263b]">{stats.progress}%</div>
                <div className="mt-2 h-2 rounded-full bg-[#e0e3eb]">
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
              <div>
                <div className="text-sm text-[#8c8fa3] mb-1">Tareas</div>
                <div className="text-2xl font-bold text-[#1b263b]">
                  {stats.completed} / {stats.total}
                </div>
                <div className="text-xs text-[#8c8fa3] mt-1">
                  {stats.total - stats.completed} pendientes
                </div>
              </div>
              <div>
                <div className="text-sm text-[#8c8fa3] mb-1">Estado</div>
                <span 
                  className={`px-3 py-1 rounded-lg font-medium transition-all duration-300 ${
                    stats.progress === 100 ? 'bg-[#4ade80] text-white' :
                    stats.progress >= 70 ? 'bg-[#6c63ff] text-white' :
                    stats.progress >= 30 ? 'bg-[#6c63ff] text-white' : 'bg-[#3B82F6] text-white'
                  }`}
                >
                  {stats.progress === 100 ? '✅ Completado' :
                   stats.progress >= 70 ? '🚧 En Progreso' :
                   stats.progress >= 30 ? '🚧 En Curso' : '⏳ Pendiente'}
                </span>
              </div>
            </div>
          </div>

          {/* Task Groups */}
          {editedObjective.taskGroups && editedObjective.taskGroups.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">📋 Grupos de Tareas</h3>
              {editedObjective.taskGroups.map((group) => (
                <div key={group.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{group.title}</h4>
                    <Badge variant="outline">
                      {group.tasks.filter(t => t.done).length} / {group.tasks.length} completadas
                    </Badge>
                  </div>
                  {group.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{group.description}</p>
                  )}
                  
                  <div className="space-y-2">
                    {group.tasks.map((task) => {
                      const statusDisplay = getTaskStatusDisplay(task);
                      return (
                        <div key={task.id} className="flex items-center space-x-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded border border-[#e0e3eb]">
                          {editMode ? (
                            <select
                              value={getNormalizedTaskStatus(task)}
                              onChange={(e) => handleStatusChange(task.id, group.id, e.target.value as TaskStatus)}
                              className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:ring-[#6c63ff] focus:border-[#6c63ff] min-w-[140px]"
                            >
                              <option value="pending">Pendiente</option>
                              <option value="inProgress">En curso</option>
                              <option value="review">En revisión</option>
                              <option value="done">Completada</option>
                            </select>
                          ) : (
                            <Checkbox
                              checked={task.done}
                              onCheckedChange={() => handleTaskToggle(task.id, group.id)}
                            />
                          )}
                          <span className={`flex-1 ${task.done ? 'line-through text-slate-500' : 'text-[#1b263b]'}`}>
                            {task.text}
                          </span>
                          <div className="flex items-center gap-2">
                            {!editMode && (
                              <span className={`text-sm font-medium ${statusDisplay.color}`}>
                                {statusDisplay.icon} {statusDisplay.label}
                              </span>
                            )}
                            {task.estimateHrs && (
                              <Badge variant="outline" className="text-xs">
                                {task.estimateHrs}h
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Direct Tasks */
            editedObjective.tasks && editedObjective.tasks.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">📋 Tareas Directas</h3>
                <div className="space-y-2">
                  {editedObjective.tasks.map((task) => {
                    const statusDisplay = getTaskStatusDisplay(task);
                    return (
                      <div key={task.id} className="flex items-center space-x-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded border border-[#e0e3eb]">
                        {editMode ? (
                          <select
                            value={getNormalizedTaskStatus(task)}
                            onChange={(e) => handleStatusChange(task.id, null, e.target.value as TaskStatus)}
                            className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:ring-[#6c63ff] focus:border-[#6c63ff] min-w-[140px]"
                          >
                            <option value="pending">Pendiente</option>
                            <option value="inProgress">En curso</option>
                            <option value="review">En revisión</option>
                            <option value="done">Completada</option>
                          </select>
                        ) : (
                          <Checkbox
                            checked={task.done}
                            onCheckedChange={() => handleTaskToggle(task.id, null)}
                          />
                        )}
                        <span className={`flex-1 ${task.done ? 'line-through text-slate-500' : 'text-[#1b263b]'}`}>
                          {task.text}
                        </span>
                        <div className="flex items-center gap-2">
                          {!editMode && (
                            <span className={`text-sm font-medium ${statusDisplay.color}`}>
                              {statusDisplay.icon} {statusDisplay.label}
                            </span>
                          )}
                          {task.estimateHrs && (
                            <Badge variant="outline" className="text-xs">
                              {task.estimateHrs}h
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          )}

          {allTasks.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <p>No hay tareas definidas para este objetivo.</p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-[#e0e3eb] pt-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex gap-2">
              {/* Botón Editar Objetivo */}
              {onEdit && (
                <Button 
                  className="bg-white border border-[#e0e3eb] text-[#6c63ff] hover:bg-[#f8f9fc]"
                  onClick={() => {
                    if (editedObjective) {
                      onEdit(editedObjective);
                    }
                  }}
                >
                  ✏️ Editar Objetivo
                </Button>
              )}
              
              {/* Botón Eliminar Objetivo */}
              {onDelete && (
                <Button 
                  className="bg-white border border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    if (editedObjective && confirm('¿Eliminar este objetivo y todas sus tareas?')) {
                      onDelete(editedObjective.id);
                      onClose();
                    }
                  }}
                >
                  🗑️ Eliminar
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {editMode && (
                <div className="flex items-center gap-2 text-sm text-[#6c63ff]">
                  <span className="w-2 h-2 bg-[#6c63ff] rounded-full animate-pulse"></span>
                  Modo edición activo
                </div>
              )}
              <Button 
                className="bg-white border border-[#e0e3eb] text-[#1b263b] hover:bg-[#f8f9fc]"
                onClick={onClose}
              >
                Cerrar
              </Button>
              <Button 
                className="bg-[#6c63ff] hover:bg-[#5850ec] text-white font-medium"
                onClick={handleSave}
              >
                💾 Guardar Cambios
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

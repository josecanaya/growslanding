'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  Objective, 
  Task, 
  TaskGroup, 
  Priority, 
  TaskStatus,
  getAllTasksFromObjective,
  getObjectiveStats,
  getObjectiveTimeStats,
  getTaskStatusConfig
} from '@/lib/roadmap/types';

interface ObjectiveEditorModalProps {
  objective: Objective | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (objective: Objective) => void;
}

export function ObjectiveEditorModal({ objective, isOpen, onClose, onSave }: ObjectiveEditorModalProps) {
  console.log('Modal props:', { objective: objective?.title, isOpen });
  
  const [editedObjective, setEditedObjective] = useState<Objective | null>(objective);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Update edited objective when prop changes
  useEffect(() => {
    setEditedObjective(objective);
  }, [objective]);

  if (!editedObjective) {
    console.log('No edited objective, returning null');
    return null;
  }

  const stats = getObjectiveStats(editedObjective);
  const timeStats = getObjectiveTimeStats(editedObjective);
  const allTasks = getAllTasksFromObjective(editedObjective);

  console.log('Modal rendering with:', { 
    title: editedObjective.title, 
    taskCount: allTasks.length,
    stats 
  });

  const handleSave = () => {
    onSave(editedObjective);
    onClose();
  };

  const handleTaskStatusChange = (taskId: string, groupId: string | null, newStatus: TaskStatus) => {
    const updated = { ...editedObjective };
    
    if (groupId && updated.taskGroups) {
      updated.taskGroups = updated.taskGroups.map(group => {
        if (group.id === groupId) {
          return {
            ...group,
            tasks: group.tasks.map(task =>
              task.id === taskId 
                ? { ...task, status: newStatus, done: newStatus === 'done' }
                : task
            )
          };
        }
        return group;
      });
    } else if (updated.taskGroups) {
      updated.taskGroups = updated.taskGroups.map(group => ({
        ...group,
        tasks: group.tasks.map(task =>
          task.id === taskId 
            ? { ...task, status: newStatus, done: newStatus === 'done' }
            : task
        )
      }));
    } else if (updated.tasks) {
      updated.tasks = updated.tasks.map(task =>
        task.id === taskId 
          ? { ...task, status: newStatus, done: newStatus === 'done' }
          : task
      );
    }
    
    setEditedObjective(updated);
  };

  const handleTaskTextEdit = (taskId: string, groupId: string | null, newText: string) => {
    const updated = { ...editedObjective };
    
    if (groupId && updated.taskGroups) {
      updated.taskGroups = updated.taskGroups.map(group => {
        if (group.id === groupId) {
          return {
            ...group,
            tasks: group.tasks.map(task =>
              task.id === taskId ? { ...task, text: newText } : task
            )
          };
        }
        return group;
      });
    } else if (updated.taskGroups) {
      updated.taskGroups = updated.taskGroups.map(group => ({
        ...group,
        tasks: group.tasks.map(task =>
          task.id === taskId ? { ...task, text: newText } : task
        )
      }));
    } else if (updated.tasks) {
      updated.tasks = updated.tasks.map(task =>
        task.id === taskId ? { ...task, text: newText } : task
      );
    }
    
    setEditedObjective(updated);
    setEditingTaskId(null);
  };

  const priorityConfig: Record<Priority, { icon: string; color: string }> = {
    ALTA: { icon: '🔥', color: 'text-red-600 dark:text-red-400' },
    MEDIA: { icon: '⚙️', color: 'text-blue-600 dark:text-blue-400' },
    BAJA: { icon: '🌱', color: 'text-green-600 dark:text-green-400' },
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <span className={priorityConfig[editedObjective.priority].color}>
              {priorityConfig[editedObjective.priority].icon}
            </span>
            <Input
              value={editedObjective.title}
              onChange={(e) => setEditedObjective({ ...editedObjective, title: e.target.value })}
              className="text-2xl font-bold border-none p-0 h-auto focus-visible:ring-0"
            />
          </DialogTitle>
          <DialogDescription>
            <textarea
              value={editedObjective.description || ''}
              onChange={(e) => setEditedObjective({ ...editedObjective, description: e.target.value })}
              className="w-full min-h-[60px] bg-transparent border border-slate-200 dark:border-slate-700 rounded-md p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción del objetivo..."
            />
          </DialogDescription>
        </DialogHeader>

        {/* Métricas del Objetivo */}
        <div className="grid grid-cols-3 gap-4 my-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">Progreso</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.progress}%</div>
              <Progress value={stats.progress} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">Tareas</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {stats.completed} / {stats.total}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {stats.total - stats.completed} pendientes
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">Tiempo</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {timeStats.completed}h / {timeStats.estimated}h
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {timeStats.remaining}h restantes
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Tareas */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Mapa de Tareas</h3>
          
          {editedObjective.taskGroups && editedObjective.taskGroups.length > 0 ? (
            editedObjective.taskGroups.map((group) => (
              <div key={group.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  📁 {group.title}
                </h4>
                <div className="space-y-2">
                  {group.tasks.map((task) => {
                    const statusConfig = getTaskStatusConfig(task.status);
                    
                    return (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                      >
                        <Select
                          value={task.status || 'pending'}
                          onValueChange={(value: TaskStatus) => handleTaskStatusChange(task.id, group.id, value)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue>
                              <span className="flex items-center gap-2">
                                {statusConfig.icon} {statusConfig.label}
                              </span>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">
                              <span className="flex items-center gap-2">⏸️ Pendiente</span>
                            </SelectItem>
                            <SelectItem value="inProgress">
                              <span className="flex items-center gap-2">🟡 En Curso</span>
                            </SelectItem>
                            <SelectItem value="review">
                              <span className="flex items-center gap-2">🧩 En Revisión</span>
                            </SelectItem>
                            <SelectItem value="done">
                              <span className="flex items-center gap-2">✅ Completada</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="flex-1">
                          {editingTaskId === task.id ? (
                            <Input
                              value={task.text}
                              onChange={(e) => handleTaskTextEdit(task.id, group.id, e.target.value)}
                              onBlur={() => setEditingTaskId(null)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  setEditingTaskId(null);
                                }
                              }}
                              autoFocus
                              className="text-sm"
                            />
                          ) : (
                            <div
                              onDoubleClick={() => setEditingTaskId(task.id)}
                              className="text-sm cursor-pointer"
                            >
                              {task.text}
                            </div>
                          )}
                          
                          <div className="flex gap-3 mt-1 text-xs text-slate-500">
                            {task.estimateHrs && <span>⏱️ {task.estimateHrs}h</span>}
                            {task.owner && <span>👤 {task.owner}</span>}
                            {task.dueDate && <span>📅 {new Date(task.dueDate).toLocaleDateString('es-AR')}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500">
              No hay tareas en este objetivo
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-blue-500 hover:bg-blue-600 text-white">
            💾 Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export type Priority = "ALTA" | "MEDIA" | "BAJA";
export type Status = "PENDIENTE" | "EN_CURSO" | "COMPLETO" | "EN_REVISION";
export type ViewMode = "timeline" | "modules" | "phases";

export type TaskStatus = "pending" | "inProgress" | "review" | "done";

export interface Task {
  id: string;
  text: string;
  done: boolean;
  status?: TaskStatus; // Estado editable de la tarea
  estimateHrs?: number;
  completedHrs?: number; // Horas reales completadas
  owner?: string;
  dueDate?: string; // YYYY-MM-DD
  dependencies?: string[]; // IDs de tareas de las que depende
  description?: string; // Descripción detallada
}

export interface TaskGroup {
  id: string;
  title: string;
  description?: string;
  tasks: Task[];
  collapsed?: boolean;
}

export interface Objective {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: Status;
  targetWeeks?: number;
  startWeek?: number; // Semana de inicio del objetivo
  endWeek?: number;   // Semana de fin del objetivo
  dueDate?: string; // YYYY-MM-DD
  collapsed?: boolean;
  taskGroups?: TaskGroup[]; // Nueva estructura jerárquica
  tasks?: Task[]; // Mantener para compatibilidad con datos existentes
}

export interface ProjectRoadmap {
  projectName: string;
  version: string;
  updatedAt: string; // ISO
  objectives: Objective[];
}

// Helpers para TaskGroup
export function calculateTaskGroupProgress(taskGroup: TaskGroup): number {
  if (taskGroup.tasks.length === 0) return 0;
  const doneTasks = taskGroup.tasks.filter(t => t.done).length;
  return Math.round((doneTasks / taskGroup.tasks.length) * 100);
}

// Helpers para Objective (compatible con estructura antigua y nueva)
export function getAllTasksFromObjective(objective: Objective): Task[] {
  // Si tiene taskGroups (nueva estructura)
  if (objective.taskGroups && objective.taskGroups.length > 0) {
    return objective.taskGroups.flatMap(group => group.tasks);
  }
  // Si tiene tasks directamente (estructura antigua)
  if (objective.tasks && objective.tasks.length > 0) {
    return objective.tasks;
  }
  return [];
}

export function calculateObjectiveProgress(objective: Objective): number {
  const allTasks = getAllTasksFromObjective(objective);
  if (allTasks.length === 0) return 0;
  const doneTasks = allTasks.filter(t => t.done).length;
  return Math.round((doneTasks / allTasks.length) * 100);
}

export function calculateObjectiveStatus(objective: Objective): Status {
  const progress = calculateObjectiveProgress(objective);
  if (progress === 0) return "PENDIENTE";
  if (progress === 100) return "COMPLETO";
  return "EN_CURSO";
}

export function calculateProjectProgress(roadmap: ProjectRoadmap): number {
  if (roadmap.objectives.length === 0) return 0;
  
  const totalTasks = roadmap.objectives.reduce((sum, obj) => sum + getAllTasksFromObjective(obj).length, 0);
  if (totalTasks === 0) return 0;
  
  const doneTasks = roadmap.objectives.reduce(
    (sum, obj) => sum + getAllTasksFromObjective(obj).filter(t => t.done).length,
    0
  );
  
  return Math.round((doneTasks / totalTasks) * 100);
}

export function getTotalTasks(roadmap: ProjectRoadmap): { total: number; done: number } {
  const total = roadmap.objectives.reduce((sum, obj) => sum + getAllTasksFromObjective(obj).length, 0);
  const done = roadmap.objectives.reduce(
    (sum, obj) => sum + getAllTasksFromObjective(obj).filter(t => t.done).length,
    0
  );
  return { total, done };
}

export function getTotalEstimatedHours(roadmap: ProjectRoadmap): { total: number; done: number } {
  let total = 0;
  let done = 0;
  
  roadmap.objectives.forEach(obj => {
    getAllTasksFromObjective(obj).forEach(task => {
      if (task.estimateHrs) {
        total += task.estimateHrs;
        if (task.done) done += task.estimateHrs;
      }
    });
  });
  
  return { total, done };
}

// Función helper para obtener estadísticas detalladas de un objetivo
export function getObjectiveStats(objective: Objective): { total: number; completed: number; progress: number } {
  const allTasks = getAllTasksFromObjective(objective);
  const total = allTasks.length;
  const completed = allTasks.filter(task => task.done || task.status === 'done').length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return { total, completed, progress };
}

// Función para obtener ícono y color según el estado de la tarea
export function getTaskStatusConfig(status?: TaskStatus): { icon: string; label: string; color: string; bgColor: string } {
  switch (status) {
    case 'done':
      return { icon: '✅', label: 'Completada', color: 'text-green-700 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-900/20' };
    case 'inProgress':
      return { icon: '🟡', label: 'En Curso', color: 'text-blue-700 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/20' };
    case 'review':
      return { icon: '🧩', label: 'En Revisión', color: 'text-purple-700 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-900/20' };
    case 'pending':
    default:
      return { icon: '⏸️', label: 'Pendiente', color: 'text-gray-700 dark:text-gray-400', bgColor: 'bg-gray-50 dark:bg-gray-900/20' };
  }
}

// Función para calcular tiempos totales de un objetivo
export function getObjectiveTimeStats(objective: Objective): { estimated: number; completed: number; remaining: number } {
  const allTasks = getAllTasksFromObjective(objective);
  
  const estimated = allTasks.reduce((sum, task) => sum + (task.estimateHrs || 0), 0);
  const completed = allTasks.reduce((sum, task) => sum + (task.completedHrs || 0), 0);
  const remaining = Math.max(0, estimated - completed);
  
  return { estimated, completed, remaining };
}

// Función para calcular tiempos totales del proyecto
export function getProjectTimeStats(roadmap: ProjectRoadmap): { estimated: number; completed: number; remaining: number } {
  let estimated = 0;
  let completed = 0;
  
  roadmap.objectives.forEach(obj => {
    const stats = getObjectiveTimeStats(obj);
    estimated += stats.estimated;
    completed += stats.completed;
  });
  
  const remaining = Math.max(0, estimated - completed);
  
  return { estimated, completed, remaining };
}

// Migración de datos v1 a v2
export function migrateObjectiveToV2(objective: Objective): Objective {
  // Si ya tiene taskGroups, no migrar
  if (objective.taskGroups && objective.taskGroups.length > 0) {
    return objective;
  }
  
  // Si tiene tasks pero no taskGroups, migrar
  if (objective.tasks && objective.tasks.length > 0) {
    return {
      ...objective,
      taskGroups: [{
        id: `group-${objective.id}-default`,
        title: 'Tareas Principales',
        description: 'Grupo por defecto para tareas existentes',
        tasks: objective.tasks,
        collapsed: false,
      }],
      tasks: undefined, // Limpiar tasks para usar solo taskGroups
    };
  }
  
  return objective;
}

// Funciones para sugerencias diarias
export interface DailyTask {
  id: string;
  text: string;
  done: boolean;
  estimateHrs?: number;
  owner?: string;
  dueDate?: string;
  objectiveTitle: string;
  objectivePriority: Priority;
  groupTitle?: string;
}

export function getTodayTasks(roadmap: ProjectRoadmap): DailyTask[] {
  const allTasks: DailyTask[] = [];
  
  roadmap.objectives.forEach(obj => {
    const tasks = getAllTasksFromObjective(obj);
    tasks.forEach(task => {
      allTasks.push({
        ...task,
        objectiveTitle: obj.title,
        objectivePriority: obj.priority,
        groupTitle: getTaskGroupTitle(obj, task.id),
      });
    });
  });
  
  // Filtrar tareas pendientes
  const pendingTasks = allTasks.filter(task => !task.done);
  
  // Ordenar por prioridad y fecha
  return pendingTasks.sort((a, b) => {
    // Prioridad ALTA primero
    if (a.objectivePriority === 'ALTA' && b.objectivePriority !== 'ALTA') return -1;
    if (b.objectivePriority === 'ALTA' && a.objectivePriority !== 'ALTA') return 1;
    
    // Luego por fecha de vencimiento
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate && !b.dueDate) return -1;
    if (b.dueDate && !a.dueDate) return 1;
    
    // Finalmente por horas estimadas (menor primero)
    const aHours = a.estimateHrs || 0;
    const bHours = b.estimateHrs || 0;
    return aHours - bHours;
  }).slice(0, 5); // Máximo 5 tareas
}

function getTaskGroupTitle(objective: Objective, taskId: string): string | undefined {
  if (objective.taskGroups) {
    for (const group of objective.taskGroups) {
      if (group.tasks.some(task => task.id === taskId)) {
        return group.title;
      }
    }
  }
  return undefined;
}

export function getUpcomingTasks(roadmap: ProjectRoadmap): DailyTask[] {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 2); // Próximas 48h
  
  const allTasks: DailyTask[] = [];
  
  roadmap.objectives.forEach(obj => {
    const tasks = getAllTasksFromObjective(obj);
    tasks.forEach(task => {
      allTasks.push({
        ...task,
        objectiveTitle: obj.title,
        objectivePriority: obj.priority,
        groupTitle: getTaskGroupTitle(obj, task.id),
      });
    });
  });
  
  return allTasks.filter(task => {
    if (!task.dueDate || task.done) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate >= today && dueDate <= tomorrow;
  }).sort((a, b) => {
    const aDate = new Date(a.dueDate!);
    const bDate = new Date(b.dueDate!);
    return aDate.getTime() - bDate.getTime();
  });
}

export function getDailySuggestion(roadmap: ProjectRoadmap): { text: string; icon: string; type: 'urgent' | 'balanced' | 'relaxed' } {
  const todayTasks = getTodayTasks(roadmap);
  const upcomingTasks = getUpcomingTasks(roadmap);
  const highPriorityTasks = todayTasks.filter(task => task.objectivePriority === 'ALTA');
  
  if (highPriorityTasks.length >= 3) {
    return {
      text: `Priorizar ${highPriorityTasks.length} tareas críticas del día`,
      icon: '🔥',
      type: 'urgent'
    };
  }
  
  if (upcomingTasks.length > 0) {
    return {
      text: `${upcomingTasks.length} tareas vencen en las próximas 48h`,
      icon: '🔔',
      type: 'urgent'
    };
  }
  
  if (todayTasks.length > 0) {
    return {
      text: 'Avanzar en tareas pendientes del día',
      icon: '⚡',
      type: 'balanced'
    };
  }
  
  return {
    text: '¡Excelente! Sin tareas urgentes por hoy 🎉',
    icon: '✨',
    type: 'relaxed'
  };
}

// Funciones para tareas completadas
export function getCompletedTasks(roadmap: ProjectRoadmap): DailyTask[] {
  const allTasks: DailyTask[] = [];
  
  roadmap.objectives.forEach(obj => {
    const tasks = getAllTasksFromObjective(obj);
    tasks.forEach(task => {
      allTasks.push({
        ...task,
        objectiveTitle: obj.title,
        objectivePriority: obj.priority,
        groupTitle: getTaskGroupTitle(obj, task.id),
      });
    });
  });
  
  // Filtrar solo tareas completadas
  const completedTasks = allTasks.filter(task => task.done);
  
  // Agrupar por objetivo y ordenar por prioridad
  return completedTasks.sort((a, b) => {
    // Prioridad ALTA primero
    if (a.objectivePriority === 'ALTA' && b.objectivePriority !== 'ALTA') return -1;
    if (b.objectivePriority === 'ALTA' && a.objectivePriority !== 'ALTA') return 1;
    
    // Luego alfabéticamente por objetivo
    return a.objectiveTitle.localeCompare(b.objectiveTitle);
  });
}

export function getPendingTasks(roadmap: ProjectRoadmap): DailyTask[] {
  const allTasks: DailyTask[] = [];
  
  roadmap.objectives.forEach(obj => {
    const tasks = getAllTasksFromObjective(obj);
    tasks.forEach(task => {
      allTasks.push({
        ...task,
        objectiveTitle: obj.title,
        objectivePriority: obj.priority,
        groupTitle: getTaskGroupTitle(obj, task.id),
      });
    });
  });
  
  // Filtrar solo tareas pendientes
  const pendingTasks = allTasks.filter(task => !task.done);
  
  // Ordenar por prioridad y fecha
  return pendingTasks.sort((a, b) => {
    // Prioridad ALTA primero
    if (a.objectivePriority === 'ALTA' && b.objectivePriority !== 'ALTA') return -1;
    if (b.objectivePriority === 'ALTA' && a.objectivePriority !== 'ALTA') return 1;
    
    // Luego por fecha de vencimiento
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate && !b.dueDate) return -1;
    if (b.dueDate && !a.dueDate) return 1;
    
    // Finalmente por horas estimadas (menor primero)
    const aHours = a.estimateHrs || 0;
    const bHours = b.estimateHrs || 0;
    return aHours - bHours;
  });
}


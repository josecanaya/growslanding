'use client';

import { create } from 'zustand';

const DEFAULT_DURATION = 2;
export const EMPTY_CANVAS_TASKS: CanvasTask[] = [];

export type CanvasTask = {
  tareaId: string;
  dependeDe: string | null;
  duracion: number;
  x: number;
  y: number;
};

export type OrganizaState = {
  canvasByObra: Record<string, CanvasTask[]>;
  syncCanvas: (
    obraId: string,
    order: string[],
    getDefaults: (taskId: string, index: number) => CanvasTask,
  ) => void;
  updateCanvasTask: (obraId: string, tareaId: string, updates: Partial<CanvasTask>) => void;
  resetCanvas: (obraId: string) => void;
  upsertCanvasTask: (obraId: string, task: CanvasTask) => void;
  updateNodePosition: (obraId: string, tareaId: string, position: { x: number; y: number }) => void;
  removeCanvasTask: (obraId: string, tareaId: string) => void;
};

export const useOrganizaStore = create<OrganizaState>((set) => ({
  canvasByObra: {},
  syncCanvas: (obraId, order, getDefaults) => {
    if (!obraId) return;

    set((state) => {
      const current = state.canvasByObra[obraId] ?? [];
      const currentMap = new Map(current.map((task) => [task.tareaId, task]));

      const synced = order.map((taskId, index) => {
        const existing = currentMap.get(taskId);
        if (existing) {
          return {
            ...existing,
            x: Number.isFinite(existing.x) ? existing.x : 0,
            y: Number.isFinite(existing.y) ? existing.y : 0,
          };
        }
        return getDefaults(taskId, index);
      });

      return {
        canvasByObra: {
          ...state.canvasByObra,
          [obraId]: synced,
        },
      };
    });
  },
  updateCanvasTask: (obraId, tareaId, updates) => {
    if (!obraId || !tareaId) return;

    set((state) => {
      const current = state.canvasByObra[obraId] ?? [];
      if (current.length === 0) {
        return state;
      }

      const updated = current.map((task) =>
        task.tareaId === tareaId
          ? {
              ...task,
              ...updates,
              duracion:
                updates.duracion !== undefined
                  ? Math.max(1, Number.isFinite(updates.duracion) ? Math.trunc(updates.duracion) : DEFAULT_DURATION)
                  : task.duracion,
              x: updates.x !== undefined ? updates.x : task.x,
              y: updates.y !== undefined ? updates.y : task.y,
            }
          : task,
      );

      return {
        canvasByObra: {
          ...state.canvasByObra,
          [obraId]: updated,
        },
      };
    });
  },
  resetCanvas: (obraId) => {
    if (!obraId) return;

    set((state) => {
      const { [obraId]: _, ...rest } = state.canvasByObra;
      return {
        canvasByObra: rest,
      };
    });
  },
  upsertCanvasTask: (obraId, task) => {
    if (!obraId || !task.tareaId) return;

    set((state) => {
      const current = state.canvasByObra[obraId] ?? [];
      const existingIndex = current.findIndex((item) => item.tareaId === task.tareaId);

      const sanitizedTask: CanvasTask = {
        tareaId: task.tareaId,
        dependeDe: task.dependeDe ?? null,
        duracion: Math.max(
          1,
          Number.isFinite(task.duracion) ? Math.trunc(task.duracion) : DEFAULT_DURATION,
        ),
        x: Number.isFinite(task.x) ? task.x : 0,
        y: Number.isFinite(task.y) ? task.y : 0,
      };

      const next =
        existingIndex === -1
          ? [...current, sanitizedTask]
          : current.map((item, index) => (index === existingIndex ? { ...item, ...sanitizedTask } : item));

      return {
        canvasByObra: {
          ...state.canvasByObra,
          [obraId]: next,
        },
      };
    });
  },
  updateNodePosition: (obraId, tareaId, position) => {
    if (!obraId || !tareaId) return;

    set((state) => {
      const current = state.canvasByObra[obraId] ?? [];
      if (current.length === 0) {
        return state;
      }

      const updated = current.map((task) =>
        task.tareaId === tareaId
          ? {
              ...task,
              x: Number.isFinite(position.x) ? position.x : task.x,
              y: Number.isFinite(position.y) ? position.y : task.y,
            }
          : task,
      );

      return {
        canvasByObra: {
          ...state.canvasByObra,
          [obraId]: updated,
        },
      };
    });
  },
  removeCanvasTask: (obraId, tareaId) => {
    if (!obraId || !tareaId) return;

    set((state) => {
      const current = state.canvasByObra[obraId] ?? [];
      const filtered = current.filter((task) => task.tareaId !== tareaId);

      return {
        canvasByObra: {
          ...state.canvasByObra,
          [obraId]: filtered,
        },
      };
    });
  },
}));

export const selectCanvasTasks = (obraId: string | null) => (state: OrganizaState) =>
  obraId ? state.canvasByObra[obraId] ?? EMPTY_CANVAS_TASKS : EMPTY_CANVAS_TASKS;


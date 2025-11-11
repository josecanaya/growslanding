'use client';

import { create } from 'zustand';

const DEFAULT_DURATION = 2;
export const EMPTY_CANVAS_TASKS: CanvasTask[] = [];

export type CanvasTask = {
  tareaId: string;
  dependeDe: string | null;
  duracion: number;
};

export type OrganizaState = {
  canvasByObra: Record<string, CanvasTask[]>;
  syncCanvas: (
    obraId: string,
    order: string[],
    getDefaults: (taskId: string, index: number) => CanvasTask
  ) => void;
  updateCanvasTask: (obraId: string, tareaId: string, updates: Partial<CanvasTask>) => void;
  resetCanvas: (obraId: string) => void;
  upsertCanvasTask: (obraId: string, task: CanvasTask) => void;
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
          return existing;
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

      const next =
        existingIndex === -1
          ? [...current, task]
          : current.map((item, index) => (index === existingIndex ? { ...item, ...task } : item));

      return {
        canvasByObra: {
          ...state.canvasByObra,
          [obraId]: next,
        },
      };
    });
  },
}));

export const selectCanvasTasks = (obraId: string | null) => (state: OrganizaState) =>
  obraId ? state.canvasByObra[obraId] ?? EMPTY_CANVAS_TASKS : EMPTY_CANVAS_TASKS;


import { create } from 'zustand';

export interface TareaObra {
  id: string;
  nombre: string;
  codigo?: string | null;
  fases?: {
    estructura?: string[];
    obra_gris?: string[];
    terminaciones?: string[];
  };
}

export interface ElementoObra {
  id: string;
  nombreElemento: string;
  grupo: string;
  plantaId?: string;
  unidad?: string;
  cantidad?: number;
  configuraciones?: Record<string, unknown>;
  tareas?: Record<string, unknown>;
  precedencias?: Record<string, string[]>;
  fechaCreacion: string;
}

type ElementoInput = Omit<ElementoObra, 'id' | 'fechaCreacion'> & {
  id?: string;
  fechaCreacion?: string;
};

interface ElementosStore {
  elementos: ElementoObra[];
  tareasObra: TareaObra[];
  addElemento: (elemento: ElementoInput) => ElementoObra;
  updateElemento: (id: string, data: Partial<ElementoObra>) => void;
  removeElemento: (id: string) => void;
  setElementos: (elementos: ElementoObra[]) => void;
  getElementoPorNombre: (nombre: string, plantaId?: string) => ElementoObra | undefined;
  updatePrecedencias: (id: string, codigoTarea: string | null, precedencias: string[]) => void;
  setTareasObra: (tareas: TareaObra[]) => void;
  getTareasObra: () => TareaObra[];
}

export const useElementosStore = create<ElementosStore>((set, get) => ({
  elementos: [],
  tareasObra: [],

  addElemento: (elemento) => {
    const createId = () => {
      if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
      }
      return `elem_${Math.random().toString(36).slice(2, 10)}`;
    };

    const nuevoElemento: ElementoObra = {
      id: elemento.id ?? createId(),
      fechaCreacion: elemento.fechaCreacion ?? new Date().toISOString(),
      nombreElemento: elemento.nombreElemento,
      grupo: elemento.grupo,
      plantaId: elemento.plantaId,
      unidad: elemento.unidad,
      cantidad: elemento.cantidad,
      configuraciones: elemento.configuraciones ?? {},
      tareas: elemento.tareas ?? {},
      precedencias: elemento.precedencias ?? {},
    };

    set((state) => ({ elementos: [...state.elementos, nuevoElemento] }));
    return nuevoElemento;
  },

  updateElemento: (id, data) => {
    set((state) => ({
      elementos: state.elementos.map((elem) => (elem.id === id ? { ...elem, ...data } : elem)),
    }));
  },

  removeElemento: (id) => {
    set((state) => ({ elementos: state.elementos.filter((elem) => elem.id !== id) }));
  },

  setElementos: (elementos) => {
    set({ elementos: elementos ?? [] });
  },

  getElementoPorNombre: (nombre, plantaId) => {
    const coincidencias = get().elementos.filter((elem) => elem.nombreElemento === nombre);
    if (coincidencias.length === 0) return undefined;
    if (!plantaId) return coincidencias[0];
    return coincidencias.find((elem) => elem.plantaId === plantaId) ?? coincidencias[0];
  },

  updatePrecedencias: (id, codigoTarea, precedencias) => {
    if (!codigoTarea) return;

    set((state) => ({
      elementos: state.elementos.map((elem) =>
        elem.id === id
          ? {
              ...elem,
              precedencias: {
                ...(elem.precedencias ?? {}),
                [codigoTarea]: precedencias,
              },
            }
          : elem,
      ),
    }));
  },

  setTareasObra: (tareas) => set({ tareasObra: tareas ?? [] }),

  getTareasObra: () => get().tareasObra,
}));

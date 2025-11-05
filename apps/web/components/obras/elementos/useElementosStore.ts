"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ConfiguracionTecnica = Record<string, any>;

export type ElementoConfigurado = {
  id: string;
  nombreElemento: string;
  grupo: string; // "Fundaciones y Estructuras", "Muros", etc.
  plantaId?: string; // e.g., "PB", "1", etc.
  unidad: string;
  cantidad: number;
  configuraciones: ConfiguracionTecnica;
  tareas: {
    estructura: string[];
    obra_gris: string[];
    terminaciones: string[];
  };
  precedencias: Record<string, string[]>; // codigoTarea -> [codigosPrecedencias]
  fechaCreacion: string;
};

export type TareaObra = {
  id: string;
  nombre: string;
  codigo?: string;
  elementoId?: string; // ID del elemento que la generó
};

type ElementosState = {
  elementos: ElementoConfigurado[];
  tareas: TareaObra[];
};

type ElementosActions = {
  addElemento: (e: Omit<ElementoConfigurado, 'id' | 'fechaCreacion'>) => void;
  updateElemento: (id: string, updates: Partial<ElementoConfigurado>) => void;
  removeElemento: (id: string) => void;
  getElementosPorPlanta: (plantaId?: string) => ElementoConfigurado[];
  getElementoPorNombre: (nombre: string, plantaId?: string) => ElementoConfigurado | undefined;
  getTareasObra: () => TareaObra[];
  updatePrecedencias: (elementoId: string, codigoTarea: string, precedencias: string[]) => void;
};

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

// Genera tareas a partir de un elemento configurado
function generarTareasDeElemento(elemento: ElementoConfigurado): TareaObra[] {
  const tareas: TareaObra[] = [];
  const todasLasTareas = [
    ...elemento.tareas.estructura,
    ...elemento.tareas.obra_gris,
    ...elemento.tareas.terminaciones
  ];
  
  todasLasTareas.forEach((codigo) => {
    tareas.push({
      id: `${elemento.id}-${codigo}`,
      nombre: codigo, // El componente se encargará de traducir a nombre
      codigo,
      elementoId: elemento.id,
    });
  });
  
  return tareas;
}

export const useElementosStore = create<ElementosState & ElementosActions>()(
  persist(
    (set, get) => ({
      elementos: [],
      tareas: [],
      
      addElemento: (e) => {
        const nuevoElemento: ElementoConfigurado = {
          ...e,
          id: genId(),
          fechaCreacion: new Date().toISOString(),
        };
        
        set((s) => {
          // Verificar si ya existe un elemento con el mismo nombre en la misma planta
          const existente = s.elementos.find(
            el => el.nombreElemento === e.nombreElemento && el.plantaId === e.plantaId
          );
          
          if (existente) {
            // Actualizar el existente en lugar de crear uno nuevo
            return {
              elementos: s.elementos.map(el => 
                el.id === existente.id ? nuevoElemento : el
              ),
              tareas: [
                ...s.tareas.filter(t => t.elementoId !== existente.id),
                ...generarTareasDeElemento(nuevoElemento)
              ],
            };
          }
          
          return {
            elementos: [...s.elementos, nuevoElemento],
            tareas: [
              ...s.tareas,
              ...generarTareasDeElemento(nuevoElemento)
            ],
          };
        });
      },
      
      updateElemento: (id, updates) => {
        set((s) => {
          const elementoActualizado = s.elementos.find(el => el.id === id);
          if (!elementoActualizado) return s;
          
          const actualizado = { ...elementoActualizado, ...updates };
          
          return {
            elementos: s.elementos.map(el => el.id === id ? actualizado : el),
            tareas: [
              ...s.tareas.filter(t => t.elementoId !== id),
              ...generarTareasDeElemento(actualizado)
            ],
          };
        });
      },
      
      removeElemento: (id) => {
        set((s) => ({
          elementos: s.elementos.filter(el => el.id !== id),
          tareas: s.tareas.filter(t => t.elementoId !== id),
        }));
      },
      
      getElementosPorPlanta: (plantaId) => {
        const all = get().elementos;
        if (!plantaId) return all;
        return all.filter((e) => e.plantaId === plantaId || (!e.plantaId && !plantaId));
      },
      
      getElementoPorNombre: (nombre, plantaId) => {
        return get().elementos.find(
          el => el.nombreElemento === nombre && el.plantaId === plantaId
        );
      },
      
      getTareasObra: () => {
        return get().tareas;
      },
      
      updatePrecedencias: (elementoId, codigoTarea, precedencias) => {
        set((s) => ({
          elementos: s.elementos.map(el => 
            el.id === elementoId
              ? {
                  ...el,
                  precedencias: {
                    ...el.precedencias,
                    [codigoTarea]: precedencias,
                  },
                }
              : el
          ),
        }));
      },
    }),
    {
      name: 'grows-elementos-storage',
      version: 1,
    }
  )
);

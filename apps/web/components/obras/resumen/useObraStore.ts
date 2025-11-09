'use client';

import { create } from 'zustand';

export type PisoResumen = {
  id: string;
  nombre: string;
  porcentaje: number;
  metrosTotales: number;
  metrosCubiertos: number;
  metrosDescubiertos: number;
  elementos: number;
  categorias: Array<{
    nombre: string;
    porcentaje: number;
    elementos: number;
  }>;
};

type ObraState = {
  pisos: PisoResumen[];
  pisoId: string | null;
  signature: string | null;
  setPiso: (pisoId: string) => void;
  setSnapshot: (payload: { pisos: PisoResumen[]; pisoId: string | null; signature: string | null }) => void;
};

export const useObraStore = create<ObraState>((set) => ({
  pisos: [],
  pisoId: null,
  signature: null,
  setPiso: (pisoId) => set({ pisoId }),
  setSnapshot: (payload) => set(payload),
}));


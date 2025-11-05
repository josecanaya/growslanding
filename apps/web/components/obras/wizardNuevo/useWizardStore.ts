"use client";

import { create } from 'zustand';

export type TipoObra =
  | 'Casa familiar'
  | 'Ampliación'
  | 'Reforma'
  | 'Local comercial'
  | 'Edificio pequeño'
  | 'Otro';

export type LegajoPorPlanta = {
  planta: number;
  archivos: File[];
};

export type WizardState = {
  id: string;
  direccion: string;
  propietario: string;
  tipoObra: TipoObra | '';
  plantas: number;
  terreno: number;
  superficies: { planta: number; cubiertos: number; descubiertos: number }[];
  latitud?: number;
  longitud?: number;
};

export type WizardActions = {
  reset: () => void;
  setField: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  setTipoObra: (tipo: TipoObra | '') => void;
  setPlantas: (cantidad: number) => void;
  updatePlantaSuperficie: (
    index: number,
    field: 'cubiertos' | 'descubiertos',
    value: number
  ) => void;
  getTotalConstruido: () => number;
  ensureId: () => void; // Genera el ID solo en el cliente si no existe
};

function generateId(): string {
  const nums = Math.floor(Math.random() * 90 + 10).toString();
  const letters = Array.from({ length: 4 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join('');
  return `${nums}${letters}`;
}

const initialState = (): WizardState => ({
  // ID vacío inicialmente - se generará en el cliente para evitar errores de hidratación
  id: '',
  direccion: '',
  propietario: '',
  tipoObra: '',
  plantas: 1,
  terreno: 0,
  superficies: [{ planta: 1, cubiertos: 0, descubiertos: 0 }],
  latitud: undefined,
  longitud: undefined,
});

export const useWizardStore = create<WizardState & WizardActions>((set, get) => ({
  ...initialState(),
  reset: () => set(initialState()),
  setField: (key, value) => set({ [key]: value } as Partial<WizardState>),
  setTipoObra: (tipo) => set({ tipoObra: tipo }),
  setPlantas: (cantidad) => {
    const current = get();
    const next = Math.max(1, Math.min(5, cantidad));
    const existing = current.superficies.slice(0, next);
    const added = Array.from({ length: Math.max(0, next - existing.length) }, (_, i) => ({
      planta: existing.length + i + 1,
      cubiertos: 0,
      descubiertos: 0,
    }));
    set({ plantas: next, superficies: [...existing, ...added] });
  },
  updatePlantaSuperficie: (index, field, value) => {
    const current = get();
    if (index < 0 || index >= current.superficies.length) return;
    const next = current.superficies.map((s, i) =>
      i === index ? { ...s, [field]: Math.max(0, value) } : s
    );
    set({ superficies: next });
  },
  getTotalConstruido: () => {
    const { superficies } = get();
    return superficies.reduce((acc, s) => acc + (s.cubiertos || 0) + (s.descubiertos || 0), 0);
  },
  ensureId: () => {
    const current = get();
    // Solo generar ID en el cliente y si no existe
    if (typeof window !== 'undefined' && !current.id) {
      set({ id: generateId() });
    }
  },
}));

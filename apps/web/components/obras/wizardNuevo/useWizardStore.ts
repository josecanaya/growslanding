'use client';

import { create } from 'zustand';

import type { ObraProductKind } from '@/lib/canvas/obraProductKind';
import { defaultTemplateSlugForKind, getOfficialTemplateBySlug } from '@/lib/canvas/officialCanvasTemplates';

export type ModoObra = 'SIMPLE' | 'ESTRUCTURADA';

export type LegajoPorPlanta = {
  planta: number;
  archivos: File[];
};

export type WizardState = {
  id: string;
  direccion: string;
  propietario: string;
  /** Tipo de obra producto (Casa, Edificio, …) */
  obraProductKind: ObraProductKind | '';
  /** @deprecated usar obraProductKind — se mantiene por compatibilidad de UI legacy */
  tipoObra: string;
  plantas: number;
  terreno: number;
  m2Estimados: number;
  superficies: { planta: number; cubiertos: number; descubiertos: number }[];
  latitud?: number;
  longitud?: number;
  fecha_inicio_estimada?: string;
  modoObra: ModoObra;
  canvasTemplateSlug: string;
  canvasTemplateNombre: string;
};

export type WizardActions = {
  reset: () => void;
  setField: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  setObraProductKind: (kind: ObraProductKind | '') => void;
  setCanvasTemplate: (slug: string, nombre: string) => void;
  setPlantas: (cantidad: number) => void;
  updatePlantaSuperficie: (
    index: number,
    field: 'cubiertos' | 'descubiertos',
    value: number
  ) => void;
  getTotalConstruido: () => number;
  getM2CubiertosTotales: () => number;
  ensureId: () => void; // Genera el ID solo en el cliente si no existe
  calcularModoObra: () => ModoObra; // Calcula el modo basado en las reglas MVP
};

function generateId(): string {
  const nums = Math.floor(Math.random() * 90 + 10).toString();
  const letters = Array.from({ length: 4 }, () =>
    String.fromCharCode(65 + Math.floor(Math.random() * 26))
  ).join('');
  return `${nums}${letters}`;
}

function calcularModoObra(state: WizardState): ModoObra {
  return 'SIMPLE';
}

const initialState = (): WizardState => ({
  id: '',
  direccion: '',
  propietario: '',
  obraProductKind: '',
  tipoObra: '',
  plantas: 1,
  terreno: 0,
  m2Estimados: 0,
  superficies: [{ planta: 1, cubiertos: 0, descubiertos: 0 }],
  latitud: undefined,
  longitud: undefined,
  fecha_inicio_estimada: undefined,
  modoObra: 'SIMPLE',
  canvasTemplateSlug: '',
  canvasTemplateNombre: '',
});

export const useWizardStore = create<WizardState & WizardActions>((set, get) => ({
  ...initialState(),
  reset: () => set(initialState()),
  setField: (key, value) => set({ [key]: value } as Partial<WizardState>),
  setObraProductKind: (kind) => {
    set((state) => {
      const slug = kind ? defaultTemplateSlugForKind(kind) : '';
      const tpl = slug ? getOfficialTemplateBySlug(slug) : null;
      return {
        ...state,
        obraProductKind: kind,
        tipoObra: kind,
        canvasTemplateSlug: slug,
        canvasTemplateNombre: tpl?.nombre ?? '',
        modoObra: 'SIMPLE' as ModoObra,
      };
    });
  },
  setCanvasTemplate: (slug, nombre) => set({ canvasTemplateSlug: slug, canvasTemplateNombre: nombre }),
  setPlantas: (cantidad) => {
    const current = get();
    const next = Math.max(1, Math.min(5, cantidad));
    const existing = current.superficies.slice(0, next);
    const added = Array.from({ length: Math.max(0, next - existing.length) }, (_, i) => ({
      planta: existing.length + i + 1,
      cubiertos: 0,
      descubiertos: 0,
    }));
    set((state) => {
      const nuevoState = {
        ...state,
        plantas: next,
        superficies: [...existing, ...added],
      };
      return { ...nuevoState, modoObra: calcularModoObra(nuevoState) };
    });
  },
  updatePlantaSuperficie: (index, field, value) => {
    const current = get();
    if (index < 0 || index >= current.superficies.length) return;
    const next = current.superficies.map((s, i) =>
      i === index ? { ...s, [field]: Math.max(0, value) } : s
    );
    set((state) => {
      const nuevoState = { ...state, superficies: next };
      if (field === 'cubiertos') {
        const total = next.reduce((acc, s) => acc + (s.cubiertos || 0), 0);
        return { ...nuevoState, m2Estimados: total, modoObra: calcularModoObra(nuevoState) };
      }
      return { ...nuevoState, modoObra: calcularModoObra(nuevoState) };
    });
  },
  getTotalConstruido: () => {
    const { superficies } = get();
    return superficies.reduce((acc, s) => acc + (s.cubiertos || 0) + (s.descubiertos || 0), 0);
  },
  getM2CubiertosTotales: () => {
    const { superficies } = get();
    return superficies.reduce((acc, s) => acc + (s.cubiertos || 0), 0);
  },
  ensureId: () => {
    const current = get();
    // Solo generar ID en el cliente y si no existe
    if (typeof window !== 'undefined' && !current.id) {
      set({ id: generateId() });
    }
  },
  calcularModoObra: (): ModoObra => {
    const current = get();
    return calcularModoObra(current);
  },
}));

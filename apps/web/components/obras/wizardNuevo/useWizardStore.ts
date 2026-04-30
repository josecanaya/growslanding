"use client";

import { create } from 'zustand';

import { CALCULO_ACTIVACION_TIPO, calculateFee, type PlanPagoActivacion } from '@/lib/obras/calculateFee';

export type ActivacionParaPagoSnapshot = {
  m2CubiertosTotales: number;
  planPago: PlanPagoActivacion;
  totalUsd: number;
  installmentUsd: number | null;
  calculoTipo: string;
  subtotalUsd: number;
};

export type TipoObra =
  | 'Obra nueva / Desde cero'
  | 'Casa familiar'
  | 'Ampliación'
  | 'Reforma'
  | 'Local comercial'
  | 'Edificio pequeño'
  | 'Otro';

export type ModoObra = 'SIMPLE' | 'ESTRUCTURADA';

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
  fecha_inicio_estimada?: string; // Fecha de inicio estimada de la obra
  modoObra: ModoObra; // Calculado automáticamente
  /** Plan seleccionado en la tarjeta de activación */
  planPagoActivacion: PlanPagoActivacion;
  /** Snapshot al confirmar "Continuar al pago" (sin checkout aún) */
  activacionParaPago: ActivacionParaPagoSnapshot | null;
};

export type WizardActions = {
  reset: () => void;
  setField: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
  setTipoObra: (tipo: TipoObra | '') => void;
  setPlanPagoActivacion: (plan: PlanPagoActivacion) => void;
  confirmarContinuarActivacionParaPago: () => void;
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

// Función helper para calcular el modo de obra basado en las reglas MVP
function calcularModoObra(state: WizardState): ModoObra {
  // Regla 1: Tipo de obra = "Obra nueva / Desde cero" → ESTRUCTURADA siempre
  if (state.tipoObra === 'Obra nueva / Desde cero') {
    return 'ESTRUCTURADA';
  }
  
  // Calcular total de m² cubiertos
  const totalM2Cubiertos = state.superficies.reduce((acc, s) => acc + (s.cubiertos || 0), 0);
  
  // Regla 2: m² cubiertos ≥ 80 → ESTRUCTURADA
  if (totalM2Cubiertos >= 80) {
    return 'ESTRUCTURADA';
  }
  
  // Regla 3: plantas ≥ 2 → ESTRUCTURADA
  if (state.plantas >= 2) {
    return 'ESTRUCTURADA';
  }
  
  // Si no cumple nada: queda SIMPLE
  return 'SIMPLE';
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
  fecha_inicio_estimada: undefined,
  modoObra: 'SIMPLE',
  planPagoActivacion: 'contado',
  activacionParaPago: null,
});

export const useWizardStore = create<WizardState & WizardActions>((set, get) => ({
  ...initialState(),
  reset: () => set(initialState()),
  setField: (key, value) => set({ [key]: value } as Partial<WizardState>),
  setPlanPagoActivacion: (plan) =>
    set((state) => ({
      ...state,
      planPagoActivacion: plan,
      activacionParaPago: null,
    })),
  confirmarContinuarActivacionParaPago: () => {
    const s = get();
    const m2CubiertosTotales = s.superficies.reduce((acc, sf) => acc + (sf.cubiertos || 0), 0);
    const r = calculateFee(m2CubiertosTotales, s.planPagoActivacion);
    set({
      activacionParaPago: {
        m2CubiertosTotales,
        planPago: s.planPagoActivacion,
        totalUsd: r.totalUsd,
        installmentUsd: r.installmentUsd,
        calculoTipo: CALCULO_ACTIVACION_TIPO,
        subtotalUsd: r.subtotalUsd,
      },
    });
  },
  setTipoObra: (tipo) => {
    set((state) => {
      const nuevoState = { ...state, tipoObra: tipo };
      return { ...nuevoState, modoObra: calcularModoObra(nuevoState) };
    });
  },
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
        activacionParaPago: null,
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
      const nuevoState = { ...state, superficies: next, activacionParaPago: null };
      // Recalcular modoObra solo si cambió 'cubiertos' (para m² cubiertos)
      if (field === 'cubiertos') {
        return { ...nuevoState, modoObra: calcularModoObra(nuevoState) };
      }
      return nuevoState;
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

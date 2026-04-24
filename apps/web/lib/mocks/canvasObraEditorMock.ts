/**
 * Mock del editor Canvas (obstacles → tareas → validación → wallet).
 * Sustituir por API cuando se conecte backend.
 */

export type ValidacionEstado = 'pendiente' | 'en_revision' | 'aprobada' | 'rechazada';

export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

export type TareaEditorMock = {
  id: string;
  nombre: string;
  estado: string;
  responsable: string;
  checklist: ChecklistItem[];
  /** Referencias mock a fotos o documentos (solo etiquetas) */
  evidencia: string[];
  validacion: { estado: ValidacionEstado; nota?: string };
  /** Paquete de presupuesto (mock) */
  paqueteId: string | null;
  /** Duración en días (editor de obra) */
  dias: number;
  pos: { x: number; y: number };
};

export type FlowEdgeMock = { id: string; source: string; target: string };

export type BloqueEditorMock = {
  id: string;
  titulo: string;
  descripcion: string;
  tareas: TareaEditorMock[];
  edges: FlowEdgeMock[];
};

export type EtapaEditorMock = {
  id: string;
  slug: 'estructura' | 'obra_gris' | 'terminaciones';
  titulo: string;
  subtitulo: string;
  bloques: BloqueEditorMock[];
};

export type PaquetePresupuestoMock = {
  id: string;
  nombre: string;
  montoRef: string;
  tareaIds: string[];
};

export type CanvasObraMock = {
  obraId: string;
  obraNombre: string;
  etapas: EtapaEditorMock[];
  paquetes: PaquetePresupuestoMock[];
};

const PKG_HORM = 'pkg-horm';
const PKG_INST = 'pkg-inst';
const PKG_TERM = 'pkg-term';

function tareasBloqueCimentacion(): { tareas: TareaEditorMock[]; edges: FlowEdgeMock[] } {
  const t1: TareaEditorMock = {
    id: 't-cim-1',
    nombre: 'Replanteo y estudio de suelo',
    estado: 'Finalizada',
    responsable: 'Carlos Pérez',
    checklist: [
      { id: 'c1', label: 'Croquis firmado', done: true },
      { id: 'c2', label: 'Niveles aprobados', done: true },
    ],
    evidencia: ['foto_001.jpg', 'informe_suelo.pdf'],
    validacion: { estado: 'aprobada', nota: 'Sin observaciones' },
    paqueteId: null,
    dias: 5,
    pos: { x: 40, y: 80 },
  };
  const t2: TareaEditorMock = {
    id: 't-cim-2',
    nombre: 'Excavación cimientos',
    estado: 'En curso',
    responsable: 'María González',
    checklist: [
      { id: 'c1', label: 'Perímetro acotado', done: true },
      { id: 'c2', label: 'Drenaje provisorio', done: false },
    ],
    evidencia: ['avance_zanja.jpg'],
    validacion: { estado: 'en_revision' },
    paqueteId: PKG_HORM,
    dias: 10,
    pos: { x: 320, y: 80 },
  };
  const t3: TareaEditorMock = {
    id: 't-cim-3',
    nombre: 'Hormigón de cimientos',
    estado: 'Pendiente',
    responsable: 'María González',
    checklist: [
      { id: 'c1', label: 'Encofrado OK', done: false },
      { id: 'c2', label: 'Fierro BPS', done: false },
    ],
    evidencia: [],
    validacion: { estado: 'pendiente' },
    paqueteId: PKG_HORM,
    dias: 2,
    pos: { x: 600, y: 80 },
  };
  return {
    tareas: [t1, t2, t3],
    edges: [
      { id: 'e1', source: t1.id, target: t2.id },
      { id: 'e2', source: t2.id, target: t3.id },
    ],
  };
}

function tareasBloqueEstructura(): { tareas: TareaEditorMock[]; edges: FlowEdgeMock[] } {
  const t1: TareaEditorMock = {
    id: 't-est-1',
    nombre: 'Columnas PB',
    estado: 'En curso',
    responsable: 'Juan Ibarra',
    checklist: [
      { id: 'c1', label: 'Vibrado', done: true },
      { id: 'c2', label: 'Curado 7d', done: false },
    ],
    evidencia: ['columna_pb_1.jpg'],
    validacion: { estado: 'pendiente' },
    paqueteId: PKG_HORM,
    dias: 7,
    pos: { x: 40, y: 120 },
  };
  const t2: TareaEditorMock = {
    id: 't-est-2',
    nombre: 'Losas entrepiso',
    estado: 'Pendiente',
    responsable: 'Juan Ibarra',
    checklist: [
      { id: 'c1', label: 'Encofrado losa', done: false },
    ],
    evidencia: [],
    validacion: { estado: 'pendiente' },
    paqueteId: PKG_HORM,
    dias: 14,
    pos: { x: 360, y: 60 },
  };
  const t3: TareaEditorMock = {
    id: 't-est-3',
    nombre: 'Escalera húmeda',
    estado: 'Pendiente',
    responsable: 'Laura Méndez',
    checklist: [],
    evidencia: [],
    validacion: { estado: 'pendiente' },
    paqueteId: null,
    dias: 5,
    pos: { x: 360, y: 220 },
  };
  return {
    tareas: [t1, t2, t3],
    edges: [
      { id: 'e1', source: t1.id, target: t2.id },
      { id: 'e2', source: t1.id, target: t3.id },
    ],
  };
}

function tareasBloqueMamp(): { tareas: TareaEditorMock[]; edges: FlowEdgeMock[] } {
  const t1: TareaEditorMock = {
    id: 't-mam-1',
    nombre: 'Mampostería 4º piso',
    estado: 'En curso',
    responsable: 'Luis R.',
    checklist: [
      { id: 'c1', label: 'Alineación muro', done: true },
    ],
    evidencia: ['mam_4.jpg'],
    validacion: { estado: 'en_revision' },
    paqueteId: null,
    dias: 8,
    pos: { x: 80, y: 100 },
  };
  const t2: TareaEditorMock = {
    id: 't-mam-2',
    nombre: 'Revoque grueso',
    estado: 'Pendiente',
    responsable: 'Luis R.',
    checklist: [
      { id: 'c1', label: 'Fondo previo', done: false },
    ],
    evidencia: [],
    validacion: { estado: 'pendiente' },
    paqueteId: null,
    dias: 6,
    pos: { x: 400, y: 100 },
  };
  return {
    tareas: [t1, t2],
    edges: [{ id: 'e1', source: t1.id, target: t2.id }],
  };
}

function tareasBloqueInst(): { tareas: TareaEditorMock[]; edges: FlowEdgeMock[] } {
  const t1: TareaEditorMock = {
    id: 't-ins-1',
    nombre: 'Canalizaciones eléctricas',
    estado: 'Pendiente',
    responsable: 'Electro Sur',
    checklist: [
      { id: 'c1', label: 'Tendido 4º piso', done: false },
    ],
    evidencia: [],
    validacion: { estado: 'pendiente' },
    paqueteId: PKG_INST,
    dias: 4,
    pos: { x: 100, y: 90 },
  };
  const t2: TareaEditorMock = {
    id: 't-ins-2',
    nombre: 'Tablero / llaves',
    estado: 'Pendiente',
    responsable: 'Electro Sur',
    checklist: [],
    evidencia: [],
    validacion: { estado: 'pendiente' },
    paqueteId: PKG_INST,
    dias: 2,
    pos: { x: 420, y: 90 },
  };
  return {
    tareas: [t1, t2],
    edges: [{ id: 'e1', source: t1.id, target: t2.id }],
  };
}

function tareasBloquePintura(): { tareas: TareaEditorMock[]; edges: FlowEdgeMock[] } {
  const t1: TareaEditorMock = {
    id: 't-pin-1',
    nombre: 'Sellador y látex interior',
    estado: 'Pendiente',
    responsable: 'Ana García',
    checklist: [
      { id: 'c1', label: 'Humedad < 60%', done: false },
    ],
    evidencia: [],
    validacion: { estado: 'pendiente' },
    paqueteId: PKG_TERM,
    dias: 3,
    pos: { x: 60, y: 100 },
  };
  return {
    tareas: [t1],
    edges: [],
  };
}

const ESTRUCTURA: EtapaEditorMock = {
  id: 'et-1',
  slug: 'estructura',
  titulo: 'Estructura',
  subtitulo: 'Cimentación y columna / losas',
  bloques: [
    {
      id: 'bl-1',
      titulo: 'Cimentación',
      descripcion: 'Fundación y conexión a estructura',
      ...tareasBloqueCimentacion(),
    },
    {
      id: 'bl-2',
      titulo: 'Hormigón visión',
      descripcion: 'Columnas, losas, escalera',
      ...tareasBloqueEstructura(),
    },
  ],
};

const OBRA_GRIS: EtapaEditorMock = {
  id: 'et-2',
  slug: 'obra_gris',
  titulo: 'Obra gris',
  subtitulo: 'Mampostería e instalaciones en obra',
  bloques: [
    {
      id: 'bl-3',
      titulo: 'Cerramientos',
      descripcion: 'Mampostería y revoques gruesos',
      ...tareasBloqueMamp(),
    },
    {
      id: 'bl-4',
      titulo: 'Instalaciones',
      descripcion: 'Tendido eléctrico',
      ...tareasBloqueInst(),
    },
  ],
};

const TERMINACIONES: EtapaEditorMock = {
  id: 'et-3',
  slug: 'terminaciones',
  titulo: 'Terminaciones',
  subtitulo: 'Pintura, revestimientos, detalle',
  bloques: [
    {
      id: 'bl-5',
      titulo: 'Pintura y limpieza',
      descripcion: 'Cierre de obra blanca',
      ...tareasBloquePintura(),
    },
  ],
};

const DEFAULT_PAQUETES: PaquetePresupuestoMock[] = [
  { id: PKG_HORM, nombre: 'Paquete hormigón estructural', montoRef: 'USD 48.200', tareaIds: [] },
  { id: PKG_INST, nombre: 'Paquete instalaciones eléctricas', montoRef: 'USD 12.400', tareaIds: [] },
  { id: PKG_TERM, nombre: 'Paquete terminaciones livianas', montoRef: 'USD 8.900', tareaIds: [] },
];

function syncPaqueteTareaIds(etapas: EtapaEditorMock[], paquetes: PaquetePresupuestoMock[]) {
  const byPkg = new Map<string, string[]>();
  for (const p of paquetes) byPkg.set(p.id, []);
  for (const e of etapas) {
    for (const b of e.bloques) {
      for (const t of b.tareas) {
        if (t.paqueteId && byPkg.has(t.paqueteId)) {
          byPkg.get(t.paqueteId)!.push(t.id);
        }
      }
    }
  }
  return paquetes.map((p) => ({ ...p, tareaIds: byPkg.get(p.id) ?? [] }));
}

const SAN_MARTIN: CanvasObraMock = {
  obraId: 'obra-san-martin',
  obraNombre: 'Edificio San Martín',
  etapas: [ESTRUCTURA, OBRA_GRIS, TERMINACIONES],
  paquetes: syncPaqueteTareaIds([ESTRUCTURA, OBRA_GRIS, TERMINACIONES], DEFAULT_PAQUETES),
};

const DEFAULT_OBRA: CanvasObraMock = {
  obraId: 'default',
  obraNombre: 'Obra (mock genérico)',
  etapas: [ESTRUCTURA, OBRA_GRIS, TERMINACIONES],
  paquetes: syncPaqueteTareaIds([ESTRUCTURA, OBRA_GRIS, TERMINACIONES], DEFAULT_PAQUETES),
};

function cloneEtapas(etapas: EtapaEditorMock[]): EtapaEditorMock[] {
  return JSON.parse(JSON.stringify(etapas)) as EtapaEditorMock[];
}

function clonePaquetes(pkgs: PaquetePresupuestoMock[]): PaquetePresupuestoMock[] {
  return JSON.parse(JSON.stringify(pkgs)) as PaquetePresupuestoMock[];
}

/**
 * Modelo mock inicial; copia profunda para estado mutable en el editor.
 */
export function getCanvasObraEditorMock(obraId: string): CanvasObraMock {
  if (obraId === 'obra-san-martin') {
    return {
      ...SAN_MARTIN,
      etapas: cloneEtapas(SAN_MARTIN.etapas),
      paquetes: clonePaquetes(SAN_MARTIN.paquetes),
    };
  }
  return {
    ...DEFAULT_OBRA,
    obraId,
    etapas: cloneEtapas(DEFAULT_OBRA.etapas),
    paquetes: clonePaquetes(DEFAULT_OBRA.paquetes),
  };
}

export function newId(prefix: string) {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now()}`;
}

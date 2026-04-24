/**
 * Mock de obras y tareas para grabar el video demo.
 * Cuando está activo, la app muestra SOLO estos mocks (no los datos del usuario).
 *
 * Activar:
 *   - En .env.local: NEXT_PUBLIC_DEMO_VIDEO=true y reiniciar dev server.
 *   - O en la URL: ?demo=1 (ej: /cliente/dashboard?demo=1)
 */

/** Org fijo para los mocks: así siempre ves solo las obras demo, sin mezclar con tu usuario. */
export const DEMO_ORG_ID = 'demo-video-org-id';

const MOCK_OBRA_A_ID = 'demo-obra-a-fisherton-00000001';
const MOCK_OBRA_B_ID = 'demo-obra-b-pueblo-esther-00002';
/** Obra casa con 60+ tareas para video (mismo id que en Obras / cliente). */
export const DEMO_OBRA_CASA_ID = 'demo-obra-1-casa-familiar';

const TAREAS_OBRA_A = [
  'Replanteo', 'Excavación', 'Cimientos', 'Encadenado', 'Mampostería PB', 'Losa PB',
  'Mampostería P1', 'Losa P1', 'Revoque grueso', 'Revoque fino', 'Instalación eléctrica',
  'Instalación sanitaria', 'Pintura interior', 'Pintura exterior', 'Cielorrasos', 'Aberturas',
  'Pisos', 'Revestimientos', 'Carpintería', 'Impermeabilización', 'Cerco perimetral',
  'Contrapisos', 'Instalación gas', 'Terminaciones baño', 'Terminaciones cocina',
  'Iluminación', 'Cloaca', 'Pavimento', 'Landscaping', 'Limpieza final',
];

const TAREAS_OBRA_B = [
  'Replanteo y nivelación', 'Excavación general', 'Hormigón de cimientos', 'Encadenado inferior',
  'Mampostería planta baja', 'Losa alivianada PB', 'Columnas y vigas', 'Mampostería primer piso',
  'Losa primer piso', 'Estructura segundo piso', 'Revoque interior', 'Revoque exterior',
  'Instalación eléctrica completa', 'Instalación sanitaria', 'Pintura', 'Cielorrasos de yeso',
  'Carpintería de aluminio', 'Pisos cerámicos', 'Revestimientos', 'Impermeabilización cubierta',
  'Ascensores (preinstalación)', 'Gas y calefacción', 'Terminaciones', 'Instalación de artefactos',
  'Señalización', 'Cerco y portón', 'Pavimento acceso', 'Espacios verdes', 'Seguridad perimetral',
  'Entrega y acta',
];

/** 40 tareas para video demo (casa), orden lógico – muchas tareas para grabar video. */
const TAREAS_OBRA_CASA = [
  'Replanteo y límites',
  'Limpieza y desmalezado',
  'Excavación de fundación',
  'Hormigón de cimientos',
  'Encadenado inferior',
  'Columnas y mampostería PB',
  'Losa PB',
  'Mampostería P1',
  'Losa P1 / techo',
  'Vigas y columnas P1',
  'Mampostería P2',
  'Losa cubierta',
  'Impermeabilización cubierta',
  'Revoque exterior',
  'Revoque interior',
  'Contrapisos',
  'Instalación eléctrica',
  'Instalación sanitaria',
  'Instalación gas',
  'Baja tensión y datos',
  'Pisos cerámicos',
  'Revestimientos',
  'Carpintería de aluminio',
  'Carpintería interior',
  'Pintura interior',
  'Pintura exterior',
  'Cielorrasos',
  'Iluminación',
  'Artefactos sanitarios',
  'Grifería y accesorios',
  'Cerco perimetral',
  'Pavimento acceso',
  'Desagües pluviales',
  'Instalación termotanque',
  'Calefacción',
  'Aire acondicionado',
  'Portón y cerraduras',
  'Limpieza final',
  'Entrega y acta',
];

function uuidFromSeed(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i);
  }
  const hex = Math.abs(h).toString(16).padStart(8, '0');
  return `${hex}-0000-4000-8000-${seed.slice(0, 12).padEnd(12, '0').replace(/\s/g, '0')}`;
}

const DEMO_STORAGE_KEY = 'grows-demo-video';

export function isDemoVideoEnabled(): boolean {
  if (typeof window === 'undefined') {
    return (process.env.NEXT_PUBLIC_DEMO_VIDEO ?? '') === 'true';
  }
  const env = (process.env.NEXT_PUBLIC_DEMO_VIDEO ?? '') === 'true';
  const url = window.location?.search?.includes('demo=1');
  if (url) {
    try {
      sessionStorage.setItem(DEMO_STORAGE_KEY, '1');
    } catch {
      // ignore
    }
  }
  const stored = sessionStorage.getItem(DEMO_STORAGE_KEY) === '1';
  return env || url || stored;
}

/** Obras en formato crudo (dashboard y listado). */
export function getMockObrasRaw(orgId: string): Array<{
  id: string;
  org_id: string;
  name: string;
  address: string | null;
  estado: string | null;
  created_at: string;
  updated_at: string;
  propietario?: string | null;
  tipo_obra?: string | null;
}> {
  const now = new Date().toISOString();
  return [
    {
      id: MOCK_OBRA_A_ID,
      org_id: orgId,
      name: 'Demo Casa Fisherton',
      address: 'Fisherton, Rosario, Santa Fe',
      estado: 'ACTIVA',
      created_at: now,
      updated_at: now,
      propietario: 'Cliente Demo',
      tipo_obra: 'nueva',
    },
    {
      id: MOCK_OBRA_B_ID,
      org_id: orgId,
      name: 'Demo Condominio Pueblo Esther',
      address: 'Pueblo Esther, Santa Fe',
      estado: 'ACTIVA',
      created_at: now,
      updated_at: now,
      propietario: 'Cliente Demo',
      tipo_obra: 'nueva',
    },
    {
      id: DEMO_OBRA_CASA_ID,
      org_id: orgId,
      name: 'CLIENTE POR DEFECTO (nueva)',
      address: 'Obra Casa Familiar',
      estado: 'ACTIVA',
      created_at: now,
      updated_at: now,
      propietario: 'Cliente por defecto',
      tipo_obra: 'nueva',
    },
  ];
}

/** Tareas en formato crudo para dashboard (id, obra_id, estado, cuadrilla_id, updated_at). */
export function getMockTareasRaw(orgId: string): Array<{
  id: string;
  obra_id: string;
  estado: string;
  cuadrilla_id: string | null;
  updated_at: string;
  title?: string;
}> {
  const now = new Date().toISOString();
  const out: Array<{ id: string; obra_id: string; estado: string; cuadrilla_id: string | null; updated_at: string; title?: string }> = [];
  TAREAS_OBRA_A.forEach((title, i) => {
    out.push({
      id: uuidFromSeed(`a-${i}-${title}`),
      obra_id: MOCK_OBRA_A_ID,
      estado: 'pendiente',
      cuadrilla_id: null,
      updated_at: now,
      title,
    });
  });
  TAREAS_OBRA_B.forEach((title, i) => {
    out.push({
      id: uuidFromSeed(`b-${i}-${title}`),
      obra_id: MOCK_OBRA_B_ID,
      estado: 'pendiente',
      cuadrilla_id: null,
      updated_at: now,
      title,
    });
  });
  TAREAS_OBRA_CASA.forEach((title, i) => {
    out.push({
      id: uuidFromSeed(`casa-${i}-${title}`),
      obra_id: DEMO_OBRA_CASA_ID,
      estado: 'pendiente',
      cuadrilla_id: null,
      updated_at: now,
      title,
    });
  });
  return out;
}

/** Obras con tareas embebidas para TareasSection (formato ya con tareas por obra). */
export function getMockObrasWithTareasForTareasSection(orgId: string): Array<{
  id: string;
  org_id: string;
  name: string;
  address: string | null;
  estado: string | null;
  created_at: string;
  propietario?: string | null;
  tipo_obra?: string | null;
  tareas: Array<{ id: string; estado: string }>;
}> {
  const obras = getMockObrasRaw(orgId);
  const tareas = getMockTareasRaw(orgId);
  return obras.map((o) => ({
    ...o,
    tareas: tareas.filter((t) => t.obra_id === o.id).map((t) => ({ id: t.id, estado: t.estado })),
  }));
}

const COL_WIDTH = 240;
const ROW_HEIGHT = 140;
/** Una sola fila para la casa: flujo estrictamente izquierda → derecha (ordenado). */
const CASA_SINGLE_ROW = true;

/** Cantidad de tareas en el lienzo para el video demo (visible y organizadas). */
const CANTIDAD_TAREAS_CANVAS_DEMO_VIDEO = 15;

/** Duraciones en días por índice para las 15 tareas del canvas demo (camino crítico visible). */
const DURACIONES_CANVAS_DEMO_VIDEO = [15, 2, 3, 2, 4, 2, 3, 2, 5, 2, 3, 2, 4, 2, 2];

export type MockPrecedencia = {
  dependeDe: string | string[] | null;
  duracion: number;
  posX: number | null;
  posY: number | null;
};

/**
 * Orden en el lienzo y precedencias (camino crítico) para la obra demo.
 * Para la obra casa: 15 tareas en el lienzo (video) y el resto quedan "disponibles".
 */
export function getMockCanvasOrderAndPrecedencias(obraId: string): {
  order: string[];
  precedencias: Record<string, MockPrecedencia>;
} {
  if (obraId === DEMO_OBRA_CASA_ID) {
    const allIds = TAREAS_OBRA_CASA.map((title, i) => uuidFromSeed(`casa-${i}-${title}`));
    const order = allIds.slice(0, CANTIDAD_TAREAS_CANVAS_DEMO_VIDEO);
    const precedencias: Record<string, MockPrecedencia> = {};
    order.forEach((taskId, i) => {
      const prevId = i === 0 ? null : order[i - 1];
      const duracion = DURACIONES_CANVAS_DEMO_VIDEO[i] ?? 2;
      if (CASA_SINGLE_ROW) {
        precedencias[taskId] = {
          dependeDe: prevId,
          duracion,
          posX: i * COL_WIDTH,
          posY: 0,
        };
      } else {
        const col = i % 13;
        const row = Math.floor(i / 13);
        precedencias[taskId] = {
          dependeDe: prevId,
          duracion,
          posX: col * COL_WIDTH,
          posY: row * ROW_HEIGHT,
        };
      }
    });
    return { order, precedencias };
  }
  if (obraId === MOCK_OBRA_A_ID) {
    const order = TAREAS_OBRA_A.map((title, i) => uuidFromSeed(`a-${i}-${title}`));
    const precedencias: Record<string, MockPrecedencia> = {};
    order.forEach((taskId, i) => {
      precedencias[taskId] = {
        dependeDe: i === 0 ? null : order[i - 1],
        duracion: 2,
        posX: i * COL_WIDTH,
        posY: 0,
      };
    });
    return { order, precedencias };
  }
  if (obraId === MOCK_OBRA_B_ID) {
    const order = TAREAS_OBRA_B.map((title, i) => uuidFromSeed(`b-${i}-${title}`));
    const precedencias: Record<string, MockPrecedencia> = {};
    order.forEach((taskId, i) => {
      precedencias[taskId] = {
        dependeDe: i === 0 ? null : order[i - 1],
        duracion: 2,
        posX: i * COL_WIDTH,
        posY: 0,
      };
    });
    return { order, precedencias };
  }
  return { order: [], precedencias: {} };
}

// ——— Asigna (presupuestos) demo ———

/** 5 socios de fantasía para la sección Asigna (presupuestos por etapa). */
export const SOCIOS_ASIGNA_DEMO: Array<{ id: string; nombre: string }> = [
  { id: 'demo-socio-1-alfa', nombre: 'Alfa Construcciones SRL' },
  { id: 'demo-socio-2-beta', nombre: 'Beta Obras y Servicios' },
  { id: 'demo-socio-3-gamma', nombre: 'Gamma & Asociados' },
  { id: 'demo-socio-4-delta', nombre: 'Delta Refacciones' },
  { id: 'demo-socio-5-epsilon', nombre: 'Epsilon Habilitaciones' },
];

/** Nombre del primer socio demo (único que tiene PDF en demo). */
export const PRIMER_SOCIO_ASIGNA_DEMO_NOMBRE = SOCIOS_ASIGNA_DEMO[0].nombre;

/** Etapa por índice: 0–12 estructura, 13–25 obra gris, 26–39 terminaciones. */
function etapaCasaByIndex(i: number): 'estructura' | 'obra gris' | 'terminaciones' {
  if (i <= 12) return 'estructura';
  if (i <= 25) return 'obra gris';
  return 'terminaciones';
}

export type MockTaskInfoAsigna = {
  id: string;
  titulo: string;
  etapa: string | null;
  obraId: string;
  responsable: string | null;
  cuadrillaId: string | null;
  estado: string | null;
  duracion_estimada?: number | null;
};

/** Tareas mock para AsignarSection cuando obraId es la obra demo casa. */
export function getMockTareasAsigna(obraId: string): MockTaskInfoAsigna[] {
  if (obraId !== DEMO_OBRA_CASA_ID) return [];
  const now = new Date().toISOString();
  return TAREAS_OBRA_CASA.map((title, i) => ({
    id: uuidFromSeed(`casa-${i}-${title}`),
    titulo: title,
    etapa: etapaCasaByIndex(i),
    obraId,
    responsable: null,
    cuadrillaId: null,
    estado: 'pendiente',
    duracion_estimada: i % 3 === 0 ? 5 : 3,
  }));
}

export type MockPresupuestoRaw = {
  id: string;
  tarea_id: string;
  created_at: string;
  updated_at: string;
  monto: number | null;
  moneda: string | null;
  estado: string | null;
  notas: string | null;
  socio_id: string | null;
  cantidad?: number | null;
  unidad?: string | null;
  tiene_pdf?: boolean;
};

/**
 * Máximo 5 presupuestos por etapa (uno por socio), 15 en total para las 3 etapas.
 * Todos se asignan a la primera tarea de la etapa para no inflar números.
 * Solo el primer socio (Alfa) tiene PDF por sección.
 */
export function getMockPresupuestosParaEtapa(
  etapaKey: string,
  tareaIds: string[]
): MockPresupuestoRaw[] {
  if (tareaIds.length === 0) return [];
  const primeraTareaId = tareaIds[0]!;
  const now = new Date().toISOString();
  const out: MockPresupuestoRaw[] = [];
  const montosBase = [125000, 118000, 132000, 121000, 128000];
  const duraciones = [5, 4, 6, 4, 5];

  SOCIOS_ASIGNA_DEMO.forEach((socio, socioIndex) => {
    out.push({
      id: `demo-pres-${etapaKey}-${primeraTareaId}-${socio.id}`,
      tarea_id: primeraTareaId,
      created_at: now,
      updated_at: now,
      monto: montosBase[socioIndex]!,
      moneda: 'ARS',
      estado: 'PENDIENTE',
      notas: `Oferta demo. Aprox. ${duraciones[socioIndex]} días.`,
      socio_id: socio.id,
      cantidad: 1,
      unidad: 'global',
      tiene_pdf: socioIndex === 0,
    });
  });
  return out;
}

// ——— Validar (tareas pendientes de validación) demo ———

export type MockValidarSubtarea = {
  id: string;
  estado: string;
  montoEstimado: number | null;
  montoValidado: number | null;
  fecha: string | null;
  orden: number | null;
  bloque_index?: number | null;
  evidencia_url?: string | null;
  evidencia_cargada?: boolean | null;
};

export type MockValidarTarea = {
  id: string;
  titulo: string;
  descripcion: string | null;
  obraId: string;
  obraNombre: string;
  responsable: string | null;
  cuadrillaNombre: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  evidencias: Array<{ url: string; path: string; created_at?: string }>;
  estadoOficial: 'pendiente' | 'en_progreso' | 'para_validar' | 'validada' | 'rechazada';
  subtareas: MockValidarSubtarea[];
};

/**
 * Tareas con bloques para validar (FSM: para_validar → validada | rechazada).
 * Solo para DEMO_OBRA_CASA_ID; en demo no se usa la base de datos.
 */
export function getMockTareasValidar(obraId: string | null): MockValidarTarea[] {
  if (obraId !== DEMO_OBRA_CASA_ID) return [];
  const base = new Date();
  base.setDate(base.getDate() - 10);
  const fechaInicio = base.toISOString().split('T')[0];
  const obraNombre = 'Casa Familiar – Juan Pérez';
  const cuadrillaNombre = 'Cuadrilla Demo';

  const tareas: MockValidarTarea[] = [
    {
      id: uuidFromSeed('casa-0-Replanteo y límites'),
      titulo: 'Replanteo y límites',
      descripcion: 'Replanteo y marcado de límites según planos.',
      obraId: DEMO_OBRA_CASA_ID,
      obraNombre,
      responsable: 'Cuadrilla Demo',
      cuadrillaNombre,
      fechaInicio,
      fechaFin: null,
      evidencias: [],
      estadoOficial: 'para_validar',
      subtareas: [
        { id: 'demo-sub-val-1a', estado: 'para_validar', montoEstimado: 45000, montoValidado: null, fecha: fechaInicio, orden: 1, bloque_index: 0, evidencia_url: null, evidencia_cargada: true },
        { id: 'demo-sub-val-1b', estado: 'validado', montoEstimado: 45000, montoValidado: 45000, fecha: fechaInicio, orden: 2, bloque_index: 1, evidencia_url: null, evidencia_cargada: true },
      ],
    },
    {
      id: uuidFromSeed('casa-1-Limpieza y desmalezado'),
      titulo: 'Limpieza y desmalezado',
      descripcion: 'Limpieza del terreno y desmalezado.',
      obraId: DEMO_OBRA_CASA_ID,
      obraNombre,
      responsable: 'Cuadrilla Demo',
      cuadrillaNombre,
      fechaInicio,
      fechaFin: null,
      evidencias: [],
      estadoOficial: 'para_validar',
      subtareas: [
        { id: 'demo-sub-val-2a', estado: 'para_validar', montoEstimado: 38000, montoValidado: null, fecha: fechaInicio, orden: 1, bloque_index: 0, evidencia_url: null, evidencia_cargada: true },
      ],
    },
    {
      id: uuidFromSeed('casa-2-Excavación de fundación'),
      titulo: 'Excavación de fundación',
      descripcion: 'Excavación según planos de fundación.',
      obraId: DEMO_OBRA_CASA_ID,
      obraNombre,
      responsable: 'Cuadrilla Demo',
      cuadrillaNombre,
      fechaInicio,
      fechaFin: null,
      evidencias: [],
      estadoOficial: 'para_validar',
      subtareas: [
        { id: 'demo-sub-val-3a', estado: 'validado', montoEstimado: 120000, montoValidado: 120000, fecha: fechaInicio, orden: 1, bloque_index: 0, evidencia_url: null, evidencia_cargada: true },
        { id: 'demo-sub-val-3b', estado: 'para_validar', montoEstimado: 85000, montoValidado: null, fecha: fechaInicio, orden: 2, bloque_index: 1, evidencia_url: null, evidencia_cargada: true },
      ],
    },
    {
      id: uuidFromSeed('casa-3-Hormigón de cimientos'),
      titulo: 'Hormigón de cimientos',
      descripcion: 'Hormigonado de cimientos.',
      obraId: DEMO_OBRA_CASA_ID,
      obraNombre,
      responsable: 'Cuadrilla Demo',
      cuadrillaNombre,
      fechaInicio,
      fechaFin: null,
      evidencias: [],
      estadoOficial: 'para_validar',
      subtareas: [
        { id: 'demo-sub-val-4a', estado: 'para_validar', montoEstimado: 185000, montoValidado: null, fecha: fechaInicio, orden: 1, bloque_index: 0, evidencia_url: null, evidencia_cargada: true },
      ],
    },
    {
      id: uuidFromSeed('casa-4-Encadenado inferior'),
      titulo: 'Encadenado inferior',
      descripcion: 'Encadenado inferior según especificación.',
      obraId: DEMO_OBRA_CASA_ID,
      obraNombre,
      responsable: 'Cuadrilla Demo',
      cuadrillaNombre,
      fechaInicio,
      fechaFin: null,
      evidencias: [],
      estadoOficial: 'para_validar',
      subtareas: [
        { id: 'demo-sub-val-5a', estado: 'para_validar', montoEstimado: 92000, montoValidado: null, fecha: fechaInicio, orden: 1, bloque_index: 0, evidencia_url: null, evidencia_cargada: true },
        { id: 'demo-sub-val-5b', estado: 'para_validar', montoEstimado: 92000, montoValidado: null, fecha: fechaInicio, orden: 2, bloque_index: 1, evidencia_url: null, evidencia_cargada: false },
      ],
    },
  ];
  return tareas;
}

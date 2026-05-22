/**
 * Perfiles de profundidad del canvas multinivel según tipo de obra.
 * Un único lugar de verdad para cadenas de niveles y etiquetas de UI.
 */

import type { CanvasNivelTipo } from '@/lib/types/canvasMultinivel';

export const CANVAS_PROJECT_KINDS = [
  'edificio_multifamiliar',
  'vivienda_unifamiliar',
  'galpon_industrial',
  'reforma',
  'ampliacion',
  'local_comercial',
  'simple',
  'otro',
] as const;

export type CanvasProjectKind = (typeof CANVAS_PROJECT_KINDS)[number];

/** Tipos elegibles en wizard (sin modo simple reservado). */
export type CanvasWizardProjectKind = Exclude<CanvasProjectKind, 'simple'>;

const FULL_ORDER: CanvasNivelTipo[] = ['etapa', 'planta', 'sector', 'ambiente', 'tarea'];

/** Cadena completa desde etapa raíz hasta tarea (inclusive). */
export const CANVAS_TYPE_CHAIN_BY_KIND: Record<CanvasProjectKind, CanvasNivelTipo[]> = {
  edificio_multifamiliar: ['etapa', 'planta', 'sector', 'ambiente', 'tarea'],
  vivienda_unifamiliar: ['etapa', 'planta', 'ambiente', 'tarea'],
  galpon_industrial: ['etapa', 'planta', 'sector', 'tarea'],
  reforma: ['etapa', 'planta', 'ambiente', 'tarea'],
  ampliacion: ['etapa', 'planta', 'ambiente', 'tarea'],
  local_comercial: ['etapa', 'planta', 'ambiente', 'tarea'],
  simple: ['etapa', 'tarea'],
  otro: ['etapa', 'planta', 'ambiente', 'tarea'],
};

export const WIZARD_TIPO_OBRA_OPCIONES: ReadonlyArray<{
  kind: CanvasWizardProjectKind;
  label: string;
}> = [
  { kind: 'edificio_multifamiliar', label: 'Edificio multifamiliar' },
  { kind: 'vivienda_unifamiliar', label: 'Vivienda unifamiliar' },
  { kind: 'galpon_industrial', label: 'Galpón industrial' },
  { kind: 'reforma', label: 'Reforma' },
  { kind: 'ampliacion', label: 'Ampliación' },
  { kind: 'local_comercial', label: 'Local comercial' },
  { kind: 'otro', label: 'Otro' },
];

export const CANVAS_PROJECT_KIND_LABEL: Record<CanvasProjectKind, string> = {
  edificio_multifamiliar: 'Edificio multifamiliar',
  vivienda_unifamiliar: 'Vivienda unifamiliar',
  galpon_industrial: 'Galpón industrial',
  reforma: 'Reforma',
  ampliacion: 'Ampliación',
  local_comercial: 'Local comercial',
  simple: 'Tareas sueltas',
  otro: 'Otro',
};

/** Compatibilidad con API / dominio legacy (tres valores). */
export function canvasProjectKindToLegacyApiTipoObra(
  k: CanvasProjectKind,
): 'nueva' | 'reforma' | 'ampliacion' {
  if (k === 'reforma') return 'reforma';
  if (k === 'ampliacion') return 'ampliacion';
  return 'nueva';
}

export function isCanvasProjectKind(v: string | undefined | null): v is CanvasProjectKind {
  return !!v && (CANVAS_PROJECT_KINDS as readonly string[]).includes(v);
}

export function normalizeCanvasProjectKind(
  v: string | undefined | null,
): CanvasProjectKind {
  if (isCanvasProjectKind(v)) return v;
  return 'edificio_multifamiliar';
}

/**
 * Perfil Canvas sugerido según cuántos niveles de OutlineNumber hay con hijos en el MSP
 * (contenedores reales antes de las hojas). No debe forzar el XML ni pisar el tipo de obra
 * guardado salvo donde el import lo use solo para crear nodos válidos.
 */
export function inferAdaptiveImportKind(groupingTierCount: number): CanvasProjectKind {
  const tc = Math.max(0, groupingTierCount);
  if (tc <= 1) return 'simple';
  /** 2 niveles agrupadores (p. ej. fase/rubro) → cadena corta típica de reformas */
  if (tc === 2) return 'reforma';
  /** 3 niveles → plantas y ambientes / sectores típicos de vivienda o galpón */
  if (tc === 3) return 'vivienda_unifamiliar';
  /** 4+ → profundidad tipo edificación con departamentos/interior */
  return 'edificio_multifamiliar';
}

function orderOf(t: CanvasNivelTipo): number {
  return FULL_ORDER.indexOf(t);
}

/**
 * Tipo de hijo a crear bajo `parent` según el perfil.
 * `parent === null` → vista obra: siempre etapa.
 */
export function nextChildCanvasType(
  parent: { type: CanvasNivelTipo } | null,
  kind: CanvasProjectKind,
): CanvasNivelTipo | null {
  const chain = CANVAS_TYPE_CHAIN_BY_KIND[kind];
  if (!parent) return chain[0] ?? 'etapa';

  const idx = chain.indexOf(parent.type);
  if (idx !== -1) {
    if (idx >= chain.length - 1) return null;
    return chain[idx + 1] ?? null;
  }

  const pi = orderOf(parent.type);
  if (pi < 0) return null;
  for (let i = pi + 1; i < FULL_ORDER.length; i++) {
    const candidate = FULL_ORDER[i]!;
    if (chain.includes(candidate)) return candidate;
  }
  return null;
}

type LevelPresentation = {
  tipoNodoLabel: string;
  crearLabel: string;
  defaultTitle: string;
};

function defaultPresentation(t: CanvasNivelTipo): LevelPresentation {
  switch (t) {
    case 'etapa':
      return {
        tipoNodoLabel: 'Fase / Etapa',
        crearLabel: '+ Etapa',
        defaultTitle: 'Nueva etapa',
      };
    case 'planta':
      return {
        tipoNodoLabel: 'Piso / Planta',
        crearLabel: '+ Piso / Planta',
        defaultTitle: 'Nueva planta',
      };
    case 'sector':
      return {
        tipoNodoLabel: 'Departamento / Sector interno',
        crearLabel: '+ Departamento',
        defaultTitle: 'Nuevo departamento',
      };
    case 'ambiente':
      return { tipoNodoLabel: 'Ambiente', crearLabel: '+ Ambiente', defaultTitle: 'Nuevo ambiente' };
    case 'tarea':
      return { tipoNodoLabel: 'Tarea', crearLabel: '+ Tarea', defaultTitle: 'Nueva tarea' };
  }
}

/** Etiquetas según tipo de obra (p. ej. galpón: planta → sector general). */
export function canvasLevelPresentation(
  t: CanvasNivelTipo,
  kind: CanvasProjectKind,
): LevelPresentation {
  if (kind === 'galpon_industrial') {
    if (t === 'planta') {
      return {
        tipoNodoLabel: 'Sector general',
        crearLabel: '+ Sector',
        defaultTitle: 'Nuevo sector',
      };
    }
    if (t === 'sector') {
      return {
        tipoNodoLabel: 'Área operativa',
        crearLabel: '+ Área',
        defaultTitle: 'Nueva área',
      };
    }
  }

  if (t === 'planta' && (kind === 'reforma' || kind === 'ampliacion' || kind === 'local_comercial')) {
    return {
      tipoNodoLabel: 'Planta / Sector',
      crearLabel: '+ Planta / Sector',
      defaultTitle: 'Nueva planta / sector',
    };
  }

  if (t === 'sector' && kind === 'edificio_multifamiliar') {
    return {
      tipoNodoLabel: 'Departamento / Sector interno',
      crearLabel: '+ Departamento',
      defaultTitle: 'Nuevo departamento',
    };
  }

  if (t === 'sector' && kind !== 'edificio_multifamiliar' && kind !== 'galpon_industrial') {
    return defaultPresentation('sector');
  }

  return defaultPresentation(t);
}

export function labelCrearContextualForKind(
  childType: CanvasNivelTipo | null,
  kind: CanvasProjectKind,
): string {
  if (!childType) return '+ Nodo';
  return canvasLevelPresentation(childType, kind).crearLabel;
}

export function defaultTitleForKind(type: CanvasNivelTipo, kind: CanvasProjectKind): string {
  return canvasLevelPresentation(type, kind).defaultTitle;
}

export function labelTipoNodoForKind(t: CanvasNivelTipo, kind: CanvasProjectKind): string {
  return canvasLevelPresentation(t, kind).tipoNodoLabel;
}

export type VistaNivelPrincipal = 'etapas' | 'plantas' | 'sectores' | 'ambientes' | 'tareas';

export function vistaPrincipalPorContenedorForKind(
  container: { type: CanvasNivelTipo } | null,
  kind: CanvasProjectKind,
): VistaNivelPrincipal {
  if (!container) return 'etapas';
  const next = nextChildCanvasType(container, kind);
  if (next === 'tarea') return 'tareas';
  if (next === 'planta') return 'plantas';
  if (next === 'sector') return 'sectores';
  if (next === 'ambiente') return 'ambientes';
  return 'tareas';
}

export type CabeceraNivelVista = {
  nivelActualTitulo: string;
  contextoUbicacion: string;
  vistaActual: string;
  accionSugerida: string;
};

export function cabeceraContextoNivelForKind(
  obraNombre: string,
  container: { type: CanvasNivelTipo; title: string } | null,
  kind: CanvasProjectKind,
  preferEtapaSubtreeTasksCanvas?: boolean,
): CabeceraNivelVista {
  const pres = (t: CanvasNivelTipo) => canvasLevelPresentation(t, kind);

  if (!container) {
    return {
      nivelActualTitulo: 'Etapas / fases',
      contextoUbicacion: `Obra · ${obraNombre}`,
      vistaActual: 'Timeline horizontal',
      accionSugerida:
        'Agregá fases y, si querés, el orden en el tiempo con precedencias entre etapas.',
    };
  }

  const next = nextChildCanvasType(container, kind);

  switch (container.type) {
    case 'etapa':
      if (preferEtapaSubtreeTasksCanvas) {
        return {
          nivelActualTitulo: 'Tareas operativas',
          contextoUbicacion: `Fase · ${container.title}`,
          vistaActual: 'Canvas de precedencias',
          accionSugerida:
            'Todas las tareas de esta fase están en este lienzo. Conectalas por precedencias como cuando trabajás un rubro entero desde el MSP.',
        };
      }
      return {
        nivelActualTitulo: pres('planta').tipoNodoLabel,
        contextoUbicacion: `Etapa · ${container.title}`,
        vistaActual: 'Composición tipo mapa · hub + grilla',
        accionSugerida:
          next === 'tarea'
            ? 'Creá tareas directamente bajo esta fase (modo simplificado).'
            : `Creá ${pres(next ?? 'planta').tipoNodoLabel.toLowerCase()} dentro de esta etapa.`,
      };
    case 'planta':
      return {
        nivelActualTitulo:
          next === 'ambiente'
            ? pres('ambiente').tipoNodoLabel
            : next === 'sector'
              ? pres('sector').tipoNodoLabel
              : pres('planta').tipoNodoLabel,
        contextoUbicacion: `${pres('planta').tipoNodoLabel} · ${container.title}`,
        vistaActual: 'Mapa guiado del nivel',
        accionSugerida:
          next === 'tarea'
            ? 'Pasá a tareas operativas con precedencias y checklist.'
            : `Definí ${(next && pres(next).tipoNodoLabel.toLowerCase()) || 'el siguiente nivel'}.`,
      };
    case 'sector':
      return {
        nivelActualTitulo:
          next === 'tarea' ? 'Tareas operativas' : pres('ambiente').tipoNodoLabel,
        contextoUbicacion: `${pres('sector').tipoNodoLabel} · ${container.title}`,
        vistaActual: next === 'tarea' ? 'Canvas de precedencias' : 'Tarjetas de ambientes',
        accionSugerida:
          next === 'tarea'
            ? 'Creá tareas, conectalas y usá checklist en el inspector.'
            : 'Nombrá ambientes o zonas antes de pasar a tareas.',
      };
    case 'ambiente':
      return {
        nivelActualTitulo: 'Tareas operativas',
        contextoUbicacion: `${pres('ambiente').tipoNodoLabel} · ${container.title}`,
        vistaActual: 'Canvas de precedencias',
        accionSugerida: 'Creá tareas, conectalas, usá checklist y camino crítico.',
      };
    default:
      return {
        nivelActualTitulo: 'Obra',
        contextoUbicacion: container.title,
        vistaActual: 'Vista general',
        accionSugerida: 'Seleccioná un elemento para editarlo.',
      };
  }
}

/** sessionStorage: al crear obra desde wizard, una sola lectura al abrir el canvas. */
export const canvasProjectKindSessionKey = (obraId: string) =>
  `grows:canvas-project-kind:${obraId}`;

export function peekSessionCanvasProjectKind(obraId: string): CanvasProjectKind | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(canvasProjectKindSessionKey(obraId));
    if (!raw) return null;
    sessionStorage.removeItem(canvasProjectKindSessionKey(obraId));
    return normalizeCanvasProjectKind(raw);
  } catch {
    return null;
  }
}

export function seedSessionCanvasProjectKind(obraId: string, kind: CanvasProjectKind): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(canvasProjectKindSessionKey(obraId), kind);
  } catch {
    /* noop */
  }
}

import type { AhoraStitchChecklistItem } from '@/lib/mocks/socioMockData';

/** Fases del flujo operativo frontend (independientes de la FSM backend). */
export type AhoraFlowPhase =
  | 'idle'
  | 'jornada'
  | 'bloque_en_progreso'
  | 'evidencia_capturada'
  | 'subiendo'
  | 'enviado'
  | 'error';

export type AhoraStitchSnapshot = {
  taskTitle: string;
  obraLine: string | null;
  runningChecklist: AhoraStitchChecklistItem[];
  microStepTitles: string[];
  progresoHecho: number;
  progresoTotal: number;
  initialElapsedSeconds: number;
};

export type AhoraOperationalSession = {
  version: 1;
  socioId: string | null;
  orgId: string | null;
  tareaId: string | null;
  subtareaId: string | null;
  flowPhase: AhoraFlowPhase;
  /** Fase visual interna del Stitch (running | micro | evidence | cierre | sent | paused). */
  stitchPhase?: string | null;
  evidenciaUrl: string | null;
  tempEvidenceDesc: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  lastUpdatedAt: number;
  stitchSnapshot: AhoraStitchSnapshot | null;
};

export const AHORA_OPERATIONAL_SESSION_KEY = 'grows.socio.ahora.operational.v1';

const LOCKED_FLOW_PHASES: AhoraFlowPhase[] = [
  'bloque_en_progreso',
  'evidencia_capturada',
  'subiendo',
  'enviado',
  'error',
];

function emptySession(): AhoraOperationalSession {
  return {
    version: 1,
    socioId: null,
    orgId: null,
    tareaId: null,
    subtareaId: null,
    flowPhase: 'idle',
    stitchPhase: null,
    evidenciaUrl: null,
    tempEvidenceDesc: null,
    errorCode: null,
    errorMessage: null,
    lastUpdatedAt: Date.now(),
    stitchSnapshot: null,
  };
}

function devLog(tag: string, payload?: unknown) {
  if (process.env.NODE_ENV !== 'development') return;
  if (payload !== undefined) {
    console.info(tag, payload);
  } else {
    console.info(tag);
  }
}

export function loadAhoraOperationalSession(): AhoraOperationalSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(AHORA_OPERATIONAL_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AhoraOperationalSession;
    if (parsed?.version !== 1) return null;
    devLog('[AHORA_SESSION_RESTORE]', parsed);
    return parsed;
  } catch {
    return null;
  }
}

export function saveAhoraOperationalSession(
  prev: AhoraOperationalSession | null,
  patch: Partial<AhoraOperationalSession>,
): AhoraOperationalSession {
  const base = prev ?? emptySession();
  const next: AhoraOperationalSession = {
    ...base,
    ...patch,
    version: 1,
    lastUpdatedAt: Date.now(),
  };
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem(AHORA_OPERATIONAL_SESSION_KEY, JSON.stringify(next));
      devLog('[AHORA_SESSION_SAVE]', next);
    } catch {
      /* storage lleno o bloqueado */
    }
  }
  return next;
}

export function clearAhoraOperationalSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(AHORA_OPERATIONAL_SESSION_KEY);
    devLog('[AHORA_SESSION_SAVE]', { cleared: true });
  } catch {
    /* noop */
  }
}

export function isOperationalSessionLocked(session: AhoraOperationalSession | null): boolean {
  if (!session) return false;
  return LOCKED_FLOW_PHASES.includes(session.flowPhase);
}

/** Mantener UI inmersiva aunque el backend ya marcó para_validar. */
export function shouldShowActiveWorkSession(params: {
  backendBlockEnProgreso: boolean;
  session: AhoraOperationalSession | null;
}): boolean {
  if (params.backendBlockEnProgreso) return true;
  return isOperationalSessionLocked(params.session);
}

/** Evita recalcular subtarea activa mientras la sesión operativa está bloqueada. */
export function shouldSkipSubtareaBackendRecalc(session: AhoraOperationalSession | null): boolean {
  return isOperationalSessionLocked(session);
}

export function bindOperationalSessionListeners(
  getSession: () => AhoraOperationalSession | null,
  onPersist: (session: AhoraOperationalSession) => void,
): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const flush = () => {
    const current = getSession();
    if (!current || current.flowPhase === 'idle') return;
    onPersist(current);
  };

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') flush();
  };

  window.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', flush);

  return () => {
    window.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', flush);
  };
}

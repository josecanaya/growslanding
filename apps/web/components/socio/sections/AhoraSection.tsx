'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  MapPin,
  Clock,
  Camera,
  CheckCircle,
  AlertCircle,
  CheckSquare,
  Paperclip,
  MessageSquare,
  Loader2,
  FileText,
  Image,
  Plus,
  X,
  ZoomIn,
  ZoomOut,
  Bell,
} from 'lucide-react';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChecklistModal } from '@/components/socio/ChecklistModal';
import { MensajeriaSocio } from '@/components/socio/MensajeriaSocio';
import { ModalVerPlanos } from '@/components/socio/presupuestos/ModalVerPlanos';
import type { Database } from '@/lib/types/supabase.gen';
import type { ChecklistItem } from '@/data/checklists';
import { useToast } from '@/components/ui/use-toast';
import { USE_MOCK_DATA, MOCK_SUBTAREA_JORNADA_HOY, MOCK_CHECKLIST_ITEMS } from '@/lib/mocks/socioMockData';
import { fetchSocioContextClient } from '@/lib/socios/fetchSocioContextClient';
import {
  ESTADO_BLOQUE_FINAL,
  subtareaEstaCompletadaConLegacy,
  subtareaEstaCompletadaOficial,
} from '@/lib/domain/estados-core';
import { fileLooksLikeImage } from '@/lib/socio/evidenceCapture';
import { fileToEvidenceDataUrl } from '@/lib/socio/evidenceImage';
import {
  buildOrClauseAsignacionSocio,
  cargarTareaOperativaAhora,
} from '@/lib/socio/cargar-tarea-ahora';
import type { AhoraStitchChecklistItem, AhoraStitchItemState } from '@/lib/mocks/socioMockData';
import { AhoraJornadaActivaStitch } from '@/components/socio/ahora/AhoraJornadaActivaStitch';

async function comprimirImagenSocio(file: File, maxWidth = 1200): Promise<string> {
  return fileToEvidenceDataUrl(file, maxWidth);
}

function bloqueElapsedSeconds(sub: { hora_inicio?: string | null }): number {
  const hi = sub?.hora_inicio;
  if (hi && typeof hi === 'string') {
    const t = Date.parse(hi);
    if (Number.isFinite(t)) {
      return Math.max(0, Math.floor((Date.now() - t) / 1000));
    }
  }
  return 0;
}

const SELECT_SUBTAREA_REL = `
  *,
  tareas:tareas (
    id,
    title,
    obra_id,
    estado,
    responsable_socio_id,
    obras:obras (
      id,
      name,
      address
    )
  )
`;

type BloqueResumen = {
  id: string;
  estado?: string | null;
  orden?: number | null;
  socio_id?: string | null;
};

function pickSubtareaOperativa(list: BloqueResumen[]): BloqueResumen | null {
  const norm = (s: string | null | undefined) => String(s || '').toLowerCase();
  return (
    list.find((s) => norm(s.estado) === 'en_progreso') ||
    list.find((s) => norm(s.estado) === 'pendiente') ||
    list.find((s) => norm(s.estado) === 'rechazado') ||
    list.find((s) => norm(s.estado) === 'rechazada') ||
    null
  );
}

/** Evita pantalla rota si el bloque quedó con socio_id desalineado respecto a la sesión. */
function filtrarSubtareasVisiblesSocio(
  lista: BloqueResumen[],
  socioId: string | null,
): BloqueResumen[] {
  if (!lista?.length) return [];
  const filtradas = lista.filter(
    (s) => !s.socio_id || !socioId || s.socio_id === socioId,
  );
  return filtradas.length > 0 ? filtradas : lista;
}

function buildSubtareaFromBloqueYTarea(
  bloque: BloqueResumen,
  tarea: SupabaseTarea,
): Record<string, unknown> {
  return {
    id: bloque.id,
    estado: bloque.estado ?? 'pendiente',
    orden: bloque.orden ?? 1,
    socio_id: bloque.socio_id ?? null,
    tarea_id: tarea.id,
    tareas: {
      id: tarea.id,
      title: tarea.title,
      obra_id: tarea.obra_id,
      estado: tarea.estado,
      obras: tarea.obras ?? null,
    },
  };
}

function normEstadoSub(estado: string | null | undefined): string {
  return String(estado ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

function subtareaPerteneceATarea(sub: { tarea_id?: string | null; tareas?: { id?: string | null } | null } | null, tareaId: string): boolean {
  if (!sub || !tareaId) return false;
  return String(sub.tarea_id ?? sub.tareas?.id ?? '') === tareaId;
}

type GenerarBloquesUiResult = {
  ok: boolean;
  subtareaId?: string | null;
  subtarea?: Record<string, unknown> | null;
};

function bloquesToRunningChecklist(
  bloques: Array<{ id: string; orden: number; estado: string }>,
  activeSubId: string,
): AhoraStitchChecklistItem[] {
  const sorted = [...bloques].sort((a, b) => a.orden - b.orden);
  return sorted.map((b) => {
    const est = String(b.estado || '').toLowerCase();
    const done =
      subtareaEstaCompletadaConLegacy(b.estado) || est === 'para_validar' || est === 'validado';
    const active = Boolean(!done && est === 'en_progreso' && b.id === activeSubId);
    let state: AhoraStitchItemState;
    if (done) state = 'done';
    else if (active) state = 'active';
    else state = 'pending';

    return { id: b.id, title: `Bloque ${b.orden}`, state };
  });
}

type SupabaseTarea = {
  id: string;
  title: string | null;
  descripcion: string | null;
  estado: string | null;
  prioridad: string | null;
  avance: number | null;
  fecha_inicio_estimada: string | null;
  fecha_fin_estimada: string | null;
  obra_id: string | null;
  responsable: string | null;
  canvas_node_id?: string | null;
  obras?: {
    id: string;
    name: string | null;
    address: string | null;
  } | null;
  elemento?: {
    cantidad: number | null;
    unidad: string | null;
  } | null;
};

/** Fila de `eventos` con `select('id, nuevo_estado')` — tipar evita `never` en `.find()` con tipos genéricos de Supabase. */
type EventoRowIdEstado = { id: string; nuevo_estado?: string | null };

export function AhoraSection() {
  const router = useRouter();
  const currentUser = useCurrentUser();
  const supabase = createClientComponentClient<Database>();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tareas, setTareas] = useState<SupabaseTarea[]>([]);
  const [orgIdResuelta, setOrgIdResuelta] = useState<string | null>(currentUser?.orgId ?? null);
  const [showChecklist, setShowChecklist] = useState(false);
  /** Tras «Comenzar bloque/tarea»: primero checklist; null = sólo vista manual del checklist */
  const [gateIntentInicioChecklist, setGateIntentInicioChecklist] = useState<
    'subtarea' | 'tarea' | null
  >(null);
  const [showChat, setShowChat] = useState(false);
  const [showPlanos, setShowPlanos] = useState(false);
  const [showEvidencias, setShowEvidencias] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [isIniciando, setIsIniciando] = useState(false);
  const [isFinalizando, setIsFinalizando] = useState(false);
  const [isGeneratingBlocks, setIsGeneratingBlocks] = useState(false);
  const [isSendingTransition, setIsSendingTransition] = useState(false);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const [isSendingToValidation, setIsSendingToValidation] = useState(false);
  const [tareasCompletadasHoy, setTareasCompletadasHoy] = useState(0);
  const [avanceDiario, setAvanceDiario] = useState(0);
  const [evidenciasFinales, setEvidenciasFinales] = useState<string[]>([]);
  const [jornadaActual, setJornadaActual] = useState<any>(null);
  const [subtareaActual, setSubtareaActual] = useState<any>(null);
  const [totalSubtareas, setTotalSubtareas] = useState(0);
  const [subtareasCompletadas, setSubtareasCompletadas] = useState(0);
  const [tareasProgramadasHoy, setTareasProgramadasHoy] = useState(0);
  const [showModalFinalizarSubtarea, setShowModalFinalizarSubtarea] = useState(false);
  const [tareasActivasCount, setTareasActivasCount] = useState(0);
  const [bloquesActivosCount, setBloquesActivosCount] = useState(0);
  const [bloquesLista, setBloquesLista] = useState<Array<{ id: string; orden: number; estado: string }>>([]);
  /** FK jornadas_socio / subtareas: socios.id (no auth.users.id). */
  const [socioIdGrows, setSocioIdGrows] = useState<string | null>(null);
  const [subtareaRefreshKey, setSubtareaRefreshKey] = useState(0);
  /**
   * Mantener la UI inmersiva `AhoraJornadaActivaStitch` visible después de un envío exitoso de evidencia.
   * Se setea desde el callback `onSendSuccess` del componente hijo y se libera cuando el usuario presiona
   * “Ir a mis tareas” en la pantalla de confirmación (`onSentDismiss`).
   * Sin esto, al cambiar la subtarea a `para_validar` se desmonta el Stitch y se percibe que la app "vuelve al inicio".
   */
  const [stitchLockedAfterSent, setStitchLockedAfterSent] = useState(false);
  const lastStitchPropsRef = useRef<{
    taskTitle: string;
    obraLine: string | null;
    runningChecklist: AhoraStitchChecklistItem[];
    microStepTitles: string[];
    progresoHecho: number;
    progresoTotal: number;
    initialElapsedSeconds: number;
  } | null>(null);
  const generarBloquesIntentados = useRef<Set<string>>(new Set());
  const requestEnCursoRef = useRef<Set<string>>(new Set());
  /** Evita que el effect de jornada/subtarea pise el estado recién confirmado por la API. */
  const subtareaFijadaRef = useRef<{ id: string; until: number } | null>(null);
  /** Alineado con GET /api/tareas/[id]/socio-puede-operar (misma regla que transition). */
  const [tareaOperableBackend, setTareaOperableBackend] = useState<boolean | null>(null);
  const [tareaOperableMotivo, setTareaOperableMotivo] = useState<string | null>(null);

  // Helper para manejar errores de API y mostrar toasts
  const handleApiError = (
    error: any,
    defaultMessage: string,
    options?: { skipToast?: boolean },
  ): { title: string; description: string } => {
    const errorMessage = error?.message || error?.error || defaultMessage;
    const errorCode = error?.errorCode || error?.error;
    
    let title = 'Error';
    let description = typeof errorMessage === 'string' ? errorMessage : String(errorMessage ?? defaultMessage);
    let variant: 'default' | 'destructive' = 'destructive';
    
    // Mapear todos los códigos de error según reglas
    if (errorCode === 'SOCIO_TIENE_2_TAREAS_EN_PROGRESO' || errorMessage.includes('dos tareas en progreso') || errorMessage.includes('dos tareas activas')) {
      title = 'Límite de tareas alcanzado';
      description = 'Ya tenés 2 tareas activas. Finalizá una para continuar.';
    } else if (errorCode === 'SOCIO_TIENE_2_BLOQUES_EN_PROGRESO' || errorMessage.includes('dos bloques en ejecucion') || errorMessage.includes('dos bloques en progreso')) {
      title = 'Límite de bloques alcanzado';
      description = 'No podés iniciar más bloques. Tenés 2 en curso.';
    } else if (errorCode === 'SOCIO_SUSPENDIDO' || errorMessage.includes('SOCIO_SUSPENDIDO') || errorMessage.includes('suspendido')) {
      title = 'Cuenta suspendida';
      description = 'Tu cuenta está suspendida por saldo negativo.';
    } else if (
      errorCode === 'SOCIO_NO_AUTORIZADO_TAREA' ||
      errorMessage.includes('SOCIO_NO_AUTORIZADO_TAREA')
    ) {
      title = 'No podés operar esta tarea';
      description =
        typeof error?.debug === 'object' && error?.debug?.motivo403
          ? `${error.debug.motivo403}. Revisá la pestaña Red → respuesta JSON (debug).`
          : 'Revisá la pestaña Red → respuesta JSON (debug).';
    } else if (errorCode === 'TRANSICIÓN_NO_PERMITIDA' || errorMessage.includes('Transicion no permitida') || errorMessage.includes('no permitida') || errorMessage.includes('transición no permitida')) {
      title = 'Acción no permitida';
      description = 'Esta acción no está permitida en este estado.';
    } else if (errorCode === 'EVIDENCIA_FALTANTE' || errorMessage.includes('Debes cargar evidencia') || errorMessage.includes('evidencia obligatoria')) {
      title = 'Evidencia requerida';
      description = 'Debés cargar evidencia antes de enviar el bloque para validar.';
    } else if (
      errorCode === 'PRESUPUESTO_APROBADO_NO_ENCONTRADO' ||
      errorMessage.includes('No hay presupuesto aprobado')
    ) {
      title = 'Presupuesto no aprobado';
      description =
        'Esta tarea no tiene un presupuesto aprobado para tu perfil. Pedile al cliente que apruebe el presupuesto antes de comenzar.';
    } else if (
      errorCode === 'GENERAR_BLOQUES_ERROR' ||
      errorMessage.includes('No se pudieron generar') ||
      errorMessage.includes('No se pudieron crear los bloques')
    ) {
      title = 'No se pudieron preparar los bloques';
      description =
        typeof error?.message === 'string' && error.message.trim()
          ? error.message
          : 'Verificá con el cliente que el presupuesto esté aprobado y que la tarea tenga días/bloques configurados.';
    } else if (
      errorCode === 'TODOS_BLOQUES_COMPLETADOS' ||
      errorMessage.includes('Todos los bloques de esta tarea')
    ) {
      title = 'Tarea completada';
      description =
        'Todos los bloques de esta tarea ya están completados. No queda trabajo pendiente por comenzar.';
    } else if (errorCode === 'NO_BLOQUE_OPERATIVO') {
      title = 'Sin bloque para comenzar';
      const bloquesDbg = Array.isArray(error?.debug?.bloques) ? error.debug.bloques : [];
      const resumen = bloquesDbg
        .slice(0, 6)
        .map((b: { orden?: number | null; estado?: string | null }) =>
          `#${b.orden ?? '?'}=${b.estado ?? '?'}`,
        )
        .join(', ');
      description = resumen
        ? `Ningún bloque está pendiente de iniciar. Estados actuales: ${resumen}.`
        : 'No hay bloques pendientes. Verificá con el cliente que el presupuesto esté aprobado.';
    } else if (errorCode === 'PRECEDENCE_ERROR' || error?.error === 'PRECEDENCE_ERROR') {
      title = 'Hay tareas previas pendientes';
      description =
        typeof errorMessage === 'string' && errorMessage.trim()
          ? errorMessage.replace(/\n+/g, ' — ').slice(0, 500)
          : 'Esta tarea depende de otras que todavía tienen bloques sin enviar a validación.';
    } else if (errorCode === 'BLOQUES_FALTANTES' || error?.error === 'BLOQUES_FALTANTES') {
      title = 'Faltan bloques';
      description =
        errorMessage ||
        'Primero generá bloques y completá el flujo de evidencia antes de enviar la tarea a validar.';
    } else if (errorCode === 'BLOQUE_NO_LISTO' || error?.error === 'BLOQUE_NO_LISTO') {
      title = 'Bloque no listo';
      description =
        errorMessage ||
        'Primero enviá el bloque a validar desde el flujo de evidencia (foto y enviar a validar).';
    } else if (errorCode === 'BLOQUE_YA_VALIDADO' || errorMessage.includes('ya validado')) {
      title = 'Bloque ya validado';
      description = 'Este bloque ya fue validado.';
    } else if (errorCode === 'BLOQUE_YA_ENVIADO' || errorMessage.includes('ya enviado')) {
      title = 'Bloque ya enviado';
      description = 'Este bloque ya fue enviado para validar.';
    } else if (
      errorCode === 'DATABASE_ERROR' ||
      error?.error === 'DATABASE_ERROR'
    ) {
      title = 'Error en base de datos';
      const detail =
        typeof error?.detail === 'string' ? error.detail.trim() : '';
      const code = error?.code != null ? String(error.code).trim() : '';
      description = [typeof error?.message === 'string' ? error.message : null, detail || null, code ? `(${code})` : null]
        .filter(Boolean)
        .join(' — ')
        || defaultMessage;
    } else if (errorMessage.includes('sin saldo') || errorMessage.includes('saldo negativo')) {
      title = 'Saldo insuficiente';
      description = 'Tu cuenta está suspendida por saldo negativo.';
    }
    
    if (!options?.skipToast) {
      toast({
        title,
        description,
        variant,
      });
    }
    
    setError(description);
    return { title, description };
  };

  // Una sola tarea operativa (CPM + precedencias + bloques); misma regla en carga y refrescos.
  const recargarTareaAhora = useCallback(
    async (opts?: { showLoading?: boolean }) => {
      if (!currentUser?.id) return;

      const orgId = orgIdResuelta || currentUser?.orgId;
      if (!orgId) return;

      if (opts?.showLoading) {
        setLoading(true);
        setError(null);
      }

      try {
        const socioRow = await fetchSocioContextClient();
        const socioId = socioIdGrows ?? socioRow?.id ?? null;
        if (socioRow?.id && !socioIdGrows) {
          setSocioIdGrows(socioRow.id);
        }

        const { tarea, error: loadError } = await cargarTareaOperativaAhora(supabase as any, {
          orgId,
          socioId,
        });

        if (loadError) {
          setError(loadError);
          setTareas([]);
        } else {
          setError(null);
          setTareas(tarea ? [tarea as SupabaseTarea] : []);
        }
      } catch {
        setError('Error al cargar las tareas.');
        setTareas([]);
      } finally {
        if (opts?.showLoading) {
          setLoading(false);
        }
      }
    },
    [currentUser, orgIdResuelta, supabase, socioIdGrows],
  );

  const fetchData = async () => {
    await recargarTareaAhora();
  };

  // Resolver org_id si no viene en currentUser (socio vinculado por user_id o email)
  useEffect(() => {
    const resolverOrg = async () => {
      if (orgIdResuelta || !currentUser?.id) return;
      try {
        const row = await fetchSocioContextClient();
        const combined = row?.effective_org_id || row?.org_id;
        if (combined) {
          setOrgIdResuelta(combined);
          return;
        }
        if (currentUser.email) {
          const supabaseAny = supabase as any;
          const { data: tareaData } = await supabaseAny
            .from('tareas')
            .select('org_id')
            .or(`responsable.eq.${currentUser.email},responsable.ilike.%${currentUser.email}%`)
            .limit(1)
            .maybeSingle();
          if (tareaData?.org_id) {
            setOrgIdResuelta(tareaData.org_id);
          }
        }
      } catch (err) {
        // Error silencioso
      }
    };

    resolverOrg();
  }, [currentUser?.id, currentUser?.email, orgIdResuelta, supabase]);

  useEffect(() => {
    if (USE_MOCK_DATA) {
      setLoading(false);
      return;
    }
    if (!currentUser?.id) {
      setLoading(false);
      setError('No hay usuario activo.');
      return;
    }
    if (!orgIdResuelta && !currentUser.orgId) {
      return;
    }
    void recargarTareaAhora({ showLoading: true });
  }, [currentUser, orgIdResuelta, recargarTareaAhora]);

  // Calcular progreso general (de TODAS las tareas, no solo las pendientes)
  const [progresoGeneral, setProgresoGeneral] = useState({ completadas: 0, total: 0, porcentaje: 0 });

  useEffect(() => {
    const calcularProgreso = async () => {
      if (!currentUser?.id) {
        setProgresoGeneral({ completadas: 0, total: 0, porcentaje: 0 });
        return;
      }
      
      try {
        const socioRow = await fetchSocioContextClient();
        const orgId =
          orgIdResuelta ||
          currentUser.orgId ||
          socioRow?.effective_org_id ||
          socioRow?.org_id ||
          null;

        if (!orgId && !socioRow?.id) {
          setProgresoGeneral({ completadas: 0, total: 0, porcentaje: 0 });
          return;
        }

        const partes = await buildOrClauseAsignacionSocio(supabase as any, socioRow?.id);
        if (partes.length === 0) {
          setProgresoGeneral({ completadas: 0, total: 0, porcentaje: 0 });
          return;
        }
        let q = supabase.from('tareas').select('id, estado, avance');
        if (orgId) {
          q = q.eq('org_id', orgId);
        }
        q = q.or(partes.join(','));
        const { data: todasLasTareas } = await q;

        if (!todasLasTareas || todasLasTareas.length === 0) {
          setProgresoGeneral({ completadas: 0, total: 0, porcentaje: 0 });
          return;
        }

        // Calcular progreso basado en tareas (las subtareas se actualizan en otro useEffect)
        const total = todasLasTareas.length;
        const completadas = todasLasTareas.filter((t: any) => {
          const e = (t.estado || '').toLowerCase();
          return e === 'validada' || e === 'rechazada' || t.avance === 100;
        }).length;
        const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;
        
        setProgresoGeneral({ completadas, total, porcentaje });
      } catch (err) {
        setProgresoGeneral({ completadas: 0, total: 0, porcentaje: 0 });
      }
    };

    calcularProgreso();
  }, [currentUser, orgIdResuelta, supabase]);

  // Actualizar progreso cuando cambian las subtareas
  useEffect(() => {
    if (totalSubtareas > 0) {
      const porcentaje = Math.round((subtareasCompletadas / totalSubtareas) * 100);
      setProgresoGeneral({ 
        completadas: subtareasCompletadas, 
        total: totalSubtareas, 
        porcentaje 
      });
    }
  }, [totalSubtareas, subtareasCompletadas]);

  // Calcular tareas completadas hoy (solo estado oficial validada en eventos; sin legacy finalizado/finalizada)
  useEffect(() => {
    const calcularTareasHoy = async () => {
      if (!currentUser?.id) {
        setTareasCompletadasHoy(0);
        return;
      }

      const orgId = orgIdResuelta || currentUser?.orgId;
      if (!orgId) {
        setTareasCompletadasHoy(0);
        return;
      }

      try {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const hoyISO = hoy.toISOString();

        const socioCtx = await fetchSocioContextClient();
        const orPartes = await buildOrClauseAsignacionSocio(supabase as any, socioCtx?.id);
        if (orPartes.length === 0) {
          setTareasCompletadasHoy(0);
          return;
        }

        const { data: misTareas } = await supabase
          .from('tareas')
          .select('id')
          .eq('org_id', String(orgId))
          .or(orPartes.join(','))
          .limit(80);

        const tareaIds = (misTareas ?? []).map((t: { id: string }) => t.id).filter(Boolean);
        if (tareaIds.length === 0) {
          setTareasCompletadasHoy(0);
          return;
        }

        const { data: eventosHoy, error: evErr } = await supabase
          .from('eventos')
          .select('tarea_id')
          .in('tarea_id', tareaIds)
          .eq('nuevo_estado', 'validada')
          .gte('created_at', hoyISO);

        if (evErr) {
          console.error('[AhoraSection] eventos completadas hoy:', evErr);
          setTareasCompletadasHoy(0);
          return;
        }

        if (eventosHoy) {
          const tareasUnicas = new Set(eventosHoy.map((e: { tarea_id?: string | null }) => e.tarea_id));
          setTareasCompletadasHoy(tareasUnicas.size);
        } else {
          setTareasCompletadasHoy(0);
        }
      } catch (err) {
        console.error('[AhoraSection] calcularTareasHoy:', err);
        setTareasCompletadasHoy(0);
      }
    };

    calcularTareasHoy();
  }, [currentUser, orgIdResuelta, supabase]);

  // Tarea actual (una a la vez, ordenada por CPM)
  const tareaActual = useMemo(() => {
    return tareas[0] || null;
  }, [tareas]);

  const tareasIdsFingerprint = useMemo(() => tareas.map((t) => t.id).join(','), [tareas]);

  useEffect(() => {
    if (USE_MOCK_DATA) {
      setTareaOperableBackend(true);
      setTareaOperableMotivo(null);
      return;
    }
    if (subtareaActual) {
      setTareaOperableBackend(null);
      setTareaOperableMotivo(null);
      return;
    }
    const tid = tareaActual?.id;
    if (!tid) {
      setTareaOperableBackend(null);
      setTareaOperableMotivo(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setTareaOperableBackend(null);
      setTareaOperableMotivo(null);
      try {
        const res = await fetch(`/api/tareas/${tid}/socio-puede-operar`, { credentials: 'include' });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        setTareaOperableBackend(!!json.allowed);
        setTareaOperableMotivo(json.allowed ? null : String(json.code ?? 'SOCIO_NO_AUTORIZADO_TAREA'));
      } catch (e) {
        console.error('[AhoraSection] socio-puede-operar:', e);
        if (!cancelled) {
          setTareaOperableBackend(null);
          setTareaOperableMotivo('FETCH_ERROR');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tareaActual?.id, subtareaActual]);

  // Demo: mock "Tu jornada de hoy" como si estuvieras realizando una tarea (jornada activa para poder finalizar)
  useEffect(() => {
    if (!USE_MOCK_DATA) return;
    setLoading(false);
    setSubtareaActual(MOCK_SUBTAREA_JORNADA_HOY as any);
    setJornadaActual({ id: 'mock-jornada' }); // Para que el CTA muestre "Enviar para validar" y se pueda finalizar
    setTotalSubtareas(12);
    setSubtareasCompletadas(2);
    setTareasProgramadasHoy(12);
    setTareasCompletadasHoy(2);
  }, []);

  // Jornada (socios.id) + subtarea acotada a la tarea actual y al socio
  useEffect(() => {
    if (USE_MOCK_DATA) return;
    let cancelled = false;

    const run = async () => {
      if (!currentUser?.id) {
        setJornadaActual(null);
        setSubtareaActual(null);
        return;
      }

      const orgId = orgIdResuelta || currentUser?.orgId;
      if (!orgId || !socioIdGrows) {
        setJornadaActual(null);
        return;
      }

      try {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const hoyISO = hoy.toISOString().split('T')[0];

        const { data: jornadaData } = await (supabase as any)
          .from('jornadas_socio')
          .select('*')
          .eq('socio_id', socioIdGrows)
          .eq('fecha', hoyISO)
          .maybeSingle();

        if (cancelled) return;
        if (jornadaData) {
          setJornadaActual(jornadaData);
        }

        const tareaIds = tareas.map((t) => t.id).filter(Boolean);
        const tid = tareaActual?.id;

        const contarSubtareasScoped = async () => {
          if (!socioIdGrows || tareaIds.length === 0) {
            setTareasProgramadasHoy(0);
            setTareasCompletadasHoy(0);
            return;
          }
          const supAny = supabase as any;
          const { count: pendCount } = await supAny
            .from('tareas_subtareas')
            .select('*', { count: 'exact', head: true })
            .in('tarea_id', tareaIds)
            .eq('socio_id', socioIdGrows)
            .eq('estado', 'pendiente');

          const { count: valCount } = await supAny
            .from('tareas_subtareas')
            .select('*', { count: 'exact', head: true })
            .in('tarea_id', tareaIds)
            .eq('socio_id', socioIdGrows)
            .eq('estado', ESTADO_BLOQUE_FINAL);

          setTareasProgramadasHoy(pendCount ?? 0);
          setTareasCompletadasHoy(valCount ?? 0);
        };

        if (!tid) {
          setSubtareaActual(null);
          setTotalSubtareas(0);
          setSubtareasCompletadas(0);
          await contarSubtareasScoped();
          return;
        }

        const fijada = subtareaFijadaRef.current;
        if (fijada && Date.now() < fijada.until) {
          await contarSubtareasScoped();
          return;
        }

        const supAny = supabase as any;

        // La generación de bloques se hace por click en "Comenzar tarea" para evitar POST repetidos desde renders/effects.

        const { data: lista } = await supAny
          .from('tareas_subtareas')
          .select(SELECT_SUBTAREA_REL)
          .eq('tarea_id', tid)
          .order('orden', { ascending: true });

        if (cancelled) return;

        const subtareaLocal = subtareaActual;
        const preservarSubtareaApi =
          subtareaLocal &&
          subtareaPerteneceATarea(subtareaLocal, tid) &&
          ['en_progreso', 'para_validar'].includes(normEstadoSub(subtareaLocal.estado));

        if (!lista?.length) {
          if (preservarSubtareaApi) {
            await contarSubtareasScoped();
            return;
          }
          setSubtareaActual(null);
          setTotalSubtareas(0);
          setSubtareasCompletadas(0);
          await contarSubtareasScoped();
          return;
        }

        const list = filtrarSubtareasVisiblesSocio(lista as BloqueResumen[], socioIdGrows);

        if (!list.length) {
          if (preservarSubtareaApi) {
            await contarSubtareasScoped();
            return;
          }
          setSubtareaActual(null);
          setTotalSubtareas(0);
          setSubtareasCompletadas(0);
          await contarSubtareasScoped();
          return;
        }

        const pick = pickSubtareaOperativa(list);

        if (preservarSubtareaApi && pick?.id && pick.id !== subtareaLocal?.id) {
          await contarSubtareasScoped();
          return;
        }

        if (
          preservarSubtareaApi &&
          pick &&
          pick.id === subtareaLocal?.id &&
          normEstadoSub(pick.estado) === 'pendiente' &&
          normEstadoSub(subtareaLocal.estado) === 'en_progreso'
        ) {
          await contarSubtareasScoped();
          return;
        }

        setSubtareaActual(pick);
        setTotalSubtareas(list.length);
        setSubtareasCompletadas(
          list.filter((s: any) => subtareaEstaCompletadaOficial(s.estado)).length,
        );
        await contarSubtareasScoped();
      } catch {
        // sin maquillar: no romper la pantalla
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [
    currentUser?.id,
    currentUser?.orgId,
    orgIdResuelta,
    socioIdGrows,
    supabase,
    tareaActual?.id,
    tareasIdsFingerprint,
    subtareaRefreshKey,
    tareaOperableBackend,
  ]);

  // Cargar avance diario y evidencias finales de la tarea actual
  useEffect(() => {
    const cargarAvanceYEvidencias = async () => {
      if (!tareaActual?.id || !currentUser?.id) {
        setAvanceDiario(0);
        setEvidenciasFinales([]);
        return;
      }

      const orgId = orgIdResuelta || currentUser?.orgId;
      if (!orgId) return;

      try {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const hoyISO = hoy.toISOString();

        const { data: eventosAvance } = await supabase
          .from('eventos')
          .select('id, snapshot_json')
          .eq('tarea_id', tareaActual.id)
          .in('nuevo_estado', ['en_progreso', 'en_ejecucion'])
          .gte('created_at', hoyISO)
          .order('created_at', { ascending: false })
          .limit(1) as any;

        if (eventosAvance && eventosAvance.length > 0) {
          const snapshot = eventosAvance[0].snapshot_json as any;
          if (snapshot?.avance_diario !== undefined) {
            setAvanceDiario(snapshot.avance_diario);
          }
        }

        const { data: candidatosEv, error: evCandErr } = await supabase
          .from('eventos')
          .select('id, nuevo_estado')
          .eq('tarea_id', tareaActual.id)
          .order('created_at', { ascending: false })
          .limit(24);

        if (evCandErr) {
          console.error('[AhoraSection] eventos evidencias finales:', evCandErr);
        } else {
          const oficialOk = new Set(['validada', 'para_validar', 'en_progreso', 'en_ejecucion']);
          const legacyOk = new Set(['finalizado', 'finalizada']);
          const lista = (candidatosEv ?? []) as EventoRowIdEstado[];
          const pick = lista.find((ev) => {
            const n = (ev.nuevo_estado || '').toLowerCase();
            return oficialOk.has(n) || legacyOk.has(n);
          });
          if (pick?.id) {
            const { data: mediaData } = await supabase
              .from('media')
              .select('path, kind')
              .eq('evento_id', pick.id)
              .eq('kind', 'evidencia_final') as any;

            if (mediaData) {
              setEvidenciasFinales(mediaData.map((m: any) => m.path));
            }
          }
        }
      } catch (err) {
        console.error('[AhoraSection] cargarAvanceYEvidencias:', err);
      }
    };

    cargarAvanceYEvidencias();
  }, [tareaActual?.id, currentUser, orgIdResuelta, supabase]);

  const handleIniciarJornada = async () => {
    if (!currentUser?.id) return;
    if (!socioIdGrows) {
      toast({
        title: 'Perfil incompleto',
        description: 'No encontramos tu registro de socio. Volvé a iniciar sesión o contactá soporte.',
        variant: 'destructive',
      });
      return;
    }

    // Requiere al menos una tarea o subtarea
    if (!subtareaActual && !tareaActual) {
      setError('No hay tareas asignadas para iniciar jornada');
      return;
    }

    setIsIniciando(true);
    
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const hoyISO = hoy.toISOString().split('T')[0];
      const horaInicio = new Date().toISOString();

      // Obtener obra_id de la tarea o subtarea
      const obraId = subtareaActual?.tareas?.obra_id || 
                     subtareaActual?.tarea?.obra_id || 
                     tareaActual?.obra_id;
      
      if (!obraId) {
        setError('No se pudo determinar la obra');
        setIsIniciando(false);
        return;
      }

      // Verificar si ya existe una jornada para hoy
      const { data: jornadaExistente, error: errorVerificar } = await (supabase as any)
        .from('jornadas_socio')
        .select('*')
        .eq('socio_id', socioIdGrows)
        .eq('fecha', hoyISO)
        .maybeSingle();

      if (errorVerificar) {
        setError('Error al verificar jornada existente');
        setIsIniciando(false);
        return;
      }

      // Si ya existe una jornada, usarla
      if (jornadaExistente) {
        setJornadaActual(jornadaExistente);
        setIsIniciando(false);
        return;
      }

      // Crear nueva jornada en jornadas_socio
      const { data: nuevaJornada, error: jornadaError } = await (supabase as any)
        .from('jornadas_socio')
        .insert({
          socio_id: socioIdGrows,
          obra_id: obraId,
          fecha: hoyISO,
          hora_inicio: horaInicio,
        })
        .select()
        .single();

      if (jornadaError) {
        // Si el error es por constraint único (jornada ya existe), intentar cargarla
        if (jornadaError.code === '23505' || jornadaError.message?.includes('unique') || jornadaError.message?.includes('duplicate')) {
          const { data: jornadaData } = await (supabase as any)
            .from('jornadas_socio')
            .select('*')
            .eq('socio_id', socioIdGrows)
            .eq('fecha', hoyISO)
            .maybeSingle();
          
          if (jornadaData) {
            setJornadaActual(jornadaData);
            setIsIniciando(false);
            return;
          }
        }
        
        setError(`Error al iniciar la jornada: ${jornadaError.message || 'Error desconocido'}`);
        setIsIniciando(false);
        return;
      }

      // Usar la jornada recién creada
      if (nuevaJornada) {
        setJornadaActual(nuevaJornada);
      } else {
        // Si no viene en la respuesta, recargarla
        const { data: jornadaData } = await (supabase as any)
          .from('jornadas_socio')
          .select('*')
          .eq('socio_id', socioIdGrows)
          .eq('fecha', hoyISO)
          .maybeSingle();

        setJornadaActual(jornadaData);
      }
    } catch (err: any) {
      setError(`Error al iniciar la jornada: ${err?.message || 'Error desconocido'}`);
    } finally {
      setIsIniciando(false);
    }
  };

  const recargarSubtareaPorId = React.useCallback(
    async (subtareaId: string) => {
      if (USE_MOCK_DATA) return;
      const { data: subtareaData } = await (supabase as any)
        .from('tareas_subtareas')
        .select(SELECT_SUBTAREA_REL)
        .eq('id', subtareaId)
        .maybeSingle();
      if (subtareaData) {
        setSubtareaActual(subtareaData);
      }
      setSubtareaRefreshKey((k) => k + 1);
    },
    [supabase],
  );

  const vincularSubtareaDesdeBloques = React.useCallback(
    async (
      bloques: BloqueResumen[],
      tareaFallback?: SupabaseTarea | null,
      subtareaOperativaApi?: Record<string, unknown> | null,
    ): Promise<GenerarBloquesUiResult> => {
      if (subtareaOperativaApi?.id) {
        setSubtareaActual(subtareaOperativaApi);
        const visibles = filtrarSubtareasVisiblesSocio(bloques, socioIdGrows);
        setTotalSubtareas(visibles.length);
        setSubtareasCompletadas(
          visibles.filter((s) => subtareaEstaCompletadaOficial(String(s.estado ?? ''))).length,
        );
        setSubtareaRefreshKey((k) => k + 1);
        return {
          ok: true,
          subtareaId: String(subtareaOperativaApi.id),
          subtarea: subtareaOperativaApi,
        };
      }

      const visibles = filtrarSubtareasVisiblesSocio(bloques, socioIdGrows);
      const pick = pickSubtareaOperativa(visibles);
      setTotalSubtareas(visibles.length);
      setSubtareasCompletadas(
        visibles.filter((s) => subtareaEstaCompletadaOficial(String(s.estado ?? ''))).length,
      );
      if (!pick?.id) {
        setSubtareaActual(null);
        return { ok: true, subtareaId: null, subtarea: null };
      }

      const subtareaLocal = tareaFallback
        ? buildSubtareaFromBloqueYTarea(pick, tareaFallback)
        : null;

      if (subtareaLocal) {
        setSubtareaActual(subtareaLocal);
        setSubtareaRefreshKey((k) => k + 1);
        return { ok: true, subtareaId: pick.id, subtarea: subtareaLocal };
      }

      await recargarSubtareaPorId(pick.id);
      return { ok: true, subtareaId: pick.id, subtarea: null };
    },
    [socioIdGrows, recargarSubtareaPorId],
  );

  const generarBloquesParaTarea = React.useCallback(
    async (
      tareaId: string,
      opts?: { tareaFallback?: SupabaseTarea | null; intentarSoloLectura?: boolean },
    ): Promise<GenerarBloquesUiResult> => {
      const tareaFb = opts?.tareaFallback ?? null;

      if (opts?.intentarSoloLectura !== false && tareaFb) {
        try {
          const { data: lista } = await (supabase as any)
            .from('tareas_subtareas')
            .select('id, estado, orden, socio_id')
            .eq('tarea_id', tareaId)
            .order('orden', { ascending: true });
          if (lista?.length) {
            return vincularSubtareaDesdeBloques(lista as BloqueResumen[], tareaFb);
          }
        } catch {
          // Continuar con API server-side (service role).
        }
      }

      if (!generarBloquesIntentados.current.has(tareaId)) {
        generarBloquesIntentados.current.add(tareaId);
      }

      setIsGeneratingBlocks(true);
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 45000);
      try {
        const response = await fetch(`/api/tareas/${tareaId}/generar-bloques`, {
          method: 'POST',
          credentials: 'include',
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          generarBloquesIntentados.current.delete(tareaId);
          handleApiError(data, 'Error al preparar los bloques de la tarea');
          return { ok: false };
        }

        const bloques = (data?.bloques ?? []) as BloqueResumen[];
        const subtareaOperativaApi = (data?.subtareaOperativa ?? null) as Record<string, unknown> | null;
        return vincularSubtareaDesdeBloques(bloques, tareaFb, subtareaOperativaApi);
      } catch (err) {
        generarBloquesIntentados.current.delete(tareaId);
        const isAbort = err instanceof Error && err.name === 'AbortError';
        handleApiError(
          err,
          isAbort
            ? 'La preparación del bloque tardó demasiado. Revisá tu conexión e intentá de nuevo.'
            : 'Error al preparar bloques. Por favor, intentá nuevamente.',
        );
        return { ok: false };
      } finally {
        window.clearTimeout(timeoutId);
        setIsGeneratingBlocks(false);
      }
    },
    [supabase, vincularSubtareaDesdeBloques],
  );

  const avanzarTrasTareaCompletada = async (_tareaIdCompletada?: string) => {
    subtareaFijadaRef.current = null;
    setSubtareaActual(null);
    await recargarTareaAhora();
  };

  const handleComenzarBloqueOperativo = async (subtareaIdPreferida?: string) => {
    const tareaId =
      subtareaActual?.tarea_id ??
      subtareaActual?.tareas?.id ??
      tareaActual?.id;
    if (!tareaId || !currentUser) {
      toast({
        title: 'Sin tarea activa',
        description: 'No encontramos una tarea para comenzar el bloque.',
        variant: 'destructive',
      });
      return;
    }

    const requestKey = `comenzar-bloque:${tareaId}`;
    if (requestEnCursoRef.current.has(requestKey)) {
      toast({
        title: 'Procesando',
        description: 'Ya estamos iniciando el bloque. Aguardá unos segundos.',
      });
      return;
    }
    if (
      isGeneratingBlocks ||
      isSendingTransition ||
      isUploadingEvidence ||
      isSendingToValidation
    ) {
      toast({
        title: 'Operación en curso',
        description: 'Esperá a que termine la acción anterior.',
      });
      return;
    }

    requestEnCursoRef.current.add(requestKey);
    setIsIniciando(true);
    console.info('[COMENZAR_BLOQUE] click', { tareaId, subtareaIdPreferida });

    try {
      if (!jornadaActual && socioIdGrows) {
        await handleIniciarJornada();
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const hoyISO = hoy.toISOString().split('T')[0];
        const { data: jornadaData } = await (supabase as any)
          .from('jornadas_socio')
          .select('*')
          .eq('socio_id', socioIdGrows)
          .eq('fecha', hoyISO)
          .maybeSingle();
        if (jornadaData) {
          setJornadaActual(jornadaData);
        }
      }

      const response = await fetch(`/api/tareas/${tareaId}/comenzar-bloque`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subtareaId: subtareaIdPreferida ?? subtareaActual?.id ?? null,
        }),
      });
      const data = await response.json().catch(() => ({}));
      console.info('[COMENZAR_BLOQUE] respuesta', {
        ok: response.ok,
        status: response.status,
        accion: data?.accion,
        subtareaId: data?.subtarea?.id,
        error: data?.message ?? data?.error,
      });

      if (!response.ok) {
        const errorCode = data?.errorCode ?? data?.error;
        if (
          errorCode === 'TODOS_BLOQUES_COMPLETADOS' ||
          String(data?.message ?? data?.error ?? '').includes('Todos los bloques')
        ) {
          handleApiError(
            {
              ...data,
              errorCode: 'TODOS_BLOQUES_COMPLETADOS',
            },
            data?.message || data?.error || 'Todos los bloques de esta tarea ya están completados',
          );
          await avanzarTrasTareaCompletada(tareaId);
          return;
        }
        handleApiError(
          {
            ...data,
            errorCode: data?.errorCode ?? data?.error,
          },
          data?.message || data?.error || 'No se pudo comenzar el bloque',
        );
        return;
      }

      if (data?.accion === 'tarea_completada') {
        toast({
          title: 'Tarea completada',
          description: 'Todos los bloques ya están validados. Pasamos a la siguiente tarea disponible.',
        });
        await avanzarTrasTareaCompletada(tareaId);
        return;
      }

      if (data?.accion === 'para_validar') {
        handleApiError(
          {
            message: 'El bloque operativo ya está en revisión del cliente.',
          },
          'Bloque en validación',
        );
        if (data.subtarea) {
          subtareaFijadaRef.current = {
            id: String(data.subtarea.id),
            until: Date.now() + 8000,
          };
          setSubtareaActual(data.subtarea);
        }
        return;
      }

      if (data?.subtarea) {
        subtareaFijadaRef.current = {
          id: String(data.subtarea.id),
          until: Date.now() + 8000,
        };
        setSubtareaActual(data.subtarea);
      }

      if (Array.isArray(data?.bloques)) {
        setTotalSubtareas(data.bloques.length);
        setSubtareasCompletadas(
          data.bloques.filter((b: { estado?: string | null }) =>
            subtareaEstaCompletadaOficial(String(b.estado ?? '')),
          ).length,
        );
      }

      toast({
        title: data?.accion === 'reanudado' ? 'Bloque reanudado' : 'Bloque iniciado',
        description: 'Ya podés cargar evidencias y avanzar con la tarea.',
      });

      await cargarContadoresBloques();
    } catch (err) {
      console.error('[COMENZAR_BLOQUE] error', err);
      handleApiError(err, 'Error inesperado al comenzar el bloque');
    } finally {
      requestEnCursoRef.current.delete(requestKey);
      setIsIniciando(false);
    }
  };

  const handleIniciarSubtarea = async () => {
    if (!subtareaActual || !currentUser) return;
    await handleComenzarBloqueOperativo(String(subtareaActual.id));
  };

  const handleIniciarTarea = async (checklistFsmOverride?: ChecklistItem[]) => {
    if (!tareaActual || !currentUser) return;
    const checklistParaFsm = checklistFsmOverride ?? checklistItems;
    const requestKey = `iniciar-tarea:${tareaActual.id}`;
    if (
      isIniciando ||
      isGeneratingBlocks ||
      isSendingTransition ||
      requestEnCursoRef.current.has(requestKey)
    ) {
      return;
    }
    requestEnCursoRef.current.add(requestKey);

    setIsIniciando(true);
    setError(null);
    
    // Efecto amarillo: agregar clase al body y al contenedor principal
    const mainContainer = document.querySelector('.ahora-container') as HTMLElement;
    if (mainContainer) {
      mainContainer.classList.add('bg-yellow-50', 'transition-colors', 'duration-1000');
    }
    document.body.classList.add('bg-yellow-50');
    
    setTimeout(() => {
      if (mainContainer) {
        mainContainer.classList.remove('bg-yellow-50');
      }
      document.body.classList.remove('bg-yellow-50');
    }, 2000);

    try {
      const result = await generarBloquesParaTarea(tareaActual.id, {
        tareaFallback: tareaActual,
      });
      if (!result.ok) {
        setIsIniciando(false);
        return;
      }

      // Usar solo el endpoint FSM - no actualizar directamente
      setIsSendingTransition(true);
      const response = await fetch(`/api/tareas/${tareaActual.id}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nuevo_estado: 'en_progreso',
          notas: 'Tarea iniciada desde la sección Ahora',
          checklist: checklistParaFsm.map((item) => ({
            id: item.id,
            label: item.label,
            checked: item.done,
          })),
          has_nc: false,
          actor: {
            name: currentUser.name || currentUser.email || 'Socio',
            role: 'Socio',
            method: 'login',
          },
          media: [],
        }),
      });
      setIsSendingTransition(false);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        handleApiError(errorData, 'Error al iniciar la tarea');
        setIsIniciando(false);
        return;
      }

      // Solo actualizar UI si la API confirma éxito
      toast({
        title: 'Tarea iniciada',
        description: 'La tarea está ahora en progreso.',
      });

      await recargarTareaAhora();
      await cargarContadoresTareas();
      setSubtareaRefreshKey((k) => k + 1);
    } catch (err) {
      handleApiError(err, 'Error al iniciar la tarea. Por favor, intenta nuevamente.');
    } finally {
      requestEnCursoRef.current.delete(requestKey);
      setIsGeneratingBlocks(false);
      setIsSendingTransition(false);
      setIsIniciando(false);
    }
  };

  // Cargar contadores de tareas y bloques activos
  const cargarContadoresTareas = async () => {
    if (!currentUser?.id) return;
    
    const orgId = orgIdResuelta || currentUser?.orgId;
    if (!orgId) return;

    try {
      let sid = socioIdGrows;
      if (!sid && currentUser.email) {
        const { data: socio } = await (supabase as any)
          .from('socios')
          .select('id')
          .eq('email', currentUser.email)
          .maybeSingle();
        sid = socio?.id ?? null;
      }
      if (!sid) return;

      const { count } = await (supabase as any)
        .from('tareas')
        .select('*', { count: 'exact', head: true })
        .eq('responsable_socio_id', sid)
        .eq('estado', 'en_progreso');

      setTareasActivasCount(count || 0);
    } catch (err) {
      handleApiError(err, 'Error al subir la evidencia');
    }
  };

  const cargarContadoresBloques = async () => {
    if (!currentUser?.id) return;
    
    const orgId = orgIdResuelta || currentUser?.orgId;
    if (!orgId) return;

    try {
      let sid = socioIdGrows;
      if (!sid && currentUser.email) {
        const { data: socio } = await (supabase as any)
          .from('socios')
          .select('id')
          .eq('email', currentUser.email)
          .maybeSingle();
        sid = socio?.id ?? null;
      }
      if (!sid) return;

      const { count } = await (supabase as any)
        .from('tareas_subtareas')
        .select('*', { count: 'exact', head: true })
        .eq('socio_id', sid)
        .eq('estado', 'en_progreso');

      setBloquesActivosCount(count || 0);
    } catch (err) {
      // Error silencioso
    }
  };

  useEffect(() => {
    if (USE_MOCK_DATA) return;
    void cargarContadoresTareas();
    void cargarContadoresBloques();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- contadores encapsulados
  }, [socioIdGrows, orgIdResuelta, currentUser?.id, subtareaRefreshKey]);

  const handleEnviarParaValidar = async (evidenciaUrl?: string, videoUrl?: string, problemas?: string): Promise<boolean> => {
    if (!subtareaActual || !currentUser) return false;
    const requestKey = `enviar-validar:${subtareaActual.id}`;
    if (requestEnCursoRef.current.has(requestKey)) {
      toast({
        title: 'Procesando',
        description: 'Ya estamos enviando este bloque a validación.',
      });
      return false;
    }
    if (isFinalizando || isSendingTransition || isSendingToValidation) {
      return false;
    }

    const evidenciaObligatoria = subtareaActual.evidencia_obligatoria !== false;
    const evidenciaPersistida =
      Boolean(subtareaActual.evidencia_cargada) &&
      Boolean(String(subtareaActual.evidencia_url ?? '').trim());
    const tieneEvidencia =
      evidenciaPersistida || Boolean(String(evidenciaUrl ?? '').trim());
    if (evidenciaObligatoria && !tieneEvidencia) {
      handleApiError(
        { errorCode: 'EVIDENCIA_FALTANTE', message: 'Debés subir una foto antes de enviar a validar.' },
        'Debés subir una foto antes de enviar a validar.',
      );
      return false;
    }

    requestEnCursoRef.current.add(requestKey);
    setIsFinalizando(true);
    setIsSendingTransition(true);
    setIsSendingToValidation(true);
    setError(null);
    
    try {
      // El endpoint server-side guarda la evidencia y luego avanza la FSM.
      const response = await fetch(`/api/tareas-subtareas/${subtareaActual.id}/enviar-validar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          evidenciaUrl: evidenciaUrl ?? null,
          videoUrl: videoUrl ?? null,
          problemas: problemas ?? null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        handleApiError(errorData, 'Error al enviar el bloque para validar');
        setIsFinalizando(false);
        return false;
      }

      // Solo actualizar UI si la API confirma éxito
      toast({
        title: 'Bloque enviado para validar',
        description: 'El bloque está ahora en revisión.',
      });

      // Recargar subtarea
      const { data: subtareaData } = await (supabase as any)
        .from('tareas_subtareas')
        .select(SELECT_SUBTAREA_REL)
        .eq('id', subtareaActual.id)
        .maybeSingle();

      if (subtareaData) {
        setSubtareaActual(subtareaData);
      }

      /** Evita pisar `para_validar` con una lista recién leída que aún viene `en_progreso` */
      window.setTimeout(() => {
        setSubtareaRefreshKey((k) => k + 1);
      }, 850);

      // Recargar contadores y datos
      await cargarContadoresBloques();
      await fetchData();
      return true;
    } catch (err) {
      handleApiError(err, 'Error al enviar el bloque para validar. Por favor, intenta nuevamente.');
      return false;
    } finally {
      requestEnCursoRef.current.delete(requestKey);
      setIsSendingTransition(false);
      setIsSendingToValidation(false);
      setIsFinalizando(false);
    }
  };

  const handleStitchLiveSend = async ({
    mainPhotoFile,
    problemas,
    qcConfirmed,
  }: {
    mainPhotoFile: File;
    problemas?: string;
    qcConfirmed: boolean;
  }) => {
      if (!qcConfirmed) {
        throw new Error('Confirmá el control de calidad antes de enviar.');
      }
      const sid = subtareaActual?.id;
      if (!sid) {
        throw new Error('No encontramos el bloque activo.');
      }

      setIsUploadingEvidence(true);
      let dataUrl: string;
      try {
        dataUrl = await fileToEvidenceDataUrl(mainPhotoFile, 1200);
      } finally {
        setIsUploadingEvidence(false);
      }

      console.info('[EVIDENCIA_TRACE] 1/3 — Iniciando upload', { subtareaId: sid, tareaId: subtareaActual?.tarea_id });

      const response = await fetch('/api/upload/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ dataUrl, subtareaId: sid }),
      });
      const result = await response.json().catch(() => ({}));

      console.info('[EVIDENCIA_TRACE] 2/3 — Respuesta upload', {
        ok: response.ok,
        status: response.status,
        subtareaId: sid,
        trace: (result as { trace?: unknown }).trace ?? null,
        evidencia_url: (result as { evidencia_url?: string }).evidencia_url ?? null,
        error: (result as { message?: string; error?: string }).message ?? (result as { error?: string }).error ?? null,
      });

      if (!response.ok) {
        const msg = (result as any).message || (result as any).error || 'Error al subir evidencia';
        throw new Error(msg);
      }

      const trace = (result as { trace?: { historial?: { eventoId?: string; mediaId?: string; tareaId?: string }; historialError?: string | null } }).trace;
      if (trace?.historialError) {
        console.warn('[EVIDENCIA_TRACE] Historial parcial — reintentará en enviar-validar', trace.historialError);
      }

      const urlUsable =
        (result as any).evidencia_url ?? (result as any).publicUrl ?? (result as any).path;
      if (!urlUsable) {
        throw new Error('La subida no devolvió una URL de evidencia usable');
      }

      console.info('[EVIDENCIA_TRACE] 3/3 — Enviando a validar', {
        subtareaId: sid,
        evidenciaUrl: urlUsable,
        eventoId: trace?.historial?.eventoId ?? null,
        mediaId: trace?.historial?.mediaId ?? null,
        tareaId: trace?.historial?.tareaId ?? subtareaActual?.tarea_id ?? null,
      });

      const ok = await handleEnviarParaValidar(String(urlUsable), undefined, problemas);
      if (!ok) {
        throw new Error('No se pudo enviar el bloque a validación.');
      }

      console.info('[EVIDENCIA_TRACE] COMPLETADO', {
        subtareaId: sid,
        evidenciaUrl: urlUsable,
        tareaId: subtareaActual?.tarea_id ?? null,
      });
    };

  const handleFinalizarSubtarea = async (evidenciaUrl?: string, videoUrl?: string, problemas?: string) => {
    if (!subtareaActual || !currentUser) return;

    if (USE_MOCK_DATA) {
      toast({
        title: 'Bloque enviado para validar (demo)',
        description: 'Simulación: el bloque quedó en revisión. Sin conexión a base de datos.',
      });
      setSubtareaActual(null);
      setSubtareasCompletadas(3);
      setTareasCompletadasHoy(3);
      setShowModalFinalizarSubtarea(false);
      return;
    }

    // Usar enviarParaValidar en lugar de actualizar directamente
    const ok = await handleEnviarParaValidar(evidenciaUrl, videoUrl, problemas);
    if (!ok) return;

    setSubtareaRefreshKey((k) => k + 1);

    setShowModalFinalizarSubtarea(false);
  };

  const handleCompletarTarea = async () => {
    const tareaId = subtareaActual?.tarea_id || subtareaActual?.tareas?.id || tareaActual?.id;
    if (!tareaId || !currentUser) return;

    try {
      // Actualizar tarea principal a COMPLETADA
      const { error: updateError } = await (supabase as any)
        .from('tareas')
        .update({ estado: 'COMPLETADA' })
        .eq('id', tareaId);

      if (updateError) {
        return;
      }

      // Enviar notificación al cliente técnico
      const orgId = orgIdResuelta || currentUser?.orgId;
      if (orgId) {
        // Obtener obra_id de la tarea
        const { data: tareaData } = await (supabase as any)
          .from('tareas')
          .select('obra_id')
          .eq('id', tareaId)
          .maybeSingle();

        if (tareaData?.obra_id) {
          // Obtener owner_user_id de la organización
          const { data: orgData } = await (supabase as any)
            .from('organizaciones')
            .select('owner_user_id')
            .eq('id', orgId)
            .maybeSingle();

          if (orgData?.owner_user_id) {
            await (supabase as any)
              .from('notificaciones')
              .insert({
                titulo: 'Tarea completada',
                mensaje: `Todas las subtareas de la tarea han sido completadas`,
                tipo: 'avance',
                remitente_id: currentUser.id,
                destinatario_id: orgData.owner_user_id,
                org_id: orgId,
              });
          }
        }
      }
    } catch (err) {
      // Error silencioso
    }
  };

  const handleFinalizarTarea = async (fotoDataUrl?: string) => {
    if (!tareaActual || !currentUser) return;

    // Si hay subtareas, usar el flujo de subtareas
    if (subtareaActual) {
      await handleFinalizarSubtarea(fotoDataUrl);
      return;
    }

    // Tarea en progreso sin bloque visible: generar + vincular subtarea operativa.
    await handleComenzarBloqueOperativo();
    return;

    // Validar que haya al menos una evidencia final
    if (evidenciasFinales.length === 0 && !fotoDataUrl) {
      setError('Para finalizar la tarea es necesario subir al menos una evidencia fotográfica.');
      return;
    }

    setIsFinalizando(true);
    
    // Efecto verde: agregar clase al body
    document.body.classList.add('bg-green-50');
    setTimeout(() => {
      document.body.classList.remove('bg-green-50');
    }, 2000);

    try {
      const media = fotoDataUrl ? [{
        kind: 'evidencia_final' as const,
        dataUrl: fotoDataUrl,
      }] : [];
      void media;

      const response = await Promise.resolve(new Response(null, { status: 410 }));
      /*
      await fetch(`/api/tareas/${tareaActual.id}/transition-deshabilitado`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nuevo_estado: 'finalizado',
          notas: 'Tarea finalizada desde la sección Ahora',
          checklist: checklistItems.map(item => ({
            id: item.id,
            label: item.label,
            checked: item.done,
          })),
          has_nc: false,
          actor: {
            name: currentUser.name || currentUser.email || 'Socio',
            role: 'Socio',
            method: 'login',
          },
          media,
        }),
      });
      */

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        handleApiError(errorData, `Error ${response.status}: ${response.statusText}`);
        setIsFinalizando(false);
        return;
      }

      const orgId = orgIdResuelta || currentUser?.orgId;

      // Recalcular tareas completadas hoy
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const hoyISO = hoy.toISOString();
      
      // Primero obtener las tareas de la organización
      const { data: tareasOrg } = await supabase
        .from('tareas')
        .select('id')
        .eq('org_id', orgId || '');

      const tareasOrgRows = (tareasOrg ?? []) as Array<{ id: string }>;
      if (tareasOrgRows.length > 0) {
        const tareaIds = tareasOrgRows.map((t: any) => t.id);
        
        const { data: eventosHoy, error: evHoyErr } = await supabase
          .from('eventos')
          .select('tarea_id')
          .in('tarea_id', tareaIds)
          .eq('nuevo_estado', 'validada')
          .gte('created_at', hoyISO);

        if (evHoyErr) {
          console.error('[AhoraSection] eventos post-finalizar:', evHoyErr);
        } else {
          const eventosHoyRows = (eventosHoy ?? []) as Array<{ tarea_id: string | null }>;
          const tareasUnicas = new Set(eventosHoyRows.map((e: any) => e.tarea_id));
          setTareasCompletadasHoy(tareasUnicas.size);
        }
      }

      // Recalcular progreso general
      const socioCtxProg = await fetchSocioContextClient();
      const orProg = await buildOrClauseAsignacionSocio(supabase as any, socioCtxProg?.id);
      let qProg = supabase
        .from('tareas')
        .select('id, estado, avance')
        .eq('org_id', orgId || '');
      if (orProg.length > 0) {
        qProg = qProg.or(orProg.join(','));
      }
      const { data: todasLasTareas } = await qProg;

      const todasLasTareasRows = (todasLasTareas ?? []) as Array<{ estado?: string | null; avance?: number | null }>;
      if (todasLasTareasRows.length > 0) {
        const total = todasLasTareasRows.length;
        const completadas = todasLasTareasRows.filter((t: any) => {
          const e = (t.estado || '').toLowerCase();
          return e === 'validada' || e === 'rechazada' || t.avance === 100;
        }).length;
        const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;
        setProgresoGeneral({ completadas, total, porcentaje });
      }

      // Refrescar datos después de finalizar
      await fetchData();
    } catch (err: any) {
      handleApiError(err, 'Error al finalizar la tarea. Por favor, intenta nuevamente.');
    } finally {
      setIsFinalizando(false);
      // Remover efecto verde después de 2 segundos
      setTimeout(() => {
        const mainContainer = document.querySelector('.ahora-container') as HTMLElement;
        if (mainContainer) {
          mainContainer.classList.remove('bg-green-50');
        }
        document.body.classList.remove('bg-green-50');
      }, 2000);
    }
  };

  const handleIncrementarAvance = async (incremento: number) => {
    if (!tareaActual || !currentUser) return;

    const nuevoAvance = Math.min(100, Math.max(0, (tareaActual.avance || 0) + incremento));
    
    try {
      setAvanceDiario(nuevoAvance);
    } catch (err) {
      // Error silencioso
    }
  };

  const handleSaveChecklist = async (items: ChecklistItem[]) => {
    setChecklistItems(items);
    // El checklist local no debe disparar transiciones; el envío real ocurre con evidencia en el bloque.
  };

  // Mapear estados visuales según FSM
  const getEstadoBadge = (estado: string | null) => {
    const estadoLower = (estado || '').toLowerCase();
    
    // Estados oficiales FSM
    if (estadoLower === 'pendiente' || estadoLower === 'asignada') {
      return { variant: 'warning' as const, label: 'Listo para empezar' };
    }
    if (estadoLower === 'en_progreso' || estadoLower.includes('ejecucion')) {
      return { variant: 'info' as const, label: 'En curso' };
    }
    if (estadoLower === 'para_validar' || estadoLower === 'finalizado' || estadoLower === 'finalizada') {
      return { variant: 'info' as const, label: 'En revisión' };
    }
    if (estadoLower === 'validado' || estadoLower === 'validada') {
      return { variant: 'success' as const, label: 'Aprobado' };
    }
    if (estadoLower === 'rechazado' || estadoLower === 'rechazada') {
      return { variant: 'warning' as const, label: 'Rehacer' };
    }
    return { variant: 'default' as const, label: estado || 'Sin estado' };
  };

  const getEstadoSubtareaLabel = (estado: string | null) => {
    const estadoLower = (estado || '').toLowerCase();
    
    if (estadoLower === 'pendiente') return 'Listo para empezar';
    if (estadoLower === 'en_progreso') return 'En curso';
    if (estadoLower === 'para_validar') return 'En revisión';
    if (estadoLower === 'validado' || estadoLower === 'validada') return 'Aprobado';
    if (estadoLower === 'rechazado' || estadoLower === 'rechazada') return 'Rehacer';
    return estado || 'Sin estado';
  };

  const isTareaEnProgreso = tareaActual?.estado?.toLowerCase() === 'en_ejecucion' || 
                            tareaActual?.estado?.toLowerCase() === 'en_progreso';

  useEffect(() => {
    if (USE_MOCK_DATA) {
      setBloquesLista(
        Array.from({ length: 12 }, (_, i) => ({
          id: `mock-${i}`,
          orden: i + 1,
          estado: i < 2 ? 'validado' : i === 2 ? 'en_progreso' : 'pendiente',
        })),
      );
      return;
    }
    const tid = (subtareaActual?.tarea_id as string | undefined) || tareaActual?.id;
    if (!tid) {
      setBloquesLista([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await (supabase as any)
        .from('tareas_subtareas')
        .select('id, estado, orden')
        .eq('tarea_id', tid)
        .order('orden', { ascending: true });
      if (!cancelled) {
        setBloquesLista(
          (data as Array<{ id: string; orden: number; estado: string }> | null) || [],
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [subtareaActual?.tarea_id, tareaActual?.id, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-[#4A6FA5] mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Cargando tareas...</p>
        </div>
      </div>
    );
  }

  if (error && !tareaActual) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  /** Pantalla inmersiva igual a `/socio/ahora/demo`, con datos de la tarea/bloque desde Supabase/API */
  const muestraStitchEnVivo =
    !USE_MOCK_DATA &&
    Boolean(jornadaActual) &&
    Boolean(subtareaActual) &&
    String(subtareaActual.estado || '').toLowerCase() === 'en_progreso';

  const shouldRenderStitch =
    (muestraStitchEnVivo && subtareaActual) || (stitchLockedAfterSent && lastStitchPropsRef.current);

  if (shouldRenderStitch) {
    let stitchProps = lastStitchPropsRef.current;
    if (muestraStitchEnVivo && subtareaActual) {
      const runningChecklist: AhoraStitchChecklistItem[] =
        bloquesLista.length > 0
          ? bloquesToRunningChecklist(bloquesLista, subtareaActual.id)
          : [
              {
                id: String(subtareaActual.id),
                title: `Bloque ${subtareaActual.orden ?? 1}`,
                state: 'active',
              },
            ];

      const obraLine = [subtareaActual.tareas?.obras?.name, subtareaActual.tareas?.obras?.address]
        .filter(Boolean)
        .join(' — ');

      const microStepTitles =
        checklistItems.length > 0
          ? checklistItems.map((it) => (it.label?.trim() ? it.label : 'Ítem'))
          : [`Ejecución del bloque ${subtareaActual.orden ?? 1}`];

      stitchProps = {
        taskTitle: subtareaActual.tareas?.title || tareaActual?.title || 'Tarea en curso',
        obraLine: obraLine || null,
        runningChecklist,
        microStepTitles,
        progresoHecho: Math.min(subtareasCompletadas, Math.max(totalSubtareas, 1)),
        progresoTotal: Math.max(totalSubtareas || 1, 1),
        initialElapsedSeconds: bloqueElapsedSeconds(subtareaActual),
      };
      lastStitchPropsRef.current = stitchProps;
    }

    if (!stitchProps) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center p-6 text-sm text-gray-600">
          Cargando confirmación…
        </div>
      );
    }

    return (
      <AhoraJornadaActivaStitch
        mode="live"
        taskTitle={stitchProps.taskTitle}
        obraLine={stitchProps.obraLine}
        runningChecklist={stitchProps.runningChecklist}
        microStepTitles={stitchProps.microStepTitles}
        progresoHecho={stitchProps.progresoHecho}
        progresoTotal={stitchProps.progresoTotal}
        initialElapsedSeconds={stitchProps.initialElapsedSeconds}
        onSendValidationLive={handleStitchLiveSend}
        onSendSuccess={() => setStitchLockedAfterSent(true)}
        onSentDismiss={() => {
          setStitchLockedAfterSent(false);
          lastStitchPropsRef.current = null;
        }}
      />
    );
  }

  // Determinar texto del CTA principal
  const getCTAText = () => {
    if (subtareaActual) {
      const estadoSub = normEstadoSub(subtareaActual.estado);
      // Flujo con subtareas
      if (!jornadaActual) return 'Iniciar jornada';
      if (estadoSub === 'pendiente') {
        // Validar límite antes de mostrar botón
        if (bloquesActivosCount >= 2) return 'Límite alcanzado (2 bloques activos)';
        return 'Comenzar bloque';
      }
      if (estadoSub === 'rechazado' || estadoSub === 'rechazada') {
        return 'Rehacer bloque';
      }
      if (estadoSub === 'en_progreso') return 'Enviar para validar';
      if (estadoSub === 'para_validar') return 'En revisión (cliente)';
      if (subtareaEstaCompletadaOficial(subtareaActual.estado)) return 'Bloque aprobado';
      return 'Iniciar jornada';
    } else if (tareaActual) {
      // Modo compatibilidad: flujo con tarea completa
      if (!jornadaActual) return 'Iniciar jornada';
      if (!isTareaEnProgreso) {
        // Validar límite antes de mostrar botón
        if (tareasActivasCount >= 2) return 'Límite alcanzado (2 tareas activas)';
        if (tareaOperableBackend === false) {
          return 'Sin permiso para operar esta tarea';
        }
        return 'Comenzar tarea';
      }
        return 'Comenzar bloque';
    }
    return 'Iniciar jornada';
  };

  // Determinar función del CTA
  const handleCTAClick = () => {
    if (subtareaActual) {
      const estadoSub = normEstadoSub(subtareaActual.estado);
      // Flujo con subtareas
      if (!jornadaActual) {
        handleIniciarJornada();
      } else if (estadoSub === 'pendiente' || estadoSub === 'rechazado' || estadoSub === 'rechazada') {
        // Validar límite antes de permitir acción
        if (bloquesActivosCount >= 2 && estadoSub !== 'rechazado' && estadoSub !== 'rechazada') {
          handleApiError({ errorCode: 'SOCIO_TIENE_2_BLOQUES_EN_PROGRESO' }, 'Ya tenés 2 bloques en progreso');
          return;
        }
        void handleComenzarBloqueOperativo(String(subtareaActual.id));
        return;
      } else if (estadoSub === 'en_progreso') {
        setShowModalFinalizarSubtarea(true);
      } else if (
        estadoSub === 'para_validar' ||
        subtareaEstaCompletadaOficial(subtareaActual.estado)
      ) {
        toast({
          title: 'Bloque cerrado',
          description:
            estadoSub === 'para_validar'
              ? 'Este bloque ya fue enviado a validación. Esperá la respuesta del cliente.'
              : 'Este bloque ya fue aprobado.',
        });
      } else {
        toast({
          title: 'Estado no reconocido',
          description: `El bloque está en estado «${subtareaActual.estado ?? 'desconocido'}». Contactá soporte si persiste.`,
          variant: 'destructive',
        });
      }
    } else if (tareaActual) {
      // Modo compatibilidad: flujo con tarea completa
      if (!jornadaActual) {
        handleIniciarJornada();
      } else if (!isTareaEnProgreso) {
        // Validar límite antes de permitir acción
        if (tareasActivasCount >= 2) {
          handleApiError({ errorCode: 'SOCIO_TIENE_2_TAREAS_EN_PROGRESO' }, 'Ya tenés 2 tareas en progreso');
          return;
        }
        if (tareaOperableBackend === false) {
          handleApiError(
            {
              errorCode: 'SOCIO_NO_AUTORIZADO_TAREA',
              message:
                'Esta tarea no está asignada a tu perfil de socio según el servidor. Código: ' +
                (tareaOperableMotivo || 'SOCIO_NO_AUTORIZADO_TAREA'),
            },
            'No podés iniciar esta tarea',
          );
          return;
        }
        void handleIniciarTarea([]);
        return;
      } else {
        void handleComenzarBloqueOperativo();
      }
    }
  };

  // Determinar si el CTA está deshabilitado
  const isCTADisabled = () => {
    // Siempre habilitado si hay tarea o subtarea
    if (!subtareaActual && !tareaActual) return true;
    if (
      subtareaActual &&
      (subtareaActual.estado === 'para_validar' ||
        subtareaEstaCompletadaOficial(subtareaActual.estado))
    ) {
      return true;
    }
    if (
      tareaActual &&
      !subtareaActual &&
      jornadaActual &&
      !isTareaEnProgreso &&
      tareaOperableBackend === false
    ) {
      return true;
    }
    return isIniciando || isFinalizando || isGeneratingBlocks || isSendingTransition || isUploadingEvidence || isSendingToValidation;
  };

  const jornadaEstadoLabel = !jornadaActual
    ? 'Listo para empezar'
    : subtareaActual?.estado === 'para_validar'
      ? 'Para validar'
      : subtareaActual?.estado === 'en_progreso' || isTareaEnProgreso
        ? 'En progreso'
        : 'Jornada activa';

  const bloqueCardClass = (estado: string) => {
    const e = (estado || '').toLowerCase();
    if (subtareaEstaCompletadaConLegacy(estado))
      return 'border-[#163274]/15 bg-[#f2f4f6] text-[#43617c]';
    if (e === 'para_validar') return 'border-amber-200/80 bg-amber-50/50 text-[#43617c]';
    if (e === 'en_progreso') return 'border-[#163274]/40 bg-white text-[#163274] ring-1 ring-[#163274]/20';
    return 'border-slate-100 bg-white text-slate-500';
  };

  return (
    <div
      className={`ahora-container min-h-screen bg-[#f7f9fb] pb-[calc(var(--socio-tab-h,4.25rem)+1rem)] font-stitch-body md:pb-8 ${isIniciando ? 'bg-amber-50/80' : isFinalizando ? 'bg-[#f2f4f6]' : ''}`}
    >
      {/* Hero jornada (referencia _02_ahora: saludo + estado) */}
      <div className="px-5 pb-2 pt-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#43617c]">Tu jornada de hoy</p>
        <h1 className="mt-1 font-stitch-headline text-3xl font-extrabold tracking-tight text-[#163274]">
          Hola,{' '}
          {currentUser?.name?.split(' ')[0] ||
            currentUser?.email?.split('@')[0] ||
            'socio'}
        </h1>
        <p className="mt-2 inline-flex items-center rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-[#43617c] shadow-sm ring-1 ring-[#163274]/10">
          {jornadaEstadoLabel}
        </p>
      </div>

      {/* Card principal tipo stitch: bloque azul + CTA blanco */}
      {subtareaActual ? (
        <div className="mx-4 mt-5">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#163274] to-[#0a1f4a] px-5 pb-6 pt-6 text-center text-white shadow-[0_20px_50px_rgba(22,50,116,0.25)]">
            <div className="relative z-10 flex flex-col items-center gap-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                <span
                  className={`h-2 w-2 rounded-full ${
                    subtareaActual.estado === 'en_progreso' ? 'bg-white animate-pulse' : 'bg-amber-300'
                  }`}
                />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/90">
                  {getEstadoSubtareaLabel(subtareaActual.estado)}
                </span>
              </div>
              {subtareaActual.tareas?.obras?.name ? (
                <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                  {subtareaActual.tareas.obras.name}
                </p>
              ) : null}
              <h2 className="font-stitch-headline text-2xl font-extrabold leading-tight">
                {subtareaActual.tareas?.title || 'Tarea del día'}
              </h2>
              {subtareaActual.tareas?.obras?.address ? (
                <p className="flex items-center justify-center gap-1.5 text-sm text-white/75">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="line-clamp-2">{subtareaActual.tareas.obras.address}</span>
                </p>
              ) : null}
              {totalSubtareas > 0 ? (
                <p className="text-sm font-medium text-white/85">
                  Bloque {subtareaActual.orden} de {totalSubtareas}
                </p>
              ) : null}
              {(subtareaActual || tareaActual) && (
                <button
                  type="button"
                  onClick={handleCTAClick}
                  disabled={isCTADisabled()}
                  className="w-full max-w-sm rounded-2xl bg-white py-4 text-base font-extrabold uppercase tracking-wide text-[#163274] shadow-xl transition hover:bg-[#f2f4f6] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.99]"
                >
                  {isGeneratingBlocks
                    ? 'Vinculando bloque…'
                    : isSendingTransition
                      ? 'Actualizando…'
                      : isIniciando
                        ? 'Iniciando…'
                        : isFinalizando
                          ? 'Enviando…'
                          : getCTAText()}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : tareaActual ? (
        <div className="mx-4 mt-5">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#163274] to-[#0a1f4a] px-5 pb-6 pt-6 text-center text-white shadow-[0_20px_50px_rgba(22,50,116,0.25)]">
            <div className="relative z-10 flex flex-col items-center gap-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1">
                <span
                  className={`h-2 w-2 rounded-full ${isTareaEnProgreso ? 'bg-white animate-pulse' : 'bg-amber-300'}`}
                />
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/90">
                  {isTareaEnProgreso ? 'En curso' : 'Pendiente'}
                </span>
              </div>
              {tareaActual.obras?.name ? (
                <p className="text-xs font-semibold uppercase tracking-wide text-white/70">{tareaActual.obras.name}</p>
              ) : null}
              <h2 className="font-stitch-headline text-2xl font-extrabold leading-tight">{tareaActual.title || 'Tarea'}</h2>
              {tareaActual.obras?.address ? (
                <p className="flex items-center justify-center gap-1.5 text-sm text-white/75">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="line-clamp-2">{tareaActual.obras.address}</span>
                </p>
              ) : null}
              <button
                type="button"
                onClick={handleCTAClick}
                disabled={isCTADisabled()}
                className="w-full max-w-sm rounded-2xl bg-white py-4 text-base font-extrabold uppercase tracking-wide text-[#163274] shadow-xl transition hover:bg-[#f2f4f6] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.99]"
              >
                {isGeneratingBlocks
                  ? 'Vinculando bloque…'
                  : isSendingTransition
                    ? 'Actualizando…'
                    : isIniciando
                      ? 'Iniciando…'
                      : isFinalizando
                        ? 'Enviando…'
                        : getCTAText()}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mx-4 mt-5 rounded-3xl border border-[#163274]/10 bg-white p-8 text-center shadow-sm">
          <CheckCircle className="mx-auto mb-3 h-14 w-14 text-[#163274]/40" />
          <h2 className="font-stitch-headline text-lg font-bold text-[#163274]">No hay tareas asignadas</h2>
          <p className="mt-2 text-sm text-[#434653]">Cuando te asignen trabajo, lo vas a ver acá.</p>
        </div>
      )}

      {/* Acciones secundarias: fila compacta */}
      {(subtareaActual || tareaActual) && (
        <div className="mx-4 mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setGateIntentInicioChecklist(null);
              setShowChecklist(true);
            }}
            disabled={!(subtareaActual?.estado === 'en_progreso' || (tareaActual && isTareaEnProgreso))}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-2xl border border-[#163274]/12 bg-white px-3 py-2.5 text-xs font-bold text-[#163274] shadow-sm disabled:opacity-40"
          >
            <CheckSquare className="h-4 w-4" />
            Checklist
          </button>
          <button
            type="button"
            onClick={() => setShowEvidencias(true)}
            disabled={!(subtareaActual?.estado === 'en_progreso' || (tareaActual && isTareaEnProgreso))}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-2xl border border-[#163274]/12 bg-white px-3 py-2.5 text-xs font-bold text-[#163274] shadow-sm disabled:opacity-40"
          >
            <Camera className="h-4 w-4" />
            Evidencias
          </button>
          <button
            type="button"
            onClick={() => {
              const obraId = subtareaActual?.tareas?.obra_id || tareaActual?.obra_id;
              if (obraId) router.push(`/socio/planos/${obraId}` as any);
              else setShowPlanos(true);
            }}
            disabled={!(subtareaActual?.estado === 'en_progreso' || (tareaActual && isTareaEnProgreso))}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-2xl border border-[#163274]/12 bg-white px-3 py-2.5 text-xs font-bold text-[#163274] shadow-sm disabled:opacity-40"
          >
            <FileText className="h-4 w-4" />
            Planos
          </button>
          <button
            type="button"
            onClick={() => setShowChat(true)}
            disabled={!(subtareaActual?.estado === 'en_progreso' || (tareaActual && isTareaEnProgreso))}
            className="flex min-h-[44px] flex-1 basis-[100%] items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-[#f2f4f6] px-3 py-2.5 text-xs font-semibold text-[#43617c] disabled:opacity-40 sm:basis-auto"
          >
            <MessageSquare className="h-4 w-4" />
            Chat obra
          </button>
        </div>
      )}

      {/* Bloques del día — cards limpias */}
      {(subtareaActual || tareaActual) && bloquesLista.length > 0 && (
        <div className="mx-4 mt-6">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#43617c]">Bloques del día</p>
          <div className="space-y-2">
            {bloquesLista.map((b) => {
              const e = (b.estado || '').toLowerCase();
              const label =
                subtareaEstaCompletadaConLegacy(b.estado)
                  ? 'Validado'
                  : e === 'para_validar'
                    ? 'Para validar'
                    : e === 'en_progreso'
                      ? 'En progreso'
                      : e === 'rechazado' || e === 'rechazada'
                        ? 'Rechazado'
                        : 'Pendiente';
              return (
                <div
                  key={b.id}
                  className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${bloqueCardClass(b.estado)}`}
                >
                  <span className="text-sm font-bold text-[#163274]">Bloque {b.orden}</span>
                  <span className="text-xs font-semibold text-[#43617c]">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resumen corto */}
      <div className="mx-4 mt-6 rounded-2xl border border-[#163274]/10 bg-white p-4 shadow-sm">
        {tareasProgramadasHoy > 0 ? (
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-[#434653]">
                {subtareaActual ? 'Subtareas' : 'Tareas'} pendientes:{' '}
                <span className="font-bold text-[#163274]">{tareasProgramadasHoy}</span>
              </p>
              <p className="mt-1 text-xs text-[#43617c]">
                Completaste{' '}
                <span className="font-semibold text-[#163274]">{tareasCompletadasHoy}</span>
              </p>
            </div>
            {avanceDiario > 0 && <Progress value={avanceDiario} className="h-2 w-28" />}
          </div>
        ) : (
          <p className="text-center text-sm text-[#434653]">No hay ítems pendientes en el contador de hoy.</p>
        )}
      </div>

      {subtareaActual && subtareaEstaCompletadaConLegacy(subtareaActual.estado) && (
        <div className="mx-4 mt-4 rounded-2xl border border-[#163274]/15 bg-[#d8e2ff]/30 p-4">
          <p className="text-center text-sm font-medium text-[#163274]">
            Bloque listo. Continuá con el siguiente cuando corresponda.
          </p>
        </div>
      )}

      {!subtareaActual && tareasProgramadasHoy > 0 && (
        <div className="mx-4 mt-4 rounded-2xl border border-[#163274]/10 bg-white p-4 shadow-sm">
          <p className="text-center text-sm text-[#434653]">Tenés trabajo pendiente en tu lista.</p>
        </div>
      )}

      {jornadaActual && !jornadaActual.hora_fin && (
        <div className="mx-4 mt-6">
          <button
            type="button"
            onClick={async () => {
              if (!jornadaActual?.id) return;
              try {
                const { error } = await (supabase as any)
                  .from('jornadas_socio')
                  .update({ hora_fin: new Date().toISOString() })
                  .eq('id', jornadaActual.id);

                if (error) throw error;

                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                const hoyISO = hoy.toISOString().split('T')[0];
                const { data: jornadaData } = await (supabase as any)
                  .from('jornadas_socio')
                  .select('*')
                  .eq('socio_id', socioIdGrows || '')
                  .eq('fecha', hoyISO)
                  .maybeSingle();
                setJornadaActual(jornadaData);
              } catch (err) {
                setError('Error al finalizar jornada');
              }
            }}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 text-sm font-semibold text-[#43617c] transition hover:bg-[#f2f4f6]"
          >
            Finalizar jornada
          </button>
        </div>
      )}


      {/* Modales */}
      {showChecklist && (tareaActual || subtareaActual) && (
        <ChecklistModal
          tarea={
            tareaActual
              ? { id: tareaActual.id, nombre: tareaActual.title || '', title: tareaActual.title || '' }
              : {
                  id:
                    subtareaActual?.tareas?.id ??
                    subtareaActual?.tarea_id ??
                    'fallback-tarea',
                  nombre:
                    subtareaActual?.tareas?.title ?? subtareaActual?.title ?? 'Tarea del bloque',
                  title:
                    subtareaActual?.tareas?.title ?? subtareaActual?.title ?? 'Tarea del bloque',
                }
          }
          onClose={() => {
            setShowChecklist(false);
            setGateIntentInicioChecklist(null);
          }}
          onSave={handleSaveChecklist}
          initialItems={USE_MOCK_DATA ? MOCK_CHECKLIST_ITEMS : undefined}
          preStartGate={gateIntentInicioChecklist !== null}
          startWorkButtonLabel={
            gateIntentInicioChecklist === 'subtarea'
              ? subtareaActual?.estado === 'rechazado' ||
                  subtareaActual?.estado === 'rechazada'
                ? 'Rehacer bloque'
                : 'Comenzar bloque'
              : 'Comenzar tarea'
          }
          onStartWork={
            gateIntentInicioChecklist !== null
              ? async (items) => {
                  if (gateIntentInicioChecklist === 'subtarea') {
                    await handleIniciarSubtarea();
                    return;
                  }
                  await handleIniciarTarea(items);
                }
              : undefined
          }
        />
      )}

      {showChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Chat</h2>
              <button
                onClick={() => setShowChat(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <MensajeriaSocio />
            </div>
          </div>
        </div>
      )}

      {/* Modal Planos */}
      {showPlanos && tareaActual?.obra_id && (
        <ModalVerPlanos
          open={showPlanos}
          onClose={() => setShowPlanos(false)}
          obraId={tareaActual.obra_id}
        />
      )}

      {/* Modal Evidencias */}
      {showEvidencias && tareaActual && (
        <ModalEvidencias
          tareaId={tareaActual.id}
          obraId={tareaActual.obra_id || ''}
          subtareaId={subtareaActual?.id}
          onClose={() => setShowEvidencias(false)}
          onEvidenciaFinalSubida={() => {
            setEvidenciasFinales([...evidenciasFinales, 'nueva']);
          }}
          onFinalizarSubtarea={handleFinalizarSubtarea}
          onSubtareaEvidenciaRefreshed={
            subtareaActual?.id ? () => void recargarSubtareaPorId(subtareaActual.id) : undefined
          }
        />
      )}

      {/* Modal obligatorio para finalizar subtarea */}
      {showModalFinalizarSubtarea && subtareaActual && (
        <ModalFinalizarSubtarea
          subtareaId={subtareaActual.id}
          tareaId={subtareaActual.tarea_id || subtareaActual.tareas?.id}
          obraId={subtareaActual.tareas?.obra_id || tareaActual?.obra_id}
          onClose={() => setShowModalFinalizarSubtarea(false)}
          onFinalizar={handleFinalizarSubtarea}
          onUploadingChange={setIsUploadingEvidence}
          onEvidenciaUploadOk={
            subtareaActual?.id ? () => void recargarSubtareaPorId(subtareaActual.id) : undefined
          }
        />
      )}

    </div>
  );
}

// Componente Modal de Evidencias
function ModalEvidencias({ 
  tareaId, 
  obraId,
  subtareaId,
  onClose, 
  onEvidenciaFinalSubida,
  onFinalizarSubtarea,
  onSubtareaEvidenciaRefreshed,
}: { 
  tareaId: string; 
  obraId: string;
  subtareaId?: string;
  onClose: () => void; 
  onEvidenciaFinalSubida: () => void;
  onFinalizarSubtarea?: (evidenciaUrl?: string, videoUrl?: string, problemas?: string) => void;
  onSubtareaEvidenciaRefreshed?: () => void | Promise<void>;
}) {
  const [evidencias, setEvidencias] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [tipoEvidencia, setTipoEvidencia] = useState<'evidencia_parcial' | 'evidencia_final'>('evidencia_parcial');
  const [problemas, setProblemas] = useState('');
  const [evidenciaUrlActual, setEvidenciaUrlActual] = useState<string | null>(null);
  const [videoUrlActual, setVideoUrlActual] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClientComponentClient<Database>();
  const { toast } = useToast();

  // Helper para manejar errores de API
  const handleApiError = (error: any, defaultMessage: string) => {
    const errorMessage = error?.message || error?.error || defaultMessage;
    toast({
      title: 'Error',
      description: errorMessage,
      variant: 'destructive',
    });
  };

  const cargarVistaEvidencias = async () => {
    setLoading(true);
    try {
      if (subtareaId) {
        const { data, error } = await (supabase as any)
          .from('tareas_subtareas')
          .select('evidencia_url, evidencia_cargada')
          .eq('id', subtareaId)
          .maybeSingle();
        if (error) {
          setEvidencias([]);
          return;
        }
        const url = data?.evidencia_url as string | null | undefined;
        if (url?.trim()) {
          setEvidencias([
            {
              id: subtareaId,
              url: url.trim(),
              tipo: 'evidencia_bloque',
              descripcion: 'Evidencia del bloque',
            },
          ]);
        } else {
          setEvidencias([]);
        }
      } else {
        setEvidencias([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargarVistaEvidencias();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recargar al cambiar bloque/tarea
  }, [tareaId, subtareaId]);

  // Helper para comprimir imagen a máximo 1200px
  const comprimirImagen = (file: File, maxWidth: number = 1200): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo obtener contexto del canvas'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!fileLooksLikeImage(file)) {
      toast({
        title: 'No pudimos usar esta imagen',
        description:
          'Algunos móviles no envían el tipo de archivo al sacar foto. Probá de nuevo o elegí la misma foto desde «Galería».',
        variant: 'destructive',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      return;
    }

    if (!subtareaId?.trim()) {
      toast({
        title: 'Sin bloque activo',
        description: 'No hay bloque activo para asociar esta evidencia.',
        variant: 'destructive',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      return;
    }

    setUploading(true);
    try {
      const dataUrl = await comprimirImagen(file, 1200);

      const response = await fetch('/api/upload/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ dataUrl, subtareaId }),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        const msg =
          responseData.message ||
          responseData.error ||
          'Error al subir la evidencia';
        handleApiError(responseData, msg);
        return;
      }

      const urlUsable =
        responseData.evidencia_url ?? responseData.publicUrl ?? responseData.path ?? null;
      if (urlUsable) {
        setEvidenciaUrlActual(String(urlUsable));
      }

      await cargarVistaEvidencias();
      await onSubtareaEvidenciaRefreshed?.();

      if (tipoEvidencia === 'evidencia_final') {
        onEvidenciaFinalSubida();
      }
    } catch (err) {
      handleApiError(
        err,
        err instanceof Error ? err.message : 'Error al subir la evidencia',
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const srcEvidenciaModal = (url: string) => {
    const u = url.trim();
    if (!u) return u;
    if (/^https?:\/\//i.test(u)) return u;
    return supabase.storage.from('evidencias').getPublicUrl(u).data.publicUrl;
  };

  const handleVideoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        
        // Subir video al bucket evidencias_video
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('evidencias_video')
          .upload(`${tareaId}/${Date.now()}-${file.name}`, file);

        if (uploadError) {
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('evidencias_video')
          .getPublicUrl(uploadData.path);

        setVideoUrlActual(publicUrl);
        await cargarVistaEvidencias();
      };
      reader.readAsDataURL(file);
    } catch (err) {
      // Error silencioso
    } finally {
      setUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Evidencias de la tarea
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Selector de tipo de evidencia */}
          <div className="flex gap-2">
            <Button
              variant={tipoEvidencia === 'evidencia_parcial' ? 'default' : 'outline'}
              onClick={() => setTipoEvidencia('evidencia_parcial')}
              className="flex-1"
            >
              Evidencia Parcial
            </Button>
            <Button
              variant={tipoEvidencia === 'evidencia_final' ? 'default' : 'outline'}
              onClick={() => setTipoEvidencia('evidencia_final')}
              className="flex-1"
            >
              Evidencia Final
            </Button>
          </div>

          {/* Botones de subida */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#4A6FA5] transition-colors">
              <Camera className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">Tomar foto</span>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture
                onChange={(e) => handleFileSelect(e)}
                className="hidden"
                disabled={uploading}
              />
            </label>
            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#4A6FA5] transition-colors">
              <Image className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">Elegir de galería</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e)}
                className="hidden"
                disabled={uploading}
              />
            </label>
            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#4A6FA5] transition-colors">
              <Paperclip className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm font-medium text-gray-700">Grabar video</span>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                capture
                onChange={handleVideoSelect}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>

          {/* TextArea para problemas */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reportar problemas (opcional)
            </label>
            <textarea
              value={problemas}
              onChange={(e) => setProblemas(e.target.value)}
              placeholder="Describe cualquier problema o incidencia encontrada..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={3}
            />
          </div>

          {/* Botón para finalizar subtarea si existe */}
          {subtareaId && onFinalizarSubtarea && (
            <div className="mt-4 pt-4 border-t">
              <Button
                onClick={() => {
                  onFinalizarSubtarea(evidenciaUrlActual || undefined, videoUrlActual || undefined, problemas || undefined);
                  onClose();
                }}
                className="w-full bg-[#4A6FA5] text-white hover:bg-[#3a5a8a]"
                disabled={uploading}
              >
                Finalizar subtarea con estos datos
              </Button>
            </div>
          )}

          {/* Lista de evidencias */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : evidencias.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-500">
              No hay evidencias subidas aún
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {evidencias.map((evidencia: any) => (
                <div key={evidencia.id} className="relative group">
                  <img
                    src={srcEvidenciaModal(String(evidencia.url ?? ''))}
                    alt={evidencia.descripcion || 'Evidencia'}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs opacity-0 group-hover:opacity-100">
                      {evidencia.tipo === 'evidencia_final'
                        ? 'Final'
                        : evidencia.tipo === 'evidencia_bloque'
                          ? 'Bloque'
                          : 'Parcial'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Componente Modal obligatorio para finalizar subtarea
function ModalFinalizarSubtarea({
  subtareaId,
  tareaId,
  obraId,
  onClose,
  onFinalizar,
  onUploadingChange,
  onEvidenciaUploadOk,
}: {
  subtareaId: string;
  tareaId?: string;
  obraId?: string;
  onClose: () => void;
  onFinalizar: (evidenciaUrl?: string, videoUrl?: string, problemas?: string) => Promise<void>;
  onUploadingChange?: (uploading: boolean) => void;
  onEvidenciaUploadOk?: () => void | Promise<void>;
}) {
  const [evidenciaUrl, setEvidenciaUrl] = useState<string | undefined>(undefined);
  const [videoUrl, setVideoUrl] = useState<string | undefined>(undefined);
  const [problemas, setProblemas] = useState('');
  const [uploading, setUploading] = useState(false);
  const [controlCalidad, setControlCalidad] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const videoGalleryInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Helper para comprimir imagen a máximo 1200px
  const comprimirImagen = (file: File, maxWidth: number = 1200): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo obtener contexto del canvas'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (file: File, kind: 'evidencia_final' | 'video_final') => {
    setUploading(true);
    onUploadingChange?.(true);
    try {
      if (kind === 'evidencia_final') {
        if (!fileLooksLikeImage(file)) {
          toast({
            title: 'No pudimos usar esta imagen',
            description:
              'Si falló al tomar foto, probá «Elegir de galería» o repetí la foto.',
            variant: 'destructive',
          });
          return;
        }
        const dataUrl = await comprimirImagen(file, 1200);

        const response = await fetch('/api/upload/photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ dataUrl, subtareaId }),
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          const msg =
            (result as any).message ||
            (result as any).error ||
            'Error al subir evidencia';
          toast({
            title: 'No se pudo subir la evidencia',
            description: msg,
            variant: 'destructive',
          });
          throw new Error(msg);
        }

        const urlUsable =
          (result as any).evidencia_url ??
          (result as any).publicUrl ??
          (result as any).path;
        if (!urlUsable) {
          const msg = 'La subida no devolvió una URL de evidencia usable';
          toast({ title: 'Error de evidencia', description: msg, variant: 'destructive' });
          throw new Error(msg);
        }
        setEvidenciaUrl(String(urlUsable));
        await onEvidenciaUploadOk?.();
        return;
      }

      let fileToUpload: File | Blob = file;
      
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('kind', kind);
      if (tareaId) formData.append('tareaId', tareaId);
      if (obraId) formData.append('obraId', obraId);

      const response = await fetch(`/api/upload/file`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al subir archivo');
      }

      const result = await response.json();
      if (kind === 'video_final') {
        setVideoUrl(result.url);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo subir la evidencia';
      toast({
        title: 'Error al subir',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await handleFileUpload(file, 'evidencia_final');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleVideoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await handleFileUpload(file, 'video_final');
    if (videoInputRef.current) videoInputRef.current.value = '';
    if (videoGalleryInputRef.current) videoGalleryInputRef.current.value = '';
  };

  const handleConfirmar = async () => {
    if (!controlCalidad) {
      alert('Debés confirmar el control de calidad para finalizar la subtarea');
      return;
    }
    await onFinalizar(evidenciaUrl, videoUrl, problemas || undefined);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Enviar bloque a validar
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Foto obligatoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Foto de evidencia <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#4A6FA5] transition-colors">
                <Camera className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">Tomar foto</span>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#4A6FA5] transition-colors">
                <Paperclip className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">Elegir de galería</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
            {evidenciaUrl && (
              <div className="mt-2">
                <img src={evidenciaUrl} alt="Evidencia" className="w-full h-32 object-cover rounded-lg" />
              </div>
            )}
          </div>

          {/* Video opcional */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Video (opcional)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#4A6FA5] transition-colors">
                <Camera className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">Grabar video</span>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  capture
                  onChange={handleVideoSelect}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#4A6FA5] transition-colors">
                <Paperclip className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm font-medium text-gray-700">Elegir video</span>
                <input
                  ref={videoGalleryInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoSelect}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
            {videoUrl && (
              <div className="mt-2">
                <video src={videoUrl} controls className="w-full h-32 object-cover rounded-lg" />
              </div>
            )}
          </div>

          {/* Texto de problemas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reportar problemas (opcional)
            </label>
            <textarea
              value={problemas}
              onChange={(e) => setProblemas(e.target.value)}
              placeholder="Describe cualquier problema o incidencia encontrada..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={3}
            />
          </div>

          {/* Check de control de calidad */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="control-calidad"
              checked={controlCalidad}
              onChange={(e) => setControlCalidad(e.target.checked)}
              className="w-4 h-4 text-[#4A6FA5] border-gray-300 rounded focus:ring-[#4A6FA5]"
            />
            <label htmlFor="control-calidad" className="text-sm text-gray-700">
              Confirmo que la subtarea cumple con los estándares de calidad <span className="text-red-500">*</span>
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmar} 
            disabled={uploading || !controlCalidad || !evidenciaUrl}
            className="bg-[#4A6FA5] hover:bg-[#3a5a8a]"
          >
            {uploading ? 'Subiendo...' : 'Enviar a validar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

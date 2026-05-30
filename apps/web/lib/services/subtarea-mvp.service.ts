import { createServiceSupabaseClient } from '../supabase-server';
import { WalletMvpService } from './wallet-mvp.service';
import { TareaFsmService } from './tarea-fsm.service';
import { PermisoService, RolActor } from './permiso.service';
import { ClienteWalletService } from './cliente-wallet.service';
import {
  ESTADO_BLOQUE_FINAL,
  ESTADO_BLOQUE_PARA_VALIDAR,
  normalizeEstadoBloqueParaOperacion,
  type EstadoBloqueCore,
} from '../domain/estados-core';
import {
  diasEfectivosDesdePresupuesto,
  resolverPresupuestoAprobadoParaOperacion,
} from '@/lib/domain/aprobacion-presupuesto-tarea';

export type EstadoSubtarea = EstadoBloqueCore;

export class GenerarBloquesError extends Error {
  constructor(
    message: string,
    public readonly debug: Record<string, unknown>,
    public readonly detail?: string,
  ) {
    super(message);
    this.name = 'GenerarBloquesError';
  }
}

type GenerarBloquesResult = {
  created: boolean;
  existing: boolean;
  bloquesCount: number;
  debug: Record<string, unknown>;
};

type SubtareaRecord = {
  id: string;
  tarea_id: string;
  estado: EstadoSubtarea;
  socio_id: string | null;
  presupuesto_id?: string | null;
  evidencia_obligatoria: boolean;
  evidencia_cargada?: boolean | null;
  evidencia_url?: string | null;
  tareas?: {
    id: string;
    org_id: string;
    responsable_socio_id: string | null;
    estado: string;
  } | null;
};

type ActorContext = {
  id: string;
  rol: RolActor;
  socioId?: string | null;
};

export const SUBTAREA_UI_SELECT = `
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

type BloqueListItem = {
  id: string;
  estado?: string | null;
  orden?: number | null;
  bloque_index?: number | null;
  socio_id?: string | null;
};

export function pickSubtareaOperativaDeLista<T extends { estado?: string | null }>(
  lista: T[],
): T | null {
  const norm = (s: string | null | undefined) => normalizeEstadoBloqueParaOperacion(s);
  return (
    lista.find((s) => norm(s.estado) === 'en_progreso') ||
    lista.find((s) => norm(s.estado) === ESTADO_BLOQUE_PARA_VALIDAR) ||
    lista.find((s) => norm(s.estado) === 'pendiente') ||
    lista.find((s) => norm(s.estado) === 'rechazado') ||
    null
  );
}

type ValidarParams = ActorContext & {
  metodoPago?: 'EFECTIVO' | 'ONLINE';
  accion?: 'validar' | 'rechazar' | 'validar_en_obra';
  motivo?: string | null;
};

type BloqueInsertPayload = Record<string, unknown>;

function supabaseErrorFaltaColumnaMontoEstimado(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const msg = String(error.message ?? '');
  return (
    error.code === 'PGRST204' &&
    (msg.includes('monto_estimado') || msg.includes("'monto_estimado'"))
  );
}

function omitirMontoEstimadoEnPayload(rows: BloqueInsertPayload[]): BloqueInsertPayload[] {
  return rows.map((row) => {
    const { monto_estimado: _omit, ...rest } = row;
    return rest;
  });
}

async function insertarBloquesTarea(
  supabaseAny: any,
  rows: BloqueInsertPayload[],
): Promise<{ error: { code?: string; message?: string; details?: string } | null; omitioMontoEstimado: boolean }> {
  let { error } = await supabaseAny.from('tareas_subtareas').insert(rows);
  if (error && supabaseErrorFaltaColumnaMontoEstimado(error)) {
    console.warn(
      '[generarBloques] Columna monto_estimado ausente en BD — insert sin monto. Ejecutá la migración 20260527120000.',
    );
    ({ error } = await supabaseAny.from('tareas_subtareas').insert(omitirMontoEstimadoEnPayload(rows)));
    return { error, omitioMontoEstimado: !error };
  }
  return { error, omitioMontoEstimado: false };
}

export class SubtareaMvpService {
  /**
   * Alinea `bloques_planificados` / `dias_presupuesto` con el presupuesto aprobado
   * para que el trigger `enforce_subtarea_count` no rechace inserts válidos.
   */
  private static async sincronizarCapacidadBloquesTarea(
    tareaId: string,
    diasObjetivo: number,
    bloquesExistentes: number,
  ): Promise<number> {
    const supabaseAny = createServiceSupabaseClient() as any;
    const objetivo = Math.max(1, Math.round(diasObjetivo), bloquesExistentes);

    const { data: tarea, error: readErr } = await supabaseAny
      .from('tareas')
      .select('bloques_planificados, dias_presupuesto')
      .eq('id', tareaId)
      .maybeSingle();

    if (readErr || !tarea) {
      throw new GenerarBloquesError('No se pudo leer la configuración de bloques de la tarea', {
        tareaId,
        motivo: readErr?.message ?? 'TAREA_NO_ENCONTRADA',
      });
    }

    const actual = Number(tarea.bloques_planificados ?? tarea.dias_presupuesto ?? 1);
    if (actual >= objetivo) {
      return actual;
    }

    const { error: updateErr } = await supabaseAny
      .from('tareas')
      .update({
        bloques_planificados: objetivo,
        dias_presupuesto: objetivo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tareaId);

    if (updateErr) {
      throw new GenerarBloquesError(
        'No se pudo sincronizar la cantidad de bloques planificados con el presupuesto',
        {
          tareaId,
          bloquesPlanificados: objetivo,
          bloquesExistentes,
          motivo: 'SYNC_BLOQUES_PLANIFICADOS_ERROR',
          supabaseError: updateErr,
        },
        updateErr.details ?? undefined,
      );
    }

    return objetivo;
  }

  /**
   * Genera subtareas (bloques) en base al presupuesto aprobado.
   */
  static async generarBloquesDesdePresupuesto(
    tareaId: string,
    opts?: { socioIdOperador?: string | null },
  ): Promise<GenerarBloquesResult> {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { data: tarea, error: tareaError } = await supabaseAny
      .from('tareas')
      .select('id, dias_presupuesto, bloques_planificados, responsable_socio_id')
      .eq('id', tareaId)
      .maybeSingle();

    if (tareaError || !tarea) {
      throw new GenerarBloquesError('Tarea no encontrada para generar bloques', {
        tareaId,
        motivo: tareaError?.message ?? 'TAREA_NO_ENCONTRADA',
      });
    }

    const { data: presupuestoRows, error: presupuestoError } = await supabaseAny
      .from('tareas_presupuestos')
      .select('id, monto, dias_reales, cantidad, unidad, notas, socio_id, estado')
      .eq('tarea_id', tareaId)
      .order('created_at', { ascending: false })
      .limit(12);

    if (presupuestoError) {
      throw new GenerarBloquesError('No se pudo leer el presupuesto aprobado', {
        tareaId,
        motivo: presupuestoError.message,
      }, presupuestoError.details ?? undefined);
    }

    const socioTarea = tarea.responsable_socio_id ?? null;
    const socioOperador = opts?.socioIdOperador ?? null;
    const presupuesto = resolverPresupuestoAprobadoParaOperacion(presupuestoRows ?? [], {
      responsableSocioId: socioTarea,
      socioOperadorId: socioOperador,
    });

    if (!presupuesto) {
      throw new GenerarBloquesError(
        'No hay presupuesto aprobado para la tarea y el socio asignado',
        {
          tareaId,
          socioId: socioTarea,
          socioOperadorId: socioOperador,
          presupuestoId: null,
          bloquesPlanificados: tarea.bloques_planificados ?? tarea.dias_presupuesto ?? 1,
          motivo: 'PRESUPUESTO_APROBADO_NO_ENCONTRADO',
          presupuestosEncontrados: (presupuestoRows ?? []).map((row: any) => ({
            id: row.id,
            estado: row.estado,
            socio_id: row.socio_id,
          })),
        },
      );
    }

    const diasDesdePresupuesto = diasEfectivosDesdePresupuesto(presupuesto);
    const bloquesPlanificadosInicial = Number(
      tarea.bloques_planificados || tarea.dias_presupuesto || diasDesdePresupuesto || 1,
    );
    const socioId =
      socioOperador || tarea.responsable_socio_id || presupuesto.socio_id || null;
    const presupuestoId = presupuesto?.id ?? null;
    const cantidad = Number(presupuesto?.cantidad ?? 1);
    const unidad = String(presupuesto?.unidad || 'unidad');
    const montoTotal = Number(presupuesto?.monto ?? 0);

    const { data: existentes, error: existentesError } = await supabaseAny
      .from('tareas_subtareas')
      .select('id, orden, bloque_index, estado, socio_id, presupuesto_id, cantidad, unidad, evidencia_obligatoria, evidencia_cargada')
      .eq('tarea_id', tareaId)
      .order('orden', { ascending: true });

    if (existentesError) {
      throw new GenerarBloquesError(
        'No se pudo verificar si la tarea ya tiene bloques',
        {
          tareaId,
          socioId,
          presupuestoId,
          bloquesPlanificados: bloquesPlanificadosInicial,
          motivo: existentesError.message,
          supabaseError: existentesError,
        },
        existentesError.details ?? undefined,
      );
    }

    const bloquesExistentesCount = existentes?.length ?? 0;
    const totalBloques = await this.sincronizarCapacidadBloquesTarea(
      tareaId,
      Math.max(diasDesdePresupuesto, bloquesPlanificadosInicial),
      bloquesExistentesCount,
    );
    const montoPorBloque =
      totalBloques > 0 && Number.isFinite(montoTotal) && montoTotal > 0
        ? Math.round((montoTotal / totalBloques) * 100) / 100
        : 1;

    const buildBloqueInsert = (index: number) => ({
      tarea_id: tareaId,
      bloque_index: index,
      orden: index,
      estado: 'pendiente',
      cantidad: Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 1,
      unidad,
      evidencia_obligatoria: true,
      evidencia_cargada: false,
      socio_id: socioId,
      presupuesto_id: presupuestoId,
      monto_estimado: montoPorBloque,
    });

    if (existentes && existentes.length > 0) {
      const indicesExistentes = new Set(
        existentes
          .map((row: { bloque_index?: number | null; orden?: number | null }) =>
            Number(row.bloque_index ?? row.orden ?? 0),
          )
          .filter((n: number) => Number.isFinite(n) && n > 0),
      );
      const faltantes = Array.from({ length: totalBloques }, (_, i) => i + 1)
        .filter((index) => !indicesExistentes.has(index))
        .map((index) => buildBloqueInsert(index));

      if (faltantes.length > 0) {
        const { error: insertFaltantesError, omitioMontoEstimado } = await insertarBloquesTarea(
          supabaseAny,
          faltantes,
        );

        if (insertFaltantesError) {
          throw new GenerarBloquesError(
            'No se pudieron crear los bloques faltantes de la tarea',
            {
              tareaId,
              socioId,
              presupuestoId,
              bloquesPlanificados: totalBloques,
              bloquesExistentes: existentes.length,
              bloquesFaltantes: faltantes.length,
              supabaseError: insertFaltantesError,
              motivo: insertFaltantesError.message,
            },
            insertFaltantesError.details ?? undefined,
          );
        }

        return {
          created: true,
          existing: false,
          bloquesCount: existentes.length + faltantes.length,
          debug: {
            tareaId,
            socioId,
            presupuestoId,
            bloquesPlanificados: totalBloques,
            motivo: omitioMontoEstimado
              ? 'BLOQUES_FALTANTES_CREADOS_SIN_MONTO_ESTIMADO'
              : 'BLOQUES_FALTANTES_CREADOS',
            insertados: faltantes.length,
          },
        };
      }

      return {
        created: false,
        existing: true,
        bloquesCount: existentes.length,
        debug: {
          tareaId,
          socioId,
          presupuestoId,
          bloquesPlanificados: totalBloques,
          motivo: 'YA_EXISTEN_BLOQUES',
        },
      };
    }

    const bloques = Array.from({ length: totalBloques }).map((_, index) =>
      buildBloqueInsert(index + 1),
    );

    const { error: insertError, omitioMontoEstimado } = await insertarBloquesTarea(supabaseAny, bloques);

    if (insertError) {
      throw new GenerarBloquesError(
        'No se pudieron generar las subtareas automaticamente',
        {
          tareaId,
          socioId,
          presupuestoId,
          bloquesPlanificados: totalBloques,
          insertPayload: bloques,
          supabaseError: insertError,
          cantidad: bloques[0]?.cantidad,
          unidad,
          motivo: insertError.message,
        },
        insertError.details ?? undefined,
      );
    }

    return {
      created: true,
      existing: false,
      bloquesCount: bloques.length,
      debug: {
        tareaId,
        socioId,
        presupuestoId,
        bloquesPlanificados: totalBloques,
        insertPayload: bloques,
        cantidad: bloques[0]?.cantidad,
        unidad,
        motivo: omitioMontoEstimado ? 'BLOQUES_CREADOS_SIN_MONTO_ESTIMADO' : 'BLOQUES_CREADOS',
      },
    };
  }

  static async iniciarBloque(subtareaId: string, actor: ActorContext) {
    if (actor.rol !== 'SOCIO') {
      throw new Error('FORBIDDEN_ACTION');
    }

    const subtarea = await this.obtenerSubtarea(subtareaId);
    this.assertSocioOperaBloque(subtarea, actor);

    const estadoOp = normalizeEstadoBloqueParaOperacion(subtarea.estado);
    if (!['pendiente', 'rechazado'].includes(estadoOp)) {
      throw new Error('Solo se pueden iniciar bloques pendientes o rechazados');
    }

    const socioId = await this.obtenerSocioAsignado(subtarea, actor);
    if (!socioId) {
      throw new Error('No hay un socio asignado al bloque');
    }

    await WalletMvpService.verificarSocioNoSuspendido(socioId);
    await this.assertMaxBloquesActivos(socioId, subtareaId);

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;
    const ahora = new Date().toISOString();

    const updatePayload: Record<string, unknown> = {
      estado: 'en_progreso',
      hora_inicio: ahora,
      updated_at: ahora,
    };
    if (socioId) {
      updatePayload.socio_id = socioId;
    }

    const { error: updateError } = await supabaseAny
      .from('tareas_subtareas')
      .update(updatePayload)
      .eq('id', subtareaId);

    if (updateError) {
      throw new Error(updateError.message);
    }
  }

  static async enviarParaValidar(subtareaId: string, actor: ActorContext) {
    if (actor.rol !== 'SOCIO') {
      throw new Error('FORBIDDEN_ACTION');
    }

    const subtarea = await this.obtenerSubtarea(subtareaId);
    this.assertSocioOperaBloque(subtarea, actor);

    const estadoOp = normalizeEstadoBloqueParaOperacion(subtarea.estado);
    if (estadoOp === ESTADO_BLOQUE_PARA_VALIDAR || estadoOp === ESTADO_BLOQUE_FINAL) {
      return;
    }
    if (estadoOp !== 'en_progreso') {
      throw new Error('El bloque debe estar en progreso para ser enviado a validacion');
    }

    if (!this.cumpleRequisitoEvidencia(subtarea)) {
      throw new Error('Debes cargar evidencia antes de enviar el bloque a validacion');
    }

    const socioId = await this.obtenerSocioAsignado(subtarea, actor);
    if (!socioId) {
      throw new Error('No hay un socio asignado al bloque');
    }

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;
    const ahora = new Date().toISOString();

    const { error: updateError } = await supabaseAny
      .from('tareas_subtareas')
      .update({
        estado: 'para_validar',
        hora_fin: ahora,
        updated_at: ahora,
      })
      .eq('id', subtareaId);

    if (updateError) {
      throw new Error(updateError.message);
    }
  }

  /**
   * Valida o rechaza un bloque pagable.
   * @deprecated Preferir `SubtareaValidarService.ejecutar` desde rutas nuevas.
   */
  static async validarSubtarea(
    subtareaId: string,
    actor: ValidarParams,
  ) {
    if (actor.rol !== 'CLIENTE') {
      throw new Error('FORBIDDEN_ACTION');
    }

    const { SubtareaValidarService } = await import('@/lib/tareas/subtarea-validar.service');
    return SubtareaValidarService.ejecutar({
      subtareaId,
      actorUserId: actor.id,
      accion: actor.accion,
      metodoPago: actor.metodoPago,
      motivo: actor.motivo,
    });
  }

  /**
   * El actor SOCIO debe ser el asignado al bloque/tarea (no confiar solo en IDs del cliente).
   */
  private static assertSocioOperaBloque(subtarea: SubtareaRecord, actor: ActorContext) {
    if (actor.rol !== 'SOCIO' || !actor.socioId) {
      throw new Error('FORBIDDEN_ACTION');
    }
    const actorId = actor.socioId;
    const socioBloque = subtarea.socio_id;
    const responsableTarea = subtarea.tareas?.responsable_socio_id ?? null;

    const puedeOperar =
      actorId === socioBloque ||
      actorId === responsableTarea ||
      (!socioBloque && !responsableTarea);

    if (!puedeOperar) {
      throw new Error('No tenés permiso para operar este bloque');
    }
  }

  private static async obtenerSubtarea(subtareaId: string) {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const select = await this.buildSubtareaSelect(supabaseAny);
    const { data, error } = await supabaseAny
      .from('tareas_subtareas')
      .select(select)
      .eq('id', subtareaId)
      .maybeSingle();

    if (error || !data) {
      throw new Error('Subtarea no encontrada');
    }

    return data;
  }

  /**
   * Si `evidencia_obligatoria`, exige evidencia persistida en subtarea (cargada + URL/path).
   * Si no es obligatoria, no bloquea por evidencia.
   */
  private static cumpleRequisitoEvidencia(subtarea: SubtareaRecord) {
    if (!subtarea.evidencia_obligatoria) {
      return true;
    }
    return Boolean(
      subtarea.evidencia_cargada &&
        subtarea.evidencia_url &&
        String(subtarea.evidencia_url).trim(),
    );
  }

  private static async buildSubtareaSelect(_supabaseAny: any): Promise<string> {
    return `
        id,
        tarea_id,
        estado,
        socio_id,
        presupuesto_id,
        evidencia_obligatoria,
        evidencia_cargada,
        evidencia_url,
        tareas:tareas (
          id,
          org_id,
          responsable_socio_id,
          estado
        )
      `;
  }

  private static async assertMaxBloquesActivos(socioId: string, subtareaId: string) {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { count, error } = await supabaseAny
      .from('tareas_subtareas')
      .select('*', { count: 'exact', head: true })
      .eq('socio_id', socioId)
      .eq('estado', 'en_progreso')
      .neq('id', subtareaId);

    if (error) {
      throw new Error('No se pudo validar el limite de bloques activos');
    }

    if ((count || 0) >= 2) {
      throw new Error('El socio ya tiene dos bloques en ejecucion');
    }
  }

  private static async obtenerSocioAsignado(subtarea: SubtareaRecord, actor: ActorContext) {
    if (subtarea.socio_id) {
      return subtarea.socio_id;
    }

    const orgId = subtarea.tareas?.org_id;
    if (!orgId) {
      return null;
    }

    if (actor.socioId) {
      return actor.socioId;
    }

    return PermisoService.obtenerSocioIdPorUsuario(actor.id, orgId);
  }

  static async syncSocioEnBloquesTarea(tareaId: string, socioId: string) {
    const supabaseAny = createServiceSupabaseClient() as any;
    const ahora = new Date().toISOString();
    await supabaseAny
      .from('tareas_subtareas')
      .update({ socio_id: socioId, updated_at: ahora })
      .eq('tarea_id', tareaId)
      .is('socio_id', null);
    await supabaseAny
      .from('tareas_subtareas')
      .update({ socio_id: socioId, updated_at: ahora })
      .eq('tarea_id', tareaId)
      .neq('socio_id', socioId);
  }

  static async listarBloquesResumenTarea(tareaId: string): Promise<BloqueListItem[]> {
    const supabaseAny = createServiceSupabaseClient() as any;
    const { data, error } = await supabaseAny
      .from('tareas_subtareas')
      .select('id, orden, bloque_index, estado, socio_id')
      .eq('tarea_id', tareaId)
      .order('orden', { ascending: true });
    if (error) {
      throw new Error(error.message);
    }
    return (data ?? []) as BloqueListItem[];
  }

  static async fetchSubtareaUi(subtareaId: string) {
    const supabaseAny = createServiceSupabaseClient() as any;
    const { data, error } = await supabaseAny
      .from('tareas_subtareas')
      .select(SUBTAREA_UI_SELECT)
      .eq('id', subtareaId)
      .maybeSingle();
    if (error) {
      throw new Error(error.message);
    }
    return data;
  }

  /**
   * Flujo atómico socio: generar bloques (idempotente) → vincular → iniciar si está pendiente.
   */
  static async comenzarBloqueOperativoDeTarea(
    tareaId: string,
    actor: ActorContext,
    opts?: { subtareaIdPreferida?: string | null },
  ) {
    if (actor.rol !== 'SOCIO' || !actor.socioId) {
      throw new Error('FORBIDDEN_ACTION');
    }

    await this.generarBloquesDesdePresupuesto(tareaId, { socioIdOperador: actor.socioId });
    await this.syncSocioEnBloquesTarea(tareaId, actor.socioId);

    const bloques = await this.listarBloquesResumenTarea(tareaId);
    if (!bloques.length) {
      throw new GenerarBloquesError('No hay bloques para esta tarea', {
        tareaId,
        motivo: 'SIN_BLOQUES',
      });
    }

    const preferida = opts?.subtareaIdPreferida?.trim() || null;
    let pick =
      (preferida ? bloques.find((b) => b.id === preferida) : null) ??
      pickSubtareaOperativaDeLista(bloques);

    if (!pick?.id) {
      const resumen = bloques.map((b) => ({
        id: b.id,
        orden: b.orden ?? b.bloque_index,
        estado: b.estado,
      }));
      const todosValidados = bloques.every(
        (b) => normalizeEstadoBloqueParaOperacion(b.estado) === ESTADO_BLOQUE_FINAL,
      );

      if (todosValidados) {
        await TareaFsmService.reconciliarTareaSiTodosBloquesValidados(tareaId, {
          actorId: actor.id,
          motivo: 'Todos los bloques validados — cierre automatico al intentar comenzar',
        });
        const ultimoBloque = bloques[bloques.length - 1];
        const subtarea = ultimoBloque ? await this.fetchSubtareaUi(ultimoBloque.id) : null;
        return {
          accion: 'tarea_completada' as const,
          subtarea,
          bloques,
          tareaValidada: true,
        };
      }

      throw new GenerarBloquesError('No hay bloque operativo para comenzar', {
        tareaId,
        motivo: 'NO_BLOQUE_OPERATIVO',
        bloques: resumen,
      });
    }

    const estadoOp = normalizeEstadoBloqueParaOperacion(pick.estado);

    if (estadoOp === ESTADO_BLOQUE_PARA_VALIDAR || estadoOp === ESTADO_BLOQUE_FINAL) {
      const subtarea = await this.fetchSubtareaUi(pick.id);
      return { accion: 'para_validar' as const, subtarea, bloques };
    }

    if (estadoOp === 'en_progreso') {
      const subtarea = await this.fetchSubtareaUi(pick.id);
      return { accion: 'reanudado' as const, subtarea, bloques };
    }

    if (estadoOp === 'pendiente' || estadoOp === 'rechazado') {
      await this.iniciarBloque(pick.id, actor);
      const subtarea = await this.fetchSubtareaUi(pick.id);
      return { accion: 'iniciado' as const, subtarea, bloques };
    }

    throw new Error(`Estado de bloque no operativo: ${pick.estado ?? 'desconocido'}`);
  }
}

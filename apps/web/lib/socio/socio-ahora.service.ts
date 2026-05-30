import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { resolveSocioRecordForAuthUser } from '@/lib/socios/resolveSocioForAuthUser';
import { inferOrgIdForSocio } from '@/lib/socios/inferOrgIdForSocio';
import {
  buildOrClauseAsignacionSocio,
  cargarTareaOperativaAhora,
  type TareaAhoraRow,
} from '@/lib/socio/cargar-tarea-ahora';
import { TareasRepository } from '@/lib/tareas/infrastructure/tareas.repository';
import { SubtareasRepository } from '@/lib/tareas/infrastructure/subtareas.repository';
import {
  ESTADO_BLOQUE_FINAL,
  subtareaEstaCompletadaOficial,
} from '@/lib/domain/estados-core';
import { JornadaSocioService } from '@/lib/socio/jornada-socio.service';
import type { JornadaRow } from '@/lib/socio/infrastructure/jornadas.repository';

export type SocioAhoraProgreso = {
  completadas: number;
  total: number;
  porcentaje: number;
};

export type SocioAhoraBloquesResumen = {
  lista: unknown[];
  subtareaOperativa: unknown | null;
  total: number;
  completadas: number;
  programadasHoy: number;
  completadasHoy: number;
};

export type SocioAhoraResult = {
  orgId: string | null;
  socioId: string | null;
  tarea: TareaAhoraRow | null;
  operativas: TareaAhoraRow[];
  progresoGeneral: SocioAhoraProgreso;
  tareasCompletadasHoy: number;
  tareasActivasCount: number;
  bloquesActivosCount: number;
  bloques?: SocioAhoraBloquesResumen | null;
  jornada?: JornadaRow | null;
  error: string | null;
};

function calcularProgresoDesdeTareas(
  tareas: Array<{ estado?: string | null; avance?: number | null }>,
): SocioAhoraProgreso {
  const total = tareas.length;
  const completadas = tareas.filter((t) => {
    const e = (t.estado || '').toLowerCase();
    return e === 'validada' || e === 'rechazada' || t.avance === 100;
  }).length;
  return {
    completadas,
    total,
    porcentaje: total > 0 ? Math.round((completadas / total) * 100) : 0,
  };
}

function pickSubtareaOperativa(list: Array<{ id: string; estado?: string | null }>) {
  const norm = (s: string | null | undefined) => String(s || '').toLowerCase();
  return (
    list.find((s) => norm(s.estado) === 'en_progreso') ||
    list.find((s) => norm(s.estado) === 'pendiente') ||
    list.find((s) => norm(s.estado) === 'rechazado') ||
    list.find((s) => norm(s.estado) === 'rechazada') ||
    null
  );
}

function filtrarSubtareasVisiblesSocio<T extends { socio_id?: string | null }>(
  lista: T[],
  socioId: string | null,
): T[] {
  if (!lista?.length) return [];
  const filtradas = lista.filter((s) => !s.socio_id || !socioId || s.socio_id === socioId);
  return filtradas.length > 0 ? filtradas : lista;
}

async function contarTareasValidadasHoy(tareaIds: string[]): Promise<number> {
  if (tareaIds.length === 0) return 0;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const hoyISO = hoy.toISOString();
  const supabaseAny = createServiceSupabaseClient() as any;
  const { data: eventosHoy, error } = await supabaseAny
    .from('eventos')
    .select('tarea_id')
    .in('tarea_id', tareaIds)
    .eq('nuevo_estado', 'validada')
    .gte('created_at', hoyISO);
  if (error) {
    console.warn('[SocioAhoraService] eventos hoy:', error.message);
    return 0;
  }
  return new Set((eventosHoy ?? []).map((e: { tarea_id?: string | null }) => e.tarea_id)).size;
}

export async function obtenerDatosSocioAhora(params: {
  userId: string;
  userEmail?: string | null;
  tareaId?: string | null;
}): Promise<SocioAhoraResult> {
  const supabase = createServiceSupabaseClient();
  const supabaseAny = supabase as any;

  const socioRow = await resolveSocioRecordForAuthUser(supabase, {
    id: params.userId,
    email: params.userEmail ?? null,
  });

  if (!socioRow) {
    return {
      orgId: null,
      socioId: null,
      tarea: null,
      operativas: [],
      progresoGeneral: { completadas: 0, total: 0, porcentaje: 0 },
      tareasCompletadasHoy: 0,
      tareasActivasCount: 0,
      bloquesActivosCount: 0,
      error: 'No se pudo vincular tu perfil de socio.',
    };
  }

  const inferred =
    socioRow.org_id == null || socioRow.org_id === ''
      ? await inferOrgIdForSocio(supabase, socioRow.id)
      : null;
  let orgId = socioRow.org_id || inferred;

  if (!orgId && params.userEmail) {
    const { data: tareaData } = await supabaseAny
      .from('tareas')
      .select('org_id')
      .or(`responsable.eq.${params.userEmail},responsable.ilike.%${params.userEmail}%`)
      .limit(1)
      .maybeSingle();
    orgId = (tareaData?.org_id as string | null) ?? orgId;
  }

  if (!orgId) {
    return {
      orgId: null,
      socioId: socioRow.id,
      tarea: null,
      operativas: [],
      progresoGeneral: { completadas: 0, total: 0, porcentaje: 0 },
      tareasCompletadasHoy: 0,
      tareasActivasCount: 0,
      bloquesActivosCount: 0,
      error: 'No se encontró organización para tu perfil.',
    };
  }

  const { tarea, operativas, error: loadError } = await cargarTareaOperativaAhora(supabaseAny, {
    orgId,
    socioId: socioRow.id,
  });

  const orPartes = await buildOrClauseAsignacionSocio(supabaseAny, socioRow.id);
  let progresoGeneral: SocioAhoraProgreso = { completadas: 0, total: 0, porcentaje: 0 };
  let tareasCompletadasHoy = 0;

  if (orPartes.length > 0) {
    const resumen = await TareasRepository.listResumenAsignadas(orgId, orPartes.join(','));
    progresoGeneral = calcularProgresoDesdeTareas(resumen);
    const tareaIds = resumen.map((t) => t.id);
    tareasCompletadasHoy = await contarTareasValidadasHoy(tareaIds);
  }

  const tareasActivasCount = await TareasRepository.countBySocioAndEstado(
    socioRow.id,
    'en_progreso',
  );
  const bloquesActivosCount = await SubtareasRepository.countBySocioAndEstado(
    socioRow.id,
    'en_progreso',
  );

  const jornada = await JornadaSocioService.obtenerDelDia(socioRow.id);

  let bloques: SocioAhoraBloquesResumen | null = null;
  const tid = params.tareaId?.trim() || tarea?.id || null;
  if (tid) {
    const lista = await SubtareasRepository.listByTareaId(tid);
    const visibles = filtrarSubtareasVisiblesSocio(
      lista as Array<{ socio_id?: string | null; estado?: string | null; id: string }>,
      socioRow.id,
    );
    const pick = pickSubtareaOperativa(visibles);
    const tareaIdsOperativas = operativas.map((t) => t.id);
    const programadasHoy = await SubtareasRepository.countBySocioTareasAndEstado(
      socioRow.id,
      tareaIdsOperativas.length > 0 ? tareaIdsOperativas : [tid],
      'pendiente',
    );
    const completadasHoyBloques = await SubtareasRepository.countBySocioTareasAndEstado(
      socioRow.id,
      tareaIdsOperativas.length > 0 ? tareaIdsOperativas : [tid],
      ESTADO_BLOQUE_FINAL,
    );

    bloques = {
      lista: visibles,
      subtareaOperativa: pick
        ? (lista as Array<{ id: string }>).find((s) => s.id === pick.id) ?? pick
        : null,
      total: visibles.length,
      completadas: visibles.filter((s) => subtareaEstaCompletadaOficial(s.estado)).length,
      programadasHoy,
      completadasHoy: completadasHoyBloques,
    };
  }

  return {
    orgId,
    socioId: socioRow.id,
    tarea,
    operativas,
    progresoGeneral,
    tareasCompletadasHoy,
    tareasActivasCount,
    bloquesActivosCount,
    bloques,
    jornada,
    error: loadError,
  };
}

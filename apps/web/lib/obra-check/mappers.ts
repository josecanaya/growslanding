/**
 * Mapeo entre filas de Supabase (obra_check_tasks) y el tipo de dominio ObraCheckTask.
 */

import type { ObraCheckTask, ObraCheckOrigen } from './types';

export type ObraCheckTaskRow = {
  client_id: string;
  block_client_id: string | null;
  nombre: string;
  rubro: string | null;
  duracion_dias: number | string | null;
  inicio: string | null;
  fin: string | null;
  predecesoras: string[] | null;
  responsable_label: string | null;
  orden: number | null;
  es_critica: boolean | null;
  origen: string;
  fila_origen: number | null;
};

export function rowToTask(row: ObraCheckTaskRow): ObraCheckTask {
  return {
    id: row.client_id,
    nombre: row.nombre,
    rubro: row.rubro,
    duracionDias: row.duracion_dias == null ? null : Number(row.duracion_dias),
    inicio: row.inicio,
    fin: row.fin,
    predecesoras: row.predecesoras ?? [],
    responsableLabel: row.responsable_label,
    blockId: row.block_client_id,
    origen: (row.origen as ObraCheckOrigen) ?? 'chat',
    filaOrigen: row.fila_origen ?? undefined,
    orden: row.orden ?? undefined,
    esCritica: row.es_critica ?? undefined,
  };
}

export function taskToRow(sessionId: string, t: ObraCheckTask): Record<string, unknown> {
  return {
    session_id: sessionId,
    client_id: t.id,
    block_client_id: t.blockId,
    nombre: t.nombre,
    rubro: t.rubro,
    duracion_dias: t.duracionDias,
    inicio: t.inicio,
    fin: t.fin,
    predecesoras: t.predecesoras,
    responsable_label: t.responsableLabel,
    orden: t.orden ?? 0,
    es_critica: t.esCritica ?? null,
    origen: t.origen,
    fila_origen: t.filaOrigen ?? null,
  };
}

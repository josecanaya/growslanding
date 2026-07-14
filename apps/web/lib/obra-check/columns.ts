/**
 * Detección de columnas de una planilla (Excel/CSV) → ColumnMapping.
 *
 * Trabaja sobre una matriz ya parseada (string/number por celda). SheetJS vive en la UI
 * (Fase 2); acá sólo la lógica pura de mapeo, testeable sin dependencias.
 */

import type { ColumnField, ColumnMapping } from './types';

function normalize(text: unknown): string {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** Sinónimos por campo (sobre texto normalizado, match por inclusión). Orden = prioridad. */
const SYNONYMS: Record<ColumnField, string[]> = {
  nombre: ['nombre de tarea', 'nombre', 'tarea', 'actividad', 'item', 'descripcion', 'concepto', 'trabajo'],
  duracion: ['duracion', 'dias', 'plazo', 'dur'],
  inicio: ['fecha inicio', 'inicio', 'comienzo', 'desde', 'start'],
  fin: ['fecha fin', 'fin', 'termino', 'hasta', 'entrega', 'finish'],
  predecesoras: ['predecesora', 'predecesoras', 'depende', 'precede', 'antecesora', 'pred'],
  responsable: ['responsable', 'asignado', 'encargado', 'a cargo', 'cuadrilla', 'gremio', 'contratista', 'owner'],
  avance: ['avance', 'progreso', 'completado', '%', 'porcentaje'],
  rubro: ['rubro', 'categoria', 'etapa', 'fase', 'gremio'],
};

/** Campos que compiten por la misma columna se resuelven por este orden de prioridad. */
const FIELD_PRIORITY: ColumnField[] = [
  'nombre',
  'duracion',
  'predecesoras',
  'responsable',
  'inicio',
  'fin',
  'avance',
  'rubro',
];

function scoreCell(cell: string, field: ColumnField): number {
  if (!cell || cell.length < 3) return 0; // evita que celdas basura ('a','b') matcheen sinónimos
  let best = 0;
  for (const syn of SYNONYMS[field]) {
    if (cell === syn) return 1; // match exacto
    // La celda contiene el sinónimo: p.ej. "duracion (dias)" contiene "duracion".
    if (syn.length >= 3 && cell.includes(syn)) best = Math.max(best, 0.8);
    // El sinónimo contiene la celda: sólo si la celda es suficientemente específica.
    else if (cell.length >= 4 && syn.includes(cell)) best = Math.max(best, 0.7);
  }
  return best;
}

/**
 * Elige la fila de header: la de mayor cantidad de celdas que matchean algún sinónimo,
 * dentro de las primeras 10 filas (Excel suele traer título/logo arriba).
 */
export function detectHeaderRow(rows: unknown[][]): number {
  let bestRow = 0;
  let bestScore = -1;
  const limit = Math.min(rows.length, 10);
  for (let r = 0; r < limit; r++) {
    const row = rows[r] ?? [];
    let score = 0;
    for (const raw of row) {
      const cell = normalize(raw);
      for (const field of FIELD_PRIORITY) {
        if (scoreCell(cell, field) > 0) {
          score += 1;
          break;
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestRow = r;
    }
  }
  return bestRow;
}

export type ColumnDetection = {
  mapping: ColumnMapping;
  /** Confianza 0–1: proporción de campos núcleo (nombre/duracion) resueltos con buen score. */
  confidence: number;
};

/** Mapea columnas del header a campos canónicos, resolviendo conflictos por prioridad. */
export function detectColumns(headerRow: unknown[]): ColumnDetection {
  const cells = headerRow.map(normalize);
  const mapping: ColumnMapping = {};
  const usedColumns = new Set<number>();

  for (const field of FIELD_PRIORITY) {
    let bestCol = -1;
    let bestScore = 0;
    for (let c = 0; c < cells.length; c++) {
      if (usedColumns.has(c)) continue;
      const s = scoreCell(cells[c]!, field);
      if (s > bestScore) {
        bestScore = s;
        bestCol = c;
      }
    }
    if (bestCol >= 0 && bestScore >= 0.7) {
      mapping[field] = bestCol;
      usedColumns.add(bestCol);
    }
  }

  // Confianza: nombre pesa fuerte; duración media; el resto suma poco.
  let confidence = 0;
  if (mapping.nombre !== undefined) confidence += 0.6;
  if (mapping.duracion !== undefined) confidence += 0.25;
  if (mapping.predecesoras !== undefined) confidence += 0.05;
  if (mapping.responsable !== undefined) confidence += 0.05;
  if (mapping.inicio !== undefined) confidence += 0.05;
  confidence = Math.min(1, confidence);

  return { mapping, confidence };
}

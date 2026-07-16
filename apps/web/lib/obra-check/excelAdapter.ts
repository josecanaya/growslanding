/**
 * Adapter Excel/CSV → ObraCheckTask[].
 *
 * Entrada: matriz de celdas ya parseada (p.ej. XLSX.utils.sheet_to_json(sheet, { header: 1 })).
 * SheetJS/CSV parsing vive en la UI; este módulo es pura lógica testeable.
 */

import type { ObraCheckOrigen, ObraCheckTask, ObraCheckWarning, ExcelParseResult, ColumnMapping } from './types';
import { detectColumns, detectHeaderRow } from './columns';
import { detectarRubro } from './rubros';

function cellStr(row: unknown[], col: number | undefined): string | null {
  if (col === undefined) return null;
  const v = row[col];
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

/** Parsea duración desde texto libre: "5", "5 días", "3d", "2 semanas". Devuelve días o null. */
export function parseDuracion(raw: string | null): number | null {
  if (!raw) return null;
  const s = raw.toLowerCase().trim();
  const num = s.match(/(\d+(?:[.,]\d+)?)/);
  if (!num) return null;
  const value = parseFloat(num[1]!.replace(',', '.'));
  if (!Number.isFinite(value)) return null;
  if (/seman/.test(s)) return value * 7;
  if (/mes/.test(s)) return value * 30;
  if (/(hora|hs\b|hr)/.test(s)) return value / 8; // 8h = 1 día
  return value;
}

/** Normaliza una fecha a ISO YYYY-MM-DD si se puede; sino null. Acepta dd/mm/yyyy y ISO. */
export function parseFecha(raw: string | null): string | null {
  if (!raw) return null;
  const s = raw.trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (dmy) {
    const d = dmy[1]!.padStart(2, '0');
    const m = dmy[2]!.padStart(2, '0');
    let y = dmy[3]!;
    if (y.length === 2) y = `20${y}`;
    return `${y}-${m}-${d}`;
  }
  return null;
}

/** Parsea el campo de predecesoras estilo planilla: "3;5", "3, 5", "3FS+2d" → ["3","5"]. */
export function parsePredecesoras(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[;,]/)
    .map((tok) => {
      const m = tok.trim().match(/^\d+/); // toma el nº de fila/id, ignora tipo/lag (FS+2d)
      return m ? m[0] : '';
    })
    .filter(Boolean);
}

let counter = 0;
function genId(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

export type ExcelAdapterInput = {
  rows: unknown[][];
  origen?: Extract<ObraCheckOrigen, 'excel' | 'csv'>;
  /** Forzar fila de header (0-based). Por defecto se detecta. */
  headerRowIndex?: number;
  /** Sobrescribir el mapeo automático (confirmado por el usuario en la UI). */
  mappingOverride?: ColumnMapping;
};

/**
 * Convierte una matriz de planilla en ObraCheckTask[]. Cada fila de datos con nombre no vacío
 * es una tarea. Las predecesoras se referencian por el nº de fila 1-based DENTRO de las tareas
 * (fila 1 = primera tarea), consistente con cómo la gente numera en Excel.
 */
export function excelToTasks(input: ExcelAdapterInput): ExcelParseResult {
  const { rows } = input;
  const warnings: ObraCheckWarning[] = [];

  if (!rows || rows.length === 0) {
    return { tasks: [], headerRowIndex: 0, mapping: {}, confidence: 0, warnings };
  }

  const headerRowIndex = input.headerRowIndex ?? detectHeaderRow(rows);
  const detection = detectColumns(rows[headerRowIndex] ?? []);
  const mapping = input.mappingOverride ?? detection.mapping;

  if (mapping.nombre === undefined) {
    warnings.push({
      kind: 'columna_no_detectada',
      message: 'No se detectó la columna de nombre de tarea. Confirmá el mapeo de columnas.',
    });
  }

  const nombreCol = mapping.nombre;
  const dataRows = rows.slice(headerRowIndex + 1);

  // Primer pase: crear tareas y un índice fila-de-datos(1-based) → id, para resolver predecesoras.
  const tasks: ObraCheckTask[] = [];
  const rowNumberToId = new Map<number, string>();
  const rawPred: string[][] = [];

  let dataSeq = 0;
  dataRows.forEach((row, i) => {
    const nombre = nombreCol !== undefined ? cellStr(row, nombreCol) : null;
    if (!nombre) return; // fila vacía o sin nombre → se ignora

    dataSeq += 1;
    const id = genId(input.origen ?? 'xls');
    rowNumberToId.set(dataSeq, id);

    const duracion = parseDuracion(cellStr(row, mapping.duracion));
    if (duracion === null) {
      warnings.push({ kind: 'sin_duracion', message: `Tarea sin duración: «${nombre}»`, taskId: id });
    }

    const rubroExplicito = cellStr(row, mapping.rubro);
    const rubro = rubroExplicito ? detectarRubro(rubroExplicito) ?? detectarRubro(nombre) : detectarRubro(nombre);

    tasks.push({
      id,
      nombre,
      fase: null,
      rubro,
      duracionDias: duracion,
      inicio: parseFecha(cellStr(row, mapping.inicio)),
      fin: parseFecha(cellStr(row, mapping.fin)),
      predecesoras: [],
      responsableLabel: cellStr(row, mapping.responsable),
      blockId: null,
      origen: input.origen ?? 'excel',
      filaOrigen: headerRowIndex + 2 + i, // fila real en la planilla (1-based, +header)
    });
    rawPred.push(parsePredecesoras(cellStr(row, mapping.predecesoras)));
  });

  // Segundo pase: resolver predecesoras (nº de fila de datos → id).
  tasks.forEach((t, idx) => {
    const refs = rawPred[idx] ?? [];
    t.predecesoras = refs
      .map((n) => rowNumberToId.get(parseInt(n, 10)))
      .filter((x): x is string => Boolean(x) && x !== t.id);
  });

  return {
    tasks,
    headerRowIndex,
    mapping,
    confidence: input.mappingOverride ? 1 : detection.confidence,
    warnings,
  };
}

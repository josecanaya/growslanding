/**
 * Parseo de archivos en el navegador → ObraCheckTask[].
 *
 * - .xlsx/.xls/.csv → SheetJS a matriz de celdas → excelToTasks (detección de columnas).
 * - .xml → texto → projectXmlToTasks (usa DOMParser, client-side).
 *
 * Este módulo es CLIENT-SIDE (usa FileReader/DOMParser). No importar desde una route Node.
 */

import * as XLSX from 'xlsx';
import { excelToTasks } from './excelAdapter';
import { projectXmlToTasks } from './xmlAdapter';
import type { ColumnMapping, ExcelParseResult, ObraCheckTask, ObraCheckWarning } from './types';

export type ParsedFile = {
  tasks: ObraCheckTask[];
  warnings: ObraCheckWarning[];
  kind: 'spreadsheet' | 'xml';
  /** Presente sólo para planillas: permite re-mapear columnas en la UI. */
  spreadsheet?: {
    rows: unknown[][];
    headerRowIndex: number;
    mapping: ColumnMapping;
    confidence: number;
    origen: 'excel' | 'csv';
  };
  projectName?: string;
};

function extOf(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1]! : '';
}

async function readArrayBuffer(file: File): Promise<ArrayBuffer> {
  return await file.arrayBuffer();
}

async function readText(file: File): Promise<string> {
  return await file.text();
}

/** Re-normaliza una planilla ya leída con un mapeo de columnas confirmado por el usuario. */
export function remapSpreadsheet(
  rows: unknown[][],
  headerRowIndex: number,
  mapping: ColumnMapping,
  origen: 'excel' | 'csv',
): ExcelParseResult {
  return excelToTasks({ rows, origen, headerRowIndex, mappingOverride: mapping });
}

export async function parseObraCheckFile(file: File): Promise<ParsedFile> {
  const ext = extOf(file.name);

  if (ext === 'xml') {
    const text = await readText(file);
    const res = projectXmlToTasks(text);
    return {
      kind: 'xml',
      tasks: res.tasks,
      warnings: res.warnings,
      projectName: res.projectName,
    };
  }

  // xlsx / xls / csv → SheetJS
  const origen: 'excel' | 'csv' = ext === 'csv' ? 'csv' : 'excel';
  const buf = await readArrayBuffer(file);
  const wb = XLSX.read(buf, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    return {
      kind: 'spreadsheet',
      tasks: [],
      warnings: [{ kind: 'sin_nombre', message: 'El archivo no tiene hojas.' }],
    };
  }
  const sheet = wb.Sheets[sheetName]!;
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false, defval: null });

  const result = excelToTasks({ rows, origen });
  return {
    kind: 'spreadsheet',
    tasks: result.tasks,
    warnings: result.warnings,
    spreadsheet: {
      rows,
      headerRowIndex: result.headerRowIndex,
      mapping: result.mapping,
      confidence: result.confidence,
      origen,
    },
  };
}

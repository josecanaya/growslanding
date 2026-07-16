'use client';

import { useMemo } from 'react';
import type { ColumnField, ColumnMapping, ObraCheckTask } from '@/lib/obra-check/types';
import { BRAND, inputStyle } from './ui';

export const FIELD_LABELS: Record<ColumnField, string> = {
  nombre: 'Nombre',
  duracion: 'Duración',
  inicio: 'Inicio',
  fin: 'Fin',
  predecesoras: 'Predecesoras',
  responsable: 'Responsable',
  avance: 'Avance %',
  rubro: 'Rubro',
};

const FIELD_COLORS: Record<ColumnField, string> = {
  nombre: '#0C1D36',
  duracion: '#4A6FA5',
  inicio: '#2B8A3E',
  fin: '#1B6B3A',
  predecesoras: '#8B5A2B',
  responsable: '#5A4A8A',
  avance: '#6A6A6A',
  rubro: '#A67C00',
};

const ALL_FIELDS = Object.keys(FIELD_LABELS) as ColumnField[];

function cellStr(v: unknown): string {
  if (v == null) return '';
  return String(v);
}

type SpreadsheetProps = {
  rows: unknown[][];
  headerRowIndex: number;
  mapping: ColumnMapping;
  confidence: number;
  onRemap: (field: ColumnField, colIndex: number) => void;
  onHeaderRowChange?: (index: number) => void;
  previewTasks: ObraCheckTask[];
};

/** ETL interactivo: tabla cruda + click en columna para mapear + preview normalizado. */
export function SpreadsheetEtlPreview({
  rows,
  headerRowIndex,
  mapping,
  confidence,
  onRemap,
  onHeaderRowChange,
  previewTasks,
}: SpreadsheetProps) {
  const header = rows[headerRowIndex] ?? [];
  const colCount = Math.max(header.length, ...rows.slice(0, 30).map((r) => r.length), 1);
  const dataRows = rows.slice(headerRowIndex + 1, headerRowIndex + 9);

  const colToField = useMemo(() => {
    const m = new Map<number, ColumnField>();
    for (const f of ALL_FIELDS) {
      const idx = mapping[f];
      if (idx != null && idx >= 0) m.set(idx, f);
    }
    return m;
  }, [mapping]);

  function assignCol(col: number, field: ColumnField | '') {
    if (!field) {
      const current = colToField.get(col);
      if (current) onRemap(current, -1);
      return;
    }
    // Si otra columna tenía este campo, el remap la pisa.
    onRemap(field, col);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold" style={{ color: BRAND.text }}>
          Previsualización y mapeo
          {confidence < 0.8 && (
            <span className="ml-2 text-xs font-normal" style={{ color: BRAND.error }}>
              · revisá el mapeo (confianza baja)
            </span>
          )}
        </p>
        {onHeaderRowChange && (
          <label className="flex items-center gap-2 text-xs" style={{ color: BRAND.muted }}>
            Fila de encabezados
            <select
              style={{ ...inputStyle, padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: 'auto' }}
              value={headerRowIndex}
              onChange={(e) => onHeaderRowChange(parseInt(e.target.value, 10))}
            >
              {rows.slice(0, Math.min(8, rows.length)).map((_, i) => (
                <option key={i} value={i}>
                  Fila {i + 1}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <p className="text-xs" style={{ color: BRAND.muted }}>
        Tocá el selector debajo de cada columna para asignar qué campo de Grows representa. El preview de
        tareas se actualiza al instante.
      </p>

      <div className="overflow-x-auto rounded-lg" style={{ border: `1px solid ${BRAND.border}` }}>
        <table className="min-w-full border-collapse text-left text-xs">
          <thead>
            <tr style={{ background: BRAND.blue, color: '#fff' }}>
              {Array.from({ length: colCount }).map((_, c) => {
                const field = colToField.get(c);
                return (
                  <th
                    key={c}
                    className="whitespace-nowrap px-2 py-2 font-semibold"
                    style={{
                      borderRight: '1px solid rgba(255,255,255,0.15)',
                      minWidth: 110,
                      background: field ? FIELD_COLORS[field] : undefined,
                    }}
                  >
                    <div className="mb-1 truncate" title={cellStr(header[c])}>
                      {cellStr(header[c]) || `Col ${c + 1}`}
                    </div>
                    <select
                      className="w-full rounded border-0 text-[10px] font-medium text-[#1A1A1A]"
                      style={{ padding: '2px 4px' }}
                      value={field ?? ''}
                      onChange={(e) => assignCol(c, e.target.value as ColumnField | '')}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="">— ignorar —</option>
                      {ALL_FIELDS.map((f) => (
                        <option key={f} value={f}>
                          {FIELD_LABELS[f]}
                        </option>
                      ))}
                    </select>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 ? BRAND.gray : '#fff' }}>
                {Array.from({ length: colCount }).map((_, c) => {
                  const field = colToField.get(c);
                  return (
                    <td
                      key={c}
                      className="max-w-[160px] truncate px-2 py-1.5"
                      style={{
                        borderRight: `1px solid ${BRAND.border}`,
                        color: BRAND.text,
                        boxShadow: field ? `inset 3px 0 0 ${FIELD_COLORS[field]}` : undefined,
                      }}
                      title={cellStr(row[c])}
                    >
                      {cellStr(row[c])}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        {ALL_FIELDS.filter((f) => mapping[f] != null && (mapping[f] as number) >= 0).map((f) => (
          <span
            key={f}
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
            style={{ background: FIELD_COLORS[f] }}
          >
            {FIELD_LABELS[f]} → Col {(mapping[f] as number) + 1}
          </span>
        ))}
      </div>

      <NormalizedTasksPreview tasks={previewTasks} title="Así quedan las tareas normalizadas" />
    </div>
  );
}

type XmlProps = {
  projectName?: string;
  tasks: ObraCheckTask[];
};

export function XmlEtlPreview({ projectName, tasks }: XmlProps) {
  const withPreds = tasks.filter((t) => t.predecesoras.length > 0).length;
  const idToName = useMemo(() => new Map(tasks.map((t) => [t.id, t.nombre])), [tasks]);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold" style={{ color: BRAND.text }}>
          Previsualización del Project XML
        </p>
        <p className="text-xs" style={{ color: BRAND.muted }}>
          {projectName ? `Proyecto: ${projectName} · ` : ''}
          {tasks.length} tareas hoja · {withPreds} con precedencias
        </p>
      </div>

      <div
        className="max-h-64 overflow-y-auto rounded-lg"
        style={{ border: `1px solid ${BRAND.border}` }}
      >
        <table className="min-w-full text-left text-xs">
          <thead>
            <tr style={{ background: BRAND.blue, color: '#fff' }}>
              <th className="px-2 py-2">#</th>
              <th className="px-2 py-2">Tarea</th>
              <th className="px-2 py-2">Días</th>
              <th className="px-2 py-2">Rubro</th>
              <th className="px-2 py-2">Depende de</th>
            </tr>
          </thead>
          <tbody>
            {tasks.slice(0, 40).map((t, i) => (
              <tr key={t.id} style={{ background: i % 2 ? BRAND.gray : '#fff' }}>
                <td className="px-2 py-1.5" style={{ color: BRAND.muted }}>
                  {i + 1}
                </td>
                <td className="px-2 py-1.5 font-medium" style={{ color: BRAND.text }}>
                  {t.nombre}
                </td>
                <td className="px-2 py-1.5">{t.duracionDias ?? '—'}</td>
                <td className="px-2 py-1.5" style={{ color: BRAND.muted }}>
                  {t.rubro ?? '—'}
                </td>
                <td className="max-w-[200px] truncate px-2 py-1.5" style={{ color: BRAND.muted }}>
                  {t.predecesoras.length
                    ? t.predecesoras.map((id) => idToName.get(id) ?? id).join(', ')
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tasks.length > 40 && (
          <p className="px-2 py-2 text-[11px]" style={{ color: BRAND.muted }}>
            … y {tasks.length - 40} más
          </p>
        )}
      </div>
    </div>
  );
}

export function NormalizedTasksPreview({
  tasks,
  title = 'Tareas normalizadas',
}: {
  tasks: ObraCheckTask[];
  title?: string;
}) {
  const sample = tasks.filter((t) => t.nombre.trim()).slice(0, 12);
  if (sample.length === 0) {
    return (
      <p className="text-xs" style={{ color: BRAND.error }}>
        Todavía no hay tareas con nombre. Asigná al menos la columna «Nombre».
      </p>
    );
  }
  return (
    <div>
      <p className="mb-2 text-xs font-semibold" style={{ color: BRAND.text }}>
        {title} ({tasks.filter((t) => t.nombre.trim()).length})
      </p>
      <ol className="space-y-1 text-xs" style={{ color: BRAND.text }}>
        {sample.map((t, i) => (
          <li key={t.id} className="flex gap-2 rounded px-2 py-1" style={{ background: BRAND.gray }}>
            <span style={{ color: BRAND.muted }}>{i + 1}.</span>
            <span className="font-medium">{t.nombre}</span>
            {t.duracionDias != null && (
              <span style={{ color: BRAND.muted }}>· {t.duracionDias}d</span>
            )}
            {t.rubro && <span style={{ color: BRAND.blueLight }}>· {t.rubro}</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}

'use client';

import { useRef, useState } from 'react';
import { Upload, MessageSquare, Table2, X } from 'lucide-react';

import { parseObraCheckFile, remapSpreadsheet, type ParsedFile } from '@/lib/obra-check/fileParse';
import { detectarRubro } from '@/lib/obra-check/rubros';
import type { ColumnField, ObraCheckTask } from '@/lib/obra-check/types';
import { obraCheckApi } from '@/lib/obra-check/client';
import { BRAND, OCButton, OCCard, inputStyle } from './ui';
import { ChatPanel } from './ChatPanel';
import type { OrdenarResult } from '@/lib/obra-check/types';

type Mode = 'upload' | 'chat' | 'manual';

let mid = 0;
function blankTask(): ObraCheckTask {
  mid += 1;
  return {
    id: `man-${Date.now()}-${mid}`,
    nombre: '',
    rubro: null,
    duracionDias: null,
    inicio: null,
    fin: null,
    predecesoras: [],
    responsableLabel: null,
    blockId: null,
    origen: 'chat',
  };
}

const FIELD_LABELS: Record<ColumnField, string> = {
  nombre: 'Nombre de tarea',
  duracion: 'Duración (días)',
  inicio: 'Fecha inicio',
  fin: 'Fecha fin',
  predecesoras: 'Predecesoras',
  responsable: 'Responsable',
  avance: 'Avance %',
  rubro: 'Rubro',
};

export function StepCarga({ onOrdered }: { onOrdered: (result: OrdenarResult, tasks: ObraCheckTask[]) => void }) {
  const [mode, setMode] = useState<Mode>('upload');
  const [tasks, setTasks] = useState<ObraCheckTask[]>([]);
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setBusy(true);
    try {
      const res = await parseObraCheckFile(file);
      setParsed(res);
      setTasks(res.tasks);
      if (res.tasks.length === 0) setError('No se detectaron tareas. Revisá el archivo o cargalas manualmente.');
    } catch (e) {
      setError('No se pudo leer el archivo: ' + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function remap(field: ColumnField, colIndex: number) {
    if (!parsed?.spreadsheet) return;
    const mapping = { ...parsed.spreadsheet.mapping, [field]: colIndex };
    if (colIndex < 0) delete (mapping as Record<string, number>)[field];
    const result = remapSpreadsheet(parsed.spreadsheet.rows, parsed.spreadsheet.headerRowIndex, mapping, parsed.spreadsheet.origen);
    setParsed({ ...parsed, tasks: result.tasks, spreadsheet: { ...parsed.spreadsheet, mapping } });
    setTasks(result.tasks);
  }

  function addManualRow() {
    setTasks((t) => [...t, blankTask()]);
  }
  function updateTask(id: string, patch: Partial<ObraCheckTask>) {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }
  function removeTask(id: string) {
    setTasks((ts) => ts.filter((t) => t.id !== id));
  }

  async function continuar() {
    const clean = tasks.filter((t) => t.nombre.trim().length > 0).map((t) => ({ ...t, rubro: t.rubro ?? detectarRubro(t.nombre) }));
    if (clean.length === 0) {
      setError('Cargá al menos una tarea con nombre.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await obraCheckApi.saveTasks(clean);
      const result = await obraCheckApi.ordenar();
      onOrdered(result, result.tasks);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const spreadsheetHeader = parsed?.spreadsheet ? (parsed.spreadsheet.rows[parsed.spreadsheet.headerRowIndex] ?? []) : [];
  const colCount = spreadsheetHeader.length;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex gap-2">
        {([
          ['upload', 'Subir archivo', Upload],
          ['chat', 'Crear con asistente', MessageSquare],
          ['manual', 'Escribir tareas', Table2],
        ] as const).map(([m, label, Icon]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium"
            style={{
              background: mode === m ? BRAND.blue : '#fff',
              color: mode === m ? '#fff' : BRAND.muted,
              border: `1px solid ${mode === m ? BRAND.blue : BRAND.border}`,
            }}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {mode === 'upload' && (
        <OCCard>
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) handleFile(f);
            }}
            className="cursor-pointer rounded-lg p-8 text-center"
            style={{ border: `2px dashed ${BRAND.border}`, background: BRAND.gray }}
          >
            <Upload size={28} style={{ color: BRAND.blueLight, margin: '0 auto 8px' }} />
            <p className="text-sm font-medium" style={{ color: BRAND.text }}>
              Arrastrá tu archivo o hacé clic
            </p>
            <p className="mt-1 text-xs" style={{ color: BRAND.muted }}>
              Excel (.xlsx), CSV o Project (.xml)
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv,.xml"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>

          {parsed?.spreadsheet && (
            <div className="mt-4 rounded-lg p-3" style={{ background: BRAND.gray }}>
              <p className="mb-2 text-xs font-semibold" style={{ color: BRAND.text }}>
                Confirmá cómo interpretamos las columnas
                {parsed.spreadsheet.confidence < 0.8 && (
                  <span style={{ color: BRAND.error }}> · revisá el mapeo</span>
                )}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {(Object.keys(FIELD_LABELS) as ColumnField[]).map((field) => (
                  <label key={field} className="text-xs">
                    <span className="mb-0.5 block" style={{ color: BRAND.muted }}>{FIELD_LABELS[field]}</span>
                    <select
                      style={{ ...inputStyle, padding: '0.35rem 0.5rem', fontSize: '0.75rem' }}
                      value={parsed.spreadsheet!.mapping[field] ?? -1}
                      onChange={(e) => remap(field, parseInt(e.target.value, 10))}
                    >
                      <option value={-1}>—</option>
                      {Array.from({ length: colCount }).map((_, c) => (
                        <option key={c} value={c}>
                          {String(spreadsheetHeader[c] ?? `Col ${c + 1}`)}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </div>
          )}
        </OCCard>
      )}

      {mode === 'chat' && (
        <OCCard>
          <ChatPanel onAddTasks={(nuevas) => setTasks((t) => [...t, ...nuevas])} />
        </OCCard>
      )}

      {(mode === 'manual' || tasks.length > 0) && (
        <OCCard className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: BRAND.blue }}>
              {tasks.length} tarea(s)
            </p>
            <OCButton variant="secondary" onClick={addManualRow}>
              + Agregar
            </OCButton>
          </div>
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {tasks.map((t) => (
              <div key={t.id} className="flex items-center gap-2">
                <input
                  style={{ ...inputStyle, flex: 3 }}
                  value={t.nombre}
                  placeholder="Nombre de la tarea"
                  onChange={(e) => updateTask(t.id, { nombre: e.target.value })}
                />
                <input
                  style={{ ...inputStyle, flex: 1, minWidth: 70 }}
                  type="number"
                  min={0}
                  value={t.duracionDias ?? ''}
                  placeholder="días"
                  onChange={(e) => updateTask(t.id, { duracionDias: e.target.value ? Number(e.target.value) : null })}
                />
                <button onClick={() => removeTask(t.id)} style={{ color: BRAND.muted }} title="Quitar">
                  <X size={16} />
                </button>
              </div>
            ))}
            {tasks.length === 0 && (
              <p className="py-4 text-center text-xs" style={{ color: BRAND.muted }}>
                Todavía no hay tareas. Agregá una o subí un archivo.
              </p>
            )}
          </div>
        </OCCard>
      )}

      {error && <p className="mt-3 text-sm" style={{ color: BRAND.error }}>{error}</p>}

      <div className="mt-5 flex justify-end">
        <OCButton onClick={continuar} loading={busy} disabled={tasks.filter((t) => t.nombre.trim()).length === 0}>
          Ordenar con Grows →
        </OCButton>
      </div>
    </div>
  );
}

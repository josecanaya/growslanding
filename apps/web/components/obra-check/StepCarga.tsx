'use client';

import { useRef, useState } from 'react';
import { Upload, Sparkles, Table2, X } from 'lucide-react';

import { parseObraCheckFile, remapSpreadsheet, type ParsedFile } from '@/lib/obra-check/fileParse';
import { detectarRubro } from '@/lib/obra-check/rubros';
import type { ColumnField, ObraCheckTask } from '@/lib/obra-check/types';
import { obraCheckApi } from '@/lib/obra-check/client';
import { BRAND, OCButton, OCCard, inputStyle } from './ui';
import { ObraCheckPlanFromLibrary } from './ObraCheckPlanFromLibrary';
import { SpreadsheetEtlPreview, XmlEtlPreview } from './FileEtlPreview';
import type { OrdenarResult } from '@/lib/obra-check/types';

type Mode = 'upload' | 'library' | 'manual';

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

function mapTipoToLibraryKind(tipoObra: string | undefined): string | null {
  if (!tipoObra) return null;
  if (tipoObra === 'trabajo_comun') return 'trabajo_simple';
  if (tipoObra === 'otro') return 'trabajo_simple';
  return tipoObra;
}

function togglePredecesora(current: string[], predId: string): string[] {
  return current.includes(predId) ? current.filter((id) => id !== predId) : [...current, predId];
}

export function StepCarga({
  onOrdered,
  tipoObra,
}: {
  onOrdered: (result: OrdenarResult, tasks: ObraCheckTask[]) => void;
  tipoObra?: string;
}) {
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
    const mapping = { ...parsed.spreadsheet.mapping };
    // Un campo solo puede mapear a una columna; si otra columna lo tenía, se limpia al asignar.
    for (const k of Object.keys(mapping) as ColumnField[]) {
      if (k !== field && mapping[k] === colIndex) delete mapping[k];
    }
    if (colIndex < 0) delete mapping[field];
    else mapping[field] = colIndex;
    const result = remapSpreadsheet(
      parsed.spreadsheet.rows,
      parsed.spreadsheet.headerRowIndex,
      mapping,
      parsed.spreadsheet.origen,
    );
    setParsed({
      ...parsed,
      tasks: result.tasks,
      spreadsheet: { ...parsed.spreadsheet, mapping, confidence: result.confidence },
    });
    setTasks(result.tasks);
  }

  function changeHeaderRow(headerRowIndex: number) {
    if (!parsed?.spreadsheet) return;
    const result = remapSpreadsheet(
      parsed.spreadsheet.rows,
      headerRowIndex,
      parsed.spreadsheet.mapping,
      parsed.spreadsheet.origen,
    );
    setParsed({
      ...parsed,
      tasks: result.tasks,
      spreadsheet: {
        ...parsed.spreadsheet,
        headerRowIndex,
        mapping: result.mapping,
        confidence: result.confidence,
      },
    });
    setTasks(result.tasks);
  }

  function addManualRow() {
    setTasks((t) => [...t, blankTask()]);
  }
  function updateTask(id: string, patch: Partial<ObraCheckTask>) {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }
  function removeTask(id: string) {
    setTasks((ts) =>
      ts
        .filter((t) => t.id !== id)
        .map((t) => ({
          ...t,
          predecesoras: t.predecesoras.filter((p) => p !== id),
        })),
    );
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

  const namedTasks = tasks.filter((t) => t.nombre.trim().length > 0);
  const isXmlPreview = parsed?.kind === 'xml';

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex flex-wrap gap-2">
        {([
          ['upload', 'Subir archivo', Upload],
          ['library', 'Elegir plan XML', Sparkles],
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
              <SpreadsheetEtlPreview
                rows={parsed.spreadsheet.rows}
                headerRowIndex={parsed.spreadsheet.headerRowIndex}
                mapping={parsed.spreadsheet.mapping}
                confidence={parsed.spreadsheet.confidence}
                onRemap={remap}
                onHeaderRowChange={changeHeaderRow}
                previewTasks={tasks}
              />
            </div>
          )}

          {isXmlPreview && !parsed?.spreadsheet && (
            <div className="mt-4 rounded-lg p-3" style={{ background: BRAND.gray }}>
              <XmlEtlPreview projectName={parsed?.projectName} tasks={tasks} />
            </div>
          )}
        </OCCard>
      )}

      {mode === 'library' && (
        <OCCard>
          <ObraCheckPlanFromLibrary
            defaultObraProductKind={mapTipoToLibraryKind(tipoObra)}
            onLoaded={(nuevas) => {
              setTasks(nuevas);
              setParsed(null);
              setMode('manual');
            }}
          />
        </OCCard>
      )}

      {(mode === 'manual' || tasks.length > 0) && mode !== 'library' && (
        <OCCard className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: BRAND.blue }}>
              {tasks.length} tarea(s)
            </p>
            <OCButton variant="secondary" onClick={addManualRow}>
              + Agregar
            </OCButton>
          </div>
          <p className="mb-3 text-xs" style={{ color: BRAND.muted }}>
            Marcá de qué tarea(s) depende cada una. Eso alimenta el orden y el camino crítico.
          </p>
          <div className="max-h-96 space-y-3 overflow-y-auto">
            {tasks.map((t, idx) => {
              const candidates = namedTasks.filter((o) => o.id !== t.id);
              return (
                <div
                  key={t.id}
                  className="rounded-lg p-2"
                  style={{ border: `1px solid ${BRAND.border}`, background: BRAND.gray }}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 shrink-0 text-center text-xs font-semibold" style={{ color: BRAND.muted }}>
                      {idx + 1}
                    </span>
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
                  {candidates.length > 0 && (
                    <div className="mt-2 pl-8">
                      <p className="mb-1 text-[11px] font-medium" style={{ color: BRAND.muted }}>
                        Depende de (precedencia)
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {candidates.map((c) => {
                          const on = t.predecesoras.includes(c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() =>
                                updateTask(t.id, { predecesoras: togglePredecesora(t.predecesoras, c.id) })
                              }
                              className="rounded-md px-2 py-1 text-[11px] font-medium"
                              style={{
                                background: on ? BRAND.blue : '#fff',
                                color: on ? '#fff' : BRAND.text,
                                border: `1px solid ${on ? BRAND.blue : BRAND.border}`,
                              }}
                              title={c.nombre}
                            >
                              {c.nombre.length > 28 ? `${c.nombre.slice(0, 28)}…` : c.nombre}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {tasks.length === 0 && (
              <p className="py-4 text-center text-xs" style={{ color: BRAND.muted }}>
                Todavía no hay tareas. Agregá una, subí un archivo o elegí un plan XML.
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

'use client';

/**
 * Pantalla 1 — «Cargá tu obra».
 * Absorbe StepIntro + StepCarga: hero compacto, los modos de carga visibles de entrada y el
 * email/consentimiento recién al final (gate), cuando el usuario ya vio valor.
 */

import { useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Clock,
  FileSpreadsheet,
  Library,
  ListPlus,
  MessageCircle,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';

import { parseObraCheckFile, remapSpreadsheet, type ParsedFile } from '@/lib/obra-check/fileParse';
import { detectarRubro } from '@/lib/obra-check/rubros';
import type { ColumnField, ObraCheckTask } from '@/lib/obra-check/types';
import { BRAND, OCButton, OCCard, OCChip, OCField, StickyActionBar, inputStyle } from './ui';
import { ObraCheckPlanFromLibrary } from './ObraCheckPlanFromLibrary';
import { SpreadsheetEtlPreview, XmlEtlPreview } from './FileEtlPreview';

type Mode = 'upload' | 'library' | 'manual';

const TIPOS_OBRA = [
  { value: 'casa', label: 'Casa' },
  { value: 'edificio', label: 'Edificio' },
  { value: 'reforma', label: 'Reforma' },
  { value: 'trabajo_comun', label: 'Trabajo puntual' },
  { value: 'otro', label: 'Otro' },
] as const;

let mid = 0;
function blankTask(): ObraCheckTask {
  mid += 1;
  return {
    id: `man-${Date.now()}-${mid}`,
    nombre: '',
    fase: null,
    rubro: null,
    duracionDias: null,
    unidad: 'm2',
    cantidad: null,
    inicio: null,
    fin: null,
    predecesoras: [],
    responsableLabel: null,
    blockId: null,
    origen: 'chat',
  };
}

function mapTipoToLibraryKind(tipoObra: string): string | null {
  if (!tipoObra) return null;
  if (tipoObra === 'trabajo_comun' || tipoObra === 'otro') return 'trabajo_simple';
  return tipoObra;
}

function togglePredecesora(current: string[], predId: string): string[] {
  return current.includes(predId) ? current.filter((id) => id !== predId) : [...current, predId];
}

export type CargaSubmit = {
  tasks: ObraCheckTask[];
  email: string;
  empresa: string;
  tipoObra: string;
  consentPatrones: boolean;
};

export function ScreenCarga({
  onSubmit,
  submitting,
  submitError,
}: {
  onSubmit: (data: CargaSubmit) => void;
  submitting: boolean;
  submitError: string | null;
}) {
  const [mode, setMode] = useState<Mode>('upload');
  const [tasks, setTasks] = useState<ObraCheckTask[]>([]);
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const gateRef = useRef<HTMLDivElement>(null);

  // Gate (email + consentimientos) — aparece cuando hay tareas.
  const [email, setEmail] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [tipoObra, setTipoObra] = useState('');
  const [consentA, setConsentA] = useState(false);
  const [consentB, setConsentB] = useState(false);

  const namedTasks = useMemo(() => tasks.filter((t) => t.nombre.trim().length > 0), [tasks]);
  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const canSubmit = namedTasks.length > 0 && emailOk && consentA && !submitting;

  async function handleFile(file: File) {
    setError(null);
    setBusy(true);
    try {
      const res = await parseObraCheckFile(file);
      setParsed(res);
      setTasks(res.tasks);
      if (res.tasks.length === 0) setError('No se detectaron tareas. Revisá el archivo o cargalas manualmente.');
      else setTimeout(() => gateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 350);
    } catch (e) {
      setError('No se pudo leer el archivo: ' + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function remap(field: ColumnField, colIndex: number) {
    if (!parsed?.spreadsheet) return;
    const mapping = { ...parsed.spreadsheet.mapping };
    for (const k of Object.keys(mapping) as ColumnField[]) {
      if (k !== field && mapping[k] === colIndex) delete mapping[k];
    }
    if (colIndex < 0) delete mapping[field];
    else mapping[field] = colIndex;
    const result = remapSpreadsheet(parsed.spreadsheet.rows, parsed.spreadsheet.headerRowIndex, mapping, parsed.spreadsheet.origen);
    setParsed({ ...parsed, tasks: result.tasks, spreadsheet: { ...parsed.spreadsheet, mapping, confidence: result.confidence } });
    setTasks(result.tasks);
  }

  function changeHeaderRow(headerRowIndex: number) {
    if (!parsed?.spreadsheet) return;
    const result = remapSpreadsheet(parsed.spreadsheet.rows, headerRowIndex, parsed.spreadsheet.mapping, parsed.spreadsheet.origen);
    setParsed({
      ...parsed,
      tasks: result.tasks,
      spreadsheet: { ...parsed.spreadsheet, headerRowIndex, mapping: result.mapping, confidence: result.confidence },
    });
    setTasks(result.tasks);
  }

  function updateTask(id: string, patch: Partial<ObraCheckTask>) {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }
  function removeTask(id: string) {
    setTasks((ts) =>
      ts.filter((t) => t.id !== id).map((t) => ({ ...t, predecesoras: t.predecesoras.filter((p) => p !== id) })),
    );
  }

  function submit() {
    const clean = namedTasks.map((t) => ({ ...t, rubro: t.rubro ?? detectarRubro(t.nombre) }));
    if (clean.length === 0) {
      setError('Cargá al menos una tarea con nombre.');
      return;
    }
    onSubmit({ tasks: clean, email, empresa, tipoObra, consentPatrones: consentB });
  }

  const modeCards = [
    {
      m: 'upload' as Mode,
      icon: FileSpreadsheet,
      title: 'Subir mi cronograma',
      desc: 'Excel, CSV o Project (.xml)',
      badge: 'Más rápido',
    },
    {
      m: 'library' as Mode,
      icon: Library,
      title: 'Elegir un plan listo',
      desc: 'Biblioteca Grows por tipo de obra',
      badge: null,
    },
    {
      m: 'manual' as Mode,
      icon: ListPlus,
      title: 'Escribir las tareas',
      desc: 'Cargalas una por una acá',
      badge: null,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl">
      {/* Hero compacto: el protagonista es la carga, no el marketing */}
      <div
        className="relative mb-6 overflow-hidden rounded-2xl px-6 py-7 sm:px-8"
        style={{ background: `linear-gradient(135deg, ${BRAND.blue} 0%, #152a4a 60%, #1e3a5f 100%)` }}
      >
        <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full opacity-20" style={{ background: BRAND.gold }} />
        <div className="relative">
          <span
            className="mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
            style={{ background: 'rgba(232,197,71,0.18)', color: BRAND.gold, border: '1px solid rgba(232,197,71,0.35)' }}
          >
            <Sparkles size={12} /> Grows Obra Check · Gratis
          </span>
          <h1 className="text-2xl font-extrabold leading-tight text-white sm:text-3xl">
            Pedí presupuestos de obra <span style={{ color: BRAND.gold }}>por WhatsApp</span>
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>
            <span className="flex items-center gap-1"><Clock size={12} style={{ color: BRAND.gold }} /> ~10 min</span>
            <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
            <span className="flex items-center gap-1"><Sparkles size={12} style={{ color: BRAND.gold }} /> Grows ordena y arma paquetes</span>
            <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
            <span className="flex items-center gap-1"><MessageCircle size={12} style={{ color: BRAND.gold }} /> El contratista responde con precio</span>
          </div>
        </div>
      </div>

      {/* Selector de modo: cards grandes */}
      <div className="mb-4 grid gap-2.5 sm:grid-cols-3">
        {modeCards.map(({ m, icon: Icon, title, desc, badge }) => {
          const active = mode === m;
          return (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="relative rounded-xl p-4 text-left transition-all duration-150 hover:-translate-y-0.5"
              style={{
                background: active ? '#fff' : '#FDFDFD',
                border: active ? `2px solid ${BRAND.blue}` : `1.5px solid ${BRAND.border}`,
                boxShadow: active ? '0 4px 16px rgba(12,29,54,0.12)' : 'none',
              }}
            >
              {badge && (
                <span
                  className="absolute -top-2 right-3 rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ background: BRAND.gold, color: BRAND.blue }}
                >
                  {badge}
                </span>
              )}
              <div
                className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: active ? BRAND.blue : BRAND.gray }}
              >
                <Icon size={18} style={{ color: active ? BRAND.gold : BRAND.muted }} />
              </div>
              <p className="text-sm font-bold" style={{ color: BRAND.blue }}>{title}</p>
              <p className="mt-0.5 text-xs" style={{ color: BRAND.muted }}>{desc}</p>
            </button>
          );
        })}
      </div>

      {/* Contenido del modo */}
      {mode === 'upload' && (
        <OCCard>
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) void handleFile(f);
            }}
            className="cursor-pointer rounded-xl p-8 text-center transition-colors hover:border-solid"
            style={{ border: `2px dashed ${busy ? BRAND.gold : BRAND.border}`, background: BRAND.gray }}
          >
            <div
              className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: '#fff', border: `1.5px solid ${BRAND.border}` }}
            >
              <Upload size={22} style={{ color: BRAND.blueLight }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: BRAND.text }}>
              {busy ? 'Leyendo archivo…' : 'Arrastrá tu archivo o hacé clic'}
            </p>
            <p className="mt-1 text-xs" style={{ color: BRAND.muted }}>
              Excel (.xlsx) · CSV · Project (.xml) — se procesa en tu navegador
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv,.xml"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
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
          {parsed?.kind === 'xml' && !parsed?.spreadsheet && (
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
              setTimeout(() => gateRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 350);
            }}
          />
        </OCCard>
      )}

      {(mode === 'manual' || (tasks.length > 0 && mode !== 'library')) && (
        <OCCard className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold" style={{ color: BRAND.blue }}>Tus tareas</p>
              {namedTasks.length > 0 && <OCChip tone="green">{namedTasks.length} cargadas</OCChip>}
            </div>
            <OCButton variant="secondary" size="sm" onClick={() => setTasks((t) => [...t, blankTask()])}>
              + Agregar tarea
            </OCButton>
          </div>
          <p className="mb-3 text-xs" style={{ color: BRAND.muted }}>
            Si una tarea depende de otra, marcalo — eso alimenta el orden y el camino crítico. Si no,
            Grows las ordena por fase automáticamente.
          </p>
          <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
            {tasks.map((t, idx) => {
              const candidates = namedTasks.filter((o) => o.id !== t.id);
              return (
                <div key={t.id} className="rounded-lg p-2.5" style={{ border: `1px solid ${BRAND.border}`, background: BRAND.gray }}>
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                      style={{ background: '#fff', color: BRAND.muted, border: `1px solid ${BRAND.border}` }}
                    >
                      {idx + 1}
                    </span>
                    <input
                      style={{ ...inputStyle, flex: 3 }}
                      value={t.nombre}
                      placeholder="Nombre de la tarea (ej: Revoque grueso PB)"
                      onChange={(e) => updateTask(t.id, { nombre: e.target.value })}
                    />
                    <input
                      style={{ ...inputStyle, flex: 1, minWidth: 68 }}
                      type="number"
                      min={0}
                      value={t.duracionDias ?? ''}
                      placeholder="días"
                      onChange={(e) => updateTask(t.id, { duracionDias: e.target.value ? Number(e.target.value) : null })}
                    />
                    <button onClick={() => removeTask(t.id)} className="rounded-md p-1 hover:bg-white" style={{ color: BRAND.muted }} title="Quitar">
                      <X size={15} />
                    </button>
                  </div>
                  {candidates.length > 0 && (
                    <details className="mt-1.5 pl-8">
                      <summary className="cursor-pointer text-[11px] font-medium" style={{ color: BRAND.blueLight }}>
                        Depende de… {t.predecesoras.length > 0 ? `(${t.predecesoras.length})` : ''}
                      </summary>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {candidates.map((c) => {
                          const on = t.predecesoras.includes(c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => updateTask(t.id, { predecesoras: togglePredecesora(t.predecesoras, c.id) })}
                              className="rounded-md px-2 py-1 text-[11px] font-medium transition-colors"
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
                    </details>
                  )}
                </div>
              );
            })}
            {tasks.length === 0 && (
              <div className="py-6 text-center">
                <p className="text-sm font-medium" style={{ color: BRAND.muted }}>Todavía no hay tareas</p>
                <p className="mt-0.5 text-xs" style={{ color: BRAND.muted }}>Agregá una, subí un archivo o elegí un plan de la biblioteca.</p>
              </div>
            )}
          </div>
        </OCCard>
      )}

      {error && (
        <p className="mt-3 rounded-lg p-2.5 text-sm" style={{ background: '#FEF2F2', color: BRAND.error }}>
          {error}
        </p>
      )}

      {/* Gate: email + consentimientos — aparece cuando ya hay valor visible */}
      {namedTasks.length > 0 && (
        <div ref={gateRef}>
          <OCCard className="mt-5" style={{ borderColor: BRAND.gold, boxShadow: '0 4px 24px rgba(12,29,54,0.08)' }}>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: '#FFFBEB' }}>
                <Sparkles size={17} style={{ color: BRAND.gold }} />
              </div>
              <div>
                <p className="text-base font-extrabold" style={{ color: BRAND.blue }}>
                  Listo — Grows arma tu plan con {namedTasks.length} tarea{namedTasks.length === 1 ? '' : 's'}
                </p>
                <p className="text-xs" style={{ color: BRAND.muted }}>
                  Fases, orden, camino crítico y paquetes de presupuesto, automático.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <OCField label="Tu email">
                <input
                  style={{ ...inputStyle, fontSize: '1rem' }}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vos@estudio.com"
                />
              </OCField>
              <OCField label="Empresa / estudio (opcional)">
                <input style={inputStyle} value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Estudio Belgrano" />
              </OCField>
            </div>

            <div className="mt-3">
              <p className="mb-1.5 text-sm font-medium" style={{ color: BRAND.text }}>Tipo de obra</p>
              <div className="flex flex-wrap gap-2">
                {TIPOS_OBRA.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTipoObra(tipoObra === t.value ? '' : t.value)}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
                    style={{
                      background: tipoObra === t.value ? BRAND.blue : '#fff',
                      color: tipoObra === t.value ? '#fff' : BRAND.muted,
                      border: `1.5px solid ${tipoObra === t.value ? BRAND.blue : BRAND.border}`,
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 space-y-2 rounded-lg p-3" style={{ background: BRAND.gray }}>
              <label className="flex cursor-pointer items-start gap-2 text-xs" style={{ color: BRAND.text }}>
                <input type="checkbox" checked={consentA} onChange={(e) => setConsentA(e.target.checked)} className="mt-0.5" />
                <span>
                  Acepto que Grows procese mi planificación para armar el diagnóstico y el plan. <b>(obligatorio)</b>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 text-xs" style={{ color: BRAND.muted }}>
                <input type="checkbox" checked={consentB} onChange={(e) => setConsentB(e.target.checked)} className="mt-0.5" />
                <span>Acepto el uso de <b>patrones anónimos</b> para mejorar sugerencias. (opcional)</span>
              </label>
            </div>

            {submitError && (
              <p className="mt-3 rounded-lg p-2 text-xs" style={{ background: '#FEF2F2', color: BRAND.error }}>
                {submitError}
              </p>
            )}
          </OCCard>

          <StickyActionBar
            hint={
              !emailOk
                ? 'Ingresá tu email para continuar'
                : !consentA
                  ? 'Falta aceptar el consentimiento obligatorio'
                  : `${namedTasks.length} tarea(s) listas`
            }
          >
            <OCButton size="lg" onClick={submit} loading={submitting} disabled={!canSubmit}>
              Armar mi plan {!submitting && <ArrowRight size={18} />}
            </OCButton>
          </StickyActionBar>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { CANONICAL_PHASES, PHASE_COLORS as PHASE_COLORS_SHARED } from '@/lib/obra-check/phases';
import type { ObraCheckTask } from '@/lib/obra-check/types';
import { BRAND, OCButton, OCCard, inputStyle } from './ui';

const DEFAULT_PHASES = [...CANONICAL_PHASES];

const UNIDADES = ['m2', 'ml', 'gl', 'un'] as const;
const unidadLabel = (u: string) => (u === 'm2' ? 'm²' : u);

const PHASE_COLORS: Record<string, string> = Object.fromEntries(
  CANONICAL_PHASES.map((p) => [p, PHASE_COLORS_SHARED[p].bg]),
);

function inferPhase(task: ObraCheckTask): string {
  const text = `${task.rubro ?? ''} ${task.nombre}`.toLowerCase();
  if (/demolic|suelo|fundac|estructura|mampost/.test(text)) return 'Estructura';
  if (/electri|sanitar|gas|instal/.test(text)) return 'Instalaciones';
  if (/pint|limpieza|revoque|piso|carpinter|techo/.test(text)) return 'Terminaciones';
  return 'Preparacion';
}

function togglePredecesora(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export function PanelFases({
  tasks,
  onApply,
  applying,
  onTasksChange,
}: {
  tasks: ObraCheckTask[];
  /** Aplica los cambios: persiste y re-ordena el plan (rearma paquetes). */
  onApply: (tasks: ObraCheckTask[]) => void;
  applying: boolean;
  /**
   * Cambios que NO re-ordenan el plan (cantidad/unidad por tarea). `persist` = guardar en server.
   * Se aplica sobre las tareas ya ordenadas (no sobre el borrador de fases sin aplicar).
   */
  onTasksChange?: (tasks: ObraCheckTask[], persist: boolean) => void;
}) {
  const initialTasks = useMemo(
    () => tasks.map((t) => ({ ...t, fase: t.fase ?? inferPhase(t) })),
    [tasks],
  );
  const [draft, setDraft] = useState<ObraCheckTask[]>(initialTasks);
  // Cuando el padre aplica el re-orden, las tasks nuevas llegan por props: sincronizar el borrador.
  const initialSigRef = useRef('');
  useEffect(() => {
    const sig = initialTasks.map((t) => `${t.id}|${t.fase ?? ''}`).join(';');
    if (sig !== initialSigRef.current) {
      initialSigRef.current = sig;
      setDraft(initialTasks);
    }
  }, [initialTasks]);
  const [extraPhases, setExtraPhases] = useState<string[]>([]);
  const [newPhase, setNewPhase] = useState('');
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(DEFAULT_PHASES));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [depsOpenFor, setDepsOpenFor] = useState<string | null>(null);

  const phases = useMemo(() => {
    const set = new Set<string>(DEFAULT_PHASES);
    extraPhases.forEach((phase) => set.add(phase));
    draft.forEach((t) => {
      if (t.fase?.trim()) set.add(t.fase.trim());
    });
    return [...set];
  }, [draft, extraPhases]);

  const tasksByPhase = useMemo(() => {
    const map = new Map<string, ObraCheckTask[]>();
    phases.forEach((p) => map.set(p, []));
    draft.forEach((t) => {
      const key = t.fase?.trim() || 'Sin fase';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });
    return map;
  }, [draft, phases]);

  const unassigned = draft.filter((t) => !t.fase?.trim());
  const depCount = draft.reduce((n, t) => n + t.predecesoras.length, 0);
  const conCantidad = draft.filter((t) => t.cantidad != null && t.cantidad > 0).length;

  /** Cantidad/unidad por tarea: no re-ordena. Actualiza borrador (display) y propaga (persiste en blur). */
  function patchTaskQty(taskId: string, patch: Partial<ObraCheckTask>, persist: boolean) {
    setDraft((curr) => curr.map((tk) => (tk.id === taskId ? { ...tk, ...patch } : tk)));
    const next = tasks.map((tk) => (tk.id === taskId ? { ...tk, ...patch } : tk));
    onTasksChange?.(next, persist);
  }
  const dirty = useMemo(() => {
    const sig = (list: ObraCheckTask[]) =>
      list.map((t) => `${t.id}|${t.fase ?? ''}|${[...t.predecesoras].sort().join(',')}`).sort().join(';');
    return sig(draft) !== sig(initialTasks);
  }, [draft, initialTasks]);

  function setTaskPhase(taskId: string, fase: string) {
    setDraft((curr) =>
      curr.map((t) => {
        if (t.id !== taskId) return t;
        const nextFase = fase || null;
        const phaseKey = (nextFase ?? '').trim();
        const allowed = new Set(
          curr
            .filter((o) => o.id !== taskId && (o.fase ?? '').trim() === phaseKey)
            .map((o) => o.id),
        );
        return {
          ...t,
          fase: nextFase,
          predecesoras: t.predecesoras.filter((p) => allowed.has(p)),
        };
      }),
    );
  }

  function setTaskPreds(taskId: string, predecesoras: string[]) {
    setDraft((curr) => {
      const target = curr.find((t) => t.id === taskId);
      if (!target) return curr;
      const phase = (target.fase ?? '').trim();
      const allowed = new Set(
        curr
          .filter((t) => t.id !== taskId && (t.fase ?? '').trim() === phase)
          .map((t) => t.id),
      );
      return curr.map((t) =>
        t.id === taskId ? { ...t, predecesoras: predecesoras.filter((p) => allowed.has(p)) } : t,
      );
    });
  }

  /** Encadena FS en orden de lista dentro de la fase. */
  function chainPhaseSequential(phase: string) {
    const phaseTasks = tasksByPhase.get(phase) ?? [];
    if (phaseTasks.length < 2) return;
    setDraft((curr) => {
      const ids = new Set(phaseTasks.map((t) => t.id));
      return curr.map((t) => {
        if (!ids.has(t.id)) return t;
        const idx = phaseTasks.findIndex((x) => x.id === t.id);
        if (idx <= 0) return { ...t, predecesoras: t.predecesoras.filter((p) => !ids.has(p)) };
        const prevId = phaseTasks[idx - 1]!.id;
        const outside = t.predecesoras.filter((p) => !ids.has(p));
        return { ...t, predecesoras: [...outside, prevId] };
      });
    });
  }

  function bulkAssign(fase: string) {
    if (selectedIds.size === 0) return;
    setDraft((curr) =>
      curr.map((t) => (selectedIds.has(t.id) ? { ...t, fase: fase || null } : t)),
    );
    setSelectedIds(new Set());
    if (fase) setExpandedPhases((s) => new Set(s).add(fase));
  }

  function createPhase() {
    const value = newPhase.trim();
    if (!value) return;
    setExtraPhases((curr) => (curr.includes(value) ? curr : [...curr, value]));
    setExpandedPhases((s) => new Set(s).add(value));
    setNewPhase('');
  }

  function togglePhaseExpand(phase: string) {
    setExpandedPhases((s) => {
      const next = new Set(s);
      if (next.has(phase)) next.delete(phase);
      else next.add(phase);
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function moveTask(phase: string, taskId: string, dir: -1 | 1) {
    const list = [...(tasksByPhase.get(phase) ?? [])];
    const i = list.findIndex((t) => t.id === taskId);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    const a = list[i]!;
    const b = list[j]!;
    list[i] = b;
    list[j] = a;
    const orderIds = list.map((t) => t.id);
    setDraft((curr) => {
      const others = curr.filter((t) => (t.fase?.trim() || 'Sin fase') !== phase);
      const reordered = orderIds
        .map((id) => curr.find((t) => t.id === id))
        .filter(Boolean) as ObraCheckTask[];
      return [...others, ...reordered];
    });
  }

  return (
    <div>
      <p className="mb-3 text-xs leading-relaxed" style={{ color: BRAND.muted }}>
        <strong style={{ color: BRAND.blue }}>1 · Fases:</strong> revisá y ordená las fases de la
        obra (podés crear nuevas y mover tareas). <strong style={{ color: BRAND.blue }}>2 · Cantidad:</strong>{' '}
        cargá los m² (u otra unidad) de cada tarea acá mismo. Al aplicar, Grows re-ordena el plan y
        rearma los paquetes.
      </p>

      <OCCard className="mb-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: BRAND.muted }}>
          Crear fase nueva
        </p>
        <div className="flex gap-2">
          <input
            style={inputStyle}
            value={newPhase}
            onChange={(e) => setNewPhase(e.target.value)}
            placeholder="Ej: Obra gruesa, Terminaciones finas…"
            onKeyDown={(e) => e.key === 'Enter' && createPhase()}
          />
          <OCButton variant="secondary" onClick={createPhase} disabled={!newPhase.trim()}>
            + Fase
          </OCButton>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {DEFAULT_PHASES.map((phase) => (
            <button
              key={phase}
              type="button"
              onClick={() => setExpandedPhases((s) => new Set(s).add(phase))}
              className="rounded-full px-3 py-1 text-xs font-semibold transition-opacity hover:opacity-80"
              style={{ background: PHASE_COLORS[phase] ?? BRAND.gray, color: BRAND.blue }}
            >
              {phase} · {tasksByPhase.get(phase)?.length ?? 0}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: BRAND.muted }}>
          <span>
            Precedencias:{' '}
            <span className="font-semibold" style={{ color: BRAND.blue }}>
              {depCount}
            </span>
          </span>
          <span>
            Cantidades cargadas:{' '}
            <span
              className="font-semibold"
              style={{ color: conCantidad === draft.length ? BRAND.green : BRAND.gold }}
            >
              {conCantidad}/{draft.length}
            </span>
          </span>
        </div>
      </OCCard>

      {selectedIds.size > 0 && (
        <OCCard className="mb-4" style={{ borderColor: BRAND.gold, background: '#FFFDF5' }}>
          <p className="mb-2 text-sm font-semibold" style={{ color: BRAND.text }}>
            {selectedIds.size} tarea(s) seleccionada(s) — mover a:
          </p>
          <div className="flex flex-wrap gap-2">
            {phases.map((phase) => (
              <OCButton key={phase} variant="secondary" onClick={() => bulkAssign(phase)}>
                {phase}
              </OCButton>
            ))}
          </div>
        </OCCard>
      )}

      {unassigned.length > 0 && (
        <OCCard className="mb-4" style={{ borderColor: BRAND.error }}>
          <p className="mb-2 text-sm font-semibold" style={{ color: BRAND.error }}>
            {unassigned.length} tarea(s) sin fase
          </p>
          <div className="space-y-1">
            {unassigned.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                phases={phases}
                allTasks={draft}
                selected={selectedIds.has(task.id)}
                depsOpen={depsOpenFor === task.id}
                onSelect={() => toggleSelect(task.id)}
                onPhaseChange={(fase) => setTaskPhase(task.id, fase)}
                onToggleDeps={() => setDepsOpenFor((id) => (id === task.id ? null : task.id))}
                onTogglePred={(predId) =>
                  setTaskPreds(task.id, togglePredecesora(task.predecesoras, predId))
                }
                onQtyChange={(patch, persist) => patchTaskQty(task.id, patch, persist)}
              />
            ))}
          </div>
        </OCCard>
      )}

      <div className="space-y-3">
        {phases.map((phase) => {
          const phaseTasks = tasksByPhase.get(phase) ?? [];
          if (phaseTasks.length === 0 && !expandedPhases.has(phase)) return null;
          const open = expandedPhases.has(phase);
          return (
            <OCCard key={phase} style={{ background: PHASE_COLORS[phase] ?? BRAND.gray }}>
              <button
                type="button"
                className="flex w-full items-center justify-between text-left"
                onClick={() => togglePhaseExpand(phase)}
              >
                <div>
                  <p className="text-sm font-bold" style={{ color: BRAND.blue }}>
                    {phase}
                  </p>
                  <p className="text-xs" style={{ color: BRAND.muted }}>
                    {phaseTasks.length} tarea(s)
                  </p>
                </div>
                {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </button>
              {open && phaseTasks.length > 0 && (
                <div className="mt-3 space-y-1 border-t pt-3" style={{ borderColor: BRAND.border }}>
                  <div className="mb-2 flex justify-end">
                    <OCButton
                      variant="secondary"
                      onClick={() => chainPhaseSequential(phase)}
                      disabled={phaseTasks.length < 2}
                    >
                      Encadenar en orden ↓
                    </OCButton>
                  </div>
                  {phaseTasks.map((task, idx) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      phases={phases}
                      allTasks={draft}
                      selected={selectedIds.has(task.id)}
                      depsOpen={depsOpenFor === task.id}
                      onSelect={() => toggleSelect(task.id)}
                      onPhaseChange={(fase) => setTaskPhase(task.id, fase)}
                      onToggleDeps={() => setDepsOpenFor((id) => (id === task.id ? null : task.id))}
                      onTogglePred={(predId) =>
                        setTaskPreds(task.id, togglePredecesora(task.predecesoras, predId))
                      }
                      onQtyChange={(patch, persist) => patchTaskQty(task.id, patch, persist)}
                      onMoveUp={idx > 0 ? () => moveTask(phase, task.id, -1) : undefined}
                      onMoveDown={
                        idx < phaseTasks.length - 1 ? () => moveTask(phase, task.id, 1) : undefined
                      }
                      compact
                    />
                  ))}
                </div>
              )}
              {open && phaseTasks.length === 0 && (
                <p className="mt-2 text-xs" style={{ color: BRAND.muted }}>
                  Sin tareas. Seleccioná tareas de otra fase o asigná las que faltan.
                </p>
              )}
            </OCCard>
          );
        })}
      </div>

      <div
        className="sticky bottom-0 mt-4 flex items-center justify-between gap-2 rounded-xl border p-3"
        style={{ background: dirty ? '#FFFBEB' : '#fff', borderColor: dirty ? BRAND.gold : BRAND.border }}
      >
        <p className="text-xs" style={{ color: BRAND.muted }}>
          {unassigned.length > 0
            ? `Asigná fase a ${unassigned.length} tarea(s) para aplicar.`
            : dirty
              ? 'Tenés cambios sin aplicar — el plan de la izquierda todavía no los refleja.'
              : 'Todo aplicado.'}
        </p>
        <OCButton
          loading={applying}
          onClick={() => {
            // Al aplicar, limpia vínculos entre fases distintas.
            const byId = new Map(draft.map((t) => [t.id, t]));
            const cleaned = draft.map((t) => {
              const phase = (t.fase ?? '').trim();
              return {
                ...t,
                predecesoras: t.predecesoras.filter((pid) => {
                  const p = byId.get(pid);
                  return p != null && (p.fase ?? '').trim() === phase;
                }),
              };
            });
            onApply(cleaned);
          }}
          disabled={unassigned.length > 0 || !dirty}
        >
          Aplicar y re-ordenar
        </OCButton>
      </div>
    </div>
  );
}

function TaskRow({
  task,
  phases,
  allTasks,
  selected,
  depsOpen,
  onSelect,
  onPhaseChange,
  onToggleDeps,
  onTogglePred,
  onQtyChange,
  onMoveUp,
  onMoveDown,
  compact,
}: {
  task: ObraCheckTask;
  phases: string[];
  allTasks: ObraCheckTask[];
  selected: boolean;
  depsOpen: boolean;
  onSelect: () => void;
  onPhaseChange: (fase: string) => void;
  onToggleDeps: () => void;
  onTogglePred: (predId: string) => void;
  onQtyChange?: (patch: Partial<ObraCheckTask>, persist: boolean) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  compact?: boolean;
}) {
  const samePhase = allTasks.filter(
    (t) => t.id !== task.id && (t.fase?.trim() || '') === (task.fase?.trim() || ''),
  );
  const predNames = task.predecesoras
    .map((id) => allTasks.find((t) => t.id === id)?.nombre)
    .filter(Boolean);

  const hasDeps = depsOpen || task.predecesoras.length > 0;

  return (
    <div
      className={`rounded-lg p-2.5 ${compact ? '' : 'mb-1'}`}
      style={{ background: compact ? '#fff' : BRAND.gray, border: `1px solid ${BRAND.border}` }}
    >
      {/* Fila 1: selección + nombre (ancho completo) + reordenar */}
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="mt-0.5 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" style={{ color: BRAND.text }} title={task.nombre}>
            {task.nombre}
          </p>
          <p className="truncate text-xs" style={{ color: BRAND.muted }}>
            {task.rubro ?? 'Sin rubro'}
            {task.duracionDias != null ? ` · ${task.duracionDias}d` : ''}
            {predNames.length > 0
              ? ` · ← ${predNames.slice(0, 2).join(', ')}${predNames.length > 2 ? '…' : ''}`
              : ''}
          </p>
        </div>
        {(onMoveUp || onMoveDown) && (
          <div className="flex shrink-0 flex-col gap-0.5">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={!onMoveUp}
              className="px-1 text-[10px] leading-none disabled:opacity-30"
              style={{ color: BRAND.muted }}
              title="Subir"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={!onMoveDown}
              className="px-1 text-[10px] leading-none disabled:opacity-30"
              style={{ color: BRAND.muted }}
              title="Bajar"
            >
              ▼
            </button>
          </div>
        )}
      </div>

      {/* Fila 2: controles (fase + dependencias) en su propia línea */}
      <div className="mt-2 flex items-center gap-2">
        <select
          style={{ ...inputStyle, width: '100%', fontSize: '0.8rem', padding: '0.4rem 0.5rem' }}
          className="min-w-0 flex-1"
          value={task.fase ?? ''}
          onChange={(e) => onPhaseChange(e.target.value)}
        >
          <option value="">Sin fase</option>
          {phases.map((phase) => (
            <option key={phase} value={phase}>
              {phase}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onToggleDeps}
          className="flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-bold"
          style={{
            background: hasDeps ? BRAND.blue : '#fff',
            color: hasDeps ? '#fff' : BRAND.text,
            border: `1px solid ${hasDeps ? BRAND.blue : BRAND.border}`,
          }}
        >
          Depende
          {task.predecesoras.length > 0 && (
            <span
              className="rounded-full px-1 text-[9px] font-bold"
              style={{ background: hasDeps ? 'rgba(255,255,255,0.25)' : BRAND.gray }}
            >
              {task.predecesoras.length}
            </span>
          )}
        </button>
      </div>

      {/* Fila 3: cantidad por tarea (m², etc.) — se carga acá, al armar el plan */}
      {onQtyChange && (
        <div className="mt-2 flex items-center gap-2">
          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide" style={{ color: BRAND.muted }}>
            Cantidad
          </span>
          <select
            style={{ ...inputStyle, width: 'auto', fontSize: '0.75rem', padding: '0.35rem 0.4rem' }}
            className="shrink-0"
            value={task.unidad ?? 'm2'}
            onChange={(e) => onQtyChange({ unidad: e.target.value }, true)}
          >
            {UNIDADES.map((u) => (
              <option key={u} value={u}>
                {unidadLabel(u)}
              </option>
            ))}
          </select>
          <input
            style={{
              ...inputStyle,
              fontSize: '0.8rem',
              padding: '0.35rem 0.5rem',
              borderColor: task.cantidad != null && task.cantidad > 0 ? BRAND.border : BRAND.gold,
            }}
            className="min-w-0 flex-1"
            inputMode="decimal"
            placeholder={`cant. (${unidadLabel(task.unidad ?? 'm2')})`}
            value={task.cantidad ?? ''}
            onChange={(e) => {
              const v = e.target.value.replace(',', '.');
              onQtyChange({ cantidad: v === '' ? null : Number(v) }, false);
            }}
            onBlur={() => onQtyChange({}, true)}
          />
        </div>
      )}

      {depsOpen && (
        <div className="mt-2 space-y-2 border-t pt-2" style={{ borderColor: BRAND.border }}>
          {!task.fase?.trim() ? (
            <p className="text-xs" style={{ color: BRAND.muted }}>
              Asigná una fase primero para vincular tareas.
            </p>
          ) : samePhase.length > 0 ? (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase" style={{ color: BRAND.muted }}>
                Depende de (misma fase)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {samePhase.map((c) => {
                  const on = task.predecesoras.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onTogglePred(c.id)}
                      className="rounded-md px-2 py-1 text-[11px] font-medium"
                      style={{
                        background: on ? BRAND.blue : '#fff',
                        color: on ? '#fff' : BRAND.text,
                        border: `1px solid ${on ? BRAND.blue : BRAND.border}`,
                      }}
                    >
                      {c.nombre.length > 24 ? `${c.nombre.slice(0, 24)}…` : c.nombre}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs" style={{ color: BRAND.muted }}>
              No hay otras tareas en esta fase para vincular.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

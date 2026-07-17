'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { CANONICAL_PHASES, PHASE_COLORS as PHASE_COLORS_SHARED } from '@/lib/obra-check/phases';
import type { ObraCheckTask } from '@/lib/obra-check/types';
import { BRAND, OCButton, OCCard, inputStyle } from './ui';

const DEFAULT_PHASES = [...CANONICAL_PHASES];

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

export function StepFases({
  tasks,
  onBack,
  onContinue,
}: {
  tasks: ObraCheckTask[];
  onBack: () => void;
  onContinue: (tasks: ObraCheckTask[]) => void;
}) {
  const initialTasks = useMemo(
    () => tasks.map((t) => ({ ...t, fase: t.fase ?? inferPhase(t) })),
    [tasks],
  );
  const [draft, setDraft] = useState<ObraCheckTask[]>(initialTasks);
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

  function setTaskPhase(taskId: string, fase: string) {
    setDraft((curr) => curr.map((t) => (t.id === taskId ? { ...t, fase: fase || null } : t)));
  }

  function setTaskPreds(taskId: string, predecesoras: string[]) {
    setDraft((curr) => curr.map((t) => (t.id === taskId ? { ...t, predecesoras } : t)));
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
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-1 text-xl font-bold" style={{ color: BRAND.blue }}>
        Agrupá tus tareas en fases
      </h2>
      <p className="mb-4 text-sm" style={{ color: BRAND.muted }}>
        Asigná fases y definí de qué tarea depende cada una <strong>antes</strong> de armar el canvas.
        Las flechas del diagrama salen de estas precedencias (también dentro de la misma fase).
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
        <p className="mt-3 text-xs" style={{ color: BRAND.muted }}>
          Precedencias marcadas:{' '}
          <span className="font-semibold" style={{ color: BRAND.blue }}>
            {depCount}
          </span>
        </p>
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

      <div className="mt-5 flex justify-between">
        <OCButton variant="ghost" onClick={onBack}>
          ← Volver a tareas
        </OCButton>
        <OCButton onClick={() => onContinue(draft)} disabled={unassigned.length > 0}>
          Ordenar y armar paquetes →
        </OCButton>
      </div>
      {unassigned.length > 0 && (
        <p className="mt-2 text-center text-xs" style={{ color: BRAND.muted }}>
          Asigná todas las tareas a una fase para continuar.
        </p>
      )}
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
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  compact?: boolean;
}) {
  const samePhase = allTasks.filter(
    (t) => t.id !== task.id && (t.fase?.trim() || '') === (task.fase?.trim() || ''),
  );
  const otherPhase = allTasks.filter(
    (t) => t.id !== task.id && (t.fase?.trim() || '') !== (task.fase?.trim() || ''),
  );
  const predNames = task.predecesoras
    .map((id) => allTasks.find((t) => t.id === id)?.nombre)
    .filter(Boolean);

  return (
    <div
      className={`rounded-lg p-2 ${compact ? '' : 'mb-1'}`}
      style={{ background: compact ? '#fff' : BRAND.gray }}
    >
      <div className="flex items-center gap-2">
        <input type="checkbox" checked={selected} onChange={onSelect} className="shrink-0" />
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
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" style={{ color: BRAND.text }}>
            {task.nombre}
          </p>
          <p className="text-xs" style={{ color: BRAND.muted }}>
            {task.rubro ?? 'Sin rubro'}
            {task.duracionDias != null ? ` · ${task.duracionDias}d` : ''}
            {predNames.length > 0
              ? ` · ← ${predNames.slice(0, 2).join(', ')}${predNames.length > 2 ? '…' : ''}`
              : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleDeps}
          className="shrink-0 rounded-md px-2 py-1 text-[10px] font-bold"
          style={{
            background: depsOpen || task.predecesoras.length ? BRAND.blue : '#fff',
            color: depsOpen || task.predecesoras.length ? '#fff' : BRAND.text,
            border: `1px solid ${BRAND.border}`,
          }}
        >
          Depende
        </button>
        <select
          style={{ ...inputStyle, width: 'auto', minWidth: 120, fontSize: '0.8rem' }}
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
      </div>

      {depsOpen && (
        <div className="mt-2 space-y-2 border-t pt-2" style={{ borderColor: BRAND.border }}>
          {samePhase.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase" style={{ color: BRAND.muted }}>
                Dentro de esta fase
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
          )}
          {otherPhase.length > 0 && (
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase" style={{ color: BRAND.muted }}>
                Otras fases
              </p>
              <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
                {otherPhase.map((c) => {
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
                      title={c.fase ?? ''}
                    >
                      {c.nombre.length > 22 ? `${c.nombre.slice(0, 22)}…` : c.nombre}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {samePhase.length === 0 && otherPhase.length === 0 && (
            <p className="text-xs" style={{ color: BRAND.muted }}>
              No hay otras tareas para vincular.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

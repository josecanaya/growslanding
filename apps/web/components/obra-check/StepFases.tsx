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

  function setTaskPhase(taskId: string, fase: string) {
    setDraft((curr) => curr.map((t) => (t.id === taskId ? { ...t, fase: fase || null } : t)));
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

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-1 text-xl font-bold" style={{ color: BRAND.blue }}>
        Agrupá tus tareas en fases
      </h2>
      <p className="mb-4 text-sm" style={{ color: BRAND.muted }}>
        Las fases ordenan la obra en etapas comerciales (ej. preparación, estructura, terminaciones).
        Grows ya sugirió una asignación — revisala y ajustá lo que haga falta.
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
                selected={selectedIds.has(task.id)}
                onSelect={() => toggleSelect(task.id)}
                onPhaseChange={(fase) => setTaskPhase(task.id, fase)}
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
                  {phaseTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      phases={phases}
                      selected={selectedIds.has(task.id)}
                      onSelect={() => toggleSelect(task.id)}
                      onPhaseChange={(fase) => setTaskPhase(task.id, fase)}
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
  selected,
  onSelect,
  onPhaseChange,
  compact,
}: {
  task: ObraCheckTask;
  phases: string[];
  selected: boolean;
  onSelect: () => void;
  onPhaseChange: (fase: string) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg p-2 ${compact ? '' : 'mb-1'}`}
      style={{ background: compact ? '#fff' : BRAND.gray }}
    >
      <input type="checkbox" checked={selected} onChange={onSelect} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium" style={{ color: BRAND.text }}>
          {task.nombre}
        </p>
        <p className="text-xs" style={{ color: BRAND.muted }}>
          {task.rubro ?? 'Sin rubro'}
          {task.duracionDias != null ? ` · ${task.duracionDias}d` : ''}
        </p>
      </div>
      <select
        style={{ ...inputStyle, width: 'auto', minWidth: 140, fontSize: '0.8rem' }}
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
  );
}

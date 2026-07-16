'use client';

import { useMemo, useState } from 'react';
import type { ObraCheckTask } from '@/lib/obra-check/types';
import { BRAND, OCButton, OCCard, inputStyle } from './ui';

const DEFAULT_PHASES = ['Preparacion', 'Estructura', 'Instalaciones', 'Terminaciones'];

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

  const phases = useMemo(() => {
    const set = new Set<string>(DEFAULT_PHASES);
    extraPhases.forEach((phase) => set.add(phase));
    draft.forEach((t) => {
      if (t.fase?.trim()) set.add(t.fase.trim());
    });
    return [...set];
  }, [draft, extraPhases]);

  function setTaskPhase(taskId: string, fase: string) {
    setDraft((curr) => curr.map((t) => (t.id === taskId ? { ...t, fase } : t)));
  }

  function createPhase() {
    const value = newPhase.trim();
    if (!value) return;
    setExtraPhases((curr) => (curr.includes(value) ? curr : [...curr, value]));
    setNewPhase('');
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-1 text-xl font-bold" style={{ color: BRAND.blue }}>
        Definí las fases antes de ordenar
      </h2>
      <p className="mb-4 text-sm" style={{ color: BRAND.muted }}>
        Antes de armar paquetes, agrupá las tareas en fases. Esto ordena mejor la conversación comercial
        y la estructura del plan.
      </p>

      <OCCard className="mb-4">
        <div className="mb-3 flex gap-2">
          <input
            style={inputStyle}
            value={newPhase}
            onChange={(e) => setNewPhase(e.target.value)}
            placeholder="Nueva fase, por ejemplo: Obra gruesa"
          />
          <OCButton variant="secondary" onClick={createPhase} disabled={!newPhase.trim()}>
            + Fase
          </OCButton>
        </div>
        <div className="flex flex-wrap gap-2">
          {phases.map((phase) => (
            <span
              key={phase}
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: BRAND.gray, color: BRAND.blue }}
            >
              {phase}
            </span>
          ))}
        </div>
      </OCCard>

      <OCCard>
        <div className="space-y-2">
          {draft.map((task, idx) => (
            <div key={task.id} className="grid grid-cols-1 gap-2 rounded-lg p-2 sm:grid-cols-[1fr_220px] sm:items-center" style={{ background: BRAND.gray }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: BRAND.text }}>
                  {idx + 1}. {task.nombre}
                </p>
                <p className="text-xs" style={{ color: BRAND.muted }}>
                  {task.rubro ?? 'Sin rubro'} {task.duracionDias != null ? `· ${task.duracionDias}d` : ''}
                </p>
              </div>
              <select
                style={inputStyle}
                value={task.fase ?? ''}
                onChange={(e) => setTaskPhase(task.id, e.target.value)}
              >
                <option value="">Sin fase</option>
                {phases.map((phase) => (
                  <option key={phase} value={phase}>
                    {phase}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </OCCard>

      <div className="mt-5 flex justify-between">
        <OCButton variant="ghost" onClick={onBack}>
          ← Volver a tareas
        </OCButton>
        <OCButton onClick={() => onContinue(draft)}>
          Ordenar y armar paquetes →
        </OCButton>
      </div>
    </div>
  );
}

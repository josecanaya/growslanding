'use client';

import { useMemo, useState } from 'react';
import type { ObraCheckBlock, ObraCheckBudgetGroup, ObraCheckTask } from '@/lib/obra-check/types';
import { BRAND, OCButton, OCCard } from './ui';
import { BudgetGroupsFlowCanvas } from './budget-groups/BudgetGroupsFlowCanvas';
import {
  blocksFromGroups,
  buildDefaultHierarchy,
  phaseGroups,
} from './budget-groups/buildDefaultHierarchy';

export function StepBudgetGroups({
  blocks,
  tasks,
  onBack,
  onContinue,
}: {
  blocks: ObraCheckBlock[];
  tasks: ObraCheckTask[];
  onBack: () => void;
  onContinue: (groups: ObraCheckBudgetGroup[], blocks: ObraCheckBlock[]) => void | Promise<void>;
}) {
  const initialGroups = useMemo(() => buildDefaultHierarchy(blocks), [blocks]);
  const [groups, setGroups] = useState<ObraCheckBudgetGroup[]>(initialGroups);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const draftBlocks = useMemo(() => blocksFromGroups(blocks, groups), [blocks, groups]);

  const phases = phaseGroups(groups);
  const subgroups = groups.filter((g) => g.kind === 'subgrupo' || g.parentId);
  const allAssigned = blocks.every((b) => subgroups.some((s) => s.blockIds.includes(b.id)));

  return (
    <div className="mx-auto max-w-5xl">
      <h2 className="mb-1 text-xl font-bold" style={{ color: BRAND.blue }}>
        Organizá presupuestos por fase
      </h2>
      <p className="mb-4 text-sm" style={{ color: BRAND.muted }}>
        Cada <b>fase</b> es un grupo comercial base. Adentro creá <b>subgrupos</b> (ej. distintos contratistas)
        y arrastrá los paquetes en el canvas — mismo motor que el resto de Grows.
      </p>

      <OCCard className="mb-4 !p-3">
        <BudgetGroupsFlowCanvas groups={groups} blocks={blocks} tasks={tasks} onChange={setGroups} />
      </OCCard>

      <OCCard className="mb-4">
        <p className="mb-3 text-sm font-semibold" style={{ color: BRAND.text }}>
          Resumen comercial
        </p>
        <div className="space-y-3">
          {phases
            .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
            .map((phase) => {
              const subs = subgroups
                .filter((s) => s.parentId === phase.id)
                .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
              return (
                <div key={phase.id} className="rounded-lg p-3" style={{ background: BRAND.gray }}>
                  <p className="text-sm font-bold" style={{ color: BRAND.blue }}>
                    {phase.nombre}
                  </p>
                  <div className="mt-2 space-y-2">
                    {subs.map((sub) => {
                      const subBlocks = draftBlocks.filter((b) => b.budgetGroupId === sub.id);
                      return (
                        <div key={sub.id} className="rounded-lg bg-white p-2">
                          <p className="text-xs font-semibold" style={{ color: BRAND.text }}>
                            {sub.nombre}
                            <span className="ml-2 font-normal" style={{ color: BRAND.muted }}>
                              · {subBlocks.length} paq.
                            </span>
                          </p>
                          {subBlocks.length > 0 && (
                            <ul className="mt-1 space-y-0.5 text-[11px]" style={{ color: BRAND.muted }}>
                              {subBlocks.map((b) => (
                                <li key={b.id}>
                                  {b.nombre} ({b.taskIds.length} tareas)
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      </OCCard>

      <div className="mt-5 flex justify-between">
        <OCButton variant="ghost" onClick={onBack} disabled={busy}>
          ← Volver al plan
        </OCButton>
        <div className="flex flex-col items-end gap-2">
          {error && (
            <p className="text-sm" style={{ color: BRAND.error }}>
              {error}
            </p>
          )}
          {!allAssigned && (
            <p className="text-xs" style={{ color: BRAND.error }}>
              Asigná todos los paquetes a un subgrupo antes de continuar.
            </p>
          )}
          <OCButton
            loading={busy}
            disabled={!allAssigned}
            onClick={() => {
              void (async () => {
                setBusy(true);
                setError(null);
                try {
                  const cleaned = groups
                    .filter((g) => g.nombre.trim())
                    .map((g) => ({
                      ...g,
                      blockIds:
                        g.kind === 'subgrupo' || g.parentId
                          ? g.blockIds
                          : [],
                    }));
                  await onContinue(cleaned, draftBlocks);
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              })();
            }}
          >
            Continuar a asignar →
          </OCButton>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import type { ObraCheckBlock, ObraCheckBudgetGroup } from '@/lib/obra-check/types';
import { BRAND, OCButton, OCCard, inputStyle } from './ui';

let groupCounter = 0;

function nextGroupName(index: number) {
  return `Grupo de presupuesto ${index}`;
}

function buildDefaultGroups(blocks: ObraCheckBlock[]): ObraCheckBudgetGroup[] {
  const byPhase = new Map<string, string[]>();
  blocks.forEach((block) => {
    const key = block.fase?.trim() || 'General';
    const arr = byPhase.get(key) ?? [];
    arr.push(block.id);
    byPhase.set(key, arr);
  });
  return [...byPhase.entries()].map(([phase, blockIds], i) => ({
    id: `bg-${i + 1}`,
    nombre: phase === 'General' ? nextGroupName(i + 1) : phase,
    blockIds,
  }));
}

export function StepBudgetGroups({
  blocks,
  onBack,
  onContinue,
}: {
  blocks: ObraCheckBlock[];
  onBack: () => void;
  onContinue: (groups: ObraCheckBudgetGroup[], blocks: ObraCheckBlock[]) => void | Promise<void>;
}) {
  const initialGroups = useMemo(() => buildDefaultGroups(blocks), [blocks]);
  const [groups, setGroups] = useState<ObraCheckBudgetGroup[]>(initialGroups);
  const [draftBlocks, setDraftBlocks] = useState<ObraCheckBlock[]>(
    blocks.map((b) => ({
      ...b,
      budgetGroupId: initialGroups.find((g) => g.blockIds.includes(b.id))?.id ?? null,
    })),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addGroup() {
    groupCounter += 1;
    const id = `bg-new-${groupCounter}`;
    setGroups((curr) => [...curr, { id, nombre: nextGroupName(curr.length + 1), blockIds: [] }]);
  }

  function renameGroup(id: string, nombre: string) {
    setGroups((curr) => curr.map((g) => (g.id === id ? { ...g, nombre } : g)));
  }

  function assignBlock(blockId: string, groupId: string) {
    setDraftBlocks((curr) => curr.map((b) => (b.id === blockId ? { ...b, budgetGroupId: groupId || null } : b)));
    setGroups((curr) =>
      curr.map((g) => ({
        ...g,
        blockIds:
          g.id === groupId
            ? [...new Set([...g.blockIds, blockId])]
            : g.blockIds.filter((id) => id !== blockId),
      })),
    );
  }

  const groupedPreview = useMemo(
    () =>
      groups.map((g) => ({
        ...g,
        blocks: draftBlocks.filter((b) => b.budgetGroupId === g.id),
      })),
    [groups, draftBlocks],
  );

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-1 text-xl font-bold" style={{ color: BRAND.blue }}>
        Armá grupos de presupuesto
      </h2>
      <p className="mb-4 text-sm" style={{ color: BRAND.muted }}>
        Antes de asignar contratistas, definí los grupos comerciales. Dentro de cada grupo van los paquetes
        de tareas que Grows armó al ordenar.
      </p>

      <OCCard className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold" style={{ color: BRAND.text }}>
            Grupos
          </p>
          <OCButton variant="secondary" onClick={addGroup}>
            + Grupo
          </OCButton>
        </div>
        <div className="space-y-2">
          {groups.map((group) => (
            <div key={group.id} className="flex gap-2">
              <input
                style={inputStyle}
                value={group.nombre}
                onChange={(e) => renameGroup(group.id, e.target.value)}
                placeholder="Nombre del grupo"
              />
              <div className="min-w-[100px] rounded-lg px-3 py-2 text-xs font-medium" style={{ background: BRAND.gray, color: BRAND.muted }}>
                {draftBlocks.filter((b) => b.budgetGroupId === group.id).length} paquete(s)
              </div>
            </div>
          ))}
        </div>
      </OCCard>

      <OCCard className="mb-4">
        <p className="mb-3 text-sm font-semibold" style={{ color: BRAND.text }}>
          Meté los paquetes dentro de grupos
        </p>
        <div className="space-y-2">
          {draftBlocks.map((block) => (
            <div key={block.id} className="grid grid-cols-1 gap-2 rounded-lg p-2 sm:grid-cols-[1fr_220px]" style={{ background: BRAND.gray }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: BRAND.text }}>
                  {block.nombre}
                </p>
                <p className="text-xs" style={{ color: BRAND.muted }}>
                  {block.taskIds.length} tarea(s){block.fase ? ` · ${block.fase}` : ''}
                </p>
              </div>
              <select
                style={inputStyle}
                value={block.budgetGroupId ?? ''}
                onChange={(e) => assignBlock(block.id, e.target.value)}
              >
                <option value="">Sin grupo</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.nombre}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </OCCard>

      <OCCard>
        <p className="mb-3 text-sm font-semibold" style={{ color: BRAND.text }}>
          Vista previa
        </p>
        <div className="space-y-3">
          {groupedPreview.map((group) => (
            <div key={group.id} className="rounded-lg p-3" style={{ background: BRAND.gray }}>
              <p className="text-sm font-semibold" style={{ color: BRAND.blue }}>
                {group.nombre}
              </p>
              {group.blocks.length === 0 ? (
                <p className="mt-1 text-xs" style={{ color: BRAND.muted }}>
                  Todavía no tiene paquetes.
                </p>
              ) : (
                <ul className="mt-2 space-y-1 text-xs" style={{ color: BRAND.text }}>
                  {group.blocks.map((block) => (
                    <li key={block.id}>{block.nombre}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
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
          <OCButton
            loading={busy}
            onClick={() => {
              void (async () => {
                setBusy(true);
                setError(null);
                try {
                  const cleaned = groups
                    .filter((g) => g.nombre.trim())
                    .map((g) => ({
                      ...g,
                      blockIds: draftBlocks.filter((b) => b.budgetGroupId === g.id).map((b) => b.id),
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

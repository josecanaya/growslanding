'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { ObraCheckBlock, ObraCheckBudgetGroup, ObraCheckTask } from '@/lib/obra-check/types';
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
  tasks,
  onBack,
  onContinue,
}: {
  blocks: ObraCheckBlock[];
  tasks: ObraCheckTask[];
  onBack: () => void;
  onContinue: (groups: ObraCheckBudgetGroup[], blocks: ObraCheckBlock[]) => void | Promise<void>;
}) {
  const taskById = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);
  const initialGroups = useMemo(() => buildDefaultGroups(blocks), [blocks]);
  const [groups, setGroups] = useState<ObraCheckBudgetGroup[]>(initialGroups);
  const [draftBlocks, setDraftBlocks] = useState<ObraCheckBlock[]>(
    blocks.map((b) => ({
      ...b,
      budgetGroupId: initialGroups.find((g) => g.blockIds.includes(b.id))?.id ?? null,
    })),
  );
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(initialGroups.map((g) => g.id)),
  );
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function taskNamesForBlock(block: ObraCheckBlock): ObraCheckTask[] {
    return block.taskIds.map((id) => taskById.get(id)).filter(Boolean) as ObraCheckTask[];
  }

  function addGroup() {
    groupCounter += 1;
    const id = `bg-new-${groupCounter}`;
    setGroups((curr) => [...curr, { id, nombre: nextGroupName(curr.length + 1), blockIds: [] }]);
    setExpandedGroups((s) => new Set(s).add(id));
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

  function toggleGroup(id: string) {
    setExpandedGroups((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleBlock(id: string) {
    setExpandedBlocks((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-1 text-xl font-bold" style={{ color: BRAND.blue }}>
        Armá grupos de presupuesto
      </h2>
      <p className="mb-4 text-sm" style={{ color: BRAND.muted }}>
        Cada grupo es un pedido comercial que le mandás a un contratista. Adentro van los paquetes
        de tareas — expandí cada uno para ver qué incluye.
      </p>

      <OCCard className="mb-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold" style={{ color: BRAND.text }}>
            Grupos comerciales
          </p>
          <OCButton variant="secondary" onClick={addGroup}>
            + Grupo
          </OCButton>
        </div>
        <div className="space-y-2">
          {groups.map((group) => {
            const groupBlocks = draftBlocks.filter((b) => b.budgetGroupId === group.id);
            const taskCount = groupBlocks.reduce((n, b) => n + b.taskIds.length, 0);
            const open = expandedGroups.has(group.id);
            return (
              <div key={group.id} className="rounded-lg" style={{ background: BRAND.gray }}>
                <div className="flex items-center gap-2 p-2">
                  <button type="button" onClick={() => toggleGroup(group.id)} className="shrink-0">
                    {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  <input
                    style={{ ...inputStyle, flex: 1 }}
                    value={group.nombre}
                    onChange={(e) => renameGroup(group.id, e.target.value)}
                    placeholder="Nombre del grupo"
                  />
                  <span className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium" style={{ background: '#fff', color: BRAND.muted }}>
                    {groupBlocks.length} paq. · {taskCount} tareas
                  </span>
                </div>
                {open && groupBlocks.length > 0 && (
                  <div className="space-y-2 border-t px-2 pb-2 pt-2" style={{ borderColor: BRAND.border }}>
                    {groupBlocks.map((block) => {
                      const blockTasks = taskNamesForBlock(block);
                      const blockOpen = expandedBlocks.has(block.id);
                      return (
                        <div key={block.id} className="rounded-lg bg-white p-2">
                          <button
                            type="button"
                            className="flex w-full items-center justify-between text-left"
                            onClick={() => toggleBlock(block.id)}
                          >
                            <div>
                              <p className="text-sm font-semibold" style={{ color: BRAND.text }}>
                                {block.nombre}
                              </p>
                              <p className="text-xs" style={{ color: BRAND.muted }}>
                                {blockTasks.length} tarea(s){block.fase ? ` · ${block.fase}` : ''}
                              </p>
                            </div>
                            {blockOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                          {blockOpen && (
                            <ul className="mt-2 space-y-0.5 border-t pt-2 text-xs" style={{ borderColor: BRAND.border, color: BRAND.text }}>
                              {blockTasks.map((t) => (
                                <li key={t.id} className="flex justify-between gap-2 py-0.5">
                                  <span>{t.nombre}</span>
                                  {t.duracionDias != null && (
                                    <span style={{ color: BRAND.muted }}>{t.duracionDias}d</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {open && groupBlocks.length === 0 && (
                  <p className="border-t px-3 pb-2 pt-1 text-xs" style={{ borderColor: BRAND.border, color: BRAND.muted }}>
                    Sin paquetes. Asigná paquetes abajo.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </OCCard>

      <OCCard className="mb-4">
        <p className="mb-3 text-sm font-semibold" style={{ color: BRAND.text }}>
          Asignar paquetes a grupos
        </p>
        <div className="space-y-2">
          {draftBlocks.map((block) => {
            const blockTasks = taskNamesForBlock(block);
            const blockOpen = expandedBlocks.has(`assign-${block.id}`);
            return (
              <div key={block.id} className="rounded-lg p-2" style={{ background: BRAND.gray }}>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_200px] sm:items-start">
                  <div>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-left"
                      onClick={() => toggleBlock(`assign-${block.id}`)}
                    >
                      {blockOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <p className="text-sm font-semibold" style={{ color: BRAND.text }}>
                        {block.nombre}
                      </p>
                    </button>
                    <p className="ml-5 text-xs" style={{ color: BRAND.muted }}>
                      {blockTasks.length} tarea(s){block.fase ? ` · ${block.fase}` : ''}
                    </p>
                    {blockOpen && (
                      <ul className="ml-5 mt-1 space-y-0.5 text-xs" style={{ color: BRAND.text }}>
                        {blockTasks.map((t) => (
                          <li key={t.id}>
                            · {t.nombre}
                            {t.duracionDias != null ? ` (${t.duracionDias}d)` : ''}
                          </li>
                        ))}
                      </ul>
                    )}
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
              </div>
            );
          })}
        </div>
      </OCCard>

      <OCCard>
        <p className="mb-3 text-sm font-semibold" style={{ color: BRAND.text }}>
          Vista previa — qué le llega al contratista
        </p>
        <div className="space-y-3">
          {groupedPreview.map((group) => (
            <div key={group.id} className="rounded-lg p-3" style={{ background: BRAND.gray }}>
              <p className="text-sm font-bold" style={{ color: BRAND.blue }}>
                {group.nombre}
              </p>
              {group.blocks.length === 0 ? (
                <p className="mt-1 text-xs" style={{ color: BRAND.muted }}>
                  Todavía no tiene paquetes.
                </p>
              ) : (
                <div className="mt-2 space-y-2">
                  {group.blocks.map((block) => {
                    const blockTasks = taskNamesForBlock(block);
                    return (
                      <div key={block.id} className="rounded-lg bg-white p-2">
                        <p className="text-xs font-semibold" style={{ color: BRAND.text }}>
                          {block.nombre}
                        </p>
                        <ul className="mt-1 space-y-0.5 text-xs" style={{ color: BRAND.muted }}>
                          {blockTasks.map((t) => (
                            <li key={t.id}>
                              {t.nombre}
                              {t.duracionDias != null ? ` · ${t.duracionDias}d` : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
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

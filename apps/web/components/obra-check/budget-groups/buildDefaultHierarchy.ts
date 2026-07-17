import type { ObraCheckBlock, ObraCheckBudgetGroup } from '@/lib/obra-check/types';

let subCounter = 0;

function phaseId(name: string, index: number) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'general';
  return `fase-${slug}-${index}`;
}

/**
 * Arma jerarquía inicial: una fase por cada fase de obra + un subgrupo
 * con todos los paquetes de esa fase (sin mezclar fases).
 */
export function buildDefaultHierarchy(blocks: ObraCheckBlock[]): ObraCheckBudgetGroup[] {
  const ordered = [...blocks].sort((a, b) => a.orden - b.orden);
  const phaseOrder: string[] = [];
  const byPhase = new Map<string, ObraCheckBlock[]>();

  for (const block of ordered) {
    const fase = block.fase?.trim() || 'General';
    if (!byPhase.has(fase)) {
      phaseOrder.push(fase);
      byPhase.set(fase, []);
    }
    byPhase.get(fase)!.push(block);
  }

  const groups: ObraCheckBudgetGroup[] = [];

  phaseOrder.forEach((fase, pi) => {
    const faseGroupId = phaseId(fase, pi);
    groups.push({
      id: faseGroupId,
      nombre: fase,
      blockIds: [],
      parentId: null,
      kind: 'fase',
      orden: pi,
    });

    subCounter += 1;
    const subId = `sub-${faseGroupId}-${subCounter}`;
    const phaseBlocks = byPhase.get(fase) ?? [];

    groups.push({
      id: subId,
      nombre: phaseBlocks.length > 1 ? 'Presupuesto conjunto' : 'Presupuesto',
      blockIds: phaseBlocks.map((b) => b.id),
      parentId: faseGroupId,
      kind: 'subgrupo',
      orden: 0,
    });
  });

  return groups;
}

export function blocksFromGroups(
  blocks: ObraCheckBlock[],
  groups: ObraCheckBudgetGroup[],
): ObraCheckBlock[] {
  const subgroups = groups.filter((g) => g.kind === 'subgrupo' || (!g.kind && g.parentId));
  const blockToGroup = new Map<string, string>();
  for (const g of subgroups) {
    for (const bid of g.blockIds) blockToGroup.set(bid, g.id);
  }
  // Fallback: flat groups sin jerarquía
  if (subgroups.length === 0) {
    for (const g of groups) {
      for (const bid of g.blockIds) blockToGroup.set(bid, g.id);
    }
  }
  return blocks.map((b) => ({
    ...b,
    budgetGroupId: blockToGroup.get(b.id) ?? null,
  }));
}

export function leafGroups(groups: ObraCheckBudgetGroup[]): ObraCheckBudgetGroup[] {
  return groups.filter((g) => g.kind === 'subgrupo' || (g.kind !== 'fase' && Boolean(g.parentId ?? g.blockIds.length)));
}

export function phaseGroups(groups: ObraCheckBudgetGroup[]): ObraCheckBudgetGroup[] {
  return groups.filter((g) => g.kind === 'fase' || (!g.parentId && g.kind !== 'subgrupo'));
}

export function nextSubgroupId(phaseId: string) {
  subCounter += 1;
  return `sub-${phaseId}-${subCounter}`;
}

export function budgetDisplaySections(
  groups: ObraCheckBudgetGroup[],
  blocks: ObraCheckBlock[],
): Array<{ phaseName: string | null; subgroupName: string; blocks: ObraCheckBlock[] }> {
  const phases = phaseGroups(groups).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  const subs = groups.filter((g) => g.kind === 'subgrupo' || g.parentId);

  if (phases.length === 0) {
    return groups
      .map((g) => ({
        phaseName: null,
        subgroupName: g.nombre,
        blocks: blocks.filter((b) => g.blockIds.includes(b.id)),
      }))
      .filter((s) => s.blocks.length > 0);
  }

  return phases.flatMap((phase) =>
    subs
      .filter((s) => s.parentId === phase.id)
      .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
      .map((sub) => ({
        phaseName: phase.nombre,
        subgroupName: sub.nombre,
        blocks: blocks.filter((b) => sub.blockIds.includes(b.id)),
      }))
      .filter((s) => s.blocks.length > 0),
  );
}

import type { ObraCheckBlock, ObraCheckBudgetGroup } from '@/lib/obra-check/types';
import { CANONICAL_PHASES, normalizePhase } from '@/lib/obra-check/phases';

let subCounter = 0;

function phaseGroupId(phase: string) {
  return `fase-${phase.toLowerCase()}`;
}

/**
 * Siempre las 4 fases canónicas + un subgrupo por fase con sus paquetes.
 */
export function buildDefaultHierarchy(blocks: ObraCheckBlock[]): ObraCheckBudgetGroup[] {
  const groups: ObraCheckBudgetGroup[] = [];

  CANONICAL_PHASES.forEach((fase, pi) => {
    const faseGroupId = phaseGroupId(fase);
    const phaseBlocks = [...blocks]
      .filter((b) => normalizePhase(b.fase) === fase)
      .sort((a, b) => a.orden - b.orden);

    groups.push({
      id: faseGroupId,
      nombre: fase,
      blockIds: [],
      parentId: null,
      kind: 'fase',
      orden: pi,
    });

    subCounter += 1;
    groups.push({
      id: `sub-${faseGroupId}-${subCounter}`,
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
  const subgroups = groups.filter((g) => g.kind === 'subgrupo' || g.parentId);
  const blockToGroup = new Map<string, string>();
  for (const g of subgroups) {
    for (const bid of g.blockIds) blockToGroup.set(bid, g.id);
  }
  return blocks.map((b) => ({
    ...b,
    budgetGroupId: blockToGroup.get(b.id) ?? null,
  }));
}

export function phaseGroups(groups: ObraCheckBudgetGroup[]): ObraCheckBudgetGroup[] {
  return groups.filter((g) => g.kind === 'fase' || (!g.parentId && g.kind !== 'subgrupo'));
}

export function nextSubgroupId(phaseIdVal: string) {
  subCounter += 1;
  return `sub-${phaseIdVal}-${subCounter}`;
}

export function budgetDisplaySections(
  groups: ObraCheckBudgetGroup[],
  blocks: ObraCheckBlock[],
): Array<{ phaseName: string | null; subgroupName: string; blocks: ObraCheckBlock[] }> {
  const phases = phaseGroups(groups).sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  const subs = groups.filter((g) => g.kind === 'subgrupo' || g.parentId);

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

/** Posición X de columna de fase (0..3). */
export function phaseColumnX(phaseName: string, colWidth = 260, gap = 36): number {
  const idx = CANONICAL_PHASES.indexOf(normalizePhase(phaseName));
  return Math.max(0, idx) * (colWidth + gap);
}

export function phaseFromColumnX(x: number, colWidth = 260, gap = 36): (typeof CANONICAL_PHASES)[number] {
  const idx = Math.round(x / (colWidth + gap));
  return CANONICAL_PHASES[Math.min(Math.max(idx, 0), CANONICAL_PHASES.length - 1)];
}

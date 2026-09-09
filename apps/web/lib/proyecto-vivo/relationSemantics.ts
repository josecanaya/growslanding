import type { CanvasEdgeRelation } from '@/lib/types/canvasMultinivel';

/** Canonical direction is prerequisite -> dependent. Unknown relations never block. */
export const RELATION_SEMANTICS: Record<CanvasEdgeRelation, { temporal: boolean; blocks: boolean; reverse: boolean }> = {
  precede: { temporal: true, blocks: true, reverse: false },
  depende_de: { temporal: true, blocks: true, reverse: true },
  habilita: { temporal: false, blocks: true, reverse: false },
  requiere: { temporal: false, blocks: true, reverse: true },
  afecta: { temporal: false, blocks: false, reverse: false },
  se_ejecuta_mediante: { temporal: false, blocks: false, reverse: false },
};

export function normalizeProductiveRelation(sourceId: string, targetId: string, relation?: string | null) {
  const key = !relation || relation === 'precedencia' ? 'precede' : relation;
  const semantic = RELATION_SEMANTICS[key as CanvasEdgeRelation] ?? { temporal: false, blocks: false, reverse: false };
  return { sourceId: semantic.reverse ? targetId : sourceId, targetId: semantic.reverse ? sourceId : targetId, ...semantic };
}

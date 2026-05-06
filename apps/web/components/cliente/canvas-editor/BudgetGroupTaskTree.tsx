'use client';

import type { CanvasNode } from '@/lib/types/canvasMultinivel';
import type { BudgetHierarchyBranch } from '@/lib/canvas/budgetGroupHierarchy';
import { labelEstadoTareaFromDb } from './canvasMultinivelHelpers';

type Pub = Record<string, { tareaId: string; estado: string; publishedAt: string | null }>;

function BranchView({
  branch,
  depth,
  tareaPublicacionByNodeId,
}: {
  branch: BudgetHierarchyBranch;
  depth: number;
  tareaPublicacionByNodeId: Pub;
}) {
  const pad = Math.min(24 + depth * 14, 120);
  const isOrphan = branch.segmentType === 'sin_ubicacion';

  return (
    <li className="list-none">
      {!isOrphan && (
        <div
          className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-[12px] font-bold text-[#0f172a]"
          style={{ marginLeft: depth === 0 ? 0 : pad }}
        >
          <span className="mr-2 rounded bg-[#e0e7ff] px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#3730a3]">
            {branch.segmentType}
          </span>
          {branch.segmentTitle}
        </div>
      )}
      {branch.leafTasks.length > 0 && (
        <ul className="mt-2 space-y-2" style={{ marginLeft: pad + (isOrphan ? 0 : 8) }}>
          {branch.leafTasks.map((t) => {
            const pub = tareaPublicacionByNodeId[t.id];
            return (
              <li
                key={t.id}
                className="rounded-xl border border-[#e8edf3] bg-[#fafbfd] px-3 py-2 text-[13px]"
              >
                <p className="font-semibold text-[#001629]">{t.title}</p>
                <p className="mt-1 text-[11px] text-[#475569]">
                  Duración: {Math.max(1, Math.round(t.duracionDias ?? 1))} días ·{' '}
                  {pub ? (
                    <span className="font-bold text-emerald-800">Publicada</span>
                  ) : (
                    <span className="font-bold text-slate-600">Sin publicar</span>
                  )}
                  {pub ? (
                    <span className="text-[#64748b]">
                      {' '}
                      · Operativo: {labelEstadoTareaFromDb(pub.estado)}
                    </span>
                  ) : null}
                </p>
              </li>
            );
          })}
        </ul>
      )}
      {branch.sub.length > 0 && (
        <ul className={branch.leafTasks.length > 0 || !isOrphan ? 'mt-2 space-y-3' : 'space-y-3'}>
          {branch.sub.map((ch) => (
            <BranchView
              key={ch.segmentId}
              branch={ch}
              depth={isOrphan ? depth : depth + 1}
              tareaPublicacionByNodeId={tareaPublicacionByNodeId}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function BudgetGroupTaskTree({
  branches,
  tareaPublicacionByNodeId,
}: {
  branches: BudgetHierarchyBranch[];
  tareaPublicacionByNodeId: Pub;
}) {
  if (branches.length === 0) {
    return <p className="text-sm text-[#94a3b8]">Ninguna tarea en este grupo.</p>;
  }
  return (
    <ul className="space-y-4">
      {branches.map((b) => (
        <BranchView
          key={b.segmentId}
          branch={b}
          depth={0}
          tareaPublicacionByNodeId={tareaPublicacionByNodeId}
        />
      ))}
    </ul>
  );
}

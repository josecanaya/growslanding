'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  DoorOpen,
  FolderOpen,
  LayoutGrid,
  Layers,
  Search,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type { CanvasNode } from '@/lib/types/canvasMultinivel';
import type { CanvasProjectKind } from '@/lib/canvas/canvasProjectProfile';
import {
  descendantTaskPublicationRollup,
  labelEstadoNivel,
  labelTipoNodo,
} from './canvasMultinivelHelpers';

export type CanvasProjectBrowserProps = {
  obraNombre: string;
  nodes: CanvasNode[];
  projectKind: CanvasProjectKind;
  pathIds: string[];
  containerId: string | null;
  selectedId: string | null;
  tareaPublicacionByNodeId: Record<string, { publishedAt?: string | null } | undefined>;
  onGoRoot: () => void;
  onNavigateToNode: (nodeId: string) => void;
};

function iconForType(t: CanvasNode['type']) {
  switch (t) {
    case 'etapa':
      return Layers;
    case 'planta':
      return Building2;
    case 'sector':
      return LayoutGrid;
    case 'ambiente':
      return DoorOpen;
    case 'tarea':
      return CheckSquare;
    default:
      return FolderOpen;
  }
}

function sortNodes(ns: CanvasNode[]) {
  return [...ns].sort((a, b) =>
    (a.importOutlineNumber || a.title).localeCompare(b.importOutlineNumber || b.title, 'es', {
      numeric: true,
      sensitivity: 'base',
    }),
  );
}

function nodeMatchesQuery(n: CanvasNode, q: string): boolean {
  if (!q) return true;
  const s = q.toLowerCase();
  return (
    n.title.toLowerCase().includes(s) ||
    (n.tipoLabel?.toLowerCase().includes(s) ?? false) ||
    (n.importOutlineNumber?.toLowerCase().includes(s) ?? false)
  );
}

/** ¿Algún descendiente coincide con la búsqueda? (para mantener rama expandida) */
function subtreeHasMatch(
  nodes: CanvasNode[],
  parentId: string,
  q: string,
  byParent: Map<string | null, CanvasNode[]>,
): boolean {
  if (!q) return true;
  for (const ch of byParent.get(parentId) ?? []) {
    if (nodeMatchesQuery(ch, q)) return true;
    if (subtreeHasMatch(nodes, ch.id, q, byParent)) return true;
  }
  return false;
}

export function CanvasProjectBrowser({
  obraNombre,
  nodes,
  projectKind,
  pathIds,
  containerId,
  selectedId,
  tareaPublicacionByNodeId,
  onGoRoot,
  onNavigateToNode,
}: CanvasProjectBrowserProps) {
  const roots = useMemo(
    () => sortNodes(nodes.filter((n) => n.parentId === null && n.type === 'etapa')),
    [nodes],
  );

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');

  const rollupMemo = useMemo(() => {
    const m = new Map<string, ReturnType<typeof descendantTaskPublicationRollup>>();
    for (const n of nodes) {
      if (n.type === 'tarea') continue;
      m.set(n.id, descendantTaskPublicationRollup(nodes, n.id, tareaPublicacionByNodeId));
    }
    return m;
  }, [nodes, tareaPublicacionByNodeId]);

  const byParent = useMemo(() => {
    const map = new Map<string | null, CanvasNode[]>();
    for (const n of nodes) {
      const p = n.parentId;
      if (!map.has(p)) map.set(p, []);
      map.get(p)!.push(n);
    }
    for (const [, arr] of map) {
      arr.sort((a, b) =>
        (a.importOutlineNumber || a.title).localeCompare(b.importOutlineNumber || b.title, 'es', {
          numeric: true,
          sensitivity: 'base',
        }),
      );
    }
    return map;
  }, [nodes]);

  useEffect(() => {
    const q = query.trim().toLowerCase();
    setExpanded((prev) => {
      const next = { ...prev };
      if (pathIds.length === 0) {
        roots.forEach((r) => {
          next[r.id] = true;
        });
      }
      for (const id of pathIds) {
        next[id] = true;
      }
      let cur = selectedId ? nodes.find((n) => n.id === selectedId) : undefined;
      while (cur?.parentId) {
        next[cur.parentId] = true;
        cur = nodes.find((n) => n.id === cur!.parentId);
      }
      if (q) {
        for (const n of nodes) {
          if (n.type === 'tarea') continue;
          if (subtreeHasMatch(nodes, n.id, q, byParent)) {
            next[n.id] = true;
          }
        }
      }
      return next;
    });
  }, [pathIds, selectedId, nodes, roots, query, byParent]);

  const childrenOf = useCallback(
    (parentId: string | null) => byParent.get(parentId) ?? [],
    [byParent],
  );

  const toggle = (id: string) => {
    setExpanded((p) => ({ ...p, [id]: !p[id] }));
  };

  const qTrim = query.trim();

  const renderNode = (n: CanvasNode, depth: number): React.ReactNode => {
    const ch = childrenOf(n.id);
    const hasKids = ch.length > 0;
    const isOpen = expanded[n.id] === true;
    const Ico = iconForType(n.type);
    const isActive = n.id === containerId;
    const isSelected = n.id === selectedId;
    const rollup = rollupMemo.get(n.id);
    const visibleChildren = qTrim
      ? ch.filter(
          (c) => nodeMatchesQuery(c, qTrim) || subtreeHasMatch(nodes, c.id, qTrim, byParent),
        )
      : ch;
    if (qTrim && !nodeMatchesQuery(n, qTrim) && visibleChildren.length === 0) {
      return null;
    }

    let subline = '';
    if (n.type === 'tarea') {
      subline = labelEstadoNivel(n.estadoNivel);
    } else if (rollup && rollup.taskCount > 0) {
      subline = `${rollup.taskCount} tarea${rollup.taskCount === 1 ? '' : 's'} · ${rollup.publishedCount} pub. · ${rollup.unpublishedCount} sin pub.${
        rollup.presupuestadasCount > 0 ? ` · ${rollup.presupuestadasCount} presup.` : ''
      }`;
    } else if (visibleChildren.length > 0 || ch.length > 0) {
      subline = `${visibleChildren.length || ch.length} hijo(s)`;
    }

    const titleTip = [n.title, subline, labelTipoNodo(n.type, projectKind)].filter(Boolean).join(' · ');

    return (
      <div key={n.id} className="select-none">
        <div
          className={cn(
            'flex items-center gap-0.5 rounded-lg py-1 pr-1 transition-colors',
            isActive
              ? 'bg-[#eff6ff] text-[#1d4ed8] ring-1 ring-[#bfdbfe]'
              : isSelected
                ? 'bg-[#f1f5f9] text-[#0f172a] ring-1 ring-[#e2e8f0]'
                : 'text-[#334155] hover:bg-[#f8fafc]',
          )}
          style={{ paddingLeft: 4 + depth * 10 }}
          title={titleTip}
        >
          {hasKids ? (
            <button
              type="button"
              className="flex h-5 w-5 shrink-0 items-center justify-center text-[#94a3b8] hover:text-[#0f172a]"
              aria-label={isOpen ? 'Contraer' : 'Expandir'}
              onClick={(e) => {
                e.stopPropagation();
                toggle(n.id);
              }}
            >
              {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          ) : (
            <span className="inline-block w-5 shrink-0" />
          )}
          <button
            type="button"
            className="flex min-w-0 flex-1 flex-col gap-0 py-0.5 text-left"
            onClick={() => onNavigateToNode(n.id)}
          >
            <div className="flex min-w-0 items-center gap-1.5">
              <Ico className="h-3 w-3 shrink-0 text-[#64748b]" strokeWidth={2} />
              <span className="min-w-0 truncate text-[11px] font-medium leading-tight">{n.title}</span>
              <span className="ml-auto shrink-0 rounded-full bg-[#f1f5f9] px-1.5 py-0.5 text-[9px] uppercase tracking-tight text-[#64748b]">
                {n.type === 'tarea' ? '' : labelTipoNodo(n.type, projectKind).slice(0, 3)}
              </span>
            </div>
            {subline ? (
              <span className="truncate pl-[22px] text-[9px] leading-tight text-[#64748b]">{subline}</span>
            ) : null}
          </button>
        </div>
        {hasKids && isOpen ? <div>{visibleChildren.map((c) => renderNode(c, depth + 1))}</div> : null}
      </div>
    );
  };

  return (
    <aside className="my-3 flex h-[calc(100%-1.5rem)] min-h-0 w-[272px] shrink-0 flex-col rounded-2xl border border-[#e5e7eb] bg-white text-[#0f172a] shadow-[0_1px_3px_rgba(15,23,42,0.05)] max-xl:hidden">
      <div className="shrink-0 border-b border-[#f1f5f9] px-3 py-3">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#64748b]">
          Project Browser
        </p>
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en obra…"
            className="w-full rounded-xl border border-[#e5e7eb] bg-[#f8fafc] py-2 pl-8 pr-2 text-[11px] text-[#0f172a] placeholder:text-[#94a3b8] outline-none focus:border-[#bfdbfe] focus:bg-white"
            aria-label="Buscar en obra"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-1">
        <div className="px-1">
          <button
            type="button"
            onClick={onGoRoot}
            className={cn(
              'flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-[11px] font-semibold transition-colors',
              pathIds.length === 0 ? 'bg-[#eff6ff] text-[#1d4ed8] ring-1 ring-[#bfdbfe]' : 'text-[#334155] hover:bg-[#f8fafc]',
            )}
            title={obraNombre || 'Obra'}
          >
            <FolderOpen className="h-3.5 w-3.5 shrink-0 text-[#2563eb]" />
            <span className="min-w-0 truncate">{obraNombre || 'Obra'}</span>
          </button>
        </div>
        <div className="mt-0.5 px-0.5">{roots.map((r) => renderNode(r, 0))}</div>
      </div>
    </aside>
  );
}

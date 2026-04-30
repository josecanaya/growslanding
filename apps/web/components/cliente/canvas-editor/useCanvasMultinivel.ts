'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CanvasNode, CanvasPrecedenceEdge } from '@/lib/types/canvasMultinivel';
import { CANVAS_MULTINIVEL_STORAGE_VERSION } from '@/lib/types/canvasMultinivel';
import type { Connection } from '@xyflow/react';
import { loadCanvasMultinivel, saveCanvasMultinivel } from '@/lib/canvas/canvasMultinivelStorage';
import {
  canEnterNode,
  canAddPrecedenceEdge,
  childTypeForContainer,
  collectSubtreeIds,
  defaultTitleFor,
  edgesForSiblingLevel,
  newCanvasEdgeId,
  newCanvasNodeId,
  pathIdsToShowContainer,
  staggerPosition,
} from './canvasMultinivelHelpers';

export function useCanvasMultinivel(obraId: string) {
  const [obraNombre, setObraNombre] = useState('Obra');
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [edges, setEdges] = useState<CanvasPrecedenceEdge[]>([]);
  const [pathIds, setPathIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadCanvasMultinivel(obraId);
    if (stored) {
      setObraNombre(stored.obraNombre);
      setNodes(stored.nodes);
      setEdges(Array.isArray(stored.edges) ? stored.edges : []);
      setPathIds(stored.pathIds);
    } else {
      setObraNombre('Obra');
      setNodes([]);
      setEdges([]);
      setPathIds([]);
    }
    setSelectedId(null);
  }, [obraId]);

  useEffect(() => {
    saveCanvasMultinivel(obraId, {
      v: CANVAS_MULTINIVEL_STORAGE_VERSION,
      obraNombre,
      nodes,
      pathIds,
      edges,
    });
  }, [obraId, obraNombre, nodes, pathIds, edges]);

  const containerId = useMemo(
    () => (pathIds.length === 0 ? null : pathIds[pathIds.length - 1]!),
    [pathIds],
  );

  const containerNode = useMemo(
    () => (containerId ? nodes.find((n) => n.id === containerId) ?? null : null),
    [nodes, containerId],
  );

  const visibleNodes = useMemo(
    () => nodes.filter((n) => n.parentId === containerId),
    [nodes, containerId],
  );

  const siblingEdges = useMemo(
    () => edgesForSiblingLevel(containerId, nodes, edges),
    [containerId, nodes, edges],
  );

  /** Evita lienzo vacío + inspector poblado cuando el seleccionado ya no pertenece a este contenedor */
  useEffect(() => {
    setSelectedId((sid) => {
      if (!sid) return null;
      const n = nodes.find((x) => x.id === sid);
      if (!n || n.parentId !== containerId) return null;
      return sid;
    });
  }, [containerId, nodes]);

  const childTypeToCreate = useMemo(() => childTypeForContainer(containerNode), [containerNode]);

  const selectedNode = useMemo(
    () => (selectedId ? nodes.find((n) => n.id === selectedId) ?? null : null),
    [nodes, selectedId],
  );

  const breadcrumbItems = useMemo(() => {
    const items: { id: string | null; title: string }[] = [{ id: null, title: obraNombre }];
    for (const id of pathIds) {
      const n = nodes.find((x) => x.id === id);
      if (n) items.push({ id: n.id, title: n.title });
    }
    return items;
  }, [obraNombre, pathIds, nodes]);

  const goToBreadcrumbIndex = useCallback((index: number) => {
    setSelectedId(null);
    if (index <= 0) {
      setPathIds([]);
      return;
    }
    setPathIds((p) => p.slice(0, index));
  }, []);

  const goUpLevel = useCallback(() => {
    setPathIds((p) => p.slice(0, Math.max(0, p.length - 1)));
    setSelectedId(null);
  }, []);

  const enterNode = useCallback(
    (id: string) => {
      const n = nodes.find((x) => x.id === id);
      if (!n || !canEnterNode(n)) return;
      setPathIds((p) => [...p, id]);
      setSelectedId(null);
    },
    [nodes],
  );

  const createChildNode = useCallback(() => {
    const type = childTypeForContainer(containerNode);
    if (!type) return null;
    const siblings = visibleNodes.length;
    const parentId = containerId;
    const level = containerNode ? containerNode.level + 1 : 1;
    const id = newCanvasNodeId();
    const created: CanvasNode = {
      id,
      parentId,
      level,
      type,
      title: defaultTitleFor(type),
      position: staggerPosition(siblings),
      createdAt: new Date().toISOString(),
      ...(type === 'tarea'
        ? {
            estadoTarea: 'pendiente' as const,
            duracionDias: 1,
            checklist: [],
            esCritica: false,
          }
        : { estadoNivel: 'pendiente' as const }),
    };
    setNodes((prev) => [...prev, created]);
    setSelectedId(id);
    return created;
  }, [containerId, containerNode, visibleNodes.length]);

  const patchNode = useCallback((id: string, patch: Partial<CanvasNode>) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
  }, []);

  const updatePosition = useCallback(
    (id: string, position: { x: number; y: number }) => {
      patchNode(id, { position });
    },
    [patchNode],
  );

  const deleteNode = useCallback((id: string) => {
    setNodes((prev) => {
      const rm = collectSubtreeIds(prev, id);
      const next = prev.filter((n) => !rm.has(n.id));
      queueMicrotask(() => {
        setPathIds((p) => p.filter((pid) => !rm.has(pid)));
        setEdges((eds) =>
          eds.filter((e) => !rm.has(e.sourceId) && !rm.has(e.targetId)),
        );
        setSelectedId((s) => (s !== null && rm.has(s) ? null : s));
      });
      return next;
    });
  }, []);

  const duplicateNode = useCallback((id: string) => {
    setNodes((prev) => {
      const src = prev.find((n) => n.id === id);
      if (!src) return prev;
      const copyId = newCanvasNodeId();
      let copy: CanvasNode;
      if (src.type === 'tarea') {
        copy = {
          ...src,
          id: copyId,
          title: `${src.title} (copia)`,
          position: { x: src.position.x + 36, y: src.position.y + 36 },
          createdAt: new Date().toISOString(),
          checklist: (src.checklist ?? []).map((i) => ({
            ...i,
            id: newCanvasNodeId(),
          })),
          esCritica: Boolean(src.esCritica),
        };
      } else {
        const { checklist: _c, esCritica: _e, ...rest } = src;
        copy = {
          ...rest,
          id: copyId,
          title: `${src.title} (copia)`,
          position: { x: src.position.x + 36, y: src.position.y + 36 },
          createdAt: new Date().toISOString(),
        };
      }
      queueMicrotask(() => setSelectedId(copyId));
      return [...prev, copy];
    });
  }, []);

  const createChildOf = useCallback((parentId: string) => {
    setNodes((prev) => {
      const parent = prev.find((n) => n.id === parentId);
      const type = childTypeForContainer(parent ?? null);
      if (!parent || !type) return prev;

      const path = pathIdsToShowContainer(prev, parentId);
      const siblings = prev.filter((n) => n.parentId === parentId).length;
      const id = newCanvasNodeId();
      queueMicrotask(() => {
        setPathIds(path);
        setSelectedId(id);
      });

      const created: CanvasNode = {
        id,
        parentId,
        level: parent.level + 1,
        type,
        title: defaultTitleFor(type),
        position: staggerPosition(siblings),
        createdAt: new Date().toISOString(),
        ...(type === 'tarea'
          ? {
              estadoTarea: 'pendiente' as const,
              duracionDias: 1,
              checklist: [],
              esCritica: false,
            }
          : { estadoNivel: 'pendiente' as const }),
      };
      return [...prev, created];
    });
  }, []);

  const tryPrecedenceConnection = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target) return false;
      if (
        !canAddPrecedenceEdge(containerId, nodes, edges, c.source, c.target)
      ) {
        return false;
      }
      const id = newCanvasEdgeId();
      setEdges((prev) => [
        ...prev,
        { id, sourceId: c.source, targetId: c.target, critical: false },
      ]);
      return true;
    },
    [containerId, nodes, edges],
  );

  const removeEdgeIds = useCallback((ids: string[]) => {
    if (!ids.length) return;
    setEdges((prev) => prev.filter((e) => !ids.includes(e.id)));
  }, []);

  const patchEdge = useCallback(
    (id: string, patch: Partial<Omit<CanvasPrecedenceEdge, 'id'>>) => {
      setEdges((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      );
    },
    [],
  );

  const addChecklistItem = useCallback((taskId: string) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== taskId || n.type !== 'tarea') return n;
        const list = n.checklist ?? [];
        const item = {
          id: newCanvasNodeId(),
          label: 'Ítem nuevo',
          done: false,
        };
        return { ...n, checklist: [...list, item] };
      }),
    );
  }, []);

  const toggleChecklistItem = useCallback(
    (taskId: string, itemId: string) => {
      setNodes((prev) =>
        prev.map((n) => {
          if (n.id !== taskId || n.type !== 'tarea') return n;
          const list = (n.checklist ?? []).map((it) =>
            it.id === itemId ? { ...it, done: !it.done } : it,
          );
          return { ...n, checklist: list };
        }),
      );
    },
    [],
  );

  const updateChecklistLabel = useCallback(
    (taskId: string, itemId: string, label: string) => {
      setNodes((prev) =>
        prev.map((n) => {
          if (n.id !== taskId || n.type !== 'tarea') return n;
          const list = (n.checklist ?? []).map((it) =>
            it.id === itemId ? { ...it, label } : it,
          );
          return { ...n, checklist: list };
        }),
      );
    },
    [],
  );

  const removeChecklistItem = useCallback((taskId: string, itemId: string) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== taskId || n.type !== 'tarea') return n;
        return {
          ...n,
          checklist: (n.checklist ?? []).filter((it) => it.id !== itemId),
        };
      }),
    );
  }, []);

  return {
    obraNombre,
    setObraNombre,
    nodes,
    edges,
    siblingEdges,
    containerId,
    containerNode,
    visibleNodes,
    childTypeToCreate,
    selectedId,
    setSelectedId,
    selectedNode,
    breadcrumbItems,
    goToBreadcrumbIndex,
    goUpLevel,
    enterNode,
    createChildNode,
    patchNode,
    updatePosition,
    deleteNode,
    duplicateNode,
    createChildOf,
    tryPrecedenceConnection,
    removeEdgeIds,
    patchEdge,
    addChecklistItem,
    toggleChecklistItem,
    updateChecklistLabel,
    removeChecklistItem,
  };
}

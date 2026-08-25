'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Connection } from '@xyflow/react';
import type {
  CanvasBudgetGroup,
  CanvasMultinivelPersisted,
  CanvasNode,
  CanvasPrecedenceEdge,
} from '@/lib/types/canvasMultinivel';
import type { CanvasProjectKind } from '@/lib/canvas/canvasProjectProfile';
import { peekSessionCanvasProjectKind } from '@/lib/canvas/canvasProjectProfile';
import { peekSessionObraProductKind, isObraProductKind } from '@/lib/canvas/obraProductKind';
import {
  composeCanvasPersisted,
  loadCanvasMultinivel,
  saveCanvasMultinivel,
} from '@/lib/canvas/canvasMultinivelStorage';
import {
  canEnterNode,
  canAddPrecedenceEdge,
  canAddPrecedenceEdgeInAncestorSubtree,
  childTypeForContainer,
  collectSubtreeIds,
  defaultTitleFor,
  edgesForSiblingLevel,
  etapaPrefersSubtreeTaskCanvas,
  plantaPrefersSubtreeTaskCanvas,
  newCanvasEdgeId,
  newCanvasNodeId,
  pathIdsToShowContainer,
  staggerPosition,
} from './canvasMultinivelHelpers';
import { getDescendantTaskIds } from '@/lib/canvas/budgetGroupTree';
import { loadCanvasTemplateImportBundle } from '@/lib/canvas/importCanvasTemplateFromXml';

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function postPublicarTareasWithRetry(
  obraId: string,
  maxAttempts = 4,
): Promise<{ res: Response; pub: Record<string, unknown> }> {
  let lastRes = new Response(null, { status: 503 });
  let lastPub: Record<string, unknown> = {};
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetch(`/api/obras/${encodeURIComponent(obraId)}/canvas/publicar-tareas`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const pub = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      lastRes = res;
      lastPub = pub;
      if (res.ok && pub.ok === true) {
        return { res, pub };
      }
      const errStr = typeof pub.error === 'string' ? pub.error.toLowerCase() : '';
      const retryable =
        pub.retryable === true ||
        res.status === 503 ||
        res.status === 502 ||
        res.status === 504 ||
        (res.status >= 500 &&
          (errStr.includes('fetch failed') ||
            errStr.includes('failed to fetch') ||
            errStr.includes('econnreset') ||
            errStr.includes('network')));
      if (!retryable || attempt === maxAttempts - 1) {
        return { res, pub };
      }
    } catch {
      if (attempt === maxAttempts - 1) {
        throw new Error(
          'Fallo de red al publicar tareas. Revisá tu conexión y volvé a pulsar «Guardar en la nube».',
        );
      }
    }
    await sleep(450 * Math.pow(2, attempt));
  }
  return { res: lastRes, pub: lastPub };
}

export function useCanvasMultinivel(obraId: string) {
  const [obraNombre, setObraNombre] = useState('Obra');
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [edges, setEdges] = useState<CanvasPrecedenceEdge[]>([]);
  const [pathIds, setPathIds] = useState<string[]>([]);
  const [budgetGroups, setBudgetGroups] = useState<CanvasBudgetGroup[]>([]);
  const [projectKind, setProjectKind] = useState<CanvasProjectKind>('edificio_multifamiliar');
  const [obraProductKind, setObraProductKind] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [canvasHydrated, setCanvasHydrated] = useState(false);
  const [cloudSaveState, setCloudSaveState] = useState<'idle' | 'saving' | 'ok' | 'err'>('idle');
  const [cloudSaveMessage, setCloudSaveMessage] = useState<string | null>(null);
  const [tareaPublicacionByNodeId, setTareaPublicacionByNodeId] = useState<
    Record<string, { tareaId: string; estado: string; publishedAt: string | null }>
  >({});

  const refreshTareaPublicacion = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/obras/${encodeURIComponent(obraId)}/canvas/tareas-publicacion`,
        { credentials: 'include', cache: 'no-store' },
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok || !Array.isArray(j.entries)) {
        return;
      }
      const next: Record<string, { tareaId: string; estado: string; publishedAt: string | null }> =
        {};
      for (const row of j.entries as Array<{
        canvasNodeId: string;
        tareaId: string;
        estado: string;
        publishedAt: string | null;
      }>) {
        if (row.canvasNodeId && row.tareaId) {
          next[row.canvasNodeId] = {
            tareaId: row.tareaId,
            estado: row.estado,
            publishedAt: row.publishedAt ?? null,
          };
        }
      }
      setTareaPublicacionByNodeId(next);
    } catch {
      /* noop */
    }
  }, [obraId]);

  useEffect(() => {
    let cancelled = false;
    setCanvasHydrated(false);
    setSelectedId(null);

    (async () => {
      try {
        const res = await fetch(`/api/obras/${encodeURIComponent(obraId)}/canvas`, {
          credentials: 'include',
        });
        const j = await res.json();
        if (cancelled) return;
        if (res.ok && j.success && j.data) {
          const name = j.data.obraNombre ?? j.data.obra?.name ?? 'Obra';
          setObraNombre(name);
          setNodes(Array.isArray(j.data.nodes) ? j.data.nodes : []);
          setEdges(Array.isArray(j.data.edges) ? j.data.edges : []);
          setPathIds(Array.isArray(j.data.pathIds) ? j.data.pathIds : []);
          setBudgetGroups(Array.isArray(j.data.budgetGroups) ? j.data.budgetGroups : []);
          const k = j.data.projectKind ?? j.data.obra?.canvas_project_kind;
          if (typeof k === 'string') setProjectKind(k as CanvasProjectKind);
          const opk = j.data.obraProductKind ?? j.data.obra?.obra_product_kind;
          if (typeof opk === 'string') setObraProductKind(opk);
          else {
            const fromSession = peekSessionObraProductKind(obraId);
            if (fromSession) setObraProductKind(fromSession);
          }
          saveCanvasMultinivel(
            obraId,
            composeCanvasPersisted({
              obraNombre: name,
              nodes: Array.isArray(j.data.nodes) ? j.data.nodes : [],
              pathIds: j.data.pathIds ?? [],
              edges: j.data.edges ?? [],
              budgetGroups: j.data.budgetGroups ?? [],
              projectKind: typeof k === 'string' ? k : 'edificio_multifamiliar',
            }),
          );
        } else {
          const stored = loadCanvasMultinivel(obraId);
          if (stored) {
            setObraNombre(stored.obraNombre);
            setNodes(stored.nodes);
            setEdges(Array.isArray(stored.edges) ? stored.edges : []);
            setPathIds(stored.pathIds);
            setBudgetGroups(Array.isArray(stored.budgetGroups) ? stored.budgetGroups : []);
            setProjectKind(stored.projectKind);
          } else {
            setObraNombre('Obra');
            setNodes([]);
            setEdges([]);
            setPathIds([]);
            setBudgetGroups([]);
            const seeded = peekSessionCanvasProjectKind(obraId);
            setProjectKind(seeded ?? 'edificio_multifamiliar');
          }
        }
      } catch {
        if (cancelled) return;
        const stored = loadCanvasMultinivel(obraId);
        if (stored) {
          setObraNombre(stored.obraNombre);
          setNodes(stored.nodes);
          setEdges(Array.isArray(stored.edges) ? stored.edges : []);
          setPathIds(stored.pathIds);
          setBudgetGroups(Array.isArray(stored.budgetGroups) ? stored.budgetGroups : []);
          setProjectKind(stored.projectKind);
        } else {
          setObraNombre('Obra');
          setNodes([]);
          setEdges([]);
          setPathIds([]);
          setBudgetGroups([]);
          const seeded = peekSessionCanvasProjectKind(obraId);
          setProjectKind(seeded ?? 'edificio_multifamiliar');
        }
      } finally {
        if (!cancelled) setCanvasHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [obraId]);

  const reloadCanvasFromCloud = useCallback(async () => {
    try {
      const res = await fetch(`/api/obras/${encodeURIComponent(obraId)}/canvas`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const j = await res.json();
      if (!res.ok || !j.success || !j.data) return;
      const name = j.data.obraNombre ?? j.data.obra?.name ?? 'Obra';
      setObraNombre(name);
      setNodes(Array.isArray(j.data.nodes) ? j.data.nodes : []);
      setEdges(Array.isArray(j.data.edges) ? j.data.edges : []);
      setPathIds(Array.isArray(j.data.pathIds) ? j.data.pathIds : []);
      setBudgetGroups(Array.isArray(j.data.budgetGroups) ? j.data.budgetGroups : []);
      const k = j.data.projectKind ?? j.data.obra?.canvas_project_kind;
      if (typeof k === 'string') setProjectKind(k as CanvasProjectKind);
      saveCanvasMultinivel(
        obraId,
        composeCanvasPersisted({
          obraNombre: name,
          nodes: Array.isArray(j.data.nodes) ? j.data.nodes : [],
          pathIds: j.data.pathIds ?? [],
          edges: j.data.edges ?? [],
          budgetGroups: j.data.budgetGroups ?? [],
          projectKind: typeof k === 'string' ? k : 'edificio_multifamiliar',
        }),
      );
      await refreshTareaPublicacion();
    } catch {
      /* noop */
    }
  }, [obraId, refreshTareaPublicacion]);

  useEffect(() => {
    if (!canvasHydrated) return;
    void refreshTareaPublicacion();
  }, [canvasHydrated, obraId, refreshTareaPublicacion]);

  useEffect(() => {
    if (!canvasHydrated) return;
    saveCanvasMultinivel(
      obraId,
      composeCanvasPersisted({ obraNombre, nodes, pathIds, edges, budgetGroups, projectKind }),
    );
  }, [canvasHydrated, obraId, obraNombre, nodes, pathIds, edges, budgetGroups, projectKind]);

  const saveCanvasSnapshotToCloud = useCallback(
    async (snapshot?: CanvasMultinivelPersisted) => {
      const payload =
        snapshot ??
        composeCanvasPersisted({ obraNombre, nodes, pathIds, edges, budgetGroups, projectKind });
      setCloudSaveState('saving');
      setCloudSaveMessage(null);
      try {
        const res = await fetch(`/api/obras/${encodeURIComponent(obraId)}/canvas`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            obraNombre: payload.obraNombre,
            projectKind: payload.projectKind,
            pathIds: payload.pathIds,
            nodes: payload.nodes,
            edges: payload.edges,
            budgetGroups: payload.budgetGroups,
          }),
        });
        const j = await res.json();
        if (!res.ok || !j.success) {
          const msg = typeof j.message === 'string' ? j.message : 'No se pudo guardar en la nube';
          setCloudSaveState('err');
          setCloudSaveMessage(msg);
          return { ok: false as const, message: msg };
        }
        const nodeCount =
          typeof j.data?.nodeCount === 'number' ? j.data.nodeCount : payload.nodes.length;
        saveCanvasMultinivel(obraId, payload);

        const { res: pubRes, pub } = await postPublicarTareasWithRetry(obraId);
        await refreshTareaPublicacion();

        if (!pubRes.ok || pub.ok !== true) {
          const pe =
            typeof pub.error === 'string'
              ? pub.error
              : 'No se pudieron publicar o actualizar las tareas operativas.';
          setCloudSaveState('err');
          setCloudSaveMessage(
            `El canvas se guardó en la nube, pero hubo un problema al publicar tareas: ${pe}`,
          );
          return {
            ok: false as const,
            message: pe,
            canvasSaved: true as const,
          };
        }

        const createdTasks = Number(pub.createdTasks) || 0;
        const updatedTasks = Number(pub.updatedTasks) || 0;
        const createdPrecedences = Number(pub.createdPrecedences) || 0;
        const warnings: string[] = Array.isArray(pub.warnings) ? pub.warnings : [];
        const detailLines = [
          `· Nodos guardados: ${nodeCount}`,
          `· Tareas creadas: ${createdTasks}`,
          `· Tareas actualizadas: ${updatedTasks}`,
          `· Precedencias creadas: ${createdPrecedences}`,
        ];
        if (warnings.length > 0) {
          detailLines.push(`· Advertencias: ${warnings.length}`);
        }
        setCloudSaveState('ok');
        setCloudSaveMessage(
          ['Canvas guardado y tareas operativas actualizadas.', ...detailLines].join('\n'),
        );
        return {
          ok: true as const,
          summary: {
            nodeCount,
            createdTasks,
            updatedTasks,
            createdPrecedences,
            warnings,
          },
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Error de red';
        setCloudSaveState('err');
        setCloudSaveMessage(msg);
        return { ok: false as const, message: msg };
      }
    },
    [obraId, obraNombre, nodes, pathIds, edges, budgetGroups, projectKind, refreshTareaPublicacion],
  );

  const containerId = useMemo(
    () => (pathIds.length === 0 ? null : pathIds[pathIds.length - 1]!),
    [pathIds],
  );

  const containerNode = useMemo(
    () => (containerId ? nodes.find((n) => n.id === containerId) ?? null : null),
    [nodes, containerId],
  );

  const flattenSubtreePrecedenceRelaxed = useMemo(() => {
    if (!containerNode) return false;
    if (containerNode.type === 'etapa')
      return etapaPrefersSubtreeTaskCanvas(nodes, containerNode);
    if (containerNode.type === 'planta')
      return plantaPrefersSubtreeTaskCanvas(nodes, containerNode);
    return false;
  }, [containerNode, nodes]);

  const visibleNodes = useMemo(
    () => nodes.filter((n) => n.parentId === containerId && n.type !== 'estado'),
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

  const childTypeToCreate = useMemo(
    () => childTypeForContainer(containerNode, projectKind),
    [containerNode, projectKind],
  );

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

  /** Navegación desde el Project Browser: abre el contenedor (o el padre de una tarea) y opcionalmente selecciona la tarea. */
  const openPathToNode = useCallback(
    (nodeId: string) => {
      const n = nodes.find((x) => x.id === nodeId);
      if (!n) return;
      if (n.type === 'tarea') {
        const chain: string[] = [];
        let cur: CanvasNode | undefined = n.parentId
          ? nodes.find((x) => x.id === n.parentId)
          : undefined;
        while (cur) {
          chain.unshift(cur.id);
          const parentKey: string | null = cur.parentId;
          cur = parentKey ? nodes.find((x) => x.id === parentKey) : undefined;
        }
        setPathIds(chain);
        setSelectedId(n.id);
        return;
      }
      const chain: string[] = [];
      let walk: CanvasNode | undefined = n;
      while (walk) {
        chain.unshift(walk.id);
        const parentKey: string | null = walk.parentId;
        walk = parentKey ? nodes.find((x) => x.id === parentKey) : undefined;
      }
      setPathIds(chain);
      setSelectedId(null);
    },
    [nodes],
  );

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
    const type = childTypeForContainer(containerNode, projectKind);
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
      title: defaultTitleFor(type, projectKind),
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
  }, [containerId, containerNode, visibleNodes.length, projectKind]);

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

  const createChildOf = useCallback(
    (parentId: string) => {
      setNodes((prev) => {
        const parent = prev.find((n) => n.id === parentId);
        const type = childTypeForContainer(parent ?? null, projectKind);
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
          title: defaultTitleFor(type, projectKind),
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
    },
    [projectKind],
  );

  const tryPrecedenceConnection = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target) return false;

      const useFlattenAncestorSubtree =
        flattenSubtreePrecedenceRelaxed &&
        !!containerId &&
        (containerNode?.type === 'etapa' || containerNode?.type === 'planta');

      if (useFlattenAncestorSubtree) {
        if (
          !canAddPrecedenceEdgeInAncestorSubtree(containerId!, nodes, edges, c.source, c.target)
        ) {
          return false;
        }
      } else {
        if (!canAddPrecedenceEdge(containerId, nodes, edges, c.source, c.target)) {
          return false;
        }
      }

      const id = newCanvasEdgeId();
      setEdges((prev) => [
        ...prev,
        { id, sourceId: c.source, targetId: c.target, critical: false },
      ]);
      return true;
    },
    [flattenSubtreePrecedenceRelaxed, containerId, containerNode?.type, nodes, edges],
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

  const createBudgetGroup = useCallback((name: string) => {
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? `bg-${crypto.randomUUID()}`
        : `bg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const trimmed = name.trim() || 'Nuevo grupo';
    setBudgetGroups((prev) => [
      ...prev,
      { id, name: trimmed, createdAt: new Date().toISOString(), status: 'borrador' },
    ]);
    return id;
  }, []);

  const patchBudgetGroup = useCallback((groupId: string, patch: Partial<CanvasBudgetGroup>) => {
    setBudgetGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, ...patch } : g)),
    );
  }, []);

  const deleteBudgetGroup = useCallback((groupId: string) => {
    setBudgetGroups((prev) => prev.filter((g) => g.id !== groupId));
    setNodes((prev) =>
      prev.map((n) =>
        n.type === 'tarea' && n.budgetGroupId === groupId ? { ...n, budgetGroupId: undefined } : n,
      ),
    );
  }, []);

  /** Asigna `budgetGroupId` a todas las tareas del subárbol con raíz `selectedNodeId` y guarda el canvas en la nube. */
  const applyBudgetGroupToNode = useCallback(
    async (
      selectedNodeId: string,
      budgetGroupId: string,
    ): Promise<{
      affected: number;
      saveResult: Awaited<ReturnType<typeof saveCanvasSnapshotToCloud>>;
    }> => {
      const taskIdList = getDescendantTaskIds(selectedNodeId, nodes);
      const idSet = new Set(taskIdList);
      const nextNodes = nodes.map((n) =>
        idSet.has(n.id) && n.type === 'tarea' ? { ...n, budgetGroupId } : n,
      );
      setNodes(nextNodes);

      const snapshot = composeCanvasPersisted({
        obraNombre,
        nodes: nextNodes,
        pathIds,
        edges,
        budgetGroups,
        projectKind,
      });
      const saveResult = await saveCanvasSnapshotToCloud(snapshot);
      return { affected: taskIdList.length, saveResult };
    },
    [nodes, obraNombre, pathIds, edges, budgetGroups, projectKind, saveCanvasSnapshotToCloud],
  );

  const applyTemplateBySlug = useCallback(
    async (slug: string) => {
      try {
        const bundle = await loadCanvasTemplateImportBundle(slug);
        setNodes(bundle.nodes);
        setEdges(bundle.edges);
        setPathIds([]);
        setProjectKind(bundle.projectKind);
        setSelectedId(null);
        const snapshot = composeCanvasPersisted({
          obraNombre,
          nodes: bundle.nodes,
          pathIds: [],
          edges: bundle.edges,
          budgetGroups,
          projectKind: bundle.projectKind,
        });
        return { ok: true as const, snapshot };
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'No se pudo cargar el template (XML)';
        return { ok: false as const, message };
      }
    },
    [obraNombre, budgetGroups],
  );

  const applyImportedCanvas = useCallback(
    (
      bundle: {
        obraNombre: string;
        nodes: CanvasNode[];
        edges: CanvasPrecedenceEdge[];
        projectKind?: CanvasProjectKind;
      },
    ) => {
      setObraNombre(bundle.obraNombre);
      setNodes(bundle.nodes);
      setEdges(bundle.edges);
      setBudgetGroups([]);
      setPathIds([]);
      setSelectedId(null);
      if (bundle.projectKind != null) {
        setProjectKind(bundle.projectKind);
      }
    },
    [],
  );

  return {
    obraNombre,
    setObraNombre,
    projectKind,
    obraProductKind,
    canvasHydrated,
    saveCanvasSnapshotToCloud,
    cloudSaveState,
    cloudSaveMessage,
    tareaPublicacionByNodeId,
    refreshTareaPublicacion,
    reloadCanvasFromCloud,
    nodes,
    edges,
    pathIds,
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
    openPathToNode,
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
    applyImportedCanvas,
    applyTemplateBySlug,
    budgetGroups,
    createBudgetGroup,
    patchBudgetGroup,
    deleteBudgetGroup,
    applyBudgetGroupToNode,
  };
}

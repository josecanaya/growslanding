'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Loader2, Plus, Save, Sparkles } from 'lucide-react';

import type {
  CanvasMultinivelPersisted,
  CanvasNode,
  TransformKind,
} from '@/lib/types/canvasMultinivel';
import { isCanvasEstadoNode, isCanvasTransformacionNode } from '@/lib/types/canvasMultinivel';
import { composeCanvasPersisted } from '@/lib/canvas/canvasMultinivelStorage';
import { buildProyectoVivoFlow } from '@/lib/proyecto-vivo/proyectoVivoFlow';
import { computeProyectoVivoCpm } from '@/lib/proyecto-vivo/computeProyectoVivoCpm';
import { newCanvasNodeId } from '@/lib/proyecto-vivo/ids';
import { proxies_v0 } from '@/lib/proyecto-vivo/tProxies';
import { Button } from '@/components/ui/grows';
import { EstadoVivoNode } from './EstadoVivoNode';
import { TransformacionVivoNode } from './TransformacionVivoNode';

const nodeTypes = {
  estadoVivo: EstadoVivoNode,
  transformacionVivo: TransformacionVivoNode,
};

type GrafoApi = {
  crecimiento: { estadosAlcanzados: number; tSuma: number | null };
  frontera: { transformacionId: string; motivo: string }[];
  objetivo_texto: string | null;
};

type Props = {
  obraId: string;
  obraNombre: string;
};

function ProyectoVivoCanvasInner({ obraId, obraNombre }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<CanvasMultinivelPersisted | null>(null);
  const [grafoMeta, setGrafoMeta] = useState<GrafoApi | null>(null);
  const [grafoTransformaciones, setGrafoTransformaciones] = useState<
    Record<
      string,
      {
        tarea_id: string | null;
        tarea_estado: string | null;
        orquestador_estado: 'pendiente' | 'aceptada' | null;
      }
    >
  >({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [newVerb, setNewVerb] = useState('');
  const [newEstadoB, setNewEstadoB] = useState('');
  const [newKind, setNewKind] = useState<TransformKind>('conocimiento');
  const [newDuracion, setNewDuracion] = useState('');
  const [fromEstadoId, setFromEstadoId] = useState('');
  const [lente, setLente] = useState<'crecimiento' | 'tiempo'>('crecimiento');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [canvasRes, grafoRes] = await Promise.all([
        fetch(`/api/obras/${encodeURIComponent(obraId)}/canvas`, { cache: 'no-store' }),
        fetch(`/api/obras/${encodeURIComponent(obraId)}/grafo`, { cache: 'no-store' }),
      ]);
      const canvasJson = await canvasRes.json().catch(() => ({}));
      const grafoJson = await grafoRes.json().catch(() => ({}));
      if (!canvasRes.ok) {
        throw new Error(canvasJson.message ?? 'No se pudo cargar el canvas');
      }
      const data = canvasJson.data as CanvasMultinivelPersisted & { obraNombre?: string };
      setSnapshot({
        v: data.v,
        obraNombre: data.obraNombre ?? obraNombre,
        nodes: data.nodes ?? [],
        pathIds: data.pathIds ?? [],
        edges: data.edges ?? [],
        budgetGroups: data.budgetGroups ?? [],
        projectKind: data.projectKind ?? 'otro',
      });
      if (grafoRes.ok && grafoJson.data) {
        setGrafoMeta({
          crecimiento: grafoJson.data.crecimiento,
          frontera: grafoJson.data.frontera ?? [],
          objetivo_texto: grafoJson.data.objetivo_texto ?? null,
        });
        const byId: Record<
          string,
          {
            tarea_id: string | null;
            tarea_estado: string | null;
            orquestador_estado: 'pendiente' | 'aceptada' | null;
          }
        > = {};
        for (const t of grafoJson.data.transformaciones ?? []) {
          byId[t.id] = {
            tarea_id: t.tarea_id,
            tarea_estado: t.tarea_estado,
            orquestador_estado: t.orquestador_estado ?? null,
          };
        }
        setGrafoTransformaciones(byId);
      }
      const firstAlcanzado = (data.nodes ?? []).find(
        (n: CanvasNode) => isCanvasEstadoNode(n) && n.graphStatus === 'alcanzado',
      );
      if (firstAlcanzado) setFromEstadoId(firstAlcanzado.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  }, [obraId, obraNombre]);

  useEffect(() => {
    void load();
  }, [load]);

  const fronteraIds = useMemo(
    () => new Set((grafoMeta?.frontera ?? []).map((f) => f.transformacionId)),
    [grafoMeta],
  );

  const cpmBundle = useMemo(
    () => (snapshot ? computeProyectoVivoCpm(snapshot) : null),
    [snapshot],
  );

  const flow = useMemo(
    () =>
      snapshot
        ? buildProyectoVivoFlow(snapshot, {
            lente,
            fronteraIds,
            cpmById: cpmBundle?.byId,
          })
        : { nodes: [], edges: [] },
    [snapshot, lente, fronteraIds, cpmBundle],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flow.edges);

  useEffect(() => {
    setNodes(flow.nodes);
    setEdges(flow.edges);
  }, [flow.nodes, flow.edges, setNodes, setEdges]);

  const saveSnapshot = async (next: CanvasMultinivelPersisted) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/obras/${encodeURIComponent(obraId)}/canvas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message ?? 'Error al guardar');
      setSnapshot(next);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const estadosAlcanzados = useMemo(
    () =>
      (snapshot?.nodes ?? []).filter(
        (n) => isCanvasEstadoNode(n) && n.graphStatus === 'alcanzado',
      ),
    [snapshot],
  );

  const selectedNode = snapshot?.nodes.find((n) => n.id === selectedId);
  const selectedPuente = selectedId ? grafoTransformaciones[selectedId] : undefined;

  const activarEjecucion = async () => {
    if (!selectedNode || !isCanvasTransformacionNode(selectedNode)) return;
    if (selectedNode.transformKind !== 'ejecucion') return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/obras/${encodeURIComponent(obraId)}/canvas/activar-ejecucion`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ canvasNodeId: selectedNode.id }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? 'No se pudo activar ejecución');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al activar');
    } finally {
      setSaving(false);
    }
  };

  const addTransformacion = () => {
    if (!snapshot || !fromEstadoId || !newVerb.trim() || !newEstadoB.trim()) return;
    const now = new Date().toISOString();
    const trId = newCanvasNodeId();
    const bId = newCanvasNodeId();
    const nodes: CanvasNode[] = [
      ...snapshot.nodes,
      {
        id: trId,
        parentId: null,
        level: 1,
        type: 'tarea',
        title: newVerb.trim(),
        position: { x: 0, y: 0 },
        createdAt: now,
        transformKind: newKind,
        fromNodeId: fromEstadoId,
        toNodeId: bId,
        graphStatus: 'propuesta',
        executorKind: 'sin_asignar',
        duracionDias: newDuracion.trim() ? Number(newDuracion) : undefined,
      },
      {
        id: bId,
        parentId: null,
        level: 1,
        type: 'estado',
        title: newEstadoB.trim(),
        position: { x: 0, y: 0 },
        createdAt: now,
        graphStatus: 'fantasma',
      },
    ];
    const next = composeCanvasPersisted({ ...snapshot, nodes });
    void saveSnapshot(next);
    setNewVerb('');
    setNewEstadoB('');
    setNewDuracion('');
  };

  const markRealizada = () => {
    if (!snapshot || !selectedNode || !isCanvasTransformacionNode(selectedNode)) return;
    if (selectedNode.transformKind === 'ejecucion') return;
    if (selectedNode.orquestador?.estado === 'pendiente') return;
    const toId = selectedNode.toNodeId;
    const nodes = snapshot.nodes.map((n) => {
      if (n.id === selectedNode.id) return { ...n, graphStatus: 'realizada' as const };
      if (toId && n.id === toId && isCanvasEstadoNode(n)) {
        return { ...n, graphStatus: 'alcanzado' as const };
      }
      return n;
    });
    void saveSnapshot(composeCanvasPersisted({ ...snapshot, nodes }));
  };

  const suggestProxies = () => {
    if (!snapshot || !selectedNode || !isCanvasTransformacionNode(selectedNode)) return;
    const p = proxies_v0(selectedNode, snapshot);
    const nodes = snapshot.nodes.map((n) =>
      n.id === selectedNode.id
        ? { ...n, tComponents: p, tFormulaId: 'proxies_v0' }
        : n,
    );
    void saveSnapshot(composeCanvasPersisted({ ...snapshot, nodes }));
  };

  const proponerDesdeObjetivo = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/obras/${encodeURIComponent(obraId)}/grafo/propuestas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objetivo_texto: grafoMeta?.objetivo_texto ?? undefined,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message ?? 'No se pudieron crear propuestas');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al proponer');
    } finally {
      setSaving(false);
    }
  };

  const aceptarPropuesta = async (transformacionId: string) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/obras/${encodeURIComponent(obraId)}/grafo/propuestas/${encodeURIComponent(transformacionId)}/aceptar`,
        { method: 'POST' },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message ?? 'No se pudo aceptar');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al aceptar');
    } finally {
      setSaving(false);
    }
  };

  const onNodeClick = (_: unknown, n: { id: string }) => {
    if (!snapshot) {
      setSelectedId(n.id);
      return;
    }
    const canvasNode = snapshot.nodes.find((x) => x.id === n.id);
    if (canvasNode && isCanvasEstadoNode(canvasNode) && canvasNode.graphStatus === 'fantasma') {
      const producer = snapshot.nodes.find(
        (x) => isCanvasTransformacionNode(x) && x.toNodeId === canvasNode.id,
      );
      setSelectedId(producer?.id ?? n.id);
      return;
    }
    setSelectedId(n.id);
  };

  const selectedCpm = selectedId ? cpmBundle?.byId.get(selectedId) : undefined;
  const fronteraItems = grafoMeta?.frontera ?? [];
  const propuestaPendiente =
    selectedNode && isCanvasTransformacionNode(selectedNode)
      ? selectedNode.orquestador?.estado === 'pendiente' ||
        selectedPuente?.orquestador_estado === 'pendiente'
      : false;
  const pendientesAgente = (snapshot?.nodes ?? []).filter(
    (n) => isCanvasTransformacionNode(n) && n.orquestador?.estado === 'pendiente',
  );

  if (loading) {
    return (
      <div className="flex h-[480px] items-center justify-center gap-2 text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin" />
        Cargando grafo…
      </div>
    );
  }

  return (
    <div className="flex min-h-[560px] flex-col gap-4 lg:flex-row">
      <div className="flex h-[520px] flex-1 flex-col rounded-xl border border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Lente</p>
          <Button
            variant={lente === 'crecimiento' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setLente('crecimiento')}
          >
            Crecimiento
          </Button>
          <Button
            variant={lente === 'tiempo' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setLente('tiempo')}
          >
            Tiempo (CPM)
          </Button>
          {lente === 'tiempo' && cpmBundle && (
            <p className="ml-auto text-xs text-slate-600">
              Duración {cpmBundle.resultado.project_duration}d · críticas{' '}
              {cpmBundle.resultado.critical_count}
            </p>
          )}
        </div>
        <div className="min-h-0 flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            onNodeClick={onNodeClick}
          >
            <Background gap={16} />
            <Controls />
          </ReactFlow>
        </div>
      </div>

      <aside className="w-full shrink-0 space-y-4 rounded-xl border border-slate-200 bg-white p-4 lg:w-80">
        <div className="rounded-lg border border-sky-100 bg-sky-50 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-sky-800">Cómo se usa</p>
          <p className="mt-1 text-xs leading-relaxed text-sky-950">
            Esto es el horizonte, no el teclado. Pedí estados, transformaciones o features en el chat de Cursor. El MCP apunta a la carpeta de conocimiento. Acá solo se mira y se acepta.
          </p>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Crecimiento</p>
          <p className="text-sm text-slate-800">
            Estados alcanzados: {grafoMeta?.crecimiento.estadosAlcanzados ?? '—'}
          </p>
          <p className="text-sm text-slate-800">
            Σ T (realizadas):{' '}
            {grafoMeta?.crecimiento.tSuma != null
              ? grafoMeta.crecimiento.tSuma
              : 'T no asignada'}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">Índice experimental — no es dinero ni horas.</p>
        </div>

        <div className="space-y-1 border-t border-slate-100 pt-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Frontera</p>
          {fronteraItems.length === 0 ? (
            <p className="text-xs text-slate-500">Nada posible ahora. Marcá una transformación o agregá una desde un estado alcanzado.</p>
          ) : (
            fronteraItems.map((f) => {
              const node = snapshot?.nodes.find((n) => n.id === f.transformacionId);
              return (
                <button
                  key={f.transformacionId}
                  type="button"
                  className={`block w-full rounded-lg border px-2 py-1.5 text-left text-xs ${
                    selectedId === f.transformacionId
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                  onClick={() => setSelectedId(f.transformacionId)}
                >
                  <span className="font-semibold text-slate-800">{node?.title ?? f.transformacionId}</span>
                  <span className="mt-0.5 block text-[11px] text-slate-500">{f.motivo}</span>
                </button>
              );
            })
          )}
        </div>

        <div className="space-y-2 border-t border-slate-100 pt-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Atajo local (opcional)</p>
          <p className="text-[11px] text-slate-500">
            Objetivo: {grafoMeta?.objetivo_texto?.trim() || 'sin objetivo_texto'}
          </p>
          <Button
            variant="secondary"
            size="sm"
            icon={<Sparkles className="h-4 w-4" />}
            onClick={() => void proponerDesdeObjetivo()}
            disabled={saving}
          >
            Proponer desde objetivo
          </Button>
          {pendientesAgente.length > 0 && (
            <ul className="space-y-1">
              {pendientesAgente.map((n) => (
                <li key={n.id} className="flex items-center justify-between gap-2 text-xs">
                  <button
                    type="button"
                    className="text-left font-medium text-violet-800 hover:underline"
                    onClick={() => setSelectedId(n.id)}
                  >
                    {n.title}
                  </button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => void aceptarPropuesta(n.id)}
                    disabled={saving}
                  >
                    Aceptar
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-800">{error}</p>}

        <div className="space-y-2 border-t border-slate-100 pt-3">
          <p className="text-sm font-semibold text-slate-900">Nueva transformación</p>
          <label className="block text-xs text-slate-600">
            Desde estado
            <select
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
              value={fromEstadoId}
              onChange={(e) => setFromEstadoId(e.target.value)}
            >
              {estadosAlcanzados.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </label>
          <input
            className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
            placeholder="Verbo (ej. Diseñar)"
            value={newVerb}
            onChange={(e) => setNewVerb(e.target.value)}
          />
          <input
            className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
            placeholder="Estado destino (ej. Anteproyecto)"
            value={newEstadoB}
            onChange={(e) => setNewEstadoB(e.target.value)}
          />
          <select
            className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
            value={newKind}
            onChange={(e) => setNewKind(e.target.value as TransformKind)}
          >
            <option value="conocimiento">conocimiento</option>
            <option value="coordinacion">coordinacion</option>
            <option value="ejecucion">ejecucion</option>
          </select>
          <input
            className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
            placeholder="Duración (días, lente Tiempo)"
            inputMode="numeric"
            value={newDuracion}
            onChange={(e) => setNewDuracion(e.target.value)}
          />
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={addTransformacion}
            disabled={saving}
          >
            Agregar
          </Button>
        </div>

        {selectedNode && isCanvasTransformacionNode(selectedNode) && (
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <p className="text-sm font-semibold">{selectedNode.title}</p>
            {selectedCpm && lente === 'tiempo' && (
              <p className="text-xs text-slate-600">
                CPM: ES {selectedCpm.es} / EF {selectedCpm.ef} / holgura {selectedCpm.float}
                {selectedCpm.isCritical ? ' · crítica' : ''}
              </p>
            )}
            {selectedNode.tComponents && (
              <p className="text-xs text-slate-600">
                T proxies: γ {selectedNode.tComponents.gamma ?? '—'} · criticidad{' '}
                {selectedNode.tComponents.criticidad ?? '—'} · σ {selectedNode.tComponents.sigma ?? '—'}
              </p>
            )}
            {propuestaPendiente && (
              <p className="text-xs text-violet-700">Sugerida por el agente — aceptala para operar.</p>
            )}
            {selectedNode.transformKind === 'ejecucion' ? (
              <>
                {selectedPuente?.tarea_id ? (
                  <p className="text-xs text-slate-600">
                    Tarea operativa: {selectedPuente.tarea_id.slice(0, 8)}… (
                    {selectedPuente.tarea_estado ?? 'pendiente'})
                  </p>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => void activarEjecucion()}
                    disabled={saving || Boolean(propuestaPendiente)}
                  >
                    Activar ejecución en obra
                  </Button>
                )}
              </>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={markRealizada}
                disabled={saving || Boolean(propuestaPendiente)}
              >
                Marcar realizada
              </Button>
            )}
            <label className="block text-xs text-slate-600">
              Duración (días)
              <input
                className="mt-1 w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                inputMode="numeric"
                defaultValue={selectedNode.duracionDias ?? ''}
                key={`${selectedNode.id}-dur`}
                onBlur={(e) => {
                  if (!snapshot) return;
                  const days = Number(e.target.value);
                  if (!Number.isFinite(days)) return;
                  const nextNodes = snapshot.nodes.map((n) =>
                    n.id === selectedNode.id ? { ...n, duracionDias: days } : n,
                  );
                  void saveSnapshot(composeCanvasPersisted({ ...snapshot, nodes: nextNodes }));
                }}
              />
            </label>
            <Button variant="secondary" size="sm" onClick={suggestProxies} disabled={saving}>
              Sugerir proxies T
            </Button>
          </div>
        )}

        <Button
          variant="secondary"
          size="sm"
          icon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          onClick={() => snapshot && void saveSnapshot(snapshot)}
          disabled={saving || !snapshot}
        >
          Guardar
        </Button>
      </aside>
    </div>
  );
}

export function ProyectoVivoCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <ProyectoVivoCanvasInner {...props} />
    </ReactFlowProvider>
  );
}

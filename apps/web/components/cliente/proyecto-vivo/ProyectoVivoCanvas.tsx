'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { Loader2, Send } from 'lucide-react';

import type { CanvasMultinivelPersisted, CanvasNode } from '@/lib/types/canvasMultinivel';
import { isCanvasEstadoNode, isCanvasTransformacionNode } from '@/lib/types/canvasMultinivel';
import { buildProyectoVivoFlow } from '@/lib/proyecto-vivo/proyectoVivoFlow';
import { computeProyectoVivoCpm } from '@/lib/proyecto-vivo/computeProyectoVivoCpm';
import { parseHiloCanvasUi, type HiloLinea } from '@/lib/proyecto-vivo/hiloCanvasUi';
import { EstadoVivoNode } from './EstadoVivoNode';
import { TransformacionVivoNode } from './TransformacionVivoNode';

const nodeTypes = {
  estadoVivo: EstadoVivoNode,
  transformacionVivo: TransformacionVivoNode,
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
  const [vista, setVista] = useState<'conversacion' | 'tiempo'>('conversacion');
  const [draft, setDraft] = useState('');
  const [hilo, setHilo] = useState<HiloLinea[]>([]);
  const scroller = useRef<HTMLDivElement>(null);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError(null);
    try {
      const canvasRes = await fetch(`/api/obras/${encodeURIComponent(obraId)}/canvas`, {
        cache: 'no-store',
      });
      const canvasJson = await canvasRes.json().catch(() => ({}));
      if (!canvasRes.ok) {
        throw new Error(canvasJson.message ?? 'No se pudo cargar el horizonte');
      }
      const data = canvasJson.data as CanvasMultinivelPersisted & {
        obraNombre?: string;
        obra?: { canvas_ui?: unknown };
      };
      setSnapshot({
        v: data.v,
        obraNombre: data.obraNombre ?? obraNombre,
        nodes: data.nodes ?? [],
        pathIds: data.pathIds ?? [],
        edges: data.edges ?? [],
        budgetGroups: data.budgetGroups ?? [],
        projectKind: data.projectKind ?? 'otro',
      });
      setHilo(parseHiloCanvasUi(data.obra?.canvas_ui));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar');
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [obraId, obraNombre]);

  useEffect(() => {
    void load();
  }, [load]);

  const cpmBundle = useMemo(
    () => (snapshot && vista === 'tiempo' ? computeProyectoVivoCpm(snapshot) : null),
    [snapshot, vista],
  );

  const flow = useMemo(
    () =>
      snapshot && vista === 'tiempo'
        ? buildProyectoVivoFlow(snapshot, {
            lente: 'tiempo',
            cpmById: cpmBundle?.byId,
          })
        : { nodes: [], edges: [] },
    [snapshot, vista, cpmBundle],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flow.edges);

  useEffect(() => {
    setNodes(flow.nodes);
    setEdges(flow.edges);
  }, [flow.nodes, flow.edges, setNodes, setEdges]);

  const pendientes = useMemo(() => {
    if (!snapshot) return [];
    return snapshot.nodes.filter(
      (n) => isCanvasTransformacionNode(n) && n.orquestador?.estado === 'pendiente',
    );
  }, [snapshot]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [hilo.length]);

  const cadena = useMemo(() => {
    if (!snapshot) return [];
    const idea =
      snapshot.nodes.find((n) => isCanvasEstadoNode(n) && n.title.toLowerCase() === 'idea') ??
      snapshot.nodes.find((n) => isCanvasEstadoNode(n) && n.graphStatus === 'alcanzado');
    if (!idea) return [];
    const out: CanvasNode[] = [idea];
    const seen = new Set([idea.id]);
    let from = idea.id;
    for (let i = 0; i < 40; i++) {
      const nextT = snapshot.nodes.find(
        (n) => isCanvasTransformacionNode(n) && n.fromNodeId === from && !seen.has(n.id),
      );
      if (!nextT) break;
      out.push(nextT);
      seen.add(nextT.id);
      if (nextT.toNodeId) {
        const b = snapshot.nodes.find((n) => n.id === nextT.toNodeId);
        if (b && !seen.has(b.id)) {
          out.push(b);
          seen.add(b.id);
          from = b.id;
          continue;
        }
      }
      break;
    }
    return out;
  }, [snapshot]);

  const hablar = async () => {
    const mensaje = draft.trim();
    if (!mensaje || saving) return;
    setDraft('');
    setSaving(true);
    setError(null);
    setHilo((prev) => [
      ...prev,
      {
        id: `opt-u-${Date.now()}`,
        role: 'user',
        text: mensaje,
        at: new Date().toISOString(),
      },
    ]);
    try {
      const res = await fetch(`/api/obras/${encodeURIComponent(obraId)}/grafo/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message ?? 'No se pudo seguir');
      await load(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al hablar');
    } finally {
      setSaving(false);
    }
  };

  const aceptar = async (transformacionId: string) => {
    setSaving(true);
    setError(null);
    try {
      await fetch(
        `/api/obras/${encodeURIComponent(obraId)}/grafo/propuestas/${encodeURIComponent(transformacionId)}/aceptar`,
        { method: 'POST' },
      );
      await load(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al aceptar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[480px] items-center justify-center gap-2 text-stone-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Cargando…
      </div>
    );
  }

  return (
    <div className="flex min-h-[560px] flex-col gap-5">
      <div className="flex gap-6 border-b border-stone-200 text-sm">
        <button
          type="button"
          className={`pb-2 ${
            vista === 'conversacion'
              ? 'border-b-2 border-stone-900 font-medium text-stone-900'
              : 'text-stone-500'
          }`}
          onClick={() => setVista('conversacion')}
        >
          Conversación
        </button>
        <button
          type="button"
          className={`pb-2 ${
            vista === 'tiempo'
              ? 'border-b-2 border-stone-900 font-medium text-stone-900'
              : 'text-stone-500'
          }`}
          onClick={() => setVista('tiempo')}
        >
          Tiempo
        </button>
        {vista === 'tiempo' && cpmBundle && (
          <p className="ml-auto pb-2 text-xs text-stone-400">
            {cpmBundle.resultado.project_duration}d · {cpmBundle.resultado.critical_count} críticas
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-800">{error}</p>}

      {vista === 'tiempo' ? (
        <div className="h-[560px] overflow-hidden rounded-md border border-stone-200 bg-stone-50">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background gap={16} />
            <Controls />
          </ReactFlow>
        </div>
      ) : (
        <div className="flex min-h-[560px] flex-col gap-8 lg:flex-row">
          <div className="flex min-h-[480px] flex-1 flex-col">
            <div ref={scroller} className="min-h-0 flex-1 space-y-8 overflow-y-auto pr-1">
              {hilo.length === 0 && (
                <p className="max-w-xl text-[15px] leading-7 text-stone-600">
                  Preguntá por el lote, el programa o cómo empezar. No se crea nada en el
                  horizonte hasta que escribas un paso con flecha, por ejemplo{' '}
                  <span className="whitespace-nowrap font-medium text-stone-800">
                    Elegir lote → Lote entre medianeras
                  </span>
                  .
                </p>
              )}
              {hilo.map((m) => (
                <div key={m.id} className="max-w-xl">
                  <p className="mb-1 text-[11px] tracking-wide text-stone-400">
                    {m.role === 'user' ? 'Vos' : 'Oficio'}
                  </p>
                  <p
                    className={`whitespace-pre-wrap text-[15px] leading-7 ${
                      m.role === 'user' ? 'text-stone-900' : 'text-stone-700'
                    }`}
                  >
                    {m.text}
                  </p>
                </div>
              ))}
              {saving && <p className="text-sm text-stone-400">Leyendo el corpus…</p>}
            </div>
            <form
              className="mt-4 flex items-end gap-3 border-t border-stone-200 pt-4"
              onSubmit={(e) => {
                e.preventDefault();
                void hablar();
              }}
            >
              <textarea
                className="min-h-[72px] min-w-0 flex-1 resize-none bg-transparent text-[15px] leading-6 text-stone-900 outline-none placeholder:text-stone-400"
                placeholder="Preguntá, o anotá verbo → estado"
                value={draft}
                rows={3}
                onChange={(e) => setDraft(e.target.value)}
                disabled={saving}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void hablar();
                  }
                }}
              />
              <button
                type="submit"
                disabled={saving || !draft.trim()}
                className="mb-1 inline-flex items-center gap-2 text-sm font-medium text-stone-900 disabled:text-stone-400"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Enviar
              </button>
            </form>
          </div>

          <aside className="w-full shrink-0 space-y-6 lg:w-64 lg:border-l lg:border-stone-200 lg:pl-6">
            {pendientes.length > 0 && (
              <div>
                <p className="mb-3 text-[11px] tracking-wide text-stone-400">Por aceptar</p>
                <ul className="space-y-4">
                  {pendientes.map((n) => {
                    const dest = snapshot?.nodes.find((x) => x.id === n.toNodeId);
                    return (
                      <li key={n.id}>
                        <p className="text-sm text-stone-800">
                          {n.title}
                          {dest ? ` → ${dest.title}` : ''}
                        </p>
                        <button
                          type="button"
                          className="mt-1 text-sm text-stone-600 underline-offset-2 hover:underline"
                          onClick={() => void aceptar(n.id)}
                          disabled={saving}
                        >
                          Aceptar
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <div>
              <p className="mb-3 text-[11px] tracking-wide text-stone-400">Cadena</p>
              <ol className="space-y-3">
                {cadena.map((n) => (
                  <li key={n.id} className="text-sm leading-5 text-stone-700">
                    {n.title}
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>
      )}
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

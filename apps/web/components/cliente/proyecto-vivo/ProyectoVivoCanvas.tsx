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
import { Button } from '@/components/ui/grows';
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

type ChatLine = { id: string; role: 'user' | 'horizonte'; text: string };

function ProyectoVivoCanvasInner({ obraId, obraNombre }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<CanvasMultinivelPersisted | null>(null);
  const [vista, setVista] = useState<'conversacion' | 'tiempo'>('conversacion');
  const [draft, setDraft] = useState('');
  const [optimistic, setOptimistic] = useState<ChatLine[]>([]);
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
      setOptimistic([]);
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

  const hilo = useMemo(() => {
    const lines: ChatLine[] = [];
    if (!snapshot) return lines;
    const transforms = snapshot.nodes
      .filter(isCanvasTransformacionNode)
      .slice()
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    for (const t of transforms) {
      const dest = snapshot.nodes.find((n) => n.id === t.toNodeId);
      const userText = t.orquestador?.chatUser?.trim() || t.title;
      lines.push({ id: `u-${t.id}`, role: 'user', text: userText });
      const estado = t.orquestador?.estado === 'pendiente' ? 'propuesta' : t.graphStatus;
      lines.push({
        id: `h-${t.id}`,
        role: 'horizonte',
        text: `${t.title} → ${dest?.title ?? '…'} (${estado})`,
      });
    }
    return [...lines, ...optimistic];
  }, [snapshot, optimistic]);

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
    setOptimistic((prev) => [
      ...prev,
      { id: `opt-u-${Date.now()}`, role: 'user', text: mensaje },
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
      const res = await fetch(
        `/api/obras/${encodeURIComponent(obraId)}/grafo/propuestas/${encodeURIComponent(transformacionId)}/aceptar`,
        { method: 'POST' },
      );
      const json = await res.json().catch(() => ({}));
      await load(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al aceptar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[480px] items-center justify-center gap-2 text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin" />
        Cargando horizonte…
      </div>
    );
  }

  return (
    <div className="flex min-h-[560px] flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button
          variant={vista === 'conversacion' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setVista('conversacion')}
        >
          Conversación
        </Button>
        <Button
          variant={vista === 'tiempo' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setVista('tiempo')}
        >
          Tiempo (CPM)
        </Button>
        {vista === 'tiempo' && cpmBundle && (
          <p className="ml-auto text-xs text-slate-500">
            Duración {cpmBundle.resultado.project_duration}d · críticas{' '}
            {cpmBundle.resultado.critical_count}
          </p>
        )}
      </div>

      {error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-800">{error}</p>}

      {vista === 'tiempo' ? (
        <div className="h-[560px] rounded-xl border border-slate-200 bg-slate-50">
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
        <div className="flex min-h-[560px] flex-col gap-4 lg:flex-row">
          <div className="flex min-h-[480px] flex-1 flex-col rounded-xl border border-slate-200 bg-white">
            <div ref={scroller} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
              {hilo.length === 0 && (
                <p className="text-sm leading-relaxed text-slate-600">
                  Escribí lo que querés que exista después. Cada mensaje es una transformación
                  propuesta. Podés usar «verbo → estado» si querés ser preciso. No hay wizard.
                </p>
              )}
              {hilo.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === 'user'
                      ? 'ml-auto bg-[#001629] text-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  {m.text}
                </div>
              ))}
            </div>
            <form
              className="flex gap-2 border-t border-slate-100 p-3"
              onSubmit={(e) => {
                e.preventDefault();
                void hablar();
              }}
            >
              <input
                className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                placeholder="Seguí el proyecto…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={saving}
              />
              <Button
                variant="primary"
                size="sm"
                type="submit"
                icon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                disabled={saving || !draft.trim()}
              >
                Enviar
              </Button>
            </form>
          </div>

          <aside className="w-full shrink-0 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 lg:w-72">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Cadena</p>
            <ol className="space-y-2">
              {cadena.map((n) => {
                const t = isCanvasTransformacionNode(n);
                const pendiente = t && n.orquestador?.estado === 'pendiente';
                return (
                  <li
                    key={n.id}
                    className={`rounded-lg border px-2 py-1.5 text-xs ${
                      t ? 'border-violet-200 bg-white' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <p className="font-semibold text-slate-800">{n.title}</p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-400">
                      {t ? n.transformKind ?? 'T' : n.graphStatus ?? 'estado'}
                    </p>
                    {pendiente && (
                      <Button
                        className="mt-1"
                        variant="primary"
                        size="sm"
                        onClick={() => void aceptar(n.id)}
                        disabled={saving}
                      >
                        Aceptar
                      </Button>
                    )}
                  </li>
                );
              })}
            </ol>
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

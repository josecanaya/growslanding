'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ChevronRight, Loader2, Plus, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { useClienteObras, type ClienteObraListaItem } from '@/lib/hooks/useClienteObras';
import { cn } from '@/lib/utils';
import { hubNodeTypes, type HubNodeData } from './HubFlowNode';
import {
  CANVAS_BLUE_KEY,
  CANVAS_BLUE_PRESETS,
  layoutContenidoEspacio,
  layoutEspaciosProyecto,
  layoutProyectos,
  type CanvasLevel,
  type HubFlowNode,
} from './hubLayout';

function applyBlue(hex: string) {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty('--grows-canvas-blue', hex);
}

function ProyectosCanvasInner() {
  const router = useRouter();
  const { obras, loading, error } = useClienteObras();
  const [level, setLevel] = useState<CanvasLevel>({ kind: 'root' });
  const [blue, setBlue] = useState<string>(CANVAS_BLUE_PRESETS[0].value);
  const [nodes, setNodes, onNodesChange] = useNodesState<HubFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CANVAS_BLUE_KEY);
      if (saved) {
        setBlue(saved);
        applyBlue(saved);
        return;
      }
    } catch {
      /* ignore */
    }
    applyBlue(CANVAS_BLUE_PRESETS[0].value);
  }, []);

  useEffect(() => {
    applyBlue(blue);
    try {
      localStorage.setItem(CANVAS_BLUE_KEY, blue);
    } catch {
      /* ignore */
    }
  }, [blue]);

  useEffect(() => {
    if (level.kind === 'root') {
      const g = layoutProyectos(obras);
      setNodes(g.nodes);
      setEdges(g.edges);
      return;
    }
    if (level.kind === 'proyecto') {
      const g = layoutEspaciosProyecto(level.obra);
      setNodes(g.nodes);
      setEdges(g.edges);
      return;
    }
    const g = layoutContenidoEspacio(level.obra, level.espacioId);
    setNodes(g.nodes);
    setEdges(g.edges);
  }, [level, obras, setNodes, setEdges]);

  const enterProyecto = useCallback((obra: ClienteObraListaItem) => {
    setLevel({ kind: 'proyecto', obra });
  }, []);

  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node<HubNodeData>) => {
      const data = node.data;
      if (data.kind === 'proyecto') {
        const obra = obras.find((o) => o.id === data.obraId);
        if (obra) enterProyecto(obra);
        return;
      }
      if (data.kind === 'espacio') {
        if (data.href && !data.enterable) {
          router.push(data.href as Route);
          return;
        }
        if (level.kind === 'proyecto' && data.enterable) {
          setLevel({
            kind: 'espacio',
            obra: level.obra,
            espacioId: data.espacioId,
            title: data.title,
          });
        }
      }
    },
    [obras, enterProyecto, router, level],
  );

  const crumbs = useMemo(() => {
    const items: { label: string; onClick?: () => void }[] = [
      {
        label: 'Proyectos',
        onClick: () => setLevel({ kind: 'root' }),
      },
    ];
    if (level.kind === 'proyecto' || level.kind === 'espacio') {
      items.push({
        label: level.obra.name || 'Proyecto',
        onClick:
          level.kind === 'espacio'
            ? () => setLevel({ kind: 'proyecto', obra: level.obra })
            : undefined,
      });
    }
    if (level.kind === 'espacio') {
      items.push({ label: level.title });
    }
    return items;
  }, [level]);

  return (
    <div
      className="relative flex h-[100dvh] w-full flex-col overflow-hidden"
      style={{ background: 'var(--grows-canvas-blue, #0C1D36)' }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 20% 0%, rgba(255,255,255,0.12), transparent 50%), radial-gradient(ellipse 60% 40% at 90% 100%, rgba(0,0,0,0.25), transparent 55%)',
        }}
      />

      <header className="relative z-10 flex flex-wrap items-center gap-3 border-b border-white/10 px-4 py-3 text-white">
        <nav className="flex min-w-0 flex-1 items-center gap-1 text-sm">
          {crumbs.map((c, i) => (
            <span key={`${c.label}-${i}`} className="flex items-center gap-1">
              {i > 0 ? <ChevronRight className="h-3.5 w-3.5 text-white/40" /> : null}
              {c.onClick ? (
                <button
                  type="button"
                  onClick={c.onClick}
                  className="truncate rounded px-1.5 py-0.5 font-medium text-white/85 hover:bg-white/10"
                >
                  {c.label}
                </button>
              ) : (
                <span className="truncate px-1.5 font-semibold text-white">{c.label}</span>
              )}
            </span>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden text-[10px] uppercase tracking-[0.14em] text-white/50 sm:inline">
            Azul
          </span>
          <div className="flex items-center gap-1.5 rounded-full bg-black/20 p-1">
            {CANVAS_BLUE_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                title={p.label}
                aria-label={p.label}
                onClick={() => setBlue(p.value)}
                className={cn(
                  'h-6 w-6 rounded-full border-2 transition',
                  blue === p.value ? 'border-white scale-110' : 'border-transparent opacity-80',
                )}
                style={{ background: p.value }}
              />
            ))}
            <label className="relative h-6 w-6 cursor-pointer overflow-hidden rounded-full border border-white/30">
              <input
                type="color"
                value={blue}
                onChange={(e) => setBlue(e.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <span
                className="block h-full w-full"
                style={{
                  background:
                    'conic-gradient(from 90deg, #0C1D36, #4A6FA5, #85f8c4, #E8C547, #0C1D36)',
                }}
              />
            </label>
          </div>

          <Link
            href={'/cliente/proyectos/nuevo' as Route}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--grows-canvas-blue)] shadow-sm hover:bg-white/90"
          >
            <Plus className="h-3.5 w-3.5" />
            Nuevo
          </Link>
        </div>
      </header>

      <p className="relative z-10 flex items-center gap-2 px-4 py-2 text-[12px] text-white/65">
        <Sparkles className="h-3.5 w-3.5" />
        Canvas de proyectos · como Figma, pero nodos de obra. Entrá, abrí Organizar, planos o info.
      </p>

      <div className="relative z-0 min-h-0 flex-1">
        {loading ? (
          <div className="flex h-full items-center justify-center text-white/80">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Cargando proyectos…
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-red-200">
            {error}
          </div>
        ) : nodes.length === 0 && level.kind === 'root' ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center text-white">
            <p className="max-w-sm text-sm text-white/80">
              Todavía no hay proyectos. Creá el primero y aparece como nodo en este canvas.
            </p>
            <Link
              href={'/cliente/proyectos/nuevo' as Route}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[var(--grows-canvas-blue)]"
            >
              Crear proyecto
            </Link>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDoubleClick={onNodeDoubleClick}
            nodeTypes={hubNodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.35}
            maxZoom={1.6}
            proOptions={{ hideAttribution: true }}
            className="proyectos-hub-flow"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={22}
              size={1.2}
              color="rgba(255,255,255,0.14)"
            />
            <Controls
              showInteractive={false}
              className="!overflow-hidden !rounded-xl !border-0 !bg-white/95 !shadow-lg"
            />
            <MiniMap
              className="!overflow-hidden !rounded-xl !border-0 !bg-black/30"
              maskColor="rgba(0,0,0,0.35)"
              nodeColor={() => 'rgba(255,255,255,0.55)'}
            />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}

export function ProyectosCanvasHub() {
  return (
    <ReactFlowProvider>
      <ProyectosCanvasInner />
    </ReactFlowProvider>
  );
}

'use client';

import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { Building2, ChevronRight, FileStack, FolderOpen, Info, LayoutGrid, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ProyectoNodeData = {
  kind: 'proyecto';
  obraId: string;
  title: string;
  subtitle?: string;
  estado?: string | null;
  tareas?: number;
  graphMode?: string | null;
};

export type EspacioNodeData = {
  kind: 'espacio';
  espacioId: string;
  title: string;
  subtitle: string;
  href?: string;
  icon: 'organizar' | 'planos' | 'info' | 'presupuesto' | 'trabajo';
  enterable: boolean;
};

export type ContenidoNodeData = {
  kind: 'contenido';
  title: string;
  body: string;
};

export type HubNodeData = ProyectoNodeData | EspacioNodeData | ContenidoNodeData;

const iconMap = {
  organizar: LayoutGrid,
  planos: FileStack,
  info: Info,
  presupuesto: Wallet,
  trabajo: FolderOpen,
};

function ProyectoCard({ data }: { data: ProyectoNodeData }) {
  return (
    <div
      className={cn(
        'group relative w-[280px] overflow-hidden rounded-2xl border border-white/15',
        'bg-[color-mix(in_srgb,var(--grows-canvas-blue)_88%,white)] text-white shadow-xl',
        'transition duration-300 hover:border-white/35 hover:shadow-2xl',
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(120% 80% at 0% 0%, rgba(255,255,255,0.18), transparent 55%)',
        }}
      />
      <div className="relative flex items-start gap-3 p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold tracking-tight">{data.title}</p>
          {data.subtitle ? (
            <p className="mt-0.5 truncate text-[12px] text-white/70">{data.subtitle}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-white/75">
            {data.estado ? (
              <span className="rounded-full bg-white/10 px-2 py-0.5 capitalize">{data.estado}</span>
            ) : null}
            <span className="rounded-full bg-white/10 px-2 py-0.5">
              {data.tareas ?? 0} tareas
            </span>
          </div>
        </div>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-white/50 transition group-hover:translate-x-0.5 group-hover:text-white" />
      </div>
      <p className="relative border-t border-white/10 px-4 py-2 text-[10px] uppercase tracking-[0.14em] text-white/55">
        Doble clic para entrar
      </p>
      <Handle type="source" position={Position.Right} className="!bg-white/40 !border-0" />
      <Handle type="target" position={Position.Left} className="!bg-white/40 !border-0" />
    </div>
  );
}

function EspacioCard({ data }: { data: EspacioNodeData }) {
  const Icon = iconMap[data.icon];
  return (
    <div
      className={cn(
        'w-[240px] rounded-2xl border border-white/20 bg-white/95 p-4 text-[var(--grows-canvas-blue)] shadow-lg',
        'transition hover:border-[var(--grows-canvas-blue)]/40 hover:shadow-xl',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--grows-canvas-blue)]/10">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold tracking-tight">{data.title}</p>
          <p className="mt-1 text-[12px] leading-snug text-slate-500">{data.subtitle}</p>
        </div>
      </div>
      <p className="mt-3 text-[10px] uppercase tracking-[0.12em] text-slate-400">
        {data.enterable ? 'Doble clic · entrar' : 'Abrir enlace'}
      </p>
      <Handle type="source" position={Position.Bottom} className="!bg-[var(--grows-canvas-blue)]/30 !border-0" />
      <Handle type="target" position={Position.Top} className="!bg-[var(--grows-canvas-blue)]/30 !border-0" />
    </div>
  );
}

function ContenidoCard({ data }: { data: ContenidoNodeData }) {
  return (
    <div className="w-[260px] rounded-2xl border border-dashed border-white/30 bg-white/10 p-4 text-white backdrop-blur-sm">
      <p className="text-[13px] font-semibold">{data.title}</p>
      <p className="mt-2 text-[12px] leading-relaxed text-white/75">{data.body}</p>
      <Handle type="target" position={Position.Top} className="!bg-white/40 !border-0" />
    </div>
  );
}

export function HubFlowNode(props: NodeProps<Node<HubNodeData>>) {
  const data = props.data;
  if (data.kind === 'proyecto') return <ProyectoCard data={data} />;
  if (data.kind === 'espacio') return <EspacioCard data={data} />;
  return <ContenidoCard data={data} />;
}

export const hubNodeTypes = { hubNode: HubFlowNode };

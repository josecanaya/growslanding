'use client';

import {
  ArrowUpRight,
  Building2,
  DoorOpen,
  Layers3,
  Map,
} from 'lucide-react';
import type { CanvasNode } from '@/lib/types/canvasMultinivel';
import type { CanvasProjectKind } from '@/lib/canvas/canvasProjectProfile';
import { nextChildCanvasType } from '@/lib/canvas/canvasProjectProfile';
import { cn } from '@/lib/utils';
import { labelEstadoNivel, labelTipoNodo } from '../canvasMultinivelHelpers';

type Variant = 'planta' | 'sector' | 'ambiente';

const variantMeta: Record<
  Variant,
  {
    hubBadge: string;
    eyebrow: string;
    title: string;
    subtitle: string;
    gridCols: string;
    empty: string;
    childLabel: string;
  }
> = {
  planta: {
    hubBadge: 'Etapa activa',
    eyebrow: 'Mapa de fase',
    title: 'Plantas y sectores generales',
    subtitle: 'Organizá la fase en piezas ejecutables antes de entrar al detalle operativo.',
    gridCols: 'grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3',
    empty: 'Todavía no hay pisos ni sectores generales en esta etapa.',
    childLabel: 'hijos',
  },
  sector: {
    hubBadge: 'Planta activa',
    eyebrow: 'Mapa de planta',
    title: 'Sectores internos / departamentos',
    subtitle: 'Distribuí departamentos, palieres, núcleos o zonas de trabajo de esta planta.',
    gridCols: 'grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3',
    empty: 'Todavía no hay departamentos ni sectores internos en esta planta.',
    childLabel: 'ambientes',
  },
  ambiente: {
    hubBadge: 'Sector activo',
    eyebrow: 'Mapa de sector',
    title: 'Ambientes del área',
    subtitle: 'Entrá a cada ambiente para trabajar el canvas nodal de tareas.',
    gridCols: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
    empty: 'Todavía no hay ambientes en este sector.',
    childLabel: 'tareas',
  },
};

type HubLevelMeta = (typeof variantMeta)[Variant];

function plantaHubMeta(kind: CanvasProjectKind): HubLevelMeta {
  const base = variantMeta.planta;
  if (kind === 'galpon_industrial') {
    return {
      ...base,
      title: 'Sectores generales',
      subtitle:
        'Organizá la fase en sectores amplios (naves, zonas) antes de definir áreas operativas y tareas.',
      empty: 'Todavía no hay sectores generales en esta etapa.',
    };
  }
  return base;
}

function childMetricLabelUnderSectorNode(kind: CanvasProjectKind): string {
  const next = nextChildCanvasType({ type: 'sector' }, kind);
  if (next === 'tarea') return 'tareas';
  if (next === 'ambiente') return 'ambientes';
  return 'hijos';
}

function sectorHubMeta(kind: CanvasProjectKind): HubLevelMeta {
  const base = variantMeta.sector;
  if (kind === 'galpon_industrial') {
    return {
      ...base,
      hubBadge: 'Sector general activo',
      eyebrow: 'Mapa de sector general',
      title: 'Áreas operativas',
      subtitle: 'Definí zonas, equipos o frentes de trabajo antes del canvas de tareas.',
      empty: 'Todavía no hay áreas operativas en este sector general.',
      childLabel: 'tareas',
    };
  }
  return base;
}

function ambienteHubMeta(hubNode: CanvasNode): HubLevelMeta {
  const base = variantMeta.ambiente;
  if (hubNode.type === 'planta') {
    return {
      ...base,
      hubBadge: 'Planta activa',
      eyebrow: 'Mapa de planta',
      title: 'Ambientes',
      subtitle: 'Entrá a cada ambiente para trabajar el canvas nodal de tareas.',
      empty: 'Todavía no hay ambientes en esta planta o sector.',
    };
  }
  return base;
}

function hubMetaForView(
  variant: Variant,
  kind: CanvasProjectKind,
  hubNode: CanvasNode,
): HubLevelMeta {
  if (variant === 'planta') return plantaHubMeta(kind);
  if (variant === 'sector') return sectorHubMeta(kind);
  if (variant === 'ambiente') return ambienteHubMeta(hubNode);
  return variantMeta[variant];
}

function statusStyle(node: CanvasNode) {
  switch (node.estadoNivel ?? 'pendiente') {
    case 'completado':
      return {
        chip: 'bg-[#dff8ec] text-[#075c3d]',
        bar: 'bg-[#24a375]',
        soft: 'bg-[#edfdf5]',
      };
    case 'en_curso':
      return {
        chip: 'bg-[#d7e4f5] text-[#0f3d66]',
        bar: 'bg-[#406182]',
        soft: 'bg-[#f0f6ff]',
      };
    case 'bloqueado':
      return {
        chip: 'bg-[#ffdad6] text-[#93000a]',
        bar: 'bg-[#ba1a1a]',
        soft: 'bg-[#fff1ef]',
      };
    default:
      return {
        chip: 'bg-[#e8edf3] text-[#596574]',
        bar: 'bg-[#bbc8d8]',
        soft: 'bg-[#f3f6fa]',
      };
  }
}

function iconForVariant(variant: Variant) {
  if (variant === 'planta') return Building2;
  if (variant === 'sector') return Layers3;
  return DoorOpen;
}

function progressValue(n: CanvasNode): number {
  return Math.min(100, Math.max(0, Math.round(n.avancePct ?? 0)));
}

type Props = {
  projectKind: CanvasProjectKind;
  variant: Variant;
  hubNode: CanvasNode;
  items: CanvasNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEnter: (id: string) => void;
  childCount: (id: string) => number;
};

export function HubGridNivelView({
  projectKind,
  variant,
  hubNode,
  items,
  selectedId,
  onSelect,
  onEnter,
  childCount,
}: Props) {
  const m = hubMetaForView(variant, projectKind, hubNode);
  const sectorChildMetricLabel =
    variant === 'sector' ? childMetricLabelUnderSectorNode(projectKind) : 'ambientes';
  const HubIcon = iconForVariant(variant);

  return (
    <div className="relative min-h-[min(68vh,760px)] overflow-hidden rounded-[28px] bg-[#f6fafe] p-7 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#dfe3e7_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#cfe5ff]/45 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-[#85f8c4]/18 blur-3xl" />

      <div className="relative z-10">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#24a375]">
              {m.eyebrow}
            </p>
            <h2 className="mt-2 text-4xl font-black tracking-[-0.04em] text-[#001629]">
              {m.title}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#545f6e]">{m.subtitle}</p>
          </div>
          <div className="rounded-2xl bg-white/80 px-4 py-3 text-right shadow-[0_12px_32px_rgba(23,28,31,0.06)] backdrop-blur-md">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7a8492]">
              Elementos
            </p>
            <p className="text-2xl font-black text-[#001629]">{items.length}</p>
          </div>
        </div>

        {variant === 'sector' ? (
          <SectorHubMap
            projectKind={projectKind}
            hubNode={hubNode}
            items={items}
            selectedId={selectedId}
            onSelect={onSelect}
            onEnter={onEnter}
            childCount={childCount}
            childMetricLabel={sectorChildMetricLabel}
          />
        ) : (
          <div className={cn('grid gap-7', variant === 'planta' ? 'xl:grid-cols-[380px_1fr]' : 'xl:grid-cols-[300px_1fr]')}>
            <div className="relative overflow-hidden rounded-[32px] bg-[#001629] p-8 text-white shadow-[0_12px_32px_rgba(23,28,31,0.10)]">
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-[#cfe5ff]/18 blur-2xl" />
              <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-[#cfe5ff] ring-1 ring-white/10">
                <HubIcon className="h-7 w-7" strokeWidth={1.7} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#85f8c4]">
                {m.hubBadge}
              </p>
              <h3 className="mt-3 line-clamp-3 text-3xl font-black tracking-[-0.04em]">
                {hubNode.title}
              </h3>
              <p className="mt-4 line-clamp-5 text-sm leading-6 text-white/70">
                {hubNode.descripcion?.trim() ||
                  'Agregá una descripción en el inspector para orientar la ejecución del equipo.'}
              </p>
              <div className="mt-8 grid grid-cols-2 gap-3">
                <MetricTile label="Estado" value={labelEstadoNivel(hubNode.estadoNivel)} dark />
                <MetricTile label="Avance" value={`${progressValue(hubNode)}%`} dark />
              </div>
              {variant === 'ambiente' ? (
                <p className="mt-6 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white/78">
                  Cada ambiente abre el canvas operativo de tareas con precedencias, checklist y camino crítico.
                </p>
              ) : null}
            </div>

            <ItemsGrid
              projectKind={projectKind}
              variant={variant}
              items={items}
              selectedId={selectedId}
              onSelect={onSelect}
              onEnter={onEnter}
              childCount={childCount}
              empty={m.empty}
              gridCols={m.gridCols}
              childLabel={m.childLabel}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ItemsGrid({
  projectKind,
  variant,
  items,
  selectedId,
  onSelect,
  onEnter,
  childCount,
  empty,
  gridCols,
  childLabel,
}: {
  projectKind: CanvasProjectKind;
  variant: Variant;
  items: CanvasNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEnter: (id: string) => void;
  childCount: (id: string) => number;
  empty: string;
  gridCols: string;
  childLabel: string;
}) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-[28px] bg-white/70 p-8 text-center shadow-[0_12px_32px_rgba(23,28,31,0.06)] backdrop-blur-sm">
        <div>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f4f8] text-[#406182]">
            <Map className="h-7 w-7" strokeWidth={1.6} />
          </div>
          <p className="text-sm font-semibold text-[#545f6e]">{empty}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('grid gap-5', gridCols)}>
      {items.map((n, idx) => (
        <LevelCard
          projectKind={projectKind}
          key={n.id}
          node={n}
          variant={variant}
          selected={selectedId === n.id}
          index={idx}
          childCount={childCount(n.id)}
          childLabel={childLabel}
          onSelect={onSelect}
          onEnter={onEnter}
        />
      ))}
    </div>
  );
}

function SectorHubMap({
  projectKind,
  hubNode,
  items,
  selectedId,
  onSelect,
  onEnter,
  childCount,
  childMetricLabel,
}: {
  projectKind: CanvasProjectKind;
  hubNode: CanvasNode;
  items: CanvasNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEnter: (id: string) => void;
  childCount: (id: string) => number;
  childMetricLabel: string;
}) {
  const m = sectorHubMeta(projectKind);
  const positions = [
    'left-[10%] top-[16%]',
    'right-[8%] top-[18%]',
    'left-[6%] bottom-[16%]',
    'right-[10%] bottom-[14%]',
    'left-1/2 bottom-[4%] -translate-x-1/2',
    'left-1/2 top-[3%] -translate-x-1/2',
  ];
  return (
    <div className="grid gap-7 xl:grid-cols-[minmax(560px,1fr)_340px]">
      <div className="relative min-h-[560px] overflow-hidden rounded-[32px] bg-[#eaeef2]/85 p-8 shadow-[0_12px_32px_rgba(23,28,31,0.06)]">
        <div className="pointer-events-none absolute inset-6 rounded-[28px] border border-white/50" />
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-20" aria-hidden>
          <line x1="50%" x2="18%" y1="50%" y2="24%" stroke="#001629" strokeWidth="2" />
          <line x1="50%" x2="82%" y1="50%" y2="24%" stroke="#001629" strokeWidth="2" />
          <line x1="50%" x2="16%" y1="50%" y2="76%" stroke="#001629" strokeWidth="2" />
          <line x1="50%" x2="84%" y1="50%" y2="76%" stroke="#001629" strokeWidth="2" />
          <line x1="50%" x2="50%" y1="50%" y2="90%" stroke="#001629" strokeWidth="2" />
        </svg>
        <div className="absolute left-1/2 top-1/2 z-20 flex h-56 w-56 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-[#002b49] text-center text-white shadow-2xl shadow-[#001629]/15 ring-[10px] ring-white">
          <Layers3 className="mb-3 h-9 w-9 text-[#cfe5ff]" strokeWidth={1.5} />
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#85f8c4]">
            {m.hubBadge}
          </p>
          <p className="mt-2 line-clamp-2 px-6 text-2xl font-black tracking-[-0.04em]">
            {hubNode.title}
          </p>
          <p className="mt-2 text-[11px] text-white/60">
            {items.length}{' '}
            {labelTipoNodo('sector', projectKind).toLowerCase()}
            {items.length === 1 ? '' : 's'}
          </p>
        </div>
        {items.length === 0 ? (
          <div className="absolute inset-0 flex items-end justify-center p-10">
            <p className="rounded-2xl bg-white/80 px-5 py-4 text-sm font-semibold text-[#545f6e] shadow-[0_12px_32px_rgba(23,28,31,0.06)]">
              {m.empty}
            </p>
          </div>
        ) : (
          items.slice(0, 6).map((n, idx) => (
            <SpatialSectorCard
              key={n.id}
              node={n}
              className={positions[idx] ?? positions[0]}
              selected={selectedId === n.id}
              childCount={childCount(n.id)}
              childMetricLabel={childMetricLabel}
              onSelect={onSelect}
              onEnter={onEnter}
            />
          ))
        )}
      </div>

      <div className="rounded-[32px] bg-white/82 p-5 shadow-[0_12px_32px_rgba(23,28,31,0.06)] backdrop-blur-md">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#24a375]">
          Sectores visibles
        </p>
        <p className="mt-2 text-sm leading-6 text-[#545f6e]">
          Mapa interno de planta. Seleccioná una pieza para editarla o doble click para entrar.
        </p>
        <div className="mt-5 space-y-3">
          {items.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => onSelect(n.id)}
              onDoubleClick={(e) => {
                e.preventDefault();
                onEnter(n.id);
              }}
              className={cn(
                'w-full rounded-2xl bg-[#f0f4f8] px-4 py-3 text-left transition hover:bg-[#e4e9ed]',
                selectedId === n.id ? 'ring-2 ring-[#24a375]' : null,
              )}
            >
              <p className="truncate text-sm font-black text-[#001629]">{n.title}</p>
              <p className="mt-1 text-[11px] font-semibold text-[#596574]">
                {childCount(n.id)} {childMetricLabel} · {progressValue(n)}%
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SpatialSectorCard({
  node,
  className,
  selected,
  childCount,
  childMetricLabel,
  onSelect,
  onEnter,
}: {
  node: CanvasNode;
  className: string;
  selected: boolean;
  childCount: number;
  childMetricLabel: string;
  onSelect: (id: string) => void;
  onEnter: (id: string) => void;
}) {
  const st = statusStyle(node);
  return (
    <button
      type="button"
      onClick={() => onSelect(node.id)}
      onDoubleClick={(e) => {
        e.preventDefault();
        onEnter(node.id);
      }}
      className={cn(
        'absolute z-30 flex h-36 w-40 flex-col items-center justify-center rounded-[24px] bg-white p-4 text-center shadow-[0_12px_32px_rgba(23,28,31,0.09)] transition hover:-translate-y-0.5',
        selected ? 'ring-2 ring-[#24a375] ring-offset-4 ring-offset-[#eaeef2]' : 'ring-1 ring-[#c3c7ce]/20',
        className,
      )}
    >
      <div className={cn('mb-2 flex h-10 w-10 items-center justify-center rounded-full', st.soft)}>
        <Layers3 className="h-5 w-5 text-[#001629]" strokeWidth={1.6} />
      </div>
      <p className="line-clamp-2 text-sm font-black text-[#001629]">{node.title}</p>
      <span className={cn('mt-2 rounded-full px-2 py-0.5 text-[9px] font-black uppercase', st.chip)}>
        {labelEstadoNivel(node.estadoNivel)}
      </span>
      <p className="mt-2 text-[10px] font-semibold text-[#596574]">
        {childCount} {childMetricLabel} · {progressValue(node)}%
      </p>
    </button>
  );
}

function LevelCard({
  node,
  variant,
  projectKind,
  selected,
  index,
  childCount,
  childLabel,
  onSelect,
  onEnter,
}: {
  node: CanvasNode;
  variant: Variant;
  projectKind: CanvasProjectKind;
  selected: boolean;
  index: number;
  childCount: number;
  childLabel: string;
  onSelect: (id: string) => void;
  onEnter: (id: string) => void;
}) {
  const Icon = iconForVariant(variant);
  const st = statusStyle(node);
  const pct = progressValue(node);

  return (
    <button
      type="button"
      onClick={() => onSelect(node.id)}
      onDoubleClick={(e) => {
        e.preventDefault();
        onEnter(node.id);
      }}
      className={cn(
        variant === 'ambiente'
          ? 'group relative min-h-[174px] overflow-hidden rounded-[24px] bg-white p-5 text-left shadow-[0_12px_32px_rgba(23,28,31,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(23,28,31,0.10)]'
          : 'group relative min-h-[220px] overflow-hidden rounded-[28px] bg-white p-6 text-left shadow-[0_12px_32px_rgba(23,28,31,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(23,28,31,0.10)]',
        selected
          ? 'ring-2 ring-[#24a375] ring-offset-4 ring-offset-[#f6fafe]'
          : 'ring-1 ring-[#c3c7ce]/25',
      )}
    >
      <div className={cn('absolute inset-x-0 top-0 h-1', st.bar)} />
      <div className="flex items-start justify-between gap-3">
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl', st.soft)}>
          <Icon className="h-6 w-6 text-[#001629]" strokeWidth={1.6} />
        </div>
        <span className={cn('rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em]', st.chip)}>
          {labelEstadoNivel(node.estadoNivel)}
        </span>
      </div>

      <p className={cn('text-[10px] font-black uppercase tracking-[0.18em] text-[#9aa3b2]', variant === 'ambiente' ? 'mt-4' : 'mt-6')}>
        {labelTipoNodo(node.type, projectKind)} · {String(index + 1).padStart(2, '0')}
      </p>
      <h3 className={cn('mt-1 line-clamp-2 font-black tracking-[-0.03em] text-[#001629]', variant === 'ambiente' ? 'text-lg' : 'text-2xl')}>
        {node.title}
      </h3>
      {node.tipoLabel ? (
        <p className="mt-1 line-clamp-1 text-sm font-medium text-[#545f6e]">{node.tipoLabel}</p>
      ) : (
        <p className="mt-1 text-sm text-[#8b95a5]">Sin etiqueta cargada</p>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <MetricTile label={childLabel} value={String(childCount)} />
        <MetricTile label="Avance" value={`${pct}%`} />
      </div>

      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#e4e9ed]">
        <div className={cn('h-full rounded-full', st.bar)} style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-5 flex items-center justify-between text-xs font-bold text-[#406182]">
        <span>{variant === 'ambiente' ? 'Abrir canvas de tareas' : 'Doble click para entrar'}</span>
        <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </button>
  );
}

function MetricTile({ label, value, dark = false }: { label: string; value: string; dark?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-2xl px-3 py-3',
        dark ? 'bg-white/10 text-white' : 'bg-[#f0f4f8] text-[#001629]',
      )}
    >
      <span className={cn('block text-[9px] font-black uppercase tracking-[0.16em]', dark ? 'text-white/50' : 'text-[#7f8b9b]')}>
        {label}
      </span>
      <span className="mt-1 block truncate text-sm font-black">{value}</span>
    </div>
  );
}

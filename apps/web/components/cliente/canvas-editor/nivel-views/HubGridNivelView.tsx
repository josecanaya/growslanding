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
import type { DescendantTaskRollup } from '../canvasMultinivelHelpers';
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
  /** Tareas/publicación descendientes por nodo (cards más útiles). */
  getDescendantRollup?: (nodeId: string) => DescendantTaskRollup;
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
  getDescendantRollup,
}: Props) {
  const m = hubMetaForView(variant, projectKind, hubNode);
  const sectorChildMetricLabel =
    variant === 'sector' ? childMetricLabelUnderSectorNode(projectKind) : 'ambientes';
  const HubIcon = iconForVariant(variant);

  return (
    <div className="relative min-h-[min(68vh,760px)] overflow-hidden rounded-2xl bg-[#f8fafc] p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="relative z-10">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#64748b]">
              {m.eyebrow}
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-[-0.03em] text-[#0f172a]">
              {m.title}
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-[#64748b]">{m.subtitle}</p>
          </div>
          <div className="rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3 text-right shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#94a3b8]">
              Elementos
            </p>
            <p className="text-2xl font-bold text-[#0f172a]">{items.length}</p>
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
            getDescendantRollup={getDescendantRollup}
          />
        ) : (
          <div className={cn('grid gap-7', variant === 'planta' ? 'xl:grid-cols-[380px_1fr]' : 'xl:grid-cols-[300px_1fr]')}>
            <div className="relative overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eff6ff] text-[#2563eb]">
                <HubIcon className="h-6 w-6" strokeWidth={1.7} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#64748b]">
                {m.hubBadge}
              </p>
              <h3 className="mt-2 line-clamp-3 text-2xl font-bold tracking-[-0.03em] text-[#0f172a]">
                {hubNode.title}
              </h3>
              <p className="mt-3 line-clamp-5 text-sm leading-6 text-[#64748b]">
                {hubNode.descripcion?.trim() ||
                  'Agregá una descripción en el inspector para orientar la ejecución del equipo.'}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <MetricTile label="Estado" value={labelEstadoNivel(hubNode.estadoNivel)} />
                <MetricTile label="Avance" value={`${progressValue(hubNode)}%`} />
              </div>
              {variant === 'ambiente' ? (
                <p className="mt-5 rounded-2xl bg-[#eff6ff] px-4 py-3 text-sm font-semibold text-[#1d4ed8]">
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
              getDescendantRollup={getDescendantRollup}
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
  getDescendantRollup,
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
  getDescendantRollup?: (nodeId: string) => DescendantTaskRollup;
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
          rollup={getDescendantRollup?.(n.id)}
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
  getDescendantRollup,
}: {
  projectKind: CanvasProjectKind;
  hubNode: CanvasNode;
  items: CanvasNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEnter: (id: string) => void;
  childCount: (id: string) => number;
  childMetricLabel: string;
  getDescendantRollup?: (nodeId: string) => DescendantTaskRollup;
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
      <div className="relative min-h-[560px] overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white p-8 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <div className="pointer-events-none absolute inset-6 rounded-[28px] border border-[#f1f5f9]" />
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-20" aria-hidden>
          <line x1="50%" x2="18%" y1="50%" y2="24%" stroke="#001629" strokeWidth="2" />
          <line x1="50%" x2="82%" y1="50%" y2="24%" stroke="#001629" strokeWidth="2" />
          <line x1="50%" x2="16%" y1="50%" y2="76%" stroke="#001629" strokeWidth="2" />
          <line x1="50%" x2="84%" y1="50%" y2="76%" stroke="#001629" strokeWidth="2" />
          <line x1="50%" x2="50%" y1="50%" y2="90%" stroke="#001629" strokeWidth="2" />
        </svg>
        <div className="absolute left-1/2 top-1/2 z-20 flex h-56 w-56 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-[#dbeafe] bg-[#eff6ff] text-center text-[#0f172a] shadow-[0_8px_24px_rgba(15,23,42,0.08)] ring-[10px] ring-white">
          <Layers3 className="mb-3 h-9 w-9 text-[#2563eb]" strokeWidth={1.5} />
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1d4ed8]">
            {m.hubBadge}
          </p>
          <p className="mt-2 line-clamp-2 px-6 text-2xl font-bold tracking-[-0.04em]">
            {hubNode.title}
          </p>
          <p className="mt-2 text-[11px] text-[#64748b]">
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
              rollup={getDescendantRollup?.(n.id)}
              onSelect={onSelect}
              onEnter={onEnter}
            />
          ))
        )}
      </div>

      <div className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#64748b]">
          Sectores visibles
        </p>
        <p className="mt-2 text-sm leading-6 text-[#64748b]">
          Mapa interno de planta. Seleccioná una pieza para editarla o doble click para entrar.
        </p>
        <div className="mt-5 space-y-3">
          {items.map((n) => {
            const rollup = getDescendantRollup?.(n.id);
            return (
            <button
              key={n.id}
              type="button"
              onClick={() => onSelect(n.id)}
              onDoubleClick={(e) => {
                e.preventDefault();
                onEnter(n.id);
              }}
              className={cn(
                'w-full rounded-2xl border border-[#e5e7eb] bg-white px-4 py-3 text-left transition hover:bg-[#f8fafc]',
                selectedId === n.id ? 'ring-2 ring-[#2563eb]' : null,
              )}
              title={rollup && rollup.taskCount > 0 ? `${n.title} · ${rollup.taskCount} tareas` : n.title}
            >
              <p className="truncate text-sm font-bold text-[#0f172a]">{n.title}</p>
              <p className="mt-1 text-[11px] font-semibold text-[#64748b]">
                {rollup && rollup.taskCount > 0 ? (
                  <>
                    {rollup.taskCount} tareas · {rollup.publishedCount} pub. · {rollup.unpublishedCount} sin pub.
                    {rollup.presupuestadasCount > 0 ? ` · ${rollup.presupuestadasCount} presup.` : ''} · Av.{' '}
                    {progressValue(n)}%
                  </>
                ) : (
                  <>
                    {childCount(n.id)} {childMetricLabel} · {progressValue(n)}%
                  </>
                )}
              </p>
            </button>
          );
          })}
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
  rollup,
  onSelect,
  onEnter,
}: {
  node: CanvasNode;
  className: string;
  selected: boolean;
  childCount: number;
  childMetricLabel: string;
  rollup?: DescendantTaskRollup;
  onSelect: (id: string) => void;
  onEnter: (id: string) => void;
}) {
  const st = statusStyle(node);
  const line2 =
    rollup && rollup.taskCount > 0
      ? `${rollup.taskCount} tar. · ${rollup.publishedCount} pub. · ${rollup.unpublishedCount} sin pub.`
      : `${childCount} ${childMetricLabel}`;
  return (
    <button
      type="button"
      onClick={() => onSelect(node.id)}
      onDoubleClick={(e) => {
        e.preventDefault();
        onEnter(node.id);
      }}
      title={`${node.title} · ${line2}`}
      className={cn(
        'absolute z-30 flex h-36 w-40 flex-col items-center justify-center rounded-2xl bg-white p-4 text-center shadow-[0_4px_16px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5',
        selected ? 'ring-2 ring-[#2563eb] ring-offset-4 ring-offset-white' : 'ring-1 ring-[#e5e7eb]',
        className,
      )}
    >
      <div className={cn('mb-2 flex h-10 w-10 items-center justify-center rounded-full', st.soft)}>
        <Layers3 className="h-5 w-5 text-[#001629]" strokeWidth={1.6} />
      </div>
      <p className="line-clamp-2 text-sm font-bold text-[#0f172a]">{node.title}</p>
      <span className={cn('mt-2 rounded-full px-2 py-0.5 text-[9px] font-black uppercase', st.chip)}>
        {labelEstadoNivel(node.estadoNivel)}
      </span>
      <p className="mt-2 text-[10px] font-semibold leading-tight text-[#64748b]">{line2}</p>
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
  rollup,
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
  rollup?: DescendantTaskRollup;
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
          ? 'group relative min-h-[174px] overflow-hidden rounded-2xl bg-white p-5 text-left shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)]'
          : 'group relative min-h-[232px] overflow-hidden rounded-2xl bg-white p-5 text-left shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)]',
        selected
          ? 'ring-2 ring-[#2563eb] ring-offset-4 ring-offset-[#f8fafc]'
          : 'ring-1 ring-[#e5e7eb]',
      )}
      title={
        rollup && rollup.taskCount > 0
          ? `${node.title} · ${rollup.taskCount} tareas · ${rollup.publishedCount} publicadas`
          : node.title
      }
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
      <h3 className={cn('mt-1 line-clamp-2 font-bold tracking-[-0.03em] text-[#0f172a]', variant === 'ambiente' ? 'text-lg' : 'text-xl')}>
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

      {rollup && rollup.taskCount > 0 ? (
        <p className="mt-3 text-[11px] font-semibold leading-snug text-[#475569]">
          {rollup.taskCount} tareas · {rollup.publishedCount} publicadas · {rollup.unpublishedCount} sin publicar
          {rollup.presupuestadasCount > 0 ? ` · ${rollup.presupuestadasCount} con presupuesto` : ''}
        </p>
      ) : null}

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

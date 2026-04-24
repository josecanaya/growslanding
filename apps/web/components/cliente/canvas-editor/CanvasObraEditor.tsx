'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Box,
  CheckSquare,
  ChevronRight,
  Layers3,
  LayoutGrid,
  Network,
  Package,
  Plus,
  FileStack,
} from 'lucide-react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';

import {
  getCanvasObraEditorMock,
  newId,
  type BloqueEditorMock,
  type CanvasObraMock,
  type EtapaEditorMock,
  type PaquetePresupuestoMock,
  type TareaEditorMock,
} from '@/lib/mocks/canvasObraEditorMock';
import { TareaFlowEditor } from './TareaFlowEditor';
import { Button } from '@/components/ui/grows';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

type Level = 1 | 2 | 3;

type Props = {
  obraId: string;
};

function defaultTarea(over: Partial<TareaEditorMock> = {}): TareaEditorMock {
  return {
    id: newId('t'),
    nombre: 'Nueva tarea',
    estado: 'Pendiente',
    responsable: 'Sin asignar',
    checklist: [
      { id: newId('ck'), label: 'Ítem de checklist', done: false },
    ],
    evidencia: [],
    validacion: { estado: 'pendiente' },
    paqueteId: null,
    dias: 2,
    pos: { x: 120 + Math.random() * 80, y: 80 + Math.random() * 60 },
    ...over,
  };
}

export function CanvasObraEditor({ obraId }: Props) {
  const router = useRouter();
  const initial = useMemo(() => getCanvasObraEditorMock(obraId), [obraId]);
  const [model, setModel] = useState<CanvasObraMock>(initial);
  const [etapaId, setEtapaId] = useState<string | null>(null);
  const [bloqueId, setBloqueId] = useState<string | null>(null);
  const [selectedTareaId, setSelectedTareaId] = useState<string | null>(null);
  const [sideTab, setSideTab] = useState<'tarea' | 'paquetes' | 'estructura'>('tarea');

  const level: Level = !etapaId ? 1 : !bloqueId ? 2 : 3;

  const etapa = useMemo(
    () => model.etapas.find((e) => e.id === etapaId) ?? null,
    [model.etapas, etapaId]
  );
  const bloque = useMemo(
    () => (etapa ? etapa.bloques.find((b) => b.id === bloqueId) ?? null : null),
    [etapa, bloqueId]
  );

  const selectedTarea: TareaEditorMock | null = useMemo(() => {
    if (!bloque || !selectedTareaId) return null;
    return bloque.tareas.find((t) => t.id === selectedTareaId) ?? null;
  }, [bloque, selectedTareaId]);

  const updateBloque = useCallback((eid: string, bid: string, next: BloqueEditorMock) => {
    setModel((m) => {
      const nextEtapas = m.etapas.map((e) =>
        e.id === eid
          ? { ...e, bloques: e.bloques.map((b) => (b.id === bid ? next : b)) }
          : e
      );
      return { ...m, etapas: nextEtapas, paquetes: syncPaquetes(m.paquetes, nextEtapas) };
    });
  }, []);

  const onAddEtapa = useCallback(() => {
    const id = newId('et');
    const n: EtapaEditorMock = {
      id,
      slug: 'estructura',
      titulo: 'Nueva etapa',
      subtitulo: 'Descripción (mock)',
      bloques: [
        {
          id: newId('bl'),
          titulo: 'Bloque inicial',
          descripcion: 'Arrastrá tareas al grafo',
          tareas: [defaultTarea({ nombre: 'Tarea 1' })],
          edges: [],
        },
      ],
    };
    setModel((m) => ({ ...m, etapas: [...m.etapas, n] }));
    setEtapaId(id);
    setBloqueId(n.bloques[0]!.id);
  }, []);

  const onAddBloque = useCallback(() => {
    if (!etapaId) return;
    const b: BloqueEditorMock = {
      id: newId('bl'),
      titulo: 'Nuevo bloque / fase',
      descripcion: 'Doble click en el mapa (mock)',
      tareas: [defaultTarea()],
      edges: [],
    };
    setModel((m) => ({
      ...m,
      etapas: m.etapas.map((e) =>
        e.id === etapaId ? { ...e, bloques: [...e.bloques, b] } : e
      ),
    }));
    setBloqueId(b.id);
  }, [etapaId]);

  const onAddTarea = useCallback(() => {
    if (!etapaId || !bloqueId || !etapa) return;
    const t = defaultTareaAtEnd(etapa, bloqueId);
    if (!t) return;
    setModel((m) => ({
      ...m,
      etapas: m.etapas.map((e) => {
        if (e.id !== etapaId) return e;
        return {
          ...e,
          bloques: e.bloques.map((b) => {
            if (b.id !== bloqueId) return b;
            return { ...b, tareas: [...b.tareas, t] };
          }),
        };
      }),
    }));
    setSelectedTareaId(t.id);
  }, [etapa, etapaId, bloqueId]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#ecfdfd] text-[#0f1e1f]">
      <header className="sticky top-0 z-40 border-b border-[#c3c5d9]/60 bg-[#ecfdfd]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={() => {
                if (level === 3) {
                  setBloqueId(null);
                  setSelectedTareaId(null);
                } else if (level === 2) {
                  setEtapaId(null);
                  setBloqueId(null);
                } else {
                  router.push('/cliente/tareas' as Route);
                }
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#434656]">Grows</p>
              <h1 className="truncate text-sm font-extrabold text-[#01124f] md:text-base">
                {model.obraNombre}
              </h1>
            </div>
            <nav
              className="hidden min-w-0 items-center gap-1 text-[10px] font-medium text-[#434656] md:flex"
              aria-label="Migas"
            >
              <span className="shrink-0">Obra</span>
              <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />
              {etapa && (
                <>
                  <span className="max-w-[100px] truncate text-[#0f1e1f]">{etapa.titulo}</span>
                  <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />
                </>
              )}
              {bloque && (
                <span className="max-w-[120px] truncate text-[#0042c8]">{bloque.titulo}</span>
              )}
            </nav>
          </div>
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onAddEtapa}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Etapa
            </Button>
            {level >= 2 && etapaId && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onAddBloque}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Nodo
              </Button>
            )}
            {level === 3 && etapaId && bloqueId && (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={onAddTarea}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Tarea
              </Button>
            )}
          </div>
        </div>
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-2 border-t border-[#c3c5d9]/30 px-4 py-2 md:hidden">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onAddEtapa}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Etapa
          </Button>
          {level >= 2 && etapaId && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onAddBloque}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Nodo
            </Button>
          )}
          {level === 3 && etapaId && bloqueId && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onAddTarea}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Tarea
            </Button>
          )}
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 min-h-0">
        <aside className="hidden w-56 flex-col border-r border-[#c3c5d9]/50 bg-white/50 md:flex">
          <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#434656]">Panel</p>
          <button
            type="button"
            onClick={() => setSideTab('tarea')}
            className={cn(
              'flex items-center gap-2 px-3 py-2.5 text-left text-sm font-medium transition',
              sideTab === 'tarea' ? 'bg-[#d9e3f6] text-[#0a1422]' : 'text-[#434656] hover:bg-[#e6f7f8]'
            )}
          >
            <Box className="h-4 w-4" />
            Canvas
          </button>
          <button
            type="button"
            onClick={() => setSideTab('estructura')}
            className={cn(
              'flex items-center gap-2 px-3 py-2.5 text-left text-sm font-medium transition',
              sideTab === 'estructura' ? 'bg-[#d9e3f6] text-[#0a1422]' : 'text-[#434656] hover:bg-[#e6f7f8]'
            )}
          >
            <CheckSquare className="h-4 w-4" />
            Tareas
          </button>
          <button
            type="button"
            onClick={() => setSideTab('paquetes')}
            className={cn(
              'flex items-center gap-2 px-3 py-2.5 text-left text-sm font-medium transition',
              sideTab === 'paquetes' ? 'bg-[#d9e3f6] text-[#0a1422]' : 'text-[#434656] hover:bg-[#e6f7f8]'
            )}
          >
            <Package className="h-4 w-4" />
            Paquetes
          </button>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col p-3 md:p-5">
          {level === 1 && (
            <section>
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-[#0042c8]">Nivel 1</p>
                <h2 className="text-xl font-extrabold text-[#0f1e1f]">Timeline de etapas</h2>
                <p className="mt-1 text-sm text-[#434656]">
                  Elegí una etapa para ver bloques. Los datos son mock; luego: tareas → validación → wallet.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {model.etapas.map((e) => {
                  const totalNodos = e.bloques.length;
                  const totalT = e.bloques.reduce((a, b) => a + b.tareas.length, 0);
                  return (
                    <button
                      type="button"
                      key={e.id}
                      onClick={() => {
                        setEtapaId(e.id);
                        setBloqueId(null);
                        setSelectedTareaId(null);
                      }}
                      className="group flex flex-col rounded-2xl border border-[#c3c5d9] bg-white p-5 text-left shadow-sm transition hover:border-[#0042c8] hover:shadow-md"
                    >
                      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#b6c4ff]/30 text-[#0042c8]">
                        <Layers3 className="h-5 w-5" />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#434656]">Etapa</p>
                      <h3 className="text-lg font-extrabold text-[#0f1e1f] group-hover:text-[#0042c8]">
                        {e.titulo}
                      </h3>
                      <p className="mt-1 text-sm text-[#434656]">{e.subtitulo}</p>
                      <div className="mt-4 flex gap-2 text-xs text-[#434656]">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-[#e6f7f8] px-2 py-1">
                          <LayoutGrid className="h-3.5 w-3.5" />
                          {totalNodos} bloques
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-[#e1f1f2] px-2 py-1">
                          <FileStack className="h-3.5 w-3.5" />
                          {totalT} tareas
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {level === 2 && etapa && (
            <section>
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-[#0042c8]">Nivel 2</p>
                <h2 className="text-xl font-extrabold text-[#0f1e1f]">Bloques en {etapa.titulo}</h2>
                <p className="mt-1 text-sm text-[#434656]">
                  Cada bloque abre el grafo de tareas (nivel 3). Navegá con los botones arriba o la miniatura.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {etapa.bloques.map((b) => {
                  return (
                    <button
                      type="button"
                      key={b.id}
                      onClick={() => {
                        setBloqueId(b.id);
                        setSelectedTareaId(null);
                      }}
                      className="flex flex-col rounded-2xl border border-[#c3c5d9] bg-white p-5 text-left shadow-sm transition hover:border-[#0056ff] hover:shadow"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#434656]">
                            Bloque / fase
                          </p>
                          <h3 className="text-lg font-extrabold text-[#0f1e1f]">{b.titulo}</h3>
                          <p className="text-sm text-[#434656]">{b.descripcion}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-[#0042c8] px-2 py-0.5 text-[10px] font-bold text-white">
                          {b.tareas.length} tareas
                        </span>
                      </div>
                      <div className="mt-3 flex h-20 items-center justify-center gap-0.5 rounded-xl bg-[#f3f4f5] text-[#737688]">
                        <Network className="h-5 w-5" />
                        <span className="ml-1 text-xs font-medium">Grafo CPM</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {level === 3 && etapa && bloque && etapaId && bloqueId && (
            <section className="flex min-h-0 flex-1 flex-col">
              <div className="mb-3">
                <p className="text-xs font-bold uppercase tracking-widest text-[#0042c8]">Nivel 3</p>
                <h2 className="text-lg font-extrabold text-[#0f1e1f] md:text-xl">
                  {bloque.titulo}
                </h2>
                <p className="text-sm text-[#434656]">
                  Arrastrá nodos, conectá dependencias, zoom con controles. 
                  {sideTab === 'tarea' && ' · Panel: checklist, validación y entrega a wallet (mock).'}
                </p>
                <div className="mt-2 flex flex-wrap gap-1 md:hidden">
                  {(
                    [
                      ['tarea', 'Detalle', Box],
                      ['estructura', 'Lista', CheckSquare],
                      ['paquetes', 'Paquetes', Package],
                    ] as const
                  ).map(([k, label, Icon]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setSideTab(k)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold',
                        sideTab === k
                          ? 'border-[#0042c8] bg-[#d9e3f6] text-[#0a1422]'
                          : 'border-[#c3c5d9] bg-white text-[#434656]'
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
                <div className="min-h-0">
                  <TareaFlowEditor
                    flowKey={`${etapaId}-${bloqueId}`}
                    bloque={bloque}
                    onBloqueChange={(next) => updateBloque(etapaId, bloqueId, next)}
                    onSelectTarea={(id) => setSelectedTareaId(id)}
                  />
                </div>
                <div className="flex max-h-[min(70vh,640px)] flex-col overflow-hidden rounded-2xl border border-[#c3c5d9] bg-white shadow-sm">
                  {sideTab === 'paquetes' && <PaquetesPanel paquetes={model.paquetes} />}
                  {sideTab === 'estructura' && etapaId && (
                    <ChecklistEstructura
                      tareas={bloque.tareas}
                      onPick={(id) => setSelectedTareaId(id)}
                    />
                  )}
                  {sideTab === 'tarea' && etapaId && bloqueId && bloque && (
                    <TareaDetailPanel
                      tarea={selectedTarea}
                      bloque={bloque}
                      onBloqueChange={(next) => updateBloque(etapaId, bloqueId, next)}
                    />
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function defaultTareaAtEnd(etapa: EtapaEditorMock, bloqueId: string): TareaEditorMock | null {
  const b = etapa.bloques.find((x) => x.id === bloqueId);
  if (!b) return null;
  const last = b.tareas[b.tareas.length - 1];
  const y = last ? last.pos.y : 100;
  const x = last ? last.pos.x + 200 : 120;
  return defaultTarea({ pos: { x, y: y + 40 } });
}

function syncPaquetes(
  paquetes: PaquetePresupuestoMock[],
  etapas: EtapaEditorMock[]
): PaquetePresupuestoMock[] {
  const map = new Map(paquetes.map((p) => [p.id, { ...p, tareaIds: [] as string[] }]));
  for (const e of etapas) {
    for (const b of e.bloques) {
      for (const t of b.tareas) {
        if (t.paqueteId && map.has(t.paqueteId)) {
          map.get(t.paqueteId)!.tareaIds.push(t.id);
        }
      }
    }
  }
  return paquetes.map((p) => map.get(p.id) ?? p);
}

function predecesorasDeTarea(bloque: BloqueEditorMock, tareaId: string): string[] {
  return bloque.edges.filter((e) => e.target === tareaId).map((e) => e.source);
}

function bloqueConPredecesoras(
  bloque: BloqueEditorMock,
  tareaId: string,
  sourceIds: string[]
): BloqueEditorMock {
  const sinEntrada = bloque.edges.filter((e) => e.target !== tareaId);
  const unicos = Array.from(new Set(sourceIds)).filter((id) => id !== tareaId);
  const nuevas = unicos.map((source) => ({
    id: newId('edge'),
    source,
    target: tareaId,
  }));
  return { ...bloque, edges: [...sinEntrada, ...nuevas] };
}

function tareaEnBloque(
  bloque: BloqueEditorMock,
  tareaId: string,
  tarea: TareaEditorMock
): BloqueEditorMock {
  return {
    ...bloque,
    tareas: bloque.tareas.map((x) => (x.id === tareaId ? tarea : x)),
  };
}

function TareaDetailPanel({
  tarea,
  bloque,
  onBloqueChange,
}: {
  tarea: TareaEditorMock | null;
  bloque: BloqueEditorMock;
  onBloqueChange: (b: BloqueEditorMock) => void;
}) {
  if (!tarea) {
    return (
      <div className="p-4 text-sm text-[#434656]">
        <p className="font-semibold text-[#0f1e1f]">Ninguna tarea seleccionada</p>
        <p className="mt-1">Hacé click en un nodo del grafo o en la pestaña Tareas y elegí de la lista.</p>
      </div>
    );
  }

  const otrasTareas = bloque.tareas.filter((x) => x.id !== tarea.id);
  const predIds = predecesorasDeTarea(bloque, tarea.id);

  const setTarea = (next: TareaEditorMock) => {
    onBloqueChange(tareaEnBloque(bloque, tarea.id, next));
  };

  return (
    <div className="overflow-y-auto p-4">
      <h3 className="text-sm font-extrabold leading-snug text-[#0f1e1f]">{tarea.nombre}</h3>
      <p className="mt-1 text-xs text-[#434656]">Solo edición: checklist, días y predecesoras (se reflejan en el grafo).</p>

      <label className="mt-4 block text-[10px] font-bold uppercase text-[#434656]">Cantidad de días</label>
      <input
        type="number"
        min={1}
        step={1}
        className="mt-1 w-full rounded-lg border border-[#c3c5d9] px-2 py-2 text-sm"
        value={tarea.dias}
        onChange={(e) => {
          const n = Math.max(1, parseInt(e.target.value, 10) || 1);
          setTarea({ ...tarea, dias: n });
        }}
      />

      <p className="mt-4 text-[10px] font-bold uppercase text-[#434656]">Predecesoras</p>
      {otrasTareas.length === 0 ? (
        <p className="mt-1 text-xs text-[#434656]">Solo hay esta tarea en el bloque.</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {otrasTareas.map((o) => {
            const onPred = predIds.includes(o.id);
            return (
              <li key={o.id} className="flex items-center gap-2">
                <Checkbox
                  id={`p-${o.id}`}
                  checked={onPred}
                  onCheckedChange={() => {
                    const next = onPred
                      ? predIds.filter((id) => id !== o.id)
                      : [...predIds, o.id];
                    onBloqueChange(bloqueConPredecesoras(bloque, tarea.id, next));
                  }}
                />
                <label htmlFor={`p-${o.id}`} className="cursor-pointer text-sm text-[#0f1e1f]">
                  {o.nombre} <span className="text-[#434656]">({o.dias} d)</span>
                </label>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-4 text-[10px] font-bold uppercase text-[#434656]">Checklist</p>
      <ul className="mt-2 space-y-2">
        {tarea.checklist.map((c) => (
          <li key={c.id} className="flex items-start gap-2">
            <Checkbox
              checked={c.done}
              onCheckedChange={(v) =>
                setTarea({
                  ...tarea,
                  checklist: tarea.checklist.map((x) =>
                    x.id === c.id ? { ...x, done: Boolean(v) } : x
                  ),
                })
              }
            />
            <input
              className="flex-1 border-b border-transparent bg-transparent text-sm focus:border-[#0042c8] outline-none"
              value={c.label}
              onChange={(e) =>
                setTarea({
                  ...tarea,
                  checklist: tarea.checklist.map((x) =>
                    x.id === c.id ? { ...x, label: e.target.value } : x
                  ),
                })
              }
            />
          </li>
        ))}
      </ul>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="mt-2"
        onClick={() =>
          setTarea({
            ...tarea,
            checklist: [...tarea.checklist, { id: newId('ck'), label: 'Nuevo ítem', done: false }],
          })
        }
      >
        <Plus className="mr-1 h-3 w-3" />
        Ítem
      </Button>
    </div>
  );
}

function ChecklistEstructura({
  tareas,
  onPick,
}: {
  tareas: TareaEditorMock[];
  onPick: (id: string) => void;
}) {
  return (
    <div className="max-h-full overflow-y-auto p-3">
      <h3 className="text-sm font-extrabold">Checklist tareas (Stitch)</h3>
      <p className="text-xs text-[#434656]">Elegí una tarea para abrir en el panel.</p>
      <ul className="mt-2 space-y-1">
        {tareas.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => onPick(t.id)}
              className="flex w-full items-center justify-between gap-2 rounded-lg border border-[#e1e3e4] bg-[#f8f9fa] px-2 py-2 text-left text-sm"
            >
              <span className="font-medium">{t.nombre}</span>
              <span className="shrink-0 text-[10px] text-[#434656]">{t.dias} d</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PaquetesPanel({ paquetes }: { paquetes: PaquetePresupuestoMock[] }) {
  return (
    <div className="max-h-full overflow-y-auto p-3">
      <h3 className="text-sm font-extrabold">Paquetes de presupuesto</h3>
      <p className="text-xs text-[#434656]">Agrupá tareas para oferta / cierre. Mock.</p>
      <ul className="mt-2 space-y-2">
        {paquetes.map((p) => (
          <li key={p.id} className="rounded-lg border border-[#c3c5d9] bg-[#f3f4f5] p-2">
            <p className="text-sm font-bold text-[#0f1e1f]">{p.nombre}</p>
            <p className="text-xs text-[#434656]">{p.montoRef}</p>
            <p className="mt-1 text-[10px] text-[#0042c8]">{p.tareaIds.length} tareas vinculadas</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[10px] text-[#434656]">Para reasignar, usá el desplegable en el detalle de tarea (versión v2: drag a paquete).</p>
    </div>
  );
}

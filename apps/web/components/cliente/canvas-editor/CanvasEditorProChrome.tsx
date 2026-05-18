'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  ArrowLeft,
  Bell,
  Cloud,
  CloudUpload,
  Copy,
  FileInput,
  Filter,
  FolderPlus,
  GitBranch,
  HelpCircle,
  LayoutGrid,
  Loader2,
  MousePointer2,
  RotateCcw,
  RotateCw,
  Save,
  Settings,
  Share2,
  Trash2,
  ZoomIn,
  Building2,
  Building,
} from 'lucide-react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';
import type { CanvasNivelTipo } from '@/lib/types/canvasMultinivel';

export type RibbonMainTab =
  | 'archivo'
  | 'inicio'
  | 'organizar'
  | 'tareas'
  | 'presupuestos'
  | 'publicacion'
  | 'vista';

type CloudUi = 'idle' | 'saving' | 'dirty';

export type CanvasEditorProChromeProps = {
  obraNombre: string;
  onObraNombreChange: (v: string) => void;
  /** Derivar etiqueta de guardado sin tocar el hook */
  cloudSaveState: string;
  cloudSaveMessage: string | null;
  editorTab: 'canvas' | 'presupuestos';
  onEditorTab: (t: 'canvas' | 'presupuestos') => void;
  vistaLabel: string;
  nivelActualLabel: string;
  canvasHydrated: boolean;
  tieneNodosTarea: boolean;
  puedeCrear: boolean;
  labelBotonCrear: string;
  childTypeToCreate: CanvasNivelTipo | null;
  connectEtapas: boolean;
  vistaEtapas: boolean;
  proyectoBusy: boolean;
  userLabel: string;
  taskCount: number;
  publishedTaskCount: number;
  criticalCount: number | null;
  vistaTareas: boolean;
  onBack: () => void;
  onSaveCloud: () => void;
  onPublicar: () => void;
  onImportXml: () => void;
  onCreateChild: () => void;
  onGoUp: () => void;
  upDisabled: boolean;
  onToggleConnectEtapas: () => void;
  onToggleConnectTareas: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  duplicateDisabled?: boolean;
  deleteDisabled?: boolean;
  /** Modo conectar tareas — el panel lo gestiona; aquí solo feedback visual */
  connectTareasActive?: boolean;
  /** Notifica pestaña del ribbon (p. ej. modo revisión Publicación). */
  onRibbonMainTabChange?: (tab: RibbonMainTab) => void;
};

function RibbonButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  title,
  pressed,
  isPlaceholder,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  pressed?: boolean;
  /** Botón no funcional: se ve distinto a “error” o a acción deshabilitada por contexto. */
  isPlaceholder?: boolean;
  /** Crear contextual activo en este nivel. */
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      title={title ?? label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-0.5 rounded border border-transparent px-1.5 py-1 text-[10px] font-medium transition',
        isPlaceholder
          ? 'cursor-not-allowed border-dashed border-[#cbd5e1] bg-[#f1f5f9] text-[#94a3b8] opacity-80 hover:border-[#cbd5e1] hover:bg-[#f1f5f9] disabled:opacity-80'
          : 'text-[#1e293b] hover:border-[#cbd5e1] hover:bg-[#f1f5f9] disabled:pointer-events-none disabled:opacity-40',
        !isPlaceholder && accent && !disabled && 'border-[#2563eb]/55 bg-[#eff6ff] shadow-[inset_0_0_0_1px_rgba(37,99,235,0.12)]',
        pressed && 'border-[#2563eb] bg-[#eff6ff]',
      )}
    >
      <Icon className={cn('h-4 w-4', isPlaceholder ? 'text-[#94a3b8]' : 'text-[#334155]')} />
      <span className="max-w-[72px] text-center leading-tight">{label}</span>
    </button>
  );
}

function RibbonGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex shrink-0 flex-col justify-between border-r border-[#e2e8f0] px-2 last:border-r-0">
      <div className="flex flex-wrap gap-0.5">{children}</div>
      <span className="pt-1 text-center text-[9px] font-semibold uppercase tracking-tight text-[#94a3b8]">
        {label}
      </span>
    </div>
  );
}

function cloudUiFromState(cloudSaveState: string, savingBusy: boolean): CloudUi {
  if (savingBusy || cloudSaveState === 'saving') return 'saving';
  if (cloudSaveState === 'err') return 'dirty';
  return 'idle';
}

export function CanvasEditorProChrome(props: CanvasEditorProChromeProps) {
  const router = useRouter();
  const [ribbonTab, setRibbonTab] = useState<RibbonMainTab>('inicio');
  const savingBusy = props.cloudSaveState === 'saving' || props.proyectoBusy;
  const cloudUi = cloudUiFromState(props.cloudSaveState, savingBusy);

  const guardadoLabel = useMemo(() => {
    if (cloudUi === 'saving') return 'Guardando…';
    if (cloudUi === 'dirty') return 'Revisar guardado';
    if (props.cloudSaveMessage && props.cloudSaveState === 'ok') return 'Guardado en la nube';
    return 'Guardado en la nube';
  }, [cloudUi, props.cloudSaveMessage, props.cloudSaveState]);

  const mainTabs: { id: RibbonMainTab; label: string }[] = [
    { id: 'archivo', label: 'Archivo' },
    { id: 'inicio', label: 'Inicio' },
    { id: 'organizar', label: 'Organizar' },
    { id: 'tareas', label: 'Tareas' },
    { id: 'presupuestos', label: 'Presupuestos' },
    { id: 'publicacion', label: 'Publicación' },
    { id: 'vista', label: 'Vista' },
  ];

  useEffect(() => {
    if (props.editorTab === 'presupuestos') {
      setRibbonTab('presupuestos');
      props.onRibbonMainTabChange?.('presupuestos');
    }
  }, [props.editorTab, props.onRibbonMainTabChange]);

  return (
    <div className="flex shrink-0 flex-col border-b border-[#0f172a] shadow-md">
      {/* Top bar oscura */}
      <div className="flex h-10 items-center gap-3 bg-[#1e293b] px-2 text-white">
        <button
          type="button"
          onClick={props.onBack}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-white/10 bg-white/5 text-white/90 hover:bg-white/10"
          title="Volver a obras"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-extrabold tracking-tight text-[#7dd3fc]">Grows</span>
        <div className="hidden min-w-0 flex-1 items-center gap-2 sm:flex">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Obra</span>
          <input
            className="min-w-0 max-w-md flex-1 truncate border-b border-transparent bg-transparent text-sm font-semibold text-white outline-none focus:border-[#38bdf8]"
            value={props.obraNombre}
            aria-label="Nombre de la obra"
            onChange={(e) => props.onObraNombreChange(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5 rounded border border-white/10 bg-black/20 px-2 py-1 text-[10px] text-slate-200">
          {cloudUi === 'saving' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-300" />
          ) : cloudUi === 'dirty' ? (
            <Cloud className="h-3.5 w-3.5 text-amber-300" />
          ) : (
            <Cloud className="h-3.5 w-3.5 text-emerald-300" />
          )}
          <span className="font-medium">{guardadoLabel}</span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            className="rounded p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
            title="Notificaciones"
            onClick={() => router.push('/cliente/notificaciones' as Route)}
          >
            <Bell className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
            title="Cuenta y configuración"
            onClick={() => router.push('/cliente/cuenta' as Route)}
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"
            title="Ayuda"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
        <div className="hidden max-w-[200px] truncate border-l border-white/15 pl-3 text-[11px] text-slate-300 lg:block">
          {props.userLabel}
        </div>
      </div>

      {/* Ribbon */}
      <div className="bg-[#f8fafc]">
        <div className="flex border-b border-[#e2e8f0] px-1 pt-1">
          {mainTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setRibbonTab(t.id);
                props.onRibbonMainTabChange?.(t.id);
                if (t.id === 'presupuestos') props.onEditorTab('presupuestos');
                if (t.id === 'inicio' || t.id === 'organizar' || t.id === 'tareas' || t.id === 'vista') {
                  props.onEditorTab('canvas');
                }
                if (t.id === 'publicacion') {
                  props.onEditorTab('canvas');
                }
              }}
              className={cn(
                'relative px-3 py-1.5 text-xs font-semibold transition',
                ribbonTab === t.id ? 'text-[#0f172a]' : 'text-[#64748b] hover:text-[#0f172a]',
              )}
            >
              {t.label}
              {ribbonTab === t.id ? (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[#2563eb]" />
              ) : null}
            </button>
          ))}
        </div>
        <div className="flex min-h-[76px] flex-wrap items-end gap-y-1 overflow-x-auto px-1 py-1.5">
          {ribbonTab === 'archivo' && (
            <>
              <RibbonGroup label="Obra">
                <RibbonButton
                  icon={Save}
                  label="Guardar nube"
                  onClick={props.onSaveCloud}
                  disabled={!props.canvasHydrated || props.cloudSaveState === 'saving'}
                />
              </RibbonGroup>
              <RibbonGroup label="Importar / Exportar">
                <RibbonButton
                  icon={FileInput}
                  label="Importar XML"
                  onClick={props.onImportXml}
                  disabled={props.editorTab !== 'canvas'}
                  title={
                    props.editorTab !== 'canvas'
                      ? 'Volvé a la pestaña Canvas para importar'
                      : 'Importar Project XML al canvas'
                  }
                />
                <RibbonButton
                  icon={CloudUpload}
                  label="Exportar"
                  disabled
                  isPlaceholder
                  title="Próximamente"
                />
              </RibbonGroup>
            </>
          )}

          {(ribbonTab === 'inicio' || ribbonTab === 'organizar' || ribbonTab === 'tareas') && (
            <>
              <RibbonGroup label="Crear">
                <RibbonButton
                  icon={FolderPlus}
                  label={props.childTypeToCreate === 'tarea' ? props.labelBotonCrear : 'Tarea'}
                  onClick={props.onCreateChild}
                  disabled={!props.puedeCrear || props.childTypeToCreate !== 'tarea'}
                  accent={props.puedeCrear && props.childTypeToCreate === 'tarea'}
                  title={
                    props.childTypeToCreate === 'tarea'
                      ? props.labelBotonCrear
                      : props.puedeCrear
                        ? `En este nivel el crear contextual es distinto. Usá «${props.labelBotonCrear}».`
                        : 'No podés crear aquí — subí o bajá de nivel.'
                  }
                />
                <RibbonButton
                  icon={LayoutGrid}
                  label={
                    props.childTypeToCreate === 'ambiente'
                      ? props.labelBotonCrear
                      : 'Ambiente'
                  }
                  onClick={props.onCreateChild}
                  disabled={!props.puedeCrear || props.childTypeToCreate !== 'ambiente'}
                  accent={props.puedeCrear && props.childTypeToCreate === 'ambiente'}
                  title={
                    props.childTypeToCreate === 'ambiente'
                      ? props.labelBotonCrear
                      : 'No disponible en este nivel · creá ambientes dentro de un departamento/sector.'
                  }
                />
                <RibbonButton
                  icon={Building2}
                  label={
                    props.childTypeToCreate === 'planta'
                      ? props.labelBotonCrear
                      : 'Piso'
                  }
                  onClick={props.onCreateChild}
                  disabled={!props.puedeCrear || props.childTypeToCreate !== 'planta'}
                  accent={props.puedeCrear && props.childTypeToCreate === 'planta'}
                  title={
                    props.childTypeToCreate === 'planta'
                      ? props.labelBotonCrear
                      : 'No disponible en este nivel · pisos o fases desde etapa u obra.'
                  }
                />
                <RibbonButton
                  icon={Building}
                  label={
                    props.childTypeToCreate === 'sector'
                      ? props.labelBotonCrear
                      : 'Departamento'
                  }
                  onClick={props.onCreateChild}
                  disabled={!props.puedeCrear || props.childTypeToCreate !== 'sector'}
                  accent={props.puedeCrear && props.childTypeToCreate === 'sector'}
                  title={
                    props.childTypeToCreate === 'sector'
                      ? props.labelBotonCrear
                      : 'No disponible en este nivel · departamentos desde planta/piso.'
                  }
                />
              </RibbonGroup>
              <RibbonGroup label="Editar">
                <RibbonButton
                  icon={Save}
                  label="Guardar"
                  onClick={props.onSaveCloud}
                  disabled={!props.canvasHydrated || savingBusy}
                />
                <RibbonButton
                  icon={RotateCcw}
                  label="Deshacer"
                  disabled
                  isPlaceholder
                  title="Próximamente · no hay historial local de deshacer"
                />
                <RibbonButton
                  icon={RotateCw}
                  label="Rehacer"
                  disabled
                  isPlaceholder
                  title="Próximamente · no hay historial local de rehacer"
                />
                <RibbonButton
                  icon={Copy}
                  label="Duplicar"
                  onClick={props.onDuplicate}
                  disabled={props.duplicateDisabled}
                  title={
                    props.duplicateDisabled
                      ? 'Seleccioná un nodo en el canvas'
                      : 'Duplicar selección'
                  }
                />
                <RibbonButton
                  icon={Trash2}
                  label="Eliminar"
                  onClick={props.onDelete}
                  disabled={props.deleteDisabled}
                  title={
                    props.deleteDisabled ? 'Seleccioná un nodo en el canvas' : 'Eliminar selección'
                  }
                />
              </RibbonGroup>
              <RibbonGroup label="Planificación">
                <RibbonButton
                  icon={GitBranch}
                  label="Vincular tareas"
                  title="Activa conexión en el lienzo de tareas"
                  disabled={props.editorTab !== 'canvas' || !props.vistaTareas}
                  onClick={props.onToggleConnectTareas}
                  pressed={props.connectTareasActive}
                />
                <RibbonButton
                  icon={GitBranch}
                  label="Camino crítico"
                  disabled
                  isPlaceholder
                  title="Se calcula con CPM en la vista de tareas (holgura 0)"
                />
                <RibbonButton
                  icon={LayoutGrid}
                  label="Línea base"
                  disabled
                  isPlaceholder
                  title="Próximamente"
                />
                <RibbonButton
                  icon={MousePointer2}
                  label="Duración"
                  disabled
                  isPlaceholder
                  title="Editá la duración en el inspector de la tarea"
                />
              </RibbonGroup>
              <RibbonGroup label="Visualización">
                <RibbonButton
                  icon={Filter}
                  label="Filtrar"
                  disabled
                  isPlaceholder
                  title="Próximamente"
                />
                <RibbonButton
                  icon={LayoutGrid}
                  label="Ordenar"
                  disabled
                  isPlaceholder
                  title="Próximamente"
                />
                <RibbonButton
                  icon={ZoomIn}
                  label="Zoom"
                  disabled
                  isPlaceholder
                  title="Usá los controles del lienzo (esquina) o la rueda del mouse"
                />
                <RibbonButton
                  icon={MousePointer2}
                  label="Ajustar"
                  disabled
                  isPlaceholder
                  title="Botón «Ajustar vista» en el lienzo de tareas"
                />
              </RibbonGroup>
            </>
          )}

          {ribbonTab === 'presupuestos' && (
            <RibbonGroup label="Presupuestos">
              <RibbonButton
                icon={LayoutGrid}
                label="Abrir pestaña"
                onClick={() => props.onEditorTab('presupuestos')}
              />
            </RibbonGroup>
          )}

          {ribbonTab === 'publicacion' && (
              <RibbonGroup label="Publicación">
                <RibbonButton
                  icon={Share2}
                  label="Publicar tareas"
                  onClick={props.onPublicar}
                  disabled={!props.canvasHydrated || !props.tieneNodosTarea}
                  title={
                    !props.tieneNodosTarea
                      ? 'Creá al menos una tarea para publicar'
                      : 'Abrir publicación de tareas operativas'
                  }
                />
                <RibbonButton
                  icon={Share2}
                  label="Revisar en canvas"
                  onClick={props.onPublicar}
                  disabled={!props.canvasHydrated || !props.tieneNodosTarea}
                  title="Abre el mismo flujo; usá la cinta Publicación para colores en nodos"
                />
                <RibbonButton
                  icon={CloudUpload}
                  label="Enviar paquete"
                  disabled
                  isPlaceholder
                  title="Próximamente"
                />
              </RibbonGroup>
          )}

          {ribbonTab === 'vista' && (
            <RibbonGroup label="Vista">
              <RibbonButton
                icon={LayoutGrid}
                label="Canvas"
                onClick={() => props.onEditorTab('canvas')}
              />
              <RibbonButton
                icon={LayoutGrid}
                label="Presupuestos"
                onClick={() => props.onEditorTab('presupuestos')}
              />
            </RibbonGroup>
          )}
        </div>

        {/* Acciones de contexto que antes estaban siempre visibles (etapas / subir) */}
        {props.editorTab === 'canvas' && (
          <div className="flex flex-wrap items-center gap-2 border-t border-[#e2e8f0] bg-white px-2 py-1.5">
            {props.vistaEtapas ? (
              <button
                type="button"
                onClick={props.onToggleConnectEtapas}
                className={cn(
                  'rounded border px-2 py-1 text-[11px] font-semibold',
                  props.connectEtapas
                    ? 'border-[#2563eb] bg-[#eff6ff] text-[#1d4ed8]'
                    : 'border-[#cbd5e1] bg-[#f8fafc] text-[#334155]',
                )}
              >
                {props.connectEtapas ? 'Listo · orden de fases' : 'Conectar orden de fases'}
              </button>
            ) : null}
            <button
              type="button"
              onClick={props.onGoUp}
              disabled={props.upDisabled}
              className="rounded border border-[#cbd5e1] bg-white px-2 py-1 text-[11px] font-semibold text-[#334155] disabled:opacity-40"
            >
              ← Subir nivel
            </button>
            <button
              type="button"
              onClick={props.onCreateChild}
              disabled={!props.puedeCrear}
              className="rounded bg-[#2563eb] px-2 py-1 text-[11px] font-semibold text-white disabled:opacity-40"
            >
              {props.labelBotonCrear}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function CanvasEditorStatusBar(props: {
  nivelLabel: string;
  modo: string;
  modoDetalle?: string;
  taskCount: number;
  publishedCount: number;
  unpublishedCount: number;
  criticalCount: number | null;
  zoomLabel?: string;
  /** Texto tipo "Guardado hace 12 s" si hay último OK */
  guardadoRelativo?: string | null;
}) {
  const modoFull = props.modoDetalle
    ? `${props.modo} · ${props.modoDetalle}`
    : props.modo;

  return (
    <div className="flex h-7 shrink-0 flex-wrap items-center gap-x-3 gap-y-0.5 border-t border-[#1e293b] bg-[#334155] px-2 text-[10px] font-medium text-slate-200">
      <span className="flex min-w-0 items-center gap-1">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
        <span className="truncate">
          Grows Build System · <span className="text-slate-100">Ready</span>
        </span>
      </span>
      <span className="text-slate-500">|</span>
      <span className="hidden sm:inline">
        Nivel: <span className="font-semibold text-white">{props.nivelLabel}</span>
      </span>
      <span className="text-slate-500 hidden sm:inline">|</span>
      <span className="max-w-[min(42vw,280px)] truncate">
        Modo: <span className="font-semibold text-white" title={modoFull}>
          {modoFull}
        </span>
      </span>
      <span className="text-slate-500">|</span>
      <span className="hidden md:inline">Tareas: {props.taskCount}</span>
      <span className="hidden lg:inline">Pub.: {props.publishedCount}</span>
      <span className="hidden lg:inline">Sin pub.: {props.unpublishedCount}</span>
      <span className="hidden xl:inline">Crít.: {props.criticalCount ?? '—'}</span>
      <span className="ml-auto flex shrink-0 items-center gap-2">
        {props.guardadoRelativo ? (
          <span className="hidden text-slate-300 sm:inline" title={props.guardadoRelativo}>
            {props.guardadoRelativo}
          </span>
        ) : null}
        <span>{props.zoomLabel ?? 'Zoom: —'}</span>
      </span>
    </div>
  );
}

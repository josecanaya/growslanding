'use client';

import { useMemo } from 'react';
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

export type EditorTab = 'archivo' | 'canvas' | 'presupuestos' | 'publicar' | 'cronograma';

export type RibbonMainTab = EditorTab;

type CloudUi = 'idle' | 'saving' | 'dirty';

export type CanvasEditorProChromeProps = {
  obraNombre: string;
  onObraNombreChange: (v: string) => void;
  /** Derivar etiqueta de guardado sin tocar el hook */
  cloudSaveState: string;
  cloudSaveMessage: string | null;
  editorTab: EditorTab;
  onEditorTab: (t: EditorTab) => void;
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
  onGoOrganizar?: () => void;
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
        'flex items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-1.5 text-[11px] font-semibold transition',
        isPlaceholder
          ? 'cursor-not-allowed border-dashed border-[#e2e8f0] bg-[#f8fafc] text-[#94a3b8] opacity-80 hover:border-[#e2e8f0] hover:bg-[#f8fafc] disabled:opacity-80'
          : 'text-[#334155] hover:border-[#cbd5e1] hover:bg-[#f8fafc] disabled:pointer-events-none disabled:opacity-40',
        !isPlaceholder && accent && !disabled && 'border-[#2563eb] bg-[#2563eb] text-white shadow-sm hover:bg-[#1d4ed8]',
        pressed && 'border-[#2563eb] bg-[#eff6ff] text-[#1d4ed8]',
      )}
    >
      <Icon className={cn('h-4 w-4', isPlaceholder ? 'text-[#94a3b8]' : accent && !disabled ? 'text-white' : 'text-[#475569]')} />
      <span className="max-w-[110px] truncate leading-tight">{label}</span>
    </button>
  );
}

function RibbonGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex shrink-0 flex-col justify-between border-r border-[#f1f5f9] px-2 last:border-r-0">
      <div className="flex flex-wrap gap-1">{children}</div>
      <span className="pt-1 text-left text-[9px] font-semibold uppercase tracking-tight text-[#94a3b8]">
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
  const savingBusy = props.cloudSaveState === 'saving' || props.proyectoBusy;
  const cloudUi = cloudUiFromState(props.cloudSaveState, savingBusy);
  const ribbonTab = props.editorTab;

  const guardadoLabel = useMemo(() => {
    if (cloudUi === 'saving') return 'Guardando…';
    if (cloudUi === 'dirty') return 'Revisar guardado';
    if (props.cloudSaveMessage && props.cloudSaveState === 'ok') return 'Guardado en la nube';
    return 'Guardado en la nube';
  }, [cloudUi, props.cloudSaveMessage, props.cloudSaveState]);

  const capaLabel = useMemo(() => {
    if (props.editorTab === 'archivo') return 'Archivo';
    if (props.editorTab === 'publicar') return 'Publicar';
    if (props.editorTab === 'cronograma') return 'Cronograma';
    if (props.editorTab === 'presupuestos') return 'Presupuestos';
    if (props.vistaTareas) return 'Tareas';
    if (props.vistaEtapas) return 'Obra / fases';
    if (props.childTypeToCreate === 'planta') return 'Fase / pisos';
    if (props.childTypeToCreate === 'sector') return 'Piso / sectores';
    if (props.childTypeToCreate === 'ambiente') return 'Departamento / ambientes';
    return props.nivelActualLabel;
  }, [props.childTypeToCreate, props.editorTab, props.nivelActualLabel, props.vistaEtapas, props.vistaTareas]);

  const mainTabs: { id: EditorTab; label: string }[] = [
    { id: 'archivo', label: 'Archivo' },
    { id: 'canvas', label: 'Organizar' },
    { id: 'presupuestos', label: 'Presupuestos' },
    { id: 'publicar', label: 'Publicar' },
    { id: 'cronograma', label: 'Cronograma' },
  ];

  return (
    <div className="flex shrink-0 flex-col border-b border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex min-h-12 items-center gap-3 px-3 py-2 text-[#0f172a]">
        <button
          type="button"
          onClick={props.onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#e5e7eb] bg-white text-[#475569] hover:bg-[#f8fafc] hover:text-[#0f172a]"
          title="Volver a obras"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-extrabold tracking-tight text-[#0f172a]">Grows</span>
        <div className="hidden min-w-0 flex-1 items-center gap-2 sm:flex">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#94a3b8]">Obra</span>
          <input
            className="min-w-0 max-w-md flex-1 truncate rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-[#0f172a] outline-none focus:border-[#bfdbfe] focus:bg-[#f8fafc]"
            value={props.obraNombre}
            aria-label="Nombre de la obra"
            onChange={(e) => props.onObraNombreChange(e.target.value)}
          />
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-[#e5e7eb] bg-[#f8fafc] px-3 py-1 text-[11px] text-[#475569] md:flex">
          <span className="font-semibold text-[#0f172a]">{capaLabel}</span>
          <span className="text-[#cbd5e1]">·</span>
          <span>{props.vistaLabel}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-white px-3 py-1 text-[11px] text-[#475569]">
          {cloudUi === 'saving' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#2563eb]" />
          ) : cloudUi === 'dirty' ? (
            <Cloud className="h-3.5 w-3.5 text-amber-500" />
          ) : (
            <Cloud className="h-3.5 w-3.5 text-emerald-600" />
          )}
          <span className="font-medium">{guardadoLabel}</span>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            className="rounded-lg p-1.5 text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
            title="Notificaciones"
            onClick={() => router.push('/cliente/notificaciones' as Route)}
          >
            <Bell className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-lg p-1.5 text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
            title="Cuenta y configuración"
            onClick={() => router.push('/cliente/cuenta' as Route)}
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-lg p-1.5 text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
            title="Ayuda"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
        <div className="hidden max-w-[200px] truncate border-l border-[#e5e7eb] pl-3 text-[11px] text-[#64748b] lg:block">
          {props.userLabel}
        </div>
      </div>

      <div className="bg-white">
        <div className="flex border-y border-[#f1f5f9] px-2 pt-1">
          {mainTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => props.onEditorTab(t.id)}
              className={cn(
                'relative rounded-t-lg px-3 py-1.5 text-xs font-semibold transition',
                ribbonTab === t.id ? 'bg-[#f8fafc] text-[#0f172a]' : 'text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a]',
              )}
            >
              {t.label}
              {ribbonTab === t.id ? (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[#2563eb]" />
              ) : null}
            </button>
          ))}
        </div>
        <div className="flex min-h-[54px] flex-wrap items-end gap-y-1 overflow-x-auto px-2 py-2">
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
                  title="Importar Project XML al canvas"
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

          {ribbonTab === 'canvas' && (
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
                icon={FolderPlus}
                label="Crear grupo"
                disabled
                isPlaceholder
                title="Usá el panel de presupuestos para crear grupos"
              />
              <RibbonButton
                icon={LayoutGrid}
                label="Abrir grupo"
                disabled
                isPlaceholder
                title="Seleccioná un grupo en el panel lateral"
              />
              <RibbonButton
                icon={CloudUpload}
                label="Enviar grupo"
                disabled
                isPlaceholder
                title="Enviá desde el detalle del grupo seleccionado"
              />
            </RibbonGroup>
          )}

          {ribbonTab === 'publicar' && (
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
                icon={Filter}
                label="Ver incompletas"
                onClick={props.onPublicar}
                disabled={!props.canvasHydrated || !props.tieneNodosTarea}
                title="Abrir asistente de publicación"
              />
              <RibbonButton
                icon={LayoutGrid}
                label="Organizar"
                onClick={props.onGoOrganizar ?? (() => props.onEditorTab('canvas'))}
                title="Volver al canvas jerárquico"
              />
            </RibbonGroup>
          )}

          {ribbonTab === 'cronograma' && (
            <RibbonGroup label="Cronograma">
              <RibbonButton icon={LayoutGrid} label="Semana" disabled isPlaceholder title="Vista activa: semana" />
              <RibbonButton icon={Filter} label="Solo publicadas" disabled isPlaceholder title="Usá el filtro en la vista" />
              <RibbonButton
                icon={GitBranch}
                label="Críticas"
                disabled
                isPlaceholder
                title="Usá el filtro en la vista"
              />
              <RibbonButton
                icon={LayoutGrid}
                label="Agrupar"
                disabled
                isPlaceholder
                title="Usá el control de agrupación en la vista"
              />
            </RibbonGroup>
          )}
        </div>

        {/* Acciones de contexto que antes estaban siempre visibles (etapas / subir) */}
        {props.editorTab === 'canvas' && ribbonTab === 'canvas' && (
          <div className="flex flex-wrap items-center gap-2 border-t border-[#f1f5f9] bg-[#fbfdff] px-3 py-2">
            {props.vistaEtapas ? (
              <button
                type="button"
                onClick={props.onToggleConnectEtapas}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-[11px] font-semibold',
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
              className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#334155] hover:bg-[#f8fafc] disabled:opacity-40"
            >
              ← Subir nivel
            </button>
            <button
              type="button"
              onClick={props.onCreateChild}
              disabled={!props.puedeCrear}
              className="rounded-lg bg-[#2563eb] px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-[#1d4ed8] disabled:opacity-40"
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
    <div className="flex h-7 shrink-0 flex-wrap items-center gap-x-3 gap-y-0.5 border-t border-[#e5e7eb] bg-white px-3 text-[10px] font-medium text-[#64748b]">
      <span className="flex min-w-0 items-center gap-1">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
        <span className="truncate">
          Grows Canvas · <span className="text-[#0f172a]">Ready</span>
        </span>
      </span>
      <span className="text-[#cbd5e1]">|</span>
      <span className="hidden sm:inline">
        Nivel: <span className="font-semibold text-[#0f172a]">{props.nivelLabel}</span>
      </span>
      <span className="hidden text-[#cbd5e1] sm:inline">|</span>
      <span className="max-w-[min(42vw,280px)] truncate">
        Modo: <span className="font-semibold text-[#0f172a]" title={modoFull}>
          {modoFull}
        </span>
      </span>
      <span className="text-[#cbd5e1]">|</span>
      <span className="hidden md:inline">Tareas: {props.taskCount}</span>
      <span className="hidden lg:inline">Pub.: {props.publishedCount}</span>
      <span className="hidden lg:inline">Sin pub.: {props.unpublishedCount}</span>
      <span className="hidden xl:inline">Crít.: {props.criticalCount ?? '—'}</span>
      <span className="ml-auto flex shrink-0 items-center gap-2">
        {props.guardadoRelativo ? (
          <span className="hidden text-[#64748b] sm:inline" title={props.guardadoRelativo}>
            {props.guardadoRelativo}
          </span>
        ) : null}
        <span>{props.zoomLabel ?? 'Zoom: —'}</span>
      </span>
    </div>
  );
}

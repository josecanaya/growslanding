'use client';

/**
 * Pantalla 2 — «Armá el plan».
 * Absorbe fases + orden + presupuesto + asignar en un workspace único con dos vistas:
 *  - «Plan por fases»: canvas timeline (read-only) + panel de edición de fases/dependencias.
 *  - «Paquetes y contratistas»: canvas de grupos de presupuesto + asignación inline.
 * Los defaults ya vienen armados (fase inferida, paquetes sugeridos): el usuario corrige.
 */

import { useMemo, useState } from 'react';
import { AlertTriangle, GitBranch, Package, RotateCcw } from 'lucide-react';

import type {
  ObraCheckBlock,
  ObraCheckBudgetGroup,
  ObraCheckContact,
  ObraCheckTask,
  ObraCheckWarning,
  OrdenarResult,
} from '@/lib/obra-check/types';
import { BRAND, OCButton, OCCard, ScreenHeader, StickyActionBar } from './ui';
import { ObraCheckCanvasView } from './ObraCheckCanvasView';
import { PanelFases } from './PanelFases';
import { PanelAsignar, type Assignments } from './PanelAsignar';
import { BudgetGroupsFlowCanvas } from './budget-groups/BudgetGroupsFlowCanvas';
import { blocksFromGroups } from './budget-groups/buildDefaultHierarchy';

type Vista = 'plan' | 'paquetes';

export function ScreenArmar({
  tasks,
  blocks,
  budgetGroups,
  cpm,
  warnings,
  assignments,
  contacts,
  applyingFases,
  onApplyFases,
  onTasksChange,
  onBudgetGroupsChange,
  onAssignmentsChange,
  onContactsChange,
  onContinue,
  continueBusy,
  continueError,
}: {
  tasks: ObraCheckTask[];
  blocks: ObraCheckBlock[];
  budgetGroups: ObraCheckBudgetGroup[];
  cpm: OrdenarResult['cpm'];
  warnings: ObraCheckWarning[];
  assignments: Assignments;
  contacts: ObraCheckContact[];
  applyingFases: boolean;
  onApplyFases: (tasks: ObraCheckTask[]) => void;
  /** Cambios de cantidad/unidad (no re-ordenan). `persist` = guardar en server. */
  onTasksChange: (tasks: ObraCheckTask[], persist: boolean) => void;
  onBudgetGroupsChange: (groups: ObraCheckBudgetGroup[]) => void;
  onAssignmentsChange: (a: Assignments) => void;
  onContactsChange: (c: ObraCheckContact[]) => void;
  onContinue: () => void;
  continueBusy: boolean;
  continueError: string | null;
}) {
  const [vista, setVista] = useState<Vista>('plan');

  const draftBlocks = useMemo(() => blocksFromGroups(blocks, budgetGroups), [blocks, budgetGroups]);
  const subgroups = budgetGroups.filter((g) => g.kind === 'subgrupo' || g.parentId);
  const allBlocksGrouped = blocks.every((b) => subgroups.some((s) => s.blockIds.includes(b.id)));
  const assignedCount = Object.keys(assignments).length;
  const sinCantidad = tasks.filter((t) => t.cantidad == null || !(t.cantidad > 0)).length;
  const cantidadesOk = sinCantidad === 0;
  const canContinue = allBlocksGrouped && assignedCount > 0 && cantidadesOk && !continueBusy;

  const chips = [
    { label: `${tasks.length} tareas` },
    { label: `${blocks.length} paquetes` },
    ...(cpm.duracionTotalDias > 0 ? [{ label: `${cpm.duracionTotalDias} días de plan` }] : []),
    ...(cpm.tareasCriticas > 0
      ? [{ label: `${cpm.tareasCriticas} críticas`, tone: 'gold' as const }]
      : []),
    ...(assignedCount > 0
      ? [{ label: `${assignedCount} grupo(s) con contratista`, tone: 'green' as const }]
      : []),
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <ScreenHeader
        title="Así ordenó Grows tu obra"
        subtitle="Primero revisá y ordená las fases y cargá la cantidad de cada tarea. Después armá los paquetes y asigná un contratista. Nada es definitivo: podés corregir todo acá."
        chips={chips}
      />

      {/* Toggle de vista */}
      <div className="mb-4 inline-flex rounded-xl p-1" style={{ background: BRAND.gray, border: `1px solid ${BRAND.border}` }}>
        {(
          [
            ['plan', 'Plan por fases', GitBranch],
            ['paquetes', 'Paquetes y contratistas', Package],
          ] as const
        ).map(([v, label, Icon]) => (
          <button
            key={v}
            onClick={() => setVista(v)}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all"
            style={{
              background: vista === v ? '#fff' : 'transparent',
              color: vista === v ? BRAND.blue : BRAND.muted,
              boxShadow: vista === v ? '0 1px 4px rgba(12,29,54,0.12)' : 'none',
            }}
          >
            <Icon size={15} style={{ color: vista === v ? BRAND.gold : BRAND.muted }} />
            {label}
            {v === 'paquetes' && assignedCount > 0 && (
              <span
                className="ml-1 rounded-full px-1.5 text-[10px] font-bold"
                style={{ background: BRAND.green, color: '#fff' }}
              >
                {assignedCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {vista === 'plan' && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0">
            <ObraCheckCanvasView tasks={tasks} />
            {warnings.length > 0 && (
              <OCCard className="mt-3" style={{ background: '#FFFDF5', borderColor: BRAND.gold }}>
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} style={{ color: BRAND.gold, marginTop: 2 }} />
                  <div className="space-y-1 text-xs" style={{ color: BRAND.text }}>
                    {warnings.map((w, i) => (
                      <p key={i}>{w.message}</p>
                    ))}
                  </div>
                </div>
              </OCCard>
            )}
          </div>
          <OCCard className="h-fit max-h-[640px] overflow-y-auto lg:sticky lg:top-4">
            <p className="mb-1 text-sm font-bold" style={{ color: BRAND.blue }}>
              Fases, dependencias y cantidades
            </p>
            <PanelFases
              tasks={tasks}
              onApply={onApplyFases}
              applying={applyingFases}
              onTasksChange={onTasksChange}
            />
          </OCCard>
        </div>
      )}

      {vista === 'paquetes' && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0">
            <OCCard className="!p-3">
              <p className="mb-2 px-1 text-xs" style={{ color: BRAND.muted }}>
                Cada columna es una fase. Arrastrá paquetes entre subgrupos para armar los
                presupuestos como los quieras pedir.
              </p>
              <BudgetGroupsFlowCanvas
                groups={budgetGroups}
                blocks={blocks}
                tasks={tasks}
                onChange={onBudgetGroupsChange}
              />
            </OCCard>
          </div>
          <OCCard className="h-fit max-h-[640px] overflow-y-auto lg:sticky lg:top-4">
            <p className="mb-1 text-sm font-bold" style={{ color: BRAND.blue }}>
              Contratista por grupo
            </p>
            <PanelAsignar
              blocks={draftBlocks}
              budgetGroups={budgetGroups}
              assignments={assignments}
              contacts={contacts}
              onAssignmentsChange={onAssignmentsChange}
              onContactsChange={onContactsChange}
            />
          </OCCard>
        </div>
      )}

      {continueError && (
        <p className="mt-3 rounded-lg p-2.5 text-sm" style={{ background: '#FEF2F2', color: BRAND.error }}>
          {continueError}
        </p>
      )}

      <StickyActionBar
        hint={
          sinCantidad > 0 ? (
            <span>
              Cargá la cantidad (m², etc.) en{' '}
              <button className="font-semibold underline" onClick={() => setVista('plan')}>
                Plan por fases
              </button>{' '}
              — faltan {sinCantidad} tarea(s).
            </span>
          ) : !allBlocksGrouped ? (
            'Hay paquetes sin subgrupo en «Paquetes y contratistas».'
          ) : assignedCount === 0 ? (
            <span>
              Asigná al menos un contratista en{' '}
              <button className="font-semibold underline" onClick={() => setVista('paquetes')}>
                Paquetes y contratistas
              </button>
              .
            </span>
          ) : (
            `${assignedCount} grupo(s) listos para enviar`
          )
        }
      >
        <OCButton
          variant="ghost"
          size="sm"
          onClick={() => {
            if (window.confirm('¿Empezar de nuevo? Se pierde el plan actual.')) window.location.reload();
          }}
        >
          <RotateCcw size={13} /> Empezar de nuevo
        </OCButton>
        <OCButton size="lg" onClick={onContinue} loading={continueBusy} disabled={!canContinue}>
          Continuar al envío →
        </OCButton>
      </StickyActionBar>
    </div>
  );
}

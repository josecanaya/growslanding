'use client';

/**
 * Wizard de Obra Check — 3 pantallas: Cargar → Armar → Enviar.
 *
 * Los defaults hacen el trabajo: al continuar desde la carga se encadena
 * session → saveTasks (con fase inferida) → ordenar → jerarquía de paquetes por defecto,
 * sin pantallas intermedias. En «Armar» el usuario corrige (fases, paquetes, contratistas)
 * y en «Enviar» genera los links de WhatsApp; el cierre (email + CTA a Grows) es una card
 * al final del envío, no una pantalla aparte.
 */

import { useState } from 'react';

import { obraCheckApi } from '@/lib/obra-check/client';
import { inferPhaseFor } from '@/lib/obra-check/phases';
import type {
  ObraCheckBlock,
  ObraCheckBudgetGroup,
  ObraCheckContact,
  ObraCheckTask,
  ObraCheckWarning,
  OrdenarResult,
} from '@/lib/obra-check/types';
import { BRAND, StepBar } from './ui';
import { ScreenCarga, type CargaSubmit } from './ScreenCarga';
import { ScreenArmar } from './ScreenArmar';
import { StepEnvio } from './StepEnvio';
import { CierreCard } from './CierreCard';
import { ScreenHeader } from './ui';
import type { Assignments } from './PanelAsignar';
import { buildDefaultHierarchy } from './budget-groups/buildDefaultHierarchy';

type Step = 'carga' | 'armar' | 'enviar';
const STEP_INDEX: Record<Step, number> = { carga: 0, armar: 1, enviar: 2 };

/** Merge defensivo de fase (por si la columna aún no existe server-side). */
function mergeFases(result: OrdenarResult, source: ObraCheckTask[]): OrdenarResult {
  const bySource = new Map(source.map((t) => [t.id, t]));
  const tasks = result.tasks.map((task) => ({
    ...task,
    fase: task.fase ?? bySource.get(task.id)?.fase ?? null,
  }));
  const blocks = result.blocks.map((block) => ({
    ...block,
    fase: block.fase ?? tasks.find((t) => block.taskIds.includes(t.id))?.fase ?? null,
  }));
  return { ...result, tasks, blocks };
}

/** Intenta conservar asignaciones tras re-ordenar, matcheando grupos por fase+nombre. */
function preserveAssignments(
  prev: Assignments,
  prevGroups: ObraCheckBudgetGroup[],
  nextGroups: ObraCheckBudgetGroup[],
): Assignments {
  const keyOf = (g: ObraCheckBudgetGroup, all: ObraCheckBudgetGroup[]) => {
    const parent = all.find((p) => p.id === g.parentId);
    return `${parent?.nombre ?? ''}::${g.nombre}`;
  };
  const prevByKey = new Map<string, string>();
  for (const g of prevGroups) {
    const contactId = prev[g.id];
    if (contactId) prevByKey.set(keyOf(g, prevGroups), contactId);
  }
  const next: Assignments = {};
  for (const g of nextGroups) {
    if (g.kind === 'fase' && !g.parentId) continue;
    const contactId = prevByKey.get(keyOf(g, nextGroups));
    if (contactId) next[g.id] = contactId;
  }
  return next;
}

export function ObraCheckWizard() {
  const [step, setStep] = useState<Step>('carga');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [tipoObra, setTipoObra] = useState<string>('');
  const [tasks, setTasks] = useState<ObraCheckTask[]>([]);
  const [blocks, setBlocks] = useState<ObraCheckBlock[]>([]);
  const [budgetGroups, setBudgetGroups] = useState<ObraCheckBudgetGroup[]>([]);
  const [cpm, setCpm] = useState<OrdenarResult['cpm']>({ duracionTotalDias: 0, tareasCriticas: 0 });
  const [warnings, setWarnings] = useState<ObraCheckWarning[]>([]);
  const [assignments, setAssignments] = useState<Assignments>({});
  const [contacts, setContacts] = useState<ObraCheckContact[]>([]);
  const [enviados, setEnviados] = useState(0);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Carga → Armar: crea sesión, guarda tareas con fase inferida y ordena, en una sola espera. */
  async function handleCargaSubmit(data: CargaSubmit) {
    setBusy(true);
    setError(null);
    try {
      const { sessionId: sid } = await obraCheckApi.createSession({
        email: data.email,
        empresa: data.empresa || undefined,
        tipoObra: data.tipoObra || undefined,
        consentProcesamiento: true,
        consentPatrones: data.consentPatrones,
      });
      setSessionId(sid);
      setTipoObra(data.tipoObra);

      const withFase = data.tasks.map((t) => ({
        ...t,
        fase: t.fase ?? inferPhaseFor(t.nombre, t.rubro),
      }));
      await obraCheckApi.saveTasks(withFase);
      const result = mergeFases(await obraCheckApi.ordenar(), withFase);

      const groups = buildDefaultHierarchy(result.blocks);
      setTasks(result.tasks);
      setBlocks(result.blocks);
      setCpm(result.cpm);
      setWarnings(result.warnings);
      setBudgetGroups(groups);
      setAssignments({});
      setStep('armar');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  /** Edición de fases aplicada: re-ordena y rearma paquetes preservando asignaciones por nombre. */
  async function handleApplyFases(nextTasks: ObraCheckTask[]) {
    setBusy(true);
    setError(null);
    try {
      await obraCheckApi.saveTasks(nextTasks);
      const result = mergeFases(await obraCheckApi.ordenar(), nextTasks);
      const nextGroups = buildDefaultHierarchy(result.blocks);
      setAssignments((prev) => preserveAssignments(prev, budgetGroups, nextGroups));
      setTasks(result.tasks);
      setBlocks(result.blocks);
      setCpm(result.cpm);
      setWarnings(result.warnings);
      setBudgetGroups(nextGroups);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  /** Armar → Enviar: persiste la jerarquía de paquetes definitiva. */
  async function handleArmarContinue() {
    setBusy(true);
    setError(null);
    try {
      const cleaned = budgetGroups
        .filter((g) => g.nombre.trim())
        .map((g) => ({
          ...g,
          blockIds: g.kind === 'subgrupo' || g.parentId ? g.blockIds : [],
        }));
      await obraCheckApi.saveBudgetGroups(cleaned);
      setStep('enviar');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`mx-auto px-4 py-6 sm:py-8 ${step === 'armar' ? 'max-w-6xl' : 'max-w-3xl'}`}>
      <StepBar current={STEP_INDEX[step]} />

      {step === 'carga' && (
        <ScreenCarga onSubmit={(d) => void handleCargaSubmit(d)} submitting={busy} submitError={error} />
      )}

      {step === 'armar' && (
        <ScreenArmar
          tasks={tasks}
          blocks={blocks}
          budgetGroups={budgetGroups}
          cpm={cpm}
          warnings={warnings}
          assignments={assignments}
          contacts={contacts}
          applyingFases={busy}
          onApplyFases={(t) => void handleApplyFases(t)}
          onBudgetGroupsChange={setBudgetGroups}
          onAssignmentsChange={setAssignments}
          onContactsChange={setContacts}
          onContinue={() => void handleArmarContinue()}
          continueBusy={busy}
          continueError={error}
        />
      )}

      {step === 'enviar' && (
        <div className="mx-auto max-w-2xl">
          <ScreenHeader
            title="Enviá cada grupo por WhatsApp"
            subtitle="Generás el link, lo compartís desde tu número y la respuesta del contratista llega sola a tu bandeja."
          />
          <StepEnvio
            blocks={blocks}
            budgetGroups={budgetGroups}
            assignments={assignments}
            contacts={contacts}
            tasks={tasks}
            onTasksChange={setTasks}
            onSentCountChange={setEnviados}
          />
          <CierreCard
            active={enviados > 0}
            sessionId={sessionId}
            enviados={enviados}
            contratistas={new Set(Object.values(assignments)).size}
            duracionDias={cpm.duracionTotalDias}
            tareasCriticas={cpm.tareasCriticas}
            totalTareas={tasks.length}
          />
          <div className="mt-4 text-center">
            <button
              className="text-xs font-medium underline-offset-2 hover:underline"
              style={{ color: BRAND.muted }}
              onClick={() => setStep('armar')}
            >
              ← Volver a armar el plan
            </button>
          </div>
        </div>
      )}

      <p className="mt-8 text-center text-[11px]" style={{ color: BRAND.muted }}>
        Grows Obra Check · {tipoObra ? `Obra: ${tipoObra} · ` : ''}Herramienta gratuita
      </p>
    </div>
  );
}

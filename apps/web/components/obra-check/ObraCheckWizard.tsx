'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

import { obraCheckApi } from '@/lib/obra-check/client';
import type {
  ObraCheckBlock,
  ObraCheckBudgetGroup,
  ObraCheckContact,
  ObraCheckTask,
  ObraCheckWarning,
  OrdenarResult,
} from '@/lib/obra-check/types';
import { BRAND, OCButton, OCCard, StepBar } from './ui';
import { StepIntro } from './StepIntro';
import { StepCarga } from './StepCarga';
import { ObraCheckCanvasView } from './ObraCheckCanvasView';
import { StepAsignar, type Assignments } from './StepAsignar';
import { StepEnvio } from './StepEnvio';
import { StepUpsell } from './StepUpsell';
import { StepFases } from './StepFases';
import { StepBudgetGroups } from './StepBudgetGroups';

type Step = 'intro' | 'carga' | 'fases' | 'orden' | 'presupuesto' | 'asignar' | 'envio' | 'upsell';
const STEP_INDEX: Record<Step, number> = {
  intro: 0,
  carga: 1,
  fases: 2,
  orden: 3,
  presupuesto: 4,
  asignar: 5,
  envio: 6,
  upsell: 6,
};

export function ObraCheckWizard() {
  const [step, setStep] = useState<Step>('intro');
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
  const [busyOrdenar, setBusyOrdenar] = useState(false);
  const [errorOrdenar, setErrorOrdenar] = useState<string | null>(null);

  function onOrdered(result: OrdenarResult) {
    setTasks(result.tasks);
    setBlocks(result.blocks);
    setCpm(result.cpm);
    setWarnings(result.warnings);
    setStep('orden');
  }

  async function handleFasesContinue(nextTasks: ObraCheckTask[]) {
    setTasks(nextTasks);
    setBusyOrdenar(true);
    setErrorOrdenar(null);
    try {
      await obraCheckApi.saveTasks(nextTasks);
      const result = await obraCheckApi.ordenar();
      // La fase ya viene persistida y vuelve desde ordenar; merge defensivo por si la columna aún no existe.
      const mergedTasks = result.tasks.map((task) => ({
        ...task,
        fase: task.fase ?? nextTasks.find((t) => t.id === task.id)?.fase ?? null,
      }));
      const mergedBlocks = result.blocks.map((block) => ({
        ...block,
        fase:
          block.fase ??
          mergedTasks.find((task) => block.taskIds.includes(task.id))?.fase ??
          null,
      }));
      onOrdered({ ...result, tasks: mergedTasks, blocks: mergedBlocks });
    } catch (e) {
      setErrorOrdenar((e as Error).message);
    } finally {
      setBusyOrdenar(false);
    }
  }

  return (
    <div className={`mx-auto px-4 ${step === 'intro' ? 'max-w-3xl py-6 sm:py-10' : 'max-w-4xl py-8'}`}>
      {step !== 'intro' && step !== 'upsell' && <StepBar current={STEP_INDEX[step]} />}

      {step === 'intro' && (
        <StepIntro
          onReady={(sid, tipo) => {
            setSessionId(sid);
            setTipoObra(tipo);
            setStep('carga');
          }}
        />
      )}

      {step === 'carga' && (
        <StepCarga
          onContinue={(preparedTasks) => {
            setTasks(preparedTasks);
            setStep('fases');
          }}
          tipoObra={tipoObra}
        />
      )}

      {step === 'fases' && (
        <div>
          <StepFases
            tasks={tasks}
            onBack={() => setStep('carga')}
            onContinue={(nextTasks) => void handleFasesContinue(nextTasks)}
          />
          {busyOrdenar && (
            <p className="mt-3 text-center text-sm" style={{ color: BRAND.muted }}>
              Ordenando plan…
            </p>
          )}
          {errorOrdenar && (
            <p className="mt-3 text-center text-sm" style={{ color: BRAND.error }}>
              {errorOrdenar}
            </p>
          )}
        </div>
      )}

      {step === 'orden' && (
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-1 text-xl font-bold" style={{ color: BRAND.blue }}>
            Así ordenó Grows tu obra
          </h2>
          <p className="mb-4 text-sm" style={{ color: BRAND.muted }}>
            {blocks.length} paquetes · {tasks.length} tareas · {cpm.tareasCriticas} en camino crítico
            {cpm.duracionTotalDias > 0 && ` · ${cpm.duracionTotalDias} días`} — agrupado en 4 fases
          </p>
          <p className="mb-3 text-xs" style={{ color: BRAND.muted }}>
            Las flechas unen <strong>tareas</strong> (no solo fases). Si falta alguna, volvé a Fases y usá
            «Depende» o «Encadenar en orden».
          </p>

          <ObraCheckCanvasView tasks={tasks} />

          {warnings.length > 0 && (
            <OCCard className="mt-4" style={{ background: '#FFFDF5', borderColor: BRAND.gold }}>
              <div className="flex items-start gap-2">
                <AlertTriangle size={18} style={{ color: BRAND.gold, marginTop: 2 }} />
                <div className="space-y-1 text-sm" style={{ color: BRAND.text }}>
                  {warnings.map((w, i) => (
                    <p key={i}>{w.message}</p>
                  ))}
                </div>
              </div>
            </OCCard>
          )}

          {errorOrdenar && (
            <OCCard className="mt-4" style={{ borderColor: BRAND.error }}>
              <p className="text-sm" style={{ color: BRAND.error }}>
                {errorOrdenar}
              </p>
            </OCCard>
          )}

          <div className="mt-5 flex justify-between">
            <OCButton variant="ghost" onClick={() => setStep('fases')}>
              ← Volver a fases
            </OCButton>
            <OCButton onClick={() => setStep('presupuesto')} loading={busyOrdenar}>
              Crear grupos de presupuesto →
            </OCButton>
          </div>
        </div>
      )}

      {step === 'presupuesto' && (
        <StepBudgetGroups
          blocks={blocks}
          tasks={tasks}
          onBack={() => setStep('orden')}
          onContinue={async (groups, nextBlocks) => {
            await obraCheckApi.saveBudgetGroups(groups);
            setBudgetGroups(groups);
            setBlocks(nextBlocks);
            setStep('asignar');
          }}
        />
      )}

      {step === 'asignar' && (
        <StepAsignar
          blocks={blocks}
          budgetGroups={budgetGroups}
          onContinue={(a, c) => {
            setAssignments(a);
            setContacts(c);
            setStep('envio');
          }}
        />
      )}

      {step === 'envio' && (
        <StepEnvio
          blocks={blocks}
          budgetGroups={budgetGroups}
          assignments={assignments}
          contacts={contacts}
          onFinish={(n) => {
            setEnviados(n);
            setStep('upsell');
          }}
        />
      )}

      {step === 'upsell' && (
        <StepUpsell
          sessionId={sessionId}
          enviados={enviados}
          contratistas={new Set(Object.values(assignments)).size}
          duracionDias={cpm.duracionTotalDias}
          tareasCriticas={cpm.tareasCriticas}
          totalTareas={tasks.length}
        />
      )}

      {step !== 'intro' && (
        <p className="mt-8 text-center text-[11px]" style={{ color: BRAND.muted }}>
          Grows Obra Check · {tipoObra ? `Obra: ${tipoObra} · ` : ''}Herramienta gratuita
        </p>
      )}
    </div>
  );
}

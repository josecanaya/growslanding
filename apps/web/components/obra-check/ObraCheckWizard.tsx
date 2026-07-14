'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

import type { ObraCheckBlock, ObraCheckContact, ObraCheckTask, ObraCheckWarning, OrdenarResult } from '@/lib/obra-check/types';
import { BRAND, OCButton, OCCard, StepBar } from './ui';
import { StepIntro } from './StepIntro';
import { StepCarga } from './StepCarga';
import { ObraCheckCanvasView } from './ObraCheckCanvasView';
import { StepAsignar, type Assignments } from './StepAsignar';
import { StepEnvio } from './StepEnvio';
import { StepUpsell } from './StepUpsell';

type Step = 'intro' | 'carga' | 'orden' | 'asignar' | 'envio' | 'upsell';
const STEP_INDEX: Record<Step, number> = { intro: 0, carga: 1, orden: 2, asignar: 3, envio: 4, upsell: 4 };

export function ObraCheckWizard() {
  const [step, setStep] = useState<Step>('intro');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [tipoObra, setTipoObra] = useState<string>('');
  const [tasks, setTasks] = useState<ObraCheckTask[]>([]);
  const [blocks, setBlocks] = useState<ObraCheckBlock[]>([]);
  const [cpm, setCpm] = useState<OrdenarResult['cpm']>({ duracionTotalDias: 0, tareasCriticas: 0 });
  const [warnings, setWarnings] = useState<ObraCheckWarning[]>([]);
  const [assignments, setAssignments] = useState<Assignments>({});
  const [contacts, setContacts] = useState<ObraCheckContact[]>([]);
  const [enviados, setEnviados] = useState(0);

  function onOrdered(result: OrdenarResult) {
    setTasks(result.tasks);
    setBlocks(result.blocks);
    setCpm(result.cpm);
    setWarnings(result.warnings);
    setStep('orden');
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
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

      {step === 'carga' && <StepCarga onOrdered={onOrdered} tipoObra={tipoObra} />}

      {step === 'orden' && (
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-1 text-xl font-bold" style={{ color: BRAND.blue }}>
            Así ordenó Grows tu obra
          </h2>
          <p className="mb-4 text-sm" style={{ color: BRAND.muted }}>
            {blocks.length} bloques · {tasks.length} tareas · {cpm.tareasCriticas} en camino crítico
            {cpm.duracionTotalDias > 0 && ` · ${cpm.duracionTotalDias} días de duración`}
          </p>

          <ObraCheckCanvasView tasks={tasks} blocks={blocks} />

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

          <div className="mt-5 flex justify-between">
            <OCButton variant="ghost" onClick={() => setStep('carga')}>
              ← Volver
            </OCButton>
            <OCButton onClick={() => setStep('asignar')}>Asignar contratistas →</OCButton>
          </div>
        </div>
      )}

      {step === 'asignar' && (
        <StepAsignar
          blocks={blocks}
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

      <p className="mt-8 text-center text-[11px]" style={{ color: BRAND.muted }}>
        Grows Obra Check · {tipoObra ? `Obra: ${tipoObra} · ` : ''}Herramienta gratuita
      </p>
    </div>
  );
}

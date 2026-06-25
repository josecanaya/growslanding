/** Genera Project XML (MSP) para templates lineales: 1 etapa + tareas encadenadas FS. */

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

type TaskBlockOpts = {
  uid: number;
  outline: string;
  name: string;
  summary: boolean;
  outlineLevel?: number;
  predecessorUid?: number;
  durationDays?: number;
};

function durationIso(days: number): string {
  const d = Math.max(1, Math.round(days));
  return `P${d}DT0H0M0S`;
}

function taskBlock(opts: TaskBlockOpts): string {
  const lvl = opts.outlineLevel ?? opts.outline.split('.').length;
  const pred =
    opts.predecessorUid != null
      ? `<PredecessorLink><PredecessorUID>${opts.predecessorUid}</PredecessorUID><Type>1</Type></PredecessorLink>`
      : '';
  const dur = durationIso(opts.durationDays ?? 1);
  return `<Task>
<UID>${opts.uid}</UID>
<ID>${opts.uid}</ID>
<Name>${escapeXml(opts.name)}</Name>
<OutlineNumber>${opts.outline}</OutlineNumber>
<OutlineLevel>${lvl}</OutlineLevel>
<Summary>${opts.summary ? '1' : '0'}</Summary>
<Duration>${dur}</Duration>
<PercentComplete>0</PercentComplete>
${pred}
</Task>`;
}

const MSP_STUB_UID = 9001;

export { MSP_STUB_UID };

export type PlanDurationPreset = 'trabajo_comun' | 'casa' | 'edificio' | 'reforma';

export function durationDaysForTaskIndex(preset: PlanDurationPreset, index: number, total: number): number {
  const t = Math.max(1, total);
  const i = Math.max(0, index);
  if (preset === 'trabajo_comun') return Math.min(5, Math.max(1, 1 + Math.floor((i * 4) / t)));
  if (preset === 'casa' || preset === 'reforma') return Math.min(30, Math.max(3, 3 + Math.floor((i * 27) / t)));
  return Math.min(90, Math.max(10, 10 + Math.floor((i * 80) / t)));
}

/**
 * Plan simple Grows: etapa resumen en outline `1`, tareas en `1.1`…`1.n` con precedencias FS.
 * Incluye stub nivel-1 (`101`) para evitar collapsedRoot del parser MSP.
 */
export function buildSimpleLinearPlanTemplateXml(input: {
  projectTitle: string;
  etapaTitle: string;
  taskTitles: string[];
  durationPreset?: PlanDurationPreset;
  durationDaysPerTask?: number[];
}): string {
  const etapaUid = 1;
  const blocks: string[] = [];
  blocks.push(
    taskBlock({
      uid: etapaUid,
      outline: '1',
      name: input.etapaTitle,
      summary: true,
    }),
  );
  blocks.push(
    taskBlock({
      uid: MSP_STUB_UID,
      outline: '101',
      name: '—',
      summary: false,
      outlineLevel: 1,
    }),
  );

  const preset = input.durationPreset ?? 'trabajo_comun';
  const total = input.taskTitles.length;

  let prevLeafUid: number | undefined;
  input.taskTitles.forEach((title, index) => {
    const uid = index + 2;
    const durationDays =
      input.durationDaysPerTask?.[index] ??
      durationDaysForTaskIndex(preset, index, total);
    blocks.push(
      taskBlock({
        uid,
        outline: `1.${index + 1}`,
        name: title,
        summary: false,
        predecessorUid: prevLeafUid,
        durationDays,
      }),
    );
    prevLeafUid = uid;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<Project xmlns="http://schemas.microsoft.com/project">
<Title>${escapeXml(input.projectTitle)}</Title>
${blocks.join('\n')}
</Project>`;
}

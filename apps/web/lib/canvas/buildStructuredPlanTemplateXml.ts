/**
 * Genera Project XML (MS Project) para planes de obra REALISTAS, multi-fase y con
 * precedencias ramificadas — no la cadena lineal de `buildSimpleLinearPlanTemplateXml`.
 *
 * Estructura de salida:
 *   1            (resumen del proyecto, nivel 1)
 *   1.p          (fase, nivel 2, Summary)
 *   1.p.t        (tarea hoja, nivel 3) — con PredecessorLink hacia hermanas de la MISMA fase
 *
 * Regla de oro del importador (`importProjectXml`): una precedencia es "válida" sólo entre
 * tareas HOJA HERMANAS (mismo padre). Por eso las dependencias se declaran dentro de cada fase;
 * el orden entre fases es implícito (secuencia constructiva). Esto es justo lo que consume
 * Obra Check (`projectXmlToTasks`) y lo que el lienzo espera.
 */

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function durationIso(days: number): string {
  const d = Math.max(1, Math.round(days));
  return `P${d}DT0H0M0S`;
}

export type StructuredPlanTask = {
  /** Clave única dentro del plan; se usa para referenciar precedencias. */
  key: string;
  name: string;
  durationDays: number;
  /** Claves de tareas predecesoras. Para que sean "válidas" deben ser de la MISMA fase. */
  deps?: string[];
};

export type StructuredPlanPhase = {
  name: string;
  tasks: StructuredPlanTask[];
};

export type StructuredPlanSpec = {
  projectTitle: string;
  phases: StructuredPlanPhase[];
};

/** Cantidad de tareas hoja ejecutables (lo que verá Obra Check / el lienzo). */
export function countStructuredPlanTasks(spec: StructuredPlanSpec): number {
  return spec.phases.reduce((n, p) => n + p.tasks.length, 0);
}

type EmitTask = {
  uid: number;
  outline: string;
  name: string;
  durationDays: number;
  predUids: number[];
};

/**
 * Valida el spec en tiempo de generación (falla ruidosamente para no versionar planes rotos):
 * - claves únicas
 * - deps existentes en ALGUNA fase (una dep inexistente es un typo → error)
 * - sin auto-dependencia
 *
 * Las deps CRUZADAS entre fases NO son un error: documentan el arranque de una fase respecto de la
 * anterior, pero el importador sólo admite precedencias entre hermanos (misma fase), así que al
 * emitir se descartan (el orden entre fases es implícito por la secuencia constructiva / rubro).
 */
export function assertValidStructuredPlan(spec: StructuredPlanSpec): void {
  const allKeys = new Set<string>();
  for (const phase of spec.phases) {
    for (const task of phase.tasks) {
      if (allKeys.has(task.key)) throw new Error(`[${spec.projectTitle}] clave duplicada: ${task.key}`);
      allKeys.add(task.key);
    }
  }
  for (const phase of spec.phases) {
    for (const task of phase.tasks) {
      for (const dep of task.deps ?? []) {
        if (dep === task.key) throw new Error(`[${spec.projectTitle}] auto-dependencia: ${task.key}`);
        if (!allKeys.has(dep)) {
          throw new Error(
            `[${spec.projectTitle}] la tarea "${task.key}" depende de "${dep}", que no existe en el plan (¿typo?).`,
          );
        }
      }
    }
  }
}

export function buildStructuredPlanTemplateXml(spec: StructuredPlanSpec): string {
  assertValidStructuredPlan(spec);

  const ROOT_UID = 1;
  const keyToUid = new Map<string, number>();
  const emitTasks: EmitTask[] = [];
  let nextUid = 2;

  // Paso 1: asignar UIDs (fases y tareas) para poder resolver precedencias por clave.
  const phaseUids: number[] = [];
  spec.phases.forEach((phase) => {
    phaseUids.push(nextUid++);
    phase.tasks.forEach((task) => {
      keyToUid.set(task.key, nextUid++);
    });
  });

  // Paso 2: construir bloques.
  const blocks: string[] = [];

  blocks.push(
    taskXml({
      uid: ROOT_UID,
      outline: '1',
      level: 1,
      name: spec.projectTitle,
      summary: true,
      durationDays: 1,
      predUids: [],
    }),
  );

  spec.phases.forEach((phase, pIdx) => {
    const phaseUid = phaseUids[pIdx]!;
    const phaseOutline = `1.${pIdx + 1}`;
    const phaseKeys = new Set(phase.tasks.map((tk) => tk.key));
    blocks.push(
      taskXml({
        uid: phaseUid,
        outline: phaseOutline,
        level: 2,
        name: phase.name,
        summary: true,
        durationDays: 1,
        predUids: [],
      }),
    );
    phase.tasks.forEach((task, tIdx) => {
      const uid = keyToUid.get(task.key)!;
      // Sólo precedencias entre hermanas de la MISMA fase son válidas para el importador;
      // las cruzadas se descartan (orden entre fases implícito).
      const predUids = (task.deps ?? [])
        .filter((dep) => phaseKeys.has(dep))
        .map((dep) => keyToUid.get(dep))
        .filter((u): u is number => u != null);
      emitTasks.push({
        uid,
        outline: `${phaseOutline}.${tIdx + 1}`,
        name: task.name,
        durationDays: task.durationDays,
        predUids,
      });
      blocks.push(
        taskXml({
          uid,
          outline: `${phaseOutline}.${tIdx + 1}`,
          level: 3,
          name: task.name,
          summary: false,
          durationDays: task.durationDays,
          predUids,
        }),
      );
    });
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<Project xmlns="http://schemas.microsoft.com/project">
<Title>${escapeXml(spec.projectTitle)}</Title>
${blocks.join('\n')}
</Project>`;
}

function taskXml(opts: {
  uid: number;
  outline: string;
  level: number;
  name: string;
  summary: boolean;
  durationDays: number;
  predUids: number[];
}): string {
  const preds = opts.predUids
    .map(
      (puid) =>
        `<PredecessorLink><PredecessorUID>${puid}</PredecessorUID><Type>1</Type></PredecessorLink>`,
    )
    .join('');
  return `<Task>
<UID>${opts.uid}</UID>
<ID>${opts.uid}</ID>
<Name>${escapeXml(opts.name)}</Name>
<OutlineNumber>${opts.outline}</OutlineNumber>
<OutlineLevel>${opts.level}</OutlineLevel>
<Summary>${opts.summary ? '1' : '0'}</Summary>
<Duration>${durationIso(opts.durationDays)}</Duration>
<PercentComplete>0</PercentComplete>
${preds}
</Task>`;
}

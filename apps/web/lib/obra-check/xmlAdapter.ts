/**
 * Adapter Project XML → ObraCheckTask[].
 *
 * Reutiliza el parser existente `parseProjectXml` (lib/project/importProjectXml) y colapsa su
 * preview jerárquico a la lista plana de tareas hoja que Obra Check necesita. Las precedencias
 * se toman de los edges "valid" entre hojas.
 *
 * OJO: `parseProjectXml` usa `DOMParser` (browser/jsdom). Este adapter corre CLIENT-SIDE
 * (o en tests jsdom), nunca en una API route de Node.
 */

import { parseProjectXml } from '@/lib/project/importProjectXml';
import type { ObraCheckTask, ObraCheckWarning } from './types';
import { detectarRubro } from './rubros';

export type XmlAdapterResult = {
  projectName: string;
  tasks: ObraCheckTask[];
  warnings: ObraCheckWarning[];
};

export function projectXmlToTasks(xmlText: string): XmlAdapterResult {
  const preview = parseProjectXml(xmlText);
  const warnings: ObraCheckWarning[] = [];

  // Sólo hojas ejecutables son tareas de Obra Check.
  const leaves = preview.nodesPreview.filter((n) => n.growsType === 'tarea' && n.isLeaf);

  const uidToId = new Map<number, string>();
  leaves.forEach((n) => uidToId.set(n.sourceUid, `xml-${n.sourceUid}`));

  // Precedencias entre hojas (edges válidos donde ambos extremos son tareas).
  const predsByTarget = new Map<number, number[]>();
  for (const e of preview.edgesPreview) {
    if (e.kind !== 'valid') continue;
    if (!uidToId.has(e.sourceUid) || !uidToId.has(e.targetUid)) continue;
    const arr = predsByTarget.get(e.targetUid) ?? [];
    arr.push(e.sourceUid);
    predsByTarget.set(e.targetUid, arr);
  }

  const tasks: ObraCheckTask[] = leaves.map((n) => {
    const id = uidToId.get(n.sourceUid)!;
    if (n.durationDays == null) {
      warnings.push({ kind: 'sin_duracion', message: `Tarea sin duración: «${n.name}»`, taskId: id });
    }
    const preds = (predsByTarget.get(n.sourceUid) ?? [])
      .map((uid) => uidToId.get(uid))
      .filter((x): x is string => Boolean(x));

    return {
      id,
      nombre: n.name,
      rubro: detectarRubro(n.name),
      duracionDias: n.durationDays,
      inicio: null,
      fin: null,
      predecesoras: preds,
      responsableLabel: null, // Project XML: recursos ignorados en v1
      blockId: null,
      origen: 'project_xml' as const,
    };
  });

  return { projectName: preview.projectName, tasks, warnings };
}

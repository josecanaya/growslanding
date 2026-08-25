/**
 * Contrato del oficio Grows para el motor Cursor (IDE o SDK).
 * Dos capas: horizonte (proponer) ≠ operativo (socio/bolsa/cobro).
 */

export const GROWS_SYSTEM_OFICIO = `Sos el oficio de Grows. Español rioplatense, corto y concreto.

## Dos capas (no las mezcles)
1. HORIZONTE — estados y transformaciones A → f → B. Acá solo se PROPONE. El humano acepta.
2. OPERATIVO — socio, bolsa, evidencia, validación, cobro, proporción, wallet. Eso ya existe en Grows; no lo reinventés ni lo dispares desde el chat.

## Qué hacés
- Organizás diseño, albañilería, instalaciones, lo que sea, como cadena A→f→B.
- Usás el contexto del corpus y del canvas que te pasan. Si falta un dato, preguntás uno solo.
- CPM / Tiempo es lente de dependencias, no el teclado.
- Si conviene anotar un paso: una línea «verbo → estado que queda».
- Nunca digas montos, comisiones ni «te cobro». Eso es wallet/operativo.

## Qué no hacés
- No marques realizada ni validada.
- No inventes precios ni catálogo rígido de T.
- No trates el canvas como formulario SaaS: hablás y proponés.
- No copies nodos crudos del grafo ni digas que sos una IA.`;

export function armarPromptGrows(input: {
  objetivo: string | null;
  cadenaResumen: string | null;
  contextoCorpus: string | null;
  historial: Array<{ role: 'user' | 'assistant'; content: string }>;
  mensaje: string;
  anotoPaso: { verb: string; estadoB: string } | null;
}): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const bloques: string[] = [];
  if (input.objetivo?.trim()) {
    bloques.push(`Objetivo del proyecto: ${input.objetivo.trim().slice(0, 400)}`);
  }
  if (input.cadenaResumen?.trim()) {
    bloques.push(`Cadena actual del horizonte:\n${input.cadenaResumen.trim().slice(0, 2000)}`);
  }
  if (input.contextoCorpus?.trim()) {
    bloques.push(`Contexto del corpus / Graphify:\n${input.contextoCorpus.trim().slice(0, 5000)}`);
  }
  if (input.anotoPaso) {
    bloques.push(
      `Acabo de dejar propuesta (pendiente de aceptación humana): ${input.anotoPaso.verb} → ${input.anotoPaso.estadoB}`,
    );
  }
  bloques.push(`Mensaje del usuario:\n${input.mensaje}`);

  return [
    { role: 'system', content: GROWS_SYSTEM_OFICIO },
    ...input.historial.slice(-8),
    { role: 'user', content: bloques.join('\n\n') },
  ];
}

/** Resumen corto de nodos para el prompt (sin PII). */
export function resumenCadenaCanvas(nodes: Array<{
  type: string;
  title: string;
  graphStatus?: string | null;
  transformKind?: string | null;
  orquestadorEstado?: string | null;
}>): string {
  if (!nodes.length) return '(horizonte vacío salvo IDEA si existe)';
  return nodes
    .slice(0, 40)
    .map((n) => {
      if (n.type === 'tarea' || n.type === 'transformacion') {
        const st = n.orquestadorEstado ?? n.graphStatus ?? '';
        return `T[${n.transformKind ?? '?'}|${st}] ${n.title}`;
      }
      return `E[${n.graphStatus ?? 'estado'}] ${n.title}`;
    })
    .join('\n');
}

import type { CorpusHit } from '@/lib/conocimiento/buscarEnCorpus';

function marcoLote(mensaje: string): string | null {
  const t = mensaje.toLowerCase();
  if (!/terreno|lote|medianera|tipolog|departamento|edificio|casa|dónde construir|donde construir|conviene/.test(t)) {
    return null;
  }
  return [
    'Antes de elegir “el terreno que conviene”, el corpus pide orden: lote y tipología (medianeras, fondo, esquina, vacío o existente), después programa (servido/servidor, núcleo húmedo), después el corte (luz al centro), no el cómputo de ladrillos.',
    'Preguntas que cierran opciones: ¿entre medianeras o esquina? ¿El valor está en el fondo o en la calle? ¿Se vive en PB o se duerme arriba? Un lote angosto descarta la barra; tapar patios en una casa chorizo pudre el centro.',
  ].join('\n\n');
}

export function armarDevolucionHorizonte(input: {
  mensaje: string;
  objetivo: string | null;
  corpus: CorpusHit[];
  grafoText: string | null;
  anotoPaso: { verb: string; estadoB: string } | null;
}): string {
  const partes: string[] = [];
  const objetivo = input.objetivo?.trim();
  if (objetivo) {
    partes.push(`Partimos de lo que ya está dicho en el proyecto: ${objetivo.slice(0, 280)}.`);
  }

  const marco = marcoLote(input.mensaje);
  if (marco) partes.push(marco);

  if (input.corpus.length > 0) {
    partes.push(
      input.corpus
        .map((h) => `Del corpus (${h.file}): ${h.excerpt}`)
        .join('\n\n'),
    );
  } else if (input.grafoText && !/no matching|no tiene un nodo/i.test(input.grafoText)) {
    partes.push(input.grafoText.slice(0, 1200));
  }

  if (partes.length === 0) {
    partes.push(
      'No voy a inventar un paso en el horizonte. Decime el lote, el programa o qué tiene que quedar distinto, y te respondo con el oficio. Si querés anotar un paso, escribilo como verbo → estado (por ejemplo: Elegir lote → Lote entre medianeras).',
    );
  } else {
    partes.push(
      'Esto es saber, no un hecho de obra. Si querés que quede en el horizonte, escribí el paso con flecha: verbo → estado que queda.',
    );
  }

  if (input.anotoPaso) {
    partes.push(
      `Anoté como propuesta (no ejecutada): ${input.anotoPaso.verb} → ${input.anotoPaso.estadoB}. Aceptala en la cadena si te cierra.`,
    );
  }

  return partes.join('\n\n').slice(0, 6000);
}

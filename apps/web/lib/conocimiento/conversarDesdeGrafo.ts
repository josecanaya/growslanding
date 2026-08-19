/** Arma un turno de charla a partir del texto de query_graph / god_nodes. Sin LLM. */

function parseNodes(raw: string): string[] {
  const labels: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^NODE\s+(.+?)\s+\[/);
    if (m?.[1]) labels.push(m[1].trim());
  }
  return labels;
}

function parseEdges(raw: string): Array<{ a: string; rel: string; b: string }> {
  const edges: Array<{ a: string; rel: string; b: string }> = [];
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^EDGE\s+(.+?)\s+--(\S+)\s+\[.*?\]-->(.+)$/);
    if (m) edges.push({ a: m[1].trim(), rel: m[2], b: m[3].trim() });
  }
  return edges;
}

export function conversarDesdeGrafo(input: {
  pregunta: string;
  queryText: string;
  godText?: string;
}): string {
  const nodes = parseNodes(input.queryText);
  const edges = parseEdges(input.queryText);
  const partes: string[] = [];

  if (nodes.length === 0) {
    partes.push(
      `El grafo no tiene un nodo que coincida con «${input.pregunta.slice(0, 120)}».`,
    );
    if (input.godText?.trim()) {
      partes.push('El núcleo actual es:');
      partes.push(input.godText.trim());
    }
    partes.push(
      'Podemos seguir por orquestador, átomo A→T→B, frontera, canvas u oficios. ¿Por cuál?',
    );
    return partes.join('\n\n');
  }

  partes.push(`En el grafo aparecen: ${nodes.join('; ')}.`);
  if (edges.length > 0) {
    partes.push(
      'Relaciones: ' +
        edges.map((e) => `${e.a} → ${e.b} (${e.rel})`).join('. ') +
        '.',
    );
  }
  partes.push(
    'Esto es saber de la fábrica, no el canvas de una obra. ¿Querés bajar a un vecino de esos nodos?',
  );
  return partes.join('\n\n');
}

/** El teclado pregunta. Un paso al grafo solo si el humano lo marca. */

export type IntencionHabla = 'pregunta' | 'paso';

const MARCA_PASO = /\s*(?:→|->|=>)\s*/;
const EMPIEZA_PASO =
  /^(anotá|anota|anotar|proponé|propone|proponer)\s+(el\s+)?(paso|transformaci[oó]n)\b/i;

export function intencionDelHabla(texto: string): IntencionHabla {
  const t = texto.replace(/\s+/g, ' ').trim();
  if (!t) return 'pregunta';
  if (MARCA_PASO.test(t)) return 'paso';
  if (EMPIEZA_PASO.test(t)) return 'paso';
  return 'pregunta';
}

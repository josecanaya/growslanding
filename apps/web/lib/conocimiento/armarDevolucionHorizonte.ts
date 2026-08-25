/** @deprecated Usar responderConConocimiento / sintetizarSinLlm. */
import type { CorpusHit } from '@/lib/conocimiento/buscarEnCorpus';
import { sintetizarSinLlm } from '@/lib/conocimiento/responderConConocimiento';

export function armarDevolucionHorizonte(input: {
  mensaje: string;
  objetivo: string | null;
  corpus: CorpusHit[];
  grafoText: string | null;
  anotoPaso: { verb: string; estadoB: string } | null;
}): string {
  return sintetizarSinLlm({
    mensaje: input.mensaje,
    objetivo: input.objetivo,
    corpus: input.corpus,
    anotoPaso: input.anotoPaso,
  });
}

import { buscarEnCorpus } from '@/lib/conocimiento/buscarEnCorpus';
import { armarDevolucionHorizonte } from '@/lib/conocimiento/armarDevolucionHorizonte';
import { intencionDelHabla } from '@/lib/proyecto-vivo/orquestador/intencionDelHabla';
import { proponerDesdeChat } from '@/lib/proyecto-vivo/orquestador/proponerDesdeChat';
import type { CanvasMultinivelPersisted } from '@/lib/types/canvasMultinivel';
import type { PropuestaL0Result } from '@/lib/proyecto-vivo/orquestador/proponerL0';

export async function turnoHorizonteChat(input: {
  canvas: CanvasMultinivelPersisted;
  mensaje: string;
  objetivo: string | null;
}): Promise<{ reply: string; propuesta: PropuestaL0Result }> {
  const mensaje = input.mensaje.replace(/\s+/g, ' ').trim();
  const intencion = intencionDelHabla(mensaje);
  const corpus = buscarEnCorpus(mensaje);

  if (intencion !== 'paso') {
    return {
      propuesta: {
        fromEstadoId: null,
        pasos: [],
        nodos: [],
        edges: [],
        motivo: 'charla',
      },
      reply: armarDevolucionHorizonte({
        mensaje,
        objetivo: input.objetivo,
        corpus,
        grafoText: null,
        anotoPaso: null,
      }),
    };
  }

  const propuesta = proponerDesdeChat({ canvas: input.canvas, mensaje });
  const paso = propuesta.pasos[0] ?? null;
  return {
    propuesta,
    reply: armarDevolucionHorizonte({
      mensaje,
      objetivo: input.objetivo,
      corpus,
      grafoText: null,
      anotoPaso: paso ? { verb: paso.verb, estadoB: paso.estadoB } : null,
    }),
  };
}

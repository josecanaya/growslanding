import { buscarEnCorpusAsync } from '@/lib/conocimiento/buscarEnCorpus';
import { queryConocimientoMcp } from '@/lib/conocimiento/queryConocimientoMcp';
import {
  responderConConocimiento,
  type HiloTurno,
} from '@/lib/conocimiento/responderConConocimiento';
import { resumenCadenaCanvas } from '@/lib/conocimiento/growsOficioPrompt';
import type { ContextoConocimiento } from '@/lib/conocimiento/recuperarContextoConocimiento';
import { intencionDelHabla } from '@/lib/proyecto-vivo/orquestador/intencionDelHabla';
import {
  pasoDesdeHabla,
  proponerPasoEnCanvasObra,
} from '@/lib/proyecto-vivo/orquestador/proponerPasoEnCanvasObra';
import type { CanvasMultinivelPersisted, CanvasNode, CanvasPrecedenceEdge } from '@/lib/types/canvasMultinivel';

async function contextoDePregunta(mensaje: string): Promise<ContextoConocimiento> {
  const corpus = await buscarEnCorpusAsync(mensaje, 3);
  let grafoText = '';
  try {
    const mcp = await queryConocimientoMcp(mensaje);
    grafoText = [mcp.queryText, mcp.godText].filter(Boolean).join('\n\n').slice(0, 3500);
  } catch {
    grafoText = '';
  }
  return {
    corpus,
    grafoText,
    fuente: corpus.length > 0 || grafoText ? 'local' : 'vacio',
  };
}

function resumenOrganizar(canvas: CanvasMultinivelPersisted): string {
  const etapas = canvas.nodes.filter((n) => n.type === 'etapa' && n.parentId === null);
  const lineas: string[] = [];
  for (const e of etapas.slice(0, 12)) {
    lineas.push(`Etapa: ${e.title}`);
    const tareas = canvas.nodes.filter((n) => n.parentId === e.id && n.type === 'tarea');
    for (const t of tareas.slice(0, 20)) {
      lineas.push(`  - ${t.title}${t.descripcion ? `: ${t.descripcion.slice(0, 80)}` : ''}`);
    }
  }
  if (lineas.length === 0) {
    return resumenCadenaCanvas(
      canvas.nodes.map((n) => ({
        type: n.type,
        title: n.title,
        graphStatus: n.graphStatus,
        transformKind: n.transformKind,
        orquestadorEstado: n.orquestador?.estado,
      })),
    );
  }
  return lineas.join('\n');
}

export type TurnoHorizonteResult = {
  reply: string;
  via: 'cursor' | 'llm_local' | 'sintesis';
  nodos: CanvasNode[];
  edges: CanvasPrecedenceEdge[];
  tareaId: string | null;
  motivo: string;
  anotoPaso: boolean;
};

export async function turnoHorizonteChat(input: {
  canvas: CanvasMultinivelPersisted;
  mensaje: string;
  objetivo: string | null;
  historial?: HiloTurno[];
}): Promise<TurnoHorizonteResult> {
  const mensaje = input.mensaje.replace(/\s+/g, ' ').trim();
  const intencion = intencionDelHabla(mensaje);
  const contexto = await contextoDePregunta(mensaje);
  const cadenaResumen = resumenOrganizar(input.canvas);

  if (intencion !== 'paso') {
    const resp = await responderConConocimiento({
      mensaje,
      objetivo: input.objetivo,
      contexto,
      historial: input.historial,
      anotoPaso: null,
      cadenaResumen,
    });
    return {
      reply: resp.text,
      via: resp.via,
      nodos: [],
      edges: [],
      tareaId: null,
      motivo: 'charla',
      anotoPaso: false,
    };
  }

  const propuesta = proponerPasoEnCanvasObra({ canvas: input.canvas, mensaje });
  const paso = pasoDesdeHabla(mensaje);
  const resp = await responderConConocimiento({
    mensaje,
    objetivo: input.objetivo,
    contexto,
    historial: input.historial,
    anotoPaso: { verb: paso.verb, estadoB: paso.detalle },
    cadenaResumen,
  });
  return {
    reply: resp.text,
    via: resp.via,
    nodos: propuesta.nodos,
    edges: propuesta.edges,
    tareaId: propuesta.tareaId,
    motivo: propuesta.motivo,
    anotoPaso: propuesta.nodos.some((n) => n.type === 'tarea'),
  };
}

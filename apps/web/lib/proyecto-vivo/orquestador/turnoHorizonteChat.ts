import { buscarEnCorpusAsync } from '@/lib/conocimiento/buscarEnCorpus';
import { queryConocimientoMcp } from '@/lib/conocimiento/queryConocimientoMcp';
import {
  responderConConocimiento,
  type HiloTurno,
} from '@/lib/conocimiento/responderConConocimiento';
import { resumenCadenaCanvas } from '@/lib/conocimiento/growsOficioPrompt';
import type { ContextoConocimiento } from '@/lib/conocimiento/recuperarContextoConocimiento';
import { intencionDelHabla } from '@/lib/proyecto-vivo/orquestador/intencionDelHabla';
import { proponerDesdeChat } from '@/lib/proyecto-vivo/orquestador/proponerDesdeChat';
import type { CanvasMultinivelPersisted } from '@/lib/types/canvasMultinivel';
import { isCanvasEstadoNode, isCanvasTransformacionNode } from '@/lib/types/canvasMultinivel';
import type { PropuestaL0Result } from '@/lib/proyecto-vivo/orquestador/proponerL0';

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

function cadenaParaPrompt(canvas: CanvasMultinivelPersisted): string {
  const idea =
    canvas.nodes.find((n) => isCanvasEstadoNode(n) && n.title.toLowerCase() === 'idea') ??
    canvas.nodes.find((n) => isCanvasEstadoNode(n) && n.graphStatus === 'alcanzado');
  if (!idea) {
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
  const out = [idea];
  const seen = new Set([idea.id]);
  let from = idea.id;
  for (let i = 0; i < 40; i++) {
    const nextT = canvas.nodes.find(
      (n) => isCanvasTransformacionNode(n) && n.fromNodeId === from && !seen.has(n.id),
    );
    if (!nextT) break;
    out.push(nextT);
    seen.add(nextT.id);
    if (nextT.toNodeId) {
      const b = canvas.nodes.find((n) => n.id === nextT.toNodeId);
      if (b && !seen.has(b.id)) {
        out.push(b);
        seen.add(b.id);
        from = b.id;
        continue;
      }
    }
    break;
  }
  return resumenCadenaCanvas(
    out.map((n) => ({
      type: n.type,
      title: n.title,
      graphStatus: n.graphStatus,
      transformKind: n.transformKind,
      orquestadorEstado: n.orquestador?.estado,
    })),
  );
}

export async function turnoHorizonteChat(input: {
  canvas: CanvasMultinivelPersisted;
  mensaje: string;
  objetivo: string | null;
  historial?: HiloTurno[];
}): Promise<{ reply: string; propuesta: PropuestaL0Result; via: 'cursor' | 'llm_local' | 'sintesis' }> {
  const mensaje = input.mensaje.replace(/\s+/g, ' ').trim();
  const intencion = intencionDelHabla(mensaje);
  const contexto = await contextoDePregunta(mensaje);
  const cadenaResumen = cadenaParaPrompt(input.canvas);

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
      propuesta: {
        fromEstadoId: null,
        pasos: [],
        nodos: [],
        edges: [],
        motivo: 'charla',
      },
      reply: resp.text,
      via: resp.via,
    };
  }

  const propuesta = proponerDesdeChat({ canvas: input.canvas, mensaje });
  const paso = propuesta.pasos[0] ?? null;
  const resp = await responderConConocimiento({
    mensaje,
    objetivo: input.objetivo,
    contexto,
    historial: input.historial,
    anotoPaso: paso ? { verb: paso.verb, estadoB: paso.estadoB } : null,
    cadenaResumen,
  });
  return { propuesta, reply: resp.text, via: resp.via };
}

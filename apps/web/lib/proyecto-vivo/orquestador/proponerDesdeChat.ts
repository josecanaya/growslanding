import type { CanvasMultinivelPersisted, CanvasNode, TransformKind } from '@/lib/types/canvasMultinivel';
import { isCanvasEstadoNode } from '@/lib/types/canvasMultinivel';
import { newCanvasNodeId } from '@/lib/proyecto-vivo/ids';
import type { OrquestadorNodoPropuesto, OrquestadorPasoL0, PropuestaL0Result } from '@/lib/proyecto-vivo/orquestador/proponerL0';

function pickFromEstado(canvas: CanvasMultinivelPersisted): CanvasNode | null {
  const alcanzados = canvas.nodes.filter(
    (n) => isCanvasEstadoNode(n) && n.graphStatus === 'alcanzado',
  );
  if (alcanzados.length === 0) return null;
  return alcanzados.find((e) => e.title.toLowerCase() === 'idea') ?? alcanzados[0] ?? null;
}

function kindFrom(texto: string): TransformKind {
  const t = texto.toLowerCase();
  if (/\b(ejecut|construir|obra física|levantar muro)\b/.test(t)) return 'ejecucion';
  if (/\b(equipo|socio|convoc|colabor)\b/.test(t)) return 'coordinacion';
  return 'conocimiento';
}

/** Un turno de habla → un morfismo. No receta de obra. */
export function pasoDesdeHabla(texto: string): OrquestadorPasoL0 {
  const raw = texto.replace(/\s+/g, ' ').trim();
  const parts = raw.split(/\s*(?:→|->|=>)\s*/).filter(Boolean);
  const verb = (parts[0] ?? raw).slice(0, 80);
  const estadoB = (parts[1] ?? `Queda: ${verb}`).slice(0, 120);
  return { verb, estadoB, transformKind: kindFrom(raw) };
}

export function proponerDesdeChat(input: {
  canvas: CanvasMultinivelPersisted;
  mensaje: string;
}): PropuestaL0Result {
  const from = pickFromEstado(input.canvas);
  if (!from) {
    return {
      fromEstadoId: null,
      pasos: [],
      nodos: [],
      edges: [],
      motivo: 'No hay estado alcanzado desde el cual seguir.',
    };
  }

  const paso = pasoDesdeHabla(input.mensaje);
  const now = new Date().toISOString();
  const trId = newCanvasNodeId();
  const bId = newCanvasNodeId();
  const nodos: OrquestadorNodoPropuesto[] = [
    {
      transformacion: {
        id: trId,
        parentId: null,
        level: 1,
        type: 'tarea',
        title: paso.verb,
        position: { x: 0, y: 0 },
        createdAt: now,
        transformKind: paso.transformKind,
        fromNodeId: from.id,
        toNodeId: bId,
        graphStatus: 'propuesta',
        executorKind: 'agente',
        orquestador: {
          origen: 'agente',
          estado: 'pendiente',
          formulaId: 'chat',
          chatUser: input.mensaje.trim().slice(0, 4000),
        },
      },
      estadoB: {
        id: bId,
        parentId: null,
        level: 1,
        type: 'estado',
        title: paso.estadoB,
        position: { x: 0, y: 0 },
        createdAt: now,
        graphStatus: 'fantasma',
      },
    },
  ];

  return {
    fromEstadoId: from.id,
    pasos: [paso],
    nodos,
    edges: [],
    motivo: `Propuesta desde «${from.title}»: ${paso.verb} → ${paso.estadoB}`,
  };
}

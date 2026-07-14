/**
 * Plantillas de mensaje de WhatsApp para Obra Check.
 *
 * El texto es del arquitecto (sale desde SU número), por eso NO lleva marca Grows: la marca va
 * en el PDF adjunto (Fase 3). Tono profesional, corto, sin jerga.
 */

export type WaTipo = 'orden_trabajo' | 'pedido_presupuesto';

export type WaMessageInput = {
  tipo: WaTipo;
  contactoNombre: string;
  bloqueNombre: string;
  tareas: string[];
  tipoObra?: string | null;
  fechaLimite?: string | null;
};

function listaTareas(tareas: string[]): string {
  return tareas.map((t, i) => `${i + 1}. ${t}`).join('\n');
}

export function buildWaMessage(input: WaMessageInput): string {
  const { tipo, contactoNombre, bloqueNombre, tareas, tipoObra, fechaLimite } = input;
  const obra = tipoObra ? ` de la obra ${tipoObra}` : '';
  const n = tareas.length;

  if (tipo === 'pedido_presupuesto') {
    return [
      `Hola ${contactoNombre} 👋 Estoy armando ${bloqueNombre}${obra} y quiero pedirte presupuesto.`,
      ``,
      `📋 ${n} ${n === 1 ? 'tarea' : 'tareas'}:`,
      listaTareas(tareas),
      ``,
      fechaLimite ? `🗓️ Necesito la cotización antes del ${fechaLimite}.` : `¿Me pasás tu cotización cuando puedas?`,
    ]
      .filter(Boolean)
      .join('\n');
  }

  return [
    `Hola ${contactoNombre} 👋 Te paso el detalle de ${bloqueNombre}${obra}.`,
    ``,
    `📋 ${n} ${n === 1 ? 'tarea' : 'tareas'}:`,
    listaTareas(tareas),
    ``,
    fechaLimite ? `🗓️ Entrega estimada: ${fechaLimite}.` : ``,
    `Cualquier duda me escribís.`,
  ]
    .filter(Boolean)
    .join('\n');
}

/** Construye el link wa.me. Sin teléfono → link genérico para que el usuario elija el contacto. */
export function buildWaLink(texto: string, telefono?: string | null): string {
  const encoded = encodeURIComponent(texto);
  const tel = (telefono ?? '').replace(/[^\d]/g, '');
  return tel ? `https://wa.me/${tel}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

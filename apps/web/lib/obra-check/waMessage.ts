/**
 * Mensajes cortos de WhatsApp que apuntan al formulario público (captura de contacto).
 * El detalle de tareas vive en el form — no en el texto del chat.
 */

export type WaTipo = 'orden_trabajo' | 'pedido_presupuesto';

export type WaFormMessageInput = {
  tipo: WaTipo;
  contactoNombre: string;
  bloqueNombre: string;
  formUrl: string;
  tipoObra?: string | null;
  nTareas: number;
};

export function buildWaFormMessage(input: WaFormMessageInput & { metrosCuadrados?: number | null }): string {
  const { tipo, contactoNombre, bloqueNombre, formUrl, tipoObra, nTareas } = input;
  const obra = tipoObra ? ` de la obra ${tipoObra}` : '';
  const n = nTareas;
  const tareasLabel = `${n} ${n === 1 ? 'tarea' : 'tareas'}`;
  const m2 =
    input.metrosCuadrados != null && Number.isFinite(input.metrosCuadrados)
      ? ` Superficie: ${input.metrosCuadrados} m².`
      : '';

  if (tipo === 'pedido_presupuesto') {
    return [
      `Hola ${contactoNombre} 👋 Estoy armando ${bloqueNombre}${obra} y quiero pedirte presupuesto.`,
      ``,
      `📋 Son ${tareasLabel}.${m2} Completá tus datos, mirá los planos y el detalle acá:`,
      formUrl,
      ``,
      `Cuando lo completes me llega tu respuesta completa.`,
    ].join('\n');
  }

  return [
    `Hola ${contactoNombre} 👋 Te paso el detalle de ${bloqueNombre}${obra}.`,
    ``,
    `📋 ${tareasLabel}.${m2} Abrí el formulario, confirmá tus datos y revisá alcance y planos:`,
    formUrl,
    ``,
    `Cualquier duda me escribís.`,
  ].join('\n');
}

/** @deprecated Preferí buildWaFormMessage — el listado de tareas va en el formulario. */
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

export function buildWaLink(texto: string, telefono?: string | null): string {
  const encoded = encodeURIComponent(texto);
  const tel = (telefono ?? '').replace(/[^\d]/g, '');
  return tel ? `https://wa.me/${tel}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

export function newInviteToken(): string {
  const bytes = new Uint8Array(18);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

import { canTransition, enforceTransition, type VisitStatus } from './fsm';
import { createActaPdf } from './pdf';

type ChecklistItem = {
  id: string;
  label: string;
  checked: boolean;
};

type MediaItem = {
  kind: 'foto' | 'firma';
  path?: string;
  dataUrl?: string;
};

type ActorInfo = {
  name: string;
  role: 'Cliente' | 'Socio';
  method: 'QR' | 'login' | 'PIN';
};

type ValidateInput = {
  checklist: ChecklistItem[];
  has_nc: boolean;
  media: MediaItem[];
};

type EventoPayload = ValidateInput & {
  tareaId: string;
  nuevo_estado: VisitStatus;
  notas?: string;
  actor: ActorInfo;
  nc_responsable?: string | null;
  nc_deadline?: string | null;
  rollbackMotivo?: string | null;
};

type EventoContext = {
  tarea: {
    id: string;
    tipo: string;
    descripcion: string;
    estado: VisitStatus;
  };
  obra: {
    nombre: string;
    cliente?: string | null;
    localizacion?: string | null;
  };
};

type PreparedEvento = {
  evento: {
    tarea_id: string;
    nuevo_estado: VisitStatus;
    actor_name: string;
    actor_role: ActorInfo['role'];
    actor_method: ActorInfo['method'];
    checklist: ChecklistItem[];
    notas: string;
    has_nc: boolean;
    nc_responsable: string | null;
    nc_deadline: string | null;
  };
  snapshot_json: Record<string, unknown>;
  pdf_path: string | null;
  pdf_bytes: Uint8Array | null;
};

export function validateMediaRules({
  has_nc,
  checklist,
  media,
}: ValidateInput) {
  const requiresPhoto =
    has_nc || checklist.some((item) => !item.checked);
  if (!requiresPhoto) {
    return true;
  }

  const hasPhoto = media.some((item) => item.kind === 'foto');

  if (!hasPhoto) {
    throw new Error('Se requiere al menos una foto para documentar la NC.');
  }

  return true;
}

/**
 * Valida que el checklist esté completo (todos los items marcados)
 * Solo se aplica cuando se intenta finalizar una tarea
 */
export function validateChecklistCompleto(
  checklist: ChecklistItem[],
  nuevoEstado: VisitStatus
): void {
  // Solo validar si se está finalizando la tarea
  if (nuevoEstado !== 'finalizado') {
    return;
  }

  // Si no hay checklist, no validar
  if (!checklist || checklist.length === 0) {
    return;
  }

  // Verificar que todos los items estén marcados
  const itemsIncompletos = checklist.filter((item) => !item.checked);
  
  if (itemsIncompletos.length > 0) {
    const itemsPendientes = itemsIncompletos.map((item) => item.label).join(', ');
    throw new Error(
      `Debés completar todos los puntos del checklist antes de finalizar la tarea.\n\nItems pendientes:\n${itemsPendientes}`
    );
  }
}

export async function prepareEventoInsert(
  payload: EventoPayload,
  context: EventoContext
): Promise<PreparedEvento> {
  validateMediaRules(payload);
  enforceTransition(context.tarea.estado, payload.nuevo_estado, {
    motivo: payload.rollbackMotivo ?? payload.notas,
  });

  const baseEvento: PreparedEvento['evento'] = {
    tarea_id: payload.tareaId,
    nuevo_estado: payload.nuevo_estado,
    actor_name: payload.actor.name,
    actor_role: payload.actor.role,
    actor_method: payload.actor.method,
    checklist: payload.checklist,
    notas: payload.notas?.trim() ?? '',
    has_nc: payload.has_nc,
    nc_responsable: payload.nc_responsable ?? null,
    nc_deadline: payload.nc_deadline ?? null,
  };

  const snapshot: Record<string, unknown> = {
    generadoEn: new Date().toISOString(),
    tarea: context.tarea,
    obra: context.obra,
    evento: {
      ...baseEvento,
      media: payload.media.map((item) => ({ kind: item.kind, path: item.path })),
    },
  };

  let pdfPath: string | null = null;
  let pdfBytes: Uint8Array | null = null;

  if (payload.nuevo_estado === 'validado') {
    const pdf = await createActaPdf({
      tarea: context.tarea,
      obra: context.obra,
      evento: {
        ...baseEvento,
        media: payload.media,
      },
    });
    pdfPath = pdf.pdfPath;
    pdfBytes = pdf.pdfBytes;
    const eventoSnapshot = snapshot.evento as Record<string, unknown>;
    snapshot.evento = {
      ...eventoSnapshot,
      pdf_path: pdfPath,
    };
  }

  return {
    evento: baseEvento,
    snapshot_json: snapshot,
    pdf_path: pdfPath,
    pdf_bytes: pdfBytes,
  };
}

export function canTransitionSafely(
  from: VisitStatus,
  to: VisitStatus
) {
  return canTransition(from, to);
}

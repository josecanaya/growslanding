const CHANGE_WINDOW_REENVIO = new Set(['confirmada_socio']);
const ENVIADO_STATUSES = new Set(['enviado', 'enviado_parcial']);

export type PublishBlockReason =
  | 'ya_publicado'
  | 'presupuesto_aprobado'
  | 'paquete_aprobado'
  | null;

export function evaluarBloqueoPublicacionPliego(params: {
  groupStatus: string;
  changeWindowStatus: string;
  pliegoPublicadoAt: string | null | undefined;
  tienePresupuestoAprobadoEnGrupo: boolean;
}): { blocked: boolean; reason: PublishBlockReason; message: string | null } {
  const groupStatus = String(params.groupStatus ?? '').toLowerCase();
  const changeWindow = String(params.changeWindowStatus ?? 'cerrada').toLowerCase();
  const puedeReenviar = CHANGE_WINDOW_REENVIO.has(changeWindow);

  if (
    (groupStatus === 'aprobado' || groupStatus === 'aprobado_parcial') &&
    !puedeReenviar
  ) {
    return {
      blocked: true,
      reason: 'paquete_aprobado',
      message:
        'Este paquete ya está aprobado. Para modificarlo, abrí una ventana de cambio desde la pestaña Presupuestos.',
    };
  }

  if (params.tienePresupuestoAprobadoEnGrupo && !puedeReenviar) {
    return {
      blocked: true,
      reason: 'presupuesto_aprobado',
      message:
        'Ya hay presupuestos aprobados en este paquete. No podés volver a publicarlo para presupuestar.',
    };
  }

  const yaPublicado =
    Boolean(params.pliegoPublicadoAt) ||
    ENVIADO_STATUSES.has(groupStatus);

  if (yaPublicado && !puedeReenviar) {
    return {
      blocked: true,
      reason: 'ya_publicado',
      message:
        'Este pliego ya fue publicado para presupuestar. No podés volver a enviarlo (salvo tras confirmar un cambio con el socio).',
    };
  }

  return { blocked: false, reason: null, message: null };
}

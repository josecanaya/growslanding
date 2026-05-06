export type PresupuestoEtapaTab = 'ESTRUCTURA' | 'OBRA_GRIS' | 'TERMINACIONES';

/**
 * Las tareas creadas desde el canvas (`publicar-tareas`) suelen tener `tareas.etapa` en NULL.
 * Se alinean con la pestaña Estructura (misma regla que en la página de presupuestos del socio).
 */
export function bucketEtapaPresupuesto(etapaRaw: string | null | undefined): PresupuestoEtapaTab {
  const etapa = (etapaRaw ?? '').toUpperCase().trim();
  if (etapa.includes('GRIS') || etapa.includes('OBRA_GRIS')) {
    return 'OBRA_GRIS';
  }
  if (etapa.includes('TERMINACION')) {
    return 'TERMINACIONES';
  }
  if (etapa.includes('ESTRUCTURA')) {
    return 'ESTRUCTURA';
  }
  return 'ESTRUCTURA';
}

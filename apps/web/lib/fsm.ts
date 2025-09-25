import { z } from 'zod';

export const visitStatusSchema = z.enum([
  'pendiente',
  'en_ejecucion',
  'finalizado',
  'validado',
]);

export type VisitStatus = z.infer<typeof visitStatusSchema>;

const allowedTransitions: Record<VisitStatus, VisitStatus[]> = {
  pendiente: ['en_ejecucion'],
  en_ejecucion: ['finalizado'],
  finalizado: ['validado', 'en_ejecucion'],
  validado: [],
};

type TransitionOptions = {
  motivo?: string;
};

const rollbackTarget: VisitStatus = 'en_ejecucion';
const rollbackSource: VisitStatus = 'finalizado';

export function canTransition(from: VisitStatus, to: VisitStatus) {
  return allowedTransitions[from]?.includes(to) ?? false;
}

export function enforceTransition(
  from: VisitStatus,
  to: VisitStatus,
  options: TransitionOptions = {}
) {
  if (!canTransition(from, to)) {
    throw new Error(`Transición no permitida de ${from} a ${to}`);
  }

  if (from === rollbackSource && to === rollbackTarget) {
    const motivo = options.motivo?.trim();
    if (!motivo) {
      throw new Error('Se requiere un motivo para revertir el estado finalizado.');
    }
  }

  return true;
}

export function parseStatus(value: string): VisitStatus {
  return visitStatusSchema.parse(value);
}

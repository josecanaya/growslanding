import { describe, expect, it } from 'vitest';
import { canTransition, enforceTransition, VisitStatus } from '@/lib/fsm';

describe('visit FSM', () => {
  it('permits linear progression pendiente -> en_ejecucion -> finalizado -> validado', () => {
    const chain: VisitStatus[] = [
      'pendiente',
      'en_ejecucion',
      'finalizado',
      'validado',
    ];

    chain.reduce((current, next) => {
      expect(canTransition(current, next)).toBe(true);
      expect(() => enforceTransition(current, next)).not.toThrow();
      return next;
    });
  });

  it('bloquea saltos de pendiente a finalizado', () => {
    expect(canTransition('pendiente', 'finalizado')).toBe(false);
    expect(() => enforceTransition('pendiente', 'finalizado')).toThrowError(
      /Transición no permitida/
    );
  });

  it('permite único rollback finalizado -> en_ejecucion exigiendo motivo', () => {
    expect(() => enforceTransition('finalizado', 'en_ejecucion')).toThrowError(
      /motivo/
    );
    expect(() =>
      enforceTransition('finalizado', 'en_ejecucion', { motivo: 'Reproceso' })
    ).not.toThrow();
  });
});

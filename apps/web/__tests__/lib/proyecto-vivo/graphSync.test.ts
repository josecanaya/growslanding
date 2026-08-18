import { describe, expect, it } from 'vitest';
import { graphStatusTransformacionFromTareaEstado } from '@/lib/proyecto-vivo/resolveElementoEjecucion';

describe('graphStatusTransformacionFromTareaEstado', () => {
  it('mapea validada a realizada', () => {
    expect(graphStatusTransformacionFromTareaEstado('validada')).toBe('realizada');
  });

  it('mapea estados operativos a en_curso', () => {
    expect(graphStatusTransformacionFromTareaEstado('pendiente')).toBe('en_curso');
    expect(graphStatusTransformacionFromTareaEstado('en_progreso')).toBe('en_curso');
    expect(graphStatusTransformacionFromTareaEstado('para_validar')).toBe('en_curso');
    expect(graphStatusTransformacionFromTareaEstado('rechazada')).toBe('en_curso');
  });
});

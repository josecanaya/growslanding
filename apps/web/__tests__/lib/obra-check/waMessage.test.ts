import { describe, it, expect } from 'vitest';
import { buildWaMessage, buildWaFormMessage, buildWaLink, newInviteToken } from '@/lib/obra-check/waMessage';

describe('buildWaFormMessage', () => {
  it('manda link al formulario, no la lista de tareas', () => {
    const txt = buildWaFormMessage({
      tipo: 'orden_trabajo',
      contactoNombre: 'Juan',
      bloqueNombre: 'Instalación eléctrica',
      formUrl: 'https://grows.app/obra-check/f/abc123',
      tipoObra: 'Casa Belgrano',
      nTareas: 2,
    });
    expect(txt).toContain('Hola Juan');
    expect(txt).toContain('Instalación eléctrica');
    expect(txt).toContain('https://grows.app/obra-check/f/abc123');
    expect(txt).toContain('2 tareas');
    expect(txt).not.toContain('Canalización');
  });

  it('pedido de presupuesto menciona cotización vía form', () => {
    const txt = buildWaFormMessage({
      tipo: 'pedido_presupuesto',
      contactoNombre: 'Pedro',
      bloqueNombre: 'Mampostería',
      formUrl: 'https://example.com/f/x',
      nTareas: 1,
    });
    expect(txt).toContain('presupuesto');
    expect(txt).toContain('1 tarea');
    expect(txt).toContain('https://example.com/f/x');
  });
});

describe('buildWaMessage (legacy)', () => {
  it('arma una orden de trabajo con lista numerada', () => {
    const txt = buildWaMessage({
      tipo: 'orden_trabajo',
      contactoNombre: 'Juan',
      bloqueNombre: 'Instalación eléctrica',
      tareas: ['Canalización PB', 'Cableado PB'],
      tipoObra: 'Casa Belgrano',
      fechaLimite: '25/07',
    });
    expect(txt).toContain('1. Canalización PB');
    expect(txt).not.toMatch(/grows/i);
  });
});

describe('buildWaLink', () => {
  it('genera link con teléfono normalizado', () => {
    expect(buildWaLink('hola', '+54 9 351 123-4567')).toBe(
      `https://wa.me/5493511234567?text=${encodeURIComponent('hola')}`,
    );
  });
  it('sin teléfono usa link genérico', () => {
    expect(buildWaLink('hola', null)).toBe(`https://wa.me/?text=${encodeURIComponent('hola')}`);
  });
});

describe('newInviteToken', () => {
  it('genera token hex largo', () => {
    const t = newInviteToken();
    expect(t.length).toBeGreaterThanOrEqual(24);
    expect(t).toMatch(/^[0-9a-f]+$/);
  });
});

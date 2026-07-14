import { describe, it, expect } from 'vitest';
import { buildWaMessage, buildWaLink } from '@/lib/obra-check/waMessage';

describe('buildWaMessage', () => {
  it('arma una orden de trabajo con lista numerada', () => {
    const txt = buildWaMessage({
      tipo: 'orden_trabajo',
      contactoNombre: 'Juan',
      bloqueNombre: 'Instalación eléctrica',
      tareas: ['Canalización PB', 'Cableado PB'],
      tipoObra: 'Casa Belgrano',
      fechaLimite: '25/07',
    });
    expect(txt).toContain('Hola Juan');
    expect(txt).toContain('Instalación eléctrica');
    expect(txt).toContain('1. Canalización PB');
    expect(txt).toContain('2. Cableado PB');
    expect(txt).toContain('25/07');
    // El texto es del arquitecto: no lleva marca Grows.
    expect(txt).not.toMatch(/grows/i);
  });

  it('arma un pedido de presupuesto', () => {
    const txt = buildWaMessage({
      tipo: 'pedido_presupuesto',
      contactoNombre: 'Pedro',
      bloqueNombre: 'Mampostería',
      tareas: ['Muro PB'],
    });
    expect(txt).toContain('presupuesto');
    expect(txt).toContain('1 tarea'); // singular
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

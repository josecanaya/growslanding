import { describe, expect, it } from 'vitest';
import { efectoRonda, imputarCostos, necesidadDeFondos, repartir } from '@/lib/circuito/finanzas';

describe('finanzas del circuito', () => {
  it('reparte por mayor resto y la suma es exacta', () => {
    const r = repartir(100, [{ clave: 'a', peso: 1 }, { clave: 'b', peso: 1 }, { clave: 'c', peso: 1 }]);
    expect(Object.values(r).reduce((s, x) => s + x, 0)).toBeCloseTo(100, 10);
    expect(r).toEqual({ a: 33.34, b: 33.33, c: 33.33 });
  });
  it('la necesidad sale de contratos, costos, reserva y caja; lo prometido no la reduce', () => {
    const n = necesidadDeFondos({ caja: 20000, reserva: 5000, aprobadosImpagos: 3000,
      compromisos: [{ concepto: 'contrato', monto: 40000, fecha: '2027-01-20' }], costosPrevistos: [{ tipo: 'terreno', descripcion: 'lote', monto: 10000, fecha: '2026-12-05' }],
      sinContrato: [{ concepto: 'ref', monto: 7000, fecha: '2027-02-10' }], prometidoNoIntegrado: 99999, integradoEnCustodia: 50000 });
    expect(n.total_requerido).toBe(65000);
    expect(n.necesidad).toBe(45000);
    expect(n.no_contado).toMatchObject({ prometido_no_integrado: 99999, integrado_en_custodia: 50000 });
    expect(n.cronograma_pagos.map((m) => [m.mes, m.caja_proyectada])).toEqual([['2026-12', 7000], ['2027-01', -33000], ['2027-02', -40000]]);
    expect(n.primer_deficit).toBe('2027-01');
  });
  it('sin faltante la necesidad es cero', () => {
    const n = necesidadDeFondos({ caja: 100, reserva: 10, aprobadosImpagos: 0, compromisos: [{ concepto: 'x', monto: 50, fecha: '2027-01-01' }], costosPrevistos: [], sinContrato: [], prometidoNoIntegrado: 0, integradoEnCustodia: 0 });
    expect(n).toMatchObject({ necesidad: 0, cubierto: true, primer_deficit: null });
  });
  it('muestra el efecto de una ronda sobre anteriores y nuevos', () => {
    const e = efectoRonda({ valuacionPre: 300000, precioMcu: 120, mcuOfrecidas: 1000, mcuPrevias: 3000, umbralMcu: 800, minimoMcu: 10 });
    expect(e).toMatchObject({ aporte_minimo: 1200, capital_objetivo: 120000, capital_minimo_para_cerrar: 96000, precio_referencia_por_valuacion: 100,
      valuacion_post: 420000, participacion_nuevos_pct: 25, participacion_anteriores_pct: 75, dilucion_anteriores_pct: 25 });
  });
  it('imputa cada partida una sola vez: directa a su unidad o común por superficie', () => {
    const r = imputarCostos([{ codigo: 'E', monto: 1000.01, esComun: true, unidadCodigo: null }, { codigo: 'T1', monto: 300, esComun: false, unidadCodigo: 'A' }, { codigo: 'T2', monto: 200, esComun: false, unidadCodigo: 'B' }],
      [{ codigo: 'A', m2: 60 }, { codigo: 'B', m2: 40 }, { codigo: 'C', m2: 50 }]);
    expect(r.cierra).toBe(true);
    expect(r.imputado).toBe(1500.01);
    expect(r.unidades.map((u) => [u.unidad, u.costo_directo, u.costo_comun_imputado])).toEqual([['A', 300, 400], ['B', 200, 266.67], ['C', 0, 333.34]]);
  });
});

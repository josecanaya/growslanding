import { describe, expect, it } from 'vitest';
import { sumarCapital, sumarQPorUnidad } from '@/lib/proyecto-vivo/energia';

describe('energia F(f)=(qT,C)', () => {
  it('suma q solo si la identidad T coincide', () => {
    const sumas = sumarQPorUnidad([
      { energyUnitId: 'T_x', energyQuantity: 20 },
      { energyUnitId: 'T_x', energyQuantity: 30 },
      { energyUnitId: 'T_y', energyQuantity: 30 },
    ]);
    expect(sumas).toEqual(
      expect.arrayContaining([
        { energy_unit_id: 'T_x', q: 50 },
        { energy_unit_id: 'T_y', q: 30 },
      ]),
    );
    expect(sumas.find((s) => s.energy_unit_id === 'T') ).toBeUndefined();
  });

  it('no mezcla C de otra moneda con USD', () => {
    expect(
      sumarCapital([
        { capitalAmount: 800, capitalCurrency: 'USD' },
        { capitalAmount: 100, capitalCurrency: 'ARS' },
      ]),
    ).toBe(800);
  });
});

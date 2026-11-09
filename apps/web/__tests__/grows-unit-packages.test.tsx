import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import UnitPackages from '@/components/grows/UnitPackages';
import { createScenarios } from '@/lib/obras/simulation';
import { packagesFor, packageStages } from '@/lib/obras/unit-packages';
afterEach(cleanup);
it('distribuye exactamente el precio de cada unidad de las quince obras', () => {
  for (const obra of createScenarios()) for (const unit of packagesFor(obra)) {
    expect(packageStages(unit).reduce((sum,s) => sum+s.percent,0)).toBe(100);
    expect(packageStages(unit).reduce((sum,s) => sum+s.amountCents,0)).toBe(unit.priceCents);
    expect(packageStages({...unit, priceCents:12345679}).reduce((sum,s) => sum+s.amountCents,0)).toBe(12345679);
  }
  expect(packagesFor(createScenarios()[8])).toEqual([]);
});
it('permite seleccionar departamento y prepara una consulta con esa unidad', () => {
  const onConsult=vi.fn();
  render(<UnitPackages obra={createScenarios()[1]} onConsult={onConsult}/>);
  expect(screen.getByText('Distribución por etapas')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', {name:/Departamento 3B/}));
  fireEvent.click(screen.getByRole('button', {name:'Consultar por esta unidad'}));
  expect(onConsult.mock.calls[0][0]).toContain('Departamento 3B');
  expect(onConsult.mock.calls[0][0]).toContain('cinco etapas');
});
it('muestra un estado vacío en las obras sin unidades residenciales', () => {
  render(<UnitPackages obra={createScenarios()[8]} onConsult={vi.fn()}/>);
  expect(screen.getByText('Todavía no hay viviendas publicadas en esta obra.')).toBeTruthy();
  expect(screen.queryByRole('button', {name:'Consultar por esta unidad'})).toBeNull();
});

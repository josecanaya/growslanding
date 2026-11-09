import { expect, it } from 'vitest';
import { createScenarios } from '@/lib/obras/simulation';
import { investmentFor, roundOverview, roundStatus, searchInvestments, subscriptionEstimate } from '@/lib/obras/investment-demo';

it('las quince obras tienen símbolos únicos, precios e historial consistentes', () => {
  const investments = createScenarios().map(investmentFor);
  expect(new Set(investments.map(i => i.ticker)).size).toBe(15);
  for (const i of investments) {
    expect(i.history.at(-1)?.cents).toBe(i.referenceCents);
    expect(i.issued).toBe(i.rounds[0].subscribed);
    for (const r of i.rounds) { expect(r.subscribed).toBeLessThanOrEqual(r.offered); expect(r.opens < r.closes).toBe(true); }
  }
});
it('Ribera Norte muestra ronda abierta y siguiente ronda', () => {
  const summary = roundOverview(investmentFor({ id: 'demo-2' }));
  expect(summary.open?.number).toBe(2);
  expect(summary.next?.opens).toBe('2027-02-01');
  expect(summary.available).toBe(52800);
  expect(summary.fundedPercent).toBe(52);
});
it('calcula estados en apertura, cierre, agotamiento y próxima apertura', () => {
  const r = investmentFor({ id: 'demo-3' }).rounds[1];
  expect(roundStatus(r)).toBe('proxima');
  expect(roundStatus(r, r.opens)).toBe('abierta');
  expect(roundStatus(r, r.closes)).toBe('abierta');
  expect(roundStatus(r, '2026-12-21')).toBe('cerrada');
  expect(roundStatus({ ...r, subscribed: r.offered }, r.opens)).toBe('cerrada');
});
it('calcula en centavos y rechaza fracciones, negativos o exceso de emisión', () => {
  const r = investmentFor({ id: 'demo-2' }).rounds[1];
  expect(subscriptionEstimate(r, '100')).toEqual({ quantity: 100, totalCents: 10500 });
  for (const value of ['1.5', '-1', '0', '1000000', '', 'Infinity']) expect(subscriptionEstimate(r, value)).toBeNull();
});
it('busca por símbolo y ciudad sin acentos y combina el estado', () => {
  const obras=createScenarios();
  expect(searchInvestments(obras, 'RIBN', 'abierta').map(w => w.id)).toEqual(['demo-2']);
  expect(searchInvestments(obras, 'cordoba', 'proxima').map(w => w.id)).toEqual(['demo-3']);
  expect(searchInvestments(obras, 'RIBN', 'proxima')).toEqual([]);
  expect(() => investmentFor({id:'demo-99'})).toThrow();
});

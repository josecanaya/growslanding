import { expect, it } from 'vitest';
import { createScenarios } from '@/lib/obras/simulation';
import { financialContext, projectFinancials, projectedPosition } from '@/lib/obras/financial-projection';

it('proyecta todas las obras con emisiones, capital y costos reconciliados',()=>{
  for(const obra of createScenarios()){
    const c=financialContext(obra);const p=projectFinancials(obra,c.defaults);
    expect(c.dilutedUnits).toBe(c.investment.rounds.reduce((sum,r)=>sum+r.offered,0));
    expect(c.zoneAverage).toBe(Math.round(c.comparables.reduce((sum,r)=>sum+r.m2Cents,0)/4));
    expect(p.rawEquityCents).toBe(c.cashCents+c.futureCapitalCents+p.grossSalesCents-p.sellingFeesCents-p.remainingCostCents-c.debtCents);
    expect(p.terminalMcuCents*c.dilutedUnits).toBeCloseTo(p.distributableCents,5);
    expect(Number.isFinite(p.annualizedPercent)).toBe(true);
  }
});
it('precios y costos alteran el resultado, y el plazo altera el anualizado',()=>{
  const obra=createScenarios()[1],c=financialContext(obra),base=projectFinancials(obra,c.defaults);
  expect(projectFinancials(obra,{...c.defaults,saleM2Cents:c.defaults.saleM2Cents+10000}).terminalMcuCents).toBeGreaterThan(base.terminalMcuCents);
  expect(projectFinancials(obra,{...c.defaults,remainingCostCents:c.defaults.remainingCostCents+1000000}).terminalMcuCents).toBeLessThan(base.terminalMcuCents);
  const delayed=projectFinancials(obra,{...c.defaults,months:c.defaults.months+12});
  expect(delayed.terminalMcuCents).toBe(base.terminalMcuCents);
  expect(delayed.annualizedPercent).toBeLessThan(base.annualizedPercent);
  expect(projectFinancials(obra,c.defaults,'adverso').returnPercent).toBeLessThan(base.returnPercent);
});
it('permite pérdida total y muestra el faltante de financiación sin valores negativos distribuibles',()=>{
  const obra=createScenarios()[1],c=financialContext(obra);
  const p=projectFinancials(obra,{...c.defaults,remainingCostCents:1000000000});
  expect(p.terminalMcuCents).toBe(0);expect(p.returnPercent).toBe(-100);expect(p.annualizedPercent).toBe(-100);expect(p.fundingGapCents).toBeGreaterThan(0);
  expect(projectedPosition(100,10500,p.terminalMcuCents)).toEqual({proceedsCents:0,gainCents:-10500});
  expect(()=>projectFinancials(obra,{...c.defaults,months:0})).toThrow();
  expect(()=>projectFinancials(obra,{...c.defaults,saleM2Cents:NaN})).toThrow();
});
it('el precio de equilibrio recupera el aporte de ronda en el modelo',()=>{
  const obra=createScenarios()[1],c=financialContext(obra),p=projectFinancials(obra,c.defaults);
  const breakEven=projectFinancials(obra,{...c.defaults,saleM2Cents:Math.round(p.breakEvenM2Cents)});
  expect(Math.abs(breakEven.returnPercent)).toBeLessThan(.02);
});

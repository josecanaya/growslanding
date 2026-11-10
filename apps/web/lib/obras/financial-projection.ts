import { INVESTMENT_AS_OF, investmentFor, roundOverview } from './investment-demo';
import { packagesFor } from './unit-packages';
import type { Scenario } from './simulation';

export type FinancialInputs = { saleM2Cents: number; remainingCostCents: number; months: number };
export function financialContext(obra: Scenario) {
  const investment = investmentFor(obra);
  const index = Number(obra.id.slice(5)) - 1;
  const zoneM2Cents = (2000 + index * 60) * 100;
  const comparables = [0.88, 0.96, 1.03, 1.13].map((factor,i) => ({ id: `${obra.id}-comp-${i}`, name: `${obra.city} · Referencia ${i+1}`, area: 60+i*15, m2Cents: Math.round(zoneM2Cents*factor) }));
  const zoneAverage = Math.round(comparables.reduce((sum,c) => sum+c.m2Cents,0)/comparables.length);
  const units=packagesFor(obra);
  const currentM2Cents=units.length ? Math.round(units.reduce((sum,u) => sum+u.priceCents,0)/units.reduce((sum,u) => sum+u.area,0)) : Math.round(zoneAverage*0.94);
  const futureRounds=investment.rounds.filter(r => r.closes >= INVESTMENT_AS_OF);
  return {
    investment, comparables, zoneAverage, currentM2Cents,
    saleableArea: 420+index*30, cashCents: 6000000, debtCents: 4000000, sellingFeePercent: 6,
    futureCapitalCents: futureRounds.reduce((sum,r) => sum+r.offered*r.priceCents,0),
    dilutedUnits: investment.issued+futureRounds.reduce((sum,r) => sum+r.offered,0),
    defaults: { saleM2Cents: Math.round(zoneAverage*1.12), remainingCostCents: (280000+index*16000)*100, months: 14+index%3*2 } satisfies FinancialInputs,
  };
}

export function projectFinancials(obra: Scenario, inputs: FinancialInputs, variant: 'adverso' | 'base' | 'favorable' = 'base') {
  if (![inputs.saleM2Cents,inputs.remainingCostCents,inputs.months].every(Number.isSafeInteger) || inputs.saleM2Cents<=0 || inputs.saleM2Cents>10000000 || inputs.remainingCostCents<0 || inputs.remainingCostCents>100000000000 || inputs.months<1 || inputs.months>120) throw new Error('Supuestos fuera de rango.');
  const c=financialContext(obra);
  const saleM2Cents=Math.round(inputs.saleM2Cents*(variant==='adverso'?0.8:variant==='favorable'?1.12:1));
  const remainingCostCents=Math.round(inputs.remainingCostCents*(variant==='adverso'?1.2:variant==='favorable'?0.95:1));
  const months=variant==='adverso'?inputs.months+6:variant==='favorable'?Math.max(1,inputs.months-3):inputs.months;
  const grossSalesCents=saleM2Cents*c.saleableArea;
  const sellingFeesCents=Math.round(grossSalesCents*c.sellingFeePercent/100);
  const rawEquityCents=c.cashCents+c.futureCapitalCents+grossSalesCents-sellingFeesCents-remainingCostCents-c.debtCents;
  const distributableCents=Math.max(0,rawEquityCents);
  const terminalMcuCents=distributableCents/c.dilutedUnits;
  const entryCents=roundOverview(c.investment).active.priceCents;
  const multiple=terminalMcuCents/entryCents;
  const returnPercent=(multiple-1)*100;
  const annualizedPercent=(Math.pow(multiple,12/months)-1)*100;
  const fundingGapCents=Math.max(0,remainingCostCents-c.cashCents-c.futureCapitalCents);
  const breakEvenM2Cents=Math.max(0,(c.dilutedUnits*entryCents+remainingCostCents+c.debtCents-c.cashCents-c.futureCapitalCents)/(c.saleableArea*(1-c.sellingFeePercent/100)));
  const exitDate=new Date(INVESTMENT_AS_OF+'T12:00:00Z');exitDate.setUTCMonth(exitDate.getUTCMonth()+months);
  return { variant, saleM2Cents, remainingCostCents, months, grossSalesCents, sellingFeesCents, distributableCents, terminalMcuCents, entryCents, returnPercent, annualizedPercent, fundingGapCents, breakEvenM2Cents, rawEquityCents, exitDate:exitDate.toISOString().slice(0,10) };
}

export function projectedPosition(quantity: number, totalCents: number, terminalMcuCents: number) {
  const proceedsCents=Math.floor(quantity*terminalMcuCents);
  return {proceedsCents, gainCents: proceedsCents-totalCents};
}

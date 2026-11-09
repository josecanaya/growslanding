import type { Scenario } from './simulation';

export const INVESTMENT_AS_OF = '2026-11-09';
export type Round = { number: number; opens: string; closes: string; priceCents: number; offered: number; subscribed: number };
export type Investment = { obraId: string; ticker: string; referenceCents: number; issued: number; history: { date: string; cents: number }[]; rounds: Round[] };
const tickers = ['CPAT', 'RIBN', 'TSUR', 'AROM', 'DPAR', 'EHOR', 'MCEN', 'CLAG', 'ALAM', 'DENC', 'HVAL', 'CSEM', 'GLOG', 'POLI', 'TEST'];

export function investmentFor(obra: Pick<Scenario, 'id'>): Investment {
  const index = Number(obra.id.replace('demo-', '')) - 1;
  if (!Number.isInteger(index) || index < 0 || index >= tickers.length) throw new Error('Obra ficticia desconocida.');
  const referenceCents = 108 + index * 7;
  const issue = 100 + index * 5;
  const offered = 100000 + index * 10000;
  const upcoming = index % 3 === 2;
  return {
    obraId: obra.id, ticker: tickers[index], referenceCents, issued: 200000 + index * 15000,
    history: ['2026-06-09', '2026-07-09', '2026-08-09', '2026-09-09', '2026-10-09', '2026-11-09'].map((date, i) => ({ date, cents: referenceCents - [12, 8, 10, 5, 3, 0][i] })),
    rounds: [
      { number: 1, opens: '2026-07-01', closes: '2026-08-31', priceCents: issue - 10, offered: 200000 + index * 15000, subscribed: 200000 + index * 15000 },
      { number: 2, opens: upcoming ? '2026-11-20' : '2026-11-01', closes: upcoming ? '2026-12-20' : '2026-11-30', priceCents: issue, offered, subscribed: upcoming ? 0 : Math.round(offered * (0.42 + index % 4 * 0.1)) },
      { number: 3, opens: '2027-02-01', closes: '2027-03-15', priceCents: issue + 15, offered: offered + 20000, subscribed: 0 },
    ],
  };
}

export function roundStatus(round: Round, asOf = INVESTMENT_AS_OF): 'proxima' | 'abierta' | 'cerrada' {
  if (asOf < round.opens) return 'proxima';
  if (asOf > round.closes || round.subscribed >= round.offered) return 'cerrada';
  return 'abierta';
}
export function roundOverview(investment: Investment, asOf = INVESTMENT_AS_OF) {
  const open = investment.rounds.find(round => roundStatus(round, asOf) === 'abierta');
  const next = investment.rounds.filter(round => round.opens > asOf).sort((a, b) => a.opens.localeCompare(b.opens))[0];
  const active = open ?? next ?? investment.rounds.at(-1)!;
  return { open, next, active, available: Math.max(0, active.offered - active.subscribed), fundedPercent: Math.round(active.subscribed / active.offered * 100) };
}
export function subscriptionEstimate(round: Round, raw: string): { quantity: number; budgetCents: number; totalCents: number; remainderCents: number } | null {
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(raw.trim()) || !Number.isSafeInteger(round.priceCents) || round.priceCents < 1) return null;
  const [whole, fraction = ''] = raw.trim().replace(',', '.').split('.');
  const budgetCents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  const available = round.offered - round.subscribed;
  if (!Number.isSafeInteger(budgetCents) || budgetCents < round.priceCents || budgetCents > available * round.priceCents) return null;
  const quantity = Math.floor(budgetCents / round.priceCents);
  const totalCents = quantity * round.priceCents;
  return { quantity, budgetCents, totalCents, remainderCents: budgetCents - totalCents };
}
export function searchInvestments(works: Scenario[], query: string, status: 'todas' | 'abierta' | 'proxima') {
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
  return works.filter(obra => {
    const investment = investmentFor(obra);
    const overview = roundOverview(investment);
    return normalize(`${obra.name} ${obra.city} ${investment.ticker}`).includes(normalize(query.trim())) &&
      (status === 'todas' || (status === 'abierta' ? Boolean(overview.open) : !overview.open && Boolean(overview.next)));
  });
}

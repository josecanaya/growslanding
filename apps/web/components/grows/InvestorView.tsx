'use client';

import { useState } from 'react';
import { ArrowUpRight, Bell, CalendarDays, Search, TrendingUp } from 'lucide-react';
import type { Scenario } from '@/lib/obras/simulation';
import FinancialAnalysis from './FinancialAnalysis';
import { INVESTMENT_AS_OF, investmentFor, roundOverview, roundStatus, searchInvestments, subscriptionEstimate } from '@/lib/obras/investment-demo';

const money = (cents: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', currencyDisplay: 'code' }).format(cents / 100);
const integer = (value: number) => new Intl.NumberFormat('es-AR').format(value);
const date = (value: string) => new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value + 'T12:00:00Z'));
const panel = 'rounded-2xl border border-[#e0e5dc] bg-white p-5 sm:p-6';
const statusLabels = { abierta: 'Abierta', proxima: 'Próxima', cerrada: 'Cerrada' };

export function InvestmentTeaser({ obra }: { obra: Scenario }) {
  const investment=investmentFor(obra);
  const {open,next}=roundOverview(investment);
  return <div className="mx-5 mb-4 flex items-center justify-between gap-3 rounded-xl bg-[#f0f4e9] px-4 py-3"><div><p className="text-xs font-semibold">{investment.ticker} · {money(investment.referenceCents)} / MCU</p><p className="mt-1 text-[10px] text-[#829075]">Valor ilustrativo</p></div><span className="text-right text-xs text-[#647c50]">{open ? `Ronda ${open.number} abierta` : next ? `Próxima: ${date(next.opens)}` : 'Sin ronda abierta'}</span></div>;
}

export default function InvestorView({ obra, works, onOpen }: { obra: Scenario; works: Scenario[]; onOpen: (id: string) => void }) {
  const investment = investmentFor(obra);
  const { open, next, active, available, fundedPercent } = roundOverview(investment);
  const [amount, setAmount] = useState('3500');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'todas' | 'abierta' | 'proxima'>('todas');
  const [watching, setWatching] = useState(false);
  const [range, setRange] = useState<'3M' | '6M'>('6M');
  const estimate = subscriptionEstimate(active, amount);
  const history = range === '3M' ? investment.history.slice(-3) : investment.history;
  const low = Math.min(...history.map(p => p.cents)) - 2;
  const high = Math.max(...history.map(p => p.cents)) + 2;
  const points = history.map((p, i) => `${20 + i * 560 / (history.length - 1)},${130 - (p.cents - low) / (high - low) * 105}`).join(' ');
  const matches = searchInvestments(works, query, status);
  return <div className="space-y-5">
    <section className={panel}>
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-widest text-[#829075]">{investment.ticker} · MCU de {obra.name}</p><span className="rounded-full bg-[#eef2e7] px-3 py-1 text-[10px] text-[#718064]">Simulación · {date(INVESTMENT_AS_OF)}</span></div>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-sm text-[#718064]">Valor de referencia por MCU</h2><p className="mt-1 text-4xl font-semibold tracking-tight">{money(investment.referenceCents)}</p></div><div className="flex gap-2">{(['3M', '6M'] as const).map(r => <button key={r} onClick={() => setRange(r)} aria-pressed={range === r} className={`rounded-full px-4 py-2 text-xs ${range === r ? 'bg-[#193c32] text-white' : 'bg-[#f1f4ec]'}`}>{r}</button>)}</div></div>
      <svg viewBox="0 0 600 160" className="mt-4 w-full" role="img" aria-label={`Evolución ilustrativa de MCU ${investment.ticker}, último valor ${money(investment.referenceCents)}`}><line x1="20" y1="135" x2="580" y2="135" stroke="#e4eadc"/><line x1="20" y1="75" x2="580" y2="75" stroke="#edf0e8"/><polygon points={`20,135 ${points} 580,135`} fill="#eef4e7"/><polyline points={points} stroke="#6f9153" strokeWidth="3" fill="none"/>{history.map((p,i) => <circle key={p.date} cx={20 + i * 560 / (history.length - 1)} cy={130 - (p.cents-low)/(high-low)*105} r="4" fill="#6f9153"><title>{date(p.date)} · {money(p.cents)}</title></circle>)}</svg>
      <div className="flex justify-between text-[10px] text-[#829075]"><span>{date(history[0].date)}</span><span>{date(history.at(-1)!.date)}</span></div>
      <div className="mt-5 grid gap-4 border-t border-[#e6ebdf] pt-5 sm:grid-cols-3"><div><p className="text-xs text-[#829075]">MCU emitidas</p><p className="mt-1 font-semibold">{integer(investment.issued)}</p></div><div><p className="text-xs text-[#829075]">Precio de {open ? 'ronda abierta' : 'próxima ronda'}</p><p className="mt-1 font-semibold">{money(active.priceCents)} / MCU</p></div><div><p className="text-xs text-[#829075]">Capital representado a referencia</p><p className="mt-1 font-semibold">{money(investment.issued * investment.referenceCents)}</p></div></div>
      <p className="mt-4 text-[11px] leading-relaxed text-[#829075]">Las MCU representan participaciones ficticias de esta obra. Precios e historial ilustrativos; esta vista no acredita acciones societarias ni una cotización de mercado real.</p>
    </section>
    <FinancialAnalysis key={obra.id} obra={obra} position={estimate}/>
    <section className={panel}>
      <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Ronda {active.number}</h2><span className="rounded-full bg-[#e9efdf] px-3 py-1 text-xs">{statusLabels[roundStatus(active)]}</span></div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2"><div><p className="text-xs text-[#829075]">Objetivo de la ronda</p><p className="mt-1 text-2xl font-semibold">{money(active.offered * active.priceCents)}</p></div><div><p className="text-xs text-[#829075]">Suscripciones simuladas</p><p className="mt-1 text-2xl font-semibold">{money(active.subscribed * active.priceCents)}</p></div></div>
      <progress value={fundedPercent} max={100} aria-label="Financiación de la ronda" className="mt-5 h-2 w-full accent-[#7e9d64]"/><div className="mt-2 flex justify-between gap-3 text-xs text-[#718064]"><span>{fundedPercent}% suscrito</span><span>{integer(available)} MCU disponibles</span></div>
      <div className="mt-5 flex flex-wrap gap-5 text-sm"><span className="flex items-center gap-2"><CalendarDays size={16}/> Abre {date(active.opens)}</span><span>Cierra {date(active.closes)}</span></div>
      <div className="mt-5 rounded-xl bg-[#f2f5ee] p-4">
        <label htmlFor="investment-usd" className="text-sm font-semibold">¿Cuántos USD querés invertir?</label>
        <div className="mt-3 flex flex-wrap items-center gap-3"><span className="text-sm font-semibold">USD</span><input id="investment-usd" type="text" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="3500" className="w-36 rounded-xl border border-[#dae3cf] bg-white px-3 py-2"/><span className="text-sm">a {money(active.priceCents)} por MCU</span><div className="ml-auto text-right"><p className="text-xs text-[#829075]">Recibís</p><strong aria-live="polite" className="text-2xl">{estimate ? integer(estimate.quantity) + ' MCU' : '—'}</strong></div></div>
        {estimate && <div className="mt-4 flex flex-wrap justify-between gap-3 border-t border-[#dce4d4] pt-3 text-xs text-[#718064]"><span>Importe aplicado: <strong>{money(estimate.totalCents)}</strong></span><span>Diferencia sin aplicar: <strong>{money(estimate.remainderCents)}</strong></span></div>}
        {!estimate && <p role="alert" className="mt-3 text-xs text-red-700">Ingresá un importe entre {money(active.priceCents)} y {money(available * active.priceCents)}, con hasta dos decimales.</p>}
        <p className="mt-3 text-xs text-[#829075]">Se calculan MCU enteras; la diferencia queda sin aplicar. Simulación sin compra, reserva ni pago.</p>
        {estimate && <a href="#projection-position" className="mt-3 inline-block text-xs font-semibold text-[#52763d] underline">Ver el resultado proyectado de este monto ↑</a>}
      </div>
      <button aria-pressed={watching} onClick={() => setWatching(!watching)} className="mt-5 flex items-center gap-2 rounded-full bg-[#193c32] px-5 py-3 text-sm text-white"><Bell size={16}/>{watching ? 'Ronda en seguimiento ✓' : 'Seguir esta ronda'}</button>{watching && <p role="status" className="mt-3 text-xs text-[#718064]">Agregada al seguimiento de esta sesión.</p>}
    </section>
    <section className={panel}><h2 className="text-xl font-semibold">Calendario de rondas</h2>{next && <div className="my-4 rounded-xl bg-[#eaf0e1] p-4 text-sm"><strong>Próxima: ronda {next.number}</strong><p className="mt-1">{date(next.opens)} · {money(next.priceCents)} por MCU · {integer(next.offered)} MCU</p></div>}<div className="overflow-x-auto"><table className="mt-4 w-full text-left text-sm"><thead className="text-xs text-[#829075]"><tr><th className="py-3 pr-4">Ronda</th><th className="pr-4">Fechas</th><th className="pr-4">USD / MCU</th><th className="pr-4">Emisión</th><th>Estado</th></tr></thead><tbody>{investment.rounds.map(r => <tr key={r.number} className="border-t border-[#e7ebdf]"><td className="py-4 pr-4 font-semibold">{r.number}</td><td className="pr-4 text-xs">{date(r.opens)}<br/>{date(r.closes)}</td><td className="pr-4">{money(r.priceCents)}</td><td className="pr-4">{integer(r.offered)}</td><td className="text-xs">{statusLabels[roundStatus(r)]}</td></tr>)}</tbody></table></div></section>
    <section className={panel}><div className="flex items-center gap-2"><TrendingUp size={20}/><h2 className="text-xl font-semibold">Explorá acciones MCU</h2></div><p className="mt-2 text-sm text-[#829075]">Encontrá participaciones y próximas rondas en otras obras.</p><div className="mt-4 flex items-center gap-3 rounded-xl border border-[#dce4d4] px-3 py-3"><Search size={17}/><input type="search" aria-label="Buscar acciones MCU" placeholder="Obra, símbolo MCU o ciudad" value={query} onChange={e => setQuery(e.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none"/></div><div className="mt-3 flex flex-wrap gap-2">{([{id:'todas',label:'Todas'},{id:'abierta',label:'Rondas abiertas'},{id:'proxima',label:'Próximas aperturas'}] as const).map(f => <button key={f.id} aria-pressed={status === f.id} onClick={() => setStatus(f.id)} className={`rounded-full px-3 py-2 text-xs ${status === f.id ? 'bg-[#193c32] text-white' : 'bg-[#f1f4ec]'}`}>{f.label}</button>)}</div><div className="mt-4 divide-y divide-[#e6ebdf]">{matches.map(w => {const item=investmentFor(w);const summary=roundOverview(item);return <button key={w.id} onClick={() => onOpen(w.id)} className="flex w-full items-center gap-3 py-4 text-left"><img src={`/images/obras/${w.id}.webp`} alt="" className="h-12 w-12 rounded-xl object-cover"/><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{item.ticker} · {w.name}</p><p className="mt-1 text-xs text-[#829075]">{w.city} · {summary.open ? `Ronda ${summary.open.number} abierta` : `Abre ${date(summary.next!.opens)}`}</p></div><div className="text-right"><p className="text-sm font-semibold">{money(item.referenceCents)}</p><p className="text-[10px] text-[#829075]">por MCU</p></div><ArrowUpRight size={15}/></button>;})}</div>{!matches.length && <p role="status" className="py-6 text-sm text-[#829075]">No encontramos acciones MCU con esos filtros.</p>}</section>
  </div>;
}

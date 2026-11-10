'use client';

import { useState } from 'react';
import type { Scenario } from '@/lib/obras/simulation';
import { INVESTMENT_AS_OF, roundOverview } from '@/lib/obras/investment-demo';
import { financialContext, projectFinancials, projectedPosition } from '@/lib/obras/financial-projection';

const money=(cents:number)=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'USD',currencyDisplay:'code'}).format(cents/100);
const number=(n:number)=>new Intl.NumberFormat('es-AR',{maximumFractionDigits:1}).format(n);
const percent=(n:number)=>(n>0?'+':'')+number(n)+'%';
const date=(d:string)=>new Intl.DateTimeFormat('es-AR',{month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(d+'T12:00:00Z'));
const panel='rounded-2xl border border-[#e0e5dc] bg-white p-5 sm:p-6';
const tone=(n:number)=>n<0?'text-[#a34d43]':'text-[#52763d]';

export default function FinancialAnalysis({obra,position}:{obra:Scenario;position:{quantity:number;totalCents:number}|null}) {
  const context=financialContext(obra);
  const investment=context.investment;
  const target=projectFinancials(obra,context.defaults);
  const {active}=roundOverview(investment);
  const [range,setRange]=useState<'3M'|'6M'>('6M');
  const history=range==='3M'?investment.history.slice(-3):investment.history;
  const pastMonths=history.length-1;
  const maxValue=Math.max(...history.map(p=>p.cents),target.terminalMcuCents)*1.18;
  const x=(month:number)=>52+(month+pastMonths)/(target.months+pastMonths)*600;
  const y=(cents:number)=>240-cents/maxValue*205;
  const points=history.map((p,i)=>`${x(i-pastMonths)},${y(p.cents)}`).join(' ');
  const upside=(target.terminalMcuCents/investment.referenceCents-1)*100;
  const discount=(context.currentM2Cents/context.zoneAverage-1)*100;
  const personal=position?projectedPosition(position.quantity,position.totalCents,target.terminalMcuCents):null;
  return <div className="space-y-5">
    <section className={panel} aria-label="General de MCU">
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-widest text-[#829075]">{investment.ticker} · MCU de {obra.name}</p><span className="rounded-full bg-[#eef2e7] px-3 py-1 text-[10px] text-[#718064]">Simulación · {date(INVESTMENT_AS_OF)}</span></div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2"><div><h2 className="text-sm text-[#718064]">Valor de referencia por MCU</h2><p className="mt-1 text-4xl font-semibold tracking-tight">{money(investment.referenceCents)}</p></div><div className="sm:text-right"><h2 className="text-sm text-[#718064]">Valor objetivo por MCU</h2><p className="mt-1 text-4xl font-semibold tracking-tight text-[#6f9153]">{money(target.terminalMcuCents)}</p><p className="mt-2 text-xs text-[#829075]">{date(target.exitDate)} · Horizonte {target.months} meses</p></div></div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className={`text-sm font-semibold ${tone(upside)}`}>{percent(upside)} de potencial hasta el objetivo</p><div className="flex gap-2">{(['3M','6M'] as const).map(r=><button key={r} aria-pressed={range===r} onClick={()=>setRange(r)} className={`rounded-full px-4 py-2 text-xs ${range===r?'bg-[#193c32] text-white':'bg-[#f1f4ec]'}`}>{r}</button>)}</div></div>
      <svg viewBox="0 0 720 290" className="mt-5 w-full" role="img" aria-label={`Historial y único valor objetivo MCU ${investment.ticker}: ${money(target.terminalMcuCents)}`}>
        <rect x={x(0)} y="20" width={652-x(0)} height="220" fill="#f4f7ee"/>
        {[0,.25,.5,.75,1].map(f=><g key={f}><line x1="52" x2="652" y1={y(maxValue*f)} y2={y(maxValue*f)} stroke="#e4eadc"/><text x="44" y={y(maxValue*f)+4} textAnchor="end" fontSize="10" fill="#829075">{number(maxValue*f/100)}</text></g>)}
        <text x="52" y="13" fontSize="10" fill="#829075">USD / MCU</text>
        <polygon points={`52,240 ${points} ${x(0)},240`} fill="#eaf1e1"/>
        <polyline points={points} stroke="#193c32" strokeWidth="3" fill="none"/>
        <line x1={x(0)} x2={x(0)} y1="20" y2="240" stroke="#c1cdb6" strokeDasharray="4 4"/>
        <line data-testid="target-projection" x1={x(0)} y1={y(investment.referenceCents)} x2={x(target.months)} y2={y(target.terminalMcuCents)} stroke="#6f9153" strokeWidth="3" strokeDasharray="7 5"/>
        <circle cx={x(0)} cy={y(investment.referenceCents)} r="4" fill="#193c32"/>
        <circle cx={x(target.months)} cy={y(target.terminalMcuCents)} r="6" fill="#6f9153"><title>Valor objetivo: {money(target.terminalMcuCents)} · {date(target.exitDate)}</title></circle>
        <text x="652" y={Math.max(24,y(target.terminalMcuCents)-15)} textAnchor="end" fontSize="13" fontWeight="600" fill="#52763d">Objetivo {money(target.terminalMcuCents)}</text>
        <text x="52" y="260" fontSize="10" fill="#829075">{date(history[0].date)}</text><text x={x(0)} y="279" textAnchor="middle" fontSize="10" fill="#829075">Hoy · {date(INVESTMENT_AS_OF)}</text><text x="652" y="260" textAnchor="end" fontSize="10" fill="#829075">{date(target.exitDate)}</text>
      </svg>
      <div className="flex flex-wrap gap-5 text-[11px] text-[#718064]"><span>━ Historial de referencia</span><span className="text-[#6f9153]">┄ Proyección al valor objetivo</span></div>
      <div className="mt-5 grid gap-4 border-t border-[#e6ebdf] pt-5 sm:grid-cols-3"><div><p className="text-xs text-[#829075]">MCU emitidas</p><p className="mt-1 font-semibold">{number(investment.issued)}</p></div><div><p className="text-xs text-[#829075]">Precio de ronda por MCU</p><p className="mt-1 font-semibold">{money(active.priceCents)}</p></div><div><p className="text-xs text-[#829075]">Capital a valor de referencia</p><p className="mt-1 font-semibold">{money(investment.issued*investment.referenceCents)}</p></div></div>
      <p className="mt-4 text-[11px] leading-relaxed text-[#829075]">Valor objetivo ilustrativo de distribución al cierre, sujeto a ventas, costos y emisiones previstas. No es una cotización futura garantizada; la línea punteada no representa operaciones intermedias.</p>
      {personal&&position&&<div id="projection-position" className="mt-5 scroll-mt-28 rounded-xl bg-[#f0f4e9] p-4"><div className="flex flex-wrap justify-between gap-3"><h3 className="text-sm font-semibold">Tu participación al valor objetivo</h3><a href="#investment-usd" className="text-xs text-[#52763d] underline">Cambiar monto USD ↓</a></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><p className="text-xs text-[#718064]">Importe aplicado<strong className="mt-1 block text-base text-[#20382f]">{money(position.totalCents)}</strong></p><p className="text-xs text-[#718064]">Valor al objetivo<strong aria-live="polite" className="mt-1 block text-base text-[#20382f]">{money(personal.proceedsCents)}</strong></p><p className="text-xs text-[#718064]">Resultado potencial<strong className={`mt-1 block text-base ${tone(personal.gainCents)}`}>{personal.gainCents>0?'+':''}{money(personal.gainCents)}</strong></p></div></div>}
      <details className="mt-5 border-t border-[#e6ebdf] pt-4 text-xs text-[#718064]"><summary className="cursor-pointer font-semibold">Cómo se calcula el valor objetivo</summary><div className="mt-3 divide-y divide-[#e6ebdf]">{[
        ['Superficie vendible',number(context.saleableArea)+' m²'],['Venta objetivo por m²',money(target.saleM2Cents)],['Ventas estimadas',money(target.grossSalesCents)],['Caja inicial',money(context.cashCents)],['Capital de rondas pendientes',money(context.futureCapitalCents)],['Costos pendientes','− '+money(target.remainingCostCents)],['Comercialización','− '+money(target.sellingFeesCents)],['Deuda a cancelar','− '+money(context.debtCents)],['Saldo para distribuir',money(target.distributableCents)],['MCU previstas después de emisiones',number(context.dilutedUnits)],
      ].map(([label,value])=><div key={label} className="flex justify-between gap-4 py-2"><span>{label}</span><strong className="text-right">{value}</strong></div>)}</div><p className="mt-3 leading-relaxed">Objetivo por MCU = saldo para distribuir / MCU previstas. Se supone cierre de las rondas pendientes y reparto proporcional. La caja inicial excluye esas rondas; no se suman otra vez emisiones cerradas. No incluye impuestos personales, inflación ni costo financiero adicional. No se supone liquidez antes del cierre.</p>{target.fundingGapCents>0&&<p className="mt-3">El cierre requiere financiación adicional por {money(target.fundingGapCents)}, cuyo costo no está modelado.</p>}</details>
    </section>
    <section className={panel}><h2 className="text-xl font-semibold">El m² de {obra.name}</h2><div className="mt-5 grid gap-4 sm:grid-cols-3"><div><p className="text-xs text-[#829075]">Publicado del proyecto</p><p className="mt-2 text-xl font-semibold">{money(context.currentM2Cents)}</p></div><div><p className="text-xs text-[#829075]">Promedio de la zona</p><p className="mt-2 text-xl font-semibold">{money(context.zoneAverage)}</p></div><div><p className="text-xs text-[#829075]">Venta objetivo por m²</p><p className="mt-2 text-xl font-semibold text-[#6f9153]">{money(target.saleM2Cents)}</p></div></div><p className="mt-4 text-xs text-[#718064]">El m² publicado está {number(Math.abs(discount))}% {discount<0?'por debajo':'por encima'} del promedio de las referencias simuladas de {obra.city}.</p>
      <details className="mt-5 border-t border-[#e6ebdf] pt-4 text-xs text-[#718064]"><summary className="cursor-pointer font-semibold">Comparables de {obra.city}</summary><div className="mt-3 overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-[#829075]"><tr><th className="py-3 pr-4">Referencia ficticia</th><th className="pr-4">Superficie</th><th>USD / m²</th></tr></thead><tbody>{context.comparables.map(c=><tr key={c.id} className="border-t border-[#e6ebdf]"><td className="py-3 pr-4">{c.name}</td><td className="pr-4">{c.area} m²</td><td>{money(c.m2Cents)}</td></tr>)}</tbody></table></div><p className="mt-3 leading-relaxed">Dataset ficticio · {date(INVESTMENT_AS_OF)}. Media simple de cuatro referencias de obra terminada, sin avisos ni ventas reales. El m² publicado proviene de los paquetes y sus áreas; en obras sin paquetes es sintético. La comparación no ajusta por tipología, plazo ni riesgo. Para una obra real deben incorporarse comparables verificados.</p></details>
    </section>
  </div>;
}

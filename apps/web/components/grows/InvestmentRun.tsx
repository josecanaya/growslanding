import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { PublicObra } from '@/lib/obras/publication';

const format = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });
const roundLabels: Record<string, string> = {
  borrador: 'En preparación',
  abierta: 'Abierta en el ensayo',
  cerrada_exitosa: 'Cerrada con objetivo alcanzado',
  cerrada_fallida: 'Cerrada sin alcanzar el objetivo',
  cancelada: 'Cancelada',
};

export function roundLabel(estado: string) {
  return roundLabels[estado] ?? estado.replaceAll('_', ' ');
}

export default function InvestmentRun({ run }: { run: NonNullable<PublicObra['simulation']> }) {
  const metrics = [
    ['Avance físico', run.avance_fisico_pct],
    ['Certificado', run.certificado_pct],
    ['Pagado', run.pagado_pct],
  ] as const;

  return (
    <section id="inversion" className="scroll-mt-28 space-y-5 rounded-3xl border border-[#e3e8df] bg-white p-5 sm:p-[22px]">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Inversión y rondas</h2>
        <p className="mt-1 text-[13px] text-[#5a6b61]">Ensayo automatizado · Día simulado {run.dia}</p>
      </div>
      {run.rondas.length ? (
        <ol className="space-y-2.5">
          {run.rondas.map((round, index) => {
            const open = round.estado === 'abierta';
            return (
              <li key={index} className={`flex flex-wrap items-center justify-between gap-2 rounded-2xl p-3.5 text-sm ${open ? 'border border-[#ecd98a] bg-[#fdf8e4]' : 'bg-[#f4f5f0]'}`}>
                <div>
                  <h3 className="font-semibold">Ronda {index + 1}</h3>
                  <p className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${open ? 'bg-[#fbf3d0] text-[#6b5000]' : 'text-[#5a6b61]'}`}>{roundLabel(round.estado)}</p>
                </div>
                <strong>{format.format(round.mcu_integradas)} MCU integradas</strong>
              </li>
            );
          })}
        </ol>
      ) : <p className="rounded-2xl bg-[#f4f5f0] p-4 text-sm">Todavía no hay rondas en esta corrida.</p>}
      <dl className="space-y-3">
        {metrics.map(([label, value]) => (
          <div key={label}>
            <div className="flex items-baseline justify-between text-sm"><dt className="text-[#5a6b61]">{label}</dt><dd className="font-semibold">{format.format(value)}%</dd></div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#e3eadd]" aria-hidden="true"><div className="h-full rounded-full bg-[#4f6b3f]" style={{ width: Math.min(100, value) + '%' }} /></div>
          </div>
        ))}
      </dl>
      <Link href="/inversores/panel" className="flex min-h-12 w-full items-center justify-center gap-1.5 rounded-full bg-[#e8c547] px-4 text-[15px] font-bold text-[#1d3329] hover:bg-[#dcb83a]">Abrir panel de inversor <ArrowUpRight size={17} aria-hidden="true" /></Link>
      <p className="text-xs leading-relaxed text-[#5a6b61]">En el entorno de pruebas se abre una ronda, se suscriben MCU y se integra el aporte ficticio. Las operaciones con dinero real siguen deshabilitadas.</p>
      <a href={`https://github.com/josecanaya/growslanding/actions/runs/${run.corrida}`} className="inline-flex min-h-11 items-center gap-1 text-[13px] font-semibold hover:underline">Ver corrida de la automatización <ArrowUpRight size={16} aria-hidden="true" /></a>
    </section>
  );
}

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

export default function InvestmentRun({ run }: { run: NonNullable<PublicObra['simulation']> }) {
  const metrics = [
    ['Avance físico', run.avance_fisico_pct],
    ['Certificado', run.certificado_pct],
    ['Pagado', run.pagado_pct],
  ] as const;

  return (
    <section id="inversion" className="mt-5 scroll-mt-28 space-y-5 rounded-3xl border border-[#dee5d9] bg-white p-5 sm:p-6">
      <div>
        <h2 className="text-xl font-semibold">Inversión y rondas</h2>
        <p className="mt-1 text-sm text-[#53695d]">Ensayo automatizado de Pasaje Alvear · Día simulado {run.dia}</p>
      </div>
      {run.rondas.length ? (
        <ol className="divide-y divide-[#e2e8df] rounded-2xl border border-[#e2e8df]">
          {run.rondas.map((round, index) => (
            <li key={index} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
              <div><h3 className="font-semibold">Ronda {index + 1}</h3><p className="mt-1 text-xs text-[#53695d]">{roundLabels[round.estado] ?? round.estado.replaceAll('_', ' ')}</p></div>
              <strong>{format.format(round.mcu_integradas)} MCU integradas</strong>
            </li>
          ))}
        </ol>
      ) : <p className="rounded-2xl bg-[#f0f3ed] p-4 text-sm">Todavía no hay rondas en esta corrida.</p>}
      <dl className="grid grid-cols-3 gap-2 rounded-2xl bg-[#f0f3ed] px-4 py-3">
        {metrics.map(([label, value]) => <div key={label}><dt className="text-xs text-[#53695d]">{label}</dt><dd className="font-semibold">{format.format(value)}%</dd></div>)}
      </dl>
      <div className="space-y-2 text-sm">
        <h3 className="font-semibold">Cómo se prueba una suscripción</h3>
        <p className="text-[#53695d]">En el entorno de pruebas se abre una ronda, se suscriben MCU y se integra el aporte ficticio. En esta ficha podés seguir los resultados que publica la automatización. Las operaciones con dinero real siguen deshabilitadas.</p>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold">
        <Link href="/inversores/panel" className="inline-flex items-center gap-1 hover:underline">Abrir panel de inversor <ArrowUpRight size={16} /></Link>
        <a href={`https://github.com/josecanaya/growslanding/actions/runs/${run.corrida}`} className="inline-flex items-center gap-1 hover:underline">Ver corrida de la automatización <ArrowUpRight size={16} /></a>
      </div>
    </section>
  );
}

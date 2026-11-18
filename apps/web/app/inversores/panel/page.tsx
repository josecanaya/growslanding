import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import InvestorDemoPanel from '@/components/grows/InvestorDemoPanel';

export const metadata: Metadata = { title: 'Grows · Panel de inversor' };

export default function InvestorPanelPage() {
  return (
    <section className="min-h-screen bg-[#f5f6f1] px-4 py-6 text-[#20382f] sm:px-6 sm:py-9">
      <div className="mx-auto max-w-[900px]">
        <Link href="/inversores" className="inline-flex items-center gap-2 text-sm font-semibold text-[#53695d] hover:underline">
          <ArrowLeft size={16} /> Volver al feed
        </Link>
        <header className="my-6">
          <div className="flex items-center gap-3">
            <TrendingUp size={26} aria-hidden="true" />
            <h1 className="text-3xl font-semibold tracking-tight">Panel de inversor</h1>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[#53695d]">Explorá precios, proyecciones y rondas. Ingresá un monto para ver cuántas MCU representaría y su valor proyectado.</p>
        </header>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#e8efe4] px-5 py-4 text-sm">
          <p><strong>Simulación.</strong> Los importes y la posición son ilustrativos.</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 font-semibold">
            <a href="#investment-usd" className="underline">Calcular mis MCU</a>
            <a href="#projection-position" className="underline">Mi posición simulada</a>
          </div>
        </div>
        <InvestorDemoPanel />
      </div>
    </section>
  );
}

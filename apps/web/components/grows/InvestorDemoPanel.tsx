'use client';

import { useState } from 'react';
import InvestorView from './InvestorView';
import { createScenarios } from '@/lib/obras/simulation';

const examples = createScenarios();

export default function InvestorDemoPanel() {
  const [selected, setSelected] = useState(examples[0]);
  function openExample(id: string) {
    const next = examples.find((work) => work.id === id);
    if (!next) return;
    setSelected(next);
    document.getElementById('obra-de-ejemplo')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <>
      <section id="obra-de-ejemplo" className="mb-5 scroll-mt-6 rounded-2xl border border-[#e0e5dc] bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{selected.name}</h2>
            <p className="text-sm text-[#53695d]">{selected.city} · Obra de ejemplo</p>
          </div>
          <label className="flex flex-col gap-1 text-sm font-semibold">
            Cambiar obra de ejemplo
            <select value={selected.id} onChange={(event) => openExample(event.target.value)} className="rounded-xl border border-[#dce4d4] bg-white px-3 py-2 font-normal">
              {examples.map((work) => <option key={work.id} value={work.id}>{work.name} · {work.city}</option>)}
            </select>
          </label>
        </div>
      </section>
      <InvestorView key={selected.id} obra={selected} works={examples} onOpen={openExample} />
    </>
  );
}

'use client';

import type { Route } from 'next';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SectionHeader } from '@/components/cliente/SectionHeader';
import { Button } from '@/components/ui/grows';
import { ArrowLeft } from 'lucide-react';

export default function NuevaObraPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <Button variant="ghost" size="sm" onClick={() => router.push('/cliente/obras' as Route)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a obras
      </Button>
      <SectionHeader
        eyebrow="Alta"
        title="Nueva obra (prototipo)"
        description="Formulario visual sin persistencia: tres pasos simulados."
      />
      <div className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-sm">
        <div className="mb-6 flex gap-2">
          {['Datos', 'Ubicación', 'Confirmación'].map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(i)}
              className={`flex-1 rounded-lg px-2 py-2 text-xs font-bold uppercase tracking-wide ${
                step === i ? 'bg-sky-700 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {i + 1}. {label}
            </button>
          ))}
        </div>
        {step === 0 ? (
          <div className="space-y-3 text-sm">
            <label className="block font-medium text-slate-700">Nombre de obra</label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              defaultValue="Ampliación depósito Fisherton"
              readOnly
            />
            <label className="block font-medium text-slate-700">Tipo</label>
            <input className="w-full rounded-lg border border-slate-200 px-3 py-2" defaultValue="Ampliación" readOnly />
          </div>
        ) : null}
        {step === 1 ? (
          <div className="space-y-3 text-sm">
            <label className="block font-medium text-slate-700">Dirección</label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              defaultValue="Calle Los Alamos 450"
              readOnly
            />
          </div>
        ) : null}
        {step === 2 ? (
          <p className="text-sm text-slate-600">
            Revisión final simulada. Al conectar backend, aquí se confirmaría el alta en Supabase.
          </p>
        ) : null}
        <div className="mt-6 flex justify-between gap-2">
          <Button variant="secondary" type="button" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
            Anterior
          </Button>
          {step < 2 ? (
            <Button variant="primary" type="button" onClick={() => setStep((s) => Math.min(2, s + 1))}>
              Siguiente
            </Button>
          ) : (
            <Button variant="primary" type="button" onClick={() => router.push('/cliente/obras' as Route)}>
              Finalizar (mock)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

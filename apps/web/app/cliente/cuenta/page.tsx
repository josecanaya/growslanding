'use client';

import { SectionHeader } from '@/components/cliente/SectionHeader';
import { MOCK_ORGANIZACION, MOCK_USUARIO } from '@/lib/mocks/clienteMockData';
import { Button } from '@/components/ui/grows';

export default function ClienteCuentaPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <SectionHeader
        eyebrow="Perfil"
        title="Cuenta"
        description="Datos de usuario y organización (mock)."
      />
      <div className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-700 text-lg font-bold text-white">
            {MOCK_USUARIO.iniciales}
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">{MOCK_USUARIO.nombre}</p>
            <p className="text-sm text-slate-600">{MOCK_USUARIO.email}</p>
            <p className="text-xs text-slate-500">{MOCK_USUARIO.rolLabel}</p>
          </div>
        </div>
        <div className="mt-6 border-t border-slate-100 pt-6">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Organización</p>
          <p className="mt-1 font-semibold text-slate-900">{MOCK_ORGANIZACION.nombre}</p>
          <p className="text-sm text-slate-600">{MOCK_ORGANIZACION.ubicacion}</p>
          <p className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
            Plan {MOCK_ORGANIZACION.plan}
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" type="button">
            Preferencias (mock)
          </Button>
          <Button variant="ghost" size="sm" type="button">
            Facturación (mock)
          </Button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { Bell } from 'lucide-react';
import { SectionHeader } from '@/components/cliente/SectionHeader';
import { MOCK_NOTIFICACIONES } from '@/lib/mocks/clienteMockData';

export default function ClienteNotificacionesPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <SectionHeader
        eyebrow="Centro de avisos"
        title="Notificaciones"
        description="Eventos simulados: validaciones, presupuestos e hitos."
      />
      <ul className="space-y-2">
        {MOCK_NOTIFICACIONES.map((n) => (
          <li
            key={n.id}
            className={`flex gap-3 rounded-xl border border-slate-200/90 p-4 ${
              n.leida ? 'bg-white' : 'bg-sky-50/80'
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-sky-700 shadow-sm">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">{n.titulo}</p>
              <p className="text-sm text-slate-600">{n.cuerpo}</p>
              <p className="mt-1 text-xs text-slate-400">{n.fecha}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

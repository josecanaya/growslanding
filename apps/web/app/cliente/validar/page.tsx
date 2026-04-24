'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { SectionHeader } from '@/components/cliente/SectionHeader';
import { ValidacionCard } from '@/components/cliente/ValidacionCard';
import { MOCK_VALIDACIONES } from '@/lib/mocks/clienteMockData';

export default function ClienteValidarPage() {
  const { toast } = useToast();
  const [items, setItems] = useState(MOCK_VALIDACIONES);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <SectionHeader
        eyebrow="Control de calidad"
        title="Validaciones pendientes"
        description="Evidencia y montos simulados. Los botones solo muestran toast (sin backend)."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {items.length === 0 ? (
          <p className="col-span-full rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            No quedan validaciones en esta sesión mock.
          </p>
        ) : (
          items.map((v) => (
            <ValidacionCard
              key={v.id}
              obraNombre={v.obraNombre}
              bloque={v.bloque}
              socio={v.socio}
              enviado={v.enviado}
              fotos={v.fotos}
              montoEstimado={v.montoEstimado}
              onAprobar={() => {
                toast({ title: 'Aprobado (mock)', description: v.bloque });
                setItems((prev) => prev.filter((x) => x.id !== v.id));
              }}
              onRechazar={() => {
                toast({ title: 'Rechazado (mock)', description: v.bloque });
                setItems((prev) => prev.filter((x) => x.id !== v.id));
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

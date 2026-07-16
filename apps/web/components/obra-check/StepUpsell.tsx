'use client';

import { useEffect, useState } from 'react';
import { Eye, TrendingUp, ShieldCheck } from 'lucide-react';
import { obraCheckApi } from '@/lib/obra-check/client';
import { BRAND, OCButton, OCCard } from './ui';

export function StepUpsell({
  sessionId,
  enviados,
  contratistas,
  duracionDias,
  tareasCriticas,
  totalTareas,
}: {
  sessionId: string | null;
  enviados: number;
  contratistas: number;
  duracionDias: number;
  tareasCriticas: number;
  totalTareas: number;
}) {
  const [leadsCount, setLeadsCount] = useState(0);

  useEffect(() => {
    obraCheckApi.event('upsell_view', { enviados, contratistas });
    obraCheckApi
      .listLeads()
      .then((l) => setLeadsCount(l.length))
      .catch(() => {});
  }, [enviados, contratistas]);

  const ctaHref = `/auth/login?utm_source=obra_check${sessionId ? `&session=${sessionId}` : ''}`;

  return (
    <div className="mx-auto max-w-xl text-center">
      <div className="mb-4">
        <h2 className="text-2xl font-extrabold" style={{ color: BRAND.blue }}>
          Mandaste el trabajo. ¿Ahora cómo sabés si se hizo?
        </h2>
      </div>

      <OCCard className="mb-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat value={totalTareas} label="tareas" />
          <Stat value={`${duracionDias}`} label="días de plan" />
          <Stat value={tareasCriticas} label="críticas" />
        </div>
        <p className="mt-3 text-sm" style={{ color: BRAND.muted }}>
          Enviaste <b>{enviados}</b> formulario(s). Capturaste{' '}
          <b style={{ color: BRAND.green }}>{leadsCount}</b> contacto(s) reales del contratista.
        </p>
      </OCCard>

      <OCCard className="mb-4" style={{ borderColor: BRAND.gold, background: '#FFFDF5' }}>
        <p className="mb-3 text-sm font-semibold" style={{ color: BRAND.text }}>
          Desde acá, por WhatsApp, no vas a poder saber:
        </p>
        <div className="space-y-2 text-left">
          <Blind icon={<Eye size={16} />} text="Si lo recibieron y arrancaron" />
          <Blind icon={<TrendingUp size={16} />} text="Cómo viene el avance real de cada tarea" />
          <Blind icon={<ShieldCheck size={16} />} text="Si hay atrasos en el camino crítico o problemas de pago" />
        </div>
      </OCCard>

      <a href={ctaHref} onClick={() => obraCheckApi.event('upsell_click')}>
        <OCButton className="w-full">Activá el seguimiento con Grows — tus tareas ya están cargadas</OCButton>
      </a>
      <p className="mt-3 text-xs" style={{ color: BRAND.muted }}>
        Diagnóstico, envío y captura de contacto: gratis. Seguimiento de ejecución: Grows.
      </p>
    </div>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <p className="text-2xl font-extrabold" style={{ color: BRAND.blue }}>
        {value}
      </p>
      <p className="text-xs" style={{ color: BRAND.muted }}>
        {label}
      </p>
    </div>
  );
}

function Blind({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm" style={{ color: BRAND.text }}>
      <span style={{ color: BRAND.gold }}>{icon}</span>
      {text}
    </div>
  );
}

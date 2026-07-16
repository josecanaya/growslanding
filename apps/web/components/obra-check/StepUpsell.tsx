'use client';

import { useEffect, useState } from 'react';
import { Eye, TrendingUp, ShieldCheck, Mail, CheckCircle2 } from 'lucide-react';
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
  const [emailStatus, setEmailStatus] = useState<'pending' | 'sent' | 'already' | 'error'>('pending');

  useEffect(() => {
    obraCheckApi.event('upsell_view', { enviados, contratistas });
    obraCheckApi
      .listLeads()
      .then((l) => setLeadsCount(l.length))
      .catch(() => {});

    obraCheckApi
      .complete()
      .then((r) => setEmailStatus(r.alreadySent ? 'already' : r.sent ? 'sent' : 'error'))
      .catch(() => setEmailStatus('error'));
  }, [enviados, contratistas]);

  const ctaHref = `/auth/login?utm_source=obra_check${sessionId ? `&session=${sessionId}` : ''}`;

  return (
    <div className="mx-auto max-w-xl text-center">
      <div className="mb-4">
        <h2 className="text-2xl font-extrabold" style={{ color: BRAND.blue }}>
          ¡Plan listo! ¿Querés seguirlo en Grows?
        </h2>
        <p className="mt-2 text-sm" style={{ color: BRAND.muted }}>
          Te enviamos un mail con un link para entrar a Grows con tu plan ya cargado.
        </p>
      </div>

      {(emailStatus === 'sent' || emailStatus === 'already') && (
        <OCCard className="mb-4" style={{ borderColor: BRAND.green, background: '#ECFDF5' }}>
          <p className="flex items-center justify-center gap-2 text-sm font-semibold" style={{ color: BRAND.green }}>
            <Mail size={16} />
            {emailStatus === 'sent' ? 'Te enviamos el mail con el link de acceso' : 'Ya te habíamos enviado el mail'}
          </p>
        </OCCard>
      )}

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

      <OCCard className="mb-4 text-left" style={{ borderColor: BRAND.gold, background: '#FFFDF5' }}>
        <p className="mb-3 text-sm font-semibold" style={{ color: BRAND.text }}>
          Con Grows podés:
        </p>
        <div className="space-y-2">
          <Benefit icon={<Eye size={16} />} text="Ver si cada contratista recibió y arrancó el trabajo" />
          <Benefit icon={<TrendingUp size={16} />} text="Seguir el avance real de cada tarea en tiempo real" />
          <Benefit icon={<ShieldCheck size={16} />} text="Detectar atrasos en el camino crítico y controlar pagos" />
          <Benefit icon={<CheckCircle2 size={16} />} text="Validar bloques de obra y liberar pagos desde la app" />
        </div>
      </OCCard>

      <a href={ctaHref} onClick={() => obraCheckApi.event('upsell_click')}>
        <OCButton className="w-full">Entrar a Grows — mi plan ya está cargado</OCButton>
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

function Benefit({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm" style={{ color: BRAND.text }}>
      <span style={{ color: BRAND.gold }}>{icon}</span>
      {text}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { obraCheckApi } from '@/lib/obra-check/client';
import { BRAND, OCButton, OCCard, OCField, inputStyle } from './ui';

const TIPOS_OBRA = [
  { value: '', label: 'Seleccioná…' },
  { value: 'casa', label: 'Casa' },
  { value: 'edificio', label: 'Edificio' },
  { value: 'reforma', label: 'Reforma' },
  { value: 'trabajo_comun', label: 'Trabajo puntual' },
  { value: 'otro', label: 'Otro' },
];

export function StepIntro({ onReady }: { onReady: (sessionId: string, tipoObra: string) => void }) {
  const [email, setEmail] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [tipoObra, setTipoObra] = useState('');
  const [consentA, setConsentA] = useState(false);
  const [consentB, setConsentB] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  const canSubmit = emailOk && consentA && !loading;

  async function submit() {
    setError(null);
    setLoading(true);
    try {
      const { sessionId } = await obraCheckApi.createSession({
        email,
        empresa: empresa || undefined,
        tipoObra: tipoObra || undefined,
        consentProcesamiento: true,
        consentPatrones: consentB,
      });
      onReady(sessionId, tipoObra);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-extrabold sm:text-3xl" style={{ color: BRAND.blue }}>
          Armá y mandá el plan de tu obra, gratis
        </h1>
        <p className="mt-2 text-sm" style={{ color: BRAND.muted }}>
          Subí tu cronograma, elegí un plan de la librería XML o escribí las tareas a mano. Grows las ordena,
          arma bloques y te genera los mensajes de WhatsApp para tus contratistas.
        </p>
      </div>

      <OCCard>
        <div className="space-y-4">
          <OCField label="Email (obligatorio)" hint="Te enviamos el resumen del plan y un link para entrar a Grows.">
            <input style={inputStyle} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vos@estudio.com" />
          </OCField>
          <OCField label="Empresa / estudio (opcional)">
            <input style={inputStyle} value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Estudio Belgrano" />
          </OCField>
          <OCField label="Tipo de obra (opcional)">
            <select style={inputStyle} value={tipoObra} onChange={(e) => setTipoObra(e.target.value)}>
              {TIPOS_OBRA.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </OCField>

          <div className="space-y-2 rounded-lg p-3" style={{ background: BRAND.gray }}>
            <label className="flex cursor-pointer items-start gap-2 text-xs" style={{ color: BRAND.text }}>
              <input type="checkbox" checked={consentA} onChange={(e) => setConsentA(e.target.checked)} className="mt-0.5" />
              <span>Acepto que Grows procese este archivo para darme el diagnóstico y armar el plan. <b>(obligatorio)</b></span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 text-xs" style={{ color: BRAND.muted }}>
              <input type="checkbox" checked={consentB} onChange={(e) => setConsentB(e.target.checked)} className="mt-0.5" />
              <span>Acepto que Grows use <b>patrones anónimos</b> de mi planificación (nombres de tareas, secuencias) para mejorar sus sugerencias. (opcional)</span>
            </label>
          </div>

          {error && <p className="text-xs" style={{ color: BRAND.error }}>{error}</p>}

          <OCButton onClick={submit} loading={loading} disabled={!canSubmit} className="w-full">
            Empezar
          </OCButton>
          <p className="text-center text-[11px]" style={{ color: BRAND.muted }}>
            Sin instalar nada. Tus contratistas reciben todo por WhatsApp.
          </p>
        </div>
      </OCCard>
    </div>
  );
}

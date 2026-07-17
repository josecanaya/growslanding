'use client';

import { useState } from 'react';
import { ArrowRight, Clock, MessageCircle, Sparkles, Upload, Zap } from 'lucide-react';
import { obraCheckApi } from '@/lib/obra-check/client';
import { BRAND, OCButton, OCCard, OCField, inputStyle } from './ui';

const TIPOS_OBRA = [
  { value: 'casa', label: 'Casa' },
  { value: 'edificio', label: 'Edificio' },
  { value: 'reforma', label: 'Reforma' },
  { value: 'trabajo_comun', label: 'Trabajo puntual' },
  { value: 'otro', label: 'Otro' },
] as const;

const BENEFITS = [
  {
    icon: Sparkles,
    title: 'Orden automático',
    text: 'Fases, camino crítico y paquetes listos para cotizar.',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp en un click',
    text: 'Link con formulario: el contratista deja precio y contacto.',
  },
  {
    icon: Zap,
    title: 'Gratis, sin instalar',
    text: 'Sin tarjeta. Empezás en 30 segundos desde el navegador.',
  },
] as const;

const STEPS = [
  { n: '1', label: 'Cargás tus tareas', icon: Upload },
  { n: '2', label: 'Grows ordena el plan', icon: Sparkles },
  { n: '3', label: 'Mandás por WhatsApp', icon: MessageCircle },
] as const;

export function StepIntro({ onReady }: { onReady: (sessionId: string, tipoObra: string) => void }) {
  const [email, setEmail] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [tipoObra, setTipoObra] = useState('');
  const [showExtras, setShowExtras] = useState(false);
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
    <div className="mx-auto max-w-3xl">
      {/* Hero */}
      <div
        className="relative mb-8 overflow-hidden rounded-2xl px-6 py-10 text-center sm:px-10 sm:py-12"
        style={{
          background: `linear-gradient(145deg, ${BRAND.blue} 0%, #152a4a 55%, #1e3a5f 100%)`,
        }}
      >
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-20"
          style={{ background: BRAND.gold }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full opacity-10"
          style={{ background: BRAND.gold }}
        />

        <div className="relative">
          <span
            className="mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
            style={{ background: 'rgba(232,197,71,0.18)', color: BRAND.gold, border: `1px solid rgba(232,197,71,0.35)` }}
          >
            <Sparkles size={12} />
            Grows Obra Check · 100% gratis
          </span>

          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl sm:leading-tight">
            Pedí presupuestos de obra
            <br />
            <span style={{ color: BRAND.gold }}>por WhatsApp en minutos</span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed sm:text-lg" style={{ color: 'rgba(255,255,255,0.82)' }}>
            Subí tu cronograma o elegí un plan listo. Grows ordena las tareas, arma los paquetes
            y te genera el link para mandárselo a cada contratista — con precio y contacto incluidos.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>
            <span className="flex items-center gap-1">
              <Clock size={13} style={{ color: BRAND.gold }} />
              Listo en ~10 min
            </span>
            <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
            <span>Sin tarjeta</span>
            <span style={{ color: 'rgba(255,255,255,0.25)' }}>·</span>
            <span>Sin instalar nada</span>
          </div>
        </div>
      </div>

      {/* Beneficios */}
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {BENEFITS.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="rounded-xl p-4"
            style={{ background: '#fff', border: `1px solid ${BRAND.border}` }}
          >
            <div
              className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: '#FFFDF5', color: BRAND.blue }}
            >
              <Icon size={18} style={{ color: BRAND.gold }} />
            </div>
            <p className="text-sm font-bold" style={{ color: BRAND.blue }}>
              {title}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed" style={{ color: BRAND.muted }}>
              {text}
            </p>
          </div>
        ))}
      </div>

      {/* Cómo funciona */}
      <div className="mb-8 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-center sm:gap-0">
        {STEPS.map(({ n, label, icon: Icon }, i) => (
          <div key={n} className="flex items-center gap-2 sm:flex-1 sm:flex-col sm:gap-1 sm:px-2">
            <div className="flex items-center gap-2 sm:flex-col">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={{ background: BRAND.blue, color: '#fff' }}
              >
                {n}
              </div>
              <Icon size={14} className="hidden sm:block" style={{ color: BRAND.gold }} />
              <span className="text-xs font-semibold sm:mt-1 sm:text-center" style={{ color: BRAND.text }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <ArrowRight size={14} className="ml-auto hidden shrink-0 sm:ml-0 sm:mt-2 sm:block" style={{ color: BRAND.border }} />
            )}
          </div>
        ))}
      </div>

      {/* Formulario */}
      <OCCard style={{ borderColor: BRAND.gold, boxShadow: '0 4px 24px rgba(12,29,54,0.08)' }}>
        <div className="mb-5 text-center">
          <p className="text-lg font-extrabold" style={{ color: BRAND.blue }}>
            Empezá gratis ahora
          </p>
          <p className="mt-1 text-sm" style={{ color: BRAND.muted }}>
            Dejanos tu email y armamos tu plan en el acto.
          </p>
        </div>

        <div className="space-y-4">
          <OCField label="Tu email" hint="Te mandamos el resumen y un link para seguir en Grows.">
            <input
              style={{ ...inputStyle, fontSize: '1rem', padding: '0.7rem 0.85rem' }}
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vos@estudio.com"
            />
          </OCField>

          {!showExtras ? (
            <button
              type="button"
              onClick={() => setShowExtras(true)}
              className="text-xs font-medium underline-offset-2 hover:underline"
              style={{ color: BRAND.blueLight }}
            >
              + Agregar empresa o tipo de obra (opcional)
            </button>
          ) : (
            <div className="space-y-3 rounded-lg p-3" style={{ background: BRAND.gray }}>
              <OCField label="Empresa / estudio">
                <input
                  style={inputStyle}
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  placeholder="Estudio Belgrano"
                />
              </OCField>
              <div>
                <p className="mb-2 text-sm font-medium" style={{ color: BRAND.text }}>
                  Tipo de obra
                </p>
                <div className="flex flex-wrap gap-2">
                  {TIPOS_OBRA.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTipoObra(tipoObra === t.value ? '' : t.value)}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
                      style={{
                        background: tipoObra === t.value ? BRAND.blue : '#fff',
                        color: tipoObra === t.value ? '#fff' : BRAND.muted,
                        border: `1.5px solid ${tipoObra === t.value ? BRAND.blue : BRAND.border}`,
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2 rounded-lg p-3" style={{ background: BRAND.gray }}>
            <label className="flex cursor-pointer items-start gap-2 text-xs" style={{ color: BRAND.text }}>
              <input type="checkbox" checked={consentA} onChange={(e) => setConsentA(e.target.checked)} className="mt-0.5" />
              <span>
                Acepto que Grows procese mi planificación para armar el diagnóstico y el plan.{' '}
                <b>(obligatorio)</b>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 text-xs" style={{ color: BRAND.muted }}>
              <input type="checkbox" checked={consentB} onChange={(e) => setConsentB(e.target.checked)} className="mt-0.5" />
              <span>
                Acepto el uso de <b>patrones anónimos</b> para mejorar sugerencias. (opcional)
              </span>
            </label>
          </div>

          {error && (
            <p className="rounded-lg p-2 text-xs" style={{ background: '#FEF2F2', color: BRAND.error }}>
              {error}
            </p>
          )}

          <OCButton onClick={submit} loading={loading} disabled={!canSubmit} className="w-full py-3 text-base">
            Armar mi plan y pedir presupuestos
            {!loading && <ArrowRight size={18} />}
          </OCButton>

          <p className="text-center text-[11px]" style={{ color: BRAND.muted }}>
            Usado por estudios y contratistas de obra en Argentina · Sin compromiso
          </p>
        </div>
      </OCCard>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { getBrowserSupabaseClient } from '@/lib/supabase/browser-client';
import { safeReturnPath } from '@/lib/auth/public-paths';

export default function AccessClient() {
  const params = useSearchParams();
  const sector = params.get('sector') === 'trabajo' ? 'trabajo' : 'proyecto';
  const obra = params.get('obra');
  const validId = obra && /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(obra) ? obra : null;
  const fallback = sector === 'trabajo'
    ? validId ? '/socio/oportunidades?obra=' + validId : '/socio/panel'
    : validId ? '/obras/' + validId : '/cliente/dashboard';
  const requested = safeReturnPath(params.get('redirect'), fallback);
  const destination = requested.startsWith('/socio') || requested.startsWith('/cliente') || requested.startsWith('/obras/')
    ? requested : fallback;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const autoStarted = useRef(false);

  useEffect(() => {
    let active = true;
    void getBrowserSupabaseClient().auth.getUser().then(({ data }) => {
      if (active && data.user && !autoStarted.current) {
        autoStarted.current = true;
        void enter();
      }
    });
    return () => { active = false; };
  }, [sector, destination]);

  async function enter() {
    setBusy(true);
    setError('');
    try {
      const auth = getBrowserSupabaseClient();
      const { data, error: sessionError } = await auth.auth.getUser();
      if (sessionError || !data.user) {
        window.location.assign('/auth/login?redirect=' + encodeURIComponent(window.location.pathname + window.location.search));
        return;
      }
      const response = await fetch('/api/auth/set-role', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: sector === 'trabajo' ? 'SOCIO' : 'CLIENTE_TECNICO' }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No pudimos preparar tu acceso.');
      const refreshed = await auth.auth.refreshSession();
      if (refreshed.error) throw new Error('Tu perfil está listo. Volvé a ingresar para actualizar la sesión.');
      window.location.assign(destination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo ingresar.');
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f7f3] px-6 text-[#19362d]">
      <section className="w-full max-w-lg space-y-6 rounded-2xl border border-[#dfe6df] bg-white p-8">
        <Link href="/inversores" className="text-2xl font-bold">Grows</Link>
        <h1 className="text-3xl font-semibold">{sector === 'trabajo' ? 'Tu espacio de contratista' : 'Tu espacio de proyectos'}</h1>
        <p>Usá tu cuenta para trabajar en obra y gestionar proyectos. Podés acceder a ambos espacios desde Grows.</p>
        {error && <p role="alert" className="text-red-700">{error}</p>}
        <button onClick={enter} disabled={busy} className="w-full rounded-lg bg-[#19362d] px-5 py-3 font-semibold text-white disabled:opacity-50">
          {busy ? 'Preparando tu acceso…' : 'Ingresar y continuar'}
        </button>
        <Link href="/inversores" className="inline-block text-sm underline">Seguir explorando obras</Link>
      </section>
    </main>
  );
}

'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';

const supabase = createClientComponentClient<Database>();

export default function LoginClient() {
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect') ?? '/dashboard';
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email) {
      setError('Ingresa un correo válido.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const origin = window.location.origin;
      const redirectTo = `${origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`;
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
        },
      });
      if (signInError) {
        throw signInError;
      }
      setSuccess(true);
    } catch (err) {
      console.error('[MAGIC_LINK_ERROR]', err);
      setError(err instanceof Error ? err.message : 'No se pudo enviar el enlace.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError(null);
    try {
      const origin = window.location.origin;
      const redirectTo = `${origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            prompt: 'consent',
            access_type: 'offline',
          },
        },
      });
      if (oauthError) {
        throw oauthError;
      }
      // Supabase redirige automáticamente, no continuamos flujo local.
    } catch (err) {
      console.error('[GOOGLE_LOGIN_ERROR]', err);
      
      // Manejar específicamente el error de proveedor no habilitado
      if (err instanceof Error && err.message.includes('provider is not enabled')) {
        setError(
          'Google OAuth no está configurado en este momento. Por favor, usa el enlace mágico con tu correo electrónico.'
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : 'No se pudo iniciar sesión con Google. Intenta nuevamente.'
        );
      }
      setGoogleLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded border border-border bg-card p-8 shadow-sm">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">Ingresar a Grows</h1>
        <p className="text-sm text-muted-foreground">
          Te enviaremos un enlace mágico para acceder sin contraseñas.
        </p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-left text-sm font-medium" htmlFor="email">
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded border border-border px-3 py-2"
          placeholder="tucorreo@empresa.com"
        />
        <button
          type="submit"
          className="w-full rounded bg-primary px-4 py-2 font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Enviando enlace…' : 'Enviar enlace mágico'}
        </button>
      </form>
      {success && (
        <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Revisa tu bandeja de entrada. Haz clic en el enlace para iniciar sesión.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="space-y-3">
        <p className="text-center text-xs text-muted-foreground">
          El enlace expira en pocos minutos. Puedes reenviarlo ingresando el correo nuevamente.
        </p>
        <div className="flex items-center gap-2">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs uppercase text-muted-foreground">o</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full rounded border border-border bg-background px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:opacity-60"
          disabled={googleLoading}
          title="Google OAuth puede no estar disponible en este momento"
        >
          {googleLoading ? 'Redirigiendo a Google…' : 'Continuar con Google'}
        </button>
        <p className="text-center text-xs text-muted-foreground">
          Si Google no funciona, usa el enlace mágico arriba ⬆️
        </p>
      </div>
    </div>
  );
}

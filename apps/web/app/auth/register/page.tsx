'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAppWebUrl } from '@/lib/config';
import type { Database } from '@/lib/types/supabase.gen';

type UserRole = 'CLIENTE_TECNICO' | 'SOCIO';

function StatusMessage({ text }: { text: string | null }) {
  if (!text) {
    return null;
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {text}
    </div>
  );
}

function SuccessMessage({ text }: { text: string | null }) {
  if (!text) {
    return null;
  }

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
      {text}
    </div>
  );
}

function RegisterPageContent() {
  const router = useRouter();
  const supabase = useMemo(
    () => createClientComponentClient<Database>(),
    []
  );

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [rol, setRol] = useState<UserRole | ''>('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showGoogleLink, setShowGoogleLink] = useState(false);

  useEffect(() => {
    // Verificar si ya está logueado
    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace('/cliente/dashboard' as Route);
      }
    }
    void checkSession();
  }, [router, supabase]);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setShowGoogleLink(false);

    // Validaciones
    if (!nombre.trim()) {
      setError('El nombre completo es requerido');
      return;
    }

    if (!email.trim()) {
      setError('El correo electrónico es requerido');
      return;
    }

    if (!telefono.trim()) {
      setError('El teléfono es requerido');
      return;
    }

    if (!ciudad.trim()) {
      setError('La ciudad es requerida');
      return;
    }

    if (!rol) {
      setError('Debes seleccionar un rol');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: nombre,
            role: rol,
            telefono,
            ciudad,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario');
      }

      // Verificar si hay sesión disponible después del signUp
      const { data: sessionData } = await supabase.auth.getSession();
      
      // Si hay sesión, podemos hacer operaciones que requieren autenticación
      if (sessionData.session) {
        // 2. Actualizar metadata con el rol
        const { error: updateError } = await supabase.auth.updateUser({
          data: { role: rol },
        });

        if (updateError) {
          console.error('[UPDATE_ROLE_ERROR]', updateError);
          // Continuamos aunque falle, el rol ya está en user_metadata
        }

        // 3. Crear organización para cliente técnico o registro en socios
        if (rol === 'CLIENTE_TECNICO') {
          // Crear organización para el cliente técnico
          const { data: orgData, error: orgError } = await (supabase as any)
            .from('organizations')
            .insert([
              {
                name: nombre,
                address: ciudad,
              },
            ])
            .select('id')
            .single();

          if (orgError) {
            console.error('[ORG_CREATE_ERROR]', orgError);
            // Continuamos aunque falle la creación de org
          } else if (orgData) {
            // Actualizar metadata con org_id
            const { error: orgUpdateError } = await supabase.auth.updateUser({
              data: { org_id: orgData.id },
            });
            if (orgUpdateError) {
              console.error('[ORG_UPDATE_ERROR]', orgUpdateError);
            }
          }
        } else if (rol === 'SOCIO') {
          // Para socio, necesitamos crear un registro en la tabla socios
          const { data: orgData, error: orgError } = await (supabase as any)
            .from('organizations')
            .insert([
              {
                name: `${nombre} - Socio`,
                address: ciudad,
              },
            ])
            .select('id')
            .single();

          if (orgError) {
            console.error('[ORG_CREATE_ERROR]', orgError);
          } else if (orgData) {
            // Crear registro en socios
            const { error: socioError } = await (supabase as any).from('socios').insert([
              {
                org_id: orgData.id,
                nombre,
                telefono,
                email,
                rol: 'constructor',
              },
            ]);

            if (socioError) {
              console.error('[SOCIO_CREATE_ERROR]', socioError);
            }

            // Actualizar metadata con org_id
            const { error: orgUpdateError } = await supabase.auth.updateUser({
              data: { org_id: orgData.id },
            });
            if (orgUpdateError) {
              console.error('[ORG_UPDATE_ERROR]', orgUpdateError);
            }
          }
        }
      } else {
        // Si no hay sesión (confirmación por email requerida), solo guardamos el rol en metadata
        // Las operaciones de organización y socio se harán después de confirmar el email
        console.log('[REGISTER] Sesión no disponible, se requiere confirmación por email');
      }

      setSuccess(true);
      setShowGoogleLink(true);
    } catch (error) {
      console.error('[REGISTER_ERROR]', error);
      setError(
        error instanceof Error
          ? error.message
          : 'No se pudo crear la cuenta. Intenta nuevamente.'
      );
      setIsLoading(false);
    }
  }

  async function handleGoogleLink() {
    setIsGoogleLoading(true);
    setError(null);

    try {
      const appBaseUrl = getAppWebUrl();
      const redirectUrl = new URL('/auth/callback', appBaseUrl);
      
      // Redirigir según el rol después del callback
      if (rol === 'SOCIO') {
        redirectUrl.searchParams.set('redirect', '/socio/panel');
      } else {
        redirectUrl.searchParams.set('redirect', '/cliente/onboarding');
      }

      const redirectToUrl = redirectUrl.toString();

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectToUrl,
          queryParams: {
            prompt: 'consent',
            access_type: 'offline',
          },
        },
      });

      if (oauthError) {
        throw oauthError;
      }
    } catch (error) {
      console.error('[GOOGLE_LINK_ERROR]', error);
      setError(
        error instanceof Error
          ? error.message
          : 'No se pudo vincular Google. Puedes continuar sin vincular.'
      );
      setIsGoogleLoading(false);
    }
  }

  async function handleSkipGoogle() {
    // Redirigir según el rol
    if (rol === 'SOCIO') {
      router.replace('/socio/panel' as Route);
    } else {
      router.replace('/cliente/onboarding' as Route);
    }
  }

  if (showGoogleLink && success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F4F4] px-4 py-12">
        <div className="flex w-full max-w-6xl flex-col items-center justify-center gap-16 md:flex-row">
          {/* Columna izquierda: Mensaje de éxito */}
          <div className="flex w-full max-w-md items-center justify-center">
            <Card className="w-full rounded-lg border border-gray-200 bg-white p-10 shadow-sm">
              <CardContent className="space-y-6 p-0">
                <div className="space-y-2 text-center">
                  <h1 className="text-2xl font-semibold text-[#002E5D]">
                    ¡Cuenta creada!
                  </h1>
                  <p className="text-sm text-gray-600">
                    ¿Querés vincular Google para futuros ingresos?
                  </p>
                </div>

                <SuccessMessage text="Tu cuenta ha sido creada exitosamente." />

                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleLink}
                    disabled={isGoogleLoading}
                    className="h-12 w-full rounded-md border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-[#f8f8f8] disabled:opacity-50"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 48 48"
                      className="mr-2 h-5 w-5"
                      aria-hidden="true"
                    >
                      <path
                        fill="#FFC107"
                        d="M43.6 20.5H42V20H24v8h11.3C33.9 32.9 29.4 36 24 36 16.8 36 11 30.2 11 23s5.8-13 13-13c3.3 0 6.3 1.2 8.6 3.2l5.7-5.7C34.2 4.3 29.4 2 24 2 12.9 2 4 10.9 4 22s8.9 20 20 20c11.6 0 19.6-8.1 19.6-19.5 0-1.3-.1-2.3-.4-3z"
                      />
                      <path
                        fill="#FF3D00"
                        d="M6.3 14.7l6.6 4.8C14.6 16.1 18.9 13 24 13c3.3 0 6.3 1.2 8.6 3.2l5.7-5.7C34.2 4.3 29.4 2 24 2 16 2 9.1 6.5 6.3 14.7z"
                      />
                      <path
                        fill="#4CAF50"
                        d="M24 44c5.3 0 10.1-1.7 13.9-4.6l-6.4-5.2C29.3 36.9 26.8 37.8 24 37.8c-5.4 0-9.9-3.6-11.6-8.5l-6.6 5C9.1 39.5 16 44 24 44z"
                      />
                      <path
                        fill="#1976D2"
                        d="M43.6 20.5H42V20H24v8h11.3C34.9 32.9 29.4 36 24 36c-5.4 0-9.9-3.6-11.6-8.5l-6.6 5C9.1 39.5 16 44 24 44c11.6 0 19.6-8.1 19.6-19.5 0-1.3-.1-2.3-.4-3z"
                      />
                    </svg>
                    {isGoogleLoading ? 'Conectando…' : 'Vincular con Google'}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSkipGoogle}
                    className="h-12 w-full rounded-md"
                  >
                    Continuar sin vincular
                  </Button>
                </div>

                {error && <StatusMessage text={error} />}
              </CardContent>
            </Card>
          </div>

          {/* Columna derecha: Imagen (oculta en mobile) */}
          <div className="hidden h-[600px] w-full max-w-[460px] items-center justify-center md:flex">
            <div className="relative h-full w-full">
              <Image
                src="/images/Login.png"
                alt="GROWS Register"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F4F4] px-4 py-12">
      <div className="flex w-full max-w-6xl flex-col items-center justify-center gap-16 md:flex-row">
        {/* Columna izquierda: Formulario */}
        <div className="flex w-full max-w-md items-center justify-center">
          <Card className="w-full rounded-lg border border-gray-200 bg-white p-10 shadow-sm">
            <CardContent className="space-y-6 p-0">
              <div className="space-y-2 text-center">
                <h1 className="text-2xl font-semibold text-[#002E5D]">
                  Crear cuenta en GROWS
                </h1>
              </div>

              {error && <StatusMessage text={error} />}

              <form onSubmit={handleRegister} className="space-y-5">
                <div className="space-y-2">
                  <Input
                    id="nombre"
                    type="text"
                    placeholder="Nombre completo"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    required
                    disabled={isLoading || isGoogleLoading}
                    className="h-12 w-full rounded-md placeholder:text-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Correo electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading || isGoogleLoading}
                    className="h-12 w-full rounded-md placeholder:text-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <Input
                    id="telefono"
                    type="tel"
                    placeholder="Teléfono"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    required
                    disabled={isLoading || isGoogleLoading}
                    className="h-12 w-full rounded-md placeholder:text-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <Input
                    id="ciudad"
                    type="text"
                    placeholder="Ciudad"
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    required
                    disabled={isLoading || isGoogleLoading}
                    className="h-12 w-full rounded-md placeholder:text-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <Select
                    value={rol}
                    onValueChange={(value) => setRol(value as UserRole)}
                    disabled={isLoading || isGoogleLoading}
                    required
                  >
                    <SelectTrigger className="h-12 w-full rounded-md">
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CLIENTE_TECNICO">Cliente Técnico</SelectItem>
                      <SelectItem value="SOCIO">Socio Constructor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Input
                    id="password"
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading || isGoogleLoading}
                    className="h-12 w-full rounded-md placeholder:text-gray-400"
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirmar contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading || isGoogleLoading}
                    className="h-12 w-full rounded-md placeholder:text-gray-400"
                    minLength={6}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  className="h-12 w-full rounded-md bg-[#002E5D] text-white shadow-sm transition-colors hover:bg-[#003d7a] disabled:opacity-50"
                >
                  {isLoading ? 'Creando cuenta…' : 'Registrarme'}
                </Button>
              </form>

              <div className="pt-4 text-center text-sm text-gray-600">
                <span className="text-gray-500">¿Ya tenés cuenta? </span>
                <Link
                  href="/auth/login"
                  className="font-medium text-[#002E5D] transition-colors hover:underline"
                >
                  Ingresar
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna derecha: Imagen (oculta en mobile) */}
        <div className="hidden h-[600px] w-full max-w-[460px] items-center justify-center md:flex">
          <div className="relative h-full w-full">
            <Image
              src="/images/Login.png"
              alt="GROWS Register"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F4F4F4] px-4 py-12">
          <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-[#002E5D] shadow-sm">
            Preparando registro…
          </div>
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}


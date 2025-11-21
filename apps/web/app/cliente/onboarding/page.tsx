'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useDevMode } from '@/lib/dev-mode-context';
import type { Database } from '@/lib/types/supabase.gen';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { getDefaultRouteForRole } from '@/lib/roles';

type WizardStep = 1 | 2 | 3;

type OrganizationPayload = {
  name: string;
  cuit?: string;
  address?: string;
};

function OnboardingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { devModeEnabled } = useDevMode();
  const currentUser = useCurrentUser();
  const supabase = useMemo(
    () => createClientComponentClient<Database>(),
    []
  );

  const [step, setStep] = useState<WizardStep>(1);
  const [orgData, setOrgData] = useState<OrganizationPayload>({
    name: '',
    cuit: '',
    address: '',
  });
  const [invites, setInvites] = useState<string[]>([]);
  const [inviteInput, setInviteInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [createdOrgName, setCreatedOrgName] = useState<string | null>(null);

  const redirectParam = searchParams?.get('redirect') ?? null;
  const redirectTarget =
    redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('/auth')
      ? redirectParam
      : null;

  useEffect(() => {
    if (devModeEnabled) {
      router.replace('/cliente/dashboard' as Route);
    }
  }, [devModeEnabled, router]);

  useEffect(() => {
    if (!currentUser || devModeEnabled) {
      return;
    }

    if (currentUser.orgId) {
      const target =
        redirectTarget ?? getDefaultRouteForRole(currentUser.role ?? 'CLIENTE_TECNICO');
      router.push(target as Route);
    }
  }, [currentUser, redirectTarget, router, devModeEnabled]);

  const handleOrgFormSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!orgData.name.trim()) {
      setStatusMessage('Ingresa el nombre de tu organización para continuar.');
      return;
    }
    setStatusMessage(null);
    setStep(2);
  };

  const handleAddInvite = () => {
    const email = inviteInput.trim();
    if (!email) {
      return;
    }
    if (invites.includes(email)) {
      setStatusMessage('Ese correo ya fue agregado.');
      return;
    }
    setInvites((prev) => [...prev, email]);
    setInviteInput('');
    setStatusMessage(null);
  };

  const handleCreateOrganization = async () => {
    if (loading || devModeEnabled) {
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    try {
      const response = await fetch('/api/orgs/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: orgData.name.trim(),
          cuit: orgData.cuit?.trim() || null,
          address: orgData.address?.trim() || null,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error ?? 'No se pudo crear la organización.');
      }

      const { org } = await response.json();
      setCreatedOrgName(org.name ?? orgData.name.trim());

      const { error: metadataError } = await supabase.auth.updateUser({
        data: { org_id: org.id },
      });

      if (metadataError) {
        console.warn('[ONBOARDING_METADATA_WARNING]', metadataError);
      }

      await supabase.auth.refreshSession();

      setStep(3);
    } catch (error) {
      console.error('[ONBOARDING_CREATE_ERROR]', error);
      setStatusMessage(
        error instanceof Error ? error.message : 'No se pudo crear la organización.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoToPanel = () => {
    const target = redirectTarget ?? '/cliente/dashboard';
    router.push(target as Route);
  };

  if (devModeEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F4F4] px-4">
        <div className="space-y-3 text-center">
          <p className="text-lg font-semibold text-[#002E5D]">Modo desarrollador activo</p>
          <p className="text-sm text-gray-600">
            Redirigiendo al panel utilizando la organización de prueba…
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F4F4] px-4">
        <p className="text-sm text-gray-600">Cargando sesión…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F4F4] px-4 py-12">
      <div className="w-full max-w-3xl">
        <Card className="rounded-lg border border-gray-200 bg-white p-10 shadow-sm">
          <CardContent className="space-y-8 p-0">
            <header className="space-y-2 text-center">
              <h1 className="text-2xl font-semibold text-[#002E5D]">Configurar organización</h1>
              <p className="text-sm text-gray-600">
                Completa el onboarding para comenzar a trabajar con tu equipo.
              </p>
            </header>

            <nav className="flex justify-center gap-3 text-xs font-medium uppercase tracking-wide">
              {[1, 2, 3].map((value) => (
                <span
                  key={value}
                  className={`rounded-md px-3 py-1 ${
                    step === value
                      ? 'bg-[#002E5D] text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  Paso {value}
                </span>
              ))}
            </nav>

        {statusMessage ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {statusMessage}
          </div>
        ) : null}

        {step === 1 ? (
          <form className="space-y-6" onSubmit={handleOrgFormSubmit}>
            <div className="space-y-2 text-left">
              <Label htmlFor="org-name" className="text-sm font-semibold text-[#002E5D]">
                Nombre de la empresa*
              </Label>
              <Input
                id="org-name"
                value={orgData.name}
                onChange={(event) =>
                  setOrgData((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Ej. Constructora Horizonte SRL"
                required
                className="h-12 rounded-md"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 text-left">
                <Label htmlFor="org-cuit" className="text-sm font-semibold text-[#002E5D]">
                  CUIT (opcional)
                </Label>
                <Input
                  id="org-cuit"
                  value={orgData.cuit ?? ''}
                  onChange={(event) =>
                    setOrgData((prev) => ({ ...prev, cuit: event.target.value }))
                  }
                  placeholder="30-12345678-9"
                  className="h-12 rounded-md"
                />
              </div>
              <div className="space-y-2 text-left">
                <Label
                  htmlFor="org-address"
                  className="text-sm font-semibold text-[#002E5D]"
                >
                  Dirección (opcional)
                </Label>
                <Input
                  id="org-address"
                  value={orgData.address ?? ''}
                  onChange={(event) =>
                    setOrgData((prev) => ({ ...prev, address: event.target.value }))
                  }
                  placeholder="Av. Pellegrini 1234, Rosario"
                  className="h-12 rounded-md"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                className="h-12 rounded-md bg-[#002E5D] text-white shadow-sm transition-colors hover:bg-[#003d7a]"
              >
                Siguiente
              </Button>
            </div>
          </form>
        ) : null}

        {step === 2 ? (
          <div className="space-y-6">
            <div className="space-y-2 text-left">
              <Label
                htmlFor="invite-email"
                className="text-sm font-semibold text-[#002E5D]"
              >
                Invitar socios por email (opcional)
              </Label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="socio@empresa.com"
                  value={inviteInput}
                  onChange={(event) => setInviteInput(event.target.value)}
                  className="h-12 rounded-md"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-md border-gray-300 text-[#002E5D] hover:bg-gray-50"
                  onClick={handleAddInvite}
                  disabled={!inviteInput.trim()}
                >
                  Agregar
                </Button>
              </div>
              <p className="text-xs text-gray-600">
                Próximamente enviaremos invitaciones automáticas. Por ahora podrás copiarlas manualmente.
              </p>
            </div>

            {invites.length > 0 ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-left">
                <p className="text-sm font-semibold text-[#002E5D]">Invitados</p>
                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                  {invites.map((email) => (
                    <li key={email} className="flex items-center justify-between gap-2">
                      <span>{email}</span>
                      <button
                        type="button"
                        className="text-xs font-medium text-red-500 hover:text-red-600"
                        onClick={() =>
                          setInvites((prev) => prev.filter((item) => item !== email))
                        }
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-md border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => setStep(1)}
              >
                Volver
              </Button>
              <Button
                type="button"
                onClick={handleCreateOrganization}
                className="h-12 rounded-md bg-[#002E5D] text-white shadow-sm transition-colors hover:bg-[#003d7a] disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Finalizar'}
              </Button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <p className="text-3xl">🎉</p>
              <h2 className="text-2xl font-semibold text-[#002E5D]">
                Organización creada con éxito
              </h2>
              <p className="text-sm text-gray-600">
                {createdOrgName
                  ? `${createdOrgName} ya está lista para comenzar a trabajar.`
                  : 'Tu organización ya está lista para comenzar a trabajar.'}
              </p>
            </div>
            <Button
              type="button"
              className="mx-auto h-12 rounded-md bg-[#002E5D] text-white shadow-sm transition-colors hover:bg-[#003d7a]"
              onClick={handleGoToPanel}
            >
              Ir al panel
            </Button>
          </div>
        ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F4F4F4] px-4">
          <div className="rounded-lg border border-gray-200 bg-white p-10 text-center text-[#002E5D] shadow-sm">
            Cargando onboarding…
          </div>
        </div>
      }
    >
      <OnboardingPageContent />
    </Suspense>
  );
}

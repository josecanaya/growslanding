'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export default function OnboardingPage() {
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
      router.replace('/cliente-tecnico' as Route);
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
    const target = redirectTarget ?? '/cliente-tecnico';
    router.push(target as Route);
  };

  if (devModeEnabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#003840] px-4 text-white">
        <div className="space-y-3 text-center">
          <p className="text-lg font-semibold">Modo desarrollador activo</p>
          <p className="text-sm text-white/70">
            Redirigiendo al panel utilizando la organización de prueba…
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#003840] px-4 text-white">
        <p className="text-sm text-white/70">Cargando sesión…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#003840] px-4 py-12 text-white">
      <div className="w-full max-w-3xl space-y-8 rounded-3xl bg-[#F5F5F5] p-10 text-[#333333] shadow-2xl">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-[#003840]">Configurar organización</h1>
          <p className="text-sm text-[#333333]/80">
            Completa el onboarding para comenzar a trabajar con tu equipo.
          </p>
        </header>

        <nav className="flex justify-center gap-3 text-xs font-medium uppercase tracking-wide text-[#003840]">
          {[1, 2, 3].map((value) => (
            <span
              key={value}
              className={`rounded-full px-3 py-1 ${
                step === value
                  ? 'bg-[#FFC300] text-[#003840]'
                  : 'bg-[#003840]/10 text-[#003840]/70'
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
              <Label htmlFor="org-name" className="text-sm font-semibold text-[#003840]">
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
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 text-left">
                <Label htmlFor="org-cuit" className="text-sm font-semibold text-[#003840]">
                  CUIT (opcional)
                </Label>
                <Input
                  id="org-cuit"
                  value={orgData.cuit ?? ''}
                  onChange={(event) =>
                    setOrgData((prev) => ({ ...prev, cuit: event.target.value }))
                  }
                  placeholder="30-12345678-9"
                />
              </div>
              <div className="space-y-2 text-left">
                <Label
                  htmlFor="org-address"
                  className="text-sm font-semibold text-[#003840]"
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
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-[#FFC300] text-[#003840] hover:bg-[#e6af00]"
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
                className="text-sm font-semibold text-[#003840]"
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
                />
                <Button
                  type="button"
                  variant="outline"
                  className="border-[#FFC300] text-[#003840] hover:bg-[#FFC300] hover:text-[#003840]"
                  onClick={handleAddInvite}
                  disabled={!inviteInput.trim()}
                >
                  Agregar
                </Button>
              </div>
              <p className="text-xs text-[#003840]/70">
                Próximamente enviaremos invitaciones automáticas. Por ahora podrás copiarlas manualmente.
              </p>
            </div>

            {invites.length > 0 ? (
              <div className="rounded-2xl border border-[#003840]/10 bg-white p-4 text-left">
                <p className="text-sm font-semibold text-[#003840]">Invitados</p>
                <ul className="mt-3 space-y-2 text-sm text-[#003840]/80">
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
                className="border-[#003840]/30 text-[#003840] hover:bg-[#003840]/10"
                onClick={() => setStep(1)}
              >
                Volver
              </Button>
              <Button
                type="button"
                onClick={handleCreateOrganization}
                className="bg-[#FFC300] text-[#003840] hover:bg-[#e6af00]"
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
              <h2 className="text-2xl font-semibold text-[#003840]">
                Organización creada con éxito
              </h2>
              <p className="text-sm text-[#003840]/80">
                {createdOrgName
                  ? `${createdOrgName} ya está lista para comenzar a trabajar.`
                  : 'Tu organización ya está lista para comenzar a trabajar.'}
              </p>
            </div>
            <Button
              type="button"
              className="mx-auto bg-[#FFC300] text-[#003840] hover:bg-[#e6af00]"
              onClick={handleGoToPanel}
            >
              Ir al panel
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

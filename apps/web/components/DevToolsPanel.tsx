'use client';

import { useMemo, useState } from 'react';

import { useDevMode } from '@/lib/dev-mode-context';
import { IS_DEV_MODE } from '@/lib/config';
import { mockUser } from '@/lib/mockUser';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { ROLE_LABELS, normalizeRole } from '@/lib/roles';
import { useCurrentPlan, usePlanCards } from '@/lib/subscriptions';

type ResolvedUser = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
  orgName?: string | null;
};

export default function DevToolsPanel() {
  const { devModeEnabled, setDevModeEnabled } = useDevMode();
  const [open, setOpen] = useState(false);
  const currentUser = useCurrentUser();
  const subscription = useCurrentPlan();
  const planCards = usePlanCards();

  const resolvedUser: ResolvedUser | null = useMemo(() => {
    if (devModeEnabled) {
      return {
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
        orgName: mockUser.orgName,
      };
    }

    return currentUser
      ? {
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          orgName: currentUser.orgName,
        }
      : null;
  }, [devModeEnabled, currentUser]);

  const displayName =
    resolvedUser?.name ?? resolvedUser?.email ?? mockUser.name;
  const displayEmail = resolvedUser?.email ?? mockUser.email;
  const normalizedRole = normalizeRole(resolvedUser?.role);
  const displayRole =
    ROLE_LABELS[normalizedRole ?? mockUser.role] ?? mockUser.role;
  const displayOrg = resolvedUser?.orgName ?? mockUser.orgName;

  if (!IS_DEV_MODE) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-4 left-4 z-50 flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="pointer-events-auto rounded-full bg-slate-900/90 px-4 py-2 text-sm font-medium text-white shadow-lg transition hover:bg-slate-900"
      >
        Panel Dev
      </button>

      {open ? (
        <div className="pointer-events-auto w-64 rounded-xl border border-slate-200 bg-white/95 p-4 text-sm text-slate-900 shadow-xl backdrop-blur">
          <div className="mb-3 flex items-center justify-between gap-4">
            <span className="font-semibold">Modo desarrollador</span>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <span className="text-xs text-slate-500">
                {devModeEnabled ? 'Activo' : 'Inactivo'}
              </span>
              <input
                type="checkbox"
                className="h-4 w-7 cursor-pointer rounded-full border border-slate-300 bg-slate-200 accent-slate-900"
                checked={devModeEnabled}
                onChange={(event) => setDevModeEnabled(event.target.checked)}
              />
            </label>
          </div>

          <div className="space-y-2 text-xs">
            <p className="text-slate-500">
              Cambia el estado para simular sesion activa o cerrada. Solo afecta
              al cliente; backend y middleware continuan en modo dev.
            </p>
            <div className="rounded-lg bg-slate-100 p-2">
              <p>
                <span className="font-semibold">Usuario:</span> {displayName}
              </p>
              <p>
                <span className="font-semibold">Email:</span> {displayEmail}
              </p>
              <p>
                <span className="font-semibold">Rol:</span> {displayRole}
              </p>
              <p>
                <span className="font-semibold">Organizacion:</span>{' '}
                {displayOrg}
              </p>
            </div>
            {devModeEnabled ? (
              <div className="rounded-lg bg-slate-100 p-2 space-y-2">
                <p className="font-semibold">Plan de suscripción simulado</p>
                <p className="text-slate-500">
                  Ajustá el plan para probar límites visuales sin afectar el backend.
                </p>
                <div className="space-y-1">
                  {planCards.map((card) => (
                    <label
                      key={card.id}
                      className="flex items-center gap-2 rounded-md bg-white px-2 py-1 shadow-sm"
                    >
                      <input
                        type="radio"
                        name="dev-plan"
                        className="accent-slate-900"
                        checked={
                          (subscription.overridePlanId ?? subscription.planId) === card.id
                        }
                        onChange={() => {
                          subscription.setOverridePlan(card.id);
                        }}
                      />
                      <div className="flex flex-col leading-tight">
                        <span className="text-xs font-semibold">{card.shortName}</span>
                        <span className="text-[10px] text-slate-500">
                          {card.highlight ?? card.summary}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
                {subscription.overridePlanId ? (
                  <button
                    type="button"
                    className="w-full rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white transition hover:bg-slate-800"
                    onClick={() => {
                      subscription.clearOverride();
                    }}
                  >
                    Restablecer plan real
                  </button>
                ) : null}
                <p className="text-[10px] text-slate-500">
                  Plan real: {subscription.planId} · Activo: {subscription.effectivePlanId}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

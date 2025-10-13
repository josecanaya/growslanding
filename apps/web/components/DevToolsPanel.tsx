'use client';

import { useMemo, useState } from 'react';

import { useDevMode } from '@/lib/dev-mode-context';
import { IS_DEV_MODE } from '@/lib/config';
import { mockUser } from '@/lib/mockUser';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

export default function DevToolsPanel() {
  const { devModeEnabled, setDevModeEnabled } = useDevMode();
  const [open, setOpen] = useState(false);
  const currentUser = useCurrentUser();
  const resolvedUser = useMemo(
    () => (devModeEnabled ? mockUser : currentUser),
    [devModeEnabled, currentUser]
  );

  const displayName = useMemo(() => {
    if (!resolvedUser) {
      return mockUser.name;
    }

    if ('name' in resolvedUser && resolvedUser.name) {
      return resolvedUser.name;
    }

    if ('user_metadata' in (resolvedUser as Record<string, unknown>)) {
      const metadata = (resolvedUser as { user_metadata?: Record<string, unknown>; email?: string }).user_metadata;
      const fullName =
        metadata && typeof metadata === 'object' ? (metadata as { full_name?: string }).full_name : undefined;
      return fullName ?? (resolvedUser as { email?: string }).email ?? mockUser.name;
    }

    return mockUser.name;
  }, [resolvedUser]);

  const displayEmail = useMemo(() => {
    if (!resolvedUser) {
      return mockUser.email;
    }

    if ('email' in resolvedUser && resolvedUser.email) {
      return resolvedUser.email;
    }

    return mockUser.email;
  }, [resolvedUser]);

  const displayRole = useMemo(() => {
    if (!resolvedUser) {
      return mockUser.role;
    }

    if ('role' in resolvedUser && resolvedUser.role) {
      return resolvedUser.role as string;
    }

    return devModeEnabled ? mockUser.role : 'sin rol';
  }, [resolvedUser, devModeEnabled]);

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
        🧠 Panel Dev
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
              Cambia el estado para simular sesión activa o cerrada. Solo
              afecta al cliente; backend y middleware continúan en modo dev.
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
                <span className="font-semibold">Organización:</span>{' '}
                {mockUser.orgName}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

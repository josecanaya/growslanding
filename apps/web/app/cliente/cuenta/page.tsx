'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { SectionHeader } from '@/components/cliente/SectionHeader';
import { Button } from '@/components/ui/grows';
import { logout } from '@/lib/auth';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

function iniciales(nombre: string | null | undefined, email: string | null | undefined): string {
  if (nombre?.trim()) {
    const p = nombre.trim().split(/\s+/);
    if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase().slice(0, 2);
    return nombre.trim().slice(0, 2).toUpperCase();
  }
  if (email?.trim()) return email.trim().slice(0, 2).toUpperCase();
  return '??';
}

function rolLabel(role: string | null | undefined): string {
  if (!role) return '—';
  if (role === 'owner') return 'Responsable de la organización';
  return role;
}

export default function ClienteCuentaPage() {
  const router = useRouter();
  const u = useCurrentUser();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <SectionHeader
        eyebrow="Perfil"
        title="Cuenta"
        description="Datos de tu usuario y la organización asociada a la sesión."
      />
      <div className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-700 text-lg font-bold text-white">
            {iniciales(u?.name, u?.email)}
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900">{u?.name || u?.email || 'Usuario'}</p>
            <p className="text-sm text-slate-600">{u?.email}</p>
            <p className="text-xs text-slate-500">{rolLabel(u?.role)}</p>
          </div>
        </div>
        <div className="mt-6 border-t border-slate-100 pt-6">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Organización</p>
          <p className="mt-1 font-semibold text-slate-900">{u?.orgName || u?.orgId || '—'}</p>
          {u?.orgId ? <p className="mt-1 font-mono text-xs text-slate-400">ID: {u.orgId}</p> : null}
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" type="button" disabled>
            Preferencias
          </Button>
          <Button variant="ghost" size="sm" type="button" disabled>
            Facturación
          </Button>
        </div>
        <div className="mt-6 border-t border-slate-100 pt-6">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            icon={<LogOut className="h-4 w-4" />}
            onClick={() => void logout({ router, redirectTo: '/auth/login' })}
          >
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  );
}

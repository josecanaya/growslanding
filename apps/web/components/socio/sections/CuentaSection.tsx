'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Award, ChevronDown, ChevronUp, LogOut, Pencil, Settings, Bell, Shield } from 'lucide-react';

import { logout } from '@/lib/auth';
import { SocioQrCard } from '@/components/socio/SocioQrCard';

interface CuentaSectionProps {
  user: {
    name: string;
    avatar: string;
    rating: number;
    level: string;
  };
}

type SocioContextResp = {
  ok: boolean;
  socio?: {
    nombre: string | null;
    especialidad: string | null;
    telefono: string | null;
    email: string | null;
  } | null;
};

export function CuentaSection({ user }: CuentaSectionProps) {
  const router = useRouter();
  const [ctx, setCtx] = useState<SocioContextResp['socio'] | null>(null);
  const [ctxLoading, setCtxLoading] = useState(true);
  const [masOpciones, setMasOpciones] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/socio/context', { cache: 'no-store' });
        const data = (await res.json()) as SocioContextResp;
        if (!cancelled && data.ok && data.socio) {
          setCtx(data.socio);
        }
      } catch {
        /* silencioso */
      } finally {
        if (!cancelled) setCtxLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = (ctx?.nombre?.trim() || user.name || 'Socio').trim();
  const especialidad =
    (ctx?.especialidad?.trim() ||
      (user.level && user.level !== '—' ? user.level : null) ||
      'Especialista en obra')?.trim() || 'Especialista en obra';

  const avatarLetter = displayName.charAt(0).toUpperCase();

  const handleLogout = () => {
    logout({ router });
  };

  const irEditarPerfil = () => {
    const el = document.getElementById('cuenta-datos-extra');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] pb-[calc(var(--socio-tab-h,4.25rem)+1.25rem)] font-stitch-body text-[#191c1e]">
      <section className="flex flex-col items-center px-4 pt-10 text-center">
        <div className="relative">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-[#d8e2ff] text-3xl font-bold text-[#163274] shadow-xl">
            {ctxLoading ? '…' : avatarLetter}
          </div>
          <div className="absolute -bottom-1 -right-1 rounded-xl border-2 border-white bg-[#003473] p-2 text-white shadow-lg">
            <Award className="h-4 w-4" />
          </div>
        </div>
        <p className="mt-4 font-stitch-headline text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#43617c]">
          Socio constructor
        </p>
        <h2 className="mt-2 font-stitch-headline text-2xl font-extrabold tracking-tight text-[#163274]">
          {displayName}
        </h2>
        <p className="mt-1 text-sm font-semibold text-[#43617c]">{especialidad}</p>
      </section>

      <div className="mt-10 px-4">
        <SocioQrCard
          fallbackDisplayName={displayName}
          fallbackOficio={especialidad}
          identityLayout
        />
      </div>

      <div className="mt-8 space-y-3 px-4">
        <button
          type="button"
          onClick={irEditarPerfil}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#163274] py-4 text-base font-bold text-white shadow-lg transition active:scale-[0.99]"
        >
          <Pencil className="h-5 w-5" />
          Editar perfil
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-[#fef2f2] py-4 text-base font-bold text-red-600 transition active:scale-[0.99]"
        >
          <LogOut className="h-5 w-5" />
          Cerrar sesión
        </button>
      </div>

      <div id="cuenta-datos-extra" className="mx-4 mt-10 scroll-mt-24 rounded-2xl border border-[#c3c6d5]/20 bg-white p-5 shadow-[0_12px_32px_rgba(22,50,116,0.06)]">
        <button
          type="button"
          onClick={() => setMasOpciones((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="font-stitch-headline text-base font-bold text-[#191c1e]">Más opciones</span>
          {masOpciones ? <ChevronUp className="h-5 w-5 text-[#163274]" /> : <ChevronDown className="h-5 w-5 text-[#163274]" />}
        </button>
        {masOpciones ? (
          <div className="mt-4 space-y-4 border-t border-[#eceef0] pt-4">
            <div className="space-y-2 text-sm text-[#434653]">
              {ctx?.email ? (
                <p>
                  <span className="font-semibold text-[#163274]">Email: </span>
                  {ctx.email}
                </p>
              ) : null}
              {ctx?.telefono ? (
                <p>
                  <span className="font-semibold text-[#163274]">Teléfono: </span>
                  {ctx.telefono}
                </p>
              ) : (
                <p className="text-slate-500">Podés completar teléfono cuando el equipo habilite la edición en app.</p>
              )}
            </div>
            <div className="flex flex-col gap-2 rounded-xl bg-[#f2f4f6] p-3">
              <div className="flex items-center gap-2 text-sm text-[#434653]">
                <Settings className="h-4 w-4 shrink-0 text-[#737784]" />
                <span>Configuración avanzada (próximamente)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#434653]">
                <Bell className="h-4 w-4 shrink-0 text-[#737784]" />
                <span>Notificaciones</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#434653]">
                <Shield className="h-4 w-4 shrink-0 text-[#737784]" />
                <span>Privacidad y documentación</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-xs text-[#434653]">
            Datos de contacto, preferencias y documentación.
          </p>
        )}
      </div>
    </div>
  );
}

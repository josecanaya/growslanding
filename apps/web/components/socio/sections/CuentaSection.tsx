'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Award, ChevronDown, ChevronUp, LogOut, Pencil, Settings, Bell, Shield } from 'lucide-react';

import { logout } from '@/lib/auth';
import { SocioQrCard } from '@/components/socio/SocioQrCard';
import { EditarPerfilModal, type SocioPerfilCompleto } from '@/components/socio/cuenta/EditarPerfilModal';

interface CuentaSectionProps {
  user: {
    name: string;
    avatar: string;
    rating: number;
    level: string;
  };
}

type SocioPerfilFull = {
  nombre: string | null;
  apellido?: string | null;
  especialidad: string | null;
  telefono: string | null;
  email: string | null;
  localidad?: string | null;
  experiencia?: string | null;
  descripcion?: string | null;
  avatar_url?: string | null;
  especialidades_secundarias?: string[];
};

export function CuentaSection({ user }: CuentaSectionProps) {
  const router = useRouter();
  const [ctx, setCtx] = useState<SocioPerfilFull | null>(null);
  const [ctxLoading, setCtxLoading] = useState(true);
  const [masOpciones, setMasOpciones] = useState(false);
  const [editarOpen, setEditarOpen] = useState(false);

  const cargarPerfil = useCallback(async () => {
    try {
      const res = await fetch('/api/socio/perfil', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok && data?.ok && data.socio) {
        setCtx(data.socio as SocioPerfilFull);
      } else {
        // fallback al context legacy si el endpoint extendido no responde
        const res2 = await fetch('/api/socio/context', { cache: 'no-store' });
        const data2 = await res2.json();
        if (res2.ok && data2?.ok && data2.socio) {
          setCtx(data2.socio as SocioPerfilFull);
        }
      }
    } catch {
      /* silencioso */
    } finally {
      setCtxLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await cargarPerfil();
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [cargarPerfil]);

  const displayName = ((ctx?.nombre?.trim() || user.name || 'Socio') +
    (ctx?.apellido?.trim() ? ` ${ctx.apellido!.trim()}` : '')).trim();
  const especialidad =
    (ctx?.especialidad?.trim() ||
      (user.level && user.level !== '—' ? user.level : null) ||
      'Especialista en obra')?.trim() || 'Especialista en obra';

  const avatarLetter = displayName.charAt(0).toUpperCase();

  const handleLogout = () => {
    logout({ router });
  };

  const handleEditarPerfil = () => {
    setEditarOpen(true);
  };

  const handlePerfilGuardado = (perfil: SocioPerfilCompleto) => {
    setCtx({
      nombre: perfil.nombre,
      apellido: perfil.apellido,
      especialidad: perfil.especialidad,
      telefono: perfil.telefono,
      email: perfil.email,
      localidad: perfil.localidad,
      experiencia: perfil.experiencia,
      descripcion: perfil.descripcion,
      avatar_url: perfil.avatar_url,
      especialidades_secundarias: perfil.especialidades_secundarias,
    });
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] pb-[calc(var(--socio-tab-h,4.25rem)+1.25rem)] font-stitch-body text-[#191c1e]">
      <section className="flex flex-col items-center px-4 pt-10 text-center">
        <div className="relative">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-[#d8e2ff] text-3xl font-bold text-[#163274] shadow-xl">
            {ctxLoading ? (
              '…'
            ) : ctx?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ctx.avatar_url} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              avatarLetter
            )}
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
        {ctx?.localidad ? (
          <p className="mt-0.5 text-xs text-[#43617c]/80">{ctx.localidad}</p>
        ) : null}
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
          onClick={handleEditarPerfil}
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
              ) : null}
              {ctx?.experiencia ? (
                <p>
                  <span className="font-semibold text-[#163274]">Experiencia: </span>
                  {ctx.experiencia}
                </p>
              ) : null}
              {ctx?.descripcion ? (
                <p>
                  <span className="font-semibold text-[#163274]">Sobre mí: </span>
                  {ctx.descripcion}
                </p>
              ) : null}
              {Array.isArray(ctx?.especialidades_secundarias) && ctx?.especialidades_secundarias.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {ctx!.especialidades_secundarias.map((es) => (
                    <span
                      key={es}
                      className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-[#163274]"
                    >
                      {es}
                    </span>
                  ))}
                </div>
              ) : null}
              {!ctx?.email && !ctx?.telefono && !ctx?.experiencia && !ctx?.descripcion ? (
                <p className="text-slate-500">Completá tu perfil para mejorar tu visibilidad.</p>
              ) : null}
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

      <EditarPerfilModal
        open={editarOpen}
        onClose={() => setEditarOpen(false)}
        onSaved={handlePerfilGuardado}
      />
    </div>
  );
}

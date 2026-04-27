'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useState } from 'react';
import {
  Landmark,
  Network,
  Wallet,
  Bell,
  UserCircle,
  Users,
  PlusCircle,
  FileText,
  ClipboardList,
  BadgeCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';

const mint = '#85f8c4';

function BauhausDomainLink({
  href,
  className,
  style,
  children,
}: {
  href: Route;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={style}
      className={cn(
        'flex cursor-pointer flex-col justify-between rounded-xl p-8 transition duration-500 hover:scale-[1.02] hover:shadow-xl',
        className
      )}
    >
      {children}
    </Link>
  );
}

type Actividad = { id: string; hora: string; titulo: string; detalle: string; tone: 'mint' | 'slate' };

function inicialesU(n: string | null | undefined, e: string | null | undefined) {
  if (n?.trim()) {
    const p = n.trim().split(/\s+/);
    if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase().slice(0, 2);
    return n.trim().slice(0, 2).toUpperCase();
  }
  if (e?.trim()) return e.trim().slice(0, 2).toUpperCase();
  return '??';
}

export function ClienteDashboardContent() {
  const user = useCurrentUser();
  const [primeraObra, setPrimeraObra] = useState<string | null>(null);
  const [actividad, setActividad] = useState<Actividad[]>([]);

  useEffect(() => {
    let a = true;
    (async () => {
      try {
        const rO = await fetch('/api/obras', { cache: 'no-store' });
        const jO = await rO.json().catch(() => ({}));
        if (!a) return;
        if (rO.ok && Array.isArray(jO.data) && jO.data[0]?.id) {
          setPrimeraObra(jO.data[0].id);
        } else {
          setPrimeraObra(null);
        }
        const org = user?.orgId;
        if (!org) {
          setActividad([]);
          return;
        }
        const rT = await fetch(
          `/api/tareas?org_id=${encodeURIComponent(org)}`,
          { cache: 'no-store' },
        );
        const jT = await rT.json().catch(() => ({}));
        if (!a) return;
        if (!rT.ok || !Array.isArray(jT.data)) {
          setActividad([]);
          return;
        }
        const items: Actividad[] = jT.data.slice(0, 6).map((t: any, i: number) => ({
          id: String(t.id ?? i),
          hora: t.created_at
            ? new Date(t.created_at).toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit' })
            : '—',
          titulo: t.title || 'Tarea',
          detalle: t.obra?.name ? `${t.obra.name}` : t.estado || '',
          tone: 'slate' as const,
        }));
        setActividad(items);
      } catch {
        if (a) {
          setPrimeraObra(null);
          setActividad([]);
        }
      }
    })();
    return () => {
      a = false;
    };
  }, [user?.orgId]);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      {/* ——— Desktop: Bauhaus central hub (Stitch home_bauhaus_central_hub_desktop) ——— */}
      <div className="hidden min-h-0 flex-1 lg:flex">
        <section className="flex flex-1 flex-col items-center bg-[#f6fafe] px-6 py-10 xl:px-12">
          <header className="mb-12 flex w-full max-w-4xl flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xl font-bold tracking-tighter text-sky-950">G.</span>
              <h1 className="text-xl font-extrabold tracking-tighter text-sky-950">Grows Hub</h1>
              <span
                className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-[#24a375]"
                style={{ backgroundColor: mint, color: '#002114' }}
              >
                {user?.orgName || 'Grows'}
              </span>
            </div>
            <div className="flex items-center gap-6">
              <nav className="hidden gap-6 md:flex">
                <span className="border-b-2 border-sky-600 pb-1 text-sm font-semibold uppercase tracking-wide text-sky-950">
                  Dashboard
                </span>
                <span className="cursor-not-allowed text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Analytics
                </span>
                <span className="cursor-not-allowed text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Project files
                </span>
              </nav>
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-xs font-bold text-slate-700">
                {inicialesU(user?.name, user?.email)}
              </div>
            </div>
          </header>

          <div className="w-full max-w-4xl">
            <div className="mb-12">
              <h2 className="text-4xl font-extralight leading-none tracking-tight text-[#001629] xl:text-5xl">
                Perspective
                <br />
                <span className="font-bold">Workspace</span>
              </h2>
              <p className="mt-4 max-w-sm text-sm text-[#545f6e]">
                Claridad técnica para la excelencia en obra. Elegí un dominio para continuar.
              </p>
            </div>

            <div
              className="mx-auto grid aspect-square w-full max-w-[min(100%,600px)] gap-8"
              style={{
                gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
                gridTemplateRows: 'repeat(12, minmax(0, 1fr))',
              }}
            >
              <BauhausDomainLink
                href={'/cliente/obras' as Route}
                className="col-span-4 col-start-1 row-span-8 row-start-1 bg-[#001629] text-white hover:shadow-2xl"
              >
                <Landmark className="h-10 w-10 text-[#f6fafe] opacity-95 xl:h-12 xl:w-12" strokeWidth={1.25} />
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-widest opacity-60">Dominio 01</p>
                  <h3 className="text-2xl font-semibold tracking-tight">Obras</h3>
                </div>
              </BauhausDomainLink>

              <BauhausDomainLink
                href={'/cliente/tareas' as Route}
                className="col-span-5 col-start-5 row-span-5 row-start-1 bg-[#dfe3e7] text-[#001629] hover:bg-white"
              >
                <Network className="h-9 w-9 xl:h-10 xl:w-10" strokeWidth={1.25} />
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-widest opacity-60">Dominio 02</p>
                  <h3 className="text-xl font-semibold tracking-tight">Tareas</h3>
                </div>
              </BauhausDomainLink>

              <BauhausDomainLink
                href={'/cliente/presupuesto' as Route}
                className="col-span-3 col-start-10 row-span-3 row-start-1 text-[#002114] hover:shadow-lg"
                style={{ backgroundColor: mint }}
              >
                <Wallet className="mx-auto h-8 w-8 xl:h-9 xl:w-9" strokeWidth={1.25} />
              </BauhausDomainLink>

              <BauhausDomainLink
                href={'/cliente/notificaciones' as Route}
                className="col-span-3 col-start-10 row-span-3 row-start-4 bg-[#f0f4f8] text-[#001629] hover:bg-[#001629] hover:text-white"
              >
                <Bell className="mx-auto h-8 w-8 xl:h-9 xl:w-9" strokeWidth={1.25} />
              </BauhausDomainLink>

              <BauhausDomainLink
                href={'/cliente/cuadrillas' as Route}
                className="col-span-8 col-start-5 row-span-4 row-start-6 flex-row items-center justify-between bg-[#d7e4f5] px-10 text-[#001629] hover:shadow-lg"
              >
                <h3 className="text-xl font-semibold">Cuadrillas</h3>
                <Users className="h-8 w-8 xl:h-9 xl:w-9" strokeWidth={1.25} />
              </BauhausDomainLink>

              <BauhausDomainLink
                href={'/cliente/cuenta' as Route}
                className="relative col-span-4 col-start-1 row-span-4 row-start-9 overflow-hidden bg-[#e4e9ed] hover:shadow-lg"
              >
                <div
                  className="absolute inset-0 opacity-25 grayscale transition duration-700 group-hover:grayscale-0"
                  style={{
                    backgroundImage:
                      'url(https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=800&q=80)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                <div className="relative z-[1] mt-auto flex h-full flex-col justify-end p-8">
                  <h3 className="text-xl font-semibold text-[#001629]">Cuenta</h3>
                </div>
              </BauhausDomainLink>
            </div>
          </div>
        </section>

        <aside className="z-30 flex w-80 shrink-0 flex-col gap-10 border-l border-slate-200/80 bg-slate-50 p-8">
          <div>
            <h4 className="mb-6 text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</h4>
            <Link
              href={(primeraObra ? `/cliente/tareas/${primeraObra}` : '/cliente/tareas') as Route}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#001629] py-4 px-6 text-sm font-bold tracking-wide text-white shadow-lg transition hover:-translate-x-1 hover:shadow-xl active:scale-95"
            >
              <PlusCircle className="h-5 w-5" />
              + Nueva tarea
            </Link>
          </div>
          <div className="min-h-0 flex-1">
            <h4 className="mb-8 text-xs font-semibold uppercase tracking-wider text-slate-500">Recent activity</h4>
            <div className="space-y-10">
              {actividad.length === 0 ? (
                <p className="text-sm text-slate-500">No hay actividad reciente de tareas.</p>
              ) : (
                actividad.map((a) => (
                  <div key={a.id} className="relative border-l-2 border-emerald-200/40 pl-6">
                    <div
                      className={cn(
                        'absolute -left-[5px] top-0 h-2 w-2 rounded-full',
                        a.tone === 'mint' ? 'bg-emerald-400' : 'bg-slate-300',
                      )}
                    />
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-tighter text-slate-400">{a.hora}</p>
                    <h5 className="text-sm font-semibold leading-snug text-[#001629]">{a.titulo}</h5>
                    <p className="mt-1 text-xs font-light text-[#545f6e]">{a.detalle}</p>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="mt-auto border-t border-slate-200/60 pt-6">
            <div className="rounded-2xl bg-[#eaeef2] p-6">
              <div className="mb-4 flex items-center gap-3">
                <FileText className="h-5 w-5 text-emerald-700" strokeWidth={1.5} />
                <h6 className="text-xs font-bold uppercase tracking-widest text-[#001629]">Studio specs</h6>
              </div>
              <p className="text-[10px] font-light leading-relaxed text-slate-500">
                Mantener alineación en grilla de 8px en todos los exports CAD para consistencia en el archivo de
                estudio.
              </p>
            </div>
          </div>
        </aside>
      </div>

      {/* ——— Mobile: grilla Bauhaus (solo bajo ClienteHeader; sin barra inferior) ——— */}
      <div className="flex min-h-0 flex-1 flex-col bg-[#f8f9fb] lg:hidden">
        <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-4">
          <div
            className="grid w-full max-w-[300px] gap-2"
            style={{ gridTemplateColumns: 'repeat(2, 1fr)', aspectRatio: '2 / 3' }}
          >
            <div className="flex flex-col items-center gap-2">
              <Link
                href={'/cliente/obras' as Route}
                className="flex aspect-[4/5] w-full flex-col items-center justify-center rounded-tl-[80px] bg-[#001629] text-white shadow-sm transition active:scale-[0.96]"
              >
                <Landmark className="h-10 w-10" strokeWidth={1} />
              </Link>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#001629]">Obras</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Link
                href={'/cliente/tareas' as Route}
                className="flex aspect-[4/5] w-full flex-col items-center justify-center rounded-tr-xl bg-[#e9ecef] text-[#001629] shadow-sm transition active:scale-[0.96]"
              >
                <ClipboardList className="h-9 w-9" strokeWidth={1} />
              </Link>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#73777e]">Tareas</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Link
                href={'/cliente/cuadrillas' as Route}
                className="flex aspect-[4/5] w-full flex-col items-center justify-center bg-[#f0f2f5] text-[#001629] transition active:scale-[0.96]"
              >
                <div className="flex h-16 w-16 items-center justify-center border border-[#001629]/5">
                  <Users className="h-8 w-8" strokeWidth={1} />
                </div>
              </Link>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#73777e]">Partners</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Link
                href={'/cliente/presupuesto' as Route}
                className="relative flex aspect-[4/5] w-full flex-col items-center justify-center bg-[#002b49] text-white active:scale-[0.96]"
              >
                <div className="absolute -left-1 -top-1 h-12 w-12 rounded-full border-l border-t border-[#24a375] opacity-40" />
                <Wallet className="relative h-8 w-8" strokeWidth={1} />
              </Link>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#73777e]">Wallet</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Link
                href={'/cliente/notificaciones' as Route}
                className="relative flex aspect-[4/5] w-full flex-col items-center justify-center rounded-bl-xl bg-[#001629] text-white active:scale-[0.96]"
              >
                <Bell className="h-8 w-8" strokeWidth={1} />
                <span className="absolute right-[22%] top-[28%] h-2 w-2 rounded-full bg-[#24a375] shadow-[0_0_8px_rgba(36,163,117,0.6)]" />
              </Link>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#73777e]">Notifs</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Link
                href={'/cliente/cuenta' as Route}
                className="flex aspect-[4/5] w-full flex-col items-center justify-center rounded-br-[80px] bg-[#e9ecef] text-[#001629] active:scale-[0.96]"
              >
                <UserCircle className="h-8 w-8" strokeWidth={1} />
                <div className="mt-2 flex w-6 flex-col gap-1">
                  <div className="h-px w-full bg-[#001629]/20" />
                  <div className="h-px w-2/3 bg-[#001629]/20" />
                </div>
              </Link>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#73777e]">Perfil</span>
            </div>
          </div>

          <Link
            href={`/cliente/validar` as Route}
            className="mt-8 flex shrink-0 items-center gap-2 rounded-full border border-[#001629]/10 bg-white px-4 py-2 text-xs font-semibold text-[#001629] shadow-sm"
          >
            <BadgeCheck className="h-4 w-4 text-emerald-600" />
            Validaciones pendientes
          </Link>
        </main>
      </div>
    </div>
  );
}

'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import {
  ArrowUp,
  Bell,
  Building2,
  FileText,
  LayoutTemplate,
  Loader2,
  Mic,
  Plus,
  Search,
  Users,
} from 'lucide-react';
import { useClienteObras, type ClienteObraListaItem } from '@/lib/hooks/useClienteObras';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { cn } from '@/lib/utils';

const SUGGESTIONS = [
  'Edificio de 10 pisos en lote 30×40 mitad de cuadra',
  'Casa 2 plantas · 5 ambientes · Organizar electricidad y gas',
  'Definir programa → Unidades por piso',
  'Obra con FOS 75% y altura máx. 36 m',
];

const INSPIRACION = [
  {
    title: 'Multifamiliar',
    blurb: 'Etapas + CPM desde definición de lote',
    tone: 'from-[#1a3a6e] to-[#0C1D36]',
  },
  {
    title: 'Casa nueva',
    blurb: 'XML / gremios embutidos en el canvas',
    tone: 'from-[#24508f] to-[#122a4a]',
  },
  {
    title: 'Remodelación',
    blurb: 'Precedencias y publicar a la bolsa',
    tone: 'from-[#2a5a9e] to-[#0f2748]',
  },
  {
    title: 'Oficinas',
    blurb: 'Programa → envelope → estructura',
    tone: 'from-[#1e4578] to-[#0C1D36]',
  },
];

function daysAgo(d: Date) {
  return (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
}

function obraDate(o: ClienteObraListaItem) {
  const raw = o.updatedAt || o.createdAt;
  const d = raw ? new Date(raw) : new Date(0);
  return Number.isNaN(d.getTime()) ? new Date(0) : d;
}

function formatObraDate(o: ClienteObraListaItem) {
  const d = obraDate(o);
  if (!d.getTime()) return 'Sin fecha';
  return d.toLocaleDateString('es-AR', { month: 'short', day: 'numeric', year: 'numeric' });
}

function groupObras(obras: ClienteObraListaItem[]) {
  const g7: ClienteObraListaItem[] = [];
  const g30: ClienteObraListaItem[] = [];
  const gYear: ClienteObraListaItem[] = [];
  const older: ClienteObraListaItem[] = [];
  for (const o of obras) {
    const n = daysAgo(obraDate(o));
    if (n <= 7) g7.push(o);
    else if (n <= 30) g30.push(o);
    else if (n <= 365) gYear.push(o);
    else older.push(o);
  }
  return [
    { label: 'Últimos 7 días', items: g7 },
    { label: 'Últimos 30 días', items: g30 },
    { label: 'Este año', items: gYear },
    { label: 'Anteriores', items: older },
  ].filter((g) => g.items.length > 0);
}

/**
 * Home Grows emulando layout Stitch: sidebar proyectos + chat central,
 * tipografía/proporciones similares, paleta azul corporativo.
 */
export function GrowsHomeStitch() {
  const router = useRouter();
  const user = useCurrentUser();
  const { obras, loading } = useClienteObras();
  const [tab, setTab] = useState<'mios' | 'compartido'>('mios');
  const [q, setQ] = useState('');
  const [draft, setDraft] = useState('');
  const [modo, setModo] = useState<'obra' | 'edificio'>('edificio');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileProjectsOpen, setMobileProjectsOpen] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = [...obras].sort((a, b) => obraDate(b).getTime() - obraDate(a).getTime());
    if (!needle) return list;
    return list.filter(
      (o) =>
        (o.name || '').toLowerCase().includes(needle) ||
        (o.address || '').toLowerCase().includes(needle),
    );
  }, [obras, q]);

  const groups = useMemo(() => groupObras(filtered), [filtered]);

  const crearDesdeChat = async (texto: string) => {
    const objetivo = texto.trim();
    if (!objetivo || busy) return;
    if (!user?.orgId) {
      setError('No hay organización activa.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const nombre =
        objetivo.length > 48 ? `${objetivo.slice(0, 45).trim()}…` : objetivo;
      const res = await fetch('/api/obras/desde-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: user.orgId,
          nombre,
          objetivo_texto: objetivo,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message ?? json.details ?? 'No se pudo crear el proyecto');
      }
      const href = (json.redirectTo ?? `/cliente/tareas/${json.obra?.id}/editor`) as Route;
      router.push(href);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
      setBusy(false);
    }
  };

  const openObra = (id: string) => {
    setMobileProjectsOpen(false);
    router.push(`/cliente/tareas/${id}/editor` as Route);
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-[#0a1628] text-white">
      {/* Top bar */}
      <header className="flex h-12 shrink-0 items-center justify-between px-4 md:px-5">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold tracking-tight">Grows</span>
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/70">
            beta
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMobileProjectsOpen((v) => !v)}
            className="rounded-lg p-2 text-white/70 hover:bg-white/5 hover:text-white md:hidden"
            aria-label="Proyectos"
          >
            <Building2 className="h-4 w-4" />
          </button>
          <Link
            href={'/cliente/cuenta' as Route}
            className="hidden items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] text-white/70 hover:bg-white/5 hover:text-white sm:inline-flex"
          >
            <FileText className="h-3.5 w-3.5" />
            Docs
          </Link>
          <Link
            href={'/cliente/notificaciones' as Route}
            className="rounded-lg p-2 text-white/70 hover:bg-white/5 hover:text-white"
            aria-label="Notificaciones"
          >
            <Bell className="h-4 w-4" />
          </Link>
          <Link
            href={'/cliente/cuenta' as Route}
            className="ml-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#1e3a5f] text-[12px] font-semibold"
            title={user?.email || 'Cuenta'}
          >
            {(user?.name || user?.email || 'G').trim().slice(0, 1).toUpperCase()}
          </Link>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 gap-3 px-3 pb-3 md:gap-4 md:px-4 md:pb-4">
        {mobileProjectsOpen ? (
          <button
            type="button"
            className="absolute inset-0 z-10 bg-black/40 md:hidden"
            aria-label="Cerrar proyectos"
            onClick={() => setMobileProjectsOpen(false)}
          />
        ) : null}
        {/* Left project panel */}
        <aside
          className={cn(
            'w-[min(100%,300px)] shrink-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#12243f]/95 lg:w-[320px]',
            mobileProjectsOpen ? 'flex' : 'hidden md:flex',
            mobileProjectsOpen && 'absolute inset-y-3 left-3 z-20 md:relative md:inset-auto',
          )}
        >
          <div className="flex gap-1 border-b border-white/10 p-2">
            <button
              type="button"
              onClick={() => setTab('mios')}
              className={cn(
                'flex-1 rounded-full px-3 py-2 text-[12px] font-medium transition',
                tab === 'mios' ? 'bg-white/15 text-white' : 'text-white/55 hover:bg-white/5',
              )}
            >
              Mis proyectos
            </button>
            <button
              type="button"
              onClick={() => setTab('compartido')}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-medium transition',
                tab === 'compartido' ? 'bg-white/15 text-white' : 'text-white/55 hover:bg-white/5',
              )}
            >
              <Users className="h-3.5 w-3.5" />
              Compartido
            </button>
          </div>

          <div className="px-3 pt-3">
            <label className="flex items-center gap-2 rounded-full border border-white/10 bg-[#0a1628]/60 px-3 py-2">
              <Search className="h-4 w-4 shrink-0 text-white/40" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar proyectos"
                className="w-full bg-transparent text-[13px] text-white outline-none placeholder:text-white/35"
              />
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
            {tab === 'compartido' ? (
              <p className="px-2 py-6 text-center text-[13px] text-white/45">
                Todavía no hay proyectos compartidos con vos.
              </p>
            ) : loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-white/50">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando…
              </div>
            ) : groups.length === 0 ? (
              <p className="px-2 py-6 text-center text-[13px] text-white/45">
                Sin proyectos aún. Empezá desde el chat.
              </p>
            ) : (
              groups.map((g) => (
                <div key={g.label} className="mb-4">
                  <p className="px-2 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-white/40">
                    {g.label}
                  </p>
                  <ul className="space-y-0.5">
                    {g.items.map((o) => (
                      <li key={o.id}>
                        <button
                          type="button"
                          onClick={() => openObra(o.id)}
                          className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-white/8"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#1e3a5f] text-white/80">
                            <Building2 className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[13px] font-medium text-white">
                              {o.name || 'Sin nombre'}
                            </span>
                            <span className="block truncate text-[11px] text-white/40">
                              {formatObraDate(o)}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-white/10 px-3 py-3">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-white/40">
              Ejemplos
            </p>
            <button
              type="button"
              onClick={() => setDraft(SUGGESTIONS[0])}
              className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-[12px] text-white/70 hover:bg-white/8 hover:text-white"
            >
              <LayoutTemplate className="h-4 w-4 shrink-0" />
              Edificio 10 pisos · lote 30×40
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0d1c33]">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                'radial-gradient(ellipse 70% 45% at 50% 0%, rgba(74,111,165,0.22), transparent 55%)',
            }}
          />

          <div className="relative z-10 flex min-h-0 flex-1 flex-col px-4 pb-4 pt-8 md:px-10 md:pt-12 lg:px-16">
            <div className="mx-auto flex w-full max-w-3xl flex-col items-stretch gap-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-center text-[1.65rem] font-semibold tracking-tight text-white sm:text-left md:text-[1.85rem]">
                  Te damos la bienvenida a Grows
                </h1>
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
                  <Link
                    href={'/cliente/obras/nueva' as Route}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-[12px] font-medium text-white/90 hover:bg-white/10"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Empieza por tu obra
                  </Link>
                  <Link
                    href={'/cliente/proyectos/nuevo' as Route}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-[12px] font-medium text-white/90 hover:bg-white/10"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Proyecto en blanco
                  </Link>
                </div>
              </div>

              {/* Chat box */}
              <div className="rounded-[1.75rem] border border-white/12 bg-[#152a48]/90 shadow-[0_0_0_1px_rgba(74,111,165,0.25),0_20px_50px_rgba(0,0,0,0.35)]">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void crearDesdeChat(draft);
                    }
                  }}
                  rows={3}
                  placeholder={
                    modo === 'edificio'
                      ? '¿Qué edificio u obra vamos a organizar?'
                      : 'Contame la obra: lote, tipología, objetivo…'
                  }
                  className="w-full resize-none bg-transparent px-5 pb-2 pt-5 text-[15px] leading-relaxed text-white outline-none placeholder:text-white/35"
                  disabled={busy}
                />
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 pb-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white"
                      aria-label="Más"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setModo('edificio')}
                      className={cn(
                        'rounded-full px-3 py-1.5 text-[12px] font-medium transition',
                        modo === 'edificio'
                          ? 'bg-white/15 text-white'
                          : 'text-white/50 hover:bg-white/5 hover:text-white/80',
                      )}
                    >
                      Edificio
                    </button>
                    <button
                      type="button"
                      onClick={() => setModo('obra')}
                      className={cn(
                        'rounded-full px-3 py-1.5 text-[12px] font-medium transition',
                        modo === 'obra'
                          ? 'bg-white/15 text-white'
                          : 'text-white/50 hover:bg-white/5 hover:text-white/80',
                      )}
                    >
                      Obra
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="rounded-full p-2 text-white/45 hover:bg-white/10"
                      aria-label="Voz"
                      disabled
                      title="Pronto"
                    >
                      <Mic className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void crearDesdeChat(draft)}
                      disabled={busy || !draft.trim()}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#0C1D36] transition enabled:hover:bg-white/90 disabled:opacity-40"
                      aria-label="Enviar"
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {error ? <p className="text-center text-[13px] text-red-300">{error}</p> : null}

              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setDraft(s)}
                    className="shrink-0 rounded-full border border-white/12 bg-white/5 px-3.5 py-2 text-[12px] text-white/75 transition hover:bg-white/10 hover:text-white"
                  >
                    {s.length > 42 ? `${s.slice(0, 40)}…` : s}
                  </button>
                ))}
              </div>
            </div>

            {/* Inspiration */}
            <div className="mx-auto mt-auto w-full max-w-5xl pt-10">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[14px] font-medium text-white/80">¿Necesitás inspiración?</p>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {INSPIRACION.map((card) => (
                  <button
                    key={card.title}
                    type="button"
                    onClick={() => setDraft(`${card.title}: ${card.blurb}`)}
                    className={cn(
                      'aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b p-4 text-left transition hover:border-white/25 hover:brightness-110',
                      card.tone,
                    )}
                  >
                    <p className="text-[14px] font-semibold text-white">{card.title}</p>
                    <p className="mt-2 text-[12px] leading-snug text-white/65">{card.blurb}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

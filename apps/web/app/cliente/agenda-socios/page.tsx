'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Camera,
  IdCard,
  Loader2,
  Mail,
  Phone,
  PlusCircle,
  QrCode,
  Search,
  UserPlus,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type AgendaRow = {
  id: string;
  socio_id: string;
  source_socio_id: string | null;
  metodo: string;
  estado: string;
  created_at: string;
  socio: {
    id: string;
    nombre: string | null;
    email: string | null;
    telefono: string | null;
    estado: string | null;
    rol: string | null;
    contacto: string | null;
    especialidad?: string | null;
  } | null;
};

type OrgSocio = {
  id: string;
  nombre: string | null;
  contacto: string | null;
  email: string | null;
  estado: string | null;
  rol: string | null;
};

type UnifiedContact = {
  key: string;
  source: 'agenda' | 'org';
  agendaId?: string;
  socioId: string;
  nombre: string;
  subtitle: string;
  email: string | null;
  telefono: string | null;
  estadoLabel: string;
  estadoTone: 'free' | 'busy';
  metodo?: string;
  createdAt?: string;
};

type ResolvedSocio = {
  id: string;
  publicCode: string | null;
  name: string | null;
  oficio: string | null;
  zona: string | null;
  rating: number | null;
  email: string | null;
  telefono: string | null;
  estado: string | null;
};

const METODO_LABEL: Record<string, string> = {
  qr: 'QR',
  id_publico: 'ID de socio',
  email: 'Email',
  telefono: 'Teléfono',
};

function mapEstadoSocio(estado: string | null | undefined, rol: string | null | undefined) {
  const s = (estado || '').toLowerCase();
  if (s === 'activo' || s === 'activa') {
    return { label: 'Agendado', tone: 'free' as const };
  }
  if (s === 'inactivo' || s === 'pausa') {
    return { label: 'No disponible', tone: 'busy' as const };
  }
  if (rol) {
    return { label: 'En obra', tone: 'busy' as const };
  }
  return { label: 'Agendado', tone: 'free' as const };
}

type TabKey = 'qr' | 'id' | 'email';

export default function AgendaSociosPage() {
  const [agenda, setAgenda] = useState<AgendaRow[]>([]);
  const [orgSocios, setOrgSocios] = useState<OrgSocio[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listErr, setListErr] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>('id');

  const [qrValue, setQrValue] = useState('');
  const [idValue, setIdValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [agendarLoading, setAgendarLoading] = useState(false);
  const [resolved, setResolved] = useState<ResolvedSocio | null>(null);
  const [formMsg, setFormMsg] = useState<string | null>(null);
  const [resolveErr, setResolveErr] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoadingList(true);
    setListErr(null);
    try {
      const [agRes, soRes] = await Promise.all([
        fetch('/api/cliente/socios/agenda', { cache: 'no-store', credentials: 'include' }),
        fetch('/api/socios', { cache: 'no-store', credentials: 'include' }),
      ]);
      const agJson = await agRes.json().catch(() => ({}));
      const soJson = await soRes.json().catch(() => ({}));

      if (!agRes.ok) {
        setListErr(agJson.error || 'No se pudo cargar la agenda de socios');
        setAgenda([]);
      } else {
        setAgenda(Array.isArray(agJson.data) ? agJson.data : []);
      }

      if (soRes.ok && Array.isArray(soJson.data)) {
        setOrgSocios(soJson.data as OrgSocio[]);
      } else {
        setOrgSocios([]);
      }
    } catch {
      setListErr('Error de red');
      setAgenda([]);
      setOrgSocios([]);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const resetAgendarForm = useCallback(() => {
    setQrValue('');
    setIdValue('');
    setEmailValue('');
    setResolved(null);
    setFormMsg(null);
    setResolveErr(null);
  }, []);

  const openAgendar = () => {
    resetAgendarForm();
    setModalOpen(true);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code')?.trim();
    const token = params.get('agendar_socio') || params.get('asociar_socio');
    if (code) {
      setIdValue(code);
      setTab('id');
      setModalOpen(true);
    } else if (token) {
      setQrValue(token.trim());
      setTab('qr');
      setModalOpen(true);
    }
  }, []);

  const unifiedContacts: UnifiedContact[] = useMemo(() => {
    const fromAgenda: UnifiedContact[] = agenda.map((row) => {
      const s = row.socio;
      const { label, tone } = mapEstadoSocio(s?.estado, s?.rol);
      const nombre = s?.nombre || s?.email || s?.telefono || 'Socio agendado';
      const subtitle =
        (s as { especialidad?: string | null } | null)?.especialidad ||
        s?.rol ||
        s?.contacto ||
        'Contacto de obra';
      return {
        key: `agenda-${row.id}`,
        source: 'agenda' as const,
        agendaId: row.id,
        socioId: row.socio_id,
        nombre,
        subtitle,
        email: s?.email ?? null,
        telefono: s?.telefono ?? null,
        estadoLabel: label,
        estadoTone: tone,
        metodo: row.metodo,
        createdAt: row.created_at,
      };
    });

    const inAgenda = new Set(fromAgenda.map((r) => r.socioId));

    const fromOrg: UnifiedContact[] = orgSocios
      .filter((s) => !inAgenda.has(s.id))
      .map((s) => {
        const { label, tone } = mapEstadoSocio(s.estado, s.rol);
        const nombre = s.nombre || s.email || 'Socio';
        const subtitle = s.rol || s.contacto || 'En tu organización';
        return {
          key: `org-${s.id}`,
          source: 'org' as const,
          socioId: s.id,
          nombre,
          subtitle,
          email: s.email ?? null,
          telefono: null,
          estadoLabel: label,
          estadoTone: tone,
        };
      });

    return [...fromAgenda, ...fromOrg];
  }, [agenda, orgSocios]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return unifiedContacts;
    return unifiedContacts.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.telefono && c.telefono.includes(q)) ||
        c.subtitle.toLowerCase().includes(q),
    );
  }, [unifiedContacts, search]);

  const sourceForAgendar = (): 'qr' | 'id' | 'email' => {
    if (tab === 'qr') return 'qr';
    if (tab === 'email') return 'email';
    return 'id';
  };

  const buscarSocio = async () => {
    setSearchLoading(true);
    setResolveErr(null);
    setFormMsg(null);
    setResolved(null);

    try {
      let url = '';
      if (tab === 'id') {
        const codigo = idValue.trim();
        if (codigo.length < 4) {
          setResolveErr('Ingresá el ID del socio.');
          setSearchLoading(false);
          return;
        }
        url = `/api/socios/resolve?code=${encodeURIComponent(codigo)}`;
      } else if (tab === 'email') {
        const email = emailValue.trim();
        if (!email.includes('@')) {
          setResolveErr('Ingresá un email válido.');
          setSearchLoading(false);
          return;
        }
        url = `/api/socios/resolve?email=${encodeURIComponent(email)}`;
      } else {
        const raw = qrValue.trim();
        if (!raw) {
          setResolveErr('Pegá el código o link del QR.');
          setSearchLoading(false);
          return;
        }
        url = `/api/socios/resolve?paste=${encodeURIComponent(raw)}`;
      }

      const res = await fetch(url, { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.success) {
        setResolveErr(typeof json.error === 'string' ? json.error : 'No se pudo buscar el socio.');
        return;
      }

      const d = json.data as ResolvedSocio;
      setResolved(d);
    } catch {
      setResolveErr('Error de red al buscar socio.');
    } finally {
      setSearchLoading(false);
    }
  };

  const confirmarAgendar = async () => {
    if (!resolved) return;
    setAgendarLoading(true);
    setFormMsg(null);
    setResolveErr(null);

    try {
      const res = await fetch('/api/cliente/socios/agendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          socioId: resolved.id,
          source: sourceForAgendar(),
        }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'No se pudo guardar el contacto de obra.');
      }

      const message =
        typeof json.message === 'string'
          ? json.message
          : 'Socio agendado correctamente.';
      setResolved(null);
      setQrValue('');
      setIdValue('');
      setEmailValue('');
      setResolveErr(null);
      setFormMsg(message);
      await loadAll();
    } catch (e) {
      setFormMsg(e instanceof Error ? e.message : 'No se pudo guardar el socio.');
    } finally {
      setAgendarLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code')?.trim();
    if (!code || !modalOpen || tab !== 'id') {
      return;
    }
    const run = async () => {
      setSearchLoading(true);
      setResolveErr(null);
      setResolved(null);
      try {
        const res = await fetch(`/api/socios/resolve?code=${encodeURIComponent(code)}`, {
          cache: 'no-store',
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.success && json.data) {
          setResolved(json.data as ResolvedSocio);
        } else if (!res.ok) {
          setResolveErr(typeof json.error === 'string' ? json.error : null);
        }
      } catch {
        /* el usuario puede tocar Buscar socio */
      } finally {
        setSearchLoading(false);
      }
    };
    void run();
  }, [modalOpen, tab]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = (params.get('agendar_socio') || params.get('asociar_socio'))?.trim();
    if (!token || !modalOpen || tab !== 'qr') {
      return;
    }
    const run = async () => {
      setSearchLoading(true);
      setResolveErr(null);
      setResolved(null);
      try {
        const res = await fetch(`/api/socios/resolve?paste=${encodeURIComponent(token)}`, {
          cache: 'no-store',
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.success && json.data) {
          setResolved(json.data as ResolvedSocio);
        } else if (!res.ok) {
          setResolveErr(typeof json.error === 'string' ? json.error : null);
        }
      } catch {
        /* el usuario puede tocar Buscar socio */
      } finally {
        setSearchLoading(false);
      }
    };
    void run();
  }, [modalOpen, tab]);

  return (
    <div className="min-h-screen bg-[#f6fafe] pb-28 font-[family-name:var(--font-inter,Inter,sans-serif)] text-[#171c1f]">
      <header className="sticky top-0 z-40 border-b border-[#dfe3e7]/40 bg-[#f6fafe]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/cliente/dashboard"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#002b49] transition hover:bg-[#dfe3e7]/50"
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-[family-name:var(--font-manrope,Manrope,sans-serif)] text-2xl font-bold tracking-tight text-[#002b49] md:text-3xl">
              Agenda de socios
            </h1>
          </div>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#002b49] transition hover:bg-[#dfe3e7]/50"
            onClick={openAgendar}
            aria-label="Agendar socio"
          >
            <QrCode className="h-6 w-6" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-6 md:px-6">
        <p className="mb-8 max-w-2xl text-lg leading-relaxed text-[#42474d]">
          Guardá socios como contactos de obra para poder asignarles tareas.
        </p>

        <section className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="relative max-w-2xl flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#73777e]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar contacto de obra…"
              className="w-full rounded-xl border-none bg-[#f0f4f8] py-4 pl-12 pr-4 text-lg text-[#171c1f] placeholder:text-[#73777e]/70 outline-none ring-[#24a375] transition focus:ring-2"
            />
          </div>
          <Button
            type="button"
            onClick={openAgendar}
            className="h-auto gap-3 rounded-xl bg-[#001629] px-8 py-4 font-[family-name:var(--font-manrope,Manrope,sans-serif)] text-base font-bold tracking-wide text-white shadow-lg hover:bg-[#002b49]"
          >
            <PlusCircle className="h-5 w-5 text-[#85f8c4]" />
            Agendar socio
          </Button>
        </section>

        <section className="mb-10 flex items-center gap-3 overflow-x-auto pb-2">
          <span className="shrink-0 rounded-full bg-[#002b49] px-6 py-2 text-sm font-semibold text-[#cfe5ff]">
            Todos
          </span>
          {['Albañilería', 'Electricidad', 'Plomería', 'Pintura'].map((label) => (
            <span
              key={label}
              title="Próximamente: filtrar por oficio"
              className="shrink-0 cursor-not-allowed rounded-full bg-[#e4e9ed] px-6 py-2 text-sm font-semibold text-[#545f6e]/50"
            >
              {label}
            </span>
          ))}
        </section>

        {listErr ? (
          <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {listErr}
          </p>
        ) : null}

        {loadingList ? (
          <div className="flex items-center gap-2 py-12 text-[#42474d]">
            <Loader2 className="h-6 w-6 animate-spin" />
            Cargando contactos…
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl bg-white p-10 text-center shadow-[0_12px_32px_rgba(23,28,31,0.06)]">
            <UserPlus className="mx-auto mb-4 h-12 w-12 text-[#002b49]/40" />
            {unifiedContacts.length > 0 ? (
              <>
                <p className="font-[family-name:var(--font-manrope,Manrope,sans-serif)] text-lg font-bold text-[#002b49]">
                  No hay coincidencias
                </p>
                <p className="mt-2 text-sm text-[#42474d]">
                  Probá otra búsqueda o borrá el filtro.
                </p>
              </>
            ) : (
              <>
                <p className="font-[family-name:var(--font-manrope,Manrope,sans-serif)] text-lg font-bold text-[#002b49]">
                  Todavía no hay socios agendados
                </p>
                <p className="mt-2 text-sm text-[#42474d]">
                  Agendá un socio con QR, ID o email para verlo acá como contacto de obra.
                </p>
                <Button
                  type="button"
                  onClick={openAgendar}
                  className="mt-6 rounded-xl bg-[#001629] px-8 py-3 font-semibold text-white hover:bg-[#002b49]"
                >
                  Agendar socio
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {filtered.map((c) => (
              <article
                key={c.key}
                className="flex flex-col gap-6 rounded-xl bg-white p-6 shadow-[0_12px_32px_rgba(23,28,31,0.06)] transition hover:ring-1 hover:ring-[#c3c7ce]/40 md:flex-row"
              >
                <div
                  className={`relative h-32 w-32 shrink-0 overflow-hidden rounded-xl ${
                    c.estadoTone === 'free' ? 'bg-[#24a375]/15' : 'bg-[#002b49]/10'
                  } flex items-center justify-center`}
                >
                  <span className="font-[family-name:var(--font-manrope,Manrope,sans-serif)] text-3xl font-extrabold text-[#002b49]">
                    {c.nombre.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-[family-name:var(--font-manrope,Manrope,sans-serif)] text-xl font-extrabold text-[#001629]">
                        {c.nombre}
                      </h3>
                      <p className="text-sm font-semibold tracking-tight text-[#24a375]">
                        {c.subtitle}
                      </p>
                      {c.source === 'agenda' && c.metodo && c.createdAt ? (
                        <p className="mt-1 text-xs text-[#73777e]">
                          Socio agendado vía {METODO_LABEL[c.metodo] ?? c.metodo} ·{' '}
                          {new Date(c.createdAt).toLocaleDateString()}
                        </p>
                      ) : c.source === 'org' ? (
                        <p className="mt-1 text-xs text-[#73777e]">
                          Contacto de obra en tu organización (agendá para dejar registro en la
                          libreta).
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest ${
                        c.estadoTone === 'free'
                          ? 'bg-[#24a375]/15 text-[#005137]'
                          : 'bg-[#002b49] text-white'
                      }`}
                    >
                      {c.estadoLabel}
                    </span>
                  </div>
                  <div className="mb-4 flex gap-3">
                    {c.telefono ? (
                      <a
                        href={`tel:${c.telefono}`}
                        className="rounded-lg bg-[#f0f4f8] p-2 text-[#001629] transition hover:bg-[#002b49] hover:text-white"
                        aria-label="Llamar"
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                    ) : (
                      <span className="rounded-lg bg-[#f0f4f8]/50 p-2 text-[#c3c7ce]" title="Sin teléfono">
                        <Phone className="h-4 w-4" />
                      </span>
                    )}
                    {c.email ? (
                      <a
                        href={`mailto:${c.email}`}
                        className="rounded-lg bg-[#f0f4f8] p-2 text-[#001629] transition hover:bg-[#002b49] hover:text-white"
                        aria-label="Enviar email"
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                    ) : (
                      <span className="rounded-lg bg-[#f0f4f8]/50 p-2 text-[#c3c7ce]" title="Sin email">
                        <Mail className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled
                    title="Próximamente"
                    className="w-full cursor-not-allowed rounded-lg bg-[#e4e9ed] py-3 text-center text-sm font-bold text-[#73777e]"
                  >
                    Asignar tarea
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <p className="mt-10 text-center text-sm text-[#73777e]">
          ¿Necesitás el listado clásico?{' '}
          <Link href="/cliente/cuadrillas" className="font-semibold text-[#002b49] hover:underline">
            Cuadrillas
          </Link>
        </p>
      </main>

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            resetAgendarForm();
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl border-none bg-[#f6fafe] p-0 sm:max-w-md">
          <DialogHeader className="border-b border-[#dfe3e7]/50 px-6 pb-4 pt-6 text-left">
            <DialogTitle className="font-[family-name:var(--font-manrope,Manrope,sans-serif)] text-2xl font-bold text-[#002b49]">
              Agendar socio
            </DialogTitle>
            <p className="text-base leading-relaxed text-[#42474d]">
              Agendá socios como contactos de obra. Después vas a poder asignarles tareas,
              presupuestos y seguimiento.
            </p>
          </DialogHeader>

          <div className="space-y-8 px-6 pb-6 pt-2">
            <section className="flex flex-col items-center">
              <div className="relative aspect-square w-full max-w-[280px] overflow-hidden rounded-xl bg-[#002b49] shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-[#001629] via-[#0a2540] to-[#1a3a52] opacity-90" />
                <div className="absolute inset-8 flex items-center justify-center rounded-lg border-2 border-white/30">
                  <div className="absolute left-0 top-0 h-8 w-8 border-l-4 border-t-4 border-[#85f8c4] rounded-tl-md" />
                  <div className="absolute right-0 top-0 h-8 w-8 border-r-4 border-t-4 border-[#85f8c4] rounded-tr-md" />
                  <div className="absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4 border-[#85f8c4] rounded-bl-md" />
                  <div className="absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 border-[#85f8c4] rounded-br-md" />
                  <QrCode className="h-16 w-16 text-white/40" />
                  <div
                    className="pointer-events-none absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-gradient-to-r from-transparent via-[#24a375] to-transparent shadow-[0_0_15px_#24a375]"
                    aria-hidden
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-[#001629]/50 p-3 text-center backdrop-blur-md">
                  <span className="text-xs font-semibold uppercase tracking-widest text-white">
                    Escanear o pegar código
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTab('qr');
                  setResolved(null);
                  setResolveErr(null);
                  setFormMsg(null);
                }}
                className="mt-5 flex items-center gap-2 font-[family-name:var(--font-manrope,Manrope,sans-serif)] text-lg font-bold text-[#001629] hover:opacity-80"
              >
                <Camera className="h-5 w-5" />
                Escanear QR
              </button>
            </section>

            <div className="relative flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-[#c3c7ce]/40" />
              <span className="text-xs font-bold uppercase tracking-tighter text-[#73777e]">
                Otras opciones
              </span>
              <div className="h-px flex-1 bg-[#c3c7ce]/40" />
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['id', 'Por ID', IdCard],
                  ['email', 'Por email', Mail],
                  ['qr', 'QR / link', QrCode],
                ] as const
              ).map(([key, label, Icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setTab(key);
                    setResolved(null);
                    setResolveErr(null);
                    setFormMsg(null);
                  }}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    tab === key
                      ? 'bg-[#002b49] text-white'
                      : 'bg-[#e4e9ed] text-[#545f6e] hover:bg-[#dfe3e7]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            <div className="space-y-5">
              {tab === 'qr' ? (
                <div>
                  <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-widest text-[#001629]">
                    Pegá el código o link del QR
                  </label>
                  <textarea
                    value={qrValue}
                    onChange={(e) => setQrValue(e.target.value)}
                    rows={3}
                    placeholder="SOC-123456 o https://…?code=SOC-123456"
                    className="w-full rounded-xl border border-transparent bg-[#f0f4f8] px-4 py-3 text-[#171c1f] outline-none ring-[#24a375] placeholder:text-[#73777e]/60 focus:ring-2"
                  />
                  <p className="mt-2 text-xs text-[#73777e]">
                    La cámara para escanear en vivo viene próximamente; por ahora pegá el link o el
                    código.
                  </p>
                </div>
              ) : null}

              {tab === 'id' ? (
                <div>
                  <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-widest text-[#001629]">
                    ID del socio
                  </label>
                  <div className="flex items-center rounded-xl bg-[#f0f4f8] px-4 py-3 ring-[#24a375] focus-within:ring-2">
                    <IdCard className="mr-3 h-5 w-5 text-[#73777e]" />
                    <input
                      value={idValue}
                      onChange={(e) => setIdValue(e.target.value)}
                      placeholder="SOC-123456"
                      className="w-full border-none bg-transparent font-mono text-[#171c1f] outline-none placeholder:text-[#73777e]/50"
                    />
                  </div>
                </div>
              ) : null}

              {tab === 'email' ? (
                <div>
                  <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-widest text-[#001629]">
                    Email del socio
                  </label>
                  <div className="flex items-center rounded-xl bg-[#f0f4f8] px-4 py-3 focus-within:ring-2 focus-within:ring-[#24a375]">
                    <Mail className="mr-3 h-5 w-5 text-[#73777e]" />
                    <input
                      type="email"
                      value={emailValue}
                      onChange={(e) => setEmailValue(e.target.value)}
                      placeholder="nombre@constructor.com"
                      className="w-full border-none bg-transparent text-[#171c1f] outline-none placeholder:text-[#73777e]/50"
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {resolveErr ? (
              <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-900">
                {resolveErr}
              </p>
            ) : null}

            {resolved ? (
              <div className="rounded-xl border border-[#24a375]/30 bg-white p-4 shadow-sm">
                <p className="text-center text-xs font-bold uppercase tracking-widest text-[#24a375]">
                  Socio encontrado
                </p>
                <p className="mt-3 text-center font-[family-name:var(--font-manrope,Manrope,sans-serif)] text-lg font-bold text-[#001629]">
                  {resolved.name || resolved.email || 'Socio'}
                </p>
                {resolved.publicCode ? (
                  <p className="text-center text-sm font-mono font-semibold text-[#002b49]">
                    ID de socio: {resolved.publicCode}
                  </p>
                ) : null}
                {resolved.oficio ? (
                  <p className="text-center text-sm text-[#42474d]">{resolved.oficio}</p>
                ) : null}
                {resolved.zona ? (
                  <p className="text-center text-xs text-[#73777e]">{resolved.zona}</p>
                ) : null}
                {resolved.rating != null ? (
                  <p className="text-center text-xs text-[#73777e]">Rating: {resolved.rating}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap justify-center gap-2 text-sm text-[#42474d]">
                  {resolved.email ? (
                    <a href={`mailto:${resolved.email}`} className="font-medium text-[#002b49] hover:underline">
                      {resolved.email}
                    </a>
                  ) : null}
                  {resolved.telefono ? (
                    <a href={`tel:${resolved.telefono}`} className="font-medium text-[#002b49] hover:underline">
                      {resolved.telefono}
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}

            {!resolved ? (
              <Button
                type="button"
                onClick={() => void buscarSocio()}
                disabled={searchLoading}
                className="flex h-auto w-full items-center justify-center gap-3 rounded-xl bg-[#001629] py-5 font-[family-name:var(--font-manrope,Manrope,sans-serif)] text-lg font-extrabold tracking-wide text-white shadow-xl hover:bg-[#002b49]"
              >
                {searchLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
                Buscar socio
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => void confirmarAgendar()}
                disabled={agendarLoading}
                className="flex h-auto w-full items-center justify-center gap-3 rounded-xl bg-[#001629] py-5 font-[family-name:var(--font-manrope,Manrope,sans-serif)] text-lg font-extrabold tracking-wide text-white shadow-xl hover:bg-[#002b49]"
              >
                {agendarLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <UserPlus className="h-5 w-5" />
                )}
                Agendar socio
              </Button>
            )}

            {formMsg ? (
              <p className="rounded-xl bg-[#f0f4f8] p-4 text-center text-sm text-[#171c1f]">
                {formMsg}
              </p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

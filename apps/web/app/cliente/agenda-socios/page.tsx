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

const METODO_LABEL: Record<string, string> = {
  qr: 'QR',
  id_publico: 'ID de socio',
  email: 'Email',
  telefono: 'Teléfono',
};

function mapEstadoSocio(estado: string | null | undefined, rol: string | null | undefined) {
  const s = (estado || '').toLowerCase();
  if (s === 'activo' || s === 'activa') {
    return { label: 'Disponible', tone: 'free' as const };
  }
  if (s === 'inactivo' || s === 'pausa') {
    return { label: 'No disponible', tone: 'busy' as const };
  }
  if (rol) {
    return { label: 'En obra', tone: 'busy' as const };
  }
  return { label: 'Disponible', tone: 'free' as const };
}

type TabKey = 'qr' | 'id_publico' | 'email' | 'telefono';

export default function AgendaSociosPage() {
  const [agenda, setAgenda] = useState<AgendaRow[]>([]);
  const [orgSocios, setOrgSocios] = useState<OrgSocio[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listErr, setListErr] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>('qr');

  const [qrValue, setQrValue] = useState('');
  const [idValue, setIdValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [telValue, setTelValue] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoadingList(true);
    setListErr(null);
    try {
      const [agRes, soRes] = await Promise.all([
        fetch('/api/socios/agenda', { cache: 'no-store' }),
        fetch('/api/socios', { cache: 'no-store' }),
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('agendar_socio') || params.get('asociar_socio');
    if (token) {
      setQrValue(token);
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
        s?.rol || s?.contacto || 'Contacto de obra';
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

  const openAgendar = () => {
    setFormMsg(null);
    setModalOpen(true);
  };

  const submit = async () => {
    setSubmitting(true);
    setFormMsg(null);

    let body: Record<string, unknown> = { metodo: tab };
    if (tab === 'qr') {
      const token = qrValue.trim();
      if (!token) {
        setFormMsg('Pegá el link del QR o el código escaneado.');
        setSubmitting(false);
        return;
      }
      body = { metodo: 'qr', token };
    } else if (tab === 'id_publico') {
      const codigo = idValue.trim();
      if (codigo.length < 4) {
        setFormMsg('Ingresá el ID de socio.');
        setSubmitting(false);
        return;
      }
      body = { metodo: 'id_publico', codigo };
    } else if (tab === 'email') {
      const email = emailValue.trim();
      if (!email.includes('@')) {
        setFormMsg('Ingresá un email válido.');
        setSubmitting(false);
        return;
      }
      body = { metodo: 'email', email };
    } else {
      const telefono = telValue.trim();
      if (telefono.length < 6) {
        setFormMsg('Ingresá un teléfono con al menos 6 caracteres.');
        setSubmitting(false);
        return;
      }
      body = { metodo: 'telefono', telefono };
    }

    try {
      const res = await fetch('/api/socios/agendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'No se pudo guardar el contacto de obra.');
      }

      setFormMsg(json.message || 'Socio agendado.');
      setQrValue('');
      setIdValue('');
      setEmailValue('');
      setTelValue('');
      await loadAll();
    } catch (e) {
      setFormMsg(e instanceof Error ? e.message : 'No se pudo guardar el socio.');
    } finally {
      setSubmitting(false);
    }
  };

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
            aria-label="Agendar con QR"
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
                  Agendá un socio con QR, ID, email o teléfono para verlo acá como contacto de obra.
                </p>
                <Button
                  type="button"
                  onClick={openAgendar}
                  className="mt-6 rounded-xl bg-[#001629] px-8 py-3 font-semibold text-white hover:bg-[#002b49]"
                >
                  Agendar socio
                </Button>
                {orgSocios.length > 0 && agenda.length === 0 ? (
                  <p className="mt-4 text-xs text-[#73777e]">
                    Cuando exista agenda en base de datos, acá verás el historial; mientras tanto
                    podés gestionar socios en cuadrillas.
                  </p>
                ) : null}
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
                  <Link
                    href="/cliente/tareas"
                    className="w-full rounded-lg bg-[#e4e9ed] py-3 text-center text-sm font-bold text-[#001629] transition hover:bg-[#001629] hover:text-white"
                  >
                    Asignar tarea
                  </Link>
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

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
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
                onClick={() => setTab('qr')}
                className="mt-5 flex items-center gap-2 font-[family-name:var(--font-manrope,Manrope,sans-serif)] text-lg font-bold text-[#001629] hover:opacity-80"
              >
                <Camera className="h-5 w-5" />
                Usar código QR
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
                  ['qr', 'QR', QrCode],
                  ['id_publico', 'ID', IdCard],
                  ['email', 'Email', Mail],
                  ['telefono', 'Teléfono', Phone],
                ] as const
              ).map(([key, label, Icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
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
                    Código o link del QR
                  </label>
                  <textarea
                    value={qrValue}
                    onChange={(e) => setQrValue(e.target.value)}
                    rows={3}
                    placeholder="Pegá lo que obtuviste al escanear"
                    className="w-full rounded-xl border border-transparent bg-[#f0f4f8] px-4 py-3 text-[#171c1f] outline-none ring-[#24a375] placeholder:text-[#73777e]/60 focus:ring-2"
                  />
                  <p className="mt-2 text-xs text-[#73777e]">
                    La cámara para escanear en vivo viene próximamente; por ahora pegá el link o el
                    código.
                  </p>
                </div>
              ) : null}

              {tab === 'id_publico' ? (
                <div>
                  <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-widest text-[#001629]">
                    ID de socio
                  </label>
                  <div className="flex items-center rounded-xl bg-[#f0f4f8] px-4 py-3 ring-[#24a375] focus-within:ring-2">
                    <IdCard className="mr-3 h-5 w-5 text-[#73777e]" />
                    <input
                      value={idValue}
                      onChange={(e) => setIdValue(e.target.value.toUpperCase())}
                      placeholder="Ej. AB12CD34"
                      className="w-full border-none bg-transparent font-mono text-[#171c1f] outline-none placeholder:text-[#73777e]/50"
                    />
                  </div>
                </div>
              ) : null}

              {tab === 'email' ? (
                <div>
                  <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-widest text-[#001629]">
                    Correo electrónico
                  </label>
                  <div className="flex items-center rounded-xl bg-[#f0f4f8] px-4 py-3 focus-within:ring-2 focus-within:ring-[#24a375]">
                    <Mail className="mr-3 h-5 w-5 text-[#73777e]" />
                    <input
                      type="email"
                      value={emailValue}
                      onChange={(e) => setEmailValue(e.target.value)}
                      placeholder="nombre@estudio.com"
                      className="w-full border-none bg-transparent text-[#171c1f] outline-none placeholder:text-[#73777e]/50"
                    />
                  </div>
                </div>
              ) : null}

              {tab === 'telefono' ? (
                <div>
                  <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-widest text-[#001629]">
                    Teléfono
                  </label>
                  <div className="flex items-center rounded-xl bg-[#f0f4f8] px-4 py-3 focus-within:ring-2 focus-within:ring-[#24a375]">
                    <Phone className="mr-3 h-5 w-5 text-[#73777e]" />
                    <input
                      value={telValue}
                      onChange={(e) => setTelValue(e.target.value)}
                      placeholder="+54 9 11 …"
                      className="w-full border-none bg-transparent text-[#171c1f] outline-none placeholder:text-[#73777e]/50"
                    />
                  </div>
                  <p className="mt-2 text-xs text-[#73777e]">
                    Solo buscamos el número en Grows; no enviamos SMS ni WhatsApp.
                  </p>
                </div>
              ) : null}
            </div>

            <Button
              type="button"
              onClick={() => void submit()}
              disabled={submitting}
              className="flex h-auto w-full items-center justify-center gap-3 rounded-xl bg-[#001629] py-5 font-[family-name:var(--font-manrope,Manrope,sans-serif)] text-lg font-extrabold tracking-wide text-white shadow-xl hover:bg-[#002b49]"
            >
              {submitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <UserPlus className="h-5 w-5" />
              )}
              Guardar socio
            </Button>

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

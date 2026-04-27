'use client';

import { useCallback, useEffect, useState } from 'react';
import { QrCode } from 'lucide-react';

import { SectionHeader } from '@/components/cliente/SectionHeader';
import { CuadrillaCard } from '@/components/cliente/CuadrillaCard';
import { Button } from '@/components/ui/button';

type SocioRow = {
  id: string;
  nombre: string | null;
  contacto: string | null;
  email: string | null;
  estado: string | null;
  rol: string | null;
};

function mapDisponibilidad(estado: string | null | undefined, rol: string | null | undefined): string {
  const s = (estado || '').toLowerCase();
  if (s === 'activo' || s === 'activa') return 'En obra';
  if (s === 'inactivo' || s === 'pausa') return 'No disponible';
  if (rol) return 'Disponible';
  return 'Disponible';
}

function especialidad(rol: string | null | undefined, contacto: string | null | undefined): string {
  if (rol && rol.length > 0) return rol;
  if (contacto) return contacto;
  return 'Cuadrilla / socio';
}

export default function CuadrillasPage() {
  const [socios, setSocios] = useState<SocioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showQrPanel, setShowQrPanel] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [qrMessage, setQrMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/socios', { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(json.error || 'No se pudo cargar el listado');
        setSocios([]);
        return;
      }
      setSocios(Array.isArray(json.data) ? json.data : []);
    } catch {
      setErr('Error de red');
      setSocios([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromQr = params.get('asociar_socio');
    if (tokenFromQr) {
      setQrCode(tokenFromQr);
      setShowQrPanel(true);
    }
  }, []);

  const handleAssociateQr = async () => {
    const token = qrCode.trim();
    if (!token || qrLoading) {
      setQrMessage('Pegá el código o link del QR del socio.');
      return;
    }

    setQrLoading(true);
    setQrMessage(null);

    try {
      const response = await fetch('/api/socios/asociar-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'No se pudo asociar el socio.');
      }

      setQrMessage(payload.message || 'Socio asociado correctamente.');
      setQrCode('');
      await load();
    } catch (error) {
      setQrMessage(
        error instanceof Error ? error.message : 'No se pudo asociar el socio.',
      );
    } finally {
      setQrLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <SectionHeader
          eyebrow="Red de ejecución"
          title="Cuadrillas y socios"
          description="Socios registrados en tu organización (datos reales vía API)."
        />
        <Button
          type="button"
          className="rounded-lg bg-[#002E5D] text-white hover:bg-[#003d7a]"
          onClick={() => setShowQrPanel((value) => !value)}
        >
          <QrCode className="mr-2 h-4 w-4" />
          Asociar socio por QR
        </Button>
      </div>

      {showQrPanel ? (
        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
          <div className="mb-4 space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">
              Asociar socio constructor por QR
            </h2>
            <p className="text-sm text-slate-600">
              Escaneá el QR del socio con la cámara del celular. Si se abre esta página, el
              código se completa solo; si no, pegá el link o código manualmente.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={qrCode}
              onChange={(event) => setQrCode(event.target.value)}
              placeholder="Pegá el código o link del QR del socio"
              className="min-h-11 flex-1 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#002E5D] focus:ring-2 focus:ring-blue-100"
            />
            <Button
              type="button"
              className="rounded-lg bg-[#002E5D] text-white hover:bg-[#003d7a]"
              onClick={() => void handleAssociateQr()}
              disabled={qrLoading}
            >
              {qrLoading ? 'Asociando…' : 'Asociar socio'}
            </Button>
          </div>

          {qrMessage ? (
            <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              {qrMessage}
            </p>
          ) : null}
        </div>
      ) : null}

      {err ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{err}</p> : null}
      {loading ? (
        <p className="text-sm text-slate-600">Cargando…</p>
      ) : socios.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
          Aún no hay socios. Creá o invitá cuadrillas desde el panel de la organización.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {socios.map((c) => (
            <CuadrillaCard
              key={c.id}
              id={c.id}
              nombre={c.nombre || c.email || 'Sin nombre'}
              especialidad={especialidad(c.rol, c.contacto)}
              disponibilidad={mapDisponibilidad(c.estado, c.rol)}
              score={0}
              obrasSimultaneas={0}
              nota="Calificación y obras en paralelo: integrar cuando tengas métricas en la base."
            />
          ))}
        </div>
      )}
    </div>
  );
}

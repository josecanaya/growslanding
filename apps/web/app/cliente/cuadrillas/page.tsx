'use client';

import { useCallback, useEffect, useState } from 'react';
import { SectionHeader } from '@/components/cliente/SectionHeader';
import { CuadrillaCard } from '@/components/cliente/CuadrillaCard';

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

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <SectionHeader
        eyebrow="Red de ejecución"
        title="Cuadrillas y socios"
        description="Socios registrados en tu organización (datos reales vía API)."
      />
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

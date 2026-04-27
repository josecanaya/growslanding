'use client';

import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { SectionHeader } from '@/components/cliente/SectionHeader';
import { ValidacionCard } from '@/components/cliente/ValidacionCard';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import type { ApiTareaRow } from '@/lib/mappers/tarea-api-to-ui';

type Item = {
  id: string;
  obraNombre: string;
  bloque: string;
  socio: string;
  enviado: string;
  fotos: number;
  montoEstimado: number;
};

function formatEnvio(iso: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('es-AR');
  } catch {
    return iso;
  }
}

export default function ClienteValidarPage() {
  const { toast } = useToast();
  const user = useCurrentUser();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const org = user?.orgId;
      const q =
        `estado=${encodeURIComponent('para_validar')}` +
        (org ? `&org_id=${encodeURIComponent(org)}` : '');
      const res = await fetch(`/api/tareas?${q}`, { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setItems([]);
        return;
      }
      const data: ApiTareaRow[] = Array.isArray(json.data) ? json.data : [];
      setItems(
        data.map((t) => {
          const obra = t.obra as { name?: string } | undefined;
          const monto = typeof t.costo_presupuestado === 'number' ? t.costo_presupuestado : 0;
          return {
            id: t.id,
            obraNombre: obra?.name || 'Obra',
            bloque: t.title,
            socio: t.responsable || '—',
            enviado: formatEnvio(t.created_at),
            fotos: 0,
            montoEstimado: monto,
          };
        }),
      );
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user?.orgId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <SectionHeader
        eyebrow="Control de calidad"
        title="Validaciones pendientes"
        description="Tareas en estado “para validar” según la base de datos. Las acciones aquí son de demostración; enlazá el flujo de transición cuando integres el backend de validación."
      />
      {loading ? (
        <p className="text-sm text-slate-600">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="col-span-full rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-600">
          No hay tareas pendientes de validación.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((v) => (
            <ValidacionCard
              key={v.id}
              obraNombre={v.obraNombre}
              bloque={v.bloque}
              socio={v.socio}
              enviado={v.enviado}
              fotos={v.fotos}
              montoEstimado={v.montoEstimado}
              onAprobar={() => {
                toast({ title: 'Pendiente de integración', description: v.bloque });
                setItems((prev) => prev.filter((x) => x.id !== v.id));
              }}
              onRechazar={() => {
                toast({ title: 'Pendiente de integración', description: v.bloque });
                setItems((prev) => prev.filter((x) => x.id !== v.id));
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

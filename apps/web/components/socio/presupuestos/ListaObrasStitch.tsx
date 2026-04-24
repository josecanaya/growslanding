'use client';

import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Building2 } from 'lucide-react';

type StitchEstado = 'aprobado' | 'visto' | 'enviado' | 'rechazado' | 'pendiente';

export interface ObraStitchItem {
  obra_id: string;
  obra_name: string;
  direccion_completa?: string | null;
  fecha_inicio?: string | null;
  pendientes: number;
  enviados: number;
  aprobados: number;
  stitch_estado?: StitchEstado;
}

function inferEstado(obra: ObraStitchItem): StitchEstado {
  if (obra.stitch_estado) return obra.stitch_estado;
  if (obra.aprobados > 0) return 'aprobado';
  if (obra.enviados > 0) return 'enviado';
  return 'pendiente';
}

const blade = {
  aprobado: 'bg-stitch-tertiary',
  visto: 'bg-stitch-primary',
  enviado: 'bg-stitch-secondary',
  rechazado: 'bg-stitch-error',
  pendiente: 'bg-stitch-primary',
} as const;

const badge = {
  aprobado: 'border-stitch-tertiary/20 bg-stitch-tertiary/10 text-stitch-tertiary',
  visto: 'border-stitch-primary/20 bg-stitch-primary/10 text-stitch-primary',
  enviado: 'border-stitch-secondary/20 bg-stitch-secondary/10 text-stitch-secondary',
  rechazado: 'border-stitch-error/20 bg-stitch-error/10 text-stitch-error',
  pendiente: 'border-stitch-primary/20 bg-stitch-primary/10 text-stitch-primary',
} as const;

const label: Record<StitchEstado, string> = {
  aprobado: 'Aprobado',
  visto: 'Visto',
  enviado: 'Enviado',
  rechazado: 'Rechazado',
  pendiente: 'Pendiente',
};

interface ListaObrasStitchProps {
  obras: ObraStitchItem[];
  loading?: boolean;
}

/** Ref. `reforma/stitch_socio/_06_presupuestos/presupuestos_responsive_mis_lista` */
export function ListaObrasStitch({ obras, loading }: ListaObrasStitchProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-stitch-primary/10 bg-stitch-surface-container-lowest p-6"
          >
            <div className="mb-2 h-5 w-2/3 rounded bg-stitch-surface-container-high" />
            <div className="h-4 w-1/3 rounded bg-stitch-surface-container-high" />
          </div>
        ))}
      </div>
    );
  }

  if (obras.length === 0) {
    return (
      <div className="rounded-xl border border-stitch-primary/10 bg-white/85 p-8 text-center shadow-[0_12px_32px_-4px_rgba(22,50,116,0.06)] backdrop-blur-xl">
        <p className="font-stitch-headline text-stitch-primary">No hay obras con presupuesto</p>
        <p className="mt-1 text-sm text-stitch-on-surface/70">Cuando tengas proyectos, aparecerán con estado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h2 className="font-stitch-headline text-3xl font-bold tracking-tight text-stitch-on-surface">
          Mis presupuestos
        </h2>
        <p className="text-sm font-medium tracking-wide text-stitch-secondary">GESTIÓN DE PROYECTOS ACTIVOS</p>
      </div>

      <div className="flex flex-col space-y-4">
        {obras.map((obra) => {
          const st = inferEstado(obra);
          return (
            <button
              key={obra.obra_id}
              type="button"
              onClick={() => router.push(`/socio/presupuestos?obra_id=${obra.obra_id}`)}
              className="group relative cursor-pointer overflow-hidden rounded-xl border border-transparent bg-white/85 shadow-[0_12px_32px_-4px_rgba(22,50,116,0.06)] backdrop-blur-xl transition-all duration-300 hover:border-stitch-outline-variant/20"
            >
              <div className={cn('absolute left-0 top-0 h-full w-1 rounded-r', blade[st])} aria-hidden />
              <div className="flex items-center justify-between p-6 pl-7 text-left">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-stitch-secondary">
                    PROYECTO
                  </span>
                  <h3 className="font-stitch-headline text-lg font-bold text-stitch-on-surface">
                    {obra.obra_name}
                  </h3>
                  {obra.direccion_completa && (
                    <p className="line-clamp-1 text-xs text-stitch-on-surface/60">{obra.direccion_completa}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 pl-2">
                  <span
                    className={cn(
                      'rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-tighter',
                      badge[st],
                    )}
                  >
                    {label[st]}
                  </span>
                  <ChevronRight className="h-5 w-5 text-stitch-outline-variant transition-colors group-hover:text-stitch-primary" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="relative mt-8 overflow-hidden rounded-2xl bg-gradient-to-br from-stitch-primary to-stitch-primary-container p-8">
        <div className="relative z-10">
          <h4 className="mb-2 font-stitch-headline text-xl font-bold text-white">Solicitar nuevo presupuesto</h4>
          <p className="mb-6 max-w-[240px] text-sm text-blue-100/80">
            Iniciá una nueva cotización para tu próximo desarrollo.
          </p>
          <Link
            href="/socio/oportunidades"
            className="inline-block rounded-lg bg-stitch-surface-container-lowest px-6 py-2.5 text-sm font-bold tracking-wide text-stitch-primary shadow-lg transition-transform active:scale-95"
          >
            NUEVA OBRA
          </Link>
        </div>
        <Building2
          className="pointer-events-none absolute -right-10 -top-5 h-[200px] w-[200px] text-white opacity-10"
          aria-hidden
        />
      </div>
    </div>
  );
}

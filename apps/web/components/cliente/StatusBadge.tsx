import { cn } from '@/lib/utils';

const variants: Record<string, string> = {
  'En progreso': 'bg-sky-100 text-sky-900 border-sky-200',
  'Para validar': 'bg-amber-100 text-amber-900 border-amber-200',
  Validada: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  Pendiente: 'bg-slate-100 text-slate-700 border-slate-200',
  Bloqueada: 'bg-rose-100 text-rose-900 border-rose-200',
  Planificación: 'bg-violet-100 text-violet-900 border-violet-200',
  'En obra': 'bg-sky-100 text-sky-900 border-sky-200',
  Parcial: 'bg-amber-100 text-amber-900 border-amber-200',
  Disponible: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  'Pendiente de respuesta': 'bg-amber-100 text-amber-900 border-amber-200',
  Recibido: 'bg-sky-100 text-sky-900 border-sky-200',
  'Borrador interno': 'bg-slate-100 text-slate-700 border-slate-200',
};

export function StatusBadge({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  const v = variants[label] ?? 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide',
        v,
        className
      )}
    >
      {label}
    </span>
  );
}

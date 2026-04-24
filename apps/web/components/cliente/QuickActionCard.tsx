import Link from 'next/link';
import type { Route } from 'next';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function QuickActionCard({
  href,
  title,
  subtitle,
  icon: Icon,
  className,
  variant = 'light',
}: {
  href: Route;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  className?: string;
  variant?: 'dark' | 'light' | 'accent';
}) {
  const base =
    variant === 'dark'
      ? 'bg-slate-900 text-white border-slate-800'
      : variant === 'accent'
        ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
        : 'bg-white text-slate-900 border-slate-200';

  return (
    <Link
      href={href}
      className={cn(
        'flex flex-col justify-between rounded-xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md',
        base,
        className
      )}
    >
      <Icon className={cn('h-8 w-8', variant === 'dark' ? 'text-sky-300' : 'text-sky-700')} strokeWidth={1.5} />
      <div className="mt-4">
        <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Acceso</p>
        <p className="mt-1 text-lg font-bold leading-tight">{title}</p>
        {subtitle ? <p className="mt-1 text-sm opacity-80">{subtitle}</p> : null}
      </div>
    </Link>
  );
}

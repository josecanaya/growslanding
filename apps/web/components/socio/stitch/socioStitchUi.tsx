import { cn } from '@/lib/utils';

/** Contenido de página bajo el header global (ref. ancho móvil + tablet Stitch). */
export const STITCH_INNER = 'w-full max-w-2xl mx-auto px-6 pb-8 pt-4';

export function StitchSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-stitch-outline">{children}</p>
  );
}

export function StitchH1({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h1
      className={cn(
        'font-stitch-headline text-xl font-extrabold tracking-tight text-stitch-primary',
        className,
      )}
    >
      {children}
    </h1>
  );
}

export function StitchH2Page({
  kicker,
  title,
  description,
  className,
}: {
  kicker?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn('mb-6 space-y-1', className)}>
      {kicker ? (
        <p className="text-xs font-semibold uppercase tracking-wider text-stitch-primary/90">{kicker}</p>
      ) : null}
      <h2 className="font-stitch-headline text-2xl font-extrabold tracking-tight text-stitch-on-surface">
        {title}
      </h2>
      {description ? <p className="mt-1 max-w-xl text-sm text-stitch-on-surface/70">{description}</p> : null}
    </div>
  );
}

export function StitchStickySubheader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'sticky top-0 z-20 border-b border-stitch-surface-container-high/90 bg-stitch-surface/90 px-0 py-3 backdrop-blur-sm',
        className,
      )}
    >
      {children}
    </div>
  );
}

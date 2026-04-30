/** Clases inspiradas en `nueva_obra_desktop_hub` */

export function hubSectionShell(): string {
  return [
    'rounded-xl bg-white p-6 shadow-[0_12px_32px_rgba(23,28,31,0.04)] sm:p-8',
  ].join(' ');
}

export function hubLabel(): string {
  return [
    'px-1 text-xs font-bold uppercase tracking-widest text-[#42474d]',
  ].join(' ');
}

export function hubInput(): string {
  return [
    'min-h-[48px] w-full rounded-lg border-0 bg-[#f0f4f8] p-3 text-sm text-[#171c1f]',
    'outline-none transition-[box-shadow] focus:ring-2 focus:ring-[#24a375]',
  ].join(' ');
}

export function hubPrimaryButton(): string {
  return [
    'inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-[#001629]',
    'px-8 text-base font-bold text-white shadow-lg shadow-black/10',
    'transition hover:bg-[#002b49] disabled:cursor-not-allowed disabled:opacity-55',
    'active:scale-[0.98]',
  ].join(' ');
}

export function hubSecondaryButton(): string {
  return [
    'inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-[#c3c7ce]',
    'bg-white px-6 text-sm font-semibold text-[#001629]',
    'transition hover:bg-[#f0f4f8]',
  ].join(' ');
}

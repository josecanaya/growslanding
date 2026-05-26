'use client';

import { MetodosRetiroSection } from '@/components/socio/billetera/MetodosRetiroSection';

/** Datos bancarios / métodos de retiro dentro de Cuenta del socio. */
export function DatosBancariosSection() {
  return (
    <section id="cuenta-datos-bancarios" className="scroll-mt-24">
      <MetodosRetiroSection />
    </section>
  );
}

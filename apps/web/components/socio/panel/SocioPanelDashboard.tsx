'use client';

import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { TrabajosHoySection } from '@/components/socio/home/TrabajosHoySection';
import { AccesosRapidosGrid } from '@/components/socio/home/AccesosRapidosGrid';
import { HomeSolicitudesSection } from '@/components/socio/home/HomeSolicitudesSection';
import { USE_MOCK_DATA, MOCK_USER_DISPLAY_NAME } from '@/lib/mocks/socioMockData';

/**
 * Home socio alineado a `reforma/stitch_socio/_01_panel/panel_responsive_home`:
 * columna central max-w-md, bloques con espaciado Stitch.
 */
export function SocioPanelDashboard() {
  const currentUser = useCurrentUser();
  const displayName = USE_MOCK_DATA
    ? MOCK_USER_DISPLAY_NAME
    : currentUser?.name?.trim() || 'Socio';

  return (
    <div className="mx-auto w-full max-w-md space-y-8 px-6 pb-8 pt-6 font-stitch-body">
      {USE_MOCK_DATA && (
        <p className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-center text-[11px] font-medium text-amber-900">
          Vista demo — {displayName}
        </p>
      )}

      <TrabajosHoySection />

      <a
        href="/socio/conocimiento"
        className="block rounded-2xl border border-[#163274]/15 bg-white px-4 py-3 shadow-sm"
      >
        <p className="text-xs font-bold uppercase tracking-wide text-[#163274]">Chat</p>
        <p className="mt-1 text-sm text-slate-700">
          Preguntá al conocimiento de Grows (misma carpeta que Cursor / MCP).
        </p>
      </a>

      <AccesosRapidosGrid hideTitle={false} showOnly="high" stitchLayout />

      <HomeSolicitudesSection />
    </div>
  );
}

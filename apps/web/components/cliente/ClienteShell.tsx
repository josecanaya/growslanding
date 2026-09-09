'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ClienteLauncher } from '@/components/cliente/ClienteLauncher';

export function ClienteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';

  /**
   * Pantallas que ya traen su propia chrome de pantalla completa:
   * el home Stitch y el workspace de obra (ObraTopBar + ToolRail + breadcrumb).
   * No se les superpone el launcher para no duplicar el acceso.
   */
  const homeStitch = pathname === '/cliente/dashboard' || pathname === '/cliente';
  const obraWorkspace = /^\/cliente\/tareas\/[^/]+\/editor/.test(pathname);
  const chromePropia = homeStitch || obraWorkspace;

  return (
    <div className="min-h-screen bg-[#FBFBF9] text-[#15161A]">
      {!chromePropia ? <ClienteLauncher /> : null}
      <main
        className={cn(
          'min-h-screen',
          chromePropia ? 'p-0' : 'px-4 pb-8 pt-16 md:px-8 md:pt-16',
        )}
      >
        {children}
      </main>
    </div>
  );
}

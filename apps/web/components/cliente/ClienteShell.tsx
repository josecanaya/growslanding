'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ClienteSidebar } from '@/components/cliente/ClienteSidebar';
import { ClienteHeader } from '@/components/cliente/ClienteHeader';

export function ClienteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  /** Home Stitch trae su propia chrome; sin sidebar/header del shell. */
  const homeStitch = pathname === '/cliente/dashboard' || pathname === '/cliente';
  /**
   * Workspace de obra: el lienzo ocupa la pantalla. Sin sidebar ni header del shell
   * — la obra trae su propia chrome (ObraTopBar + ToolRail + breadcrumb flotante).
   */
  const obraWorkspace = /^\/cliente\/tareas\/[^/]+\/editor/.test(pathname);
  const fullBleed = homeStitch || obraWorkspace;

  return (
    <div className={cn('min-h-screen text-[#15161A]', fullBleed ? 'bg-[#FBFBF9]' : 'bg-[#F6F5F1]')}>
      <div className="flex min-h-screen">
        {!fullBleed ? (
          <div className="hidden md:block">
            <ClienteSidebar className="fixed left-0 top-0 z-30" />
          </div>
        ) : null}
        <div
          className={cn(
            'flex min-h-screen flex-1 flex-col',
            !fullBleed && 'md:pl-[4.5rem]',
          )}
        >
          {!fullBleed ? <ClienteHeader /> : null}
          <main
            className={cn(
              'min-h-0 flex-1',
              fullBleed ? 'p-0' : 'px-4 py-6 md:px-8 md:py-8',
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

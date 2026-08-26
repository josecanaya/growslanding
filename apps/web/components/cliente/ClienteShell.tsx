'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ClienteSidebar } from '@/components/cliente/ClienteSidebar';
import { ClienteHeader } from '@/components/cliente/ClienteHeader';

export function ClienteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  /** Home Stitch trae su propia chrome; sin sidebar/header del shell. */
  const homeStitch = pathname === '/cliente/dashboard' || pathname === '/cliente';

  return (
    <div
      className={cn(
        'min-h-screen text-slate-900',
        homeStitch ? 'bg-[#0a1628]' : 'bg-[#f6fafe]',
      )}
    >
      <div className="flex min-h-screen">
        {!homeStitch ? (
          <div className="hidden md:block">
            <ClienteSidebar className="fixed left-0 top-0 z-30" />
          </div>
        ) : null}
        <div
          className={cn(
            'flex min-h-screen flex-1 flex-col',
            !homeStitch && 'md:pl-[4.5rem]',
          )}
        >
          {!homeStitch ? <ClienteHeader /> : null}
          <main
            className={cn(
              'min-h-0 flex-1',
              homeStitch ? 'p-0' : 'px-4 py-6 md:px-8 md:py-8',
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

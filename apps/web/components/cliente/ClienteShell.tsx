'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ClienteSidebar } from '@/components/cliente/ClienteSidebar';
import { ClienteHeader } from '@/components/cliente/ClienteHeader';

export function ClienteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const dashboardBauhaus = pathname === '/cliente/dashboard';

  return (
    <div className="min-h-screen bg-[#f6fafe] text-slate-900">
      <div className="flex min-h-screen">
        <div className="hidden md:block">
          <ClienteSidebar className="fixed left-0 top-0 z-30" />
        </div>
        <div className="flex min-h-screen flex-1 flex-col md:pl-[4.5rem]">
          <div className={cn(dashboardBauhaus && 'lg:hidden')}>
            <ClienteHeader />
          </div>
          <main
            className={cn(
              'min-h-0 flex-1 px-4 py-6 md:px-8 md:py-8',
              dashboardBauhaus && 'flex flex-col py-0 lg:px-0 lg:py-0'
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

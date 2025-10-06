import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

type RootLayoutProps = {
  children: ReactNode;
};

export const metadata: Metadata = {
  title: 'GROWS - Panel de Socio',
  description: 'Plataforma de gestión inteligente para la construcción',
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang='es' className='light'>
      <body className='bg-[#f7f6fb] dark:bg-[#151323] text-[#1d1b29] dark:text-[#f5f3fc] transition-colors duration-500'>
        <ThemeProvider>
          <main className='min-h-screen'>{children}</main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

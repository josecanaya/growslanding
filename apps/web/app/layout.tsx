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
    <html lang='es'>
      <body className='bg-gray-50 text-gray-800'>
        <ThemeProvider>
          <main className='min-h-screen'>{children}</main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

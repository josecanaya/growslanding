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
      <body 
        className='dark:text-secundario transition-all duration-300 ease-in-out'
        style={{
          backgroundColor: '#eaf0f6',
          color: '#10161a'
        }}
      >
        <ThemeProvider>
          <main className='min-h-screen'>{children}</main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

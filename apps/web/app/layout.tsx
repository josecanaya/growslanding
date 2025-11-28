import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import DevBanner from '@/components/DevBanner';
import DevToolsPanel from '@/components/DevToolsPanel';
import { DevModeProvider } from '@/lib/dev-mode-context';
import { SubscriptionProvider } from '@/lib/subscriptions/subscription-context';
import { UpgradeModalProvider } from '@/components/subscriptions/UpgradeModal';
import './globals.css';

type RootLayoutProps = {
  children: ReactNode;
};

export const metadata: Metadata = {
  title: 'GROWS - Panel de Socio',
  description: 'Plataforma de gestion inteligente para la construccion',
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang='es' className='light'>
      <body 
        className='bg-grows-background text-grows-text-primary transition-all duration-300 ease-in-out'
        style={{
          backgroundColor: '#F5F7F5', // grows-background
          color: '#1A1A1A' // grows-text-primary
        }}
      >
        <DevModeProvider>
          <SubscriptionProvider>
            <UpgradeModalProvider>
              <ThemeProvider>
                <main className='min-h-screen'>{children}</main>
                <DevBanner />
                <DevToolsPanel />
                <Toaster />
                {/* Audio global para notificaciones - El fallback a beep generado maneja el 404 */}
                <audio
                  id="grows-notification-sound"
                  src="/sounds/notification.mp3"
                  preload="none"
                  suppressHydrationWarning
                />
              </ThemeProvider>
            </UpgradeModalProvider>
          </SubscriptionProvider>
        </DevModeProvider>
      </body>
    </html>
  );
}

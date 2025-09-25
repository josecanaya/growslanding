import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";

import type { Database } from "@/lib/types/supabase.gen";

import "./globals.css";

type RootLayoutProps = {
  children: ReactNode;
};

export const metadata: Metadata = {
  title: "grows",
  description: "Monorepo web app bootstrap with Next.js 15"
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const supabase = createServerComponentClient<Database>({ cookies });
  const {
    data: { session }
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  const userLabel =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email ??
    "Perfil";

  return (
    <html lang="es">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-border bg-card/60 backdrop-blur">
            <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
              <span className="text-sm font-semibold uppercase tracking-wide">Grows</span>
              <div className="flex items-center gap-4 text-sm">
                <a className="text-muted-foreground transition hover:text-foreground" href="/">
                  Inicio
                </a>
                <a className="text-muted-foreground transition hover:text-foreground" href="/dashboard">
                  Cliente Técnico
                </a>
                <a className="text-muted-foreground transition hover:text-foreground" href="/lider">
                  Líder de cuadrilla
                </a>
                {user ? (
                  <div className="flex items-center gap-3">
                    <span className="hidden text-xs text-muted-foreground sm:inline">{userLabel}</span>
                    <form action="/auth/signout?redirect=/" method="post">
                      <button className="rounded border border-border px-3 py-1 text-xs font-medium transition hover:bg-muted" type="submit">
                        Cerrar sesión
                      </button>
                    </form>
                  </div>
                ) : (
                  <a
                    className="rounded bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
                    href="/auth/login"
                  >
                    Ingresar
                  </a>
                )}
              </div>
            </nav>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}

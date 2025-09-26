import Link from "next/link";
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
  title: "GROWS - Panel de Socio",
  description: "Plataforma de gestión inteligente para la construcción"
};

export default async function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-secundario text-oscuro antialiased">
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  );
}

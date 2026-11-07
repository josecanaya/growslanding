import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Briefcase, FolderPlus } from 'lucide-react';
import type { Route } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { normalizeRole } from '@/lib/roles';

const sectors = [
  {
    id: 'trabajo',
    title: 'Buscar trabajo',
    description: 'Encontrá oportunidades de obra y postulate como socio.',
    path: '/socio/oportunidades',
    role: 'SOCIO',
  },
  {
    id: 'proyecto',
    title: 'Crear un proyecto',
    description: 'Sumá una obra a Grows y empezá a organizarla.',
    path: '/cliente/proyectos/nuevo',
    role: 'CLIENTE_TECNICO',
  },
] as const;

export default async function GrowsFeed({
  searchParams,
}: {
  searchParams: Promise<{ sector?: string }>;
}) {
  const { sector: intent } = await searchParams;
  const selected = sectors.find((sector) => sector.id === intent);
  const cookieStore = await cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore as any });
  const { data: { user } } = await supabase.auth.getUser();
  const role = normalizeRole(user?.app_metadata?.role ?? user?.user_metadata?.role);

  if (user && selected) {
    if (!role) {
      redirect(`/auth/select-role?redirect=${encodeURIComponent(`/inversores?sector=${selected.id}`)}`);
    }
    if (role === selected.role || role === 'ADMIN') {
      redirect(selected.path);
    }
  }

  return (
    <main id="feed" className="min-h-screen bg-[#FBFBF9] text-[#15161A]">
      <header className="border-b border-[#E4E3DE] bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2.5 px-6">
          <Image src="/grows-icon.svg" alt="" width={28} height={28} />
          <span className="text-lg font-semibold tracking-tight">Grows</span>
        </div>
      </header>
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-12 sm:py-20">
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Grows para todos</h1>
          <p className="text-lg text-[#55565C]">
            Encontrá trabajo en obra o empezá tu propio proyecto.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {sectors.map((sector) => {
            const Icon = sector.id === 'trabajo' ? Briefcase : FolderPlus;
            const destination = `/inversores?sector=${sector.id}`;
            const allowed = role === sector.role || role === 'ADMIN';
            const href = !user
              ? `/auth/login?redirect=${encodeURIComponent(destination)}`
              : allowed ? sector.path : destination;

            return (
              <section key={sector.id} className="flex flex-col items-start gap-4 rounded-2xl border border-[#E4E3DE] bg-white p-6">
                <span className="rounded-xl bg-[#EDF1F7] p-3 text-[#215AC2]">
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </span>
                <h2 className="text-xl font-semibold">{sector.title}</h2>
                <p className="text-[#55565C]">{sector.description}</p>
                {user && role && !allowed ? (
                  <p className="text-sm text-[#55565C]">
                    Este sector requiere un perfil de {sector.role === 'SOCIO' ? 'socio' : 'cliente técnico'}.
                  </p>
                ) : (
                  <Link href={href as Route} className="mt-auto inline-flex items-center gap-2 rounded-lg bg-[#215AC2] px-4 py-2 font-medium text-white transition hover:bg-[#194A9F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#276EF1]">
                    {sector.title}
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </Link>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}

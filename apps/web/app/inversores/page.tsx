import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Briefcase, FolderPlus } from 'lucide-react';
import type { Route } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { normalizeRole } from '@/lib/roles';

const previewProjects = [
  { id: 'olivos', name: 'Olivos 12', city: 'Fisherton, Rosario', stage: 'Proyecto ejecutivo' },
  { id: 'patio', name: 'Casa Patio', city: 'Funes, Santa Fe', stage: 'Fundaciones' },
  { id: 'ribera', name: 'Ribera Residencias', city: 'Pueblo Esther, Santa Fe', stage: 'Estructura' },
];

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
  searchParams: Promise<{ sector?: string; obra?: string; vista?: string }>;
}) {
  const { sector: intent, obra, vista } = await searchParams;
  const project = previewProjects.find((item) => item.id === obra);
  const selected = sectors.find((sector) => sector.id === intent);
  const cookieStore = await cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore as any });
  const { data: { user } } = await supabase.auth.getUser();
  const role = normalizeRole(user?.app_metadata?.role ?? user?.user_metadata?.role);

  if (user && selected) {
    if (!role) {
      redirect(`/auth/select-role?redirect=${encodeURIComponent(`/inversores?sector=${selected.id}`)}`);
    }
    if (!project && (role === selected.role || role === 'ADMIN')) {
      redirect(selected.path);
    }
  }

  const loginReturn = project && !selected ? '/inversores?obra=' + project.id : selected ? `/inversores?sector=${selected.id}` : '/inversores';
  const loginHref = `/auth/login?redirect=${encodeURIComponent(loginReturn)}` as Route;

  return (
    <main id="feed" className="min-h-screen bg-[#FBFBF9] text-[#15161A]">
      <header className="border-b border-[#E4E3DE] bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2.5 px-6">
          <Image src="/grows-icon.svg" alt="" width={28} height={28} />
          <span className="text-lg font-semibold tracking-tight">Grows</span>
          {!user && (
            <Link href={loginHref} prefetch={false} className="ml-auto rounded-lg bg-[#215AC2] px-4 py-2 text-sm font-medium text-white hover:bg-[#194A9F]">
              Ingresar
            </Link>
          )}
        </div>
      </header>
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-12 sm:py-20">
        <div className="space-y-3">
          {project && <Link href="/inversores" className="text-sm font-medium text-[#215AC2]">← Volver al feed</Link>}
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{project?.name ?? 'Grows para todos'}</h1>
          <p className="text-lg text-[#55565C]">
            {project ? ${project.city} ·  · Obra de demostración : 'Encontrá trabajo en obra o empezá tu propio proyecto.'}
          </p>
        </div>
        {project ? (
          <section aria-label="Vistas de la obra" className="space-y-4 rounded-2xl border border-[#E4E3DE] bg-white p-6">
            <nav className="flex flex-wrap gap-4 text-sm font-medium text-[#215AC2]">
              <Link href={`/inversores?obra=${project.id}&vista=contratista` as Route}>Contratista</Link>
              <Link href={`/inversores?obra=${project.id}&vista=arquitecto` as Route}>Arquitecto</Link>
              <a href={`/inversores/index.html#project/${project.id}`}>Inversor</a>
            </nav>
            {vista === 'arquitecto' ? (
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Planificación y presupuestos</h2>
                <p>Organizá los trabajos por etapas y revisá las cotizaciones desde tu espacio de proyectos.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Trabajo y seguimiento de obra</h2>
                <p>Consultá el alcance, los plazos y el estado de los trabajos desde tu espacio de contratista.</p>
              </div>
            )}
          </section>
        ) : (
          <section aria-labelledby="obras" className="space-y-4">
            <h2 id="obras" className="text-xl font-semibold">Explorá obras</h2>
            <p className="text-sm text-[#55565C]">Obras de demostración.</p>
            <div className="grid gap-4 sm:grid-cols-3">
              {previewProjects.map((item) => (
                <Link key={item.id} href={`/inversores?obra=${item.id}` as Route} className="rounded-2xl border border-[#E4E3DE] bg-white p-5 hover:border-[#215AC2]">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="text-sm text-[#55565C]">{item.city} · {item.stage}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {sectors.filter((sector) => !project || sector.id === (vista === 'arquitecto' ? 'proyecto' : 'trabajo')).map((sector) => {
            const Icon = sector.id === 'trabajo' ? Briefcase : FolderPlus;
            const destination = project ? `/inversores?sector=${sector.id}&obra=${project.id}&vista=${vista === "arquitecto" ? "arquitecto" : "contratista"}` : `/inversores?sector=${sector.id}`;
            const allowed = role === sector.role || role === 'ADMIN';
            const needsLogin = !user && selected?.id === sector.id;
            const href = needsLogin ? `/auth/login?redirect=${encodeURIComponent(destination)}` : allowed ? sector.path : destination;

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
                  <Link href={href as Route} prefetch={false} className="mt-auto inline-flex items-center gap-2 rounded-lg bg-[#215AC2] px-4 py-2 font-medium text-white transition hover:bg-[#194A9F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#276EF1]">
                    {needsLogin ? 'Ingresar para continuar' : sector.title}
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

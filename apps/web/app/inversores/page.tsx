import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { loadPublicFeed, loadPublicObra } from '@/lib/obras/public-feed';
import { getSessionUser } from '@/lib/auth/session-user';
import { accountRole } from '@/lib/obras/feed-profile';
import GrowsFeed from '@/components/grows/GrowsFeed';
import WorksMap from '@/components/grows/WorksMap';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Grows · Obras, trabajo y proyectos', description: 'Explorá obras y participá desde tu espacio de arquitecto, contratista o inversor.' };

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ obra?: string; mapa?: string }> }) {
  const { obra, mapa } = await searchParams;
  const [result, user] = await Promise.all([loadPublicFeed(), mapa === '1' ? null : getSessionUser().catch(() => null)]);
  if (obra && /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(obra) && !result.projects.some((item) => item.id === obra)) {
    try {
      const project = await loadPublicObra(obra);
      if (project) result.projects.unshift(project);
    } catch { result.unavailable = true; }
  }
  if (mapa === '1') {
    const works = result.projects.map(({ id, title, location, mapPoint }) => ({ id, title, location, mapPoint }));
    return (
      <main className="min-h-screen bg-[#f5f6f1] px-4 py-6 text-[#20382f] sm:px-8">
        <div className="mx-auto max-w-[1360px]">
          <Link href="/inversores" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold"><ArrowLeft size={16} /> Volver al feed</Link>
          <h1 className="mb-5 text-3xl font-semibold tracking-tight">Mapa de obras</h1>
          {result.unavailable && <p role="status" className="mb-4 text-sm">No pudimos cargar las publicaciones. Volvé a intentar.</p>}
          <WorksMap works={works} initialWorkId={obra} />
        </div>
      </main>
    );
  }
  const account = user ? { role: accountRole(user) } : null;
  const projects = result.projects.map((work) => ({
    ...work,
    investorNotes: account?.role === 'inversor' ? work.investorNotes : '',
    contractorNotes: account?.role === 'contratista' ? work.contractorNotes : '',
  }));
  return (
    <GrowsFeed
      projects={projects}
      project={projects.find((item) => item.id === obra)}
      unavailable={result.unavailable}
      requestedObra={Boolean(obra)}
      account={account}
    />
  );
}

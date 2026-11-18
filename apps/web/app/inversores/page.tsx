import type { Metadata } from 'next';
import { loadPublicFeed, loadPublicObra } from '@/lib/obras/public-feed';
import { getSessionUser } from '@/lib/auth/session-user';
import { accountRole } from '@/lib/obras/feed-profile';
import GrowsFeed from '@/components/grows/GrowsFeed';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Grows · Obras, trabajo y proyectos', description: 'Explorá obras y participá desde tu espacio de arquitecto, contratista o inversor.' };

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ obra?: string }> }) {
  const { obra } = await searchParams;
  const [result, user] = await Promise.all([loadPublicFeed(), getSessionUser().catch(() => null)]);
  if (obra && /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(obra) && !result.projects.some((item) => item.id === obra)) {
    try {
      const project = await loadPublicObra(obra);
      if (project) result.projects.unshift(project);
    } catch { result.unavailable = true; }
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

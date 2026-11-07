import type { Metadata } from 'next';
import { loadPublicFeed, loadPublicObra } from '@/lib/obras/public-feed';
import GrowsFeed from '@/components/grows/GrowsFeed';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Grows · Obras, trabajo y proyectos', description: 'Explorá obras y participá desde tu espacio de arquitecto, contratista o inversor.' };

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ obra?: string }> }) {
  const { obra } = await searchParams;
  const result = await loadPublicFeed();
  if (obra && /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(obra) && !result.projects.some((item) => item.id === obra)) {
    try {
      const project = await loadPublicObra(obra);
      if (project) result.projects.unshift(project);
    } catch { result.unavailable = true; }
  }
  return <GrowsFeed projects={result.projects} unavailable={result.unavailable} />;
}

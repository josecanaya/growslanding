import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session-user';
import { accountRole } from '@/lib/obras/feed-profile';
import { loadPublicObra } from '@/lib/obras/public-feed';
import { applySocialAction, authorName, loadSocial, socialActionSchema } from '@/lib/obras/social';

export const dynamic = 'force-dynamic';
const uuid = /^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuid.test(id)) return NextResponse.json({ error: 'Obra inválida.' }, { status: 400 });
  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ error: 'Iniciá sesión para participar.' }, { status: 401 });
  const parsed = socialActionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Revisá lo que escribiste.' }, { status: 400 });
  try {
    if (!(await loadPublicObra(id))) return NextResponse.json({ error: 'Esta obra no está publicada.' }, { status: 404 });
    const role = accountRole(user);
    const comment = await applySocialAction(id, { id: user.id, name: authorName(user), role }, parsed.data);
    const social = (await loadSocial([id], user.id))?.[id] ?? null;
    return NextResponse.json({ social, comment }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ error: 'No pudimos guardar. Probá de nuevo.' }, { status: 503 });
  }
}

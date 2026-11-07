import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session-user';
import { activateProfile } from '@/lib/auth/activate-profile';

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (body?.userId && body.userId !== user.id) {
    return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
  }
  try {
    const data = await activateProfile(user, 'CLIENTE_TECNICO');
    return NextResponse.json({ success: true, data: { orgId: data.orgId, userId: user.id } });
  } catch {
    return NextResponse.json({ success: false, error: 'No se pudo habilitar tu espacio de proyectos.' }, { status: 503 });
  }
}

import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session-user';
import { activateProfile } from '@/lib/auth/activate-profile';

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Iniciá sesión para continuar.' }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || !['SOCIO', 'CLIENTE_TECNICO'].includes(body.role) || (body.user_id && body.user_id !== user.id)) {
    return NextResponse.json({ error: 'Perfil inválido.' }, { status: 400 });
  }
  try {
    const profile = await activateProfile(user, body.role);
    return NextResponse.json({ success: true, ...profile });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'No se pudo habilitar el perfil.' }, { status: 503 });
  }
}

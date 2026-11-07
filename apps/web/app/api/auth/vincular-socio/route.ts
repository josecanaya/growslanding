import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session-user';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { activateProfile } from '@/lib/auth/activate-profile';

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (body?.userId && body.userId !== user.id) return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 403 });
  try {
    await activateProfile(user, 'SOCIO');
    const db = createServiceSupabaseClient();
    const { data, error } = await db.from('socios').select('id, nombre').eq('user_id', user.id).order('created_at').limit(1).maybeSingle();
    if (error) throw error;
    return NextResponse.json({ success: true, data: data ? { socioId: data.id, nombre: data.nombre } : null });
  } catch {
    return NextResponse.json({ success: false, error: 'No se pudo habilitar el perfil de contratista.' }, { status: 503 });
  }
}

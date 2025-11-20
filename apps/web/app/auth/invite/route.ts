import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const inviteId = url.searchParams.get('invite');
  const token = url.searchParams.get('token');
  const target = url.searchParams.get('target') ?? '/socio';

  const redirectToTarget = () => NextResponse.redirect(new URL(target, url.origin));
  const redirectToLogin = () => NextResponse.redirect(new URL('/auth/login', url.origin));

  if (!inviteId || !token) {
    return redirectToLogin();
  }

  const serviceClient = createServiceSupabaseClient();
  const { data: invite, error: inviteError } = await serviceClient
    .from('leader_invites')
    .select('id, org_id, email, nombre, rol, status, token')
    .eq('id', inviteId)
    .maybeSingle();

  if (inviteError || !invite || invite.token !== token) {
    return redirectToLogin();
  }

  if (!code) {
    const { data: linkData, error: linkError } = await serviceClient.auth.admin.generateLink({
      type: 'magiclink',
      email: invite.email,
      options: {
        redirectTo: url.toString(),
      },
    });

    const actionLink =
      (linkData as any)?.action_link ?? (linkData as any)?.properties?.action_link;

    if (linkError || !actionLink) {
      return redirectToLogin();
    }

    return NextResponse.redirect(actionLink);
  }

  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
  const { data: { user } } = await supabase.auth.exchangeCodeForSession(code);

  if (!user) {
    return redirectToLogin();
  }

  if (invite.status !== 'accepted') {
    await serviceClient
      .from('leader_invites')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', invite.id);
  }

  // Buscar o crear socio y vincular user_id
  const { data: existingSocio } = await serviceClient
    .from('socios')
    .select('id, status, user_id')
    .eq('org_id', invite.org_id)
    .eq('contacto', invite.email)
    .maybeSingle();

  if (!existingSocio) {
    // Crear nuevo socio con user_id vinculado
    const datosInsert: any = {
      org_id: invite.org_id,
      nombre: invite.nombre,
      contacto: invite.email,
      rol: invite.rol,
      status: 'activo',
    };

    // Intentar agregar user_id si el campo existe
    try {
      datosInsert.user_id = user.id;
      datosInsert.email = invite.email;
    } catch (e) {
      // Si el campo no existe, continuar sin él
      console.warn('[WARNING] Campo user_id no disponible en tabla socios');
    }

    await serviceClient.from('socios').insert(datosInsert);
  } else {
    // Actualizar socio existente: activar y vincular user_id si no está vinculado
    const updateData: any = {
      status: 'activo',
      nombre: invite.nombre,
    };

    // Vincular user_id si no está vinculado
    if (!existingSocio.user_id) {
      try {
        updateData.user_id = user.id;
        updateData.email = invite.email;
      } catch (e) {
        console.warn('[WARNING] No se pudo vincular user_id al socio');
      }
    }

    await serviceClient
      .from('socios')
      .update(updateData)
      .eq('id', existingSocio.id);
  }

  return redirectToTarget();
}

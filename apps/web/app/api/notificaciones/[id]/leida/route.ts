import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

type SupabaseRow = Record<string, unknown>;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;
    const usuarioId = request.headers.get('x-usuario-id');

    if (!usuarioId) {
      return NextResponse.json(
        { success: false, error: 'Falta x-usuario-id' },
        { status: 400 }
      );
    }

    // Primero verificar que la notificación existe y pertenece al usuario
    const { data: notificacion, error: fetchError } = await supabaseAny
      .from('notificaciones')
      .select('id, destinatario_id, leida')
      .eq('id', id)
      .single();

    if (fetchError || !notificacion) {
      return NextResponse.json(
        { success: false, error: 'Notificación no encontrada' },
        { status: 404 }
      );
    }

    // Validar que el usuario es el destinatario
    if (notificacion.destinatario_id !== usuarioId) {
      return NextResponse.json(
        { success: false, error: 'No tenés permiso para marcar esta notificación como leída' },
        { status: 403 }
      );
    }

    // Actualizar a leída
    const { error: updateError } = await supabaseAny
      .from('notificaciones')
      .update({ leida: true })
      .eq('id', id)
      .eq('destinatario_id', usuarioId);

    if (updateError) {
      console.error('[PATCH /api/notificaciones/[id]/leida] Error:', updateError);
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    // Obtener lista actualizada de notificaciones del usuario
    const orgId = request.headers.get('x-organizacion-id');
    if (orgId) {
      const { data: notificacionesActualizadas } = await supabaseAny
        .from('notificaciones')
        .select('*')
        .eq('org_id', orgId)
        .eq('destinatario_id', usuarioId)
        .order('created_at', { ascending: false });

      return NextResponse.json({
        success: true,
        id,
        data: notificacionesActualizadas || [],
      });
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('[PATCH /api/notificaciones/[id]/leida] Excepción:', error);
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Error interno' },
      { status: 500 },
    );
  }
}



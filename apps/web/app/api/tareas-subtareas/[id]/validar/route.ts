import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/lib/types/supabase.gen';
import { ClienteWalletService } from '@/lib/services/cliente-wallet.service';
import { PermisoService } from '@/lib/services/permiso.service';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { normalizeRole } from '@/lib/roles';
import {
  ESTADO_BLOQUE_FINAL,
  ESTADO_BLOQUE_PARA_VALIDAR,
  normalizeEstadoBloqueParaOperacion,
} from '@/lib/domain/estados-core';
import { SubtareaValidarService } from '@/lib/tareas/subtarea-validar.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const metodoPago: 'EFECTIVO' | 'ONLINE' | 'TARJETA' =
      body?.metodoPago === 'EFECTIVO'
        ? 'EFECTIVO'
        : body?.metodoPago === 'TARJETA'
          ? 'TARJETA'
          : 'ONLINE';
    const accion: 'validar' | 'rechazar' | 'validar_en_obra' =
      body?.accion === 'rechazar'
        ? 'rechazar'
        : body?.accion === 'validar_en_obra'
          ? 'validar_en_obra'
          : 'validar';
    const motivo: string | undefined = typeof body?.motivo === 'string' ? body.motivo : undefined;

    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({
      cookies: () => cookieStore as any,
    });

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 },
      );
    }

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { data: subtarea } = await supabaseAny
      .from('tareas_subtareas')
      .select('id, tarea_id, estado, validado_en_obra_at, tareas:tareas(org_id)')
      .eq('id', id)
      .maybeSingle();

    if (!subtarea) {
      return NextResponse.json(
        { success: false, error: 'Subtarea no encontrada' },
        { status: 404 },
      );
    }

    const orgId = String(subtarea.tareas?.org_id ?? '');
    const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>;
    const userMeta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const role = normalizeRole(appMeta.role ?? userMeta.role);

    const puedeValidar =
      role === 'ADMIN' ||
      (await PermisoService.puedeValidarBloquesComoCliente(user.id, orgId, user.email));

    if (!puedeValidar) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Solo el cliente técnico (dueño o líder de la organización) puede validar o rechazar bloques',
        },
        { status: 403 },
      );
    }

    const estadoNorm = normalizeEstadoBloqueParaOperacion(subtarea.estado);

    if (accion === 'validar_en_obra' && subtarea.validado_en_obra_at) {
      return NextResponse.json({ success: true, tareaValidada: false, validadoEnObra: true });
    }

    if (estadoNorm === ESTADO_BLOQUE_FINAL) {
      if (accion === 'validar') {
        const reconciliacion = await ClienteWalletService.reconciliarSubtareaValidada({
          subtareaId: id,
          clienteUserId: user.id,
          metodoPago,
        }).catch((err) => {
          console.warn('[VALIDAR_SUBTAREA] reconciliar bloque ya validado:', err);
          return null;
        });
        return NextResponse.json({ success: true, tareaValidada: true, reconciliacion });
      }
      return NextResponse.json({
        success: true,
        tareaValidada: true,
        validadoEnObra: Boolean(subtarea.validado_en_obra_at),
      });
    }

    if (estadoNorm !== ESTADO_BLOQUE_PARA_VALIDAR) {
      return NextResponse.json(
        { success: false, error: `El bloque debe estar en ${ESTADO_BLOQUE_PARA_VALIDAR}` },
        { status: 409 },
      );
    }

    const { tareaValidada, validadoEnObra, reconciliacion, walletWarning } =
      await SubtareaValidarService.ejecutar({
        subtareaId: id,
        actorUserId: user.id,
        accion,
        metodoPago,
        motivo,
      });

    return NextResponse.json({
      success: true,
      tareaValidada,
      validadoEnObra: validadoEnObra ?? false,
      reconciliacion: reconciliacion ?? undefined,
      walletWarning: walletWarning ?? undefined,
    });
  } catch (error) {
    console.error('[VALIDAR_SUBTAREA] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno',
      },
      { status: 500 },
    );
  }
}

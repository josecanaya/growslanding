import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { IS_DEV_MODE } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const schema = z.object({
  obra_id: z.string().uuid(),
  presupuestos: z.array(
    z.object({
      tarea_id: z.string().uuid(),
      dias_reales: z.number().nullable().optional(),
      monto: z.number().nullable().optional(),
      estado: z.enum(['PENDIENTE', 'ENVIADO']),
    })
  ).min(1),
});

/**
 * POST /api/socio/presupuestos/bulk
 * Guarda/actualiza múltiples presupuestos en lote
 */
export async function POST(request: NextRequest) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { message: 'Error al parsear el body' },
        { status: 400 }
      );
    }

    let payload;
    try {
      payload = schema.parse(body);
    } catch (e) {
      if (e instanceof z.ZodError) {
        return NextResponse.json(
          {
            message: 'Datos inválidos',
            details: e.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', '),
          },
          { status: 400 }
        );
      }
      throw e;
    }

    if (IS_DEV_MODE) {
      return NextResponse.json({
        ok: true,
        updated: payload.presupuestos.length,
        created: 0,
        devMode: true,
      });
    }

    // Autenticación
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const supabase = createServiceSupabaseClient();

    // Obtener socio_id del usuario autenticado
    const { data: socio, error: socioError } = await supabase
      .from('socios')
      .select('id, org_id, email')
      .eq('email', user.email)
      .maybeSingle();

    if (socioError || !socio) {
      console.error('[PRESUPUESTOS_BULK] Error obteniendo socio:', socioError);
      return NextResponse.json(
        { message: 'Socio no encontrado' },
        { status: 404 }
      );
    }

    const socioId = socio.id;
    const orgId = socio.org_id;

    // Validar que la obra pertenece a la misma org
    const { data: obra, error: obraError } = await supabase
      .from('obras')
      .select('id, org_id')
      .eq('id', payload.obra_id)
      .maybeSingle();

    if (obraError || !obra) {
      console.error('[PRESUPUESTOS_BULK] Error obteniendo obra:', obraError);
      return NextResponse.json(
        { message: 'Obra no encontrada' },
        { status: 404 }
      );
    }

    if (obra.org_id !== orgId) {
      return NextResponse.json(
        { message: 'No tienes acceso a esta obra' },
        { status: 403 }
      );
    }

    // Validar que todas las tareas pertenecen a la obra
    const tareaIds = payload.presupuestos.map(p => p.tarea_id);
    const { data: tareas, error: tareasError } = await supabase
      .from('tareas')
      .select('id, obra_id')
      .in('id', tareaIds);

    if (tareasError) {
      console.error('[PRESUPUESTOS_BULK] Error validando tareas:', tareasError);
      return NextResponse.json(
        { message: 'Error al validar tareas' },
        { status: 500 }
      );
    }

    const tareasInvalidas = (tareas || []).filter(t => t.obra_id !== payload.obra_id);
    if (tareasInvalidas.length > 0) {
      return NextResponse.json(
        { message: 'Algunas tareas no pertenecen a esta obra' },
        { status: 400 }
      );
    }

    // Procesar cada presupuesto
    let updated = 0;
    let created = 0;
    const errors: Array<{ tarea_id: string; error: string }> = [];
    const presupuestosEnviados: string[] = [];

    for (const presupuesto of payload.presupuestos) {
      try {
        // Preparar notas con dias_reales si existe
        let notas: string | null = null;
        if (presupuesto.dias_reales !== null && presupuesto.dias_reales !== undefined) {
          notas = JSON.stringify({ dias_reales: presupuesto.dias_reales });
        }

        // Buscar si ya existe
        const { data: existente, error: existenteError } = await supabase
          .from('tareas_presupuestos')
          .select('id')
          .eq('tarea_id', presupuesto.tarea_id)
          .eq('socio_id', socioId)
          .maybeSingle();

        if (existenteError && existenteError.code !== 'PGRST116') {
          // PGRST116 = no rows returned, que es válido
          throw existenteError;
        }

        if (existente) {
          // UPDATE
          const { error: updateError } = await supabase
            .from('tareas_presupuestos')
            .update({
              monto: presupuesto.monto ?? null,
              estado: presupuesto.estado,
              notas: notas,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existente.id);

          if (updateError) {
            throw updateError;
          }
          updated++;
        } else {
          // INSERT
          const { error: insertError } = await supabase
            .from('tareas_presupuestos')
            .insert({
              tarea_id: presupuesto.tarea_id,
              socio_id: socioId,
              monto: presupuesto.monto ?? null,
              moneda: 'ARS',
              estado: presupuesto.estado,
              notas: notas,
            });

          if (insertError) {
            throw insertError;
          }
          created++;
        }

        // Si el estado es ENVIADO, agregar a la lista para notificación
        if (presupuesto.estado === 'ENVIADO') {
          presupuestosEnviados.push(presupuesto.tarea_id);
        }
      } catch (error) {
        console.error(`[PRESUPUESTOS_BULK] Error procesando presupuesto ${presupuesto.tarea_id}:`, error);
        errors.push({
          tarea_id: presupuesto.tarea_id,
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    }

    // Si hay presupuestos enviados, crear notificación
    // Notificación Supabase: usamos siempre remitente_id + destinatario_id (no usar socio_id ni user_id_destinatario)
    if (presupuestosEnviados.length > 0) {
      try {
        // Obtener el cliente técnico de la organización desde la tabla orgs
        const { data: orgData, error: orgError } = await supabase
          .from('orgs')
          .select('owner_user_id')
          .eq('id', orgId)
          .maybeSingle();

        if (orgError || !orgData?.owner_user_id) {
          console.warn('[PRESUPUESTOS_BULK] No se encontró owner_user_id para la organización, no se creará notificación', orgError);
        } else {
          await (supabase as any)
            .from('notificaciones')
            .insert({
              org_id: orgId,
              remitente_id: socio.id,                       // socio que envía
              destinatario_id: orgData.owner_user_id,       // cliente técnico que recibe
              obra_id: payload.obra_id,
              tarea_id: null,
              titulo: 'Nuevo presupuesto recibido',
              mensaje: `El socio ${socio.email || 'socio'} envió ${presupuestosEnviados.length} presupuesto(s) para la obra`,
              tipo: 'presupuesto',
              leida: false,
              created_at: new Date().toISOString(),
            });
        }
      } catch (notifError) {
        console.error('[PRESUPUESTOS_BULK] Error creando notificación:', notifError);
        // No fallar la operación si falla la notificación
      }
    }

    return NextResponse.json({
      ok: true,
      updated,
      created,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[PRESUPUESTOS_BULK] Error:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { socioPuedeAccederDatosObra } from '@/lib/socios/agenda-access';
import { resolveSocioRecordForAuthUser } from '@/lib/socios/resolveSocioForAuthUser';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const schema = z.object({
  obra_id: z.string().uuid(),
  presupuestos: z.array(
    z.object({
      tarea_id: z.string().uuid(),
      dias_reales: z.number().nullable().optional(),
      monto: z.number().nullable().optional(),
      /** Texto libre guardado en `tareas_presupuestos.notas` (JSON) */
      observacion: z.string().max(4000).nullable().optional(),
      estado: z.enum(['PENDIENTE', 'ENVIADO', 'APROBADO']),
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

    // Autenticación
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user || !user.id) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const supabase = createServiceSupabaseClient();

    const socio = await resolveSocioRecordForAuthUser(supabase, {
      id: user.id,
      email: user.email ?? null,
    });

    if (!socio) {
      console.error('[PRESUPUESTOS_BULK] Socio no encontrado');
      return NextResponse.json(
        { message: 'Socio no encontrado' },
        { status: 404 }
      );
    }

    const socioId = socio.id;

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

    if (!obra.org_id) {
      return NextResponse.json(
        { message: 'Obra sin organización asociada' },
        { status: 400 }
      );
    }

    const orgId = obra.org_id;

    const puede = await socioPuedeAccederDatosObra(supabase, socioId, {
      id: obra.id,
      org_id: obra.org_id as string,
    });
    if (!puede) {
      return NextResponse.json(
        { message: 'No tienes acceso a esta obra' },
        { status: 403 }
      );
    }

    // Validar que todas las tareas pertenecen a la obra (por lotes: .in muy grande falla en PostgREST)
    const tareaIds = [...new Set(payload.presupuestos.map((p) => p.tarea_id))];
    const tareasById = new Map<string, { id: string; obra_id: string }>();
    const IN_CHUNK = 80;
    for (let i = 0; i < tareaIds.length; i += IN_CHUNK) {
      const chunk = tareaIds.slice(i, i + IN_CHUNK);
      const { data: tareasChunk, error: tareasError } = await supabase
        .from('tareas')
        .select('id, obra_id')
        .in('id', chunk);

      if (tareasError) {
        console.error('[PRESUPUESTOS_BULK] Error validando tareas:', tareasError);
        return NextResponse.json(
          { message: 'Error al validar tareas' },
          { status: 500 }
        );
      }
      for (const t of tareasChunk ?? []) {
        tareasById.set(t.id, t);
      }
    }

    const tareasInvalidas = tareaIds.filter((id) => {
      const t = tareasById.get(id);
      return !t || t.obra_id !== payload.obra_id;
    });
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
        // Buscar si ya existe
        const { data: existente, error: existenteError } = await supabase
          .from('tareas_presupuestos')
          .select('id, notas')
          .eq('tarea_id', presupuesto.tarea_id)
          .eq('socio_id', socioId)
          .maybeSingle();

        if (existenteError && existenteError.code !== 'PGRST116') {
          // PGRST116 = no rows returned, que es válido
          throw existenteError;
        }

        const baseNotas: Record<string, unknown> = {};
        if (existente?.notas) {
          try {
            const parsed = JSON.parse(String(existente.notas));
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              Object.assign(baseNotas, parsed);
            }
          } catch {
            /* ignorar notas no JSON */
          }
        }

        if (presupuesto.dias_reales !== null && presupuesto.dias_reales !== undefined) {
          baseNotas.dias_reales = presupuesto.dias_reales;
        }

        if (presupuesto.observacion !== undefined) {
          const o = presupuesto.observacion?.trim() ?? '';
          if (o) {
            baseNotas.observacion = o;
          } else {
            delete baseNotas.observacion;
          }
        }

        const notasMerged =
          Object.keys(baseNotas).length > 0 ? JSON.stringify(baseNotas) : undefined;

        if (existente) {
          const patch: Record<string, unknown> = {
            estado: presupuesto.estado,
            updated_at: new Date().toISOString(),
          };
          if (presupuesto.monto !== null && presupuesto.monto !== undefined) {
            patch.monto = presupuesto.monto;
          }
          if (notasMerged !== undefined) {
            patch.notas = notasMerged;
          }
          const { error: updateError } = await supabase
            .from('tareas_presupuestos')
            .update(patch)
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
              monto: presupuesto.monto ?? 0,
              moneda: 'ARS',
              estado: presupuesto.estado,
              notas: notasMerged ?? null,
            } as any);

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
          .from('organizations')
          .select('user_id')
          .eq('id', orgId)
          .maybeSingle();

        // Type assertion: orgData has user_id field
        const ownerUserId = (orgData as { user_id: string | null } | null)?.user_id;

        if (orgError || !ownerUserId) {
          console.warn('[PRESUPUESTOS_BULK] No se encontró user_id para la organización, no se creará notificación', orgError);
        } else {
          const fullRow = {
            org_id: orgId,
            remitente_id: user.id,
            destinatario_id: ownerUserId,
            socio_id: socio.id,
            obra_id: payload.obra_id,
            tarea_id: null,
            titulo: 'Nuevo presupuesto recibido',
            mensaje: `El socio ${socio.email || socio.nombre || 'socio'} envió ${presupuestosEnviados.length} presupuesto(s) para la obra`,
            tipo: 'presupuesto',
            leida: false,
            created_at: new Date().toISOString(),
          };
          let { error: insErr } = await (supabase as any).from('notificaciones').insert(fullRow);
          if (
            insErr &&
            (insErr.code === '42703' ||
              String(insErr.message).includes('destinatario_id') ||
              String(insErr.message).includes('remitente_id'))
          ) {
            const legacyRow = {
              org_id: orgId,
              socio_id: socio.id,
              obra_id: payload.obra_id,
              tarea_id: null,
              titulo: 'Nuevo presupuesto recibido',
              mensaje: `El socio ${socio.email || socio.nombre || 'socio'} envió ${presupuestosEnviados.length} presupuesto(s) para la obra`,
              tipo: 'presupuesto',
              leida: false,
              created_at: new Date().toISOString(),
            };
            insErr = (await (supabase as any).from('notificaciones').insert(legacyRow)).error;
          }
          if (insErr) {
            console.error('[PRESUPUESTOS_BULK] Error insertando notificación:', insErr);
          }
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


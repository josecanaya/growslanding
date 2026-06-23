import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
// No usar resolveOrgContext - obtener org_id directamente de la obra
import type { Database } from '@/lib/types/supabase.gen';
import { socioEsContactoDeOrg } from '@/lib/socios/agenda-access';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const schema = z.object({
  etapa: z.string(),
  tareaIds: z.array(z.string().uuid()).min(1),
  socioId: z.string().uuid().optional(),
  socioIds: z.array(z.string().uuid()).min(1).optional(),
  notas: z.string().optional(),
  bloques: z.number().int().min(1).max(365).optional(),
}).refine((v) => Boolean(v.socioId) || (v.socioIds && v.socioIds.length > 0), {
  message: 'Indicá socioId o socioIds',
  path: ['socioIds'],
});

/**
 * POST /api/obras/[id]/solicitar-presupuesto
 * Crea solicitudes de presupuesto para tareas seleccionadas
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: obraId } = await params;
    console.log('[SOLICITAR_PRESUPUESTO] Iniciando request para obra:', obraId);
    
    let body: any;
    try {
      body = await request.json();
      console.log('[SOLICITAR_PRESUPUESTO] Body recibido:', body);
    } catch (e) {
      console.error('[SOLICITAR_PRESUPUESTO] Error parseando body:', e);
      return NextResponse.json({ message: 'Error al parsear el body de la solicitud' }, { status: 400 });
    }
    
    let payload;
    try {
      payload = schema.parse(body);
      console.log('[SOLICITAR_PRESUPUESTO] Payload validado:', payload);
    } catch (e) {
      if (e instanceof z.ZodError) {
        console.error('[SOLICITAR_PRESUPUESTO] Error de validación:', e.errors);
        return NextResponse.json({ 
          message: 'Datos inválidos',
          details: e.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
        }, { status: 400 });
      }
      throw e;
    }

    // Autenticación
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const supabase = createServiceSupabaseClient();

    // Obtener la obra y su org_id directamente
    const { data: obra, error: obraError } = await supabase
      .from('obras')
      .select('id, org_id')
      .eq('id', obraId)
      .maybeSingle();

    if (obraError || !obra) {
      console.error('[SOLICITAR_PRESUPUESTO] Error obteniendo obra:', obraError);
      return NextResponse.json({ message: 'Obra no encontrada' }, { status: 404 });
    }

    if (!obra.org_id) {
      return NextResponse.json({ message: 'La obra no tiene organización asociada' }, { status: 400 });
    }

    const orgId = obra.org_id;

    const socioIdsList = [
      ...new Set(
        (payload.socioIds?.length
          ? payload.socioIds
          : payload.socioId
            ? [payload.socioId]
            : []
        ).map((id) => id.trim()),
      ),
    ];

    if (socioIdsList.length === 0) {
      return NextResponse.json({ message: 'Indicá al menos un socio' }, { status: 400 });
    }

    // Validar que las tareas pertenecen a la obra
    const { data: tareas, error: tareasError } = await supabase
      .from('tareas')
      .select('id, obra_id')
      .eq('obra_id', obraId)
      .in('id', payload.tareaIds);

    if (tareasError) {
      console.error('[SOLICITAR_PRESUPUESTO] Error validando tareas:', tareasError);
      return NextResponse.json({ message: 'Error al validar tareas' }, { status: 500 });
    }

    if (!tareas || tareas.length !== payload.tareaIds.length) {
      return NextResponse.json(
        { message: 'Algunas tareas no pertenecen a esta obra' },
        { status: 400 }
      );
    }

    if (payload.bloques && payload.bloques > 0) {
      const { error: bloquesError } = await supabase
        .from('tareas')
        .update({ bloques_planificados: payload.bloques })
        .in('id', payload.tareaIds);

      if (bloquesError) {
        console.warn('[SOLICITAR_PRESUPUESTO] Error actualizando bloques planificados:', bloquesError);
      }
    }

    const { data: tareasConElementos, error: errorTareasConElementos } = await supabase
      .from('tareas')
      .select(`
        id,
        elemento_id,
        elementos:elemento_id (
          id,
          cantidad,
          unidad
        )
      `)
      .in('id', payload.tareaIds);

    if (errorTareasConElementos) {
      console.warn('[SOLICITAR_PRESUPUESTO] Error obteniendo elementos de tareas:', errorTareasConElementos);
    }

    const cantidadUnidadMap = new Map<string, { cantidad: unknown; unidad: unknown }>();
    if (tareasConElementos) {
      tareasConElementos.forEach((t: any) => {
        if (t.elementos && (Array.isArray(t.elementos) ? t.elementos[0] : t.elementos)) {
          const elemento = Array.isArray(t.elementos) ? t.elementos[0] : t.elementos;
          cantidadUnidadMap.set(t.id, {
            cantidad: elemento.cantidad,
            unidad: elemento.unidad,
          });
        }
      });
    }

    let totalCreated = 0;
    let totalSkipped = 0;
    const erroresSocio: string[] = [];

    for (const socioId of socioIdsList) {
      const { data: socio, error: socioError } = await supabase
        .from('socios')
        .select('id, org_id, nombre, estado')
        .eq('id', socioId)
        .maybeSingle();

      if (socioError || !socio) {
        erroresSocio.push(`Socio ${socioId}: no encontrado`);
        continue;
      }

      const esContacto = await socioEsContactoDeOrg(supabase, socioId, orgId);
      if (!esContacto) {
        erroresSocio.push(
          `${socio.nombre ?? socioId}: agendalo primero en tu agenda de contactos.`,
        );
        continue;
      }

      if (socio.estado === 'inactivo') {
        erroresSocio.push(`${socio.nombre ?? socioId}: inactivo`);
        continue;
      }

      if (socio.estado && !['activo', 'pendiente'].includes(socio.estado)) {
        erroresSocio.push(`${socio.nombre ?? socioId}: estado no válido (${socio.estado})`);
        continue;
      }

      const { data: existentes, error: existentesError } = await supabase
        .from('tareas_presupuestos')
        .select('tarea_id, socio_id, estado')
        .in('tarea_id', payload.tareaIds)
        .eq('socio_id', socioId)
        .in('estado', ['PENDIENTE', 'ENVIADO']);

      if (existentesError) {
        console.error('[SOLICITAR_PRESUPUESTO] Error verificando duplicados:', existentesError);
      }

      const tareasExistentes = new Set((existentes ?? []).map((e) => e.tarea_id));
      const tareasNuevas = payload.tareaIds.filter((tareaId) => !tareasExistentes.has(tareaId));
      totalSkipped += payload.tareaIds.length - tareasNuevas.length;

      if (tareasNuevas.length === 0) {
        erroresSocio.push(
          `${socio.nombre ?? socioId}: ya tenía solicitudes para todas las tareas seleccionadas`,
        );
        continue;
      }

      const presupuestosInsert = tareasNuevas.map((tareaId) => {
        const insertData: Record<string, any> = {
          tarea_id: tareaId,
          socio_id: socioId,
          monto: 0,
          moneda: 'ARS',
          estado: 'PENDIENTE',
        };

        const cantidadUnidad = cantidadUnidadMap.get(tareaId);
        if (cantidadUnidad) {
          insertData.cantidad = cantidadUnidad.cantidad;
          insertData.unidad = cantidadUnidad.unidad;
        }

        if (payload.notas && payload.notas.trim()) {
          insertData.notas = payload.notas.trim();
        } else {
          insertData.notas = 'Solicitud generada desde Asigna por el cliente técnico';
        }

        return insertData;
      });

      const { data: presupuestosCreados, error: insertError } = await supabase
        .from('tareas_presupuestos')
        .insert(presupuestosInsert as any)
        .select('id');

      if (insertError) {
        erroresSocio.push(`${socio.nombre ?? socioId}: ${insertError.message}`);
        continue;
      }

      totalCreated += presupuestosCreados?.length || 0;

      const mensajeNotificacion =
        tareasNuevas.length === 1
          ? `Tenés 1 tarea para presupuestar en la obra`
          : `Tenés ${tareasNuevas.length} tareas para presupuestar en la obra`;

      const { error: notificacionError } = await (supabase as any).from('notificaciones').insert({
        org_id: orgId,
        remitente_id: user.id,
        destinatario_id: socioId,
        obra_id: obraId,
        tarea_id: tareasNuevas[0] ?? null,
        titulo: 'Nueva solicitud de presupuesto',
        mensaje: mensajeNotificacion,
        tipo: 'presupuesto',
        leida: false,
        created_at: new Date().toISOString(),
      });

      if (notificacionError) {
        console.error('[SOLICITAR_PRESUPUESTO] Error creando notificación:', notificacionError);
      }
    }

    if (totalCreated === 0) {
      return NextResponse.json(
        {
          message: 'No se creó ninguna solicitud de presupuesto',
          details: erroresSocio.join(' · ') || undefined,
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      created: totalCreated,
      skipped: totalSkipped,
      warnings: erroresSocio.length ? erroresSocio : undefined,
    });
  } catch (error) {
    console.error('[SOLICITAR_PRESUPUESTO] Error inesperado:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: error?.constructor?.name,
    });
    
    let message = 'Error interno del servidor';
    let statusCode = 500;
    let errorDetails: any = null;
    
    if (error instanceof z.ZodError) {
      message = `Datos inválidos: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`;
      statusCode = 400;
      errorDetails = error.errors;
    } else if (error instanceof Error) {
      message = error.message || 'Error interno del servidor';
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
    } else if (error && typeof error === 'object') {
      // Si es un objeto de error de Supabase u otro objeto
      try {
        const errorObj = error as any;
        message = errorObj.message || errorObj.error?.message || 'Error interno del servidor';
        errorDetails = {
          code: errorObj.code,
          details: errorObj.details,
          hint: errorObj.hint,
          message: errorObj.message,
        };
      } catch (e) {
        message = 'Error interno del servidor';
      }
    } else {
      message = String(error) || 'Error interno del servidor';
    }

    return NextResponse.json({ 
      message,
      ...(errorDetails && { details: errorDetails }),
    }, { status: statusCode });
  }
}

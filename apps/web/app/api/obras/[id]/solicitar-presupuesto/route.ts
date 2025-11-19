import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
// No usar resolveOrgContext - obtener org_id directamente de la obra
import type { Database } from '@/lib/types/supabase.gen';
import { IS_DEV_MODE } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const schema = z.object({
  etapa: z.string(),
  tareaIds: z.array(z.string().uuid()).min(1),
  socioId: z.string().uuid(),
  notas: z.string().optional(),
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

    if (IS_DEV_MODE) {
      return NextResponse.json({
        ok: true,
        created: payload.tareaIds.length,
        devMode: true,
      });
    }

    // Autenticación
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
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
      .select('id, org_id, name')
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

    // Validar que el socio pertenece a la organización
    const { data: socio, error: socioError } = await supabase
      .from('socios')
      .select('id, org_id, nombre, estado')
      .eq('id', payload.socioId)
      .maybeSingle();

    if (socioError || !socio) {
      return NextResponse.json({ message: 'Socio no encontrado' }, { status: 404 });
    }

    if (socio.org_id !== orgId) {
      return NextResponse.json({ message: 'Socio no pertenece a tu organización' }, { status: 403 });
    }

    if (socio.estado !== 'activo') {
      return NextResponse.json({ message: 'El socio no está activo' }, { status: 400 });
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

    // Verificar si ya existen solicitudes pendientes para evitar duplicados
    const { data: existentes, error: existentesError } = await supabase
      .from('tareas_presupuestos')
      .select('tarea_id, socio_id, estado')
      .in('tarea_id', payload.tareaIds)
      .eq('socio_id', payload.socioId)
      .in('estado', ['PENDIENTE', 'ENVIADO']);

    if (existentesError) {
      console.error('[SOLICITAR_PRESUPUESTO] Error verificando duplicados:', existentesError);
      // Continuar de todas formas, no es crítico
    }

    const tareasExistentes = new Set(
      (existentes ?? []).map((e) => e.tarea_id)
    );

    // Filtrar tareas que ya tienen solicitud pendiente
    const tareasNuevas = payload.tareaIds.filter((tareaId) => !tareasExistentes.has(tareaId));

    if (tareasNuevas.length === 0) {
      return NextResponse.json(
        { message: 'Todas las tareas ya tienen solicitudes pendientes para este socio' },
        { status: 400 }
      );
    }

    // Insertar solicitudes de presupuesto
    const presupuestosInsert = tareasNuevas.map((tareaId) => {
      const insertData: Record<string, any> = {
        tarea_id: tareaId,
        socio_id: payload.socioId,
        monto: 0, // Usar 0 en lugar de null si la columna tiene NOT NULL constraint
        moneda: 'ARS',
        estado: 'PENDIENTE',
      };
      
      // Solo agregar notas si hay valor
      if (payload.notas && payload.notas.trim()) {
        insertData.notas = payload.notas.trim();
      } else {
        insertData.notas = 'Solicitud generada desde Asigna por el cliente técnico';
      }
      
      return insertData;
    });

    console.log('[SOLICITAR_PRESUPUESTO] Insertando presupuestos:', {
      count: presupuestosInsert.length,
      sample: presupuestosInsert[0],
    });

    const { data: presupuestosCreados, error: insertError } = await supabase
      .from('tareas_presupuestos')
      .insert(presupuestosInsert)
      .select('id');

    if (insertError) {
      console.error('[SOLICITAR_PRESUPUESTO] Error insertando presupuestos:', {
        error: insertError,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
        presupuestosInsert,
      });
      
      const errorMessage = insertError.message || 'Error desconocido al insertar presupuestos';
      const errorDetails = {
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
      };
      
      return NextResponse.json(
        { 
          message: `Error al crear las solicitudes de presupuesto: ${errorMessage}`,
          details: errorDetails,
        },
        { status: 500 }
      );
    }

    // Crear notificación para el socio
    const mensajeNotificacion =
      tareasNuevas.length === 1
        ? `Tenés 1 tarea para presupuestar en la obra "${obra.name || 'sin nombre'}"`
        : `Tenés ${tareasNuevas.length} tareas para presupuestar en la obra "${obra.name || 'sin nombre'}"`;

    const { error: notificacionError } = await supabase.from('notificaciones').insert({
      org_id: orgId,
      socio_id: payload.socioId,
      obra_id: obraId,
      tarea_id: tareasNuevas[0] || null, // Primera tarea como referencia
      titulo: 'Nueva solicitud de presupuesto',
      mensaje: mensajeNotificacion,
      tipo: 'presupuesto',
      leida: false,
    });

    if (notificacionError) {
      console.error('[SOLICITAR_PRESUPUESTO] Error creando notificación:', notificacionError);
      // No fallar si la notificación no se crea, es opcional
    }

    return NextResponse.json({
      ok: true,
      created: presupuestosCreados?.length || 0,
      skipped: payload.tareaIds.length - tareasNuevas.length,
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


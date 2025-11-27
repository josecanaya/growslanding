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

    // Aceptar socios con estado 'activo' o 'pendiente', rechazar solo 'inactivo'
    if (socio.estado === 'inactivo') {
      console.log('[SOLICITAR_PRESUPUESTO] Socio inactivo rechazado:', { socioId: payload.socioId, estado: socio.estado });
      return NextResponse.json({ message: 'El socio no está activo' }, { status: 400 });
    }

    if (socio.estado && !['activo', 'pendiente'].includes(socio.estado)) {
      console.log('[SOLICITAR_PRESUPUESTO] Estado de socio no válido:', { socioId: payload.socioId, estado: socio.estado });
      return NextResponse.json({ message: `El socio tiene un estado no válido: ${socio.estado}` }, { status: 400 });
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
    const tareasConSolicitudExistente = payload.tareaIds.filter((tareaId) => tareasExistentes.has(tareaId));

    if (tareasNuevas.length === 0) {
      // Obtener nombres de las tareas y del socio para el mensaje
      const { data: tareasInfo } = await supabase
        .from('tareas')
        .select('id, title')
        .in('id', Array.from(tareasExistentes));
      
      const nombresTareas = (tareasInfo || []).map(t => t.title || 'Tarea sin título').join(', ');
      const nombreSocio = socio.nombre || 'este socio';
      
      return NextResponse.json(
        { 
          message: `Ya solicitaste presupuesto a ${nombreSocio} para todas las tareas seleccionadas`,
          details: `Las siguientes tareas ya tienen solicitudes pendientes: ${nombresTareas || 'N/A'}`,
          tareasConSolicitud: Array.from(tareasExistentes),
        },
        { status: 400 }
      );
    }
    
    // Si algunas tareas ya tienen solicitud, informar pero continuar con las nuevas
    if (tareasConSolicitudExistente.length > 0) {
      console.log(`[SOLICITAR_PRESUPUESTO] ${tareasConSolicitudExistente.length} tareas ya tienen solicitudes, creando ${tareasNuevas.length} nuevas`);
    }

    // Obtener información de tareas con elementos para cantidad y unidad
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
      .in('id', tareasNuevas);

    if (errorTareasConElementos) {
      console.warn('[SOLICITAR_PRESUPUESTO] Error obteniendo elementos de tareas:', errorTareasConElementos);
      // Continuar de todas formas, no es crítico
    }

    // Crear mapa de tarea_id -> { cantidad, unidad }
    const cantidadUnidadMap = new Map();
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

    // Insertar solicitudes de presupuesto
    const presupuestosInsert = tareasNuevas.map((tareaId) => {
      const insertData: Record<string, any> = {
        tarea_id: tareaId,
        socio_id: payload.socioId,
        monto: 0, // Usar 0 en lugar de null si la columna tiene NOT NULL constraint
        moneda: 'ARS',
        estado: 'PENDIENTE',
      };
      
      // Agregar cantidad y unidad si están disponibles
      const cantidadUnidad = cantidadUnidadMap.get(tareaId);
      if (cantidadUnidad) {
        insertData.cantidad = cantidadUnidad.cantidad;
        insertData.unidad = cantidadUnidad.unidad;
      }
      
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
    // Notificación Supabase: usamos siempre remitente_id + destinatario_id (no usar socio_id)
    const mensajeNotificacion =
      tareasNuevas.length === 1
        ? `Tenés 1 tarea para presupuestar en la obra`
        : `Tenés ${tareasNuevas.length} tareas para presupuestar en la obra`;

    const { error: notificacionError } = await (supabase as any).from('notificaciones').insert({
      org_id: orgId,
      remitente_id: user.id,            // cliente técnico
      destinatario_id: payload.socioId, // socio al que se le pide presupuesto
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


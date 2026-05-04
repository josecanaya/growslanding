import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';
import { ordenarTareasPorPrecedencias } from '@/utils/ordenarTareasPorPrecedencias';

export const runtime = 'nodejs';

type Payload = {
  socio_id: string;
  obra_id: string;
  etapa_id?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Payload;
    const { socio_id, obra_id, etapa_id } = body;

    console.log('[POST /api/presupuestos/aprobar-socio] Parámetros:', { socio_id, obra_id, etapa_id, body });

    if (!obra_id) {
      console.error('[POST /api/presupuestos/aprobar-socio] obra_id faltante');
      return NextResponse.json(
        { success: false, error: 'obra_id es requerido' },
        { status: 400 }
      );
    }

    if (!socio_id) {
      console.error('[POST /api/presupuestos/aprobar-socio] socio_id faltante');
      return NextResponse.json(
        { success: false, error: 'socio_id es requerido' },
        { status: 400 }
      );
    }

    // Autenticación
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({
      cookies: () => cookieStore as any,
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    // Obtener org_id desde la obra
    const { data: obraData, error: obraError } = await supabaseAny
      .from('obras')
      .select('org_id')
      .eq('id', obra_id)
      .maybeSingle();

    if (obraError || !obraData) {
      return NextResponse.json(
        { success: false, error: 'Obra no encontrada' },
        { status: 404 }
      );
    }

    const orgId = obraData.org_id;

    // Obtener todas las tareas de la obra
    // Primero obtener los elementos de la obra que coincidan con la etapa
    let elementosQuery = supabaseAny
      .from('elementos')
      .select('id')
      .eq('obra_id', obra_id);

    // Si hay etapa_id, filtrar elementos por etapa/categoria
    if (etapa_id) {
      const etapaNormalizada = etapa_id.toLowerCase();
      console.log('[POST /api/presupuestos/aprobar-socio] Filtrando por etapa:', etapaNormalizada);
      
      // Buscar en múltiples campos con diferentes variantes
      const patterns = [etapaNormalizada];
      if (etapaNormalizada.includes('estructura')) {
        patterns.push('estructura');
      }
      if (etapaNormalizada.includes('gris')) {
        patterns.push('obra gris', 'obra_gris', 'obragris', 'gris');
      }
      if (etapaNormalizada.includes('termin')) {
        patterns.push('terminaciones', 'terminacion');
      }
      
      // Construir query OR con múltiples condiciones en elementos
      const orConditions = patterns.flatMap(pattern => [
        `categoria.ilike.%${pattern}%`,
        `subcategoria.ilike.%${pattern}%`,
        `nombre.ilike.%${pattern}%`
      ]).join(',');
      
      elementosQuery = elementosQuery.or(orConditions);
    }

    const { data: elementosData, error: elementosError } = await elementosQuery;

    if (elementosError) {
      console.error('[POST /api/presupuestos/aprobar-socio] Error obteniendo elementos:', elementosError);
      return NextResponse.json(
        { success: false, error: elementosError.message },
        { status: 500 }
      );
    }

    console.log('[POST /api/presupuestos/aprobar-socio] Elementos encontrados:', elementosData?.length || 0, elementosData);

    const elementoIds = elementosData?.map((e: any) => e.id) || [];

    // Obtener tareas que pertenecen a estos elementos
    let tareasQuery = supabaseAny
      .from('tareas')
      .select('id, title, descripcion, elemento_id, obra_id, org_id')
      .eq('obra_id', obra_id)
      .eq('org_id', orgId);

    if (elementoIds.length > 0) {
      tareasQuery = tareasQuery.in('elemento_id', elementoIds);
      console.log('[POST /api/presupuestos/aprobar-socio] Filtrando tareas por elemento_ids:', elementoIds);
    } else if (etapa_id) {
      // Si no hay elementos para esta etapa, intentar buscar tareas directamente por obra
      console.warn('[POST /api/presupuestos/aprobar-socio] No se encontraron elementos para etapa, buscando todas las tareas de la obra');
      // Continuar sin filtrar por elementos
    }

    const { data: tareasData, error: tareasError } = await tareasQuery;

    if (tareasError) {
      console.error('[POST /api/presupuestos/aprobar-socio] Error obteniendo tareas:', tareasError);
      return NextResponse.json(
        { success: false, error: tareasError.message },
        { status: 500 }
      );
    }

    console.log('[POST /api/presupuestos/aprobar-socio] Tareas encontradas:', tareasData?.length || 0);
    if (tareasData && tareasData.length > 0) {
      console.log('[POST /api/presupuestos/aprobar-socio] Primeras tareas:', tareasData.slice(0, 3).map((t: any) => ({ id: t.id, title: t.title, elemento_id: t.elemento_id })));
    }

    if (!tareasData || tareasData.length === 0) {
      console.warn('[POST /api/presupuestos/aprobar-socio] No se encontraron tareas para obra:', obra_id, 'etapa:', etapa_id, 'elementoIds:', elementoIds);
      return NextResponse.json(
        { success: false, error: 'No se encontraron tareas para esta obra/etapa' },
        { status: 404 }
      );
    }

    const tareaIds = tareasData.map((t: any) => t.id);
    console.log('[POST /api/presupuestos/aprobar-socio] Tarea IDs:', tareaIds);

    // Obtener presupuestos del socio para estas tareas
    const { data: presupuestosData, error: presupuestosError } = await supabaseAny
      .from('tareas_presupuestos')
      .select('id, tarea_id, estado, socio_id')
      .in('tarea_id', tareaIds)
      .eq('socio_id', socio_id);

    console.log('[POST /api/presupuestos/aprobar-socio] Presupuestos encontrados:', presupuestosData?.length || 0);

    if (presupuestosError) {
      console.error('[POST /api/presupuestos/aprobar-socio] Error obteniendo presupuestos:', presupuestosError);
      return NextResponse.json(
        { success: false, error: presupuestosError.message },
        { status: 500 }
      );
    }

    if (!presupuestosData || presupuestosData.length === 0) {
      console.warn('[POST /api/presupuestos/aprobar-socio] No se encontraron presupuestos para socio:', socio_id, 'tareas:', tareaIds);
      return NextResponse.json(
        { success: false, error: 'No se encontraron presupuestos para este socio en estas tareas' },
        { status: 404 }
      );
    }

    // Obtener precedencias para estas tareas
    const { data: precedenciasData, error: precedenciasError } = await supabaseAny
      .from('tarea_precedencias')
      .select('tarea_id, depende_de')
      .in('tarea_id', tareaIds);

    if (precedenciasError) {
      console.warn('[POST /api/presupuestos/aprobar-socio] Error obteniendo precedencias:', precedenciasError);
    }

    // Ordenar tareas según precedencias
    const tareasOrdenadas = ordenarTareasPorPrecedencias(
      tareasData.map((t: any) => ({
        id: t.id,
        title: t.title ?? 'Tarea sin título',
      })),
      (precedenciasData ?? []) as Array<{ tarea_id: string; depende_de?: string }>
    );

    // Obtener email del socio
    const { data: socioData, error: socioError } = await supabaseAny
      .from('socios')
      .select('id, nombre, email, org_id')
      .eq('id', socio_id)
      .eq('org_id', orgId)
      .maybeSingle();

    if (socioError || !socioData || !socioData.email) {
      return NextResponse.json(
        { success: false, error: 'Socio no encontrado o sin email' },
        { status: 404 }
      );
    }

    // Crear mapa de presupuestos por tarea_id
    const presupuestosMap = new Map<string, any>();
    presupuestosData.forEach((p: any) => {
      presupuestosMap.set(p.tarea_id, p);
    });

    // Procesar cada tarea en orden
    let tareasAprobadas = 0;
    const errores: string[] = [];

    for (const tarea of tareasOrdenadas) {
      const presupuesto = presupuestosMap.get(tarea.id);
      if (!presupuesto) {
        continue; // No hay presupuesto para esta tarea
      }

      try {
        // 1. Actualizar presupuesto a APROBADO
        const { error: updatePresupuestoError } = await supabaseAny
          .from('tareas_presupuestos')
          .update({
            estado: 'APROBADO',
            updated_at: new Date().toISOString(),
          })
          .eq('id', presupuesto.id);

        if (updatePresupuestoError) {
          console.error('[POST /api/presupuestos/aprobar-socio] Error actualizando presupuesto:', updatePresupuestoError);
          errores.push(`Error actualizando presupuesto ${presupuesto.id}`);
          continue;
        }

        // 2. Actualizar tarea: asignar socio
        const { error: updateTareaError } = await supabaseAny
          .from('tareas')
          .update({
            responsable: socioData.email, // Email del socio
            cuadrilla_id: socio_id,
            responsable_socio_id: socio_id,
            estado: 'pendiente',
          })
          .eq('id', tarea.id)
          .eq('org_id', orgId);

        if (updateTareaError) {
          console.error('[POST /api/presupuestos/aprobar-socio] Error actualizando tarea:', updateTareaError);
          errores.push(`Error actualizando tarea ${tarea.id}`);
          continue;
        }

        // 3. Rechazar otros presupuestos de la misma tarea
        const { error: rejectError } = await supabaseAny
          .from('tareas_presupuestos')
          .update({
            estado: 'RECHAZADO',
            updated_at: new Date().toISOString(),
          })
          .eq('tarea_id', tarea.id)
          .neq('socio_id', socio_id);

        if (rejectError) {
          console.warn('[POST /api/presupuestos/aprobar-socio] Error rechazando otros presupuestos:', rejectError);
        }

        // 4. Crear evento
        const { error: eventoError } = await supabaseAny
          .from('eventos')
          .insert({
            tarea_id: tarea.id,
            org_id: orgId,
            obra_id: obra_id,
            actor_name: user.email ?? 'Sistema',
            actor_role: 'Cliente',
            actor_method: 'login',
            notas: `Tarea asignada a ${socioData.nombre ?? 'socio'}`,
            checklist: null,
            has_nc: false,
            nuevo_estado: 'pendiente' as const,
            snapshot_json: null,
            created_at: new Date().toISOString(),
          });

        if (eventoError) {
          console.warn('[POST /api/presupuestos/aprobar-socio] Error creando evento:', eventoError);
        }

        tareasAprobadas++;
      } catch (err: any) {
        console.error('[POST /api/presupuestos/aprobar-socio] Error procesando tarea:', err);
        errores.push(`Error procesando tarea ${tarea.id}: ${err.message}`);
      }
    }

    // 5. Crear notificación para el socio (una sola notificación para todas las tareas)
    if (tareasAprobadas > 0) {
      // Obtener el ID del usuario cliente (remitente) desde auth
      const clienteId = user.id;
      
      // Obtener el ID del socio (destinatario) - puede ser el socio_id directamente o buscar por email
      let destinatarioId = socio_id;
      
      // Si socio_id no es un UUID válido, intentar obtenerlo desde la tabla socios
      if (!destinatarioId || destinatarioId.length !== 36) {
        const { data: socioDataForNotif } = await supabaseAny
          .from('socios')
          .select('id')
          .eq('id', socio_id)
          .maybeSingle();
        
        if (socioDataForNotif) {
          destinatarioId = socioDataForNotif.id;
        }
      }

      // Notificación Supabase: usamos siempre remitente_id + destinatario_id (no usar socio_id)
      const { error: notifError } = await supabaseAny
        .from('notificaciones')
        .insert({
          org_id: orgId,
          obra_id: obra_id,
          tarea_id: null, // Notificación general, no de una tarea específica
          remitente_id: clienteId, // Cliente que aprueba
          destinatario_id: destinatarioId, // Socio que recibe
          tipo: 'presupuesto_aprobado',
          titulo: 'Presupuesto aprobado',
          mensaje: `Tu presupuesto fue aprobado. ${tareasAprobadas} tarea${tareasAprobadas === 1 ? '' : 's'} asignada${tareasAprobadas === 1 ? '' : 's'}. Pronto recibirás el cronograma de tareas.`,
          leida: false,
          created_at: new Date().toISOString(),
        });

      if (notifError) {
        console.error('[POST /api/presupuestos/aprobar-socio] Error creando notificación:', notifError);
      } else {
        console.log('[POST /api/presupuestos/aprobar-socio] ✅ Notificación creada para socio:', destinatarioId);
      }
    }

    if (errores.length > 0) {
      return NextResponse.json({
        success: true,
        tareas_aprobadas: tareasAprobadas,
        errores: errores,
        warning: 'Algunas tareas tuvieron errores',
      });
    }

    return NextResponse.json({
      success: true,
      ok: true,
      tareas_aprobadas: tareasAprobadas,
    });
  } catch (error: any) {
    console.error('[POST /api/presupuestos/aprobar-socio] Excepción:', error);
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}


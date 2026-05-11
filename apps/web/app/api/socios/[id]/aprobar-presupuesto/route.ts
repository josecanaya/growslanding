import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';
import { ordenarTareasPorPrecedencias } from '@/utils/ordenarTareasPorPrecedencias';
import { sincronizarTareaTrasPresupuestoAprobado } from '@/lib/services/sync-tarea-presupuesto-aprobado.service';

export const runtime = 'nodejs';

type Payload = {
  socio_id: string;
  obra_id: string;
  etapa_id?: string;
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const socioId = id;
    const body = (await request.json()) as Payload;
    const { obra_id, etapa_id } = body;

    console.log('[POST /api/socios/[id]/aprobar-presupuesto] Parámetros:', { socioId, obra_id, etapa_id, body });

    if (!obra_id) {
      console.error('[POST /api/socios/[id]/aprobar-presupuesto] obra_id faltante');
      return NextResponse.json(
        { success: false, error: 'obra_id es requerido' },
        { status: 400 }
      );
    }

    // Validar que el socioId del path coincida con el del body
    if (socioId !== body.socio_id) {
      console.error('[POST /api/socios/[id]/aprobar-presupuesto] socio_id no coincide:', { pathSocioId: socioId, bodySocioId: body.socio_id });
      return NextResponse.json(
        { success: false, error: 'socio_id no coincide' },
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
    let tareasQuery = supabaseAny
      .from('tareas')
      .select('id, title, nombre, etapa, tipo, category, fase, obra_id, org_id')
      .eq('obra_id', obra_id)
      .eq('org_id', orgId);

    // Si hay etapa_id, filtrar por etapa
    if (etapa_id) {
      // Normalizar etapa para buscar (puede venir como "estructura", "obra gris", "terminaciones")
      const etapaNormalizada = etapa_id.toLowerCase();
      console.log('[POST /api/socios/[id]/aprobar-presupuesto] Filtrando por etapa:', etapaNormalizada);
      
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
      
      // Construir query OR con múltiples condiciones
      const orConditions = patterns.flatMap(pattern => [
        `etapa.ilike.%${pattern}%`,
        `tipo.ilike.%${pattern}%`,
        `category.ilike.%${pattern}%`,
        `fase.ilike.%${pattern}%`
      ]).join(',');
      
      tareasQuery = tareasQuery.or(orConditions);
    }

    const { data: tareasData, error: tareasError } = await tareasQuery;

    if (tareasError) {
      console.error('[POST /api/socios/[id]/aprobar-presupuesto] Error obteniendo tareas:', tareasError);
      return NextResponse.json(
        { success: false, error: tareasError.message },
        { status: 500 }
      );
    }

    console.log('[POST /api/socios/[id]/aprobar-presupuesto] Tareas encontradas:', tareasData?.length || 0);

    if (!tareasData || tareasData.length === 0) {
      console.warn('[POST /api/socios/[id]/aprobar-presupuesto] No se encontraron tareas para obra:', obra_id, 'etapa:', etapa_id);
      return NextResponse.json(
        { success: false, error: 'No se encontraron tareas para esta obra/etapa' },
        { status: 404 }
      );
    }

    const tareaIds = tareasData.map((t: any) => t.id);
    console.log('[POST /api/socios/[id]/aprobar-presupuesto] Tarea IDs:', tareaIds);

    // Obtener presupuestos del socio para estas tareas
    const { data: presupuestosData, error: presupuestosError } = await supabaseAny
      .from('tareas_presupuestos')
      .select('id, tarea_id, estado, socio_id')
      .in('tarea_id', tareaIds)
      .eq('socio_id', socioId);

    console.log('[POST /api/socios/[id]/aprobar-presupuesto] Presupuestos encontrados:', presupuestosData?.length || 0);

    if (presupuestosError) {
      console.error('[POST /api/socios/[id]/aprobar-presupuesto] Error obteniendo presupuestos:', presupuestosError);
      return NextResponse.json(
        { success: false, error: presupuestosError.message },
        { status: 500 }
      );
    }

    if (!presupuestosData || presupuestosData.length === 0) {
      console.warn('[POST /api/socios/[id]/aprobar-presupuesto] No se encontraron presupuestos para socio:', socioId, 'tareas:', tareaIds);
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
      console.warn('[POST /api/socios/[id]/aprobar-presupuesto] Error obteniendo precedencias:', precedenciasError);
    }

    // Ordenar tareas según precedencias
    const tareasOrdenadas = ordenarTareasPorPrecedencias(
      tareasData.map((t: any) => ({
        id: t.id,
        title: t.title ?? t.nombre ?? 'Tarea sin título',
        etapa: t.etapa ?? t.tipo ?? t.category ?? t.fase ?? null,
      })),
      (precedenciasData ?? []) as Array<{ tarea_id: string; depende_de?: string }>
    );

    // Obtener email del socio
    const { data: socioData, error: socioError } = await supabaseAny
      .from('socios')
      .select('id, nombre, email, org_id')
      .eq('id', socioId)
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
          console.error('[POST /api/socios/[id]/aprobar-presupuesto] Error actualizando presupuesto:', updatePresupuestoError);
          errores.push(`Error actualizando presupuesto ${presupuesto.id}`);
          continue;
        }

        const syncTar = await sincronizarTareaTrasPresupuestoAprobado(supabaseAny, {
          tareaId: tarea.id,
          socioId,
        });

        if (!syncTar.ok) {
          console.error('[POST /api/socios/[id]/aprobar-presupuesto] Sync tarea:', syncTar.error);
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
          .neq('socio_id', socioId);

        if (rejectError) {
          console.warn('[POST /api/socios/[id]/aprobar-presupuesto] Error rechazando otros presupuestos:', rejectError);
        }

        // 4. Crear evento
        const { error: eventoError } = await supabaseAny
          .from('eventos')
          .insert({
            tarea_id: tarea.id,
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
          console.warn('[POST /api/socios/[id]/aprobar-presupuesto] Error creando evento:', eventoError);
        }

        tareasAprobadas++;
      } catch (err: any) {
        console.error('[POST /api/socios/[id]/aprobar-presupuesto] Error procesando tarea:', err);
        errores.push(`Error procesando tarea ${tarea.id}: ${err.message}`);
      }
    }

    // 5. Crear notificación para el socio (una sola notificación para todas las tareas)
    if (tareasAprobadas > 0) {
      const { error: notifError } = await supabaseAny
        .from('notificaciones')
        .insert({
          org_id: orgId,
          socio_id: socioId,
          obra_id: obra_id,
          tarea_id: null, // Notificación general, no de una tarea específica
          tipo: 'asignacion',
          titulo: 'Presupuesto aprobado',
          mensaje: `El cliente aprobó tu presupuesto. ${tareasAprobadas} tarea${tareasAprobadas === 1 ? '' : 's'} asignada${tareasAprobadas === 1 ? '' : 's'}. Ya puedes comenzar.`,
          leida: false,
        });

      if (notifError) {
        console.warn('[POST /api/socios/[id]/aprobar-presupuesto] Error creando notificación:', notifError);
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
    console.error('[POST /api/socios/[id]/aprobar-presupuesto] Excepción:', error);
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}



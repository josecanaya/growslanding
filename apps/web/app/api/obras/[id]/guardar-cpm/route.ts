import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface TareaCPMData {
  id: string;
  es: number;
  ef: number;
  ls: number;
  lf: number;
  float: number;
  isCritical: boolean;
}

/**
 * POST /api/obras/[id]/guardar-cpm
 * Guarda los valores CPM calculados para las tareas de una obra
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('[GUARDAR_CPM] Iniciando guardado de CPM');
    const { id: obraId } = await params;
    
    if (!obraId) {
      console.error('[GUARDAR_CPM] obraId no proporcionado');
      return NextResponse.json(
        { success: false, error: 'obraId es requerido' },
        { status: 400 }
      );
    }

    console.log('[GUARDAR_CPM] obraId:', obraId);

    let body: any;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('[GUARDAR_CPM] Error parseando JSON del request:', jsonError);
      return NextResponse.json(
        { success: false, error: 'Error al parsear el cuerpo de la petición' },
        { status: 400 }
      );
    }

    const { tareas } = body;
    console.log('[GUARDAR_CPM] Tareas recibidas:', tareas?.length || 0);

    if (!Array.isArray(tareas)) {
      return NextResponse.json(
        { success: false, error: 'tareas debe ser un array' },
        { status: 400 }
      );
    }

    if (tareas.length === 0) {
      return NextResponse.json(
        { success: true, message: 'No hay tareas para actualizar' },
        { status: 200 }
      );
    }

    // Validar estructura de cada tarea
    for (const tarea of tareas) {
      if (!tarea.id || typeof tarea.es !== 'number' || typeof tarea.ef !== 'number' || 
          typeof tarea.ls !== 'number' || typeof tarea.lf !== 'number' || 
          typeof tarea.float !== 'number' || typeof tarea.isCritical !== 'boolean') {
        return NextResponse.json(
          { success: false, error: 'Estructura de tarea inválida. Se requiere: id, es, ef, ls, lf, float, isCritical' },
          { status: 400 }
        );
      }
    }

    const supabase = createServiceSupabaseClient();

    // Obtener IDs de tareas de la obra para validar
    const { data: tareasObra, error: errorTareas } = await supabase
      .from('tareas')
      .select('id')
      .eq('obra_id', obraId);

    if (errorTareas) {
      console.error('[GUARDAR_CPM] Error obteniendo tareas de la obra:', errorTareas);
      return NextResponse.json(
        { success: false, error: 'Error al validar tareas de la obra', details: errorTareas.message },
        { status: 500 }
      );
    }

    const tareaIdsObra = new Set((tareasObra || []).map((t) => t.id));
    const tareaIdsRequest = tareas.map((t) => t.id);

    // Validar que todas las tareas pertenecen a la obra
    const tareasInvalidas = tareaIdsRequest.filter((id) => !tareaIdsObra.has(id));
    if (tareasInvalidas.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Las siguientes tareas no pertenecen a la obra: ${tareasInvalidas.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Obtener org_id de la obra para validar
    const { data: obra, error: errorObra } = await supabase
      .from('obras')
      .select('org_id')
      .eq('id', obraId)
      .single();

    if (errorObra) {
      console.error('[GUARDAR_CPM] Error obteniendo obra:', errorObra);
      return NextResponse.json(
        { success: false, error: 'Error al validar la obra', details: errorObra.message },
        { status: 500 }
      );
    }

    if (!obra) {
      return NextResponse.json(
        { success: false, error: 'Obra no encontrada' },
        { status: 404 }
      );
    }

    console.log('[GUARDAR_CPM] Obra encontrada, org_id:', obra.org_id);

    // Preparar datos para update (solo campos CPM)
    const tareaIds = tareas.map((t) => t.id);
    
    console.log('[GUARDAR_CPM] Actualizando', tareas.length, 'tareas');
    console.log('[GUARDAR_CPM] Ejemplo de datos:', JSON.stringify({
      id: tareas[0].id,
      es: tareas[0].es,
      ef: tareas[0].ef,
      ls: tareas[0].ls,
      lf: tareas[0].lf,
      float: tareas[0].float,
      is_critical: tareas[0].isCritical,
    }, null, 2));

    // Actualizar cada tarea individualmente para evitar problemas con batch update
    // que podría requerir org_id
    const resultados: any[] = [];
    const errores: any[] = [];

    for (const tarea of tareas) {
      try {
        console.log(`[GUARDAR_CPM] Actualizando tarea ${tarea.id}...`);
        const { data: updatedTarea, error: updateError } = await supabase
          .from('tareas')
          .update({
            es: tarea.es,
            ef: tarea.ef,
            ls: tarea.ls,
            lf: tarea.lf,
            float: tarea.float,
            is_critical: tarea.isCritical,
          })
          .eq('id', tarea.id)
          .eq('obra_id', obraId) // Asegurar que pertenece a la obra
          .select('id, es, ef, ls, lf, float, is_critical')
          .single();

        if (updateError) {
          console.error(`[GUARDAR_CPM] Error actualizando tarea ${tarea.id}:`, updateError);
          errores.push({ tareaId: tarea.id, error: updateError });
        } else if (updatedTarea) {
          resultados.push(updatedTarea);
        }
      } catch (updateError) {
        console.error(`[GUARDAR_CPM] Excepción actualizando tarea ${tarea.id}:`, updateError);
        errores.push({ 
          tareaId: tarea.id, 
          error: updateError instanceof Error ? updateError.message : String(updateError) 
        });
      }
    }

    if (errores.length > 0) {
      console.error('[GUARDAR_CPM] ===== ERRORES EN ACTUALIZACIÓN =====');
      console.error('[GUARDAR_CPM] Errores:', errores);
      console.error('[GUARDAR_CPM] ====================================');
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Error al actualizar ${errores.length} de ${tareas.length} tareas`,
          details: errores,
          actualizadas: resultados.length,
        },
        { status: 500 }
      );
    }

    console.log(`[GUARDAR_CPM] Valores CPM actualizados para ${resultados.length} tareas en obra ${obraId}`);

    return NextResponse.json({
      success: true,
      message: `Valores CPM guardados para ${resultados.length} tareas`,
      data: resultados,
    });
  } catch (error) {
    console.error('[GUARDAR_CPM] ===== ERROR INESPERADO =====');
    console.error('[GUARDAR_CPM] Error type:', typeof error);
    console.error('[GUARDAR_CPM] Error instanceof Error:', error instanceof Error);
    console.error('[GUARDAR_CPM] Error completo:', error);
    
    if (error instanceof Error) {
      console.error('[GUARDAR_CPM] Error message:', error.message);
      console.error('[GUARDAR_CPM] Error stack:', error.stack);
    } else {
      console.error('[GUARDAR_CPM] Error value:', String(error));
      console.error('[GUARDAR_CPM] Error JSON:', JSON.stringify(error, null, 2));
    }
    console.error('[GUARDAR_CPM] ============================');
    
    const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: errorStack ? errorStack.substring(0, 500) : undefined,
      },
      { status: 500 }
    );
  }
}


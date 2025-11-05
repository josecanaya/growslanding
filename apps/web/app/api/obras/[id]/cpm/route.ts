import { NextRequest, NextResponse } from 'next/server';
import { CPMService } from '@/lib/services/cpm.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/obras/[id]/cpm
 * Calcula el camino crítico (CPM) para una obra
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: obraId } = await params;
    const organizacionId = request.headers.get('x-organizacion-id');

    if (!obraId) {
      return NextResponse.json(
        { success: false, error: 'id es requerido' },
        { status: 400 }
      );
    }

    if (!organizacionId) {
      return NextResponse.json(
        { success: false, error: 'x-organizacion-id es requerido' },
        { status: 400 }
      );
    }

    // Verificar que la obra pertenece a la organización
    const { createServiceSupabaseClient } = await import('@/lib/supabase-server');
    const supabase = createServiceSupabaseClient();

    const { data: obra, error: obraError } = await supabase
      .from('obras')
      .select('id, org_id')
      .eq('id', obraId)
      .eq('org_id', organizacionId)
      .single();

    if (obraError || !obra) {
      return NextResponse.json(
        { success: false, error: 'Obra no encontrada o no pertenece a la organización' },
        { status: 404 }
      );
    }

    // Calcular CPM
    const resultado = await CPMService.calcularCPMDesdeSupabase(obraId);

    return NextResponse.json({
      success: true,
      data: {
        caminoCritico: resultado.caminoCritico,
        tareas: resultado.tareasConHolguras,
        duracionTotal: resultado.duracionTotal,
      },
    });

  } catch (error) {
    console.error('[GET_CPM] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}


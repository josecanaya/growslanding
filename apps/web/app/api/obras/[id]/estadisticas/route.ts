import { NextRequest, NextResponse } from 'next/server';
import { ObraService } from '../../../../../lib/services';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const organizacionId = request.headers.get('x-organizacion-id');
    
    if (!organizacionId) {
      return NextResponse.json(
        { success: false, error: 'Organización requerida' },
        { status: 400 }
      );
    }

    const estadisticas = await ObraService.obtenerEstadisticas(id, organizacionId);

    return NextResponse.json({
      success: true,
      data: estadisticas,
    });

  } catch (error) {
    console.error('Error en GET /api/obras/[id]/estadisticas:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}

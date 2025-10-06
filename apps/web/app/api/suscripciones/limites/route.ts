import { NextRequest, NextResponse } from 'next/server';
import { SuscripcionService } from '../../../../lib/services';

export async function GET(request: NextRequest) {
  try {
    const organizacionId = request.headers.get('x-organizacion-id');
    
    if (!organizacionId) {
      return NextResponse.json(
        { success: false, error: 'Organización requerida' },
        { status: 400 }
      );
    }

    const limites = await SuscripcionService.obtenerLimites(organizacionId);
    const estadisticas = await SuscripcionService.obtenerEstadisticasUso(organizacionId);

    return NextResponse.json({
      success: true,
      data: {
        limites,
        estadisticas,
      },
    });

  } catch (error) {
    console.error('Error en GET /api/suscripciones/limites:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}

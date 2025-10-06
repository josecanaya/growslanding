import { NextRequest, NextResponse } from 'next/server';
import { NotificacionService } from '../../../lib/services';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const usuarioId = request.headers.get('x-usuario-id');
    
    if (!usuarioId) {
      return NextResponse.json(
        { success: false, error: 'Usuario requerido' },
        { status: 400 }
      );
    }

    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const soloNoLeidas = searchParams.get('soloNoLeidas') === 'true';

    const resultado = await NotificacionService.obtenerNotificacionesUsuario(usuarioId, {
      limit,
      offset,
      soloNoLeidas,
    });

    return NextResponse.json({
      success: true,
      data: resultado.notificaciones,
      paginacion: resultado.paginacion,
    });

  } catch (error) {
    console.error('Error en GET /api/notificaciones:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}

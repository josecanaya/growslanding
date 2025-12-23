import { NextRequest, NextResponse } from 'next/server';
import { NotificacionService } from '@/lib/services/notificacion.service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const usuarioId = request.headers.get('x-usuario-id');
    
    if (!usuarioId) {
      return NextResponse.json(
        { success: false, error: 'Usuario requerido' },
        { status: 400 }
      );
    }

    const { id } = await params;
    const notificacion = await NotificacionService.marcarComoLeida(id, usuarioId);

    return NextResponse.json({
      success: true,
      data: notificacion,
    });

  } catch (error) {
    console.error('Error en POST /api/notificaciones/[id]/leer:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}

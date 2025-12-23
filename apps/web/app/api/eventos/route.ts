import { NextRequest, NextResponse } from 'next/server';
import { EventoService } from '@/lib/services/evento.service';
import { EventoQuerySchema } from '../../../lib/schemas';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizacionId = request.headers.get('x-organizacion-id');
    
    if (!organizacionId) {
      return NextResponse.json(
        { success: false, error: 'Organización requerida' },
        { status: 400 }
      );
    }

    // Parsear query parameters
    const query = {
      obraId: searchParams.get('obraId') || undefined,
      tareaId: searchParams.get('tareaId') || undefined,
      tipoEvento: searchParams.get('tipoEvento') || undefined,
      fechaDesde: searchParams.get('fechaDesde') ? new Date(searchParams.get('fechaDesde')!) : undefined,
      fechaHasta: searchParams.get('fechaHasta') ? new Date(searchParams.get('fechaHasta')!) : undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    // Validar query
    const validatedQuery = EventoQuerySchema.parse(query);

    // Obtener eventos
    const resultado = await EventoService.obtenerEventos(validatedQuery);

    return NextResponse.json({
      success: true,
      data: resultado.eventos,
      paginacion: resultado.paginacion,
    });

  } catch (error) {
    console.error('Error en GET /api/eventos:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}

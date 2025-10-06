import { NextRequest, NextResponse } from 'next/server';
import { CPMService } from '../../../../../../lib/services';
import { PermisosService } from '../../../../../../lib/services';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const organizacionId = request.headers.get('x-organizacion-id');
    const usuarioId = request.headers.get('x-usuario-id');

    if (!organizacionId || !usuarioId) {
      return NextResponse.json(
        { success: false, error: 'Organización y usuario requeridos' },
        { status: 400 }
      );
    }

    // Verificar permisos
    const tienePermiso = await PermisosService.verificarPermiso(
      usuarioId,
      organizacionId,
      'ver_tarea' // Permiso básico para ver cronograma
    );

    if (!tienePermiso) {
      return NextResponse.json(
        { success: false, error: 'No tiene permisos para recalcular el cronograma' },
        { status: 403 }
      );
    }

    // Validar dependencias antes de calcular
    const dependenciasValidas = await CPMService.validarDependencias(id);
    
    if (!dependenciasValidas) {
      return NextResponse.json(
        { success: false, error: 'Se detectaron ciclos en las dependencias de las tareas' },
        { status: 400 }
      );
    }

    // Recalcular camino crítico y actualizar cache
    const resultado = await CPMService.actualizarCacheObra(id);

    return NextResponse.json({
      success: true,
      data: {
        caminoCritico: resultado.caminoCritico,
        duracionTotal: resultado.duracionTotal,
        tareas: resultado.tareas.map(t => ({
          id: t.id,
          nombre: t.nombre,
          duracionEstimada: t.duracionEstimada,
          fechaInicioTemprana: t.fechaInicioTemprana,
          fechaFinTemprana: t.fechaFinTemprana,
          fechaInicioTardia: t.fechaInicioTardia,
          fechaFinTardia: t.fechaFinTardia,
          holguraTotal: t.holguraTotal,
          holguraLibre: t.holguraLibre,
          esCritica: t.esCritica,
        })),
      },
    });

  } catch (error) {
    console.error('Error en POST /api/obras/[id]/cronograma/recalcular:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}

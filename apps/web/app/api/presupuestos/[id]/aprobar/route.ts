import { NextRequest, NextResponse } from 'next/server';
import { TareaService } from '../../../../../lib/services';
import { AprobarPresupuestoSchema } from '../../../../../lib/schemas';
import { PermisosService } from '../../../../../lib/services';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const organizacionId = request.headers.get('x-organizacion-id');
    const usuarioId = request.headers.get('x-usuario-id');

    if (!organizacionId || !usuarioId) {
      return NextResponse.json(
        { success: false, error: 'Organización y usuario requeridos' },
        { status: 400 }
      );
    }

    // Verificar permisos
    const accion = body.aprobado ? 'aprobar_presupuesto' : 'rechazar_presupuesto';
    const tienePermiso = await PermisosService.verificarPermiso(
      usuarioId,
      organizacionId,
      accion
    );

    if (!tienePermiso) {
      return NextResponse.json(
        { success: false, error: `No tiene permisos para ${accion}` },
        { status: 403 }
      );
    }

    // Validar datos
    const validatedData = AprobarPresupuestoSchema.parse({
      ...body,
      presupuestoId: id,
    });

    // Aprobar/rechazar presupuesto
    const presupuesto = await TareaService.aprobarPresupuesto(validatedData, organizacionId);

    return NextResponse.json({
      success: true,
      data: presupuesto,
    });

  } catch (error) {
    console.error('Error en POST /api/presupuestos/[id]/aprobar:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}

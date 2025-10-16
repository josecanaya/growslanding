import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/obras
 * Devuelve todas las obras ordenadas por createdAt desc
 */
export async function GET() {
  try {
    const obras = await prisma.obra.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            tareas: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: obras,
      count: obras.length,
    }, { status: 200 });
  } catch (error) {
    console.error('Error en GET /api/obras:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/obras
 * Crea una nueva obra
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orgId, name, address, estado } = body;

    // Validaciones
    if (!orgId || !name) {
      return NextResponse.json(
        {
          success: false,
          message: 'orgId y name son obligatorios',
        },
        { status: 400 }
      );
    }

    // Verificar que la organización existe
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
    });

    if (!organization) {
      return NextResponse.json(
        {
          success: false,
          message: 'La organización especificada no existe',
        },
        { status: 404 }
      );
    }

    // Crear la obra
    const obra = await prisma.obra.create({
      data: {
        orgId,
        name,
        address: address || null,
        estado: estado || 'pendiente',
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            tareas: true,
          },
        },
      },
    });

    // Auditoría: registrar creación de obra
    await auditEvent({ orgId, tipo: "OBRA_CREADA", descripcion: obra.name });

    return NextResponse.json(
      {
        success: true,
        message: 'Obra creada exitosamente',
        data: obra,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en POST /api/obras:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/obras
 * Actualiza una obra existente
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, name, address, estado } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: 'id es obligatorio',
        },
        { status: 400 }
      );
    }

    // Verificar que la obra existe
    const existingObra = await prisma.obra.findUnique({
      where: { id },
    });

    if (!existingObra) {
      return NextResponse.json(
        {
          success: false,
          message: 'La obra especificada no existe',
        },
        { status: 404 }
      );
    }

    // Preparar datos de actualización
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (estado !== undefined) updateData.estado = estado;

    // Actualizar la obra
    const updatedObra = await prisma.obra.update({
      where: { id },
      data: updateData,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            tareas: true,
          },
        },
      },
    });

    // Auditoría: registrar actualización de obra
    await auditEvent({ orgId: updatedObra.orgId, tipo: "OBRA_ACTUALIZADA", descripcion: updatedObra.name });

    return NextResponse.json(
      {
        success: true,
        message: 'Obra actualizada exitosamente',
        data: updatedObra,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en PATCH /api/obras:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/obras
 * Elimina una obra por ID
 */
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: 'id es obligatorio',
        },
        { status: 400 }
      );
    }

    // Verificar que la obra existe
    const existingObra = await prisma.obra.findUnique({
      where: { id },
    });

    if (!existingObra) {
      return NextResponse.json(
        {
          success: false,
          message: 'La obra especificada no existe',
        },
        { status: 404 }
      );
    }

    // Auditoría: registrar eliminación de obra (antes de eliminar)
    await auditEvent({ orgId: existingObra.orgId, tipo: "OBRA_ELIMINADA", descripcion: existingObra.name });

    // Eliminar la obra
    await prisma.obra.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Obra eliminada exitosamente',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en DELETE /api/obras:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
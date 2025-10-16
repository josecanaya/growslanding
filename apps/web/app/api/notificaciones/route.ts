import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notificaciones
 * Lista todas las notificaciones (si la tabla no existe, la crea)
 */
export async function GET() {
  try {
    // Crear tabla si no existe
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.notificaciones (
        id uuid primary key default gen_random_uuid(),
        org_id uuid references organizations(id) on delete cascade,
        mensaje text,
        leida boolean default false,
        created_at timestamptz default now()
      );
    `);

    const notificaciones = await prisma.$queryRaw`
      SELECT 
        id,
        org_id as "orgId",
        mensaje,
        leida,
        created_at as "createdAt"
      FROM notificaciones 
      ORDER BY created_at DESC
    `;

    return NextResponse.json({
      success: true,
      data: notificaciones,
      count: Array.isArray(notificaciones) ? notificaciones.length : 0,
    }, { status: 200 });
  } catch (error) {
    console.error('Error en GET /api/notificaciones:', error);
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
 * POST /api/notificaciones
 * Crea una nueva notificación
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orgId, mensaje } = body;

    if (!orgId || !mensaje) {
      return NextResponse.json(
        {
          success: false,
          message: 'orgId y mensaje son obligatorios',
        },
        { status: 400 }
      );
    }

    // Crear tabla si no existe
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.notificaciones (
        id uuid primary key default gen_random_uuid(),
        org_id uuid references organizations(id) on delete cascade,
        mensaje text,
        leida boolean default false,
        created_at timestamptz default now()
      );
    `);

    // Crear notificación
    const result = await prisma.$queryRaw`
      INSERT INTO notificaciones (org_id, mensaje)
      VALUES (${orgId}, ${mensaje})
      RETURNING 
        id,
        org_id as "orgId",
        mensaje,
        leida,
        created_at as "createdAt"
    `;

    const notificacion = Array.isArray(result) ? result[0] : result;

    return NextResponse.json(
      {
        success: true,
        message: 'Notificación creada exitosamente',
        data: notificacion,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en POST /api/notificaciones:', error);
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
 * PATCH /api/notificaciones
 * Marca una notificación como leída
 */
export async function PATCH(request: Request) {
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

    // Crear tabla si no existe
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.notificaciones (
        id uuid primary key default gen_random_uuid(),
        org_id uuid references organizations(id) on delete cascade,
        mensaje text,
        leida boolean default false,
        created_at timestamptz default now()
      );
    `);

    // Verificar que la notificación existe
    const existingNotificacion = await prisma.$queryRaw`
      SELECT id FROM notificaciones WHERE id = ${id}
    `;

    if (!Array.isArray(existingNotificacion) || existingNotificacion.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'La notificación especificada no existe',
        },
        { status: 404 }
      );
    }

    // Marcar como leída
    const result = await prisma.$queryRaw`
      UPDATE notificaciones 
      SET leida = true 
      WHERE id = ${id}
      RETURNING 
        id,
        org_id as "orgId",
        mensaje,
        leida,
        created_at as "createdAt"
    `;

    const notificacion = Array.isArray(result) ? result[0] : result;

    return NextResponse.json(
      {
        success: true,
        message: 'Notificación marcada como leída',
        data: notificacion,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error en PATCH /api/notificaciones:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor',
      },
      { status: 500 }
    );
  }
}
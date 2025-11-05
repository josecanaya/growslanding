import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import type { Database } from '@/lib/types/supabase.gen';

export const runtime = 'nodejs';

// GET: Listar socios de una cuadrilla
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cuadrillaId } = await params;
    const organizacionId = request.headers.get('x-organizacion-id');

    if (!organizacionId) {
      return NextResponse.json(
        { success: false, error: 'Organización requerida' },
        { status: 400 }
      );
    }

    const supabase = createServiceSupabaseClient();

    // Verificar que la cuadrilla existe y pertenece a la organización
    const { data: cuadrilla, error: cuadrillaError } = await supabase
      .from('cuadrillas')
      .select('id, org_id')
      .eq('id', cuadrillaId)
      .eq('org_id', organizacionId)
      .single();

    if (cuadrillaError || !cuadrilla) {
      return NextResponse.json(
        { success: false, error: 'Cuadrilla no encontrada' },
        { status: 404 }
      );
    }

    // Obtener socios de la cuadrilla con sus datos completos
    const { data: relaciones, error: relacionesError } = await supabase
      .from('cuadrilla_socios')
      .select(`
        id,
        rol_en_cuadrilla,
        activo,
        created_at,
        socio:socios(
          id,
          nombre,
          email,
          telefono,
          rol,
          status
        )
      `)
      .eq('cuadrilla_id', cuadrillaId)
      .eq('activo', true)
      .order('created_at', { ascending: true });

    if (relacionesError) {
      console.error('[CUADRILLA_SOCIOS_GET_ERROR]', relacionesError);
      return NextResponse.json(
        { success: false, error: 'Error al obtener socios de la cuadrilla', details: relacionesError.message },
        { status: 500 }
      );
    }

    // Formatear respuesta
    const socios = relaciones?.map((rel: any) => ({
      id: rel.id,
      rol_cuadrilla: rel.rol_en_cuadrilla,
      activo: rel.activo,
      created_at: rel.created_at,
      socio: rel.socio,
    })) || [];

    return NextResponse.json({
      success: true,
      data: socios,
      meta: {
        cuadrilla_id: cuadrillaId,
        total_socios: socios.length,
      },
    });
  } catch (error) {
    console.error('[ERROR_CUADRILLA_SOCIOS_GET]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno al obtener socios',
      },
      { status: 500 }
    );
  }
}

// POST: Agregar socio a cuadrilla
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cuadrillaId } = await params;
    const organizacionId = request.headers.get('x-organizacion-id');

    if (!organizacionId) {
      return NextResponse.json(
        { success: false, error: 'Organización requerida' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const schema = z.object({
      socio_id: z.string().uuid('socio_id debe ser un UUID válido'),
      rol: z.enum(['encargado', 'oficial', 'ayudante', 'integrante']).default('integrante'),
    });

    const { socio_id, rol } = schema.parse(body);

    const supabase = createServiceSupabaseClient();

    // Verificar que la cuadrilla existe y pertenece a la organización
    const { data: cuadrilla, error: cuadrillaError } = await supabase
      .from('cuadrillas')
      .select('id, org_id')
      .eq('id', cuadrillaId)
      .eq('org_id', organizacionId)
      .single();

    if (cuadrillaError || !cuadrilla) {
      return NextResponse.json(
        { success: false, error: 'Cuadrilla no encontrada' },
        { status: 404 }
      );
    }

    // Verificar que el socio existe y pertenece a la organización
    const { data: socio, error: socioError } = await supabase
      .from('socios')
      .select('id, org_id, nombre, email')
      .eq('id', socio_id)
      .eq('org_id', organizacionId)
      .single();

    if (socioError || !socio) {
      return NextResponse.json(
        { success: false, error: 'Socio no encontrado o no pertenece a la organización' },
        { status: 404 }
      );
    }

    // Verificar si ya existe la relación (puede estar inactiva)
    const { data: relacionExistente } = await supabase
      .from('cuadrilla_socios')
      .select('id, activo')
      .eq('cuadrilla_id', cuadrillaId)
      .eq('socio_id', socio_id)
      .maybeSingle();

    let resultado;

    if (relacionExistente) {
      // Si existe pero está inactiva, reactivarla
      if (!relacionExistente.activo) {
        const { data, error } = await supabase
          .from('cuadrilla_socios')
          .update({ activo: true, rol_en_cuadrilla: rol })
          .eq('id', relacionExistente.id)
          .select(`
            id,
            rol_en_cuadrilla,
            activo,
            socio:socios(id, nombre, email, telefono)
          `)
          .single();

        if (error) {
          throw error;
        }

        resultado = data;
      } else {
        // Si ya está activa, actualizar solo el rol
        const { data, error } = await supabase
          .from('cuadrilla_socios')
          .update({ rol_en_cuadrilla: rol })
          .eq('id', relacionExistente.id)
          .select(`
            id,
            rol_en_cuadrilla,
            activo,
            socio:socios(id, nombre, email, telefono)
          `)
          .single();

        if (error) {
          throw error;
        }

        resultado = data;
      }
    } else {
      // Crear nueva relación
      const { data, error } = await supabase
        .from('cuadrilla_socios')
        .insert({
          cuadrilla_id: cuadrillaId,
          socio_id: socio_id,
          rol_en_cuadrilla: rol,
          activo: true,
        })
        .select(`
          id,
          rol_en_cuadrilla,
          activo,
          socio:socios(id, nombre, email, telefono)
        `)
        .single();

      if (error) {
        // Si es error de duplicado, intentar reactivar
        if (error.code === '23505') {
          const { data: reactivada } = await supabase
            .from('cuadrilla_socios')
            .update({ activo: true, rol_en_cuadrilla: rol })
            .eq('cuadrilla_id', cuadrillaId)
            .eq('socio_id', socio_id)
            .select(`
              id,
              rol_en_cuadrilla,
              activo,
              socio:socios(id, nombre, email, telefono)
            `)
            .single();

          resultado = reactivada;
        } else {
          throw error;
        }
      } else {
        resultado = data;
      }
    }

    console.log('[CUADRILLA_SOCIOS_POST] Socio agregado:', {
      cuadrilla_id: cuadrillaId,
      socio_id,
      rol,
      socio_nombre: socio.nombre,
    });

    return NextResponse.json({
      success: true,
      data: resultado,
      message: `Socio ${socio.nombre} agregado a la cuadrilla como ${rol}`,
    }, { status: 201 });
  } catch (error) {
    console.error('[ERROR_CUADRILLA_SOCIOS_POST]', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno al agregar socio',
      },
      { status: 500 }
    );
  }
}

// DELETE: Remover socio de cuadrilla (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: cuadrillaId } = await params;
    const { searchParams } = new URL(request.url);
    const socio_id = searchParams.get('socio_id');
    const organizacionId = request.headers.get('x-organizacion-id');

    if (!socio_id) {
      return NextResponse.json(
        { success: false, error: 'socio_id requerido en query params' },
        { status: 400 }
      );
    }

    if (!organizacionId) {
      return NextResponse.json(
        { success: false, error: 'Organización requerida' },
        { status: 400 }
      );
    }

    const supabase = createServiceSupabaseClient();

    // Verificar que la cuadrilla existe y pertenece a la organización
    const { data: cuadrilla, error: cuadrillaError } = await supabase
      .from('cuadrillas')
      .select('id, org_id')
      .eq('id', cuadrillaId)
      .eq('org_id', organizacionId)
      .single();

    if (cuadrillaError || !cuadrilla) {
      return NextResponse.json(
        { success: false, error: 'Cuadrilla no encontrada' },
        { status: 404 }
      );
    }

    // Soft delete: marcar como inactivo en lugar de eliminar
    const { error: updateError } = await supabase
      .from('cuadrilla_socios')
      .update({ activo: false })
      .eq('cuadrilla_id', cuadrillaId)
      .eq('socio_id', socio_id);

    if (updateError) {
      console.error('[CUADRILLA_SOCIOS_DELETE_ERROR]', updateError);
      return NextResponse.json(
        { success: false, error: 'Error al remover socio de la cuadrilla', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('[CUADRILLA_SOCIOS_DELETE] Socio removido:', {
      cuadrilla_id: cuadrillaId,
      socio_id,
    });

    return NextResponse.json({
      success: true,
      message: 'Socio removido de la cuadrilla exitosamente',
    });
  } catch (error) {
    console.error('[ERROR_CUADRILLA_SOCIOS_DELETE]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno al remover socio',
      },
      { status: 500 }
    );
  }
}


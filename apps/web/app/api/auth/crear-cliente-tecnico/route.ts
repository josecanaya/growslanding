import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { z } from 'zod';

const CrearClienteTecnicoSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  nombre: z.string().min(1),
  telefono: z.string().optional(),
  ciudad: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CrearClienteTecnicoSchema.parse(body);
    const { userId, email, nombre, telefono, ciudad } = validatedData;

    const serviceSupabase = createServiceSupabaseClient();

    console.log('[CREAR_CLIENTE_TECNICO] Configurando usuario:', { userId, email, nombre });

    // Verificar si el usuario ya tiene rol y organización
    const { data: user, error: userError } = await serviceSupabase.auth.admin.getUserById(userId);

    if (userError || !user.user) {
      console.error('[ERROR_GET_USER]', userError);
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado', details: userError?.message },
        { status: 404 }
      );
    }

    const existingRole = user.user.user_metadata?.role || user.user.app_metadata?.role;
    const existingOrgId = user.user.user_metadata?.org_id;

    // Si ya tiene rol y org_id, no hacer nada
    if (existingRole === 'CLIENTE_TECNICO' && existingOrgId) {
      console.log('[CREAR_CLIENTE_TECNICO] Usuario ya configurado');
      return NextResponse.json({
        success: true,
        message: 'Usuario ya configurado',
        data: {
          orgId: existingOrgId,
        },
      });
    }

    // Buscar organización existente por email o nombre
    let orgId = existingOrgId;
    
    if (!orgId) {
      // Buscar organización existente
      const { data: existingOrg } = await serviceSupabase
        .from('organizations')
        .select('id, name')
        .eq('name', nombre)
        .maybeSingle();

      if (existingOrg) {
        orgId = existingOrg.id;
        console.log('[CREAR_CLIENTE_TECNICO] Organización existente encontrada:', orgId);
      } else {
        // Crear nueva organización
        const { data: orgData, error: orgError } = await serviceSupabase
          .from('organizations')
          .insert([
            {
              name: nombre,
              address: ciudad || '',
            },
          ])
          .select('id')
          .single();

        if (orgError) {
          console.error('[ERROR_CREAR_ORG]', orgError);
          return NextResponse.json(
            { success: false, error: 'Error al crear la organización', details: orgError.message },
            { status: 500 }
          );
        }

        orgId = orgData.id;
        console.log('[CREAR_CLIENTE_TECNICO] Organización creada:', orgId);
      }
    }

    // Actualizar user_metadata con role y org_id
    const { error: updateError } = await serviceSupabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...user.user.user_metadata,
        full_name: nombre,
        role: 'CLIENTE_TECNICO',
        telefono: telefono || null,
        ciudad: ciudad || null,
        org_id: orgId,
      },
    });

    if (updateError) {
      console.error('[ERROR_UPDATE_METADATA]', updateError);
      return NextResponse.json(
        { success: false, error: 'Error al actualizar metadata', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('[CREAR_CLIENTE_TECNICO] Metadata actualizada correctamente');

    return NextResponse.json({
      success: true,
      message: 'CLIENTE_TECNICO configurado correctamente',
      data: {
        orgId,
        userId,
      },
    });
  } catch (error: any) {
    console.error('[ERROR_CREAR_CLIENTE_TECNICO]', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno',
        details: process.env.NODE_ENV === 'development' ? {
          message: error?.message,
          stack: error?.stack,
        } : undefined,
      },
      { status: 500 }
    );
  }
}




import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';

/**
 * Endpoint para vincular el user_id de Supabase Auth con el registro en la tabla socios
 * Se ejecuta cuando un socio ya autenticado entra al panel y no tiene user_id vinculado
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const supabase = createServiceSupabaseClient();

    // Buscar socio por email
    const { data: socio, error: socioError } = await supabase
      .from('socios')
      .select('id, org_id, nombre, email, estado')
      .eq('email', user.email || '')
      .maybeSingle();

    if (socioError || !socio) {
      return NextResponse.json(
        { success: false, error: 'Socio no encontrado' },
        { status: 404 }
      );
    }

    // Type assertion: socio has the expected structure
    const socioRecord = socio as { id: string; org_id: string; nombre: string; email: string | null; estado: string | null };

    if (socioRecord.estado !== 'activo') {
      return NextResponse.json(
        { success: false, error: 'Socio inactivo' },
        { status: 403 }
      );
    }

    // Note: user_id field may not exist in socios table, so we skip this check

    // Vincular user_id
    const updateData: any = {};

    // Intentar actualizar user_id si el campo existe
    try {
      updateData.user_id = user.id;
      
      // También actualizar email si existe el campo
      if (user.email && !socioRecord.email) {
        updateData.email = user.email;
      }
    } catch (e) {
      // Si el campo no existe, continuar sin él
      console.warn('[WARNING] Campo user_id no disponible en tabla socios');
    }

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('socios')
        .update(updateData)
        .eq('id', socioRecord.id);

      if (updateError) {
        console.error('[ERROR_VINCULAR_USER_ID]', updateError);
        // No fallar si el campo no existe, solo loguear
        if (updateError.message?.includes('column') || updateError.code === '42703') {
          return NextResponse.json({
            success: false,
            error: 'Campo user_id no disponible en la tabla socios',
            hint: 'Se requiere agregar el campo user_id UUID REFERENCES auth.users(id) a la tabla socios',
          }, { status: 500 });
        }
        throw updateError;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario vinculado correctamente',
      data: {
        socio_id: socioRecord.id,
        user_id: user.id,
        nombre: socioRecord.nombre,
      },
    });
  } catch (error) {
    console.error('[ERROR_VINCULAR_USUARIO]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno al vincular usuario',
      },
      { status: 500 }
    );
  }
}


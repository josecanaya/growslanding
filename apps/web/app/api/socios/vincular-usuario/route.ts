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
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const supabase = createServiceSupabaseClient();

    // Buscar socio por email o contacto
    const { data: socio, error: socioError } = await supabase
      .from('socios')
      .select('id, org_id, nombre, contacto, email, user_id, status')
      .or(`contacto.eq.${user.email},email.eq.${user.email}`)
      .maybeSingle();

    if (socioError || !socio) {
      return NextResponse.json(
        { success: false, error: 'Socio no encontrado' },
        { status: 404 }
      );
    }

    if (socio.status !== 'activo') {
      return NextResponse.json(
        { success: false, error: 'Socio inactivo' },
        { status: 403 }
      );
    }

    // Si ya tiene user_id vinculado y es el mismo, no hacer nada
    if (socio.user_id === user.id) {
      return NextResponse.json({
        success: true,
        message: 'Usuario ya vinculado',
        data: { socio_id: socio.id },
      });
    }

    // Vincular user_id
    const updateData: any = {};

    // Intentar actualizar user_id si el campo existe
    try {
      updateData.user_id = user.id;
      
      // También actualizar email si existe el campo
      if (user.email && !socio.email) {
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
        .eq('id', socio.id);

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
        socio_id: socio.id,
        user_id: user.id,
        nombre: socio.nombre,
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


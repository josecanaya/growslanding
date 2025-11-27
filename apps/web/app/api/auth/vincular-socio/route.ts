import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, telefono } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId es requerido' },
        { status: 400 }
      );
    }

    const supabase = createServiceSupabaseClient();

    // Buscar socio pendiente por email o teléfono
    let socio = null;
    
    if (email) {
      const { data: socioPorEmail } = await supabase
        .from('socios')
        .select('id, nombre, email, telefono, estado, org_id')
        .eq('email', email)
        .eq('estado', 'pendiente')
        .maybeSingle();
      
      if (socioPorEmail) {
        socio = socioPorEmail;
      }
    }

    if (!socio && telefono) {
      const { data: socioPorTelefono } = await supabase
        .from('socios')
        .select('id, nombre, email, telefono, estado, org_id')
        .eq('telefono', telefono)
        .eq('estado', 'pendiente')
        .maybeSingle();
      
      if (socioPorTelefono) {
        socio = socioPorTelefono;
      }
    }

    if (!socio) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No estás invitado. Pedile a tu arquitecto que te registre.' 
        },
        { status: 403 }
      );
    }

    // Actualizar estado del socio a activo
    // NOTA: user_id no existe en la tabla socios, solo actualizamos el estado
    const { error: linkError } = await supabase
      .from('socios')
      .update({
        estado: 'activo',
      })
      .eq('id', socio.id);

    if (linkError) {
      console.error('[ERROR_VINCULAR_SOCIO]', linkError);
      return NextResponse.json(
        { success: false, error: 'Error al vincular socio', details: linkError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        socioId: socio.id,
        nombre: socio.nombre,
      },
    });
  } catch (error: any) {
    console.error('[ERROR_VINCULAR_SOCIO]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno',
      },
      { status: 500 }
    );
  }
}


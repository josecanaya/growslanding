import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

const SignupSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  telefono: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = SignupSchema.parse(body);
    const { email, password, telefono } = validatedData;

    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore as any });

    // Crear cuenta en Supabase Auth
    // NOTA: Para deshabilitar confirmación de email, configurar en Supabase Dashboard:
    // Authentication > Settings > Email Auth > "Enable email confirmations" = OFF
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          telefono: telefono || null,
        },
      },
    });

    if (signUpError) {
      console.error('[ERROR_SIGNUP]', signUpError);
      return NextResponse.json(
        { success: false, error: signUpError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, error: 'No se pudo crear el usuario' },
        { status: 500 }
      );
    }

    // Buscar socio por email o teléfono
    const serviceSupabase = createServiceSupabaseClient();
    
    let socio = null;
    if (email) {
      const { data: socioPorEmail } = await serviceSupabase
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
      const { data: socioPorTelefono } = await serviceSupabase
        .from('socios')
        .select('id, nombre, email, telefono, estado, org_id')
        .eq('telefono', telefono)
        .eq('estado', 'pendiente')
        .maybeSingle();
      
      if (socioPorTelefono) {
        socio = socioPorTelefono;
      }

    }

    // Si no existe socio con invitación, bloquear
    if (!socio) {
      // Eliminar el usuario creado si no tiene invitación
      try {
        await serviceSupabase.auth.admin.deleteUser(authData.user.id);
      } catch (deleteError) {
        console.warn('[WARNING_DELETE_USER]', deleteError);
      }

      return NextResponse.json(
        { 
          success: false, 
          error: 'Tu arquitecto debe invitarte primero. No tienes una invitación válida.' 
        },
        { status: 403 }
      );
    }

    // Vincular user_id al socio
    const { error: linkError } = await serviceSupabase
      .from('socios')
      .update({
        user_id: authData.user.id,
        estado: 'activo',
      })
      .eq('id', socio.id);

    if (linkError) {
      console.error('[ERROR_LINK_SOCIO]', linkError);
      // Continuar aunque falle el link, el usuario ya está creado
    }

    // Obtener sesión para el usuario
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      // Si no hay sesión, intentar hacer sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError || !signInData.session) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Cuenta creada pero no se pudo iniciar sesión. Por favor, inicia sesión manualmente.' 
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cuenta creada exitosamente',
      data: {
        userId: authData.user.id,
        socioId: socio.id,
      },
    });
  } catch (error: any) {
    console.error('[ERROR_SIGNUP]', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno al crear cuenta',
        details: process.env.NODE_ENV === 'development' ? {
          message: error?.message,
          stack: error?.stack,
        } : undefined,
      },
      { status: 500 }
    );
  }
}

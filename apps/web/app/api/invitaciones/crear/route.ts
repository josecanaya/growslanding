import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { z } from 'zod';

const CrearInvitacionSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefono: z.string().min(1, 'El teléfono es requerido'),
  especialidad: z.string().min(1, 'La especialidad es requerida'),
});

export async function POST(request: NextRequest) {
  try {
    console.log('[INVITACIONES_CREAR] Iniciando request');
    const body = await request.json();
    console.log('[INVITACIONES_CREAR] Body recibido:', body);
    
    const organizacionId = request.headers.get('x-organizacion-id');
    const usuarioId = request.headers.get('x-usuario-id');
    console.log('[INVITACIONES_CREAR] Headers:', { organizacionId, usuarioId });

    if (!organizacionId || !usuarioId) {
      console.error('[INVITACIONES_CREAR] Headers faltantes:', { organizacionId, usuarioId });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Organización y usuario requeridos',
          details: 'No se encontraron los headers x-organizacion-id o x-usuario-id. Asegúrate de estar autenticado.'
        },
        { status: 400 }
      );
    }

    // Validar datos
    const validatedData = CrearInvitacionSchema.parse(body);
    const { nombre, email, telefono, especialidad } = validatedData;
    console.log('[INVITACIONES_CREAR] Datos validados:', { nombre, email, telefono, especialidad });

    const supabase = createServiceSupabaseClient();

    // Verificar si ya existe un socio con ese email o teléfono en esta organización
    // IMPORTANTE: Verificar ambos campos por separado para evitar duplicados
    const { data: sociosExistentes, error: checkError } = await supabase
      .from('socios')
      .select('id, estado, email, telefono, nombre')
      .eq('org_id', organizacionId)
      .or(`email.eq.${email},telefono.eq.${telefono}`);

    if (checkError) {
      console.error('[ERROR_CHECK_DUPLICADOS]', checkError);
    }

    // Verificar si hay un socio activo o pendiente (no inactivo)
    const socioActivo = sociosExistentes?.find(s => s.estado !== 'inactivo');
    
    if (socioActivo) {
      console.log('[INVITACIONES_CREAR] Socio existente encontrado:', {
        id: socioActivo.id,
        nombre: socioActivo.nombre,
        email: socioActivo.email,
        telefono: socioActivo.telefono,
        estado: socioActivo.estado,
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ya existe un socio con este email o teléfono',
          details: `El socio "${socioActivo.nombre || socioActivo.email || socioActivo.telefono}" (${socioActivo.estado}) ya está registrado en tu organización.`
        },
        { status: 409 }
      );
    }

    // Crear registro en socios con estado "pendiente"
    // Usar solo las columnas que existen en Supabase:
    // id, org_id, nombre, telefono, email, created_at, estado, especialidad
    // NOTA: rol ya no existe, se eliminó de Supabase
    const datosInsert: any = {
      org_id: organizacionId,
      nombre,
      email,
      telefono,
      especialidad,
      estado: 'pendiente',
    };

    console.log('[INVITACIONES_CREAR] Intentando insertar socio con datos:', datosInsert);
    
    const { data: socio, error: socioError } = await supabase
      .from('socios')
      .insert(datosInsert)
      .select('id, nombre, email, telefono, especialidad')
      .single();

    if (socioError) {
      console.error('[ERROR_CREAR_INVITACION] Error completo:', {
        error: socioError,
        message: socioError.message,
        details: socioError.details,
        hint: socioError.hint,
        code: socioError.code,
        datosInsert,
      });
      
      // Si el error es por columna faltante, intentar sin especialidad
      if (socioError.message?.includes('column') || socioError.code === '42703' || socioError.code === 'PGRST204') {
        // Si el error es por especialidad, intentar sin ella
        if (socioError.message?.includes('especialidad')) {
          const datosSinEspecialidad = { ...datosInsert };
          delete datosSinEspecialidad.especialidad;
          
          const { data: socioSimplificado, error: errorSimplificado } = await supabase
            .from('socios')
            .insert(datosSinEspecialidad)
            .select('id, nombre, email, telefono')
            .single();
          
          if (errorSimplificado) {
            return NextResponse.json(
              { 
                success: false, 
                error: 'Error al crear la invitación', 
                details: errorSimplificado.message,
                hint: 'Verifica que la tabla socios tenga las columnas: org_id, nombre, email, telefono, estado, created_at. Opcional: especialidad'
              },
              { status: 500 }
            );
          }
          
          // Usar el socio simplificado y continuar con el flujo normal
          const socioParaEnviar = socioSimplificado;
          
          // Enviar Magic Link por email
          const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                            (process.env.NODE_ENV === 'development' 
                              ? 'http://localhost:3000' 
                              : 'https://app.grows.com.ar');
          const redirectUrl = `${appBaseUrl}/auth/invite-accept?socio_id=${socioParaEnviar.id}`;

          const { error: otpError } = await supabase.auth.signInWithOtp({
            email: email,
            options: {
              emailRedirectTo: redirectUrl,
              data: {
                socio_id: socioParaEnviar.id,
                telefono: telefono,
                especialidad: especialidad,
                org_id: organizacionId,
                nombre: nombre,
              },
            },
          });

          if (otpError) {
            console.error('[ERROR_SEND_OTP]', otpError);
            return NextResponse.json(
              { 
                success: false, 
                error: 'Error al enviar el link de invitación por email', 
                details: otpError.message,
              },
              { status: 500 }
            );
          }

          const telefonoLimpio = telefono.replace(/[^0-9]/g, '');
          const mensajeWhatsApp = encodeURIComponent(
            `Hola ${nombre}! Te invitaron a unirte a GROWS. Revisá tu email (${email}) para recibir el link de acceso.`
          );
          const whatsappUrl = `https://wa.me/${telefonoLimpio}?text=${mensajeWhatsApp}`;

          return NextResponse.json({
            success: true,
            data: {
              magicLinkEmail: redirectUrl,
              whatsappUrl: whatsappUrl,
              socioId: socioParaEnviar.id,
            },
            message: `Invitación creada. Se envió un link de acceso por email a ${email}`,
            warning: 'La especialidad no se guardó porque la columna no existe en la tabla',
          });
        }
      }
      
      return NextResponse.json(
        { success: false, error: 'Error al crear la invitación', details: socioError.message },
        { status: 500 }
      );
    }

    if (!socio || !socio.id) {
      return NextResponse.json(
        { success: false, error: 'Error al crear la invitación: no se pudo obtener el ID' },
        { status: 500 }
      );
    }

    // Enviar Magic Link por email usando signInWithOtp()
    // Esto SÍ envía el email automáticamente (a diferencia de generateLink)
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                      (process.env.NODE_ENV === 'development' 
                        ? 'http://localhost:3000' 
                        : 'https://app.grows.com.ar');
    const redirectUrl = `${appBaseUrl}/auth/invite-accept?socio_id=${socio.id}`;

    console.log('[INVITACIONES_CREAR] Enviando Magic Link por email a:', email, 'Redirect:', redirectUrl);
    
    try {
      // signInWithOtp() envía el email automáticamente con el Magic Link
      const { data: otpData, error: otpError } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            socio_id: socio.id,
            telefono: telefono,
            especialidad: especialidad,
            org_id: organizacionId,
            nombre: nombre,
          },
        },
      });

      if (otpError) {
        console.error('[ERROR_SEND_OTP] Error al enviar Magic Link por email:', otpError);
        return NextResponse.json(
          { 
            success: false, 
            error: 'Error al enviar el link de invitación por email', 
            details: otpError.message || 'No se pudo enviar el email',
            debug: process.env.NODE_ENV === 'development' ? { otpError } : undefined,
          },
          { status: 500 }
        );
      }
      
      console.log('[INVITACIONES_CREAR] Magic Link enviado por email exitosamente');
      
      // Generar link de WhatsApp con el redirectUrl
      // NOTA: El usuario recibirá el Magic Link por email, pero también podemos enviar el link por WhatsApp
      const mensajeWhatsApp = encodeURIComponent(
        `Hola ${nombre}! Te invitaron a unirte a GROWS. Revisá tu email (${email}) para recibir el link de acceso.`
      );
      const telefonoLimpio = telefono.replace(/[^0-9]/g, ''); // Solo números
      const whatsappUrl = `https://wa.me/${telefonoLimpio}?text=${mensajeWhatsApp}`;

      return NextResponse.json({
        success: true,
        data: {
          magicLinkEmail: redirectUrl, // URL de redirección (el Magic Link real viene por email)
          whatsappUrl: whatsappUrl,
          socioId: socio.id,
        },
        message: `Invitación creada. Se envió un link de acceso por email a ${email}`,
      });
    } catch (otpException: any) {
      console.error('[ERROR_SEND_OTP_EXCEPTION]', otpException);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error al enviar el link de invitación por email', 
          details: otpException?.message || 'Excepción al enviar email',
          debug: process.env.NODE_ENV === 'development' ? { 
            message: otpException?.message,
            stack: otpException?.stack,
          } : undefined,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[ERROR_CREAR_INVITACION]', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno al crear invitación',
        details: process.env.NODE_ENV === 'development' ? {
          message: error?.message,
          stack: error?.stack,
        } : undefined,
      },
      { status: 500 }
    );
  }
}


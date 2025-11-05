import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { z } from 'zod';

const InvitarSocioSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido').optional(),
  telefono: z.string().optional(),
  rol: z.enum(['constructor', 'lider', 'socio']).default('constructor'),
  especialidad: z.string().optional(),
}).refine(
  (data) => data.email || data.telefono,
  {
    message: 'Debe proporcionar email o teléfono',
    path: ['email'],
  }
);

export async function POST(request: NextRequest) {
  try {
    console.log('[DEBUG_INVITAR_SOCIO] Iniciando request');
    
    const body = await request.json();
    console.log('[DEBUG_INVITAR_SOCIO] Body recibido:', body);
    
    const organizacionId = request.headers.get('x-organizacion-id');
    const usuarioId = request.headers.get('x-usuario-id');
    
    console.log('[DEBUG_INVITAR_SOCIO] Headers:', { organizacionId, usuarioId });

    if (!organizacionId || !usuarioId) {
      return NextResponse.json(
        { success: false, error: 'Organización y usuario requeridos' },
        { status: 400 }
      );
    }

    // Validar datos
    const validatedData = InvitarSocioSchema.parse(body);
    const { nombre, email, telefono, rol, especialidad } = validatedData;
    
    console.log('[DEBUG_INVITAR_SOCIO] Datos validados:', { nombre, email, telefono, rol, especialidad });

    const supabase = createServiceSupabaseClient();

    // Verificar si ya existe un socio con ese email o teléfono
    if (email) {
      const { data: socioExistente } = await supabase
        .from('socios')
        .select('id, status')
        .eq('org_id', organizacionId)
        .eq('email', email)
        .maybeSingle();

      if (socioExistente && socioExistente.status !== 'inactivo') {
        return NextResponse.json(
          { success: false, error: 'Ya existe un socio activo con este email' },
          { status: 409 }
        );
      }
    }

    if (telefono) {
      const { data: socioExistente } = await supabase
        .from('socios')
        .select('id, status')
        .eq('org_id', organizacionId)
        .eq('telefono', telefono)
        .maybeSingle();

      if (socioExistente && socioExistente.status !== 'inactivo') {
        return NextResponse.json(
          { success: false, error: 'Ya existe un socio activo con este teléfono' },
          { status: 409 }
        );
      }
    }

    // Preparar datos para insertar
    // NOTA: La tabla 'socios' tiene una estructura mínima. Intentamos con campos básicos primero.
    
    // Campos mínimos que deberían existir (org_id, nombre, rol)
    // NO agregamos 'status' porque puede no existir en la tabla
    const datosInsert: any = {
      org_id: organizacionId,
      nombre,
      rol,
    };

    // IMPORTANTE: Siempre agregar email si está disponible (necesario para autenticación)
    if (email) {
      datosInsert.email = email;
    }
    if (telefono) datosInsert.telefono = telefono;

    // Insertar socio
    console.log('[DEBUG_INVITAR_SOCIO] Insertando socio con datos:', datosInsert);
    
    const { data: socio, error: socioError } = await supabase
      .from('socios')
      .insert(datosInsert)
      .select('id, nombre, email, telefono, rol')
      .single();

    if (socioError) {
      console.error('[ERROR_INVITAR_SOCIO_INSERT]', {
        error: socioError,
        message: socioError?.message,
        details: socioError?.details,
        hint: socioError?.hint,
        code: socioError?.code,
        datosInsert,
      });
      
      // Si falla por campos inexistentes, intentar sin ellos
      if (socioError.message?.includes('column') || socioError.code === '42703' || socioError.code === 'PGRST204') {
        console.log('[DEBUG_INVITAR_SOCIO] Intentando inserción simplificada sin campos opcionales');
        console.log('[DEBUG_INVITAR_SOCIO] Error de campo:', socioError.message);
        
        // Extraer el nombre del campo que falló del mensaje de error
        const campoFaltante = socioError.message?.match(/'([^']+)'/)?.[1];
        console.log('[DEBUG_INVITAR_SOCIO] Campo faltante detectado:', campoFaltante);
        
        // Intentar con campos mínimos absolutos (org_id, nombre, rol)
        // PERO intentar mantener email si está disponible (es crítico para autenticación)
        const datosSimplificados: any = {
          org_id: organizacionId,
          nombre,
          rol,
        };
        
        // Si el campo faltante NO es email, intentar agregarlo de nuevo (es crítico para autenticación)
        if (campoFaltante !== 'email' && email) {
          datosSimplificados.email = email;
        }
        
        // Solo agregar telefono si no es el campo que falló
        if (telefono && campoFaltante !== 'telefono') datosSimplificados.telefono = telefono;

        const { data: socioSimplificado, error: errorSimplificado } = await supabase
          .from('socios')
          .insert(datosSimplificados)
          .select('id, nombre, email, telefono, rol')
          .single();

        if (errorSimplificado) {
          return NextResponse.json(
            { success: false, error: 'Error al crear socio', details: errorSimplificado.message },
            { status: 500 }
          );
        }

        // Continuar con socio simplificado
        const socioCreado = socioSimplificado;
        
        // Enviar magic link si hay email
        if (email) {
          try {
            const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
            const redirectUrl = `${origin}/auth/invite-accept?socio_id=${socioCreado.id}`;
            
            console.log('[DEBUG_INVITAR_SOCIO] Enviando magic link a:', email, 'Redirect:', redirectUrl);

            const { error: inviteError } = await supabase.auth.signInWithOtp({
              email,
              options: {
                emailRedirectTo: redirectUrl,
                data: {
                  socio_id: socioCreado.id,
                  org_id: organizacionId,
                  rol,
                  nombre,
                },
              },
            });

            if (inviteError) {
              console.warn('[WARNING_INVITE_EMAIL]', inviteError);
              // No fallar, el socio ya fue creado
            }
          } catch (inviteErr) {
            console.warn('[WARNING_INVITE_EMAIL_EXCEPTION]', inviteErr);
          }
        }

        // Crear cuadrilla si es líder con especialidad
        let cuadrillaIdSimplificada: string | null = null;
        if (rol === 'lider' && especialidad) {
          try {
            const cuadrillaData = {
              org_id: organizacionId,
              obra_id: null,
              nombre: `${nombre} - ${especialidad}`,
              encargado: nombre,
              especialidad: especialidad,
              estado: 'Disponible',
            };

            const { data: cuadrilla, error: cuadrillaError } = await supabase
              .from('cuadrillas')
              .insert([cuadrillaData])
              .select('id')
              .single();

            if (!cuadrillaError && cuadrilla) {
              cuadrillaIdSimplificada = cuadrilla.id;
              console.log('[INFO] Cuadrilla creada automáticamente para líder:', cuadrilla.id);
            }
          } catch (err) {
            console.warn('[WARNING] Error al crear cuadrilla automáticamente:', err);
          }
        }

        return NextResponse.json({
          success: true,
          data: {
            socio_id: socioCreado.id,
            nombre: socioCreado.nombre,
            email: socioCreado.email || email || null,
            telefono: socioCreado.telefono || telefono || null,
            rol: socioCreado.rol,
            especialidad: especialidad || null, // Se usa solo para crear cuadrilla, no se guarda en socio
            cuadrilla_id: cuadrillaIdSimplificada,
          },
          message: cuadrillaIdSimplificada
            ? email 
              ? `Socio invitado y cuadrilla creada. Se envió un link de acceso a ${email}`
              : `Socio creado y cuadrilla creada con teléfono: ${telefono}`
            : email 
            ? `Socio invitado. Se envió un link de acceso a ${email}`
            : telefono
            ? `Socio creado con teléfono: ${telefono}. La invitación por SMS no está disponible aún.`
            : `Socio creado exitosamente`,
        });
      }

      return NextResponse.json(
        { success: false, error: 'Error al crear socio', details: socioError.message },
        { status: 500 }
      );
    }

    // Verificar que socio fue creado correctamente
    if (!socio || !socio.id) {
      console.error('[ERROR_INVITAR_SOCIO] Socio no fue creado correctamente');
      return NextResponse.json(
        { success: false, error: 'Error al crear socio: no se pudo obtener el ID' },
        { status: 500 }
      );
    }

    console.log('[DEBUG_INVITAR_SOCIO] Socio creado exitosamente:', socio.id);

    // Enviar magic link si hay email
    if (email && socio) {
      try {
        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const redirectUrl = `${origin}/auth/invite-accept?socio_id=${socio.id}`;

        console.log('[DEBUG_INVITAR_SOCIO] Enviando magic link a:', email, 'Redirect:', redirectUrl);

        const { error: inviteError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              socio_id: socio.id,
              org_id: organizacionId,
              rol,
              nombre,
            },
          },
        });

        if (inviteError) {
          console.warn('[WARNING_INVITE_EMAIL]', inviteError);
          // No fallar, el socio ya fue creado
        }
      } catch (inviteErr) {
        console.warn('[WARNING_INVITE_EMAIL_EXCEPTION]', inviteErr);
      }
    }

    // Si es teléfono sin email, enviar SMS (requiere configuración adicional)
    if (telefono && !email) {
      // TODO: Implementar SMS OTP cuando esté configurado
      console.info('[INFO] SMS OTP no implementado aún. Socio creado pero sin invitación enviada.');
    }

    // Si el rol es 'lider' y tiene especialidad, crear automáticamente una cuadrilla
    let cuadrillaId: string | null = null;
    if (rol === 'lider' && especialidad && socio) {
      try {
        const cuadrillaData = {
          org_id: organizacionId,
          obra_id: null,
          nombre: `${nombre} - ${especialidad}`,
          encargado: nombre,
          especialidad: especialidad,
          estado: 'Disponible',
        };

        console.log('[DEBUG_CREAR_CUADRILLA] Datos:', cuadrillaData);

        const { data: cuadrilla, error: cuadrillaError } = await supabase
          .from('cuadrillas')
          .insert([cuadrillaData])
          .select('id')
          .single();

        if (!cuadrillaError && cuadrilla) {
          cuadrillaId = cuadrilla.id;
          console.log('[INFO] Cuadrilla creada automáticamente para líder:', cuadrilla.id);
        } else {
          console.error('[ERROR_CREAR_CUADRILLA]', {
            error: cuadrillaError,
            message: cuadrillaError?.message,
            details: cuadrillaError?.details,
            hint: cuadrillaError?.hint,
            code: cuadrillaError?.code,
          });
        }
      } catch (err: any) {
        console.error('[ERROR_CREAR_CUADRILLA_EXCEPTION]', {
          error: err,
          message: err?.message,
          stack: err?.stack,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        socio_id: socio.id,
        nombre: socio.nombre,
        email: socio.email || email || null,
        telefono: socio.telefono || telefono || null,
        rol: socio.rol,
        especialidad: especialidad || null, // Se usa solo para crear cuadrilla, no se guarda en socio
        cuadrilla_id: cuadrillaId,
      },
      message: cuadrillaId 
        ? email 
          ? `Socio invitado y cuadrilla creada. Se envió un link de acceso a ${email}`
          : `Socio creado y cuadrilla creada con teléfono: ${telefono}`
        : email 
        ? `Socio invitado. Se envió un link de acceso a ${email}`
        : telefono
        ? `Socio creado con teléfono: ${telefono}. La invitación por SMS no está disponible aún.`
        : `Socio creado exitosamente`,
    });
  } catch (error: any) {
    console.error('[ERROR_INVITAR_SOCIO] Error completo:', {
      message: error?.message || String(error),
      stack: error?.stack,
      name: error?.name,
      cause: error?.cause,
      errorType: typeof error,
      errorKeys: error ? Object.keys(error) : [],
      errorString: JSON.stringify(error, null, 2),
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno al invitar socio',
        details: process.env.NODE_ENV === 'development' ? {
          message: error?.message,
          stack: error?.stack,
          name: error?.name,
        } : undefined,
      },
      { status: 500 }
    );
  }
}


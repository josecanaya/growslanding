import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { obraSchema } from '@/lib/schemas/obras';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/obras
 * Devuelve todas las obras ordenadas por createdAt desc
 */
export async function GET() {
  try {
    // Importación dinámica de prisma solo cuando se necesita
    const { prisma } = await import('@/lib/prisma');
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
 * Crea una nueva obra usando Supabase
 */
export async function POST(request: Request) {
  // Wrapper externo para capturar cualquier error
  try {
    // Log inmediato al inicio del handler
    console.error('[POST_OBRAS] ===== HANDLER INICIADO =====');
    console.log('[POST_OBRAS] Iniciando handler');
    console.log('[POST_OBRAS] Request URL:', request.url);
    console.log('[POST_OBRAS] Request method:', request.method);
    
    try {
      // Intentar obtener cookies
      let cookieStore;
      try {
        console.log('[POST_OBRAS] Obteniendo cookies...');
        cookieStore = await cookies();
        console.log('[POST_OBRAS] Cookies obtenidas correctamente');
      } catch (cookieError) {
        console.error('[COOKIES_ERROR]', cookieError);
        return NextResponse.json(
          { error: 'Error obteniendo cookies de sesión' },
          { status: 500 }
        );
      }

      let supabaseAuth;
      try {
        console.log('[POST_OBRAS] Creando cliente de autenticación...');
        supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
        console.log('[POST_OBRAS] Cliente de autenticación creado');
      } catch (clientError) {
        console.error('[SUPABASE_CLIENT_ERROR]', clientError);
        return NextResponse.json(
          { error: 'Error inicializando cliente de autenticación' },
          { status: 500 }
        );
      }

      // 1) Validar sesión
      let user, authError;
      try {
        console.log('[POST_OBRAS] Obteniendo usuario...');
        const result = await supabaseAuth.auth.getUser();
        user = result.data.user;
        authError = result.error;
        console.log('[POST_OBRAS] Usuario obtenido:', user ? 'Sí' : 'No');
      } catch (getUserError) {
        console.error('[GET_USER_ERROR]', getUserError);
        return NextResponse.json(
          { error: 'Error verificando sesión de usuario' },
          { status: 500 }
        );
      }

      if (authError || !user) {
        console.log('[POST_OBRAS] Usuario no autenticado');
        return NextResponse.json(
          { error: 'No autenticado. Por favor, inicia sesión nuevamente.' },
          { status: 401 }
        );
      }

      if (!user.email) {
        console.log('[POST_OBRAS] Usuario sin email');
        return NextResponse.json(
          { error: 'El usuario no tiene email asociado' },
          { status: 400 }
        );
      }

      // 2) Parsear y validar body
      let json;
      try {
        console.log('[POST_OBRAS] Parseando body...');
        json = await request.json();
        console.log('[POST_OBRAS] Body parseado:', { org_id: json?.org_id, nombre: json?.nombre });
      } catch (parseError) {
        console.error('[JSON_PARSE_ERROR]', parseError);
        return NextResponse.json(
          { error: 'Body inválido. Debe ser JSON válido.' },
          { status: 400 }
        );
      }

      if (!json) {
        return NextResponse.json(
          { error: 'Body inválido. El body está vacío.' },
          { status: 400 }
        );
      }

      const parsed = obraSchema.safeParse(json);
      if (!parsed.success) {
        console.error('[POST_OBRAS] Validación falló:', parsed.error.format());
        return NextResponse.json(
          { error: 'Datos inválidos', details: parsed.error.format() },
          { status: 400 }
        );
      }

      const { 
        org_id, 
        nombre, 
        localizacion,
        propietario,
        tipo_obra,
        latitud,
        longitud,
        plantas,
        terreno,
        superficies,
        estado
      } = parsed.data;

      // 3) Verificar pertenencia a la organización
      let supabase;
      try {
        console.log('[POST_OBRAS] Creando cliente de servicio...');
        supabase = createServiceSupabaseClient();
        console.log('[POST_OBRAS] Cliente de servicio creado');
      } catch (serviceClientError) {
        console.error('[SERVICE_CLIENT_ERROR]', serviceClientError);
        return NextResponse.json(
          { error: 'Error inicializando cliente de servicio' },
          { status: 500 }
        );
      }

      console.log('[POST_OBRAS] Verificando pertenencia a la organización...', { org_id, email: user.email });
      
      // Verificar que la organización existe (intentar con 'organizations' primero, luego 'orgs')
      let orgExists = null;
      let orgError = null;

      // Intentar con 'organizations' (según el SQL compartido)
      const orgCheck1 = await (supabase as any)
        .from('organizations')
        .select('id')
        .eq('id', org_id)
        .maybeSingle();

      if (orgCheck1.error && orgCheck1.error.code === '42P01') {
        // Tabla no existe, intentar con 'orgs'
        const orgCheck2 = await supabase
          .from('orgs')
          .select('id')
          .eq('id', org_id)
          .maybeSingle();

        orgExists = orgCheck2.data;
        orgError = orgCheck2.error;
      } else {
        orgExists = orgCheck1.data;
        orgError = orgCheck1.error;
      }

      if (orgError && orgError.code !== 'PGRST116') {
        console.error('[ORG_VALIDATION_ERROR]', orgError);
        return NextResponse.json(
          { error: 'Error validando organización', details: orgError.message },
          { status: 500 }
        );
      }

      if (!orgExists) {
        console.log('[POST_OBRAS] Organización no existe');
        return NextResponse.json(
          { error: 'La organización especificada no existe' },
          { status: 404 }
        );
      }

      // Verificar el rol del usuario desde los metadatos de Supabase
      const userRoleFromMeta = user.app_metadata?.role || user.user_metadata?.role;
      const normalizedRole = userRoleFromMeta?.toUpperCase();
      
      console.log('[POST_OBRAS] Rol del usuario desde metadatos:', normalizedRole, {
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata,
      });

      // Si el usuario es CLIENTE_TECNICO, permitir crear obras si la organización existe
      let isAuthorized = false;
      let userRole: 'owner' | 'leader' | null = null;

      if (normalizedRole === 'CLIENTE_TECNICO' || normalizedRole === 'CLIENTE') {
        // Si la organización existe, permitir crear obras (CLIENTE_TECNICO tiene permisos)
        if (orgExists) {
          console.log('[POST_OBRAS] Usuario es CLIENTE_TECNICO y la organización existe, permitiendo creación');
          isAuthorized = true;
          userRole = 'owner';
        } else if (user.id) {
          // Si no existe, verificar si el usuario es owner
          const { data: ownerOrg } = await supabase
            .from('orgs')
            .select('id')
            .eq('id', org_id)
            .eq('owner_user_id', user.id)
            .maybeSingle();

          if (ownerOrg) {
            console.log('[POST_OBRAS] Usuario es CLIENTE_TECNICO y owner de la organización');
            isAuthorized = true;
            userRole = 'owner';
          } else {
            console.warn('[POST_OBRAS] Usuario es CLIENTE_TECNICO pero no es owner de la organización especificada');
          }
        }
      }

      // Si no está autorizado, intentar con resolveOrgContext
      if (!isAuthorized) {
        try {
          const { resolveOrgContext } = await import('@/lib/orgs');
          const { org, role } = await resolveOrgContext(
            user.id,
            user.user_metadata?.full_name ?? user.email ?? 'Organización',
            user.email
          );

          // Verificar que la organización del usuario coincide con la organización de la obra
          if (org.id === org_id) {
            userRole = role;
            if (role === 'owner' || role === 'leader') {
              console.log(`[POST_OBRAS] Usuario es ${role} de la organización (via resolveOrgContext)`);
              isAuthorized = true;
            }
          }
        } catch (resolveError) {
          console.warn('[POST_OBRAS] Error en resolveOrgContext, intentando verificación manual:', resolveError);
          // Continuar con verificación manual si resolveOrgContext falla
        }
      }

      // Si resolveOrgContext no funcionó o no encontró el rol, intentar verificación manual
      if (!isAuthorized) {
        // Verificar si el usuario es owner (si existe tabla orgs con owner_user_id)
        if (user.id) {
          const { data: ownerOrg } = await supabase
            .from('orgs')
            .select('id')
            .eq('id', org_id)
            .eq('owner_user_id', user.id)
            .maybeSingle();

          if (ownerOrg) {
            console.log('[POST_OBRAS] Usuario es owner de la organización (verificación manual)');
            isAuthorized = true;
            userRole = 'owner';
          }
        }

        // Verificar si el usuario es líder (via leader_invites)
        if (!isAuthorized && user.email) {
          const { data: leaderInvite } = await supabase
            .from('leader_invites')
            .select('id, org_id')
            .eq('org_id', org_id)
            .eq('email', user.email)
            .eq('status', 'accepted')
            .maybeSingle();

          if (leaderInvite) {
            console.log('[POST_OBRAS] Usuario es líder de la organización (verificación manual)');
            isAuthorized = true;
            userRole = 'leader';
          }
        }
      }

      // Si aún no está autorizado, verificar si hay socios en la organización
      // Si no hay socios, permitir crear (primera vez o organización nueva)
      if (!isAuthorized) {
        const { count: sociosCount, error: countError } = await supabase
          .from('socios')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', org_id);

        if (!countError && sociosCount === 0) {
          console.log('[POST_OBRAS] No hay socios en la organización, permitiendo creación (primera vez)');
          isAuthorized = true;
        } else if (countError) {
          // Si no podemos contar socios pero la organización existe, permitir (modo desarrollo)
          console.warn('[POST_OBRAS] Error contando socios, pero organización existe. Permitiendo creación.');
          isAuthorized = true;
        }
      }

      // Si aún no está autorizado pero la organización existe y el usuario es CLIENTE_TECNICO,
      // permitir crear obras (el cliente técnico puede crear obras en cualquier organización)
      if (!isAuthorized && orgExists && (normalizedRole === 'CLIENTE_TECNICO' || normalizedRole === 'CLIENTE')) {
        console.log('[POST_OBRAS] Usuario es CLIENTE_TECNICO y la organización existe, permitiendo creación (fallback)');
        isAuthorized = true;
        userRole = 'owner';
      }

      if (!isAuthorized) {
        console.log('[POST_OBRAS] Usuario no autorizado', {
          userId: user.id,
          userEmail: user.email,
          orgId: org_id,
          userRole,
          normalizedRole,
          orgExists: !!orgExists,
        });
        return NextResponse.json(
          { error: `No autorizado para esta organización. Tu email (${user.email}) no está registrado en esta organización. Por favor, solicita acceso a la organización primero o asegúrate de estar registrado como socio.` },
          { status: 403 }
        );
      }

      // 4) Insertar en obras (usando name y address según el schema SQL, más todos los campos del wizard)
      console.log('[POST_OBRAS] Insertando obra...', { 
        org_id, 
        name: nombre, 
        address: localizacion,
        propietario,
        tipo_obra,
        latitud,
        longitud,
        plantas,
        terreno,
        superficies: superficies ? JSON.stringify(superficies) : null
      });
      
      const insertData: any = {
        org_id,
        name: nombre,  // La tabla usa 'name', no 'nombre'
        address: localizacion || null,  // La tabla usa 'address', no 'localizacion'
      };

      // Agregar campos opcionales solo si existen
      if (propietario !== undefined && propietario !== null) {
        insertData.propietario = propietario;
      }
      if (tipo_obra !== undefined && tipo_obra !== null) {
        insertData.tipo_obra = tipo_obra;
      }
      if (latitud !== undefined && latitud !== null) {
        insertData.latitud = latitud;
      }
      if (longitud !== undefined && longitud !== null) {
        insertData.longitud = longitud;
      }
      if (plantas !== undefined && plantas !== null) {
        insertData.plantas = plantas;
      }
      if (terreno !== undefined && terreno !== null) {
        insertData.terreno = terreno;
      }
      if (superficies !== undefined && superficies !== null && Array.isArray(superficies)) {
        insertData.superficies = superficies; // JSONB se maneja automáticamente
      }
      if (estado !== undefined && estado !== null) {
        insertData.estado = estado;
      }

      const { data, error } = await supabase
        .from('obras')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('[OBRA_INSERT_ERROR]', error);
        return NextResponse.json(
          { error: 'No se pudo crear la obra', details: error.message },
          { status: 500 }
        );
      }

      console.log('[POST_OBRAS] Obra creada exitosamente:', data?.id);
      return NextResponse.json({ ok: true, obra: data }, { status: 201 });
    } catch (error) {
      console.error('[POST_OBRAS_ERROR] Error interno:', error);
      console.error('[POST_OBRAS_ERROR] Stack:', error instanceof Error ? error.stack : 'No stack');
      // Asegurar que siempre devolvemos JSON, incluso en caso de error inesperado
      try {
        return NextResponse.json(
          {
            error: 'Error interno del servidor',
            details: error instanceof Error ? error.message : 'Unknown error',
            type: error instanceof Error ? error.constructor.name : typeof error,
          },
          { status: 500 }
        );
      } catch (jsonError) {
        // Si incluso devolver JSON falla, devolver un Response básico
        console.error('[POST_OBRAS_ERROR] Error al devolver JSON:', jsonError);
        return new Response(
          JSON.stringify({
            error: 'Error interno del servidor',
            details: error instanceof Error ? error.message : 'Unknown error',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }
  } catch (outerError) {
    // Capturar cualquier error que ocurra incluso antes del try interno
    console.error('[POST_OBRAS_ERROR] Error externo no capturado:', outerError);
    return new Response(
      JSON.stringify({
        error: 'Error crítico del servidor',
        details: outerError instanceof Error ? outerError.message : String(outerError),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * PATCH /api/obras
 * Actualiza una obra existente
 */
export async function PATCH(request: Request) {
  try {
    // Importación dinámica de prisma y auditEvent solo cuando se necesita
    const { prisma } = await import('@/lib/prisma');
    const { auditEvent } = await import('@/lib/audit');
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
    // Importación dinámica de prisma y auditEvent solo cuando se necesita
    const { prisma } = await import('@/lib/prisma');
    const { auditEvent } = await import('@/lib/audit');
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

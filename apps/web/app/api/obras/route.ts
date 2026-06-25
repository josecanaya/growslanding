import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { obraSchema } from '@/lib/schemas/obras';
import { listAccessibleOrgIds } from '@/lib/orgs';
import { buildObraInsertRow, stripMissingColumnFromInsert } from '@/lib/obras/obraInsertPayload';

const OBRA_INSERT_SELECT =
  'id, org_id, name, address, estado, created_at, propietario, tipo_obra, latitud, longitud, plantas, terreno, superficies';

type ObrasInsert = Database['public']['Tables']['obras']['Insert'];

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/obras
 * Devuelve todas las obras ordenadas por createdAt desc
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({
      cookies: () => cookieStore as any,
    });
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'No autenticado' }, { status: 401 });
    }

    let supabase;
    try {
      supabase = createServiceSupabaseClient();
    } catch (cfgErr) {
      console.error('[GET /api/obras] Supabase service client:', cfgErr);
      return NextResponse.json(
        {
          success: false,
          message:
            'Falta configuración del servidor: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (.env local).',
        },
        { status: 503 },
      );
    }
    const supabaseAny = supabase as any;
    const allowedOrgIds = await listAccessibleOrgIds(supabase, user.id, user.email);
    if (allowedOrgIds.length === 0) {
      return NextResponse.json({ success: true, data: [], count: 0 }, { status: 200 });
    }

    const { data: obrasRaw, error: obrasError } = await supabaseAny
      .from('obras')
      .select(`
        id,
        org_id,
        name,
        address,
        estado,
        created_at,
        updated_at,
        organizations (
          id,
          name
        )
      `)
      .in('org_id', allowedOrgIds)
      .order('created_at', { ascending: false });

    if (obrasError) {
      console.error('[GET /api/obras] query obras:', obrasError.code, obrasError.message);
      return NextResponse.json(
        {
          success: false,
          message: 'No se pudieron cargar las obras',
          details: obrasError.message,
        },
        { status: 502 },
      );
    }

    const obraIds = (obrasRaw ?? []).map((obra: any) => obra.id);
    const tareasPorObra = new Map<string, number>();

    if (obraIds.length > 0) {
      const { data: tareas, error: tareasError } = await supabaseAny
        .from('tareas')
        .select('obra_id')
        .in('obra_id', obraIds);

      if (tareasError) {
        console.error('[GET /api/obras] conteo tareas:', tareasError.message);
      }

      for (const tarea of tareas ?? []) {
        const obraId = tarea.obra_id as string | null;
        if (!obraId) continue;
        tareasPorObra.set(obraId, (tareasPorObra.get(obraId) ?? 0) + 1);
      }
    }

    const obras = (obrasRaw ?? []).map((obra: any) => {
      const organization = Array.isArray(obra.organizations)
        ? obra.organizations[0]
        : obra.organizations;

      return {
        id: obra.id,
        orgId: obra.org_id,
        name: obra.name,
        address: obra.address,
        estado: obra.estado,
        createdAt: obra.created_at,
        updatedAt: obra.updated_at,
        organization: organization
          ? { id: organization.id, name: organization.name }
          : { id: obra.org_id, name: null },
        _count: {
          tareas: tareasPorObra.get(obra.id) ?? 0,
        },
      };
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
        details: error instanceof Error ? error.message : String(error),
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
        obra_product_kind,
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
          .from('organizations')
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
            .from('organizations')
            .select('id')
            .eq('id', org_id)
            .eq('user_id', user.id)
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
            .from('organizations')
            .select('id')
            .eq('id', org_id)
            .eq('user_id', user.id)
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
            .from('leader_invites' as any)
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

      // 3.5) Validar límites de obras según el plan
      try {
        const { validarLimiteObras } = await import('@/lib/services/plan.service');
        const validacion = await validarLimiteObras(org_id);
        
        if (!validacion.puedeCrear) {
          console.log('[POST_OBRAS] Límite de obras alcanzado', {
            obrasActivas: validacion.obrasActivas,
            limiteObras: validacion.limiteObras,
          });
          return NextResponse.json(
            { 
              error: validacion.mensaje || 'Tu plan no permite crear más obras activas. Actualizá tu plan para continuar.',
              detalles: {
                obrasActivas: validacion.obrasActivas,
                limiteObras: validacion.limiteObras,
              }
            },
            { status: 403 }
          );
        }
      } catch (limiteError) {
        console.error('[POST_OBRAS] Error validando límite de obras:', limiteError);
        // Continuar si hay error (no bloquear en caso de problemas de configuración)
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
      
      let insertRow = buildObraInsertRow({
        org_id,
        name: nombre,
        address: localizacion || null,
        propietario: propietario ?? null,
        tipo_obra: tipo_obra ?? null,
        latitud: latitud ?? null,
        longitud: longitud ?? null,
        plantas: plantas ?? null,
        terreno: terreno ?? null,
        superficies: superficies ?? null,
        estado: estado ?? null,
        obra_product_kind: obra_product_kind ?? null,
      });

      let data: Record<string, unknown> | null = null;
      let error: { message?: string } | null = null;

      for (let attempt = 0; attempt < 6; attempt += 1) {
        const result = await supabase
          .from('obras')
          .insert([insertRow as ObrasInsert])
          .select(OBRA_INSERT_SELECT)
          .single();
        data = result.data;
        error = result.error;
        if (!error) break;
        const stripped = stripMissingColumnFromInsert(insertRow, String(error.message ?? ''));
        if (!stripped) break;
        insertRow = stripped;
      }

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
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({
      cookies: () => cookieStore as any,
    });
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'No autenticado' }, { status: 401 });
    }

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;
    const allowedOrgIds = await listAccessibleOrgIds(supabase, user.id, user.email);
    if (allowedOrgIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No pertenece a ninguna organización' },
        { status: 403 }
      );
    }
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

    const { data: existingObra, error: existingError } = await supabaseAny
      .from('obras')
      .select('id, org_id, name')
      .eq('id', id)
      .in('org_id', allowedOrgIds)
      .maybeSingle();

    if (existingError || !existingObra) {
      return NextResponse.json(
        {
          success: false,
          message: 'La obra especificada no existe',
        },
        { status: 404 }
      );
    }

    // Preparar datos de actualización
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (estado !== undefined) updateData.estado = estado;
    updateData.updated_at = new Date().toISOString();

    const { data: updatedObra, error: updateError } = await supabaseAny
      .from('obras')
      .update(updateData)
      .eq('id', id)
      .eq('org_id', existingObra.org_id)
      .select('id, org_id, name, address, estado, created_at, updated_at')
      .maybeSingle();

    if (updateError || !updatedObra) {
      return NextResponse.json(
        {
          success: false,
          message: updateError?.message || 'No se pudo actualizar la obra',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Obra actualizada exitosamente',
        data: {
          id: updatedObra.id,
          orgId: updatedObra.org_id,
          name: updatedObra.name,
          address: updatedObra.address,
          estado: updatedObra.estado,
          createdAt: updatedObra.created_at,
          updatedAt: updatedObra.updated_at,
        },
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
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({
      cookies: () => cookieStore as any,
    });
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, message: 'No autenticado' }, { status: 401 });
    }

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;
    const allowedOrgIds = await listAccessibleOrgIds(supabase, user.id, user.email);
    if (allowedOrgIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No pertenece a ninguna organización' },
        { status: 403 }
      );
    }
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

    const { data: existingObra, error: existingError } = await supabaseAny
      .from('obras')
      .select('id, org_id, name')
      .eq('id', id)
      .in('org_id', allowedOrgIds)
      .maybeSingle();

    if (existingError || !existingObra) {
      return NextResponse.json(
        {
          success: false,
          message: 'La obra especificada no existe',
        },
        { status: 404 }
      );
    }

    const { error: deleteError } = await supabaseAny
      .from('obras')
      .delete()
      .eq('id', id)
      .eq('org_id', existingObra.org_id);
    if (deleteError) {
      return NextResponse.json(
        {
          success: false,
          message: deleteError.message || 'No se pudo eliminar la obra',
        },
        { status: 500 }
      );
    }

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


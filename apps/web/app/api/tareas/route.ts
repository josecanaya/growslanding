import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { z } from 'zod';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { CrearTareaSchema, CrearTareaDesdeObraSimpleSchema } from '../../../lib/schemas';
import { PermisoService } from '@/lib/services/permiso.service';
import type { Database } from '@/lib/types/supabase.gen';
import { socioEsContactoDeOrg } from '@/lib/socios/agenda-access';

async function puedeCrearTareasEnOrganizacion(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  user: { id: string; email?: string | null },
  orgId: string,
): Promise<boolean> {
  const rol = await PermisoService.obtenerRolEnOrganizacion(user.id, orgId);
  if (rol === 'CLIENTE') return true;

  if (user.email) {
    const { data } = await (supabase as any)
      .from('leader_invites')
      .select('id')
      .eq('org_id', orgId)
      .eq('email', user.email)
      .eq('status', 'accepted')
      .maybeSingle();
    if (data) return true;
  }
  return false;
}

export async function POST(request: NextRequest) {
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
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsedFull = CrearTareaSchema.safeParse(body);
    const parsedSimple = CrearTareaDesdeObraSimpleSchema.safeParse(body);

    if (!parsedFull.success && !parsedSimple.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datos inválidos',
          details: {
            completo: parsedFull.success ? null : parsedFull.error.flatten(),
            simple: parsedSimple.success ? null : parsedSimple.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    type InsertPack = {
      obra_id: string;
      elemento_id: string;
      org_id: string;
      title: string;
      descripcion: string | null;
      bloques_planificados: number;
      dias_presupuesto: number;
      etapa: string | null;
      fecha_fin_estimada: string | null;
    };

    let pack: InsertPack;

    if (parsedFull.success) {
      const validatedData = parsedFull.data;
      const { data: elemento, error: elementoError } = await supabase
        .from('elementos')
        .select('id, obra_id, obras!inner(org_id)')
        .eq('id', validatedData.elementoId)
        .single();

      if (elementoError || !elemento) {
        return NextResponse.json(
          { success: false, error: 'Elemento no encontrado' },
          { status: 404 }
        );
      }

      const obra = (elemento as any).obras;
      if (!obra?.org_id) {
        return NextResponse.json(
          { success: false, error: 'Elemento sin organización asociada' },
          { status: 400 }
        );
      }

      const n = Math.max(
        1,
        validatedData.bloques ?? validatedData.duracionEstimada ?? 1,
      );

      pack = {
        obra_id: elemento.obra_id,
        elemento_id: validatedData.elementoId,
        org_id: obra.org_id as string,
        title: validatedData.nombre,
        descripcion: validatedData.descripcion ?? null,
        bloques_planificados: n,
        dias_presupuesto: n,
        etapa: validatedData.etapa,
        fecha_fin_estimada: validatedData.duracionEstimada
          ? new Date(
              Date.now() + validatedData.duracionEstimada * 24 * 60 * 60 * 1000,
            ).toISOString()
          : null,
      };
    } else if (parsedSimple.success) {
      const s = parsedSimple.data;
      const { data: obraRow, error: obraErr } = await supabase
        .from('obras')
        .select('id, org_id')
        .eq('id', s.obra_id)
        .single();

      if (obraErr || !obraRow?.org_id) {
        return NextResponse.json(
          { success: false, error: 'Obra no encontrada' },
          { status: 404 }
        );
      }

      const { data: primerElemento, error: elErr } = await supabase
        .from('elementos')
        .select('id')
        .eq('obra_id', s.obra_id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (elErr || !primerElemento) {
        return NextResponse.json(
          {
            success: false,
            error:
              'La obra no tiene elementos en el catálogo. Agregá al menos un elemento a la obra antes de crear la tarea.',
          },
          { status: 400 }
        );
      }

      const n = Math.max(1, s.bloques);
      pack = {
        obra_id: s.obra_id,
        elemento_id: primerElemento.id,
        org_id: obraRow.org_id,
        title: s.nombre,
        descripcion: s.descripcion ?? null,
        bloques_planificados: n,
        dias_presupuesto: n,
        etapa: null,
        fecha_fin_estimada: null,
      };
    } else {
      return NextResponse.json(
        { success: false, error: 'No se pudo interpretar el cuerpo de la solicitud' },
        { status: 400 }
      );
    }

    const okPerm = await puedeCrearTareasEnOrganizacion(supabase, user, pack.org_id);
    if (!okPerm) {
      return NextResponse.json(
        {
          success: false,
          error: 'No tiene permisos para crear tareas en esta organización',
        },
        { status: 403 }
      );
    }

    const { data: tarea, error: tareaError } = await supabase
      .from('tareas')
      .insert({
        obra_id: pack.obra_id,
        elemento_id: pack.elemento_id,
        org_id: pack.org_id,
        title: pack.title,
        descripcion: pack.descripcion,
        estado: 'pendiente',
        prioridad: 'MEDIA',
        avance: 0,
        bloques_planificados: pack.bloques_planificados,
        dias_presupuesto: pack.dias_presupuesto,
        etapa: pack.etapa,
        fecha_inicio_estimada: null,
        fecha_fin_estimada: pack.fecha_fin_estimada,
      } as any)
      .select(`
        id,
        title,
        descripcion,
        bloques_planificados,
        dias_presupuesto,
        estado,
        responsable,
        responsable_socio_id,
        prioridad,
        avance,
        fecha_inicio_estimada,
        fecha_fin_estimada,
        fecha_inicio_real,
        fecha_fin_real,
        elemento_id,
        obra_id,
        org_id,
        created_at,
        updated_at,
        elemento:elementos(id, nombre, categoria, subcategoria)
      `)
      .single();

    if (tareaError || !tarea) {
      console.error('Error creando tarea:', tareaError);
      return NextResponse.json(
        { success: false, error: tareaError?.message ?? 'Error al crear tarea' },
        { status: 500 }
      );
    }

    let tareaOut: typeof tarea = tarea;

    if (parsedSimple.success && parsedSimple.data.socio_id) {
      const sid = parsedSimple.data.socio_id;
      const puedeAsignar = await socioEsContactoDeOrg(supabase, sid, pack.org_id);
      if (!puedeAsignar) {
        return NextResponse.json(
          {
            success: false,
            error: 'El contacto no está en tu agenda de socios o no corresponde a esta organización.',
          },
          { status: 403 },
        );
      }

      const { data: socioData } = await supabaseAny
        .from('socios')
        .select('id, nombre, email, telefono, org_id')
        .eq('id', sid)
        .maybeSingle();

      const responsableAsignar =
        socioData?.email || socioData?.telefono || socioData?.nombre || null;

      if (socioData && responsableAsignar) {
        const { data: updated, error: uErr } = await supabaseAny
          .from('tareas')
          .update({
            responsable: responsableAsignar,
            responsable_socio_id: socioData.id,
            cuadrilla_id: socioData.id,
          })
          .eq('id', tarea.id)
          .eq('org_id', pack.org_id)
          .select(
            `
            id,
            title,
            descripcion,
            bloques_planificados,
            dias_presupuesto,
            estado,
            responsable,
            responsable_socio_id,
            prioridad,
            avance,
            fecha_inicio_estimada,
            fecha_fin_estimada,
            elemento_id,
            obra_id,
            org_id,
            created_at,
            updated_at,
            elemento:elementos(id, nombre, categoria, subcategoria)
          `,
          )
          .single();
        if (!uErr && updated) {
          tareaOut = updated;
        }
      }
    }

    const { error: estadoError } = await supabase
      .from('tareas_estados' as any)
      .insert({
        tarea_id: tareaOut.id,
        estado_anterior: null,
        estado_nuevo: 'pendiente',
        actor_tipo: 'CLIENTE_TECNICO',
        actor_id: user.id,
        motivo: 'Tarea creada',
      });

    if (estadoError) {
      console.error('Error creando estado inicial (no crítico):', estadoError);
    }

    return NextResponse.json(
      {
        success: true,
        data: tareaOut,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error en POST /api/tareas:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Datos inválidos', details: error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const orgIdParam = searchParams.get('org_id');
    const obraId = searchParams.get('obra_id');
    const elementoId = searchParams.get('elemento_id');
    const estado = searchParams.get('estado');

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { data: orgClienteRows } = await supabaseAny
      .from('organizations')
      .select('id')
      .eq('user_id', user.id);
    const { data: orgSocioRows } = await supabaseAny
      .from('socios')
      .select('org_id')
      .eq('user_id', user.id);

    const allowedOrgIds = new Set<string>([
      ...(orgClienteRows ?? []).map((org: { id: string }) => org.id),
      ...(orgSocioRows ?? [])
        .map((socio: { org_id: string | null }) => socio.org_id)
        .filter((orgId: string | null): orgId is string => Boolean(orgId)),
    ]);

    if (allowedOrgIds.size === 0) {
      return NextResponse.json(
        { success: false, error: 'No pertenece a ninguna organización' },
        { status: 403 }
      );
    }

    const organizacionId = orgIdParam || Array.from(allowedOrgIds)[0];
    if (!allowedOrgIds.has(organizacionId)) {
      return NextResponse.json(
        { success: false, error: 'No autorizado para la organización solicitada' },
        { status: 403 }
      );
    }

    // Construir query
    let query = supabase
      .from('tareas')
      .select(`
        id,
        title,
        descripcion,
        estado,
        responsable,
        prioridad,
        etapa,
        dias_presupuesto,
        is_critical,
        costo_presupuestado,
        fecha_inicio_estimada,
        fecha_fin_estimada,
        fecha_inicio_real,
        fecha_fin_real,
        avance,
        elemento_id,
        obra_id,
        created_at,
        updated_at,
        elemento:elementos(id, nombre, categoria, subcategoria),
        obra:obras(id, name, address)
      `)
      .eq('org_id', organizacionId);

    // Filtros opcionales
    if (obraId) {
      query = query.eq('obra_id', obraId);
    }

    if (elementoId) {
      query = query.eq('elemento_id', elementoId);
    }

    if (estado) {
      query = query.eq('estado', estado as 'pendiente' | 'en_progreso' | 'para_validar' | 'validada' | 'rechazada');
    }

    // Ordenar por fecha de creación descendente
    query = query.order('created_at', { ascending: false });

    const { data: tareas, error: tareasError } = await query;

    if (tareasError) {
      console.error('Error obteniendo tareas:', tareasError);
      return NextResponse.json(
        { success: false, error: tareasError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: tareas || [],
    });

  } catch (error) {
    console.error('Error en GET /api/tareas:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}

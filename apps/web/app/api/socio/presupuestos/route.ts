import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { IS_DEV_MODE } from '@/lib/config';
import { socioPuedeAccederDatosObra } from '@/lib/socios/agenda-access';
import { resolveSocioRecordForAuthUser } from '@/lib/socios/resolveSocioForAuthUser';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/socio/presupuestos?obra_id=UUID (opcional)
 * Si obra_id está presente: obtiene presupuestos de esa obra
 * Si obra_id no está presente: obtiene lista de obras con presupuestos
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const obraId = searchParams.get('obra_id');

    // Si no hay obra_id, devolver lista de obras con presupuestos
    if (!obraId) {
      if (IS_DEV_MODE) {
        return NextResponse.json({
          obras: [
            {
              obra_id: 'dev-obra-1',
              obra_name: 'Obra de prueba 1',
              direccion_completa: 'Calle Falsa 123',
              fecha_inicio: '2024-01-01',
              pendientes: 5,
              enviados: 2,
              aprobados: 1,
            },
          ],
          devMode: true,
        });
      }

      // Autenticación
      const cookieStore = await cookies();
      const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
      const {
        data: { user },
      } = await supabaseAuth.auth.getUser();

      if (!user?.id) {
        return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
      }

      const supabase = createServiceSupabaseClient();

      const socio = await resolveSocioRecordForAuthUser(supabase, {
        id: user.id,
        email: user.email ?? null,
      });

      if (!socio) {
        return NextResponse.json(
          { message: 'Socio no encontrado' },
          { status: 404 },
        );
      }

      // Obtener todos los presupuestos del socio
      const { data: presupuestosData, error: presupuestosError } = await supabase
        .from('tareas_presupuestos')
        .select(`
          id,
          estado,
          tarea_id,
          tareas!inner (
            obra_id
          )
        `)
        .eq('socio_id', socio.id);

      console.log('[PRESUPUESTOS_GET] Presupuestos encontrados:', presupuestosData?.length || 0);
      console.log('[PRESUPUESTOS_GET] Error:', presupuestosError);

      if (presupuestosError) {
        console.error('[PRESUPUESTOS_GET] Error obteniendo presupuestos:', presupuestosError);
        return NextResponse.json({ obras: [] });
      }

      if (!presupuestosData || presupuestosData.length === 0) {
        console.log('[PRESUPUESTOS_GET] No hay presupuestos para el socio');
        return NextResponse.json({ obras: [] });
      }

      // Obtener obra_ids únicos
      const obraIds = new Set<string>();
      (presupuestosData || []).forEach((p: any) => {
        if (p.tareas?.obra_id) {
          obraIds.add(p.tareas.obra_id);
        } else {
          console.warn('[PRESUPUESTOS_GET] Presupuesto sin obra_id:', p.id);
        }
      });

      console.log('[PRESUPUESTOS_GET] Obra IDs únicos:', Array.from(obraIds));

      if (obraIds.size === 0) {
        console.log('[PRESUPUESTOS_GET] No se encontraron obras asociadas');
        return NextResponse.json({ obras: [] });
      }

      // Obtener datos de las obras
      const { data: obrasData, error: obrasError } = await supabase
        .from('obras')
        .select('id, name, address, propietario, created_at')
        .in('id', Array.from(obraIds));

      console.log('[PRESUPUESTOS_GET] Obras encontradas:', obrasData?.length || 0);
      console.log('[PRESUPUESTOS_GET] Error obras:', obrasError);

      if (obrasError) {
        console.error('[PRESUPUESTOS_GET] Error obteniendo obras:', obrasError);
        return NextResponse.json({ obras: [] });
      }

      if (!obrasData || obrasData.length === 0) {
        console.log('[PRESUPUESTOS_GET] No se encontraron obras en la base de datos');
        return NextResponse.json({ obras: [] });
      }

      // Crear mapa de obras
      const obrasMap = new Map<string, {
        obra_id: string;
        obra_name: string;
        direccion_completa?: string | null;
        fecha_inicio?: string | null;
        pendientes: number;
        enviados: number;
        aprobados: number;
      }>();

      (obrasData || []).forEach((obra: any) => {
        obrasMap.set(obra.id, {
          obra_id: obra.id,
          obra_name: obra.name || 'Sin nombre',
          direccion_completa: obra.address || null,
          fecha_inicio: obra.created_at || null,
          pendientes: 0,
          enviados: 0,
          aprobados: 0,
        });
      });

      // Contar presupuestos por obra y estado
      (presupuestosData || []).forEach((p: any) => {
        const obraId = p.tareas?.obra_id;
        if (!obraId || !obrasMap.has(obraId)) {
          if (!obraId) {
            console.warn('[PRESUPUESTOS_GET] Presupuesto sin obra_id:', p.id);
          } else if (!obrasMap.has(obraId)) {
            console.warn('[PRESUPUESTOS_GET] Obra no encontrada en el mapa:', obraId);
          }
          return;
        }

        const obraData = obrasMap.get(obraId)!;
        const estado = (p.estado || 'PENDIENTE').toUpperCase();
        if (estado === 'PENDIENTE') obraData.pendientes++;
        else if (estado === 'ENVIADO') obraData.enviados++;
        else if (estado === 'APROBADO') obraData.aprobados++;
      });

      const obrasResult = Array.from(obrasMap.values());
      console.log('[PRESUPUESTOS_GET] Resultado final:', obrasResult.length, 'obras');

      return NextResponse.json({
        obras: obrasResult,
      });
    }

    // Si hay obra_id, devolver presupuestos de esa obra específica
    if (IS_DEV_MODE) {
      return NextResponse.json({
        obra: {
          id: obraId,
          name: 'Obra de prueba',
          direccion_completa: 'Calle Falsa 123',
          cantidad_plantas: 2,
          superficie_por_planta: 100,
          coordenadas_lat: -34.6037,
          coordenadas_lng: -58.3816,
          cliente: 'Cliente Test',
          fecha_inicio: '2024-01-01',
        },
        presupuestos: [],
        canvas_nodes: [],
        devMode: true,
      });
    }

    // Autenticación
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const supabase = createServiceSupabaseClient();

    const socio = await resolveSocioRecordForAuthUser(supabase, {
      id: user.id,
      email: user.email ?? null,
    });

    if (!socio) {
      console.error('[PRESUPUESTOS_GET] Socio no encontrado para usuario', user.id);
      return NextResponse.json({ message: 'Socio no encontrado' }, { status: 404 });
    }

    const socioId = socio.id;

    const { data: obra, error: obraError } = await supabase
      .from('obras')
      .select('id, org_id, name, address, propietario, plantas, latitud, longitud, created_at, superficies')
      .eq('id', obraId)
      .maybeSingle();

    if (obraError || !obra) {
      console.error('[PRESUPUESTOS_GET] Error obteniendo obra:', obraError);
      return NextResponse.json(
        { message: 'Obra no encontrada' },
        { status: 404 }
      );
    }

    const obraTyped = obra as any;
    const puedeVer = await socioPuedeAccederDatosObra(supabase, socioId, {
      id: obraTyped.id as string,
      org_id: obraTyped.org_id as string,
    });
    if (!puedeVer) {
      return NextResponse.json(
        { message: 'No tienes acceso a esta obra' },
        { status: 403 }
      );
    }

    // Presupuestos del socio: sin .in(tarea_id, miles de ids) — PostgREST falla o devuelve vacío en obras grandes.
    const { data: presupuestosData, error: presupuestosError } = await supabase
      .from('tareas_presupuestos')
      .select(`
        id,
        tarea_id,
        monto,
        estado,
        notas,
        cantidad,
        unidad,
        created_at,
        updated_at,
        tareas (
          id,
          obra_id,
          title,
          etapa,
          es,
          ef,
          fecha_inicio_estimada,
          fecha_fin_estimada,
          elemento_id,
          canvas_node_id
        )
      `)
      .eq('socio_id', socioId);

    if (presupuestosError) {
      console.error('[PRESUPUESTOS_GET] Error obteniendo presupuestos:', presupuestosError);
      return NextResponse.json({
        obra: {
          id: obraTyped.id,
          name: obraTyped.name || null,
          direccion_completa: obraTyped.address || obraTyped.direccion_completa || null,
          cantidad_plantas: obraTyped.plantas || obraTyped.cantidad_plantas || null,
          superficie_por_planta: obraTyped.superficies?.superficie_por_planta || obraTyped.superficie_por_planta || null,
          coordenadas_lat: obraTyped.latitud || obraTyped.coordenadas_lat || null,
          coordenadas_lng: obraTyped.longitud || obraTyped.coordenadas_lng || null,
          cliente: obraTyped.propietario || obraTyped.cliente || null,
          fecha_inicio: obraTyped.created_at || obraTyped.fecha_inicio || null,
        },
        presupuestos: [],
        canvas_nodes: [],
      });
    }

    const presupuestosFiltrados = (presupuestosData || []).filter(
      (p: { tareas?: { obra_id?: string } | null }) => p.tareas?.obra_id === obraId,
    );

    // Obtener elementos relacionados
    const elementoIds = new Set<string>();
    presupuestosFiltrados.forEach((p: any) => {
      if (p.tareas?.elemento_id) {
        elementoIds.add(p.tareas.elemento_id);
      }
    });

    let elementosMap = new Map();
    if (elementoIds.size > 0) {
      const { data: elementosData, error: elementosError } = await supabase
        .from('elementos')
        .select('id, nombre, planta, altura, cantidad, unidad')
        .in('id', Array.from(elementoIds));

      if (elementosData) {
        elementosMap = new Map(elementosData.map((e: any) => [e.id, e]));
      }
    }

    const { data: canvasNodesData, error: canvasNodesError } = await (supabase as unknown as any)
      .from('canvas_nodes')
      .select('id, parent_id, type, title, created_at, metadata')
      .eq('obra_id', obraId);

    if (canvasNodesError) {
      console.warn('[PRESUPUESTOS_GET] canvas_nodes:', canvasNodesError);
    }

    const canvas_nodes = (canvasNodesData ?? []) as Array<{
      id: string;
      parent_id: string | null;
      type: string;
      title: string;
      created_at: string;
      metadata?: Record<string, unknown> | null;
    }>;

    // Procesar presupuestos y calcular duración sugerida
    const presupuestos = presupuestosFiltrados.map((p: any) => {
      // Calcular duración sugerida
      let duracionSugerida: number | null = null;
      if (p.tareas?.es !== null && p.tareas?.ef !== null) {
        duracionSugerida = (p.tareas.ef ?? 0) - (p.tareas.es ?? 0);
      } else if (p.tareas?.fecha_inicio_estimada && p.tareas?.fecha_fin_estimada) {
        const inicio = new Date(p.tareas.fecha_inicio_estimada);
        const fin = new Date(p.tareas.fecha_fin_estimada);
        if (!isNaN(inicio.getTime()) && !isNaN(fin.getTime())) {
          const diffTime = Math.abs(fin.getTime() - inicio.getTime());
          duracionSugerida = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
      }

      // Extraer dias_reales y observacion de notas si existe (formato JSON)
      let diasReales: number | null = null;
      let observacion: string | null = null;
      if (p.notas) {
        try {
          const notasParsed = JSON.parse(p.notas);
          if (typeof notasParsed.dias_reales === 'number') {
            diasReales = notasParsed.dias_reales;
          }
          if (typeof notasParsed.observacion === 'string' && notasParsed.observacion.trim()) {
            observacion = notasParsed.observacion.trim();
          }
        } catch {
          // Si no es JSON, ignorar
        }
      }

      const elemento = p.tareas?.elemento_id ? elementosMap.get(p.tareas.elemento_id) : null;

      // Priorizar cantidad y unidad desde tareas_presupuestos, si no están, usar elemento
      const cantidad = p.cantidad != null ? p.cantidad : (elemento?.cantidad != null ? elemento.cantidad : null);
      const unidad = p.unidad || elemento?.unidad || null;

      return {
        id: p.id,
        tarea_id: p.tarea_id,
        estado: p.estado || 'PENDIENTE',
        dias_reales: diasReales,
        observacion,
        monto: p.monto,
        created_at: p.created_at || null,
        updated_at: p.updated_at || null,
        tarea: p.tareas ? {
          id: p.tareas.id,
          title: p.tareas.title,
          etapa: p.tareas.etapa,
          es: p.tareas.es,
          ef: p.tareas.ef,
          duracion_sugerida: duracionSugerida,
          canvas_node_id: p.tareas.canvas_node_id ?? null,
        } : null,
        elemento: elemento ? {
          id: elemento.id,
          nombre: elemento.nombre,
          planta: elemento.planta,
          altura: elemento.altura,
          cantidad: cantidad,
          unidad: unidad,
        } : (cantidad != null || unidad ? {
          id: null,
          nombre: null,
          planta: null,
          altura: null,
          cantidad: cantidad,
          unidad: unidad,
        } : null),
      };
    });

      return NextResponse.json({
        obra: {
          id: obraTyped.id,
          name: obraTyped.name || null,
          direccion_completa: obraTyped.address || obraTyped.direccion_completa || null,
          cantidad_plantas: obraTyped.plantas || obraTyped.cantidad_plantas || null,
          superficie_por_planta: obraTyped.superficies?.superficie_por_planta || obraTyped.superficie_por_planta || null,
          coordenadas_lat: obraTyped.latitud || obraTyped.coordenadas_lat || null,
          coordenadas_lng: obraTyped.longitud || obraTyped.coordenadas_lng || null,
          cliente: obraTyped.propietario || obraTyped.cliente || null,
          fecha_inicio: obraTyped.created_at || obraTyped.fecha_inicio || null,
        },
        presupuestos,
        canvas_nodes,
      });
  } catch (error) {
    console.error('[PRESUPUESTOS_GET] Error:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


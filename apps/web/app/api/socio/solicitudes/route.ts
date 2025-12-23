import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';
import { IS_DEV_MODE } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/socio/solicitudes
 * Obtiene obras que están recibiendo presupuestos (solicitudes de trabajo)
 * Retorna obras que tienen tareas sin presupuesto del socio, o con presupuesto ENVIADO
 */
export async function GET(request: NextRequest) {
  try {
    if (IS_DEV_MODE) {
      return NextResponse.json({
        solicitudes: [
          {
            obra_id: 'dev-obra-1',
            obra_name: 'Obra de prueba 1',
            direccion_completa: 'Calle Falsa 123, Villa Crespo, CABA',
            zona: 'Villa Crespo, CABA',
            fecha_inicio_estimada: '2025-01-15',
            duracion_estimada_dias: 20,
            tipo_trabajo: 'Construcción mampostería',
            etapa: 'ESTRUCTURA',
            estado_solicitud: 'RECIBIENDO_PRESUPUESTOS',
            tiene_presupuesto_socio: false,
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

    if (!user || !user.email) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const supabase = createServiceSupabaseClient();

    // Obtener socio_id
    const { data: socio, error: socioError } = await supabase
      .from('socios')
      .select('id, org_id, email')
      .eq('email', user.email)
      .maybeSingle();

    if (socioError || !socio) {
      return NextResponse.json(
        { message: 'Socio no encontrado' },
        { status: 404 }
      );
    }

    const socioId = socio.id;
    const orgId = socio.org_id;

    // Obtener todas las obras de la organización
    const { data: obrasData, error: obrasError } = await supabase
      .from('obras')
      .select('id, name, address, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (obrasError) {
      return NextResponse.json({ solicitudes: [] });
    }

    if (!obrasData || obrasData.length === 0) {
      return NextResponse.json({ solicitudes: [] });
    }

    const obraIds = obrasData.map(o => o.id);

    // Obtener todas las tareas de estas obras
    const { data: tareasData, error: tareasError } = await supabase
      .from('tareas')
      .select('id, obra_id, title, etapa, fecha_inicio_estimada, fecha_fin_estimada')
      .in('obra_id', obraIds);

    if (tareasError || !tareasData || tareasData.length === 0) {
      return NextResponse.json({ solicitudes: [] });
    }

    const tareaIds = tareasData.map(t => t.id);

    // Obtener presupuestos del socio para estas tareas
    const { data: presupuestosData, error: presupuestosError } = await supabase
      .from('tareas_presupuestos')
      .select('id, tarea_id, estado')
      .eq('socio_id', socioId)
      .in('tarea_id', tareaIds);

    // Crear mapa de presupuestos por tarea
    const presupuestosPorTarea = new Map<string, string>();
    (presupuestosData || []).forEach((p: any) => {
      const estado = (p.estado || 'PENDIENTE').toUpperCase();
      // Solo considerar ENVIADO o APROBADO como "tiene presupuesto"
      if (estado === 'ENVIADO' || estado === 'APROBADO') {
        if (!presupuestosPorTarea.has(p.tarea_id) || presupuestosPorTarea.get(p.tarea_id) !== 'APROBADO') {
          presupuestosPorTarea.set(p.tarea_id, estado);
        }
      }
    });

    // Agrupar tareas por obra y determinar qué obras están "recibiendo presupuestos"
    const obrasConTareas = new Map<string, {
      obra_id: string;
      obra_name: string;
      direccion_completa: string;
      zona: string;
      fecha_inicio_estimada: string | null;
      duracion_estimada_dias: number | null;
      tipo_trabajo: string;
      etapa: string | null;
      estado_solicitud: string;
      tiene_presupuesto_socio: boolean;
    }>();

    tareasData.forEach((tarea: any) => {
      const obraId = tarea.obra_id;
      const obra = obrasData.find(o => o.id === obraId);
      if (!obra) return;

      const tienePresupuesto = presupuestosPorTarea.has(tarea.id);
      const estadoPresupuesto = presupuestosPorTarea.get(tarea.id);

      // Solo incluir obras que NO tienen todos los presupuestos aprobados
      // O que tienen presupuestos ENVIADOS (pendientes de aprobación)
      if (!tienePresupuesto || estadoPresupuesto === 'ENVIADO') {
        if (!obrasConTareas.has(obraId)) {
          // Extraer zona de la dirección (últimas 2 partes separadas por coma)
          const direccion = obra.address || '';
          const partesDireccion = direccion.split(',').map(p => p.trim()).filter(p => p);
          const zona = partesDireccion.length >= 2 
            ? partesDireccion.slice(-2).join(', ') 
            : direccion || 'Sin dirección';

          // Calcular duración estimada
          let duracionDias: number | null = null;
          if (tarea.fecha_inicio_estimada && tarea.fecha_fin_estimada) {
            const inicio = new Date(tarea.fecha_inicio_estimada);
            const fin = new Date(tarea.fecha_fin_estimada);
            if (!isNaN(inicio.getTime()) && !isNaN(fin.getTime())) {
              const diffTime = Math.abs(fin.getTime() - inicio.getTime());
              duracionDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
          }

          obrasConTareas.set(obraId, {
            obra_id: obraId,
            obra_name: obra.name || 'Sin nombre',
            direccion_completa: direccion,
            zona,
            fecha_inicio_estimada: tarea.fecha_inicio_estimada || obra.created_at || null,
            duracion_estimada_dias: duracionDias,
            tipo_trabajo: tarea.title || 'Sin título',
            etapa: tarea.etapa || null,
            estado_solicitud: estadoPresupuesto === 'ENVIADO' ? 'PRESUPUESTO_ENVIADO' : 'RECIBIENDO_PRESUPUESTOS',
            tiene_presupuesto_socio: tienePresupuesto,
          });
        } else {
          // Actualizar si hay más información útil
          const actual = obrasConTareas.get(obraId)!;
          if (estadoPresupuesto === 'ENVIADO' && actual.estado_solicitud === 'RECIBIENDO_PRESUPUESTOS') {
            actual.estado_solicitud = 'PRESUPUESTO_ENVIADO';
          }
          if (actual.tipo_trabajo === 'Sin título' && tarea.title) {
            actual.tipo_trabajo = tarea.title;
          }
        }
      }
    });

    const solicitudes = Array.from(obrasConTareas.values())
      .sort((a, b) => {
        // Ordenar: primero las que no tienen presupuesto, luego las enviadas
        if (a.tiene_presupuesto_socio !== b.tiene_presupuesto_socio) {
          return a.tiene_presupuesto_socio ? 1 : -1;
        }
        // Luego por fecha de creación (más recientes primero)
        const fechaA = a.fecha_inicio_estimada ? new Date(a.fecha_inicio_estimada).getTime() : 0;
        const fechaB = b.fecha_inicio_estimada ? new Date(b.fecha_inicio_estimada).getTime() : 0;
        return fechaB - fechaA;
      })
      .slice(0, 10); // Limitar a 10 solicitudes

    return NextResponse.json({
      solicitudes,
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Error interno del servidor', solicitudes: [] },
      { status: 500 }
    );
  }
}




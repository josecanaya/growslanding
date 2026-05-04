import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';

export const runtime = 'nodejs';

type Payload = {
  socio_id: string;
  obra_id: string;
  tarea_ids: string[];
  comentario?: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Payload;
    const { socio_id, obra_id, tarea_ids, comentario } = body;

    console.log('[POST /api/presupuestos/rechazar] Parámetros:', { socio_id, obra_id, tarea_ids, comentario });

    if (!socio_id || !obra_id || !tarea_ids || tarea_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'socio_id, obra_id y tarea_ids son requeridos' },
        { status: 400 }
      );
    }

    // Autenticación
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({
      cookies: () => cookieStore as any,
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }

    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    // Obtener org_id desde la obra
    const { data: obraData, error: obraError } = await supabaseAny
      .from('obras')
      .select('org_id')
      .eq('id', obra_id)
      .maybeSingle();

    if (obraError || !obraData) {
      return NextResponse.json(
        { success: false, error: 'Obra no encontrada' },
        { status: 404 }
      );
    }

    const orgId = obraData.org_id;

    // Obtener datos del socio (permitir org_id desincronizado; la obra ya fija orgId)
    let { data: socioData, error: socioError } = await supabaseAny
      .from('socios')
      .select('id, nombre, email, org_id')
      .eq('id', socio_id)
      .eq('org_id', orgId)
      .maybeSingle();

    if (socioError) {
      return NextResponse.json(
        { success: false, error: socioError.message ?? 'Error al cargar el socio' },
        { status: 500 },
      );
    }

    if (!socioData) {
      const fb = await supabaseAny
        .from('socios')
        .select('id, nombre, email, org_id')
        .eq('id', socio_id)
        .maybeSingle();
      if (fb.error) {
        return NextResponse.json(
          { success: false, error: fb.error.message ?? 'Error al cargar el socio' },
          { status: 500 },
        );
      }
      socioData = fb.data;
    }

    if (!socioData) {
      return NextResponse.json(
        { success: false, error: 'Socio no encontrado' },
        { status: 404 },
      );
    }

    // 1. Buscar y eliminar PDFs asociados a estas tareas del socio
    // Los PDFs se guardan en eventos con pdf_path que contiene "presupuestos/{obra_id}/{tarea_id}.pdf"
    const { data: eventosConPdf, error: eventosError } = await supabaseAny
      .from('eventos')
      .select('id, pdf_path, tarea_id')
      .in('tarea_id', tarea_ids)
      .not('pdf_path', 'is', null)
      .like('pdf_path', `%presupuestos/${obra_id}%`);

    if (eventosError) {
      console.warn('[POST /api/presupuestos/rechazar] Error obteniendo eventos con PDF:', eventosError);
    }

    // Eliminar PDFs del Storage
    if (eventosConPdf && eventosConPdf.length > 0) {
      const pdfPaths = eventosConPdf
        .map((e: any) => e.pdf_path)
        .filter((path: string) => path && path.startsWith('actas/'))
        .map((path: string) => path.replace(/^actas\//, '')); // Remover prefijo 'actas/' para el storage

      if (pdfPaths.length > 0) {
        console.log('[POST /api/presupuestos/rechazar] Eliminando PDFs:', pdfPaths);
        const { error: deleteError } = await supabaseAny.storage
          .from('actas')
          .remove(pdfPaths);

        if (deleteError) {
          console.warn('[POST /api/presupuestos/rechazar] Error eliminando PDFs del storage:', deleteError);
          // No fallar si no se puede eliminar el PDF, continuar con el rechazo
        } else {
          console.log('[POST /api/presupuestos/rechazar] PDFs eliminados exitosamente');
        }

        // Eliminar los eventos que contenían los PDFs
        const eventoIds = eventosConPdf.map((e: any) => e.id);
        const { error: deleteEventosError } = await supabaseAny
          .from('eventos')
          .delete()
          .in('id', eventoIds);

        if (deleteEventosError) {
          console.warn('[POST /api/presupuestos/rechazar] Error eliminando eventos:', deleteEventosError);
        }
      }
    }

    // 2. Actualizar presupuestos a RECHAZADO
    const { error: updateError } = await supabaseAny
      .from('tareas_presupuestos')
      .update({
        estado: 'RECHAZADO',
        updated_at: new Date().toISOString(),
        notas: comentario || null,
      })
      .in('tarea_id', tarea_ids)
      .eq('socio_id', socio_id);

    if (updateError) {
      console.error('[POST /api/presupuestos/rechazar] Error actualizando presupuestos:', updateError);
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    // 3. Crear notificación para el socio
    const mensajeNotificacion = comentario
      ? `Tu presupuesto fue rechazado. Motivo: ${comentario}`
      : 'Tu presupuesto fue rechazado.';

    // Notificación Supabase: usamos siempre remitente_id + destinatario_id (no usar socio_id)
    const { error: notifError } = await supabaseAny
      .from('notificaciones')
      .insert({
        org_id: orgId,
        remitente_id: user.id, // Cliente es el remitente
        destinatario_id: socio_id, // Socio es el destinatario
        obra_id: obra_id,
        tarea_id: null, // Notificación general para todas las tareas
        tipo: 'presupuesto_rechazado',
        titulo: 'Presupuesto rechazado',
        mensaje: mensajeNotificacion,
        leida: false,
        created_at: new Date().toISOString(),
      });

    if (notifError) {
      console.warn('[POST /api/presupuestos/rechazar] Error creando notificación:', notifError);
      // No fallar si no se puede crear la notificación
    }

    console.log('[POST /api/presupuestos/rechazar] Presupuestos rechazados exitosamente para', tarea_ids.length, 'tareas');

    return NextResponse.json({
      success: true,
      message: `Presupuesto rechazado para ${tarea_ids.length} tarea${tarea_ids.length === 1 ? '' : 's'}`,
    });
  } catch (error: any) {
    console.error('[POST /api/presupuestos/rechazar] Excepción:', error);
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}


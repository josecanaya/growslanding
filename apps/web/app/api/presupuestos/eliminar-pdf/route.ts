import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/types/supabase.gen';

export const runtime = 'nodejs';

interface Payload {
  obra_id: string;
  tarea_ids: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Payload;
    const { obra_id, tarea_ids } = body;

    if (!obra_id || !tarea_ids || tarea_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Se requiere obra_id y tarea_ids' },
        { status: 400 }
      );
    }

    // Autenticación
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
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
      console.error('[POST /api/presupuestos/eliminar-pdf] Error obteniendo obra:', obraError);
      return NextResponse.json(
        { success: false, error: 'Obra no encontrada' },
        { status: 404 }
      );
    }

    const orgId = obraData.org_id;

    // 1. Buscar eventos con PDF asociados a estas tareas
    const { data: eventosConPdf, error: eventosError } = await supabaseAny
      .from('eventos')
      .select('id, pdf_path, tarea_id')
      .in('tarea_id', tarea_ids)
      .not('pdf_path', 'is', null)
      .like('pdf_path', '%presupuestos%');

    if (eventosError) {
      console.warn('[POST /api/presupuestos/eliminar-pdf] Error obteniendo eventos con PDF:', eventosError);
    }

    // 2. Eliminar PDFs del Storage
    if (eventosConPdf && eventosConPdf.length > 0) {
      const pdfPaths = eventosConPdf
        .map((e: any) => e.pdf_path)
        .filter((path: string) => path && path.startsWith('actas/'))
        .map((path: string) => path.replace(/^actas\//, '')); // Remover prefijo 'actas/' para el storage

      if (pdfPaths.length > 0) {
        console.log('[POST /api/presupuestos/eliminar-pdf] Eliminando PDFs:', pdfPaths);
        const { error: deleteError } = await supabaseAny.storage
          .from('actas')
          .remove(pdfPaths);

        if (deleteError) {
          console.warn('[POST /api/presupuestos/eliminar-pdf] Error eliminando PDFs del storage:', deleteError);
          // Continuar aunque falle la eliminación del storage
        } else {
          console.log('[POST /api/presupuestos/eliminar-pdf] PDFs eliminados exitosamente del storage');
        }
      }

      // 3. Eliminar los eventos que contenían los PDFs
      const eventoIds = eventosConPdf.map((e: any) => e.id);
      const { error: deleteEventosError } = await supabaseAny
        .from('eventos')
        .delete()
        .in('id', eventoIds);

      if (deleteEventosError) {
        console.warn('[POST /api/presupuestos/eliminar-pdf] Error eliminando eventos:', deleteEventosError);
        return NextResponse.json(
          { success: false, error: deleteEventosError.message },
          { status: 500 }
        );
      }

      console.log('[POST /api/presupuestos/eliminar-pdf] Eventos eliminados exitosamente');
    }

    // 4. Actualizar estado de presupuestos a PENDIENTE (para permitir reenvío)
    const { error: updateError } = await supabaseAny
      .from('tareas_presupuestos')
      .update({
        estado: 'PENDIENTE',
        updated_at: new Date().toISOString(),
      })
      .in('tarea_id', tarea_ids)
      .eq('estado', 'ENVIADO'); // Solo actualizar los que estaban ENVIADOS

    if (updateError) {
      console.warn('[POST /api/presupuestos/eliminar-pdf] Error actualizando estado de presupuestos:', updateError);
      // No fallar si esto falla, el PDF ya fue eliminado
    } else {
      console.log('[POST /api/presupuestos/eliminar-pdf] Estados de presupuestos actualizados a PENDIENTE');
    }

    return NextResponse.json({
      success: true,
      message: `PDF eliminado para ${tarea_ids.length} tarea${tarea_ids.length === 1 ? '' : 's'}`,
    });
  } catch (error: any) {
    console.error('[POST /api/presupuestos/eliminar-pdf] Excepción:', error);
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Error interno' },
      { status: 500 }
    );
  }
}


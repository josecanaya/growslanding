import { NextRequest, NextResponse } from 'next/server';
import { requireObraAccess, ObraAccessError } from '@/lib/obra-access';
import { contextStoragePath } from '@/lib/legajo/storage-contract';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/legajo/documentos?obraId=xxx&categoriaId=xxx
 * Obtiene documentos de una obra, opcionalmente filtrados por categoría
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const obraId = searchParams.get('obraId');
    const categoriaId = searchParams.get('categoriaId');

    if (!obraId) {
      return NextResponse.json(
        { success: false, error: 'obraId es requerido' },
        { status: 400 }
      );
    }

    const { supabase } = await requireObraAccess(obraId, true);

    let query = (supabase as any)
      .from('documentos_legajo')
      .select('*')
      .eq('obra_id', obraId);

    if (categoriaId) {
      query = query.eq('categoria', categoriaId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[LEGAJO] Error obteniendo documentos:', error);
      return NextResponse.json(
        { success: false, error: `Error al obtener documentos: ${error.message}` },
        { status: 500 }
      );
    }

    const documents = await Promise.all((data ?? []).map(async (document: any) => {
      const path = contextStoragePath(document.url, obraId);
      if (!path) return { ...document, url: null };
      const { data: signed, error: signError } = await supabase.storage.from('legajo').createSignedUrl(path, 300);
      if (signError) throw new Error('No se pudo autorizar la descarga.');
      return { ...document, url: signed.signedUrl };
    }));
    return NextResponse.json({ success: true, data: documents });
  } catch (error) {
    console.error('[LEGAJO] Error inesperado:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: error instanceof ObraAccessError ? error.status : 500 }
    );
  }
}


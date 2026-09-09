import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { requireObraAccess, ObraAccessError } from '@/lib/obra-access';
import { contextStoragePath } from '@/lib/legajo/storage-contract';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * DELETE /api/legajo/documentos/[id]
 * Elimina un documento y su archivo de Storage
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentoId } = await params;

    if (!documentoId) {
      return NextResponse.json(
        { success: false, error: 'id es requerido' },
        { status: 400 }
      );
    }

    const supabase = createServiceSupabaseClient();

    // Obtener el documento para obtener la URL
    const { data: documento, error: fetchError } = await (supabase as any)
      .from('documentos_legajo')
      .select('url, obra_id')
      .eq('id', documentoId)
      .single();

    if (fetchError || !documento) {
      return NextResponse.json(
        { success: false, error: 'Documento no encontrado' },
        { status: 404 }
      );
    }

    await requireObraAccess(documento.obra_id, true);
    const filePath = contextStoragePath(documento.url, documento.obra_id);
    if (!filePath) return NextResponse.json({ success: false, error: 'Ruta de archivo inválida.' }, { status: 400 });

    // Eliminar archivo de Storage
    const { error: storageError } = await supabase.storage
      .from('legajo')
      .remove([filePath]);

    if (storageError) {
      console.error('[LEGAJO] Error eliminando archivo de Storage:', storageError);
      return NextResponse.json({ success: false, error: 'No se pudo eliminar el archivo. El registro se conservó para reintentar.' }, { status: 503 });
    }

    // Eliminar registro de documentos_legajo
    const { error: deleteError } = await (supabase as any)
      .from('documentos_legajo')
      .delete()
      .eq('obra_id', documento.obra_id)
      .eq('id', documentoId);

    if (deleteError) {
      console.error('[LEGAJO] Error eliminando registro:', deleteError);
      return NextResponse.json(
        { success: false, error: `Error al eliminar documento: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Documento eliminado correctamente',
    });
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


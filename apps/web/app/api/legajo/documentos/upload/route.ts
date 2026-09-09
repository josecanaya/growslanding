import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { requireObraAccess, ObraAccessError } from '@/lib/obra-access';
import { validateContextFile } from '@/lib/legajo/storage-contract';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/legajo/documentos/upload
 * Sube un documento a Supabase Storage y crea el registro en documentos_legajo
 */
export async function POST(request: NextRequest) {
  try {
    if (Number(request.headers.get('content-length') ?? 0) > 21 * 1024 * 1024) return NextResponse.json({ success: false, error: 'Máximo 20 MB por archivo.' }, { status: 413 });
    const formData = await request.formData();
    const obraId = formData.get('obraId') as string;
    const categoriaId = formData.get('categoriaId') as string;
    const archivo = formData.get('archivo') as File;
    const descripcion = formData.get('descripcion') as string | null;

    if (!obraId || !categoriaId || !archivo) {
      return NextResponse.json(
        { success: false, error: 'obraId, categoriaId y archivo son requeridos' },
        { status: 400 }
      );
    }

    const { supabase } = await requireObraAccess(obraId, true);
    if (typeof archivo.arrayBuffer !== 'function') return NextResponse.json({ success: false, error: 'Archivo inválido.' }, { status: 400 });
    const invalid = validateContextFile(archivo, categoriaId, descripcion ?? '');
    if (invalid) return NextResponse.json({ success: false, error: invalid }, { status: 400 });
    const { data: category, error: categoryError } = await (supabase as any).from('categorias_legajo').select('id').eq('id', categoriaId).maybeSingle();
    if (categoryError || !category) return NextResponse.json({ success: false, error: 'Categoría inexistente.' }, { status: 400 });

    // Generar nombre único para el archivo
    const fileExt = archivo.name.split('.').pop();
    const fileName = `${obraId}/${categoriaId}/${randomUUID()}.${fileExt}`;

    // Convertir File a ArrayBuffer
    const arrayBuffer = await archivo.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('legajo')
      .upload(fileName, buffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: archivo.type,
      });

    if (uploadError) {
      console.error('[LEGAJO] Error subiendo archivo:', uploadError);
      return NextResponse.json(
        { success: false, error: `Error al subir archivo: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Stable internal locator; authorized reads issue short-lived download links.
    const publicUrl = `legajo://${fileName}`;

    // Insertar registro en documentos_legajo
    const documentoData = {
      obra_id: obraId,
      categoria: categoriaId,
      nombre_archivo: archivo.name.replace(/[\\/]/g, '_').slice(0, 255),
      url: publicUrl,
      descripcion: descripcion || null,
    };

    const { data: documentoInsertado, error: insertError } = await (supabase as any)
      .from('documentos_legajo')
      .insert([documentoData])
      .select()
      .single();

    if (insertError) {
      // Si falla la inserción, intentar eliminar el archivo subido
      await supabase.storage.from('legajo').remove([fileName]);
      console.error('[LEGAJO] Error insertando documento:', insertError);
      return NextResponse.json(
        { success: false, error: `Error al crear registro: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: documentoInsertado,
    }, { status: 201 });
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


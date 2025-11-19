import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/legajo/documentos/upload
 * Sube un documento a Supabase Storage y crea el registro en documentos_legajo
 */
export async function POST(request: NextRequest) {
  try {
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

    const supabase = createServiceSupabaseClient();

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

    // Obtener URL pública del archivo
    const { data: urlData } = supabase.storage
      .from('legajo')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Insertar registro en documentos_legajo
    const documentoData = {
      obra_id: obraId,
      categoria: categoriaId,
      nombre_archivo: archivo.name,
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
      { status: 500 }
    );
  }
}


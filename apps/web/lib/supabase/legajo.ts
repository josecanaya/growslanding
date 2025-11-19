import { createServiceSupabaseClient } from '@/lib/supabase-server';

// Tipos para las tablas de legajo (hasta que se actualicen los tipos generados)
export interface CategoriaLegajo {
  id: string;
  nombre: string;
  descripcion: string | null;
  orden: number;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentoLegajo {
  id: string;
  obra_id: string;
  categoria: string;
  nombre_archivo: string;
  url: string;
  descripcion: string | null;
  created_at: string;
  updated_at?: string;
}

export interface DocumentoLegajoInsert {
  obra_id: string;
  categoria: string;
  nombre_archivo: string;
  url: string;
  descripcion?: string | null;
}

const supabase = createServiceSupabaseClient();

/**
 * Obtiene todas las categorías de legajo ordenadas por orden
 */
export async function obtenerCategoriasLegajo(): Promise<CategoriaLegajo[]> {
  const { data, error } = await (supabase as any)
    .from('categorias_legajo')
    .select('*')
    .order('orden', { ascending: true });

  if (error) {
    console.error('[LEGAJO] Error obteniendo categorías:', error);
    throw new Error(`Error al obtener categorías: ${error.message}`);
  }

  return data || [];
}

/**
 * Obtiene todos los documentos de una obra por categoría
 */
export async function obtenerDocumentosPorCategoria(
  obraId: string,
  categoriaId: string
): Promise<DocumentoLegajo[]> {
  const { data, error } = await (supabase as any)
    .from('documentos_legajo')
    .select('*')
    .eq('obra_id', obraId)
    .eq('categoria', categoriaId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[LEGAJO] Error obteniendo documentos:', error);
    throw new Error(`Error al obtener documentos: ${error.message}`);
  }

  return data || [];
}

/**
 * Obtiene todos los documentos de una obra
 */
export async function obtenerDocumentosPorObra(
  obraId: string
): Promise<DocumentoLegajo[]> {
  const { data, error } = await (supabase as any)
    .from('documentos_legajo')
    .select('*')
    .eq('obra_id', obraId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[LEGAJO] Error obteniendo documentos:', error);
    throw new Error(`Error al obtener documentos: ${error.message}`);
  }

  return data || [];
}

/**
 * Sube un archivo a Supabase Storage y crea el registro en documentos_legajo
 */
export async function subirDocumento(
  obraId: string,
  categoriaId: string,
  archivo: File,
  descripcion?: string
): Promise<DocumentoLegajo> {
  try {
    // Generar nombre único para el archivo
    const fileExt = archivo.name.split('.').pop();
    const fileName = `${obraId}/${categoriaId}/${crypto.randomUUID()}.${fileExt}`;

    // Subir archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('legajo')
      .upload(fileName, archivo, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('[LEGAJO] Error subiendo archivo:', uploadError);
      throw new Error(`Error al subir archivo: ${uploadError.message}`);
    }

    // Obtener URL pública del archivo
    const { data: urlData } = supabase.storage
      .from('legajo')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // Insertar registro en documentos_legajo
    const documentoData: DocumentoLegajoInsert = {
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
      throw new Error(`Error al crear registro: ${insertError.message}`);
    }

    return documentoInsertado;
  } catch (error) {
    console.error('[LEGAJO] Error en subirDocumento:', error);
    throw error;
  }
}

/**
 * Elimina un documento y su archivo de Storage
 */
export async function eliminarDocumento(
  documentoId: string,
  url: string
): Promise<void> {
  try {
    // Extraer el path del archivo desde la URL
    // La URL es algo como: https://xxx.supabase.co/storage/v1/object/public/legajo/obra_id/categoria_id/uuid.ext
    const urlParts = url.split('/legajo/');
    if (urlParts.length < 2) {
      throw new Error('URL de archivo inválida');
    }
    const filePath = urlParts[1];

    // Eliminar archivo de Storage
    const { error: storageError } = await supabase.storage
      .from('legajo')
      .remove([filePath]);

    if (storageError) {
      console.error('[LEGAJO] Error eliminando archivo de Storage:', storageError);
      // Continuar aunque falle el storage, para eliminar el registro
    }

    // Eliminar registro de documentos_legajo
    const { error: deleteError } = await (supabase as any)
      .from('documentos_legajo')
      .delete()
      .eq('id', documentoId);

    if (deleteError) {
      console.error('[LEGAJO] Error eliminando registro:', deleteError);
      throw new Error(`Error al eliminar documento: ${deleteError.message}`);
    }
  } catch (error) {
    console.error('[LEGAJO] Error en eliminarDocumento:', error);
    throw error;
  }
}

/**
 * Obtiene la URL pública de descarga de un archivo
 */
export function obtenerUrlDescarga(url: string): string {
  return url;
}


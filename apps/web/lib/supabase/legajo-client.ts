// Funciones del lado del cliente para interactuar con las API routes

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

/**
 * Obtiene todas las categorías de legajo ordenadas por orden
 */
export async function obtenerCategoriasLegajo(): Promise<CategoriaLegajo[]> {
  const response = await fetch('/api/legajo/categorias');
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al obtener categorías');
  }

  const result = await response.json();
  return result.data || [];
}

/**
 * Obtiene todos los documentos de una obra por categoría
 */
export async function obtenerDocumentosPorCategoria(
  obraId: string,
  categoriaId: string
): Promise<DocumentoLegajo[]> {
  const response = await fetch(
    `/api/legajo/documentos?obraId=${obraId}&categoriaId=${categoriaId}`
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al obtener documentos');
  }

  const result = await response.json();
  return result.data || [];
}

/**
 * Obtiene todos los documentos de una obra
 */
export async function obtenerDocumentosPorObra(
  obraId: string
): Promise<DocumentoLegajo[]> {
  const response = await fetch(`/api/legajo/documentos?obraId=${obraId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al obtener documentos');
  }

  const result = await response.json();
  return result.data || [];
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
  const formData = new FormData();
  formData.append('obraId', obraId);
  formData.append('categoriaId', categoriaId);
  formData.append('archivo', archivo);
  if (descripcion) {
    formData.append('descripcion', descripcion);
  }

  const response = await fetch('/api/legajo/documentos/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al subir documento');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Elimina un documento y su archivo de Storage
 */
export async function eliminarDocumento(
  documentoId: string,
  url: string
): Promise<void> {
  const response = await fetch(`/api/legajo/documentos/${documentoId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error al eliminar documento');
  }
}

/**
 * Obtiene la URL pública de descarga de un archivo
 */
export function obtenerUrlDescarga(url: string): string {
  return url;
}


import type { ObraInput } from '@/lib/schemas/obras';

/**
 * Service para consumir la API de obras desde el frontend
 */
export async function crearObra(input: ObraInput) {
  try {
    const body: ObraInput = {
      org_id: input.org_id,
      nombre: input.nombre,
      localizacion: input.localizacion,
      propietario: input.propietario,
      tipo_obra: input.tipo_obra,
      latitud: input.latitud,
      longitud: input.longitud,
      plantas: input.plantas,
      terreno: input.terreno,
      superficies: input.superficies,
      estado: input.estado,
      obra_product_kind: input.obra_product_kind,
    };

    const res = await fetch('/api/obras', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    // Verificar el Content-Type de la respuesta
    const contentType = res.headers.get('content-type');
    
    let json: any;
    
    if (!contentType || !contentType.includes('application/json')) {
      // Si la respuesta no es JSON, intentar leer como texto para ver qué se devolvió
      const text = await res.text();
      console.error('[CREAR_OBRA_ERROR] Respuesta no JSON:', text.substring(0, 200));
      throw new Error(`Error del servidor: La respuesta no es JSON. Status: ${res.status}`);
    }

    // Si es JSON, leer como JSON
    json = await res.json();

    if (!res.ok) {
      const errorMessage = json?.error || json?.message || 'Error al crear obra';
      const errorDetails = json?.details ? ` - ${json.details}` : '';
      throw new Error(`${errorMessage}${errorDetails}`);
    }

    if (!json.obra) {
      throw new Error('La respuesta no contiene la obra creada');
    }

    return json.obra as {
      id: string;
      org_id: string;
      name: string;  // La tabla usa 'name', no 'nombre'
      address: string | null;  // La tabla usa 'address', no 'localizacion'
      estado: string | null;
      created_at: string;
    };
  } catch (error) {
    // Si es un error de red o de fetch, dar un mensaje más claro
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Error de conexión. Por favor, verifica tu conexión a internet.');
    }
    // Re-lanzar el error si ya es un Error con mensaje
    if (error instanceof Error) {
      throw error;
    }
    // Si no es un Error, convertirlo
    throw new Error(`Error inesperado: ${String(error)}`);
  }
}


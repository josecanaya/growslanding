import { createHash } from 'crypto';
import { CircuitoError, UUID, responder, rpc, sesion } from '@/lib/circuito/servidor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const BUCKET = 'evidencias-obra';
const TIPOS = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain']);

/**
 * POST multipart (entidad=avance|certificado, entidad_id, archivo). Guarda el archivo en Storage (bucket privado)
 * y registra la evidencia. La ruta se deriva del contenido: reintentar el mismo archivo no lo duplica.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return responder(async () => {
    const { id } = await params;
    const { user, db } = await sesion();
    const form = await request.formData().catch(() => null);
    const entidad = String(form?.get('entidad') ?? '');
    const entidadId = String(form?.get('entidad_id') ?? '');
    const archivo = form?.get('archivo');
    if (!UUID.test(id) || !UUID.test(entidadId) || !['avance', 'certificado'].includes(entidad) || !(archivo instanceof File)) {
      throw new CircuitoError(422, 'Enviá entidad, entidad_id y archivo.', 'GR422');
    }
    if (archivo.size === 0 || archivo.size > 20 * 1024 * 1024 || !TIPOS.has(archivo.type)) {
      throw new CircuitoError(422, 'La evidencia debe ser JPG, PNG, WEBP, PDF o texto de hasta 20 MB.', 'GR422');
    }
    // Permiso antes de escribir en Storage: solo el contratista dueño del avance o certificado.
    const tabla = entidad === 'avance' ? 'avances' : 'certificados';
    const fila = await db.from(tabla).select(entidad === 'avance' ? 'obra_id, socio_id' : 'obra_id, contratos(socio_id)').eq('id', entidadId).maybeSingle();
    const datos = fila.data as { obra_id?: string; socio_id?: string; contratos?: { socio_id?: string } } | null;
    const socioId = datos?.socio_id ?? datos?.contratos?.socio_id;
    if (fila.error || !datos || datos.obra_id !== id || !socioId) throw new CircuitoError(404, 'No se encontró el avance o certificado en esta obra.', 'GR404');
    const socio = await db.from('socios').select('id').eq('id', socioId).eq('user_id', user.id).maybeSingle();
    if (!socio.data) throw new CircuitoError(403, 'Solo el contratista puede adjuntar evidencia a su trabajo', '42501');
    const bytes = Buffer.from(await archivo.arrayBuffer());
    const sha = createHash('sha256').update(bytes).digest('hex');
    const nombre = archivo.name.replace(/[^\w.\-]+/g, '_').slice(-120) || 'evidencia';
    const ruta = `${id}/${entidad}/${entidadId}/${sha.slice(0, 16)}-${nombre}`;
    const subida = await db.storage.from(BUCKET).upload(ruta, bytes, { contentType: archivo.type, upsert: true });
    if (subida.error) {
      console.error('[circuito] storage', subida.error.message);
      throw new CircuitoError(503, 'No se pudo guardar el archivo. Reintentá.', 'NO_DISPONIBLE');
    }
    const registro = await rpc<Record<string, unknown>>(db, 'circ_evidencia_registrar', {
      p_actor: user.id, p_entidad: entidad, p_entidad_id: entidadId, p_path: ruta, p_nombre: nombre, p_sha: sha, p_bytes: bytes.length,
    });
    return { ...registro, storage_path: ruta, sha256: sha, bytes: bytes.length };
  }, 201);
}

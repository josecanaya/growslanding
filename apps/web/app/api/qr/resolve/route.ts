import { z } from 'zod';

import { assertPinForToken, decodeQR } from '@/lib/qr';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

const requestSchema = z.object({
  token: z.string().min(3),
  pin: z.string().min(4).max(6).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, pin } = requestSchema.parse(body);
    const normalizedToken = decodeQR(`/t/${token}`);

    const supabase = createServiceSupabaseClient();

    const { data: qrToken, error: qrError } = await supabase
      .from('qr_tokens' as any)
      .select('id, ref_id, pin, enabled')
      .eq('token', normalizedToken)
      .maybeSingle();

    if (qrError) {
      throw qrError;
    }

    // Type assertion: qrToken has the expected structure
    const qrTokenRecord = qrToken as { id: string; ref_id: string; pin: string | null; enabled: boolean } | null;

    if (!qrTokenRecord || !qrTokenRecord.enabled) {
      return new Response(JSON.stringify({ message: 'QR no encontrado o deshabilitado' }), {
        status: 404,
      });
    }

    assertPinForToken(qrTokenRecord, pin);

    const { data: tarea, error: tareaError } = await supabase
      .from('tareas')
      .select(
        `id, obra_id, tipo, descripcion, estado, referente_id, socio_ids,
         obra:obras(nombre, cliente, localizacion),
         eventos(*),
         precedencias:tarea_precedencias(depende_de)`
      )
      .eq('id', qrTokenRecord.ref_id)
      .maybeSingle();

    if (tareaError) {
      throw tareaError;
    }

    if (!tarea) {
      return new Response(JSON.stringify({ message: 'Tarea no encontrada' }), {
        status: 404,
      });
    }

    return new Response(
      JSON.stringify({
        tarea,
        qrTokenId: qrTokenRecord.id,
        requiresPin: Boolean(qrTokenRecord.pin),
      })
    );
  } catch (error) {
    console.error('[QR_RESOLVE_ERROR]', error);
    const message =
      error instanceof Error ? error.message : 'Error al resolver el QR';
    const status = message.includes('PIN') ? 401 : 400;
    return new Response(JSON.stringify({ message }), { status });
  }
}

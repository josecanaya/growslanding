import { createServiceSupabaseClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventoId: string }> }
) {
  const { eventoId } = await params;
  const supabase = createServiceSupabaseClient();

  const { data: evento, error } = await supabase
    .from('eventos')
    .select('pdf_path')
    .eq('id', eventoId)
    .maybeSingle();

  if (error) {
    console.error('[ACTA_FETCH_ERROR]', error);
    return new Response('Error al obtener acta', { status: 500 });
  }

  if (!evento?.pdf_path) {
    return new Response('Acta no disponible', { status: 404 });
  }

  const relativePath = evento.pdf_path.replace(/^actas\//, '');
  const { data: file, error: downloadError } = await supabase.storage
    .from('actas')
    .download(relativePath);

  if (downloadError || !file) {
    console.error('[ACTA_DOWNLOAD_ERROR]', downloadError);
    return new Response('PDF no encontrado', { status: 404 });
  }

  return new Response(file, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="acta-${eventoId}.pdf"`,
    },
  });
}

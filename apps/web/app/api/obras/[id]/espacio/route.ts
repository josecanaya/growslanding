import { NextResponse } from 'next/server';
import { ObraAccessError, requireObraAccess } from '@/lib/obra-access';
import { loadProcurement, comparableQuotes } from '@/lib/obras/procurement';

export const dynamic = 'force-dynamic';
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { supabase } = await requireObraAccess(id, true);
    const [obra, procurement] = await Promise.all([
      supabase.from('obras').select('id, name, objetivo_texto, estado').eq('id', id).single(),
      loadProcurement(supabase, id),
    ]);
    if (obra.error) throw obra.error;
    return NextResponse.json({ obra: obra.data, ...procurement, comparisons: comparableQuotes(procurement.quotes) },
      { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof ObraAccessError ? error.message : 'No se pudo cargar el espacio de obra.' },
      { status: error instanceof ObraAccessError ? error.status : 503 });
  }
}

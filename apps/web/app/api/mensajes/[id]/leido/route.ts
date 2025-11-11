import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { error } = await supabaseAny.from('mensajes').update({ leido: true }).eq('id', id);

    if (error) {
      console.error('[PATCH /api/mensajes/[id]/leido] Error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('[PATCH /api/mensajes/[id]/leido] Excepción:', error);
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Error interno' },
      { status: 500 },
    );
  }
}



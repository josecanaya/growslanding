import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase-server';

type SupabaseRow = Record<string, unknown>;

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { error } = await supabaseAny.from('notificaciones').update({ leida: true }).eq('id', id);

    if (error) {
      console.error('[PATCH /api/notificaciones/[id]/leida] Error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('[PATCH /api/notificaciones/[id]/leida] Excepción:', error);
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Error interno' },
      { status: 500 },
    );
  }
}



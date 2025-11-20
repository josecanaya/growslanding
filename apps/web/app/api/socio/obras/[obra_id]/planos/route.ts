import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createServiceSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/lib/types/supabase.gen';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/socio/obras/[obra_id]/planos
 * Obtiene los planos (documentos PDF/imágenes) asociados a una obra
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ obra_id: string }> }
) {
  try {
    const { obra_id } = await params;

    // Autenticación
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient<Database>({ cookies: () => cookieStore as any });
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const supabase = createServiceSupabaseClient();

    // Obtener socio_id del usuario autenticado
    const { data: socio, error: socioError } = await supabase
      .from('socios')
      .select('id, org_id, email')
      .eq('email', user.email)
      .maybeSingle();

    if (socioError || !socio) {
      return NextResponse.json(
        { message: 'Socio no encontrado' },
        { status: 404 }
      );
    }

    // Validar que la obra pertenece a la misma org
    const { data: obra, error: obraError } = await supabase
      .from('obras')
      .select('id, org_id')
      .eq('id', obra_id)
      .maybeSingle();

    if (obraError || !obra) {
      return NextResponse.json(
        { message: 'Obra no encontrada' },
        { status: 404 }
      );
    }

    if (obra.org_id !== socio.org_id) {
      return NextResponse.json(
        { message: 'No tienes acceso a esta obra' },
        { status: 403 }
      );
    }

    // Buscar documentos con categoría "planos" primero
    const { data: planosData, error: planosError } = await (supabase as any)
      .from('documentos_legajo')
      .select('id, nombre_archivo, url, categoria, created_at')
      .eq('obra_id', obra_id)
      .eq('categoria', 'planos')
      .order('created_at', { ascending: false });

    // Si hay planos, devolverlos
    if (planosData && planosData.length > 0) {
      return NextResponse.json({
        planos: planosData.map((p: any) => ({
          id: p.id,
          nombre_archivo: p.nombre_archivo,
          url: p.url,
          categoria: p.categoria,
          created_at: p.created_at,
        })),
      });
    }

    // Si no hay planos, buscar todos los PDFs
    const { data: pdfsData, error: pdfsError } = await (supabase as any)
      .from('documentos_legajo')
      .select('id, nombre_archivo, url, categoria, created_at')
      .eq('obra_id', obra_id)
      .ilike('nombre_archivo', '%.pdf')
      .order('created_at', { ascending: false });

    if (pdfsError) {
      console.error('[PLANOS] Error obteniendo PDFs:', pdfsError);
      return NextResponse.json({ planos: [] });
    }

    return NextResponse.json({
      planos: (pdfsData || []).map((p: any) => ({
        id: p.id,
        nombre_archivo: p.nombre_archivo,
        url: p.url,
        categoria: p.categoria,
        created_at: p.created_at,
      })),
    });
  } catch (error) {
    console.error('[PLANOS] Error:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


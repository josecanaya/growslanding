import { NextRequest, NextResponse } from 'next/server';
import { listCanvasXmlLibrary, getCanvasXmlLibraryEntry } from '@/lib/canvas/canvasXmlLibrary';
import { filterCanvasXmlLibrary } from '@/lib/canvas/canvasXmlLibraryFilters';
import { isObraProductKind } from '@/lib/canvas/obraProductKind';

export const dynamic = 'force-dynamic';

/**
 * GET /api/canvas-templates
 * Catálogo desde canvas-library-catalog.json + XML en public/.
 */
export async function GET(request: NextRequest) {
  const kind = request.nextUrl.searchParams.get('obra_product_kind');
  const segment = request.nextUrl.searchParams.get('segment');
  const slug = request.nextUrl.searchParams.get('slug');

  let templates = listCanvasXmlLibrary();

  if (slug) {
    const one = getCanvasXmlLibraryEntry(slug);
    if (!one) {
      return NextResponse.json({ success: false, error: 'Template no encontrado' }, { status: 404 });
    }
    templates = [one];
  } else {
    templates = filterCanvasXmlLibrary(templates, {
      segment: segment as Parameters<typeof filterCanvasXmlLibrary>[1]['segment'],
      obraProductKind: kind && isObraProductKind(kind) ? kind : undefined,
    });
  }

  return NextResponse.json({
    success: true,
    data: templates.map((t) => ({
      slug: t.slug,
      nombre: t.nombre,
      segment: t.segment,
      xml_url: t.xmlPath,
      obra_product_kind: t.obraProductKind,
      rubro: t.rubro,
      subtipo: t.subtipo,
      descripcion: t.descripcion,
      task_count: t.taskCount,
      tags: t.tags,
      filtro_unidad: t.filtroUnidad,
      m2_min: t.m2Min,
      m2_max: t.m2Max,
      unidades_min: t.unidadesMin,
      unidades_max: t.unidadesMax,
    })),
    count: templates.length,
  });
}

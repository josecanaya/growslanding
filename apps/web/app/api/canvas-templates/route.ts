import { NextRequest, NextResponse } from 'next/server';
import {
  listOfficialTemplatesForKind,
  OFFICIAL_CANVAS_TEMPLATES,
  getOfficialTemplateBySlug,
} from '@/lib/canvas/officialCanvasTemplates';
import { isObraProductKind } from '@/lib/canvas/obraProductKind';

export const dynamic = 'force-dynamic';

/**
 * GET /api/canvas-templates
 * Query: obra_product_kind (opcional)
 * Sprint 1: catálogo oficial en código (+ futuro merge con Supabase).
 */
export async function GET(request: NextRequest) {
  const kind = request.nextUrl.searchParams.get('obra_product_kind');
  const visibilidad = request.nextUrl.searchParams.get('visibilidad');

  let templates = [...OFFICIAL_CANVAS_TEMPLATES];

  if (kind && isObraProductKind(kind)) {
    templates = listOfficialTemplatesForKind(kind);
  }

  const slug = request.nextUrl.searchParams.get('slug');
  if (slug) {
    const one = templates.find((t) => t.slug === slug) ?? getOfficialTemplateBySlug(slug);
    if (!one) {
      return NextResponse.json({ success: false, error: 'Template no encontrado' }, { status: 404 });
    }
    templates = [one];
  }

  if (visibilidad === 'oficial') {
    templates = templates.filter((t) => t.visibilidad === 'oficial');
  }

  return NextResponse.json({
    success: true,
    data: templates.map((t) => ({
      id: t.id,
      slug: t.slug,
      nombre: t.nombre,
      obra_product_kind: t.obraProductKind,
      visibilidad: t.visibilidad,
      descripcion: t.descripcion,
      tareas: t.tareas.map((task) => ({
        id: task.id,
        titulo: task.titulo,
        descripcion: task.descripcion,
        orden: task.orden,
        duracion_estimada_dias: task.duracionEstimadaDias ?? 1,
        tipo: task.tipo ?? 'tarea',
      })),
      conexiones: t.conexiones,
    })),
    count: templates.length,
  });
}

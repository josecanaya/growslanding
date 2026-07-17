import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { obraCheckDb, getSessionFromCookie, touchSession } from '@/lib/obra-check/db';
import {
  deleteObraCheckPlano,
  listObraCheckPlanos,
  signedPlanoUrls,
  uploadObraCheckPlano,
} from '@/lib/obra-check/planos';

export const dynamic = 'force-dynamic';

const patchSchema = z.object({
  metrosCuadrados: z.number().positive().max(1_000_000).nullable().optional(),
});

/** GET /api/obra-check/obra-datos — m² + planos de la sesión. */
export async function GET() {
  const db = obraCheckDb();
  const session = await getSessionFromCookie(db);
  if (!session) return NextResponse.json({ success: false, error: 'Sesión no encontrada.' }, { status: 401 });

  const { data: row } = await db
    .from('obra_check_sessions')
    .select('metros_cuadrados')
    .eq('id', session.id)
    .maybeSingle();

  const planos = await listObraCheckPlanos(db, session.id);
  const withUrls = await signedPlanoUrls(planos, 60 * 60);

  return NextResponse.json({
    success: true,
    data: {
      metrosCuadrados: (row as { metros_cuadrados: number | null } | null)?.metros_cuadrados ?? null,
      planos: withUrls,
    },
  });
}

/** PATCH /api/obra-check/obra-datos — actualiza m². */
export async function PATCH(request: NextRequest) {
  const db = obraCheckDb();
  const session = await getSessionFromCookie(db);
  if (!session) return NextResponse.json({ success: false, error: 'Sesión no encontrada.' }, { status: 401 });

  let parsed;
  try {
    parsed = patchSchema.parse(await request.json());
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Datos inválidos.', detail: (err as Error).message }, { status: 400 });
  }

  if (parsed.metrosCuadrados !== undefined) {
    const { error } = await db
      .from('obra_check_sessions')
      .update({ metros_cuadrados: parsed.metrosCuadrados })
      .eq('id', session.id);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  await touchSession(db, session.id);
  return NextResponse.json({ success: true, data: { ok: true } });
}

/** POST /api/obra-check/obra-datos — sube un plano (multipart). */
export async function POST(request: NextRequest) {
  const db = obraCheckDb();
  const session = await getSessionFromCookie(db);
  if (!session) return NextResponse.json({ success: false, error: 'Sesión no encontrada.' }, { status: 401 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ success: false, error: 'Formulario inválido.' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, error: 'Falta el archivo.' }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadObraCheckPlano({
      sessionId: session.id,
      fileName: file.name || 'plano.pdf',
      mime: file.type || 'application/pdf',
      buffer,
    });
    await touchSession(db, session.id);
    const planos = await listObraCheckPlanos(db, session.id);
    const withUrls = await signedPlanoUrls(planos.filter((p) => p.id === uploaded.id), 60 * 60);
    return NextResponse.json({
      success: true,
      data: withUrls[0] ?? { id: uploaded.id, nombre: uploaded.fileName, url: '', mime: file.type, sizeBytes: buffer.length },
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 400 });
  }
}

/** DELETE /api/obra-check/obra-datos?planoId=… */
export async function DELETE(request: NextRequest) {
  const db = obraCheckDb();
  const session = await getSessionFromCookie(db);
  if (!session) return NextResponse.json({ success: false, error: 'Sesión no encontrada.' }, { status: 401 });

  const planoId = request.nextUrl.searchParams.get('planoId');
  if (!planoId) {
    return NextResponse.json({ success: false, error: 'Falta planoId.' }, { status: 400 });
  }

  await deleteObraCheckPlano(db, session.id, planoId);
  return NextResponse.json({ success: true, data: { ok: true } });
}

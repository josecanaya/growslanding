import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ObraAccessError, requireObraAccess } from '@/lib/obra-access';
import { solicitarPresupuestoTareaEnPaquete } from '@/lib/services/solicitar-presupuesto-paquete.service';
import { socioEsContactoDeOrg } from '@/lib/socios/agenda-access';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const schema = z.object({
  etapa: z.string().trim().max(120).nullish(),
  tareaIds: z.array(z.string().uuid()).min(1).max(200),
  socioIds: z.array(z.string().uuid()).min(1).max(20),
});

/**
 * POST /api/obras/:id/solicitar-presupuesto — la ruta que usa SolicitarPresupuestoModal.
 * Crea (o reutiliza) una solicitud PENDIENTE en tareas_presupuestos por cada tarea × contratista agendado.
 * Es idempotente: repetir el pedido no duplica solicitudes abiertas.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { supabase, orgId } = await requireObraAccess(id, true);
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Seleccioná al menos una tarea y un contratista.' }, { status: 400 });
    const { tareaIds, socioIds, etapa } = parsed.data;
    const db = supabase as any;
    const tareas = await db.from('tareas').select('id, dias_presupuesto, title').eq('obra_id', id).in('id', tareaIds);
    if (tareas.error) return NextResponse.json({ error: 'No se pudieron leer las tareas.' }, { status: 503 });
    if ((tareas.data ?? []).length !== new Set(tareaIds).size) {
      return NextResponse.json({ error: 'Alguna tarea no pertenece a esta obra.' }, { status: 400 });
    }
    for (const socioId of socioIds) {
      if (!(await socioEsContactoDeOrg(supabase, socioId, orgId))) {
        return NextResponse.json({ error: 'El contratista no está en tu agenda.' }, { status: 403 });
      }
    }
    const resultados: { tarea_id: string; socio_id: string; presupuesto_id: string; accion: string }[] = [];
    for (const tarea of tareas.data as { id: string; dias_presupuesto: number }[]) {
      for (const socioId of socioIds) {
        const r = await solicitarPresupuestoTareaEnPaquete(db, {
          tareaId: tarea.id, socioId, diasPresupuesto: tarea.dias_presupuesto,
          notasPayload: etapa ? `Solicitud de presupuesto · etapa ${etapa}` : null,
        });
        if (!r.ok) return NextResponse.json({ error: 'No se pudo crear la solicitud. Reintentá.', creadas: resultados }, { status: 503 });
        resultados.push({ tarea_id: tarea.id, socio_id: socioId, presupuesto_id: r.result.presupuestoId, accion: r.result.accion });
      }
    }
    const creadas = resultados.filter((r) => r.accion === 'creado').length;
    if (creadas === 0) {
      return NextResponse.json({ message: 'Las tareas seleccionadas ya tienen solicitudes para esos contratistas.', solicitudes: resultados }, { status: 400 });
    }
    return NextResponse.json({ success: true, created: creadas, creadas, ya_solicitadas: resultados.length - creadas, solicitudes: resultados }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof ObraAccessError ? error.message : 'No se pudo enviar la solicitud.' },
      { status: error instanceof ObraAccessError ? error.status : 503 });
  }
}

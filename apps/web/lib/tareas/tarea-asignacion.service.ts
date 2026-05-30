import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { socioEsContactoDeOrg } from '@/lib/socios/agenda-access';
import { TareasRepository } from './infrastructure/tareas.repository';

export class TareaAsignacionService {
  static async asignarSocio(params: {
    tareaId: string;
    socioId: string;
    actorUserId: string;
    actorEmail?: string | null;
  }): Promise<{ tareaId: string; socioId: string; socioNombre: string | null }> {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const tarea = await TareasRepository.findById(params.tareaId);
    if (!tarea?.org_id) {
      throw new Error('Tarea no encontrada');
    }

    const orgId = String(tarea.org_id);
    const okContacto = await socioEsContactoDeOrg(supabase, params.socioId, orgId);
    if (!okContacto) {
      throw new Error('El socio no está en tu agenda o no corresponde a esta organización.');
    }

    const { data: socioData, error: socioError } = await supabaseAny
      .from('socios')
      .select('id, nombre, email, telefono, org_id')
      .eq('id', params.socioId)
      .maybeSingle();

    const responsableText =
      socioData?.email || socioData?.telefono || socioData?.nombre || null;

    if (socioError || !socioData || !responsableText) {
      throw new Error('Socio no encontrado o sin datos de contacto');
    }

    await TareasRepository.updateAsignacion(params.tareaId, orgId, {
      responsable: responsableText,
      responsable_socio_id: params.socioId,
    });

    const { error: presupuestoError } = await supabaseAny
      .from('tareas_presupuestos')
      .update({ estado: 'APROBADO', updated_at: new Date().toISOString() })
      .eq('tarea_id', params.tareaId)
      .eq('socio_id', params.socioId);
    if (presupuestoError) {
      console.warn('[TareaAsignacionService] presupuesto APROBADO:', presupuestoError.message);
    }

    const { error: rejectError } = await supabaseAny
      .from('tareas_presupuestos')
      .update({ estado: 'RECHAZADO', updated_at: new Date().toISOString() })
      .eq('tarea_id', params.tareaId)
      .neq('socio_id', params.socioId);
    if (rejectError) {
      console.warn('[TareaAsignacionService] rechazar otros presupuestos:', rejectError.message);
    }

    const { error: eventoError } = await supabaseAny.from('eventos').insert({
      tarea_id: params.tareaId,
      org_id: orgId,
      obra_id: tarea.obra_id,
      actor_name: params.actorEmail ?? 'Sistema',
      actor_role: 'Cliente',
      actor_method: 'login',
      notas: `Tarea asignada a ${socioData.nombre ?? 'socio'}`,
      checklist: null,
      has_nc: false,
      nuevo_estado: 'pendiente',
      snapshot_json: null,
      created_at: new Date().toISOString(),
    });
    if (eventoError) {
      console.warn('[TareaAsignacionService] evento:', eventoError.message);
    }

    const { error: notifError } = await supabaseAny.from('notificaciones').insert({
      org_id: orgId,
      remitente_id: params.actorUserId,
      destinatario_id: params.socioId,
      obra_id: tarea.obra_id,
      tarea_id: params.tareaId,
      titulo: 'Tarea asignada',
      mensaje: 'Te asignaron una nueva tarea en la obra.',
      tipo: 'asignacion',
      leida: false,
      created_at: new Date().toISOString(),
    });
    if (notifError) {
      console.warn('[TareaAsignacionService] notificación:', notifError.message);
    }

    return {
      tareaId: params.tareaId,
      socioId: params.socioId,
      socioNombre: socioData.nombre ?? null,
    };
  }
}

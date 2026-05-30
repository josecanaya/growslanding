import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { SubtareaMvpService } from '@/lib/services/subtarea-mvp.service';
import { PermisoService } from '@/lib/services/permiso.service';
import { registrarEvidenciaSubtarea } from '@/lib/services/registrar-evidencia-subtarea';
import {
  ESTADO_BLOQUE_FINAL,
  ESTADO_BLOQUE_PARA_VALIDAR,
  normalizeEstadoBloqueParaOperacion,
} from '@/lib/domain/estados-core';
import { resolveSocioParaOperacionDeTarea } from '@/lib/socios/resolveSocioForAuthUser';
import { SubtareasRepository, SUBTAREA_ENVIAR_VALIDAR_SELECT } from './infrastructure/subtareas.repository';
import { TareasRepository } from './infrastructure/tareas.repository';
import { TareaComandosService } from './tarea-comandos.service';

type SubtareaEnviarRow = {
  id: string;
  tarea_id: string;
  estado: string;
  socio_id?: string | null;
  evidencia_obligatoria?: boolean | null;
  evidencia_cargada?: boolean | null;
  evidencia_url?: string | null;
  tareas?: { org_id?: string | null; responsable_socio_id?: string | null } | null;
};

async function obtenerUserIdClienteOrganizacion(orgId: string): Promise<string | null> {
  const supabaseAny = createServiceSupabaseClient() as any;
  const { data: row } = await supabaseAny
    .from('organizations')
    .select('user_id')
    .eq('id', orgId)
    .maybeSingle();
  if (row?.user_id) return String(row.user_id);
  const { data: leg } = await supabaseAny
    .from('organizaciones')
    .select('owner_user_id')
    .eq('id', orgId)
    .maybeSingle();
  return leg?.owner_user_id ? String(leg.owner_user_id) : null;
}

export class SubtareaEnviarValidarService {
  static async ejecutar(params: {
    subtareaId: string;
    user: { id: string; email?: string | null };
    evidenciaUrl?: string | null;
    videoUrl?: string | null;
    problemas?: string | null;
  }) {
    const { subtareaId, user, evidenciaUrl, videoUrl, problemas } = params;
    const supabase = createServiceSupabaseClient();

    const raw = await SubtareasRepository.findById(subtareaId, SUBTAREA_ENVIAR_VALIDAR_SELECT);
    if (!raw) {
      throw new Error('Subtarea no encontrada');
    }
    const subtarea = raw as SubtareaEnviarRow;

    const orgId = subtarea.tareas?.org_id as string | undefined;
    if (!orgId) {
      throw new Error('Organización no encontrada');
    }

    const rol = await PermisoService.obtenerRolEnOrganizacion(user.id, orgId);
    const socio = await resolveSocioParaOperacionDeTarea(
      supabase,
      { id: user.id, email: user.email ?? null },
      {
        responsableSocioId: subtarea.socio_id ?? subtarea.tareas?.responsable_socio_id ?? null,
        orgId,
      },
    );
    if (rol !== 'SOCIO' && !socio) {
      throw new Error('Solo socios pueden enviar bloques a validar');
    }

    const socioId = socio?.id ?? (await PermisoService.obtenerSocioIdPorUsuario(user.id, orgId));
    if (!socioId) {
      throw new Error('No se encontró tu perfil de socio');
    }

    let urlTrim = typeof subtarea.evidencia_url === 'string' ? subtarea.evidencia_url.trim() : '';
    const evidenciaBody = typeof evidenciaUrl === 'string' ? evidenciaUrl.trim() : '';

    if (evidenciaBody && !urlTrim) {
      await SubtareasRepository.update(subtareaId, {
        evidencia_url: evidenciaBody,
        evidencia_cargada: true,
      });
      subtarea.evidencia_url = evidenciaBody;
      subtarea.evidencia_cargada = true;
      urlTrim = evidenciaBody;
    }

    const evidenciaObligatoria = Boolean(subtarea.evidencia_obligatoria);
    const evidenciaCargada = Boolean(subtarea.evidencia_cargada);
    if (evidenciaObligatoria && (!evidenciaCargada || !urlTrim)) {
      const err = new Error('Debés cargar evidencia en el bloque antes de enviar a validar.');
      (err as Error & { code?: string }).code = 'EVIDENCIA_REQUERIDA';
      throw err;
    }

    if (urlTrim) {
      try {
        const storagePath = urlTrim.includes('/evidencias/')
          ? (urlTrim.split('/evidencias/').pop()?.split('?')[0] ?? urlTrim)
          : urlTrim
              .replace(/^https?:\/\/[^/]+\/storage\/v1\/object\/public\/evidencias\//, '')
              .split('?')[0];
        await registrarEvidenciaSubtarea(supabase, {
          subtareaId,
          storagePath,
          publicUrl: urlTrim,
          actorName: user.email ?? user.id,
          actorRole: 'Socio',
          actorMethod: 'login',
          notas: problemas,
        });
      } catch (histErr) {
        console.warn('[SubtareaEnviarValidarService] historial evidencia:', histErr);
      }
    }

    if (evidenciaUrl || videoUrl || problemas) {
      const patch: Record<string, unknown> = {};
      const puedeCompletarEvidenciaDesdeBody = Boolean(evidenciaUrl?.trim()) && !urlTrim;
      if (evidenciaUrl && puedeCompletarEvidenciaDesdeBody) {
        patch.evidencia_url = evidenciaUrl;
        patch.evidencia_cargada = true;
      }
      if (videoUrl) patch.video_url = videoUrl;
      if (problemas) patch.problemas = problemas;
      if (Object.keys(patch).length > 0) {
        await SubtareasRepository.update(subtareaId, patch);
      }
    }

    const actorSubtarea = { id: user.id, rol: 'SOCIO' as const, socioId };
    const estadoNorm = normalizeEstadoBloqueParaOperacion(subtarea.estado);

    if (estadoNorm === ESTADO_BLOQUE_PARA_VALIDAR || estadoNorm === ESTADO_BLOQUE_FINAL) {
      const already = await SubtareasRepository.fetchUi(subtareaId);
      return { subtarea: already, idempotent: true };
    }

    if (estadoNorm === 'pendiente' || estadoNorm === 'rechazado') {
      await SubtareaMvpService.iniciarBloque(subtareaId, actorSubtarea);
    }

    await SubtareaMvpService.enviarParaValidar(subtareaId, actorSubtarea);

    const quedanPendientes = await SubtareasRepository.tieneBloquesPendientesValidacion(
      subtarea.tarea_id,
    );

    if (!quedanPendientes) {
      const estadoTarea = TareaComandosService.mapLegacyToOficial(
        await TareasRepository.findEstadoById(subtarea.tarea_id),
      );

      if (estadoTarea === 'pendiente') {
        await TareaComandosService.transicionar({
          tareaId: subtarea.tarea_id,
          nuevoEstado: 'en_progreso',
          actorId: user.id,
          rol: 'SOCIO',
          motivo: 'Tarea en ejecución al enviar bloques a validar',
          socioOperadorId: socioId,
        });
      }

      await TareaComandosService.transicionar({
        tareaId: subtarea.tarea_id,
        nuevoEstado: 'para_validar',
        actorId: user.id,
        rol: 'SOCIO',
        motivo: 'Bloques enviados a validar',
        socioOperadorId: socioId,
      });
    }

    const updated = await SubtareasRepository.fetchUi(subtareaId);

    try {
      const destinatarioCliente = await obtenerUserIdClienteOrganizacion(orgId);
      if (destinatarioCliente) {
        const t = (updated as { tareas?: { title?: string | null; obra_id?: string | null } | null })
          ?.tareas;
        const tareaTitulo =
          typeof t?.title === 'string' && t.title.trim() ? t.title.trim() : 'la tarea';
        const supabaseAny = createServiceSupabaseClient() as any;
        const { error: notifError } = await supabaseAny.from('notificaciones').insert({
          org_id: orgId,
          obra_id: t?.obra_id ?? null,
          tarea_id: subtarea.tarea_id,
          remitente_id: user.id,
          destinatario_id: destinatarioCliente,
          tipo: 'bloque_para_validar',
          titulo: 'Bloque listo para validar',
          mensaje: `El socio envió evidencia de un bloque de «${tareaTitulo}» para tu revisión en Validaciones.`,
          leida: false,
          created_at: new Date().toISOString(),
        });
        if (notifError) {
          console.warn('[SubtareaEnviarValidarService] notificación:', notifError);
        }
      }
    } catch (notifEx) {
      console.warn('[SubtareaEnviarValidarService] notificación (ex):', notifEx);
    }

    return { subtarea: updated, idempotent: false };
  }
}

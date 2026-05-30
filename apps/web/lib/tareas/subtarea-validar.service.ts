import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { ClienteWalletService } from '@/lib/services/cliente-wallet.service';
import { WalletMvpService } from '@/lib/services/wallet-mvp.service';
import {
  ESTADO_BLOQUE_FINAL,
  ESTADO_BLOQUE_PARA_VALIDAR,
  normalizeEstadoBloqueParaOperacion,
} from '@/lib/domain/estados-core';
import { SubtareasRepository } from './infrastructure/subtareas.repository';
import { TareaComandosService } from './tarea-comandos.service';

type SubtareaValidarRow = {
  id: string;
  tarea_id: string;
  estado: string;
  socio_id?: string | null;
  evidencia_obligatoria?: boolean | null;
  evidencia_cargada?: boolean | null;
  evidencia_url?: string | null;
  validado_en_obra_at?: string | null;
  tareas?: {
    org_id?: string | null;
    responsable_socio_id?: string | null;
  } | null;
};

const SUBTAREA_VALIDAR_SELECT = `
  id,
  tarea_id,
  estado,
  socio_id,
  evidencia_obligatoria,
  evidencia_cargada,
  evidencia_url,
  validado_en_obra_at,
  tareas:tareas (
    org_id,
    responsable_socio_id
  )
`;

export type SubtareaValidarResult = {
  tareaValidada: boolean;
  validadoEnObra?: boolean;
  reconciliacion?: Awaited<ReturnType<typeof ClienteWalletService.reconciliarSubtareaValidada>>;
  walletWarning?: string | null;
};

function cumpleRequisitoEvidencia(subtarea: SubtareaValidarRow): boolean {
  if (subtarea.evidencia_obligatoria === false) return true;
  const url = String(subtarea.evidencia_url ?? '').trim();
  if (url) return true;
  return Boolean(subtarea.evidencia_cargada && url);
}

export class SubtareaValidarService {
  static async ejecutar(params: {
    subtareaId: string;
    actorUserId: string;
    accion?: 'validar' | 'rechazar' | 'validar_en_obra';
    metodoPago?: 'EFECTIVO' | 'ONLINE';
    motivo?: string | null;
  }): Promise<SubtareaValidarResult> {
    const { subtareaId, actorUserId } = params;
    const accion = params.accion ?? 'validar';
    const ahora = new Date().toISOString();

    const raw = await SubtareasRepository.findById(subtareaId, SUBTAREA_VALIDAR_SELECT);
    if (!raw) {
      throw new Error('Subtarea no encontrada');
    }
    const subtarea = raw as SubtareaValidarRow;

    const estadoNorm = normalizeEstadoBloqueParaOperacion(subtarea.estado);

    if (accion === 'validar_en_obra' && subtarea.validado_en_obra_at) {
      return { tareaValidada: false, validadoEnObra: true };
    }

    if (estadoNorm === ESTADO_BLOQUE_FINAL) {
      if (accion === 'validar') {
        const reconciliacion = await this.reconciliarWalletSeguro({
          subtareaId,
          clienteUserId: actorUserId,
          metodoPago: params.metodoPago,
        });
        return {
          tareaValidada: true,
          reconciliacion: reconciliacion.result ?? undefined,
          walletWarning: reconciliacion.warning,
        };
      }
      return { tareaValidada: true, validadoEnObra: Boolean(subtarea.validado_en_obra_at) };
    }

    if (estadoNorm !== ESTADO_BLOQUE_PARA_VALIDAR) {
      throw new Error(
        `El bloque debe estar en ${ESTADO_BLOQUE_PARA_VALIDAR} (actual: ${subtarea.estado ?? 'desconocido'})`,
      );
    }

    if (!cumpleRequisitoEvidencia(subtarea)) {
      throw new Error('No se puede validar el bloque sin evidencia cargada');
    }

    const socioId = subtarea.socio_id ?? subtarea.tareas?.responsable_socio_id ?? null;
    if (!socioId) {
      throw new Error('La subtarea no tiene socio asociado');
    }
    if (!subtarea.tareas?.org_id) {
      throw new Error('La subtarea no tiene organización asociada');
    }

    if (accion === 'rechazar') {
      await SubtareasRepository.update(subtareaId, { estado: 'rechazado' });
      return { tareaValidada: false };
    }

    if (accion === 'validar_en_obra') {
      await SubtareasRepository.update(subtareaId, {
        validado_en_obra_at: ahora,
        validado_en_obra_por: actorUserId,
      });
      return { tareaValidada: false, validadoEnObra: true };
    }

    await SubtareasRepository.update(subtareaId, { estado: ESTADO_BLOQUE_FINAL });

    let walletWarning: string | null = null;
    let reconciliacion: SubtareaValidarResult['reconciliacion'];

    try {
      await WalletMvpService.verificarSocioNoSuspendido(socioId);
    } catch (err) {
      walletWarning =
        err instanceof Error ? err.message : 'No se pudo verificar el estado del socio';
    }

    const wallet = await this.reconciliarWalletSeguro({
      subtareaId,
      clienteUserId: actorUserId,
      metodoPago: params.metodoPago,
    });
    reconciliacion = wallet.result ?? undefined;
    if (wallet.warning) {
      walletWarning = walletWarning ? `${walletWarning}; ${wallet.warning}` : wallet.warning;
    }

    const supabaseAny = createServiceSupabaseClient() as any;
    const { data: restantes } = await supabaseAny
      .from('tareas_subtareas')
      .select('id')
      .eq('tarea_id', subtarea.tarea_id)
      .neq('estado', ESTADO_BLOQUE_FINAL)
      .limit(1);

    const tareaValidada = !restantes || restantes.length === 0;

    if (tareaValidada) {
      try {
        await TareaComandosService.reconciliarSiTodosBloquesValidados(subtarea.tarea_id, {
          actorId: actorUserId,
          motivo: params.motivo ?? 'Validación automática por bloques',
        });
      } catch (fsmErr) {
        console.warn('[SubtareaValidarService] cierre FSM tarea:', fsmErr);
      }
    }

    return { tareaValidada, reconciliacion, walletWarning };
  }

  private static async reconciliarWalletSeguro(params: {
    subtareaId: string;
    clienteUserId: string;
    metodoPago?: 'EFECTIVO' | 'ONLINE';
  }): Promise<{
    result: Awaited<ReturnType<typeof ClienteWalletService.reconciliarSubtareaValidada>> | null;
    warning: string | null;
  }> {
    try {
      const result = await ClienteWalletService.reconciliarSubtareaValidada({
        subtareaId: params.subtareaId,
        clienteUserId: params.clienteUserId,
        metodoPago: params.metodoPago ?? 'ONLINE',
      });
      return { result, warning: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error en billetera';
      console.warn('[SubtareaValidarService] wallet:', msg);
      return { result: null, warning: msg };
    }
  }
}

import type { SupabaseClient } from '@supabase/supabase-js';

import { PermisoService } from '@/lib/services/permiso.service';
import { estadoPresupuestoEsAprobado } from '@/lib/domain/aprobacion-presupuesto-tarea';

/** Alineado a reglas producto A/B/C/D (sin filtrar columnas legacy en PostgREST). */
export type SocioTareaOperacionChecks = {
  A_responsableSocioId: boolean;
  B_presupuestoAprobado: boolean;
  C_socioEnCuadrilla: boolean;
  D_legacyResponsableSinResponsableSocioId: boolean;
};

export type SocioTareaOperacionDebug = {
  tareaId: string;
  orgId: string;
  userId: string;
  userEmail: string;
  tarea: {
    estado: string | null;
    responsable_socio_id: string | null;
    responsable: string | null;
    cuadrilla_id: string | null;
  };
  socioIdPorUserId: string | null;
  socioIdPorEmail: string | null;
  socioIdEfectivo: string | null;
  checks: SocioTareaOperacionChecks;
  motivoDenegacion: string | null;
};

function legacyMatchResponsable(
  responsable: string,
  userEmail: string,
  nombreSocio: string | null,
): boolean {
  const responsableNormalizado = responsable.trim().toLowerCase();
  const emailNormalizado = userEmail.trim().toLowerCase();
  if (responsableNormalizado === emailNormalizado) return true;
  if (
    responsableNormalizado.includes(emailNormalizado) ||
    emailNormalizado.includes(responsableNormalizado)
  ) {
    return true;
  }
  if (nombreSocio?.trim()) {
    const nombreNormalizado = nombreSocio.trim().toLowerCase();
    if (
      responsableNormalizado.includes(nombreNormalizado) ||
      nombreNormalizado.includes(responsableNormalizado)
    ) {
      return true;
    }
    const primeraPalabraNombre = nombreNormalizado.split(' ')[0];
    const primeraPalabraResponsable = responsableNormalizado.split(' ')[0];
    if (
      primeraPalabraNombre &&
      primeraPalabraResponsable &&
      (primeraPalabraResponsable.includes(primeraPalabraNombre) ||
        primeraPalabraNombre.includes(primeraPalabraResponsable))
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Reglas SOCIO para operar una tarea (iniciar / transition / generar-bloques).
 * D solo si no hay `responsable_socio_id`.
 */
export class SocioTareaOperacionService {
  static async evaluarSocioPuedeOperarTarea(
    supabase: SupabaseClient,
    input: {
      userId: string;
      userEmail: string;
      orgId: string;
      tarea: {
        id: string;
        estado: string | null;
        responsable_socio_id: string | null;
        responsable: string | null;
        cuadrilla_id: string | null;
      };
    },
  ): Promise<{ allowed: boolean; socioIdEfectivo: string | null; debug: SocioTareaOperacionDebug }> {
    const supabaseAny = supabase as any;
    const { userId, userEmail, orgId, tarea } = input;

    const socioIdPorUserId = await PermisoService.obtenerSocioIdPorUsuario(userId, orgId);

    let socioIdPorEmail: string | null = null;
    let nombreSocio: string | null = null;
    if (userEmail?.trim()) {
      const { data: row } = await supabaseAny
        .from('socios')
        .select('id, nombre')
        .eq('org_id', orgId)
        .eq('email', userEmail.trim())
        .maybeSingle();
      socioIdPorEmail = row?.id ?? null;
      nombreSocio = row?.nombre ?? null;
    }

    const socioIdEfectivo = socioIdPorUserId ?? socioIdPorEmail;

    const debugBase: SocioTareaOperacionDebug = {
      tareaId: tarea.id,
      orgId,
      userId,
      userEmail,
      tarea: {
        estado: tarea.estado,
        responsable_socio_id: tarea.responsable_socio_id,
        responsable: tarea.responsable,
        cuadrilla_id: tarea.cuadrilla_id,
      },
      socioIdPorUserId,
      socioIdPorEmail,
      socioIdEfectivo,
      checks: {
        A_responsableSocioId: false,
        B_presupuestoAprobado: false,
        C_socioEnCuadrilla: false,
        D_legacyResponsableSinResponsableSocioId: false,
      },
      motivoDenegacion: null,
    };

    if (!socioIdEfectivo) {
      return {
        allowed: false,
        socioIdEfectivo: null,
        debug: {
          ...debugBase,
          motivoDenegacion: 'NO_SOCIO_EN_ORG',
        },
      };
    }

    const A =
      !!tarea.responsable_socio_id &&
      !!socioIdEfectivo &&
      tarea.responsable_socio_id === socioIdEfectivo;
    debugBase.checks.A_responsableSocioId = A;

    let B = false;
    const { data: presRows } = await supabaseAny
      .from('tareas_presupuestos')
      .select('id, estado')
      .eq('tarea_id', tarea.id)
      .eq('socio_id', socioIdEfectivo)
      .limit(12);
    B = !!(presRows ?? []).some((p: { estado?: string | null }) =>
      estadoPresupuestoEsAprobado(p.estado),
    );
    debugBase.checks.B_presupuestoAprobado = B;

    let C = false;
    if (tarea.cuadrilla_id && socioIdEfectivo) {
      if (tarea.cuadrilla_id === socioIdEfectivo) {
        C = true;
      } else {
        const { data: cs } = await supabaseAny
          .from('cuadrilla_socios')
          .select('id')
          .eq('cuadrilla_id', tarea.cuadrilla_id)
          .eq('socio_id', socioIdEfectivo)
          .or('activo.is.null,activo.eq.true')
          .limit(1)
          .maybeSingle();
        C = !!cs;
      }
    }
    debugBase.checks.C_socioEnCuadrilla = C;

    let D = false;
    if (!tarea.responsable_socio_id && tarea.responsable?.trim() && userEmail?.trim()) {
      if (!nombreSocio) {
        const { data: srow } = await supabaseAny
          .from('socios')
          .select('nombre')
          .eq('id', socioIdEfectivo)
          .maybeSingle();
        nombreSocio = srow?.nombre ?? nombreSocio;
      }
      D = legacyMatchResponsable(tarea.responsable, userEmail, nombreSocio);
    }
    debugBase.checks.D_legacyResponsableSinResponsableSocioId = D;

    const allowed = A || B || C || D;
    return {
      allowed,
      socioIdEfectivo,
      debug: {
        ...debugBase,
        motivoDenegacion: allowed ? null : 'NINGUNA_REGLA_A_B_C_D',
      },
    };
  }

  /** Payload plano para JSON 403 (desarrollo). Sin tokens. */
  static toTransition403Debug(params: {
    role: string;
    orgId: string;
    tareaOrgId: string | null;
    tareaId: string;
    tareaEstado: string | null;
    userId: string;
    userEmail: string;
    socioIdEfectivo: string | null;
    responsableSocioId: string | null;
    cuadrillaId: string | null;
    tareaResponsable: string | null;
    checks: SocioTareaOperacionChecks;
    motivo403: string;
  }) {
    return {
      userId: params.userId,
      userEmail: params.userEmail,
      role: params.role,
      orgId: params.orgId,
      socioIdEfectivo: params.socioIdEfectivo,
      tareaId: params.tareaId,
      tareaEstado: params.tareaEstado,
      tareaOrgId: params.tareaOrgId,
      responsableSocioId: params.responsableSocioId,
      cuadrillaId: params.cuadrillaId,
      tareaResponsable: params.tareaResponsable,
      presupuestoAprobado: params.checks.B_presupuestoAprobado,
      socioEnCuadrilla: params.checks.C_socioEnCuadrilla,
      matchResponsableLegacy: params.checks.D_legacyResponsableSinResponsableSocioId,
      matchResponsableSocioId: params.checks.A_responsableSocioId,
      motivo403: params.motivo403,
    };
  }
}

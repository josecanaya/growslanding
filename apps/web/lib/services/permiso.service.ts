import { createServiceSupabaseClient } from '../supabase-server';

export type RolActor = 'SOCIO' | 'CLIENTE';

type SocioRecord = {
  id: string;
  org_id: string | null;
  user_id?: string | null;
};

export type ActorContext = {
  rol: RolActor;
  socioId: string | null;
};

export class PermisoService {
  /**
   * Obtiene el rol efectivo del usuario dentro de una organizaciИn.
   * Retorna null si no pertenece.
   */
  static async obtenerRolEnOrganizacion(
    userId: string,
    orgId: string,
  ): Promise<RolActor | null> {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    const { data: socio } = await supabaseAny
      .from('socios')
      .select('id, org_id, user_id')
      .eq('org_id', orgId)
      .eq('user_id', userId)
      .maybeSingle();

    if (socio && (socio.user_id === userId || !socio.user_id)) {
      return 'SOCIO';
    }

    let { data: organizacion } = await supabaseAny
      .from('organizations')
      .select('user_id')
      .eq('id', orgId)
      .maybeSingle();

    // Compat temporal con esquema legacy
    if (!organizacion) {
      const legacyOrg = await supabaseAny
        .from('organizaciones')
        .select('owner_user_id')
        .eq('id', orgId)
        .maybeSingle();
      if (legacyOrg.data) {
        organizacion = { user_id: legacyOrg.data.owner_user_id };
      }
    }

    if (organizacion?.user_id === userId) {
      return 'CLIENTE';
    }

    return null;
  }

  static async obtenerSocioIdPorUsuario(userId: string, orgId?: string) {
    const supabase = createServiceSupabaseClient();
    const supabaseAny = supabase as any;

    let query = supabaseAny
      .from('socios')
      .select('id, org_id, user_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1);

    if (orgId) {
      query = query.eq('org_id', orgId);
    }

    const { data } = await query.maybeSingle();
    return data?.id ?? null;
  }

  static async obtenerContextoActor(
    userId: string,
    orgId: string,
  ): Promise<ActorContext | null> {
    const rol = await this.obtenerRolEnOrganizacion(userId, orgId);
    if (!rol) {
      return null;
    }

    const socioId = rol === 'SOCIO' ? await this.obtenerSocioIdPorUsuario(userId, orgId) : null;
    return {
      rol,
      socioId,
    };
  }

  static async esSocio(userId: string, orgId: string) {
    const rol = await this.obtenerRolEnOrganizacion(userId, orgId);
    return rol === 'SOCIO';
  }

  static async esCliente(userId: string, orgId: string) {
    const rol = await this.obtenerRolEnOrganizacion(userId, orgId);
    return rol === 'CLIENTE';
  }
}

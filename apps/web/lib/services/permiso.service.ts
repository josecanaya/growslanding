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
   * Rol según org (cliente = dueño de `organizations` / legacy; socio = fila `socios` con **mismo `org_id`**).
   * Si el socio tiene `socios.org_id` null, aquí **no** devuelve `SOCIO` aunque `user_id` coincida.
   * Para operación de tareas usá además `listSocioRecordsForAuthUser` / `evaluarSocioPuedeOperarTarea`.
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
    if (data?.id) {
      return data.id;
    }
    /** Fila `socios` con `org_id` null: el filtro por org no matchea; permitir resolver solo por `user_id`. */
    if (orgId) {
      const { data: lax } = await supabaseAny
        .from('socios')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      return lax?.id ?? null;
    }

    return null;
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

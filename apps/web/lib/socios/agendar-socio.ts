import { createServiceSupabaseClient } from '@/lib/supabase-server';
import { resolveOrgContext } from '@/lib/orgs';
import { normalizeRole } from '@/lib/roles';
import { normalizePublicCodigoForLookup } from '@/lib/socios/public-code';

export const QR_SCOPE_SOCIO = 'socio_asociacion';

export type AgendaMetodo = 'qr' | 'id_publico' | 'email' | 'telefono';

export type SocioSourceRecord = {
  id: string;
  org_id: string | null;
  nombre: string | null;
  email: string | null;
  telefono: string | null;
  estado: string | null;
  especialidad: string | null;
  public_codigo?: string | null;
};

export type OrgRecord = {
  id: string;
  name: string | null;
};

export function normalizeQrTokenInput(raw: string) {
  const trimmed = raw.trim();

  try {
    const url = new URL(trimmed);
    const codeParam = url.searchParams.get('code');
    if (codeParam?.trim()) {
      return codeParam.trim();
    }

    const queryToken =
      url.searchParams.get('agendar_socio') ||
      url.searchParams.get('asociar_socio') ||
      url.searchParams.get('token') ||
      url.searchParams.get('code');

    if (queryToken) {
      return queryToken.trim();
    }

    const lastSegment = url.pathname.split('/').filter(Boolean).pop();
    if (lastSegment) {
      return lastSegment.trim();
    }
  } catch {
    // token plano
  }

  return trimmed
    .replace(/^grows:socio:/i, '')
    .replace(/^\/socio\/qr\//i, '')
    .replace(/^\/cliente\/cuadrillas\?asociar_socio=/i, '')
    .replace(/^\/cliente\/agenda-socios\?agendar_socio=/i, '')
    .trim();
}

export async function resolveOrgForClienteAgenda(user: {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}): Promise<OrgRecord | null> {
  const role = normalizeRole(user.app_metadata?.role ?? user.user_metadata?.role);
  if (role === 'SOCIO') {
    return null;
  }

  const { org } = await resolveOrgContext(
    user.id,
    (user.user_metadata?.full_name as string | undefined) ?? user.email ?? 'Organización',
    user.email,
  );

  return { id: org.id, name: org.name };
}

export async function resolveSourceSocioByQrToken(
  token: string,
): Promise<{ sourceSocio: SocioSourceRecord } | { error: string; status: number }> {
  const supabase = createServiceSupabaseClient();
  const { data: qrToken, error: qrError } = await (supabase as any)
    .from('qr_tokens')
    .select('id, ref_id, enabled, scope')
    .eq('token', token)
    .eq('scope', QR_SCOPE_SOCIO)
    .maybeSingle();

  if (qrError) {
    throw qrError;
  }

  const qrRecord = qrToken as
    | { id: string; ref_id: string; enabled: boolean | null; scope: string | null }
    | null;

  if (!qrRecord || qrRecord.enabled === false) {
    return { error: 'QR de socio inválido o deshabilitado.', status: 404 };
  }

  const { data: sourceSocio, error: socioError } = await supabase
    .from('socios')
    .select('id, org_id, nombre, email, telefono, estado, especialidad, public_codigo')
    .eq('id', qrRecord.ref_id)
    .maybeSingle();

  if (socioError) {
    throw socioError;
  }

  const socio = sourceSocio as SocioSourceRecord | null;
  if (!socio) {
    return { error: 'Socio no encontrado para este QR.', status: 404 };
  }

  return { sourceSocio: socio };
}

export async function resolveSourceSocioByPublicCodigo(
  codigo: string,
): Promise<{ sourceSocio: SocioSourceRecord } | { error: string; status: number }> {
  const normalized = normalizePublicCodigoForLookup(codigo);
  if (normalized.length < 4) {
    return { error: 'Ingresá un ID de socio válido.', status: 400 };
  }

  const supabase = createServiceSupabaseClient();
  const cols = 'id, org_id, nombre, email, telefono, estado, especialidad, public_codigo';
  const supabaseAny = supabase as any;

  const pickEq = async (value: string) => {
    const { data, error } = await supabaseAny
      .from('socios')
      .select(cols)
      .eq('public_codigo', value)
      .maybeSingle();
    if (error) {
      throw error;
    }
    return data as SocioSourceRecord | null;
  };

  const pickIlike = async (value: string) => {
    const { data, error } = await supabaseAny
      .from('socios')
      .select(cols)
      .ilike('public_codigo', value)
      .maybeSingle();
    if (error) {
      throw error;
    }
    return data as SocioSourceRecord | null;
  };

  // 1) Valor estándar en BD: solo el núcleo (sin prefijo SOC-).
  let socio = await pickEq(normalized);

  // 2) Filas antiguas o copiadas con prefijo completo en la columna.
  if (!socio) {
    socio = await pickEq(`SOC-${normalized}`);
  }

  // 3) Diferencias de mayúsculas en BD.
  if (!socio) {
    socio = await pickIlike(normalized);
  }
  if (!socio) {
    socio = await pickIlike(`SOC-${normalized}`);
  }

  if (!socio) {
    return { error: 'No encontramos un socio con ese ID.', status: 404 };
  }

  return { sourceSocio: socio };
}

/**
 * Pega de QR: intenta token legacy en qr_tokens; si no, código público (SOC-… / URL con ?code=).
 */
export async function resolveSocioFromQrPaste(
  raw: string,
): Promise<{ sourceSocio: SocioSourceRecord } | { error: string; status: number }> {
  const normalized = normalizeQrTokenInput(raw);
  if (!normalized) {
    return { error: 'Pegá el código o link del QR.', status: 400 };
  }

  const byToken = await resolveSourceSocioByQrToken(normalized);
  if (!('error' in byToken)) {
    return byToken;
  }

  if (byToken.status !== 404) {
    return byToken;
  }

  return resolveSourceSocioByPublicCodigo(normalized);
}

function normalizeEmail(email: string) {
  return email
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
    .toLowerCase();
}

function normalizeTelefono(telefono: string) {
  return telefono.replace(/\s+/g, '').trim();
}

export async function resolveSourceSocioByEmail(
  email: string,
): Promise<{ sourceSocio: SocioSourceRecord } | { error: string; status: number }> {
  const e = normalizeEmail(email);
  if (!e || !e.includes('@')) {
    return { error: 'Ingresá un email válido.', status: 400 };
  }

  const supabase = createServiceSupabaseClient();
  const { data: rows, error } = await supabase
    .from('socios')
    .select('id, org_id, nombre, email, telefono, estado, especialidad, public_codigo')
    .ilike('email', e)
    .order('created_at', { ascending: true })
    .limit(5);

  if (error) {
    throw error;
  }

  const list = (rows ?? []) as unknown as SocioSourceRecord[];
  const active = list.filter((s) => (s.estado || '').toLowerCase() !== 'inactivo');
  const socio = active[0] ?? list[0];
  if (!socio) {
    return {
      error: 'No encontramos un socio con ese email.',
      status: 404,
    };
  }

  return { sourceSocio: socio };
}

export async function resolveSourceSocioByTelefono(
  telefono: string,
): Promise<{ sourceSocio: SocioSourceRecord } | { error: string; status: number }> {
  const t = normalizeTelefono(telefono);
  if (t.length < 6) {
    return { error: 'Ingresá un teléfono con al menos 6 dígitos.', status: 400 };
  }

  const supabase = createServiceSupabaseClient();
  const { data: exactRows, error: exactErr } = await supabase
    .from('socios')
    .select('id, org_id, nombre, email, telefono, estado, especialidad, public_codigo')
    .eq('telefono', t)
    .order('created_at', { ascending: true })
    .limit(5);

  if (exactErr) {
    throw exactErr;
  }

  let rows = exactRows;
  if (!rows?.length) {
    const digits = t.replace(/\D/g, '');
    if (digits.length >= 6) {
      const { data: fuzzyRows, error: fuzzyErr } = await supabase
        .from('socios')
        .select('id, org_id, nombre, email, telefono, estado, especialidad, public_codigo')
        .ilike('telefono', `%${digits}%`)
        .order('created_at', { ascending: true })
        .limit(5);

      if (fuzzyErr) {
        throw fuzzyErr;
      }
      rows = fuzzyRows;
    }
  }

  const list = (rows ?? []) as unknown as SocioSourceRecord[];
  const active = list.filter((s) => (s.estado || '').toLowerCase() !== 'inactivo');
  const socio = active[0] ?? list[0];
  if (!socio) {
    return { error: 'No hay un socio registrado con ese teléfono.', status: 404 };
  }

  return { sourceSocio: socio };
}

export type AgendarResult =
  | {
      success: true;
      socio_id: string;
      alreadyInOrg: boolean;
      alreadyInAgenda: boolean;
      message: string;
    }
  | { success: false; error: string; status: number };

/**
 * Registra el contacto en cliente_socio_agenda usando el mismo registro `socios.id`
 * (sin duplicar filas ni forzar org_id del socio). Así el contratista queda “libre”
 * y el arquitecto puede agendar a varios y pedirles presupuesto.
 */
export async function agendarSocioEnOrganizacion(params: {
  org: OrgRecord;
  sourceSocio: SocioSourceRecord;
  metodo: AgendaMetodo;
}): Promise<AgendarResult> {
  const { org, sourceSocio: socio, metodo } = params;
  const supabase = createServiceSupabaseClient();

  if (socio.estado && socio.estado.toLowerCase() === 'inactivo') {
    return { success: false, error: 'El socio está inactivo.', status: 403 };
  }

  const hasContacto = Boolean(socio.email?.trim() || socio.telefono?.trim());
  const hasNombre = Boolean(socio.nombre?.trim());
  if (!hasContacto && !hasNombre) {
    return {
      success: false,
      error:
        'El socio no tiene datos suficientes para agendarlo. Pedile que complete nombre o contacto en su perfil.',
      status: 400,
    };
  }

  const agendaIns = await insertAgendaBestEffort(supabase, {
    org_id: org.id,
    socio_id: socio.id,
    source_socio_id: socio.id,
    metodo,
  });

  return {
    success: true,
    socio_id: socio.id,
    alreadyInOrg: socio.org_id === org.id,
    alreadyInAgenda: agendaIns === 'duplicate',
    message:
      agendaIns === 'duplicate'
        ? 'Este socio ya estaba en tu agenda.'
        : 'Socio agendado correctamente.',
  };
}

async function insertAgendaBestEffort(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  row: {
    org_id: string;
    socio_id: string;
    source_socio_id: string;
    metodo: AgendaMetodo;
  },
): Promise<'inserted' | 'duplicate' | 'skipped'> {
  const { error } = await (supabase as any).from('cliente_socio_agenda').insert({
    org_id: row.org_id,
    socio_id: row.socio_id,
    source_socio_id: row.source_socio_id,
    metodo: row.metodo,
    estado: 'activo',
  });

  if (!error) {
    return 'inserted';
  }

  if (error.code === '23505') {
    return 'duplicate';
  }

  const msg = String(error.message || '').toLowerCase();
  if (
    msg.includes('cliente_socio_agenda') ||
    msg.includes('does not exist') ||
    error.code === '42P01'
  ) {
    console.warn('[AGENDA] Tabla cliente_socio_agenda no disponible; aplicá migraciones.', error);
    return 'skipped';
  }

  throw error;
}

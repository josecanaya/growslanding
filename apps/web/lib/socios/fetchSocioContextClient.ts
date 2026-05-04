/**
 * Perfil de socio para la sesión actual vía API (service role), evitando RLS del cliente.
 */
export type SocioContextDto = {
  id: string;
  org_id: string | null;
  /** org en fila socio o inferida desde tareas / presupuestos (para socios con org_id null). */
  effective_org_id: string | null;
  email: string | null;
  nombre: string | null;
};

export async function fetchSocioContextClient(): Promise<SocioContextDto | null> {
  try {
    const res = await fetch('/api/socio/context', { credentials: 'include', cache: 'no-store' });
    if (!res.ok) return null;
    const body = (await res.json()) as { ok?: boolean; socio?: SocioContextDto | null };
    if (!body?.ok || !body?.socio?.id) return null;
    const s = body.socio;
    return {
      ...s,
      effective_org_id:
        s.effective_org_id ?? (s.org_id && s.org_id !== '' ? s.org_id : null),
    };
  } catch {
    return null;
  }
}

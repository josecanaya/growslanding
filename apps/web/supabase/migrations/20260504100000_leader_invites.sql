-- Invitaciones de líder (email + token). Requerido por resolveOrgContext, listAccessibleOrgIds,
-- createLeaderInvite y /auth/invite. Sin esta tabla, PostgREST falla al consultar leader_invites.

CREATE TABLE IF NOT EXISTS public.leader_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  nombre text NOT NULL DEFAULT '',
  email text NOT NULL,
  rol text NOT NULL DEFAULT 'constructor',
  status text NOT NULL DEFAULT 'pending',
  accepted_at timestamptz,
  token uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leader_invites_org_email_unique UNIQUE (org_id, email),
  CONSTRAINT leader_invites_token_unique UNIQUE (token)
);

CREATE INDEX IF NOT EXISTS idx_leader_invites_email_status
  ON public.leader_invites (email, status);

CREATE INDEX IF NOT EXISTS idx_leader_invites_org
  ON public.leader_invites (org_id);

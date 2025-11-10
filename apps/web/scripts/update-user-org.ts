import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL ??
  process.env.VITE_SUPABASE_URL ??
  process.env.SUPABASE_URL_API ??
  null;
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_SERVICE_KEY ??
  process.env.PUBLIC_SUPABASE_SERVICE_ROLE_KEY ??
  null;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Faltan variables SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (probá exportarlas en PowerShell con `$env:SUPABASE_SERVICE_ROLE_KEY="..."` antes de correr el script)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

async function updateUserOrg(userId: string, orgId: string) {
  const { data: user, error: fetchError } = await supabase.auth.admin.getUserById(userId);
  if (fetchError || !user) {
    throw fetchError ?? new Error('Usuario no encontrado');
  }

  const existingMeta = (user.user?.user_metadata ?? {}) as Record<string, unknown>;
  const updatedMeta = {
    ...existingMeta,
    org_id: orgId,
  };

  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: updatedMeta,
  });

  if (error) {
    throw error;
  }

  console.log('✅ user_metadata actualizado:', {
    id: data.user?.id,
    org_id: (data.user?.user_metadata as Record<string, unknown> | undefined)?.org_id,
  });
}

const [userId, orgId] = process.argv.slice(2);
if (!userId || !orgId) {
  console.error('Uso: pnpm ts-node apps/web/scripts/update-user-org.ts <userId> <orgId>');
  process.exit(1);
}

updateUserOrg(userId, orgId)
  .then(() => {
    console.log('🎉 Listo.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error actualizando metadata:', error);
    process.exit(1);
  });


import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Database = any;

type TypedClient = SupabaseClient<Database>;

export function createServiceSupabaseClient(): TypedClient {
  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  // Durante el build, si no hay variables, retornar un cliente dummy
  // Esto evita que el build falle si las variables no están configuradas
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL && (!url || !serviceKey)) {
    // En producción en Vercel sin variables, retornar error
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  if (!url || !serviceKey) {
    // En desarrollo o build time, usar valores dummy para que no falle
    return createClient<Database>(
      url || "https://placeholder.supabase.co",
      serviceKey || "placeholder_key",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

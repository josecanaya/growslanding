import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import type { Database } from '@/lib/types/supabase.gen';

let browserSupabaseClient: ReturnType<typeof createClientComponentClient<Database>> | null = null;

export function getBrowserSupabaseClient() {
  if (!browserSupabaseClient) {
    browserSupabaseClient = createClientComponentClient<Database>();
  }
  return browserSupabaseClient;
}

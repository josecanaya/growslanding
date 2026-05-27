'use client';

import { useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import { enforceSocioSingleSession } from '@/lib/auth/enforce-socio-single-session';
import type { Database } from '@/lib/types/supabase.gen';

/**
 * Al montar el panel socio, invalida sesiones del mismo usuario en otros dispositivos.
 */
export function SocioSingleSessionGuard() {
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const supabase = createClientComponentClient<Database>();
    void (async () => {
      const { data } = await supabase.auth.getSession();
      await enforceSocioSingleSession(supabase, data.session);
    })();
  }, []);

  return null;
}

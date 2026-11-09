'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getBrowserSupabaseClient } from '@/lib/supabase/browser-client';
import { feedProfile } from '@/lib/obras/feed-profile';
import type { Role } from '@/lib/obras/simulation';

export function useFeedIdentity() {
  const [identity, setIdentity] = useState<{ user: User | null; profile: Role | null; ready: boolean }>({ user: null, profile: null, ready: false });
  useEffect(() => {
    let active = true;
    let generation = 0;
    const auth = getBrowserSupabaseClient().auth;
    const check = async () => {
      const request = ++generation;
      try {
        const { data, error } = await auth.getUser();
        if (active && request === generation) {
          const user = error ? null : data.user;
          setIdentity({ user, profile: user ? feedProfile(user) : null, ready: true });
        }
      } catch { if (active && request === generation) setIdentity({ user: null, profile: null, ready: true }); }
    };
    void check();
    const { data } = auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') {
        ++generation;
        setIdentity({ user: null, profile: null, ready: true });
      } else {
        // Do not call Supabase asynchronously inside its auth event lock.
        setTimeout(() => { if (active) void check(); }, 0);
      }
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);
  return { ...identity, async chooseProfile(profile: Role) {
    const auth = getBrowserSupabaseClient().auth;
    const { data: verified, error: verificationError } = await auth.getUser();
    if (verificationError || !verified.user) throw new Error('Tu sesión venció. Volvé a iniciar sesión.');
    const { data, error } = await auth.updateUser({ data: { grows_feed_profile: profile } });
    if (error || !data.user) throw new Error('No pudimos guardar tu perfil. Volvé a intentar.');
    setIdentity({ user: data.user, profile, ready: true });
  } };
}

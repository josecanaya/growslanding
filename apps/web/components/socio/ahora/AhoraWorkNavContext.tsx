'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type Ctx = {
  /** Si es true, el layout oculta el TabBar inferior (sesión at work / post-slide hasta cerrar). */
  hideBottomTabBar: boolean;
  setHideBottomTabBar: (v: boolean) => void;
};

const AhoraWorkNavContext = createContext<Ctx | null>(null);

export function AhoraWorkNavProvider({ children }: { children: ReactNode }) {
  const [hideBottomTabBar, setHideBottomTabBar] = useState(false);

  const value = useMemo(
    () => ({ hideBottomTabBar, setHideBottomTabBar }),
    [hideBottomTabBar],
  );

  return <AhoraWorkNavContext.Provider value={value}>{children}</AhoraWorkNavContext.Provider>;
}

export function useAhoraWorkNav() {
  const ctx = useContext(AhoraWorkNavContext);
  if (!ctx) {
    throw new Error('useAhoraWorkNav must be used within AhoraWorkNavProvider');
  }
  return ctx;
}

export function useAhoraWorkNavOptional(): Ctx | null {
  return useContext(AhoraWorkNavContext);
}

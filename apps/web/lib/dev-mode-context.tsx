'use client';

import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useMemo,
  useState,
} from 'react';

type DevModeContextValue = {
  devModeEnabled: boolean;
  setDevModeEnabled: Dispatch<SetStateAction<boolean>>;
};

const DevModeContext = createContext<DevModeContextValue | undefined>(
  undefined
);

export function DevModeProvider({ children }: { children: ReactNode }) {
  /** Por defecto off: siempre sesión Supabase real para pruebas con base de datos. */
  const [devModeEnabled, setDevModeEnabled] = useState(false);

  const value = useMemo(
    () => ({ devModeEnabled, setDevModeEnabled }),
    [devModeEnabled]
  );

  return (
    <DevModeContext.Provider value={value}>
      {children}
    </DevModeContext.Provider>
  );
}

export function useDevMode() {
  const context = useContext(DevModeContext);

  if (!context) {
    throw new Error('useDevMode debe usarse dentro de DevModeProvider');
  }

  return context;
}

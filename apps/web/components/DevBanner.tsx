'use client';

import { useDevMode } from '@/lib/dev-mode-context';

export default function DevBanner() {
  const { devModeEnabled } = useDevMode();

  if (!devModeEnabled) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-yellow-300 px-3 py-2 text-sm text-black shadow-md">
      🧩 Modo Desarrollador Activo – Panel Cliente Técnico
    </div>
  );
}

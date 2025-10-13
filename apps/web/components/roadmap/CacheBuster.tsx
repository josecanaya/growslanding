'use client';

import { useEffect } from 'react';

export function CacheBuster() {
  useEffect(() => {
    // Forzar recarga sin caché
    if (typeof window !== 'undefined') {
      // Limpiar localStorage específico del roadmap
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('roadmap:')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      console.log('🧹 Cache limpiado - amarillos eliminados');
    }
  }, []);

  return null;
}

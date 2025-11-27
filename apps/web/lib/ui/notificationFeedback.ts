/**
 * Helper para reproducir feedback (sonido/vibración) cuando llega una notificación
 */
export function playNotificationFeedback() {
  if (typeof window === 'undefined') return;

  try {
    // Vibración en mobile (opcional)
    if ('vibrate' in navigator) {
      navigator.vibrate?.(150);
    }

    // Sonido opcional si existe el audio en el DOM
    const audioElement = document.getElementById('grows-notification-sound') as HTMLAudioElement | null;
    if (audioElement) {
      audioElement.currentTime = 0;
      audioElement.play().catch(() => {
        // Ignorar errores de autoplay
      });
    }
  } catch {
    // Fallback silencioso
  }
}


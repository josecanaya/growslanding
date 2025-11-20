/**
 * Utilidades para manejo de códigos QR
 */

interface QRToken {
  id: string;
  ref_id: string;
  pin?: string | null;
  enabled: boolean;
}

/**
 * Decodifica y normaliza un token QR
 * @param qrPath - Ruta del QR (ej: "/t/abc123")
 * @returns Token normalizado sin el prefijo de ruta
 */
export function decodeQR(qrPath: string): string {
  // Remover el prefijo "/t/" si existe
  const normalized = qrPath.replace(/^\/t\//, '').trim();
  if (!normalized) {
    throw new Error('Token QR inválido');
  }
  return normalized;
}

/**
 * Valida el PIN para un token QR
 * @param qrToken - Token QR con información del PIN
 * @param providedPin - PIN proporcionado por el usuario (opcional)
 * @throws Error si el PIN es requerido pero no se proporcionó, o si no coincide
 */
export function assertPinForToken(
  qrToken: QRToken,
  providedPin?: string
): void {
  // Si el token tiene PIN configurado
  if (qrToken.pin) {
    // Si no se proporcionó PIN, lanzar error
    if (!providedPin) {
      throw new Error('PIN requerido para acceder a este QR');
    }
    // Si el PIN no coincide, lanzar error
    if (qrToken.pin !== providedPin) {
      throw new Error('PIN incorrecto');
    }
  }
  // Si no hay PIN configurado, no hacer nada (acceso libre)
}


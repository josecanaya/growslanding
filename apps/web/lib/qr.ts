const QR_PATH_PREFIX = '/t/';

export function decodeQR(input: string) {
  if (!input) {
    throw new Error('URL inválida');
  }

  let pathname = input;

  try {
    const url = new URL(input, 'https://placeholder.local');
    pathname = url.pathname;
  } catch {
    // Si no es una URL completa asumimos que ya es un path.
  }

  const index = pathname.indexOf(QR_PATH_PREFIX);
  if (index === -1) {
    throw new Error('Formato de QR no reconocido');
  }

  const token = pathname.slice(index + QR_PATH_PREFIX.length).split('/')[0];

  if (!token) {
    throw new Error('Token QR ausente');
  }

  return token;
}

export type QrTokenRecord = {
  pin: string | null;
  enabled: boolean;
};

export function assertPinForToken(
  token: Pick<QrTokenRecord, 'pin'>,
  providedPin?: string | null
) {
  if (!token.pin) {
    return true;
  }

  if (!providedPin || token.pin !== providedPin.trim()) {
    throw new Error('PIN requerido o incorrecto');
  }

  return true;
}

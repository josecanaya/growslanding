import { describe, expect, it } from 'vitest';
import { assertPinForToken, decodeQR } from '@/lib/qr';

describe('QR helpers', () => {
  it('decodeQR extrae el token desde una URL /t/<token>', () => {
    const token = decodeQR('https://demo.local/t/QR_ABC_123');
    expect(token).toBe('QR_ABC_123');
  });

  it('requiere PIN cuando el registro lo define', () => {
    const tokenRecord = { pin: '1234', enabled: true };

    expect(() => assertPinForToken(tokenRecord, undefined)).toThrowError(
      /PIN requerido/
    );
    expect(() => assertPinForToken(tokenRecord, '1234')).not.toThrow();
  });
});

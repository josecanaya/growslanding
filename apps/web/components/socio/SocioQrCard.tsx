'use client';

import { useEffect, useState } from 'react';
import * as QRCode from 'qrcode';
import { Copy, Loader2, QrCode, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';

type SocioQrData = {
  token: string;
  associationUrl: string;
  socio: {
    id: string;
    nombre: string | null;
    email: string | null;
  };
};

export function SocioQrCard() {
  const [data, setData] = useState<SocioQrData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  async function loadQr() {
    setLoading(true);
    setMessage(null);
    setCopyMessage(null);

    try {
      const response = await fetch('/api/socios/mi-qr', { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'No se pudo cargar tu QR de socio.');
      }

      const qr = payload.data as SocioQrData;
      const image = await QRCode.toDataURL(qr.associationUrl, {
        margin: 2,
        width: 240,
      });

      setData(qr);
      setQrDataUrl(image);
    } catch (error) {
      setData(null);
      setQrDataUrl(null);
      setMessage(
        error instanceof Error ? error.message : 'No se pudo cargar tu QR de socio.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadQr();
  }, []);

  async function copyAssociationUrl() {
    if (!data) {
      return;
    }

    try {
      await navigator.clipboard.writeText(data.associationUrl);
      setCopyMessage('Link copiado.');
    } catch {
      await navigator.clipboard.writeText(data.token);
      setCopyMessage('Código copiado.');
    }
  }

  return (
    <div className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-blue-50 p-2 text-blue-700">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Mi QR de socio</h3>
            <p className="text-xs text-gray-500">
              Compartilo con un cliente para que te asocie a su organización.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-md px-3"
          onClick={() => void loadQr()}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex min-h-[220px] items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generando QR…
        </div>
      ) : message ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {message}
        </div>
      ) : data && qrDataUrl ? (
        <div className="space-y-4">
          <div className="flex justify-center rounded-lg bg-gray-50 p-4">
            <img
              src={qrDataUrl}
              alt="QR personal de socio"
              className="h-60 w-60 rounded-md"
            />
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
              Código manual
            </p>
            <p className="break-all font-mono text-xs text-gray-700">{data.token}</p>
          </div>

          <Button
            type="button"
            className="w-full rounded-lg bg-[#002E5D] text-white hover:bg-[#003d7a]"
            onClick={() => void copyAssociationUrl()}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copiar link/código
          </Button>

          {copyMessage ? (
            <p className="text-center text-xs text-green-700">{copyMessage}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

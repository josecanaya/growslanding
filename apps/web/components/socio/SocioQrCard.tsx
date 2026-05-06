'use client';

import { useEffect, useState } from 'react';
import * as QRCode from 'qrcode';
import {
  Copy,
  Loader2,
  QrCode,
  RefreshCw,
  Share2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type SocioQrData = {
  token: string;
  publicCodigo?: string | null;
  qrUrl?: string | null;
  associationUrl?: string | null;
  socio: {
    id: string;
    nombre: string | null;
    email: string | null;
    oficio?: string | null;
  };
};

type SocioQrCardProps = {
  /** Nombre u oficio por defecto mientras carga el perfil desde API */
  fallbackDisplayName?: string;
  fallbackOficio?: string;
  /** Vista centrada en QR estilo “identidad digital” (referencia cuenta socio) */
  identityLayout?: boolean;
};

function friendlyLoadMessage() {
  return 'No pudimos cargar tu código ahora. Reintentá en un momento o completá tu email en el perfil.';
}

export function SocioQrCard({
  fallbackDisplayName = 'Socio',
  fallbackOficio = 'Contacto de obra',
  identityLayout = false,
}: SocioQrCardProps) {
  const [data, setData] = useState<SocioQrData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [errorHint, setErrorHint] = useState<string | null>(null);

  async function loadQr() {
    setLoading(true);
    setNeedsProfile(false);
    setCopyMessage(null);
    setErrorHint(null);

    try {
      const response = await fetch('/api/socios/me/qr', { cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok || !payload.success) {
        const msg = typeof payload.error === 'string' ? payload.error : '';
        const errText = msg.toLowerCase();
        if (response.status === 404 || errText.includes('perfil')) {
          setNeedsProfile(true);
        }
        if (msg) {
          setErrorHint(msg);
        }
        setData(null);
        setQrDataUrl(null);
        return;
      }

      const qr = payload.data as SocioQrData;
      const targetUrl = (qr.qrUrl || qr.associationUrl || '').trim();
      if (!targetUrl) {
        setData(null);
        setQrDataUrl(null);
        setErrorHint('No se pudo armar el enlace del QR. Reintentá.');
        return;
      }
      const image = await QRCode.toDataURL(targetUrl, {
        margin: 2,
        width: 280,
      });

      setData(qr);
      setQrDataUrl(image);
    } catch {
      setData(null);
      setQrDataUrl(null);
      setErrorHint('Error de red. Reintentá.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadQr();
  }, []);

  const displayName = data?.socio.nombre?.trim() || fallbackDisplayName;
  const oficio = data?.socio.oficio?.trim() || fallbackOficio;

  async function copyPublicId() {
    if (!data?.publicCodigo) {
      return;
    }
    try {
      await navigator.clipboard.writeText(data.publicCodigo);
      setCopyMessage('Listo: ID copiado.');
    } catch {
      setCopyMessage('No se pudo copiar. Reintentá desde el navegador.');
    }
  }

  async function copyAssociationUrl() {
    if (!data) {
      return;
    }
    const link = (data.qrUrl || data.associationUrl || '').trim();
    if (!link) {
      await copyPublicId();
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopyMessage('Listo: link copiado.');
    } catch {
      try {
        await navigator.clipboard.writeText(data.publicCodigo || data.token);
        setCopyMessage('Listo: código copiado.');
      } catch {
        setCopyMessage('No se pudo copiar. Reintentá desde el navegador.');
      }
    }
  }

  async function shareContact() {
    if (!data) {
      return;
    }
    const link = (data.qrUrl || data.associationUrl || '').trim();
    try {
      if (navigator.share && link) {
        await navigator.share({
          title: 'Mi contacto de obra — Grows',
          text: 'Usá este enlace para agendarme en tu agenda de socios.',
          url: link,
        });
        setCopyMessage('Compartido.');
        return;
      }
    } catch {
      /* usuario canceló o falló share */
    }
    await copyAssociationUrl();
  }

  const tituloQr = identityLayout ? 'TU IDENTIDAD DIGITAL' : 'Mi QR de socio';
  const subtituloQr = identityLayout
    ? 'Escaneá para agendar contacto'
    : 'Compartilo con un cliente para que te agende.';

  return (
    <>
      <section className="w-full space-y-6">
        <div
          className={
            identityLayout
              ? 'rounded-3xl border border-[#c3c6d5]/15 bg-white p-6 shadow-[0_24px_60px_rgba(22,50,116,0.14)] sm:p-8'
              : 'rounded-[2rem] border border-[#c3c6d5]/15 bg-white p-6 shadow-[0_20px_50px_rgba(22,50,116,0.12)] sm:p-8'
          }
        >
          <div className="mb-5 text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#163274]">{tituloQr}</p>
            <p className="mt-2 text-sm font-medium leading-relaxed text-[#434653]">{subtituloQr}</p>
          </div>

          {loading ? (
            <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-3xl bg-[#f2f4f6] text-sm text-[#434653]">
              <Loader2 className="h-8 w-8 animate-spin text-[#163274]" />
              Preparando tu código…
            </div>
          ) : needsProfile ? (
            <div className="rounded-3xl bg-[#f2f4f6] px-6 py-10 text-center">
              <QrCode className="mx-auto mb-4 h-14 w-14 text-[#163274]/40" />
              <p className="font-[family-name:var(--font-manrope,Manrope,sans-serif)] text-base font-bold text-[#163274]">
                Completá tu perfil para generar tu QR
              </p>
              <p className="mt-2 text-sm text-[#434653]">
                {errorHint ||
                  'Necesitamos tus datos básicos para crear tu tarjeta de contacto en Grows.'}
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-6 rounded-2xl border-[#163274] text-[#163274]"
                onClick={() => void loadQr()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reintentar
              </Button>
            </div>
          ) : !data || !qrDataUrl ? (
            <div className="rounded-3xl bg-[#f2f4f6] px-6 py-10 text-center">
              <QrCode className="mx-auto mb-4 h-14 w-14 text-[#163274]/40" />
              <p className="text-sm text-[#434653]">{errorHint || friendlyLoadMessage()}</p>
              <Button
                type="button"
                className="mt-6 rounded-2xl bg-[#163274] text-white hover:bg-[#314a8d]"
                onClick={() => void loadQr()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reintentar
              </Button>
            </div>
          ) : (
            <>
              <div
                className={
                  identityLayout
                    ? 'mx-auto max-w-[18rem] rounded-2xl bg-[#0f172a] p-4 shadow-inner'
                    : 'mx-auto max-w-[16rem] rounded-3xl bg-[#f2f4f6] p-3'
                }
              >
                <div
                  className={
                    identityLayout
                      ? 'overflow-hidden rounded-xl bg-white'
                      : 'relative overflow-hidden rounded-2xl bg-[#e0e3e5]'
                  }
                >
                  {!identityLayout ? (
                    <div
                      className="pointer-events-none absolute inset-0 opacity-10"
                      style={{
                        backgroundImage: 'radial-gradient(circle, #163274 1px, transparent 1px)',
                        backgroundSize: '8px 8px',
                      }}
                    />
                  ) : null}
                  <img
                    src={qrDataUrl}
                    alt="Código QR para ser agendado"
                    className={
                      identityLayout
                        ? 'relative z-[1] w-full p-3'
                        : 'relative z-[1] w-full rounded-2xl p-4'
                    }
                  />
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-xs font-medium text-[#434653]">
                  {identityLayout
                    ? 'Mostrá este código en obra para que te agenden como socio Grows.'
                    : 'Mostrá este QR o compartí tu ID para que un cliente te agende.'}
                </p>
              </div>

              {data.publicCodigo ? (
                <div className="mt-6 rounded-2xl border border-[#163274]/20 bg-[#d8e2ff]/30 px-4 py-4 text-center">
                  <p className="text-[11px] font-bold text-[#163274]">ID de socio: {data.publicCodigo}</p>
                </div>
              ) : null}

              <div
                className={
                  identityLayout
                    ? 'mt-5 flex flex-wrap items-center justify-center gap-2'
                    : 'mt-6 flex flex-col gap-3 sm:flex-row'
                }
              >
                <Button
                  type="button"
                  className={
                    identityLayout
                      ? 'h-9 rounded-full bg-[#163274] px-4 text-xs font-bold text-white hover:bg-[#314a8d]'
                      : 'h-12 flex-1 rounded-2xl bg-[#163274] font-bold text-white shadow-lg hover:bg-[#314a8d]'
                  }
                  onClick={() => void copyPublicId()}
                  disabled={!data.publicCodigo}
                >
                  <Copy className={identityLayout ? 'mr-1.5 h-3.5 w-3.5' : 'mr-2 h-5 w-5'} />
                  Copiar ID
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={
                    identityLayout
                      ? 'h-9 rounded-full border-[#163274]/40 px-4 text-xs font-semibold text-[#163274]'
                      : 'h-12 flex-1 rounded-2xl border-[#163274] font-bold text-[#163274]'
                  }
                  onClick={() => setQrDialogOpen(true)}
                >
                  <QrCode className={identityLayout ? 'mr-1.5 h-3.5 w-3.5' : 'mr-2 h-5 w-5'} />
                  Ampliar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className={
                    identityLayout
                      ? 'h-9 rounded-full border-[#163274]/40 px-4 text-xs font-semibold text-[#163274]'
                      : 'h-12 flex-1 rounded-2xl border-[#163274] font-bold text-[#163274] sm:col-span-1'
                  }
                  onClick={() => void shareContact()}
                >
                  <Share2 className={identityLayout ? 'mr-1.5 h-3.5 w-3.5' : 'mr-2 h-5 w-5'} />
                  Compartir
                </Button>
              </div>

              {!identityLayout ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-2 w-full text-[#434653]"
                  onClick={() => void copyAssociationUrl()}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar link de agendar
                </Button>
              ) : (
                <button
                  type="button"
                  className="mt-3 w-full text-center text-[11px] font-semibold text-[#43617c] underline-offset-2 hover:underline"
                  onClick={() => void copyAssociationUrl()}
                >
                  Copiar link de contacto
                </button>
              )}

              {copyMessage ? (
                <p className="mt-2 text-center text-xs text-[#163274]">{copyMessage}</p>
              ) : null}

              {!identityLayout ? (
                <details className="mt-4 rounded-xl bg-[#f2f4f6] px-3 py-2 text-left">
                  <summary className="cursor-pointer text-xs font-medium text-[#737784]">
                    Detalle para soporte (opcional)
                  </summary>
                  <p className="mt-2 break-all font-mono text-[10px] text-[#434653]">{data.token}</p>
                </details>
              ) : null}
            </>
          )}
        </div>

        {!identityLayout ? (
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl border-[#c3c6d5]/40"
              onClick={() => void loadQr()}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar QR
            </Button>
          </div>
        ) : (
          <p className="text-center">
            <button
              type="button"
              className="text-[11px] font-medium text-[#737784] underline-offset-2 hover:underline"
              onClick={() => void loadQr()}
              disabled={loading}
            >
              Actualizar código
            </button>
          </p>
        )}
      </section>

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-sm border-none bg-[#f7f9fb] p-6">
          <DialogHeader>
            <DialogTitle className="text-center font-[family-name:var(--font-manrope,Manrope,sans-serif)] text-[#163274]">
              {displayName}
            </DialogTitle>
            <p className="text-center text-sm text-[#434653]">{oficio}</p>
          </DialogHeader>
          {qrDataUrl ? (
            <div className="rounded-3xl bg-white p-4 shadow-inner">
              <img
                src={qrDataUrl}
                alt="QR ampliado"
                className="mx-auto w-full max-w-[280px]"
              />
            </div>
          ) : null}
          <p className="text-center text-xs text-[#434653]">
            Mostrá esta pantalla para que un cliente te agende.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}

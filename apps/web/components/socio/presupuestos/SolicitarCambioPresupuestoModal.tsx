'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/grows/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';

type Props = {
  open: boolean;
  onClose: () => void;
  presupuestoId: string;
  montoActual: number;
  onSuccess?: () => void;
};

export function SolicitarCambioPresupuestoModal({
  open,
  onClose,
  presupuestoId,
  montoActual,
  onSuccess,
}: Props) {
  const { toast } = useToast();
  const [montoPropuesto, setMontoPropuesto] = useState('');
  const [motivo, setMotivo] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    const monto = Number(montoPropuesto.replace(/\./g, '').replace(',', '.'));
    if (!Number.isFinite(monto) || monto <= 0) {
      toast({
        title: 'Monto inválido',
        description: 'Ingresá un monto propuesto válido.',
        variant: 'destructive',
      });
      return;
    }
    if (monto === montoActual) {
      toast({
        title: 'Mismo monto',
        description: 'El monto propuesto debe ser distinto al aprobado.',
        variant: 'destructive',
      });
      return;
    }
    if (motivo.trim().length < 10) {
      toast({
        title: 'Motivo requerido',
        description: 'Explicá el motivo en al menos 10 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/socio/presupuestos/solicitar-cambio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          presupuesto_id: presupuestoId,
          monto_propuesto: monto,
          motivo: motivo.trim(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.message || 'No se pudo enviar la solicitud');
      }
      toast({
        title: 'Solicitud enviada',
        description: 'El cliente recibirá tu pedido de revisión de precio.',
      });
      setMontoPropuesto('');
      setMotivo('');
      onSuccess?.();
      onClose();
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'No se pudo enviar la solicitud',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Solicitar revisión de precio</DialogTitle>
          <DialogDescription>
            El monto aprobado (${montoActual.toLocaleString('es-AR')}) no se modifica hasta que el
            cliente acepte tu propuesta.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <label className="block text-sm font-medium text-stitch-on-surface">
            Monto propuesto (ARS)
            <input
              type="text"
              inputMode="decimal"
              value={montoPropuesto}
              onChange={(e) => setMontoPropuesto(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stitch-outline/40 px-3 py-2 text-sm"
              placeholder="Ej. 150000"
            />
          </label>
          <label className="block text-sm font-medium text-stitch-on-surface">
            Motivo
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-lg border border-stitch-outline/40 px-3 py-2 text-sm"
              placeholder="Describí por qué necesitás revisar el precio…"
            />
          </label>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="secondary" onClick={onClose} disabled={sending}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={sending}>
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Enviar solicitud
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

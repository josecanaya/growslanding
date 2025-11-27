'use client';

import { useState } from 'react';
import { XCircle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/grows';
import { useToast } from '@/components/ui/use-toast';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { Textarea } from '@/components/ui/textarea';

interface PresupuestoInfo {
  id: string;
  tarea_id: string;
  tarea_titulo: string;
  cuadrilla_nombre: string;
  monto: number | null;
  moneda: string | null;
  estado: string | null;
  notas: string | null;
  duracion_estimada?: number | null;
  duracion_ofrecida?: number | null;
  created_at: string;
  updated_at?: string | null;
  socio_id?: string | null;
}

interface PresupuestoRechazarModalProps {
  open: boolean;
  onClose: () => void;
  cuadrillaNombre: string;
  presupuestos: PresupuestoInfo[];
  obraId: string | null;
  onSuccess?: () => void; // Callback para refrescar datos sin recargar
}

export function PresupuestoRechazarModal({
  open,
  onClose,
  cuadrillaNombre,
  presupuestos,
  obraId,
  onSuccess,
}: PresupuestoRechazarModalProps) {
  const [comentario, setComentario] = useState('');
  const [rechazando, setRechazando] = useState(false);
  const { toast } = useToast();
  const currentUser = useCurrentUser();

  // Obtener el socio_id del primer presupuesto (todos deberían ser del mismo socio)
  const socioId = presupuestos.length > 0 ? presupuestos[0].socio_id : null;
  const tareaIds = presupuestos.map((p) => p.tarea_id);

  const handleRechazar = async () => {
    if (!currentUser?.orgId) {
      toast({
        title: 'Error',
        description: 'No se pudo identificar tu organización.',
        variant: 'destructive',
      });
      return;
    }

    if (!socioId) {
      toast({
        title: 'Error',
        description: 'No se pudo identificar el socio.',
        variant: 'destructive',
      });
      return;
    }

    if (!obraId) {
      toast({
        title: 'Error',
        description: 'No se pudo identificar la obra.',
        variant: 'destructive',
      });
      return;
    }

    setRechazando(true);

    try {
      const response = await fetch('/api/presupuestos/rechazar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          socio_id: socioId,
          obra_id: obraId,
          tarea_ids: tareaIds,
          comentario: comentario.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al rechazar el presupuesto');
      }

      toast({
        title: 'Presupuesto rechazado',
        description: `El presupuesto de ${cuadrillaNombre} fue rechazado exitosamente. Se le envió una notificación.`,
      });

      // Limpiar y cerrar
      setComentario('');
      onClose();
      
      // Refrescar datos sin recargar la página
      if (onSuccess) {
        onSuccess();
      } else {
        // Fallback: recargar solo si no hay callback
        window.location.reload();
      }
    } catch (error) {
      console.error('[PresupuestoRechazarModal] Error:', error);
      toast({
        title: 'Error al rechazar',
        description: error instanceof Error ? error.message : 'No se pudo rechazar el presupuesto. Intentá nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setRechazando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Rechazar presupuesto de {cuadrillaNombre}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Atención:</strong> Esta acción eliminará el PDF del presupuesto y se le enviará una notificación al socio informándole del rechazo.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Motivo del rechazo <span className="text-slate-400">(opcional)</span>
            </label>
            <Textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Explicá por qué se rechaza el presupuesto. Este comentario se incluirá en la notificación al socio..."
              className="min-h-[120px] resize-none"
              disabled={rechazando}
            />
            <p className="mt-1 text-xs text-slate-500">
              Si no proporcionás un motivo, se enviará un mensaje genérico al socio.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={rechazando}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              icon={rechazando ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              onClick={handleRechazar}
              disabled={rechazando}
            >
              {rechazando ? 'Rechazando...' : 'Rechazar presupuesto'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


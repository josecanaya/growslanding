'use client';

import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
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

interface PresupuestoComentarioModalProps {
  open: boolean;
  onClose: () => void;
  cuadrillaNombre: string;
  presupuestos: PresupuestoInfo[];
  obraId?: string | null;
}

export function PresupuestoComentarioModal({
  open,
  onClose,
  cuadrillaNombre,
  presupuestos,
  obraId,
}: PresupuestoComentarioModalProps) {
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const { toast } = useToast();
  const currentUser = useCurrentUser();

  // Obtener el socio_id del primer presupuesto (todos deberían ser del mismo socio)
  const socioId = presupuestos.length > 0 ? presupuestos[0].socio_id : null;
  
  // Obtener nombres de tareas/etapas para el mensaje
  const tareasNombres = presupuestos.map((p) => p.tarea_titulo).join(', ');
  const etapaNombre = presupuestos.length > 0 
    ? presupuestos[0].tarea_titulo 
    : 'la etapa/tarea';

  const handleEnviar = async () => {
    if (!mensaje.trim()) {
      toast({
        title: 'Mensaje vacío',
        description: 'Por favor, escribí un mensaje antes de enviar.',
        variant: 'destructive',
      });
      return;
    }

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
        description: 'No se pudo identificar el socio destinatario.',
        variant: 'destructive',
      });
      return;
    }

    setEnviando(true);

    try {
      // Construir el mensaje completo
      const mensajeCompleto = `Consulta sobre tu presupuesto enviado para ${etapaNombre}: ${tareasNombres}\n\n${mensaje.trim()}`;

      // Obtener el tarea_id del primer presupuesto (si hay múltiples, usamos el primero)
      const tareaId = presupuestos.length > 0 ? presupuestos[0].tarea_id : null;

      // Crear el mensaje
      const response = await fetch('/api/mensajes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-organizacion-id': currentUser.orgId,
          'x-usuario-id': currentUser.id,
        },
        body: JSON.stringify({
          org_id: currentUser.orgId,
          obra_id: obraId || null,
          tarea_id: tareaId,
          remitente_id: currentUser.id,
          destinatario_id: socioId,
          contenido: mensajeCompleto,
          tipo: 'presupuesto',
          leido: false,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al enviar el mensaje');
      }

      toast({
        title: 'Mensaje enviado',
        description: `Tu mensaje fue enviado a ${cuadrillaNombre}.`,
      });

      // Limpiar y cerrar
      setMensaje('');
      onClose();
    } catch (error) {
      console.error('[PresupuestoComentarioModal] Error:', error);
      toast({
        title: 'Error al enviar',
        description: error instanceof Error ? error.message : 'No se pudo enviar el mensaje. Intentá nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg w-full p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Enviar mensaje a {cuadrillaNombre}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Mensaje
            </label>
            <Textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Escribí tu consulta sobre el presupuesto..."
              className="min-h-[120px] resize-none"
              disabled={enviando}
            />
            <p className="mt-1 text-xs text-slate-500">
              El mensaje incluirá automáticamente: &quot;Consulta sobre tu presupuesto enviado para {etapaNombre}: {tareasNombres}&quot;
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={enviando}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              icon={enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              onClick={handleEnviar}
              disabled={enviando || !mensaje.trim()}
            >
              {enviando ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


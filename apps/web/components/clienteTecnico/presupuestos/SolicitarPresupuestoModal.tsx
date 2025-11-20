'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2, CheckCircle2, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/grows';
import { useToast } from '@/components/ui/use-toast';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import type { Database } from '@/lib/types/supabase.gen';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type Tarea = {
  id: string;
  title: string;
  etapa: string | null;
  elemento?: {
    id: string;
    nombre: string | null;
    unidad?: string | null;
    cantidad?: number | null;
  } | null;
  duracionDias?: number;
  es?: number | null;
  ef?: number | null;
  fecha_inicio_estimada?: string | null;
  fecha_fin_estimada?: string | null;
};

type Socio = {
  id: string;
  nombre: string | null;
  estado?: string | null;
};

type SolicitarPresupuestoModalProps = {
  open: boolean;
  onClose: () => void;
  obraId: string;
  etapa: string;
  tareas: Tarea[];
  onSuccess?: () => void;
};

export function SolicitarPresupuestoModal({
  open,
  onClose,
  obraId,
  etapa,
  tareas,
  onSuccess,
}: SolicitarPresupuestoModalProps) {
  const currentUser = useCurrentUser();
  const supabase = useMemo(
    () => createClientComponentClient<Database>() as any,
    []
  );
  const { toast } = useToast();
  const [socios, setSocios] = useState<Socio[]>([]);
  const [loadingSocios, setLoadingSocios] = useState(true);
  const [selectedSocioId, setSelectedSocioId] = useState<string>('');
  const [selectedTareaIds, setSelectedTareaIds] = useState<Set<string>>(
    new Set(tareas.map((t) => t.id))
  );
  const [saving, setSaving] = useState(false);

  // Recalcular duración de tareas
  const tareasConDuracion = useMemo(() => {
    return tareas.map((tarea) => {
      let duracion = 0;
      if (tarea.ef !== null && tarea.es !== null && tarea.ef !== undefined && tarea.es !== undefined) {
        duracion = tarea.ef - tarea.es;
      } else if (tarea.fecha_inicio_estimada && tarea.fecha_fin_estimada) {
        const inicio = new Date(tarea.fecha_inicio_estimada);
        const fin = new Date(tarea.fecha_fin_estimada);
        if (!isNaN(inicio.getTime()) && !isNaN(fin.getTime())) {
          const diffTime = Math.abs(fin.getTime() - inicio.getTime());
          duracion = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
      }
      return { ...tarea, duracionDias: duracion || undefined };
    });
  }, [tareas]);

  useEffect(() => {
    if (!open || !currentUser?.orgId) return;

    async function loadSocios() {
      setLoadingSocios(true);
      try {
        const { data, error } = await supabase
          .from('socios')
          .select('id, nombre, estado')
          .eq('org_id', currentUser.orgId)
          .eq('estado', 'activo')
          .order('nombre');

        if (error) throw error;
        setSocios((data ?? []) as Socio[]);
      } catch (err) {
        console.error('[SolicitarPresupuestoModal] Error loading socios', err);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los socios.',
          variant: 'destructive',
        });
      } finally {
        setLoadingSocios(false);
      }
    }

    void loadSocios();
  }, [open, currentUser?.orgId, supabase, toast]);

  useEffect(() => {
    if (open) {
      // Resetear selecciones cuando se abre el modal
      setSelectedTareaIds(new Set(tareas.map((t) => t.id)));
      setSelectedSocioId('');
    }
  }, [open, tareas]);

  const handleToggleTarea = (tareaId: string) => {
    setSelectedTareaIds((prev) => {
      const next = new Set(prev);
      if (next.has(tareaId)) {
        next.delete(tareaId);
      } else {
        next.add(tareaId);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    if (selectedTareaIds.size === tareas.length) {
      setSelectedTareaIds(new Set());
    } else {
      setSelectedTareaIds(new Set(tareas.map((t) => t.id)));
    }
  };

  const handleSubmit = async () => {
    if (!selectedSocioId || selectedTareaIds.size === 0) {
      toast({
        title: 'Faltan datos',
        description: 'Seleccioná al menos una tarea y un socio.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/obras/${obraId}/solicitar-presupuesto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          etapa,
          tareaIds: Array.from(selectedTareaIds),
          socioId: selectedSocioId,
        }),
      });

      if (!response.ok) {
        let errorData: any = {};
        let responseText = '';
        
        try {
          // Intentar leer como texto primero
          const clone = response.clone();
          responseText = await clone.text();
          console.log('[SolicitarPresupuestoModal] Response text (length):', responseText.length);
          console.log('[SolicitarPresupuestoModal] Response text (content):', responseText.substring(0, 500));
          
          if (responseText && responseText.trim()) {
            try {
              errorData = JSON.parse(responseText);
              console.log('[SolicitarPresupuestoModal] Parsed error data:', errorData);
            } catch (parseError) {
              console.error('[SolicitarPresupuestoModal] Error parsing JSON:', parseError);
              errorData = { 
                raw: responseText,
                parseError: parseError instanceof Error ? parseError.message : String(parseError)
              };
            }
          } else {
            console.warn('[SolicitarPresupuestoModal] Response body is empty');
            errorData = { empty: true };
          }
        } catch (e) {
          console.error('[SolicitarPresupuestoModal] Error reading response:', e);
          errorData = { 
            readError: e instanceof Error ? e.message : String(e)
          };
        }
        
        console.error('[SolicitarPresupuestoModal] Error response details:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          error: errorData,
          rawText: responseText,
          url: `/api/obras/${obraId}/solicitar-presupuesto`,
        });
        
        // Construir mensaje de error más descriptivo
        let errorMessage = 'Error al enviar la solicitud';
        
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.details) {
          if (typeof errorData.details === 'string') {
            errorMessage = errorData.details;
          } else if (errorData.details.message) {
            errorMessage = errorData.details.message;
          } else if (errorData.details.error) {
            errorMessage = errorData.details.error;
          } else {
            errorMessage = `Error: ${JSON.stringify(errorData.details)}`;
          }
        } else if (errorData.error) {
          if (typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          } else if (errorData.error.message) {
            errorMessage = errorData.error.message;
          } else {
            errorMessage = `Error: ${JSON.stringify(errorData.error)}`;
          }
        } else if (response.status === 400 && errorData.message?.includes('ya tienen solicitudes')) {
          // Mensaje especial para cuando todas las tareas ya tienen solicitudes
          errorMessage = errorData.message;
          if (errorData.details) {
            errorMessage += `. ${errorData.details}`;
          }
        } else if (response.status === 500) {
          errorMessage = `Error interno del servidor (${response.status}). Revisá los logs del servidor para más detalles.`;
        } else if (response.status === 404) {
          errorMessage = 'Ruta no encontrada. Verificá que la obra existe.';
        } else if (response.status === 401) {
          errorMessage = 'No estás autenticado. Iniciá sesión nuevamente.';
        } else if (response.status === 403) {
          errorMessage = 'No tenés permisos para realizar esta acción.';
        } else {
          errorMessage = `Error ${response.status}: ${response.statusText || 'Error desconocido'}`;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      toast({
        title: 'Solicitud enviada',
        description: `Se enviaron ${result.created} solicitud${result.created === 1 ? '' : 'es'} de presupuesto.`,
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('[SolicitarPresupuestoModal] Error submitting', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'No se pudo enviar la solicitud.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-white text-slate-900 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {tareas.length === 1
              ? 'Solicitar presupuesto para esta tarea'
              : 'Solicitar presupuesto'}
          </DialogTitle>
          <DialogDescription>
            Seleccioná las tareas y el socio al que querés enviar la solicitud de presupuesto.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selector de socio */}
          <div>
            <Label className="mb-2 block text-sm font-medium text-slate-700">
              Socio destinatario
            </Label>
            <Select value={selectedSocioId} onValueChange={setSelectedSocioId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccioná un socio" />
              </SelectTrigger>
              <SelectContent>
                {loadingSocios ? (
                  <div className="px-2 py-1.5 text-sm text-slate-500">Cargando...</div>
                ) : socios.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-slate-500">No hay socios activos disponibles</div>
                ) : (
                  socios.map((socio) => (
                    <SelectItem key={socio.id} value={socio.id}>
                      {socio.nombre || 'Socio sin nombre'}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Lista de tareas */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <Label className="text-sm font-medium text-slate-700">
                Tareas ({selectedTareaIds.size} de {tareas.length} seleccionadas)
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleAll}
                className="text-xs"
              >
                {selectedTareaIds.size === tareas.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
              </Button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto border border-slate-200 rounded-lg p-4">
              {tareasConDuracion.map((tarea) => {
                const isSelected = selectedTareaIds.has(tarea.id);
                return (
                  <div
                    key={tarea.id}
                    className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleTarea(tarea.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{tarea.title}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            {tarea.etapa && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5">
                                {tarea.etapa}
                              </span>
                            )}
                            {tarea.elemento?.nombre && (
                              <span className="text-slate-600">
                                {tarea.elemento.nombre}
                                {tarea.elemento.cantidad && tarea.elemento.unidad && (
                                  <> — {tarea.elemento.cantidad} {tarea.elemento.unidad}</>
                                )}
                              </span>
                            )}
                            {tarea.duracionDias && tarea.duracionDias > 0 && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {tarea.duracionDias} día{tarea.duracionDias === 1 ? '' : 's'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={saving || !selectedSocioId || selectedTareaIds.size === 0}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Enviar solicitud
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


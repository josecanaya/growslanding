'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, Loader2, User, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/grows';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { evidenciaPublicUrl } from '@/lib/cliente/evidencia-display';
import { normalizeEstadoBloqueParaOperacion, ESTADO_BLOQUE_PARA_VALIDAR } from '@/lib/domain/estados-core';
import type { CanvasNode } from '@/lib/types/canvasMultinivel';
import { labelEstadoTarea, labelEstadoTareaFromDb } from './canvasMultinivelHelpers';
import type { CronogramaItem } from './buildCronogramaItems';
import {
  formatCronogramaDateLong,
  offsetToDate,
} from './buildCronogramaItems';

type Props = {
  obraId: string;
  selectedNode: CanvasNode | null;
  selectedItem: CronogramaItem | null;
  projectStart: Date;
  tareaPublicacionByNodeId: Record<
    string,
    { tareaId: string; estado: string; publishedAt: string | null }
  >;
  isOpen: boolean;
  onToggleOpen: () => void;
};

type EvidenciaBloque = {
  id: string;
  estado?: string | null;
  evidencia_url?: string | null;
  evidencia_cargada?: boolean | null;
  bloque_index?: number | null;
  orden?: number | null;
  validado_en_obra_at?: string | null;
};

type TareaDetalle = {
  responsable: string | null;
  estado: string;
  evidencias: EvidenciaBloque[];
};

function evidenciaSrc(raw: string | null | undefined): string | null {
  return evidenciaPublicUrl(raw);
}

function estadoHechoLabel(estado: string | undefined, local?: string): { label: string; tone: 'ok' | 'pending' | 'warn' | 'neutral' } {
  const e = (estado ?? local ?? '').toLowerCase();
  if (e.includes('validad') || e === 'validada' || e.includes('completad')) {
    return { label: 'Hecha · validada', tone: 'ok' };
  }
  if (e.includes('para_validar') || e.includes('validar')) {
    return { label: 'Enviada · pendiente de validación', tone: 'warn' };
  }
  if (e.includes('progreso') || e.includes('curso')) {
    return { label: 'En curso', tone: 'pending' };
  }
  if (e.includes('rechaz')) {
    return { label: 'Rechazada', tone: 'warn' };
  }
  if (e.includes('pendiente')) {
    return { label: 'Pendiente · no iniciada', tone: 'neutral' };
  }
  return { label: labelEstadoTareaFromDb(estado) || labelEstadoTarea(local as any) || 'Sin estado', tone: 'neutral' };
}

export function CanvasCronogramaInspector({
  selectedNode,
  selectedItem,
  projectStart,
  tareaPublicacionByNodeId,
  isOpen,
  onToggleOpen,
}: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [detalle, setDetalle] = useState<TareaDetalle | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const pub = selectedNode ? tareaPublicacionByNodeId[selectedNode.id] : undefined;
  const tareaId = pub?.tareaId;

  const cargarDetalle = useCallback(async () => {
    if (!tareaId) {
      setDetalle(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/tareas/${encodeURIComponent(tareaId)}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.success && j.data) {
        setDetalle({
          responsable: j.data.responsable ?? null,
          estado: j.data.estado ?? pub?.estado ?? 'pendiente',
          evidencias: Array.isArray(j.data.evidencias) ? j.data.evidencias : [],
        });
      } else {
        setDetalle({
          responsable: selectedNode?.socioLabel ?? null,
          estado: pub?.estado ?? selectedNode?.estadoTarea ?? 'pendiente',
          evidencias: [],
        });
      }
    } catch {
      setDetalle({
        responsable: selectedNode?.socioLabel ?? null,
        estado: pub?.estado ?? selectedNode?.estadoTarea ?? 'pendiente',
        evidencias: [],
      });
    } finally {
      setLoading(false);
    }
  }, [tareaId, pub?.estado, selectedNode?.socioLabel, selectedNode?.estadoTarea]);

  useEffect(() => {
    void cargarDetalle();
  }, [cargarDetalle]);

  const validarBloque = async (
    subtareaId: string,
    accion: 'validar_en_obra' | 'validar' | 'rechazar',
  ) => {
    setProcessingId(subtareaId);
    try {
      const res = await fetch(`/api/tareas-subtareas/${subtareaId}/validar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ accion, metodoPago: accion === 'validar' ? 'ONLINE' : undefined }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof j?.error === 'string' ? j.error : 'No se pudo completar la acción');
      }
      toast({
        title:
          accion === 'validar_en_obra'
            ? 'Aprobado en obra'
            : accion === 'validar'
              ? 'Bloque validado y pago liberado'
              : 'Bloque rechazado',
        description:
          accion === 'validar_en_obra'
            ? 'El socio puede continuar. El pago queda pendiente hasta la validación definitiva.'
            : 'Actualizamos el estado en la obra.',
      });
      await cargarDetalle();
    } catch (e) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'No se pudo validar',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const hecho = estadoHechoLabel(detalle?.estado ?? pub?.estado, selectedNode?.estadoTarea);

  const bloquesConEvidencia = useMemo(() => {
    if (!detalle?.evidencias.length) return [];
    return detalle.evidencias.filter(
      (ev) => ev.evidencia_url?.trim() || ev.evidencia_cargada,
    );
  }, [detalle?.evidencias]);

  const fechaFin =
    selectedItem != null
      ? formatCronogramaDateLong(offsetToDate(projectStart, selectedItem.endOffset))
      : null;
  const fechaInicio =
    selectedItem != null
      ? formatCronogramaDateLong(offsetToDate(projectStart, selectedItem.startOffset))
      : null;

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggleOpen}
        className="hidden shrink-0 self-start rounded-l-xl border border-r-0 border-[#e5e7eb] bg-white px-1 py-6 text-[#64748b] shadow-sm xl:flex"
        title="Abrir inspector"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
    );
  }

  return (
    <aside className="hidden w-[min(100%,300px)] shrink-0 flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)] xl:flex">
      <div className="flex items-center justify-between border-b border-[#f1f5f9] px-3 py-2.5">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">Cronograma</p>
          <p className="text-xs font-semibold text-[#64748b]">Solo lectura</p>
        </div>
        <button
          type="button"
          onClick={onToggleOpen}
          className="rounded-lg p-1.5 text-[#64748b] hover:bg-[#f8fafc]"
          title="Cerrar inspector"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {!selectedNode || selectedNode.type !== 'tarea' ? (
          <div className="rounded-xl border border-dashed border-[#e2e8f0] bg-[#f8fafc] px-4 py-10 text-center">
            <p className="text-sm font-semibold text-[#0f172a]">Seleccioná una tarea</p>
            <p className="mt-2 text-xs text-[#64748b]">
              El cronograma es solo visual. Para editar tareas, usá la pestaña Organizar.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-[#0f172a]">{selectedNode.title}</h2>
              {selectedItem ? (
                <p className="mt-1 text-[11px] text-[#64748b]">
                  {fechaInicio} → {fechaFin} · {selectedItem.duracionDias} días
                </p>
              ) : null}
            </div>

            <section className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">Responsable</p>
              {loading ? (
                <Loader2 className="mt-2 h-4 w-4 animate-spin text-[#64748b]" />
              ) : (
                <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-[#0f172a]">
                  <User className="h-4 w-4 text-[#64748b]" />
                  {detalle?.responsable || selectedNode.socioLabel || 'Sin asignar'}
                </p>
              )}
            </section>

            <section className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">Estado</p>
              <span
                className={cn(
                  'mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold',
                  hecho.tone === 'ok' && 'bg-emerald-100 text-emerald-800',
                  hecho.tone === 'warn' && 'bg-amber-100 text-amber-800',
                  hecho.tone === 'pending' && 'bg-blue-100 text-blue-800',
                  hecho.tone === 'neutral' && 'bg-slate-100 text-slate-700',
                )}
              >
                {hecho.label}
              </span>
              {pub?.publishedAt ? (
                <p className="mt-2 text-[11px] text-[#64748b]">
                  Publicada el{' '}
                  {new Date(pub.publishedAt).toLocaleDateString('es-AR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              ) : (
                <p className="mt-2 text-[11px] text-[#64748b]">Aún no publicada en operaciones</p>
              )}
            </section>

            <section className="rounded-xl border border-[#e5e7eb] bg-white p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
                Evidencias / validar en obra
              </p>
              {loading ? (
                <Loader2 className="mt-3 h-4 w-4 animate-spin text-[#64748b]" />
              ) : bloquesConEvidencia.length === 0 ? (
                <p className="mt-2 text-xs text-[#64748b]">Sin fotos enviadas todavía.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {bloquesConEvidencia.map((ev) => {
                    const src = evidenciaSrc(ev.evidencia_url);
                    const estadoNorm = normalizeEstadoBloqueParaOperacion(ev.estado);
                    const esParaValidar = estadoNorm === ESTADO_BLOQUE_PARA_VALIDAR;
                    const aprobadoEnObra = Boolean(ev.validado_en_obra_at);
                    const bloqueLabel = `Bloque ${ev.orden ?? ev.bloque_index ?? '—'}`;
                    return (
                      <div
                        key={ev.id}
                        className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-[#f8fafc]"
                      >
                        {src ? (
                          <a href={src} target="_blank" rel="noopener noreferrer" className="block">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={src}
                              alt={`Evidencia ${bloqueLabel}`}
                              className="aspect-video w-full object-cover"
                            />
                          </a>
                        ) : null}
                        <div className="space-y-2 p-2">
                          <p className="text-[11px] font-semibold text-[#0f172a]">{bloqueLabel}</p>
                          {aprobadoEnObra ? (
                            <p className="text-[10px] font-medium text-emerald-700">
                              Aprobado en obra — pago pendiente de validación definitiva
                            </p>
                          ) : null}
                          {esParaValidar ? (
                            <div className="flex flex-col gap-2">
                              <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                className="h-8 w-full text-[11px]"
                                disabled={processingId === ev.id || aprobadoEnObra}
                                onClick={() => void validarBloque(ev.id, 'validar_en_obra')}
                              >
                                <CheckCircle className="mr-1 h-3.5 w-3.5" />
                                Validar en obra (sin liberar pago)
                              </Button>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  className="h-8 flex-1 text-[11px]"
                                  disabled={processingId === ev.id}
                                  onClick={() => void validarBloque(ev.id, 'validar')}
                                >
                                  Validar y liberar pago
                                </Button>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  className="h-8 px-2"
                                  disabled={processingId === ev.id}
                                  onClick={() => void validarBloque(ev.id, 'rechazar')}
                                  title="Rechazar"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[10px] text-[#64748b] capitalize">{estadoNorm.replace(/_/g, ' ')}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <p className="text-[10px] leading-relaxed text-[#94a3b8]">
              Validá bloques con evidencia desde acá. Para editar el plan, usá Organizar.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

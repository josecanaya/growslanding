'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  Badge,
  Button,
  Card,
  EmptyState,
} from '@/components/ui/grows';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import type { Database } from '@/lib/types/supabase.gen';
import { useToast } from '@/components/ui/use-toast';
import { TareaFsmService } from '@/lib/services/tarea-fsm.service';
import {
  ESTADO_BLOQUE_FINAL,
  ESTADO_BLOQUE_PARA_VALIDAR,
  normalizeEstadoBloqueParaOperacion,
} from '@/lib/domain/estados-core';
import {
  Building2,
  CheckCircle,
  Clock,
  Loader2,
  Users,
  XCircle,
  X,
  Camera,
} from 'lucide-react';

const DATE_FORMATTER = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const CURRENCY_FORMATTER = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
});

function formatDate(value: string | null | undefined): string {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return DATE_FORMATTER.format(date);
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '—';
  }
  return CURRENCY_FORMATTER.format(value);
}

/** PostgREST responde 400 Bad Request si la URL supera el límite (p. ej. `.in(...)` con muchos UUID). */
const SUPABASE_IN_CHUNK = 80;

async function fetchRowsInChunks<T>(
  ids: string[],
  queryChunk: (chunk: string[]) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  if (!ids.length) return [];
  const acc: T[] = [];
  for (let i = 0; i < ids.length; i += SUPABASE_IN_CHUNK) {
    const chunk = ids.slice(i, i + SUPABASE_IN_CHUNK);
    const { data, error } = await queryChunk(chunk);
    if (error) throw error;
    if (data?.length) acc.push(...data);
  }
  return acc;
}

/** Usa URL absoluta tal cual, o interpreta `evidencia_url` como path en bucket `evidencias`. */
function evidenciaSrcParaImagen(
  raw: string | null | undefined,
  supabaseClient: {
    storage: {
      from: (bucket: string) => {
        getPublicUrl: (path: string) => { data: { publicUrl: string } };
      };
    };
  },
): string | null {
  if (!raw?.trim()) return null;
  const t = raw.trim();
  if (/^https?:\/\//i.test(t)) return t;
  const { data } = supabaseClient.storage.from('evidencias').getPublicUrl(t);
  return data.publicUrl;
}

type ValidarSectionProps = {
  obraId?: string | null;
};

type RawTarea = Record<string, any> & {
  id: string;
  title?: string | null;
  descripcion?: string | null;
  estado?: string | null;
  obra_id: string;
  responsable?: string | null;
  fecha_inicio_real?: string | null;
  fecha_fin_real?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  cuadrilla_id?: string | null;
};

type EvidenciaItem = {
  url: string;
  path: string;
  created_at?: string;
};

type ValidarSubtarea = {
  id: string;
  estado: string;
  montoEstimado: number | null;
  montoValidado: number | null;
  fecha: string | null;
  orden: number | null;
  bloque_index?: number | null;
  evidencia_url?: string | null;
  evidencia_cargada?: boolean | null;
  evidenciaPublicUrl?: string | null;
  validadoEnObraAt?: string | null;
};

type ValidarTarea = {
  id: string;
  titulo: string;
  descripcion: string | null;
  obraId: string;
  obraNombre: string;
  responsable: string | null;
  cuadrillaNombre: string | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  evidencias: EvidenciaItem[];
  estadoOficial: 'pendiente' | 'en_progreso' | 'para_validar' | 'validada' | 'rechazada';
  subtareas: ValidarSubtarea[];
};

type ObraItem = {
  id: string;
  nombre: string;
  count: number;
};

type ConfirmacionModal = {
  tipo: 'validar' | 'validar_en_obra' | 'rechazar' | null;
  subtareaId: string | null;
  bloqueNombre: string;
  monto: number | null;
};

export function ValidarSection({ obraId }: ValidarSectionProps) {
  const currentUser = useCurrentUser();
  const supabase = useMemo(
    () => createClientComponentClient<Database>() as any,
    []
  );
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tareas, setTareas] = useState<ValidarTarea[]>([]);
  const [obraSeleccionada, setObraSeleccionada] = useState<string | null>(null);
  const [subtareaProcessingId, setSubtareaProcessingId] = useState<string | null>(null);
  const [imagenAmpliada, setImagenAmpliada] = useState<{ url: string; titulo: string } | null>(null);
  const [confirmacionModal, setConfirmacionModal] = useState<ConfirmacionModal>({
    tipo: null,
    subtareaId: null,
    bloqueNombre: '',
    monto: null,
  });
  const [motivoRechazo, setMotivoRechazo] = useState('');

  /** Mantiene selección de obra alineada al layout padre (`TareasSection`). */
  useEffect(() => {
    const trimmed = obraId?.trim?.() ?? '';
    if (!trimmed) return;
    setObraSeleccionada(trimmed);
  }, [obraId]);

  const loadData = useCallback(async () => {
    if (!currentUser?.orgId) {
      setError('No se pudo identificar tu organización.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const obraFiltro = obraId?.trim?.() ?? '';
      const qs = obraFiltro ? `?obra_id=${encodeURIComponent(obraFiltro)}` : '';
      const res = await fetch(`/api/cliente/validaciones-pendientes${qs}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json.error ?? 'No se pudieron cargar las validaciones');
      }

      const mapped = (json.data?.tareas ?? []) as ValidarTarea[];
      setTareas(mapped);
      setObraSeleccionada((prev) => {
        if (obraFiltro && mapped.some((t) => t.obraId === obraFiltro)) {
          return obraFiltro;
        }
        if (obraFiltro) return obraFiltro;
        if (prev && mapped.some((t) => t.obraId === prev)) return prev;
        return mapped.length > 0 ? mapped[0].obraId : null;
      });
    } catch {
      setError('No se pudieron obtener las tareas pendientes de validación.');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.orgId, obraId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') void loadData();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [loadData]);

  const obrasAgrupadas: ObraItem[] = useMemo(() => {
    const map = new Map<string, ObraItem>();
    for (const tarea of tareas) {
      if (!map.has(tarea.obraId)) {
        map.set(tarea.obraId, {
          id: tarea.obraId,
          nombre: tarea.obraNombre,
          count: 1,
        });
      } else {
        map.get(tarea.obraId)!.count += 1;
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.nombre.localeCompare(b.nombre)
    );
  }, [tareas]);

  const tareasFiltradas = useMemo(() => {
    if (!obraSeleccionada) return { pendientes: [], validadas: [] };
    const filtradas = tareas.filter((t) => t.obraId === obraSeleccionada);

    // Solo mostrar tareas que tienen bloques en estado 'para_validar' (que el cliente puede validar)
    const pendientes = filtradas.filter((t) => {
      const tieneBloquesParaValidar = t.subtareas.some(
        (s) =>
          normalizeEstadoBloqueParaOperacion(s.estado) === ESTADO_BLOQUE_PARA_VALIDAR,
      );
      return tieneBloquesParaValidar;
    });

    // Mostrar tareas que están validadas (todas las subtareas validadas o tarea en estado validada)
    const validadas = filtradas.filter(
      (t) =>
        t.estadoOficial === 'validada' ||
        (t.subtareas.length > 0 &&
          t.subtareas.every(
            (s) => normalizeEstadoBloqueParaOperacion(s.estado) === ESTADO_BLOQUE_FINAL,
          ))
    );

    return { pendientes, validadas };
  }, [tareas, obraSeleccionada]);

  const handleAbrirConfirmacion = useCallback(
    (subtareaId: string, tipo: 'validar' | 'validar_en_obra' | 'rechazar', bloqueNombre: string, monto: number | null) => {
      setConfirmacionModal({
        tipo,
        subtareaId,
        bloqueNombre,
        monto,
      });
      if (tipo === 'rechazar') {
        setMotivoRechazo('');
      }
    },
    []
  );

  const handleCerrarConfirmacion = useCallback(() => {
    setConfirmacionModal({
      tipo: null,
      subtareaId: null,
      bloqueNombre: '',
      monto: null,
    });
    setMotivoRechazo('');
  }, []);

  const handleConfirmarAccion = useCallback(async () => {
    if (!confirmacionModal.subtareaId || !confirmacionModal.tipo) return;

    const subtareaId = confirmacionModal.subtareaId;
    const accion = confirmacionModal.tipo;
    setSubtareaProcessingId(subtareaId);
    handleCerrarConfirmacion();

    try {
      const payload: {
        accion: 'validar' | 'validar_en_obra' | 'rechazar';
        motivo?: string;
      } = {
        accion: accion === 'validar_en_obra' ? 'validar_en_obra' : accion,
      };

      if (accion === 'rechazar' && motivoRechazo.trim()) {
        payload.motivo = motivoRechazo.trim();
      }

      const response = await fetch(`/api/tareas-subtareas/${subtareaId}/validar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || `No se pudo ${accion === 'validar' ? 'validar' : 'rechazar'} el bloque.`);
      }

      const data = await response.json();

      await loadData();

      if (accion === 'validar') {
        toast({
          title: 'Bloque validado',
          description: 'Validación definitiva registrada y pago liberado.',
        });
      } else if (accion === 'validar_en_obra') {
        toast({
          title: 'Aprobado en obra',
          description: 'El socio puede continuar. El pago queda pendiente hasta la validación definitiva.',
        });
      } else {
        toast({
          title: 'Bloque rechazado',
          description: 'Bloque rechazado — el socio podrá retomarlo',
        });
      }

      if (data?.tareaValidada) {
        toast({
          title: 'Tarea completada',
          description: 'Todas las subtareas fueron validadas. La tarea quedó marcada como validada.',
        });
      }
    } catch (err) {
      let errorMessage = 'Error de conexión. Intente nuevamente.';
      
      if (err instanceof Error) {
        if (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('Failed to fetch')) {
          errorMessage = 'Error de conexión. Intente nuevamente.';
        } else if (err.message.includes('403') || err.message.includes('permiso') || err.message.includes('FORBIDDEN')) {
          errorMessage = 'No tenés permiso para esta acción.';
        } else {
          errorMessage = err.message;
        }
      }
      
      toast({
        title: `No se pudo ${accion === 'validar' ? 'validar' : 'rechazar'} el bloque`,
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSubtareaProcessingId(null);
    }
  }, [confirmacionModal, motivoRechazo, loadData, toast, handleCerrarConfirmacion]);

  if (!currentUser?.orgId) {
    return (
      <EmptyState
        title="Iniciá sesión nuevamente"
        description="Necesitás una organización activa para validar tareas."
      />
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Cargando tareas pendientes de validación…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border border-amber-200 bg-amber-50 text-amber-700">
        <div className="flex items-center gap-3">
          <XCircle className="h-5 w-5" />
          <div>
            <h3 className="font-semibold">No pudimos cargar las tareas</h3>
            <p className="text-sm opacity-80">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside className="w-full space-y-2 lg:w-64">
        <h3 className="text-sm font-semibold uppercase text-slate-500">Obras</h3>
        <div className="space-y-2">
          {obrasAgrupadas.map((obra) => {
            const isActive = obraSeleccionada === obra.id;
            return (
              <button
                key={obra.id}
                onClick={() => setObraSeleccionada(obra.id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  isActive
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40'
                }`}
              >
                <div className="flex items-center justify-between text-sm font-semibold text-slate-800">
                  <span>{obra.nombre}</span>
                  <Badge
                    variant={isActive ? 'info' : 'default'}
                    className={
                      isActive ? 'bg-blue-100 text-blue-700 border-blue-200' : ''
                    }
                  >
                    {obra.count}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">Tareas con bloques</p>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="flex-1 space-y-6">
        {tareasFiltradas.pendientes.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-slate-900">
                Tareas pendientes de validación ({tareasFiltradas.pendientes.length})
              </h2>
            </div>
            {tareasFiltradas.pendientes.map((tarea) => {
              const fechas = `${formatDate(tarea.fechaInicio)} → ${formatDate(tarea.fechaFin)}`;
              
              const bloquesValidadas = tarea.subtareas.filter(
                (s) => s.estado === 'validado'
              ).length;
              const bloquesRechazadas = tarea.subtareas.filter(
                (s) => s.estado === 'rechazado'
              ).length;
              const totalBloques = tarea.subtareas.length;

              const getEstadoLabel = (estado: string) => {
                const estadoLower = estado.toLowerCase();
                if (estadoLower === 'para_validar') return 'PARA VALIDAR';
                if (estadoLower === 'validado') return 'VALIDADO';
                if (estadoLower === 'rechazado') return 'RECHAZADO';
                if (estadoLower === 'pendiente') return 'PENDIENTE';
                return estado.toUpperCase();
              };

              return (
                <Card
                  key={tarea.id}
                  className="rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="info" className="border-blue-200 text-blue-700">
                          <Building2 className="mr-1 h-3 w-3" />
                          {tarea.obraNombre}
                        </Badge>
                        <Badge
                          variant="default"
                          className="border-slate-200 text-slate-600"
                        >
                          {tarea.estadoOficial.toUpperCase()}
                        </Badge>
                        {tarea.cuadrillaNombre && (
                          <Badge
                            variant="success"
                            className="border-emerald-200 text-emerald-600"
                          >
                            <Users className="mr-1 h-3 w-3" />
                            {tarea.cuadrillaNombre}
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-slate-900">
                        {tarea.titulo}
                      </h3>
                      {tarea.descripcion && (
                        <p className="text-sm text-slate-600">{tarea.descripcion}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {fechas}
                        </span>
                        {tarea.responsable && (
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" /> Responsable:{' '}
                            {tarea.responsable}
                          </span>
                        )}
                      </div>

                      {totalBloques > 0 && (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-xs font-semibold uppercase text-slate-500 mb-2">
                            Resumen de bloques
                          </p>
                          <div className="flex flex-wrap gap-3 text-sm">
                            <span className="text-slate-600">
                              Total: <strong>{totalBloques}</strong>
                            </span>
                            <span className="text-green-600">
                              Validadas: <strong>{bloquesValidadas}</strong>
                            </span>
                            {bloquesRechazadas > 0 && (
                              <span className="text-red-600">
                                Rechazadas: <strong>{bloquesRechazadas}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {tarea.evidencias.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase text-slate-500">
                            Evidencias ({tarea.evidencias.length})
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            {tarea.evidencias.map((evidencia, idx) => (
                              <button
                                key={`${evidencia.path}-${idx}`}
                                onClick={() =>
                                  setImagenAmpliada({
                                    url: evidencia.url,
                                    titulo: tarea.titulo,
                                  })
                                }
                                className="group relative aspect-square overflow-hidden rounded-lg border-2 border-slate-200 bg-slate-100 transition hover:border-blue-400 hover:shadow-md"
                              >
                                <img
                                  src={evidencia.url}
                                  alt={`Evidencia ${idx + 1} - ${tarea.titulo}`}
                                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src =
                                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23e5e7eb" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="sans-serif" font-size="12"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
                                  }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
                                  <Camera className="h-6 w-6 text-white opacity-0 transition group-hover:opacity-100" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {tarea.subtareas.length > 0 && (
                        <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase text-slate-500">
                            Bloques pagables
                          </p>
                          <div className="space-y-3">
                            {tarea.subtareas.map((sub) => {
                              const estadoSub = normalizeEstadoBloqueParaOperacion(sub.estado);
                              const esValidado = estadoSub === ESTADO_BLOQUE_FINAL;
                              const esRechazado = estadoSub === 'rechazado';
                              const esParaValidar = estadoSub === ESTADO_BLOQUE_PARA_VALIDAR;
                              const aprobadoEnObra = Boolean(sub.validadoEnObraAt);
                              
                              const bloqueNombre = `Bloque ${sub.orden ?? sub.bloque_index ?? '—'}`;
                              const evidenciaSrc =
                                sub.evidenciaPublicUrl ??
                                evidenciaSrcParaImagen(sub.evidencia_url, supabase);
                              
                              const badgeVariant = esValidado
                                ? 'success'
                                : esRechazado
                                ? 'error'
                                : esParaValidar
                                ? 'warning'
                                : 'default';

                              return (
                                <div
                                  key={sub.id}
                                  className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-slate-800">
                                        {bloqueNombre}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        Monto estimado: {formatCurrency(sub.montoEstimado)}
                                      </p>
                                      {esValidado && sub.montoValidado !== null && (
                                        <p className="text-xs text-green-600 mt-1">
                                          Monto validado:{' '}
                                          {formatCurrency(sub.montoValidado)}
                                        </p>
                                      )}
                                    </div>
                                    <Badge variant={badgeVariant as any}>
                                      {getEstadoLabel(estadoSub)}
                                    </Badge>
                                  </div>

                                  {(sub.evidencia_url || sub.evidencia_cargada) && (
                                    <div className="mb-3">
                                      <p className="text-xs font-semibold uppercase text-slate-500 mb-1">
                                        Evidencia del bloque
                                      </p>
                                      {evidenciaSrc && (
                                        <button
                                          onClick={() =>
                                            setImagenAmpliada({
                                              url: evidenciaSrc,
                                              titulo: bloqueNombre,
                                            })
                                          }
                                          className="relative w-full h-32 rounded-lg border-2 border-slate-200 bg-slate-100 overflow-hidden group hover:border-blue-400 transition"
                                        >
                                          <img
                                            src={evidenciaSrc}
                                            alt={`Evidencia - ${bloqueNombre}`}
                                            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                                            onError={(e) => {
                                              const target = e.target as HTMLImageElement;
                                              target.src =
                                                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23e5e7eb" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="sans-serif" font-size="12"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
                                            }}
                                          />
                                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition">
                                            <Camera className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition" />
                                          </div>
                                        </button>
                                      )}
                                    </div>
                                  )}
                                  
                                  {esParaValidar && (
                                    <div className="flex flex-col gap-2 mt-3">
                                      {aprobadoEnObra ? (
                                        <p className="text-xs font-medium text-emerald-700">
                                          Aprobado en obra — pendiente liberar pago
                                        </p>
                                      ) : null}
                                      {!aprobadoEnObra ? (
                                        <Button
                                          variant="secondary"
                                          size="sm"
                                          disabled={subtareaProcessingId === sub.id}
                                          onClick={() =>
                                            handleAbrirConfirmacion(
                                              sub.id,
                                              'validar_en_obra',
                                              bloqueNombre,
                                              sub.montoEstimado
                                            )
                                          }
                                          className="w-full"
                                        >
                                          <CheckCircle className="h-4 w-4 mr-1" />
                                          Validar en obra (sin pago)
                                        </Button>
                                      ) : null}
                                      <div className="flex gap-2">
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        disabled={subtareaProcessingId === sub.id}
                                        onClick={() =>
                                          handleAbrirConfirmacion(
                                            sub.id,
                                            'validar',
                                            bloqueNombre,
                                            sub.montoEstimado
                                          )
                                        }
                                        className="flex-1 sm:flex-none"
                                      >
                                        <CheckCircle className="h-4 w-4 mr-1" />
                                        Validar y liberar pago
                                      </Button>
                                      <Button
                                        variant="secondary"
                                        size="sm"
                                        disabled={subtareaProcessingId === sub.id}
                                        onClick={() =>
                                          handleAbrirConfirmacion(
                                            sub.id,
                                            'rechazar',
                                            bloqueNombre,
                                            sub.montoEstimado
                                          )
                                        }
                                        className="flex-1 sm:flex-none"
                                      >
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Rechazar
                                      </Button>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {(esValidado || esRechazado) && (
                                    <p className="text-xs text-slate-500 mt-2">
                                      {esValidado
                                        ? 'Este bloque ya fue validado y el pago fue procesado.'
                                        : 'Este bloque fue rechazado. El socio podrá retomarlo.'}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {tareasFiltradas.validadas.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold text-green-700">
                Tareas validadas ({tareasFiltradas.validadas.length})
              </h2>
            </div>
            {tareasFiltradas.validadas.map((tarea) => {
              const fechas = `${formatDate(tarea.fechaInicio)} → ${formatDate(tarea.fechaFin)}`;

              return (
                <Card
                  key={tarea.id}
                  className="rounded-3xl border border-green-200 bg-green-50/30 shadow-sm"
                >
                  <div className="flex flex-col gap-4 p-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="info" className="border-blue-200 text-blue-700">
                          <Building2 className="mr-1 h-3 w-3" />
                          {tarea.obraNombre}
                        </Badge>
                        <Badge
                          variant="success"
                          className="border-green-200 text-green-700 bg-green-100"
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          VALIDADA
                        </Badge>
                        {tarea.cuadrillaNombre && (
                          <Badge
                            variant="success"
                            className="border-emerald-200 text-emerald-600"
                          >
                            <Users className="mr-1 h-3 w-3" />
                            {tarea.cuadrillaNombre}
                          </Badge>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-slate-900">
                        {tarea.titulo}
                      </h3>
                      {tarea.descripcion && (
                        <p className="text-sm text-slate-600">{tarea.descripcion}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {fechas}
                        </span>
                        {tarea.responsable && (
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" /> Responsable:{' '}
                            {tarea.responsable}
                          </span>
                        )}
                      </div>

                      {tarea.evidencias.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase text-slate-500">
                            Evidencias ({tarea.evidencias.length})
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            {tarea.evidencias.map((evidencia, idx) => (
                              <button
                                key={`${evidencia.path}-${idx}`}
                                onClick={() =>
                                  setImagenAmpliada({
                                    url: evidencia.url,
                                    titulo: tarea.titulo,
                                  })
                                }
                                className="group relative aspect-square overflow-hidden rounded-lg border-2 border-slate-200 bg-slate-100 transition hover:border-green-400 hover:shadow-md"
                              >
                                <img
                                  src={evidencia.url}
                                  alt={`Evidencia ${idx + 1} - ${tarea.titulo}`}
                                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src =
                                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23e5e7eb" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="sans-serif" font-size="12"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
                                  }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
                                  <Camera className="h-6 w-6 text-white opacity-0 transition group-hover:opacity-100" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {tarea.subtareas.length > 0 && (
                        <div className="space-y-2 rounded-2xl border border-green-100 bg-white/80 p-4">
                          <p className="text-xs font-semibold uppercase text-slate-500">
                            Bloques validados
                          </p>
                          <div className="space-y-2">
                            {tarea.subtareas.map((sub) => (
                              <div
                                key={sub.id}
                                className="flex items-center justify-between rounded-lg border border-green-100 p-2"
                              >
                                <div>
                                  <p className="text-sm font-semibold text-slate-800">
                                    Bloque {sub.orden ?? sub.bloque_index ?? '—'}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Validado:{' '}
                                    {formatCurrency(
                                      sub.montoValidado ?? sub.montoEstimado
                                    )}
                                  </p>
                                </div>
                                <Badge variant="success">VALIDADO</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {tareasFiltradas.pendientes.length === 0 &&
          tareasFiltradas.validadas.length === 0 && (
            <EmptyState
              title="No hay tareas para validar"
              description="Esta obra no tiene tareas con bloques pendientes de validación."
            />
          )}
      </section>

      {imagenAmpliada && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setImagenAmpliada(null)}
        >
          <div className="relative max-w-5xl w-full max-h-[90vh]">
            <button
              onClick={() => setImagenAmpliada(null)}
              className="absolute -top-12 right-0 z-10 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="bg-white rounded-lg overflow-hidden">
              <img
                src={imagenAmpliada.url}
                alt={imagenAmpliada.titulo}
                className="w-full h-auto max-h-[80vh] object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src =
                    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="sans-serif" font-size="16"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
                }}
              />
              <div className="p-4 bg-white border-t">
                <h3 className="font-semibold text-lg text-slate-900">
                  {imagenAmpliada.titulo}
                </h3>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog
        open={confirmacionModal.tipo !== null}
        onOpenChange={(open) => {
          if (!open) handleCerrarConfirmacion();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmacionModal.tipo === 'validar'
                ? 'Confirmar validación y pago'
                : confirmacionModal.tipo === 'validar_en_obra'
                  ? 'Confirmar aprobación en obra'
                  : 'Confirmar rechazo'}
            </DialogTitle>
            <DialogDescription>
              {confirmacionModal.tipo === 'validar_en_obra' ? (
                <>
                  ¿Aprobás <strong>{confirmacionModal.bloqueNombre}</strong> en obra?
                  <br />
                  El socio podrá continuar con el siguiente bloque. El pago{' '}
                  <strong>no</strong> se libera hasta la validación definitiva.
                </>
              ) : confirmacionModal.tipo === 'validar' ? (
                <>
                  ¿Estás seguro de que querés validar <strong>{confirmacionModal.bloqueNombre}</strong>?
                  <br />
                  El bloque será marcado como validado y el pago será procesado
                  automáticamente.
                  {confirmacionModal.monto !== null && (
                    <>
                      <br />
                      <span className="font-semibold text-green-600">
                        Monto: {formatCurrency(confirmacionModal.monto)}
                      </span>
                    </>
                  )}
                </>
              ) : (
                <>
                  ¿Estás seguro de que querés rechazar <strong>{confirmacionModal.bloqueNombre}</strong>?
                  <br />
                  El socio podrá retomar el bloque después del rechazo.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {confirmacionModal.tipo === 'rechazar' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Motivo del rechazo (opcional)
              </label>
              <textarea
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                placeholder="Describí el motivo del rechazo..."
                className="w-full min-h-[80px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={handleCerrarConfirmacion}
              disabled={!!subtareaProcessingId}
            >
              Cancelar
            </Button>
            <Button
              variant={
                confirmacionModal.tipo === 'rechazar'
                  ? 'danger'
                  : 'primary'
              }
              onClick={handleConfirmarAccion}
              disabled={!!subtareaProcessingId}
            >
              {subtareaProcessingId ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : confirmacionModal.tipo === 'validar_en_obra' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprobar en obra
                </>
              ) : confirmacionModal.tipo === 'validar' ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Validar bloque
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Rechazar bloque
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Users, Loader2, Calendar, FileText, List, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/grows';
import { cn } from '@/lib/utils';

// Función para formatear fechas
const formatFecha = (fecha: string | null | undefined): string => {
  if (!fecha) return '';
  try {
    const date = new Date(fecha);
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const año = date.getFullYear();
    const horas = String(date.getHours()).padStart(2, '0');
    const minutos = String(date.getMinutes()).padStart(2, '0');
    return `${dia}/${mes}/${año} ${horas}:${minutos}`;
  } catch {
    return '';
  }
};

interface TareaInfo {
  id: string;
  titulo: string;
  etapa: string | null;
  duracion_estimada?: number | null;
}

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

interface StageSummaryCardProps {
  stageKey: string;
  stageLabel: string;
  stageDescription: string;
  tareas: TareaInfo[];
  presupuestos: PresupuestoInfo[];
  tareasSinPresupuesto: TareaInfo[];
  onSolicitarPresupuesto: (tareaIds: string[]) => void;
  onAprobar: (presupuestoId: string) => void;
  onRechazar: (presupuestoId: string) => void;
  onAsignar: (presupuestoId: string) => void;
  onAprobarPresupuesto?: (socioId: string, etapaId: string) => void;
  onVerPdf?: (cuadrillaNombre: string, presupuestos: PresupuestoInfo[]) => void;
  onVerLista?: (cuadrillaNombre: string, presupuestos: PresupuestoInfo[]) => void;
  onRechazarPresupuesto?: (cuadrillaNombre: string, presupuestos: PresupuestoInfo[]) => void;
  onComentar?: (cuadrillaNombre: string, presupuestos: PresupuestoInfo[]) => void;
  actualizandoId: string | null;
  asignandoId: string | null;
  aprobandoPresupuestoSocioId: string | null;
  disabled?: boolean;
}

export function StageSummaryCard({
  stageKey,
  stageLabel,
  stageDescription,
  tareas,
  presupuestos,
  tareasSinPresupuesto,
  onSolicitarPresupuesto,
  onAprobar,
  onRechazar,
  onAsignar,
  onAprobarPresupuesto,
  onVerPdf,
  onVerLista,
  onRechazarPresupuesto,
  onComentar,
  actualizandoId,
  asignandoId,
  aprobandoPresupuestoSocioId,
  disabled = false,
}: StageSummaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [cuadrillasExpandidas, setCuadrillasExpandidas] = useState<Set<string>>(new Set());

  // Agrupar presupuestos por cuadrilla
  const presupuestosPorCuadrilla = useMemo(() => {
    const grupos = new Map<string, PresupuestoInfo[]>();
    
    (presupuestos ?? []).forEach((presupuesto) => {
      // El cuadrilla_nombre ya viene con el nombre del socio desde AsignarSection
      // Si no tiene nombre, usar "Socio sin nombre" en lugar de "Sin cuadrilla"
      const cuadrillaKey = presupuesto.cuadrilla_nombre || 'Socio sin nombre';
      if (!grupos.has(cuadrillaKey)) {
        grupos.set(cuadrillaKey, []);
      }
      grupos.get(cuadrillaKey)!.push(presupuesto);
    });
    
    return grupos;
  }, [presupuestos]);

  // Calcular estadísticas
  const totalPresupuestos = presupuestos?.length ?? 0;
  const presupuestosEnviados = (presupuestos ?? []).filter(
    (p) => (p.estado ?? '').toUpperCase() === 'PEDIDO' || (p.estado ?? '').toUpperCase() === 'PENDIENTE'
  );
  const precioTotal = presupuestosEnviados.reduce((sum, p) => {
    if (p.monto && p.monto > 0) {
      return sum + Number(p.monto);
    }
    return sum;
  }, 0);
  const totalTareas = tareas?.length ?? 0;

  const toggleCuadrilla = (cuadrillaNombre: string) => {
    setCuadrillasExpandidas((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(cuadrillaNombre)) {
        nuevo.delete(cuadrillaNombre);
      } else {
        nuevo.add(cuadrillaNombre);
      }
      return nuevo;
    });
  };

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(monto);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      {/* Header de la card - siempre visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 text-left transition-colors hover:bg-slate-50"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-slate-400" />
              )}
              <div>
                <h3 className="text-base font-semibold text-slate-900">{stageLabel}</h3>
                <p className="text-xs text-slate-500">{stageDescription}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="text-right">
              <p className="text-xs text-slate-500">Presupuestos</p>
              <p className="font-semibold text-slate-900">{totalPresupuestos}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Precio total</p>
              <p className="font-semibold text-slate-900">
                {precioTotal > 0 ? formatearMonto(precioTotal) : '—'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Tareas</p>
              <p className="font-semibold text-slate-900">{totalTareas}</p>
            </div>
          </div>
        </div>
      </button>

      {/* Contenido expandible */}
      {isExpanded && (
        <div className="border-t border-slate-200 px-6 py-4">
          <div className="space-y-4">
            {/* Presupuestos recibidos agrupados por cuadrilla */}
            {presupuestos && presupuestos.length > 0 && (() => {
              // Separar presupuestos pendientes y aprobados
              // Un grupo va a "pendientes" si tiene AL MENOS UN presupuesto no aprobado
              // Un grupo va a "aprobados" si tiene AL MENOS UN presupuesto aprobado
              const presupuestosPendientes = Array.from(presupuestosPorCuadrilla.entries()).filter(
                ([_, presupuestosCuadrilla]) =>
                  presupuestosCuadrilla.some((p) => (p.estado ?? '').toUpperCase() !== 'APROBADO')
              );

              const presupuestosAprobados = Array.from(presupuestosPorCuadrilla.entries()).filter(
                ([_, presupuestosCuadrilla]) =>
                  presupuestosCuadrilla.some((p) => (p.estado ?? '').toUpperCase() === 'APROBADO')
              );

              return (
                <div className="space-y-4">
                  {/* Presupuestos pendientes */}
                  {presupuestosPendientes.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-slate-700">
                        Presupuestos pendientes ({presupuestosPendientes.reduce((sum, [_, p]) => {
                          const sinAprobar = p.filter((pres) => (pres.estado ?? '').toUpperCase() !== 'APROBADO');
                          return sum + sinAprobar.length;
                        }, 0)})
                      </h4>
                      <div className="space-y-2">
                        {presupuestosPendientes.map(([cuadrillaNombre, presupuestosCuadrilla]) => {
                    // Solo mostrar los presupuestos no aprobados en este bloque
                    const presupuestosNoAprobados = presupuestosCuadrilla.filter((p) => (p.estado ?? '').toUpperCase() !== 'APROBADO');
                    if (presupuestosNoAprobados.length === 0) return null;

                    const estaExpandida = cuadrillasExpandidas.has(cuadrillaNombre);
                    const totalCuadrilla = presupuestosNoAprobados.reduce((sum, p) => {
                      if (p.monto && p.monto > 0) {
                        return sum + Number(p.monto);
                      }
                      return sum;
                    }, 0);
                    const monedaComun = presupuestosNoAprobados.find((p) => p.moneda)?.moneda ?? 'ARS';
                    
                    const socioId = presupuestosNoAprobados[0]?.socio_id;

                    return (
                      <div
                        key={cuadrillaNombre}
                        className="rounded border border-slate-200 bg-white overflow-hidden"
                      >
                        {/* Header de cuadrilla */}
                        <div className="px-3 py-2.5 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center justify-between gap-3">
                            <button
                              onClick={() => toggleCuadrilla(cuadrillaNombre)}
                              className="flex-1 text-left"
                            >
                              <div className="flex items-center gap-2">
                                {estaExpandida ? (
                                  <ChevronDown className="h-4 w-4 text-slate-400" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-slate-400" />
                                )}
                                <span className="font-semibold text-sm text-slate-900">{cuadrillaNombre}</span>
                              </div>
                              <div className="mt-0.5 ml-6 text-xs text-slate-600">
                                {presupuestosNoAprobados.length} tarea{presupuestosNoAprobados.length === 1 ? '' : 's'} • Total:{' '}
                                {totalCuadrilla > 0 ? (
                                  <span className="font-semibold text-slate-900">
                                    {new Intl.NumberFormat('es-AR', {
                                      style: 'currency',
                                      currency: monedaComun,
                                    }).format(totalCuadrilla)}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">Sin monto informado</span>
                                )}
                              </div>
                            </button>
                            {/* Botones de acción para la cuadrilla */}
                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                              {onVerPdf && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={<FileText className="h-3.5 w-3.5" />}
                                  onClick={() => onVerPdf(cuadrillaNombre, presupuestosNoAprobados)}
                                  className="text-xs h-7 px-2"
                                  title="Ver PDF"
                                >
                                  PDF
                                </Button>
                              )}
                              {onVerLista && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={<List className="h-3.5 w-3.5" />}
                                  onClick={() => onVerLista(cuadrillaNombre, presupuestosNoAprobados)}
                                  className="text-xs h-7 px-2"
                                  title="Editar"
                                  disabled={presupuestosNoAprobados.length === 0}
                                >
                                  Editar
                                </Button>
                              )}
                              {onAprobarPresupuesto && presupuestosNoAprobados.length > 0 && socioId && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  icon={aprobandoPresupuestoSocioId === socioId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                                  onClick={() => {
                                    if (socioId) {
                                      onAprobarPresupuesto(socioId, stageKey);
                                    }
                                  }}
                                  disabled={aprobandoPresupuestoSocioId === socioId || disabled}
                                  className="text-xs h-7 px-2"
                                  title="Aprobar presupuesto de este socio"
                                >
                                  Aprobar presupuesto
                                </Button>
                              )}
                              {onRechazarPresupuesto && presupuestosNoAprobados.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  icon={<XCircle className="h-3.5 w-3.5 text-red-500" />}
                                  onClick={() => onRechazarPresupuesto(cuadrillaNombre, presupuestosNoAprobados)}
                                  className="text-xs h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Rechazar presupuesto"
                                  disabled={presupuestosNoAprobados.length === 0}
                                >
                                  Rechazar
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Tareas de la cuadrilla - expandible */}
                        {estaExpandida && (
                          <div className="border-t border-slate-100 divide-y divide-slate-100">
                            {presupuestosNoAprobados.map((presupuesto) => {
                              const estado = (presupuesto.estado ?? 'PENDIENTE').toUpperCase();
                              const estaActualizando = actualizandoId === presupuesto.id;
                              const estaAsignando = asignandoId === presupuesto.id;
                              const estaProcesando = estaActualizando || estaAsignando;

                              return (
                                <div
                                  key={presupuesto.id}
                                  className="px-3 py-2.5 bg-slate-50/50"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <p className="font-medium text-sm text-slate-900 truncate">
                                          {presupuesto.tarea_titulo}
                                        </p>
                                        <span
                                          className={cn(
                                            'rounded px-1.5 py-0.5 text-xs font-medium shrink-0',
                                            estado === 'APROBADO'
                                              ? 'bg-green-100 text-green-700'
                                              : estado === 'RECHAZADO'
                                              ? 'bg-red-100 text-red-700'
                                              : 'bg-yellow-100 text-yellow-700'
                                          )}
                                        >
                                          {estado}
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mb-1">
                                        {presupuesto.monto && presupuesto.monto > 0 && (
                                          <span className="font-medium">
                                            {new Intl.NumberFormat('es-AR', {
                                              style: 'currency',
                                              currency: presupuesto.moneda ?? 'ARS',
                                            }).format(presupuesto.monto)}
                                          </span>
                                        )}
                                        {presupuesto.duracion_ofrecida && (
                                          <span>{presupuesto.duracion_ofrecida} días</span>
                                        )}
                                      </div>
                                      {/* Fechas */}
                                      <div className="space-y-0.5">
                                        {presupuesto.created_at && (
                                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                            <Calendar className="h-3 w-3" />
                                            <span>Solicitado el: {formatFecha(presupuesto.created_at)}</span>
                                          </div>
                                        )}
                                        {presupuesto.updated_at && estado !== 'PENDIENTE' && (
                                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                            <Calendar className="h-3 w-3" />
                                            <span>Enviado por socio: {formatFecha(presupuesto.updated_at)}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={<CheckCircle className="h-3 w-3" />}
                                        onClick={() => onAprobar(presupuesto.id)}
                                        disabled={estaProcesando || estado === 'APROBADO'}
                                        className="text-xs h-7 px-2"
                                      >
                                        Aprobar
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={<XCircle className="h-3 w-3" />}
                                        onClick={() => onRechazar(presupuesto.id)}
                                        disabled={estaProcesando || estado === 'RECHAZADO'}
                                        className="text-xs h-7 px-2"
                                      >
                                        Rechazar
                                      </Button>
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        icon={
                                          estaAsignando ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <Users className="h-3 w-3" />
                                          )
                                        }
                                        onClick={() => onAsignar(presupuesto.id)}
                                        disabled={estaProcesando || estado !== 'APROBADO'}
                                        className="text-xs h-7 px-2"
                                      >
                                        Asignar
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                      </div>
                    </div>
                  )}

                  {/* Tareas asignadas (Presupuestos aprobados) */}
                  {presupuestosAprobados.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <h4 className="text-sm font-semibold text-green-700">
                          Tareas asignadas ({presupuestosAprobados.reduce((sum, [_, p]) => {
                            const aprobados = p.filter((presup) => (presup.estado ?? '').toUpperCase() === 'APROBADO');
                            return sum + aprobados.length;
                          }, 0)})
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {presupuestosAprobados.map(([cuadrillaNombre, presupuestosCuadrilla]) => {
                          // Filtrar solo los presupuestos aprobados de este grupo
                          const presupuestosAprobadosDelGrupo = presupuestosCuadrilla.filter((p) => {
                            const estado = (p.estado ?? '').toUpperCase();
                            return estado === 'APROBADO';
                          });
                          
                          // Si no hay presupuestos aprobados en este grupo, no mostrar
                          if (presupuestosAprobadosDelGrupo.length === 0) return null;
                          
                          const estaExpandida = cuadrillasExpandidas.has(cuadrillaNombre);
                          const totalCuadrilla = presupuestosAprobadosDelGrupo.reduce((sum, p) => {
                            if (p.monto && p.monto > 0) {
                              return sum + Number(p.monto);
                            }
                            return sum;
                          }, 0);
                          const monedaComun = presupuestosAprobadosDelGrupo.find((p) => p.moneda)?.moneda ?? 'ARS';

                          return (
                            <div
                              key={cuadrillaNombre}
                              className="rounded border border-green-200 bg-green-50/30 overflow-hidden"
                            >
                              {/* Header de cuadrilla */}
                              <div className="px-3 py-2.5 hover:bg-green-50/50 transition-colors">
                                <div className="flex items-center justify-between gap-3">
                                  <button
                                    onClick={() => toggleCuadrilla(cuadrillaNombre)}
                                    className="flex-1 text-left"
                                  >
                                    <div className="flex items-center gap-2">
                                      {estaExpandida ? (
                                        <ChevronDown className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 text-green-600" />
                                      )}
                                      <span className="font-semibold text-sm text-green-900">{cuadrillaNombre}</span>
                                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                        Aprobado
                                      </span>
                                    </div>
                                    <div className="mt-0.5 ml-6 text-xs text-green-700">
                                      {presupuestosAprobadosDelGrupo.length} tarea{presupuestosAprobadosDelGrupo.length === 1 ? '' : 's'} • Total:{' '}
                                      {totalCuadrilla > 0 ? (
                                        <span className="font-semibold text-green-900">
                                          {new Intl.NumberFormat('es-AR', {
                                            style: 'currency',
                                            currency: monedaComun,
                                          }).format(totalCuadrilla)}
                                        </span>
                                      ) : (
                                        <span className="text-green-600">Sin monto informado</span>
                                      )}
                                    </div>
                                  </button>
                                  {/* Botones de acción para la cuadrilla - Solo PDF y Comentar */}
                                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                    {onVerPdf && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={<FileText className="h-3.5 w-3.5" />}
                                        onClick={() => onVerPdf(cuadrillaNombre, presupuestosAprobadosDelGrupo)}
                                        className="text-xs h-7 px-2"
                                        title="Ver PDF"
                                      >
                                        PDF
                                      </Button>
                                    )}
                                    {onComentar && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={<MessageSquare className="h-3.5 w-3.5" />}
                                        onClick={() => onComentar(cuadrillaNombre, presupuestosAprobadosDelGrupo)}
                                        className="text-xs h-7 px-2"
                                        title="Comentar"
                                      >
                                        Comentar
                                      </Button>
                                    )}
                                    {/* No mostrar Editar ni Aprobar para presupuestos aprobados */}
                                  </div>
                                </div>
                              </div>

                              {/* Tareas de la cuadrilla - expandible */}
                              {estaExpandida && (
                                <div className="border-t border-green-100 divide-y divide-green-100">
                                  {presupuestosAprobadosDelGrupo.map((presupuesto) => {
                                    const estado = (presupuesto.estado ?? 'PENDIENTE').toUpperCase();

                                    return (
                                      <div
                                        key={presupuesto.id}
                                        className="px-3 py-2.5 bg-green-50/50"
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                              <p className="font-medium text-sm text-green-900 truncate">
                                                {presupuesto.tarea_titulo}
                                              </p>
                                              <span className="rounded px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 shrink-0">
                                                {estado}
                                              </span>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 text-xs text-green-700 mb-1">
                                              {presupuesto.monto && presupuesto.monto > 0 && (
                                                <span className="font-medium">
                                                  {new Intl.NumberFormat('es-AR', {
                                                    style: 'currency',
                                                    currency: presupuesto.moneda ?? 'ARS',
                                                  }).format(presupuesto.monto)}
                                                </span>
                                              )}
                                              {presupuesto.duracion_ofrecida && (
                                                <span>{presupuesto.duracion_ofrecida} días</span>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Mensaje si no hay presupuestos */}
            {(!presupuestos || presupuestos.length === 0) && (
              <p className="text-sm text-slate-500">No hay presupuestos en esta etapa.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


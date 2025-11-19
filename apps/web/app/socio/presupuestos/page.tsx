'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2, Save, Send, Calendar, Building2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/grows';
import { Input } from '@/components/ui/input';
// Textarea component - using native textarea for now
import { Badge } from '@/components/ui/grows';
import { useToast } from '@/components/ui/use-toast';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import type { Database } from '@/lib/types/supabase.gen';
import { cn } from '@/lib/utils';

type Presupuesto = {
  id: string;
  monto: number | null;
  moneda: string | null;
  estado: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string | null;
  tarea_id: string;
  tarea: {
    id: string;
    title: string | null;
    etapa: string | null;
    obra_id: string;
    fecha_inicio_estimada: string | null;
    fecha_fin_estimada: string | null;
    es: number | null;
    ef: number | null;
    elemento_id: string | null;
  } | null;
  obra: {
    id: string;
    name: string | null;
  } | null;
  elemento: {
    id: string;
    nombre: string | null;
    cantidad: number | null;
    unidad: string | null;
  } | null;
};

type PresupuestoEdit = {
  id: string;
  monto: string;
  notas: string;
  estado: string;
};

export default function PresupuestosPage() {
  const currentUser = useCurrentUser();
  const supabase = useMemo(
    () => createClientComponentClient<Database>() as any,
    []
  );
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [socioId, setSocioId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Map<string, PresupuestoEdit>>(new Map());
  const [saving, setSaving] = useState<Set<string>>(new Set());

  // Obtener socio_id del usuario actual
  useEffect(() => {
    async function getSocioId() {
      if (!currentUser?.orgId || !currentUser?.email) return;

      try {
        // Buscar socio por email o user_id
        const { data: socio, error } = await supabase
          .from('socios')
          .select('id')
          .eq('org_id', currentUser.orgId)
          .or(`contacto.eq.${currentUser.email},email.eq.${currentUser.email}`)
          .maybeSingle();

        if (error) {
          console.error('[PresupuestosPage] Error obteniendo socio:', error);
          // Intentar buscar por user_id si existe
          const { data: socioAlt } = await supabase
            .from('socios')
            .select('id')
            .eq('org_id', currentUser.orgId)
            .eq('user_id', currentUser.id)
            .maybeSingle();
          
          if (socioAlt) {
            setSocioId(socioAlt.id);
          }
          return;
        }

        if (socio) {
          setSocioId(socio.id);
        }
      } catch (err) {
        console.error('[PresupuestosPage] Error:', err);
      }
    }

    void getSocioId();
  }, [currentUser, supabase]);

  // Cargar presupuestos
  useEffect(() => {
    if (!socioId) return;

    async function loadPresupuestos() {
      setLoading(true);
      try {
        // Obtener presupuestos con joins
        const { data: presupuestosData, error } = await supabase
          .from('tareas_presupuestos')
          .select(`
            id,
            monto,
            moneda,
            estado,
            notas,
            created_at,
            updated_at,
            tarea_id,
            tareas (
              id,
              title,
              etapa,
              obra_id,
              fecha_inicio_estimada,
              fecha_fin_estimada,
              es,
              ef,
              elemento_id
            )
          `)
          .eq('socio_id', socioId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Obtener obras y elementos por separado
        const obraIds = new Set<string>();
        const elementoIds = new Set<string>();
        (presupuestosData ?? []).forEach((p: any) => {
          if (p.tareas?.obra_id) obraIds.add(p.tareas.obra_id);
          if (p.tareas?.elemento_id) elementoIds.add(p.tareas.elemento_id);
        });

        const [obrasData, elementosData] = await Promise.all([
          obraIds.size > 0
            ? supabase
                .from('obras')
                .select('id, name')
                .in('id', Array.from(obraIds))
            : Promise.resolve({ data: [] }),
          elementoIds.size > 0
            ? supabase
                .from('elementos')
                .select('id, nombre, cantidad, unidad')
                .in('id', Array.from(elementoIds))
            : Promise.resolve({ data: [] }),
        ]);

        const obrasMap = new Map((obrasData.data ?? []).map((o: any) => [o.id, o]));
        const elementosMap = new Map((elementosData.data ?? []).map((e: any) => [e.id, e]));

        const presupuestosEnriquecidos: Presupuesto[] = (presupuestosData ?? []).map((p: any) => ({
          ...p,
          tarea: p.tareas,
          obra: p.tareas?.obra_id ? obrasMap.get(p.tareas.obra_id) : null,
          elemento: p.tareas?.elemento_id ? elementosMap.get(p.tareas.elemento_id) : null,
        }));

        setPresupuestos(presupuestosEnriquecidos);

        // Inicializar estado de edición
        const editingMap = new Map<string, PresupuestoEdit>();
        presupuestosEnriquecidos.forEach((p) => {
          editingMap.set(p.id, {
            id: p.id,
            monto: p.monto?.toString() || '',
            notas: p.notas || '',
            estado: p.estado || 'PENDIENTE',
          });
        });
        setEditing(editingMap);
      } catch (err) {
        console.error('[PresupuestosPage] Error cargando presupuestos:', err);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los presupuestos.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    void loadPresupuestos();
  }, [socioId, supabase, toast]);

  const calcularDuracion = (presupuesto: Presupuesto): number | null => {
    if (presupuesto.tarea?.ef !== null && presupuesto.tarea?.es !== null) {
      return (presupuesto.tarea.ef ?? 0) - (presupuesto.tarea.es ?? 0);
    }
    if (presupuesto.tarea?.fecha_inicio_estimada && presupuesto.tarea?.fecha_fin_estimada) {
      const inicio = new Date(presupuesto.tarea.fecha_inicio_estimada);
      const fin = new Date(presupuesto.tarea.fecha_fin_estimada);
      if (!isNaN(inicio.getTime()) && !isNaN(fin.getTime())) {
        const diffTime = Math.abs(fin.getTime() - inicio.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }
    return null;
  };

  const handleUpdateField = (id: string, field: 'monto' | 'notas', value: string) => {
    setEditing((prev) => {
      const next = new Map(prev);
      const current = next.get(id);
      if (current) {
        next.set(id, { ...current, [field]: value });
      }
      return next;
    });
  };

  const handleSaveDraft = async (id: string) => {
    if (!socioId) return;

    const edit = editing.get(id);
    if (!edit) return;

    setSaving((prev) => new Set(prev).add(id));

    try {
      const montoNum = edit.monto ? parseFloat(edit.monto) : null;
      
      const { error } = await supabase
        .from('tareas_presupuestos')
        .update({
          monto: montoNum,
          notas: edit.notas || null,
          estado: 'PENDIENTE',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('socio_id', socioId);

      if (error) throw error;

      // Actualizar estado local
      setPresupuestos((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                monto: montoNum,
                notas: edit.notas || null,
                estado: 'PENDIENTE',
                updated_at: new Date().toISOString(),
              }
            : p
        )
      );

      toast({
        title: 'Borrador guardado',
        description: 'Los cambios se guardaron correctamente.',
      });
    } catch (err) {
      console.error('[PresupuestosPage] Error guardando borrador:', err);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el borrador.',
        variant: 'destructive',
      });
    } finally {
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleSendPresupuesto = async (id: string) => {
    if (!socioId) return;

    const edit = editing.get(id);
    if (!edit) return;

    if (!edit.monto || parseFloat(edit.monto) <= 0) {
      toast({
        title: 'Monto requerido',
        description: 'Debés ingresar un monto válido antes de enviar.',
        variant: 'destructive',
      });
      return;
    }

    setSaving((prev) => new Set(prev).add(id));

    try {
      const montoNum = parseFloat(edit.monto);
      
      const { error } = await supabase
        .from('tareas_presupuestos')
        .update({
          monto: montoNum,
          notas: edit.notas || null,
          estado: 'ENVIADO',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('socio_id', socioId);

      if (error) throw error;

      // Actualizar estado local
      setPresupuestos((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                monto: montoNum,
                notas: edit.notas || null,
                estado: 'ENVIADO',
                updated_at: new Date().toISOString(),
              }
            : p
        )
      );

      // Actualizar estado de edición
      setEditing((prev) => {
        const next = new Map(prev);
        const current = next.get(id);
        if (current) {
          next.set(id, { ...current, estado: 'ENVIADO' });
        }
        return next;
      });

      toast({
        title: 'Presupuesto enviado',
        description: 'El presupuesto se envió correctamente al cliente.',
      });
    } catch (err) {
      console.error('[PresupuestosPage] Error enviando presupuesto:', err);
      toast({
        title: 'Error',
        description: 'No se pudo enviar el presupuesto.',
        variant: 'destructive',
      });
    } finally {
      setSaving((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Agrupar por obra
  const presupuestosPorObra = useMemo(() => {
    const map = new Map<string, Presupuesto[]>();
    presupuestos.forEach((p) => {
      const obraId = p.obra?.id || 'sin-obra';
      const list = map.get(obraId) || [];
      list.push(p);
      map.set(obraId, list);
    });
    return map;
  }, [presupuestos]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Cargando presupuestos...</span>
        </div>
      </div>
    );
  }

  if (!socioId) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900">No se encontró tu perfil de socio</h2>
          <p className="text-sm text-slate-500 mt-2">Contactá al administrador para configurar tu cuenta.</p>
        </div>
      </div>
    );
  }

  if (presupuestos.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-slate-900">No hay presupuestos pendientes</h2>
          <p className="text-sm text-slate-500 mt-2">Cuando recibas solicitudes de presupuesto, aparecerán acá.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Presupuestos</h1>
          <p className="text-sm text-slate-500 mt-1">
            Completá y enviá los presupuestos solicitados por el cliente técnico.
          </p>
        </div>

        {Array.from(presupuestosPorObra.entries()).map(([obraId, presupuestosObra]) => {
          const obra = presupuestosObra[0]?.obra;
          
          // Agrupar por etapa
          const porEtapa = new Map<string, Presupuesto[]>();
          presupuestosObra.forEach((p) => {
            const etapa = p.tarea?.etapa || 'Sin etapa';
            const list = porEtapa.get(etapa) || [];
            list.push(p);
            porEtapa.set(etapa, list);
          });

          return (
            <div key={obraId} className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-slate-600" />
                <h2 className="text-xl font-semibold text-slate-900">
                  {obra?.name || 'Obra sin nombre'}
                </h2>
              </div>

              {Array.from(porEtapa.entries()).map(([etapa, presupuestosEtapa]) => (
                <div key={etapa} className="space-y-3">
                  <Badge variant="default" className="text-xs">
                    {etapa}
                  </Badge>

                  <div className="space-y-3">
                    {presupuestosEtapa.map((presupuesto) => {
                      const edit = editing.get(presupuesto.id);
                      const duracion = calcularDuracion(presupuesto);
                      const estado = (presupuesto.estado || 'PENDIENTE').toUpperCase();
                      const isSaving = saving.has(presupuesto.id);

                      return (
                        <div
                          key={presupuesto.id}
                          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                          <div className="space-y-4">
                            {/* Información de la tarea */}
                            <div>
                              <h3 className="text-base font-semibold text-slate-900">
                                {presupuesto.tarea?.title || 'Tarea sin título'}
                              </h3>
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                {duracion !== null && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {duracion} día{duracion === 1 ? '' : 's'}
                                  </span>
                                )}
                                {presupuesto.elemento && (
                                  <span>
                                    Elemento: {presupuesto.elemento.nombre}
                                    {presupuesto.elemento.cantidad && presupuesto.elemento.unidad && (
                                      <> — {presupuesto.elemento.cantidad} {presupuesto.elemento.unidad}</>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Estado */}
                            <div>
                              <Badge
                                variant={
                                  estado === 'APROBADO'
                                    ? 'success'
                                    : estado === 'RECHAZADO'
                                    ? 'error'
                                    : estado === 'ENVIADO'
                                    ? 'default'
                                    : 'warning'
                                }
                              >
                                {estado}
                              </Badge>
                            </div>

                            {/* Formulario de edición */}
                            {estado === 'PENDIENTE' && edit && (
                              <div className="space-y-3">
                                <div>
                                  <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Monto (ARS)
                                  </label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={edit.monto}
                                    onChange={(e) => handleUpdateField(presupuesto.id, 'monto', e.target.value)}
                                    placeholder="0.00"
                                    className="w-full"
                                  />
                                </div>

                                <div>
                                  <label className="mb-1 block text-sm font-medium text-slate-700">
                                    Notas (opcional)
                                  </label>
                                  <textarea
                                    value={edit.notas}
                                    onChange={(e) => handleUpdateField(presupuesto.id, 'notas', e.target.value)}
                                    placeholder="Agregá comentarios o detalles adicionales..."
                                    rows={3}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                  />
                                </div>

                                <div className="flex gap-2">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleSaveDraft(presupuesto.id)}
                                    disabled={isSaving}
                                  >
                                    {isSaving ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Save className="h-4 w-4" />
                                    )}
                                    Guardar borrador
                                  </Button>
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleSendPresupuesto(presupuesto.id)}
                                    disabled={isSaving}
                                  >
                                    {isSaving ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Send className="h-4 w-4" />
                                    )}
                                    Enviar presupuesto
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Vista de solo lectura si está enviado */}
                            {estado === 'ENVIADO' && (
                              <div className="space-y-2 rounded-lg bg-slate-50 p-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-slate-700">Monto:</span>
                                  <span className="text-sm font-semibold text-slate-900">
                                    {presupuesto.monto
                                      ? new Intl.NumberFormat('es-AR', {
                                          style: 'currency',
                                          currency: presupuesto.moneda || 'ARS',
                                        }).format(presupuesto.monto)
                                      : 'No informado'}
                                  </span>
                                </div>
                                {presupuesto.notas && (
                                  <div>
                                    <span className="text-sm font-medium text-slate-700">Notas:</span>
                                    <p className="text-sm text-slate-600 mt-1">{presupuesto.notas}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

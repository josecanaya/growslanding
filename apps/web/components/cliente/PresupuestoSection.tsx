'use client';

import {useCallback, useEffect, useMemo, useState} from 'react';
import {createClientComponentClient} from '@supabase/auth-helpers-nextjs';
import type {PostgrestSingleResponse} from '@supabase/supabase-js';
import {Loader2, PlusCircle, Send} from 'lucide-react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {Input} from '@/components/ui/input';
import {useToast} from '@/components/ui/use-toast';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {useCurrentUser} from '@/lib/hooks/useCurrentUser';
import type {Database} from '@/lib/types/supabase.gen';

type Task = {
  id: string;
  titulo: string;
  descripcion: string | null;
};

type Solicitud = {
  id: string;
  tareaId: string;
  socioId: string | null;
  estado: string;
  notas: string | null;
  createdAt: string;
  tarea: Task | null;
};

type Cuadrilla = {
  id: string;
  nombre: string;
};

type Obra = {
  id: string;
  nombre: string;
};

type LoadOptions = {
  silent?: boolean;
};

function normalizeTask(row: Record<string, any> | null | undefined): Task | null {
  if (!row) return null;
  const titulo =
    (row.title as string | null | undefined) ??
    (row.nombre as string | null | undefined) ??
    (row.titulo as string | null | undefined) ??
    'Tarea sin título';
  return {
    id: String(row.id),
    titulo,
    descripcion:
      (row.descripcion as string | null | undefined) ??
      (row.detail as string | null | undefined) ??
      null,
  };
}

function normalizeSolicitud(row: Record<string, any>): Solicitud {
  const tarea = normalizeTask(row.tareas as Record<string, any> | null | undefined);
  const estadoRaw = (row.estado as string | null | undefined) ?? 'pedido';

  return {
    id: String(row.id),
    tareaId: String(row.tarea_id),
    socioId: row.socio_id ? String(row.socio_id) : null,
    estado: estadoRaw,
    notas: (row.notas as string | null | undefined) ?? null,
    createdAt: (row.created_at as string | null | undefined) ?? new Date().toISOString(),
    tarea,
  };
}

function normalizeObra(row: Record<string, any>): Obra {
  return {
    id: String(row.id),
    nombre:
      (row.nombre as string | null | undefined) ??
      (row.title as string | null | undefined) ??
      'Obra sin nombre',
  };
}

function normalizeCuadrilla(row: Record<string, any>): Cuadrilla {
  return {
    id: String(row.id),
    nombre: (row.nombre as string | null | undefined) ?? 'Cuadrilla sin nombre',
  };
}

export function PresupuestoSection() {
  const {toast} = useToast();
  const currentUser = useCurrentUser();
  const supabase = useMemo(
    () => createClientComponentClient<Database>() as any,
    []
  );

  const [obras, setObras] = useState<Obra[]>([]);
  const [obraSeleccionada, setObraSeleccionada] = useState<string | null>(null);

  const [cuadrillas, setCuadrillas] = useState<Cuadrilla[]>([]);
  const [tareasDisponibles, setTareasDisponibles] = useState<Task[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [tasksMap, setTasksMap] = useState<Record<string, Task>>({});

  const [loadingObras, setLoadingObras] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [selectedCuadrillaId, setSelectedCuadrillaId] = useState<string>('');
  const [nota, setNota] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const cuadrillaMap = useMemo(() => {
    const map = new Map<string, string>();
    cuadrillas.forEach((item) => {
      map.set(item.id, item.nombre);
    });
    return map;
  }, [cuadrillas]);

  const loadData = useCallback(
    async (options: LoadOptions = {}) => {
      if (!obraSeleccionada || !currentUser?.orgId) {
        return;
      }

      if (!options.silent) {
        setLoadingData(true);
        setError(null);
      }

      try {
        const presupuestosPromise = supabase
          .from('tareas_presupuestos')
          .select(
            `
              id,
              tarea_id,
              socio_id,
              estado,
              notas,
              created_at,
              tareas!inner (
                id,
                nombre,
                title,
                descripcion
              )
            `
          )
          .eq('tareas.obra_id', obraSeleccionada)
          .order('created_at', {ascending: false});

        const tareasPromise = supabase
          .from('tareas')
          .select('id, nombre, title, descripcion')
          .eq('obra_id', obraSeleccionada)
          .is('responsable', null);

        const [{data: presupuestosData, error: presupuestosError}, {data: tareasData, error: tareasError}] =
          await Promise.all([presupuestosPromise, tareasPromise]);

        if (presupuestosError) throw presupuestosError;
        if (tareasError) throw tareasError;

        const mappedSolicitudes = (presupuestosData ?? []).map((row: any) => normalizeSolicitud(row));
        const tareasIniciales = (tareasData ?? [])
          .map((row: any) => normalizeTask(row))
          .filter((task: Task | null | undefined): task is Task => Boolean(task));

        const nuevaTaskMap: Record<string, Task> = {};
        tareasIniciales.forEach((task: Task) => {
          nuevaTaskMap[task.id] = task;
        });
        mappedSolicitudes.forEach((solicitud: Solicitud) => {
          if (solicitud.tarea) {
            nuevaTaskMap[solicitud.tarea.id] = solicitud.tarea;
          }
        });

        const tareasConSolicitud = new Set<string>(
          mappedSolicitudes.map((solicitud: Solicitud) => solicitud.tareaId)
        );
        const disponibles = tareasIniciales.filter(
          (task: Task) => !tareasConSolicitud.has(task.id)
        );

        setSolicitudes(mappedSolicitudes);
        setTareasDisponibles(disponibles);
        setTasksMap(nuevaTaskMap);
      } catch (err) {
        console.error('[PresupuestoSection] Error loading data', err);
        if (!options.silent) {
          setError('No pudimos cargar las tareas y solicitudes de presupuesto.');
        }
      } finally {
        if (!options.silent) {
          setLoadingData(false);
        }
      }
    },
    [supabase, obraSeleccionada, currentUser?.orgId]
  );

  useEffect(() => {
    if (!currentUser?.orgId) {
      return;
    }

    let active = true;
    setLoadingObras(true);
    setError(null);

    const fetchObras = async () => {
      try {
        const { data, error: obrasError } = await supabase
          .from('obras')
          .select('id, nombre')
          .eq('org_id', currentUser.orgId)
          .order('created_at', { ascending: true });

        if (!active) return;

        if (obrasError) {
          console.error('[PresupuestoSection] Error loading obras', obrasError);
          setError('No pudimos recuperar tus obras.');
          return;
        }

        const mapped = (data ?? []).map((row: any) => normalizeObra(row));
        setObras(mapped);
        if (!obraSeleccionada && mapped.length > 0) {
          setObraSeleccionada(mapped[0].id);
        }
      } catch (err) {
        if (!active) return;
        console.error('[PresupuestoSection] Unexpected error loading obras', err);
        setError('No pudimos recuperar tus obras.');
      } finally {
        if (active) {
          setLoadingObras(false);
        }
      }
    };

    void fetchObras();

    return () => {
      active = false;
    };
  }, [supabase, currentUser?.orgId, obraSeleccionada]);

  useEffect(() => {
    if (!currentUser?.orgId) return;

    let active = true;

    const fetchCuadrillas = async () => {
      try {
        const { data, error: cuadrillasError } = await supabase
          .from('cuadrillas')
          .select('id, nombre')
          .eq('org_id', currentUser.orgId)
          .order('nombre', { ascending: true });

        if (!active) return;

        if (cuadrillasError) {
          console.error('[PresupuestoSection] Error loading cuadrillas', cuadrillasError);
          return;
        }

        setCuadrillas((data ?? []).map((row: any) => normalizeCuadrilla(row)));
      } catch (err) {
        if (!active) return;
        console.error('[PresupuestoSection] Unexpected error loading cuadrillas', err);
      }
    };

    void fetchCuadrillas();

    return () => {
      active = false;
    };
  }, [supabase, currentUser?.orgId]);

  useEffect(() => {
    if (!obraSeleccionada || !currentUser?.orgId) return;
    void loadData();
  }, [obraSeleccionada, currentUser?.orgId, loadData]);

  useEffect(() => {
    if (!obraSeleccionada) return;

    const channel = supabase
      .channel('cliente-presupuesto-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tareas_presupuestos',
        },
        async (payload: { new: Record<string, unknown> | null; old: Record<string, unknown> | null }) => {
          const row = (payload.new ?? payload.old) as Record<string, any> | null;
          const tareaId = row?.tarea_id as string | undefined;
          if (!tareaId) return;

          const tareaResponse: PostgrestSingleResponse<{obra_id: string} | null> = await supabase
            .from('tareas')
            .select('obra_id')
            .eq('id', tareaId)
            .maybeSingle();

          if (tareaResponse.error) {
            console.error('[PresupuestoSection] Error verifying realtime tarea', tareaResponse.error);
            return;
          }

          if (tareaResponse.data?.obra_id === obraSeleccionada) {
            void loadData({silent: true});
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, obraSeleccionada, loadData]);

  const handleOpenModal = (taskId?: string) => {
    if (taskId) {
      setSelectedTaskId(taskId);
    } else if (tareasDisponibles.length === 1) {
      setSelectedTaskId(tareasDisponibles[0].id);
    } else {
      setSelectedTaskId('');
    }
    setSelectedCuadrillaId('');
    setNota('');
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedTaskId || !selectedCuadrillaId) {
      toast({
        title: 'Completá los campos necesarios',
        description: 'Seleccioná una tarea y una cuadrilla para solicitar el presupuesto.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const {data, error: insertError} = await supabase
        .from('tareas_presupuestos')
        .insert({
          tarea_id: selectedTaskId,
          socio_id: selectedCuadrillaId,
          estado: 'pedido',
          notas: nota || null,
        })
        .select(
          `
            id,
            tarea_id,
            socio_id,
            estado,
            notas,
            created_at,
            tareas (
              id,
              nombre,
              title,
              descripcion
            )
          `
        )
        .maybeSingle();

      if (insertError) throw insertError;
      if (data) {
        const nuevaSolicitud = normalizeSolicitud(data);
        setSolicitudes((prev) => [nuevaSolicitud, ...prev]);
        setTareasDisponibles((prev) => prev.filter((task) => task.id !== selectedTaskId));
        setTasksMap((prev) => {
          const next = {...prev};
          if (nuevaSolicitud.tarea) {
            next[nuevaSolicitud.tarea.id] = nuevaSolicitud.tarea;
          } else if (prev[selectedTaskId]) {
            next[selectedTaskId] = prev[selectedTaskId];
          }
          return next;
        });
      }

      toast({
        title: 'Presupuesto solicitado',
        description: 'Avisamos a la cuadrilla seleccionada para que responda tu pedido.',
      });
      setModalOpen(false);
    } catch (err) {
      console.error('[PresupuestoSection] Error creating solicitud', err);
      toast({
        title: 'No pudimos enviar la solicitud',
        description: 'Intentá nuevamente en unos minutos.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const obraSeleccionadaData = obras.find((obra) => obra.id === obraSeleccionada) ?? null;

  const tareasDisponiblesCount = tareasDisponibles.length;
  const solicitudesPendientes = solicitudes.filter(
    (solicitud) => solicitud.estado?.toLowerCase() === 'pedido' || solicitud.estado?.toLowerCase() === 'pendiente'
  ).length;

  return (
    <div className="space-y-8">
      <Card className="border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Obra seleccionada</h3>
            <p className="text-sm text-slate-500">
              Elegí una obra para ver sus tareas pendientes y solicitar presupuesto a tus cuadrillas.
            </p>
          </div>
          <div className="w-full max-w-xs">
            <Select
              value={obraSeleccionada ?? ''}
              onValueChange={(value) => setObraSeleccionada(value || null)}
              disabled={loadingObras || obras.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingObras ? 'Cargando…' : 'Seleccioná una obra'} />
              </SelectTrigger>
              <SelectContent>
                {obras.length === 0 ? (
                  <SelectItem value="" disabled>
                    No hay obras disponibles
                  </SelectItem>
                ) : (
                  obras.map((obra) => (
                    <SelectItem key={obra.id} value={obra.id}>
                      {obra.nombre}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {error ? (
        <Card className="border border-amber-200 bg-amber-50 text-amber-800">
          <div className="space-y-2 p-6">
            <h4 className="text-sm font-semibold uppercase tracking-wide">Atención</h4>
            <p className="text-sm">{error}</p>
          </div>
        </Card>
      ) : null}

      {!obraSeleccionadaData && !loadingObras ? (
        <EmptyState
          title="Todavía no tenés obras cargadas"
          description="Creá una obra para gestionar sus tareas y solicitudes de presupuesto."
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border border-slate-200 bg-white shadow-sm">
              <div className="space-y-1 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Tareas sin presupuesto
                </p>
                <p className="text-2xl font-semibold text-slate-900">{tareasDisponiblesCount}</p>
                <p className="text-xs text-slate-500">
                  Tareas de {obraSeleccionadaData?.nombre ?? 'la obra'} sin pedidos activos.
                </p>
              </div>
            </Card>
            <Card className="border border-slate-200 bg-white shadow-sm">
              <div className="space-y-1 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Solicitudes pendientes
                </p>
                <p className="text-2xl font-semibold text-slate-900">{solicitudesPendientes}</p>
                <p className="text-xs text-slate-500">Esperando respuesta de tus cuadrillas.</p>
              </div>
            </Card>
            <Card className="border border-slate-200 bg-white shadow-sm">
              <div className="space-y-1 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Total de solicitudes
                </p>
                <p className="text-2xl font-semibold text-slate-900">{solicitudes.length}</p>
                <p className="text-xs text-slate-500">Historial de pedidos registrados para esta obra.</p>
              </div>
            </Card>
          </div>

          <section className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Tareas disponibles</h3>
                <p className="text-sm text-slate-500">
                  Pedí presupuesto a tus cuadrillas para estimar costos antes de asignar.
                </p>
              </div>
              <Button
                variant="primary"
                icon={loadingData ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                onClick={() => handleOpenModal()}
                disabled={tareasDisponiblesCount === 0 || loadingData}
              >
                Pedir presupuesto
              </Button>
            </div>

            {loadingData && tareasDisponibles.length === 0 && solicitudes.length === 0 ? (
              <Card className="border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 p-6 text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Cargando información de la obra…</span>
                </div>
              </Card>
            ) : tareasDisponiblesCount === 0 ? (
              <EmptyState
                title="No hay tareas disponibles"
                description="Cuando haya tareas sin presupuesto solicitado vas a poder pedirlo desde acá."
              />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {tareasDisponibles.map((task) => (
                  <Card key={task.id} className="border border-slate-200 bg-white shadow-sm">
                    <div className="space-y-3 p-6">
                      <div>
                        <h4 className="text-base font-semibold text-slate-900">{task.titulo}</h4>
                        {task.descripcion ? (
                          <p className="text-sm text-slate-500">{task.descripcion}</p>
                        ) : (
                          <p className="text-xs text-slate-400">Sin descripción</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="info">Sin presupuesto</Badge>
                        <Button variant="secondary" size="sm" onClick={() => handleOpenModal(task.id)}>
                          Solicitar
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Solicitudes enviadas</h3>
                <p className="text-sm text-slate-500">
                  Seguimiento de todos los pedidos realizados a tus cuadrillas.
                </p>
              </div>
            </div>

            {solicitudes.length === 0 ? (
              <EmptyState
                title="Todavía no enviaste solicitudes"
                description="Cuando pidas presupuestos a tus cuadrillas los vas a ver listados acá."
              />
            ) : (
              <Card className="border border-slate-200 bg-white shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tarea</TableHead>
                      <TableHead>Cuadrilla</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Notas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {solicitudes.map((solicitud) => {
                      const tarea = solicitud.tarea ?? tasksMap[solicitud.tareaId] ?? null;
                      const cuadrillaNombre = solicitud.socioId
                        ? cuadrillaMap.get(solicitud.socioId) ?? 'Cuadrilla sin nombre'
                        : 'Sin cuadrilla asignada';
                      const estado = solicitud.estado || 'pedido';
                      const estadoLower = estado.toLowerCase();

                      const estadoVariant: Parameters<typeof Badge>[0]['variant'] =
                        estadoLower === 'aprobado'
                          ? 'success'
                          : estadoLower === 'rechazado'
                          ? 'error'
                          : estadoLower === 'pendiente' || estadoLower === 'pedido'
                          ? 'warning'
                          : 'info';

                      const fecha = solicitud.createdAt
                        ? new Date(solicitud.createdAt).toLocaleString('es-AR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Sin fecha';

                      return (
                        <TableRow key={solicitud.id}>
                          <TableCell className="font-medium text-slate-700">{fecha}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-900">
                                {tarea?.titulo ?? 'Tarea'}
                              </span>
                              {tarea?.descripcion && (
                                <span className="text-xs text-slate-500">{tarea.descripcion}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-700">{cuadrillaNombre}</TableCell>
                          <TableCell>
                            <Badge variant={estadoVariant}>{estado.toUpperCase()}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs text-sm text-slate-600">
                            {solicitud.notas ? solicitud.notas : <span className="text-slate-400">Sin notas</span>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Card>
            )}
          </section>
        </>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pedir presupuesto</DialogTitle>
            <DialogDescription>
              Seleccioná la tarea y la cuadrilla para enviar el pedido. Podés sumar notas para dar más contexto.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Tarea</label>
              <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                <SelectTrigger>
                  <SelectValue placeholder="Elegí una tarea sin presupuesto" />
                </SelectTrigger>
                <SelectContent>
                  {tareasDisponibles.length === 0 ? (
                    <SelectItem value="" disabled>
                      No hay tareas disponibles
                    </SelectItem>
                  ) : (
                    tareasDisponibles.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.titulo}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Cuadrilla</label>
              <Select value={selectedCuadrillaId} onValueChange={setSelectedCuadrillaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccioná una cuadrilla" />
                </SelectTrigger>
                <SelectContent>
                  {cuadrillas.length === 0 ? (
                    <SelectItem value="" disabled>
                      No hay cuadrillas disponibles
                    </SelectItem>
                  ) : (
                    cuadrillas.map((cuadrilla) => (
                      <SelectItem key={cuadrilla.id} value={cuadrilla.id}>
                        {cuadrilla.nombre}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Nota opcional</label>
              <Input
                value={nota}
                onChange={(event) => setNota(event.target.value)}
                placeholder="Agregá detalles que ayuden a la cuadrilla"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              icon={submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              onClick={() => void handleSubmit()}
              disabled={submitting || !selectedTaskId || !selectedCuadrillaId}
            >
              Enviar solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



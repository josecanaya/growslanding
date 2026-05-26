'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Edit,
  Loader2,
  PauseCircle,
  Phone,
  PlayCircle,
  Plus,
  Trash2,
  UserPlus,
  X,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export interface Colaborador {
  id: string;
  socio_id: string;
  org_id?: string | null;
  nombre: string;
  apellido: string | null;
  dni: string | null;
  telefono: string | null;
  especialidad: string | null;
  categoria: string | null;
  foto_url: string | null;
  observaciones: string | null;
  activo: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

interface DraftColaborador {
  nombre: string;
  apellido: string;
  dni: string;
  telefono: string;
  especialidad: string;
  categoria: string;
  observaciones: string;
}

const EMPTY_DRAFT: DraftColaborador = {
  nombre: '',
  apellido: '',
  dni: '',
  telefono: '',
  especialidad: '',
  categoria: '',
  observaciones: '',
};

export function ColaboradoresSection() {
  const { toast } = useToast();
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState<Colaborador | null>(null);
  const [draft, setDraft] = useState<DraftColaborador>(EMPTY_DRAFT);
  const [savingForm, setSavingForm] = useState(false);
  const [confirmEliminar, setConfirmEliminar] = useState<Colaborador | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/socio/colaboradores?incluir_inactivos=1', {
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.message || 'No se pudieron cargar los colaboradores.');
      }
      setColaboradores((json.colaboradores ?? []) as Colaborador[]);
    } catch (e: any) {
      setError(e?.message || 'No se pudieron cargar los colaboradores.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const activos = useMemo(() => colaboradores.filter((c) => c.activo), [colaboradores]);
  const inactivos = useMemo(() => colaboradores.filter((c) => !c.activo), [colaboradores]);

  const abrirAlta = () => {
    setEditando(null);
    setDraft(EMPTY_DRAFT);
    setMostrarFormulario(true);
  };

  const abrirEdicion = (c: Colaborador) => {
    setEditando(c);
    setDraft({
      nombre: c.nombre || '',
      apellido: c.apellido || '',
      dni: c.dni || '',
      telefono: c.telefono || '',
      especialidad: c.especialidad || '',
      categoria: c.categoria || '',
      observaciones: c.observaciones || '',
    });
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    if (savingForm) return;
    setMostrarFormulario(false);
    setEditando(null);
    setDraft(EMPTY_DRAFT);
  };

  const guardarColaborador = async () => {
    if (!draft.nombre.trim()) {
      toast({
        title: 'Falta el nombre',
        description: 'Ingresá el nombre del colaborador.',
        variant: 'destructive',
      });
      return;
    }
    setSavingForm(true);
    try {
      const payload: Record<string, unknown> = {
        nombre: draft.nombre.trim(),
        apellido: draft.apellido.trim() || null,
        dni: draft.dni.trim() || null,
        telefono: draft.telefono.trim() || null,
        especialidad: draft.especialidad.trim() || null,
        categoria: draft.categoria.trim() || null,
        observaciones: draft.observaciones.trim() || null,
      };
      const url = editando ? `/api/socio/colaboradores/${editando.id}` : '/api/socio/colaboradores';
      const method = editando ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.message || 'No se pudo guardar el colaborador.');
      }
      toast({
        title: editando ? 'Colaborador actualizado' : 'Colaborador agregado',
        description: `${payload.nombre as string} se ${editando ? 'actualizó' : 'sumó'} a tu cuadrilla.`,
      });
      await cargar();
      cerrarFormulario();
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e?.message || 'No se pudo guardar el colaborador.',
        variant: 'destructive',
      });
    } finally {
      setSavingForm(false);
    }
  };

  const cambiarActivo = async (c: Colaborador, activo: boolean) => {
    setBusy(c.id);
    try {
      const res = await fetch(`/api/socio/colaboradores/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ activo }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.message || 'No se pudo actualizar el estado.');
      }
      setColaboradores((prev) => prev.map((x) => (x.id === c.id ? { ...x, activo } : x)));
      toast({
        title: activo ? 'Colaborador reactivado' : 'Colaborador desactivado',
        description: `${c.nombre}${c.apellido ? ' ' + c.apellido : ''}`,
      });
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e?.message || 'No se pudo actualizar el estado.',
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
    }
  };

  const eliminarColaborador = async () => {
    if (!confirmEliminar) return;
    const target = confirmEliminar;
    setBusy(target.id);
    try {
      const res = await fetch(`/api/socio/colaboradores/${target.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        throw new Error(json?.message || 'No se pudo eliminar el colaborador.');
      }
      setColaboradores((prev) => prev.filter((x) => x.id !== target.id));
      toast({ title: 'Colaborador eliminado' });
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e?.message || 'No se pudo eliminar el colaborador.',
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
      setConfirmEliminar(null);
    }
  };

  const renderTarjeta = (c: Colaborador) => (
    <div
      key={c.id}
      className={`rounded-xl border bg-white p-4 transition ${
        c.activo ? 'border-gray-200' : 'border-amber-200 bg-amber-50/40'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          {c.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.foto_url} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
              {(c.nombre?.charAt(0) || 'C').toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
          <h4 className="text-sm font-semibold text-gray-900">
            {c.nombre}
            {c.apellido ? ` ${c.apellido}` : ''}
          </h4>
          <p className="text-xs text-gray-600">{c.especialidad || 'Sin especialidad'}</p>
          {c.categoria ? (
            <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {c.categoria}
            </span>
          ) : null}
          <div className="mt-2 space-y-1 text-xs text-gray-600">
            {c.telefono && (
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3 text-gray-400" />
                <span>{c.telefono}</span>
              </div>
            )}
            {c.dni && (
              <p>
                <span className="font-medium text-gray-700">DNI: </span>
                {c.dni}
              </p>
            )}
            {c.observaciones && <p className="italic text-gray-500">{c.observaciones}</p>}
          </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
              c.activo ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {c.activo ? <CheckCircle className="h-3 w-3" /> : <PauseCircle className="h-3 w-3" />}
            {c.activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => abrirEdicion(c)}
          className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          <Edit className="h-3.5 w-3.5" />
          Editar
        </button>
        <button
          type="button"
          onClick={() => cambiarActivo(c, !c.activo)}
          disabled={busy === c.id}
          className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
            c.activo
              ? 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
              : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          } disabled:opacity-50`}
        >
          {c.activo ? <PauseCircle className="h-3.5 w-3.5" /> : <PlayCircle className="h-3.5 w-3.5" />}
          {c.activo ? 'Desactivar' : 'Reactivar'}
        </button>
        <button
          type="button"
          onClick={() => setConfirmEliminar(c)}
          disabled={busy === c.id}
          className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Eliminar
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Colaboradores</h3>
          <p className="text-xs text-gray-500">
            Cargá a los integrantes de tu equipo para tenerlos a mano en obra.
          </p>
        </div>
        <button
          type="button"
          onClick={abrirAlta}
          className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-blue-600 transition hover:bg-blue-100 hover:shadow-sm"
        >
          <UserPlus className="h-4 w-4" />
          <span className="text-xs font-medium">Agregar</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-white p-8">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span className="ml-2 text-sm text-gray-600">Cargando colaboradores…</span>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        </div>
      ) : colaboradores.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center">
          <UserPlus className="mx-auto mb-3 h-10 w-10 text-gray-400" />
          <p className="text-sm font-medium text-gray-700">Todavía no cargaste colaboradores</p>
          <p className="text-xs text-gray-500">Sumá a tu equipo para gestionar mejor tus obras.</p>
          <button
            type="button"
            onClick={abrirAlta}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Agregar el primer colaborador
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {activos.map(renderTarjeta)}
          {inactivos.length > 0 && (
            <details className="rounded-xl border border-gray-200 bg-white p-3">
              <summary className="cursor-pointer text-xs font-semibold text-gray-600">
                Inactivos ({inactivos.length})
              </summary>
              <div className="mt-3 space-y-3">{inactivos.map(renderTarjeta)}</div>
            </details>
          )}
        </div>
      )}

      {/* Modal alta/edición */}
      <Dialog open={mostrarFormulario} onOpenChange={(o) => (!o ? cerrarFormulario() : undefined)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar colaborador' : 'Agregar colaborador'}</DialogTitle>
            <DialogDescription>
              Cargá los datos del integrante de tu equipo. Podrás editar o eliminar después.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="col-nombre">Nombre*</Label>
                <Input
                  id="col-nombre"
                  value={draft.nombre}
                  maxLength={120}
                  onChange={(e) => setDraft((d) => ({ ...d, nombre: e.target.value }))}
                  placeholder="Ej: Juan"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="col-apellido">Apellido</Label>
                <Input
                  id="col-apellido"
                  value={draft.apellido}
                  maxLength={120}
                  onChange={(e) => setDraft((d) => ({ ...d, apellido: e.target.value }))}
                  placeholder="Ej: Pérez"
                />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="col-dni">DNI</Label>
                <Input
                  id="col-dni"
                  value={draft.dni}
                  maxLength={30}
                  onChange={(e) => setDraft((d) => ({ ...d, dni: e.target.value }))}
                  placeholder="Ej: 30.123.456"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="col-telefono">Teléfono</Label>
                <Input
                  id="col-telefono"
                  value={draft.telefono}
                  maxLength={40}
                  type="tel"
                  onChange={(e) => setDraft((d) => ({ ...d, telefono: e.target.value }))}
                  placeholder="+54 9 11 0000-0000"
                />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="col-especialidad">Especialidad</Label>
              <Input
                id="col-especialidad"
                value={draft.especialidad}
                maxLength={120}
                onChange={(e) => setDraft((d) => ({ ...d, especialidad: e.target.value }))}
                placeholder="Ej: Albañil"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="col-categoria">Categoría</Label>
              <Input
                id="col-categoria"
                value={draft.categoria}
                maxLength={80}
                onChange={(e) => setDraft((d) => ({ ...d, categoria: e.target.value }))}
                placeholder="Ej: Oficial, Ayudante, Electricista"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="col-obs">Observaciones</Label>
              <textarea
                id="col-obs"
                value={draft.observaciones}
                maxLength={500}
                onChange={(e) => setDraft((d) => ({ ...d, observaciones: e.target.value }))}
                placeholder="Notas internas, horarios, comentarios…"
                rows={3}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={cerrarFormulario} disabled={savingForm}>
              Cancelar
            </Button>
            <Button onClick={guardarColaborador} disabled={savingForm} className="gap-2">
              {savingForm ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editando ? 'Guardar cambios' : 'Agregar colaborador'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmar eliminación */}
      <Dialog
        open={Boolean(confirmEliminar)}
        onOpenChange={(o) => (!o ? setConfirmEliminar(null) : undefined)}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" /> Eliminar colaborador
            </DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer.
              {confirmEliminar
                ? ` Vas a eliminar a "${confirmEliminar.nombre}${confirmEliminar.apellido ? ' ' + confirmEliminar.apellido : ''}".`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmEliminar(null)}>
              <X className="mr-1 h-4 w-4" /> Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={eliminarColaborador}
              disabled={busy === confirmEliminar?.id}
              className="gap-2"
            >
              {busy === confirmEliminar?.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

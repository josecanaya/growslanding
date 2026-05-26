'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  CreditCard,
  Edit,
  Loader2,
  Plus,
  Star,
  Trash2,
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

export interface MetodoRetiro {
  id: string;
  titular: string;
  banco: string | null;
  cvu: string | null;
  cbu: string | null;
  alias: string | null;
  tipo?: string | null;
  mercado_pago_cvu?: string | null;
  mercado_pago_alias?: string | null;
  es_principal: boolean;
  activo: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

interface Draft {
  titular: string;
  banco: string;
  tipo: string;
  cvu: string;
  cbu: string;
  alias: string;
  mercado_pago_cvu: string;
  mercado_pago_alias: string;
  es_principal: boolean;
}

const EMPTY_DRAFT: Draft = {
  titular: '',
  banco: '',
  tipo: 'transferencia',
  cvu: '',
  cbu: '',
  alias: '',
  mercado_pago_cvu: '',
  mercado_pago_alias: '',
  es_principal: false,
};

const ALIAS_RE = /^[a-zA-Z0-9._-]{6,40}$/;
const NUM22_RE = /^[0-9]{22}$/;

function validarDraft(draft: Draft): string | null {
  if (!draft.titular.trim()) return 'El titular es obligatorio.';
  const cvu = draft.cvu.trim();
  const cbu = draft.cbu.trim();
  const alias = draft.alias.trim();
  const mpCvu = draft.mercado_pago_cvu.trim();
  const mpAlias = draft.mercado_pago_alias.trim();
  if (draft.tipo === 'mercado_pago') {
    if (!mpCvu && !mpAlias && !alias && !cvu) return 'Para Mercado Pago cargá CVU o alias.';
  } else if (!cvu && !cbu && !alias && !mpCvu && !mpAlias) {
    return 'Cargá al menos un CVU, CBU, Alias o datos de Mercado Pago.';
  }
  if (cvu && !NUM22_RE.test(cvu)) return 'El CVU debe tener 22 dígitos.';
  if (cbu && !NUM22_RE.test(cbu)) return 'El CBU debe tener 22 dígitos.';
  if (mpCvu && !NUM22_RE.test(mpCvu)) return 'El CVU de Mercado Pago debe tener 22 dígitos.';
  if (alias && !ALIAS_RE.test(alias))
    return 'El alias debe tener entre 6 y 40 caracteres (letras, números, punto o guion).';
  return null;
}

function labelTipo(tipo?: string | null) {
  switch (tipo) {
    case 'mercado_pago':
      return 'Mercado Pago';
    case 'cvu':
      return 'CVU';
    case 'cbu':
      return 'CBU';
    case 'alias':
      return 'Alias';
    default:
      return 'Transferencia';
  }
}

export function MetodosRetiroSection() {
  const { toast } = useToast();
  const [metodos, setMetodos] = useState<MetodoRetiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<MetodoRetiro | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [confirmEliminar, setConfirmEliminar] = useState<MetodoRetiro | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/socio/metodos-retiro', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.message || 'No se pudieron cargar los métodos de retiro.');
      }
      setMetodos((json.metodos ?? []) as MetodoRetiro[]);
    } catch (e: any) {
      setError(e?.message || 'No se pudieron cargar los métodos de retiro.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const abrirAlta = () => {
    setEditando(null);
    setDraft(EMPTY_DRAFT);
    setFormOpen(true);
  };

  const abrirEdicion = (m: MetodoRetiro) => {
    setEditando(m);
    setDraft({
      titular: m.titular || '',
      banco: m.banco || '',
      tipo: m.tipo || 'transferencia',
      cvu: m.cvu || '',
      cbu: m.cbu || '',
      alias: m.alias || '',
      mercado_pago_cvu: m.mercado_pago_cvu || '',
      mercado_pago_alias: m.mercado_pago_alias || '',
      es_principal: m.es_principal,
    });
    setFormOpen(true);
  };

  const cerrarForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditando(null);
    setDraft(EMPTY_DRAFT);
  };

  const guardar = async () => {
    const errMsg = validarDraft(draft);
    if (errMsg) {
      toast({ title: 'Revisá los datos', description: errMsg, variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        titular: draft.titular.trim(),
        banco: draft.banco.trim() || null,
        tipo: draft.tipo,
        cvu: draft.cvu.trim() || null,
        cbu: draft.cbu.trim() || null,
        alias: draft.alias.trim() || null,
        mercado_pago_cvu: draft.mercado_pago_cvu.trim() || null,
        mercado_pago_alias: draft.mercado_pago_alias.trim() || null,
        es_principal: draft.es_principal,
      };
      const url = editando ? `/api/socio/metodos-retiro/${editando.id}` : '/api/socio/metodos-retiro';
      const method = editando ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.message || 'No se pudo guardar el método de retiro.');
      }
      await cargar();
      toast({
        title: editando ? 'Método actualizado' : 'Método agregado',
        description: 'Tus datos quedaron guardados de forma segura.',
      });
      cerrarForm();
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e?.message || 'No se pudo guardar.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const elegirPrincipal = async (m: MetodoRetiro) => {
    if (m.es_principal) return;
    setBusy(m.id);
    try {
      const res = await fetch(`/api/socio/metodos-retiro/${m.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ es_principal: true }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json?.message || 'No se pudo marcar como principal.');
      }
      await cargar();
      toast({ title: 'Método principal actualizado' });
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e?.message || 'No se pudo marcar como principal.',
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
    }
  };

  const eliminar = async () => {
    if (!confirmEliminar) return;
    const target = confirmEliminar;
    setBusy(target.id);
    try {
      const res = await fetch(`/api/socio/metodos-retiro/${target.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        throw new Error(json?.message || 'No se pudo eliminar.');
      }
      setMetodos((prev) => prev.filter((x) => x.id !== target.id));
      toast({ title: 'Método eliminado' });
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e?.message || 'No se pudo eliminar.',
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
      setConfirmEliminar(null);
    }
  };

  return (
    <section className="rounded-2xl border border-stitch-surface-container bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h3 className="font-stitch-headline text-base font-bold text-stitch-on-surface">
            Métodos de retiro
          </h3>
          <p className="text-xs text-stitch-on-surface/60">
            Cargá CVU, CBU o alias para recibir tus pagos.
          </p>
        </div>
        <button
          type="button"
          onClick={abrirAlta}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Agregar
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-stitch-primary" />
          <span className="ml-2 text-sm text-stitch-on-surface/70">Cargando…</span>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : metodos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stitch-outline/40 bg-stitch-surface-container-lowest p-6 text-center">
          <CreditCard className="mx-auto mb-2 h-9 w-9 text-stitch-on-surface/40" />
          <p className="text-sm font-medium text-stitch-on-surface/80">
            Todavía no cargaste métodos de retiro
          </p>
          <p className="text-xs text-stitch-on-surface/60">
            Agregá CVU/CBU/alias para que podamos transferirte tus ganancias.
          </p>
          <button
            type="button"
            onClick={abrirAlta}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Agregar método
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {metodos.map((m) => (
            <li
              key={m.id}
              className={`rounded-xl border p-3 transition ${
                m.es_principal
                  ? 'border-emerald-300 bg-emerald-50/50'
                  : 'border-stitch-surface-container bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-stitch-on-surface">{m.titular}</p>
                    <span className="rounded-full bg-stitch-surface-container px-2 py-0.5 text-[10px] font-bold text-stitch-on-surface/70">
                      {labelTipo(m.tipo)}
                    </span>
                    {m.es_principal && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        <Star className="h-3 w-3" /> Principal
                      </span>
                    )}
                  </div>
                  <div className="mt-1 space-y-0.5 text-xs text-stitch-on-surface/70">
                    {m.banco && (
                      <p>
                        <span className="font-medium text-stitch-on-surface">Banco: </span>
                        {m.banco}
                      </p>
                    )}
                    {m.mercado_pago_alias && (
                      <p>
                        <span className="font-medium text-stitch-on-surface">MP Alias: </span>
                        {m.mercado_pago_alias}
                      </p>
                    )}
                    {m.mercado_pago_cvu && (
                      <p>
                        <span className="font-medium text-stitch-on-surface">MP CVU: </span>
                        {m.mercado_pago_cvu}
                      </p>
                    )}
                    {m.alias && (
                      <p>
                        <span className="font-medium text-stitch-on-surface">Alias: </span>
                        {m.alias}
                      </p>
                    )}
                    {m.cvu && (
                      <p>
                        <span className="font-medium text-stitch-on-surface">CVU: </span>
                        {m.cvu}
                      </p>
                    )}
                    {m.cbu && (
                      <p>
                        <span className="font-medium text-stitch-on-surface">CBU: </span>
                        {m.cbu}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {!m.es_principal && (
                  <button
                    type="button"
                    onClick={() => elegirPrincipal(m)}
                    disabled={busy === m.id}
                    className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Usar como principal
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => abrirEdicion(m)}
                  className="inline-flex items-center gap-1 rounded-md border border-stitch-outline/30 bg-white px-3 py-1.5 text-xs font-medium text-stitch-on-surface hover:bg-stitch-surface-container-lowest"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmEliminar(m)}
                  disabled={busy === m.id}
                  className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Form modal */}
      <Dialog open={formOpen} onOpenChange={(o) => (!o ? cerrarForm() : undefined)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {editando ? 'Editar método de retiro' : 'Nuevo método de retiro'}
            </DialogTitle>
            <DialogDescription>
              Tus datos se guardan de forma segura para futuros retiros.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label htmlFor="m-tipo">Tipo de método</Label>
              <select
                id="m-tipo"
                value={draft.tipo}
                onChange={(e) => setDraft((d) => ({ ...d, tipo: e.target.value }))}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="transferencia">Transferencia bancaria</option>
                <option value="mercado_pago">Mercado Pago</option>
                <option value="cvu">CVU</option>
                <option value="cbu">CBU</option>
                <option value="alias">Alias</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="m-titular">Titular*</Label>
              <Input
                id="m-titular"
                value={draft.titular}
                maxLength={200}
                onChange={(e) => setDraft((d) => ({ ...d, titular: e.target.value }))}
                placeholder="Ej: Juan Pérez"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="m-banco">Banco</Label>
              <Input
                id="m-banco"
                value={draft.banco}
                maxLength={120}
                onChange={(e) => setDraft((d) => ({ ...d, banco: e.target.value }))}
                placeholder="Ej: Banco Galicia"
              />
            </div>
            {draft.tipo === 'mercado_pago' ? (
              <>
                <div className="grid gap-1.5">
                  <Label htmlFor="m-mp-cvu">CVU Mercado Pago (22 dígitos)</Label>
                  <Input
                    id="m-mp-cvu"
                    value={draft.mercado_pago_cvu}
                    maxLength={22}
                    inputMode="numeric"
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        mercado_pago_cvu: e.target.value.replace(/[^0-9]/g, ''),
                      }))
                    }
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="m-mp-alias">Alias Mercado Pago</Label>
                  <Input
                    id="m-mp-alias"
                    value={draft.mercado_pago_alias}
                    maxLength={40}
                    onChange={(e) => setDraft((d) => ({ ...d, mercado_pago_alias: e.target.value }))}
                  />
                </div>
              </>
            ) : null}
            <div className="grid gap-1.5">
              <Label htmlFor="m-cvu">CVU (22 dígitos)</Label>
              <Input
                id="m-cvu"
                value={draft.cvu}
                maxLength={22}
                inputMode="numeric"
                pattern="\d{22}"
                onChange={(e) =>
                  setDraft((d) => ({ ...d, cvu: e.target.value.replace(/[^0-9]/g, '') }))
                }
                placeholder="0000003100000000000000"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="m-cbu">CBU (22 dígitos)</Label>
              <Input
                id="m-cbu"
                value={draft.cbu}
                maxLength={22}
                inputMode="numeric"
                pattern="\d{22}"
                onChange={(e) =>
                  setDraft((d) => ({ ...d, cbu: e.target.value.replace(/[^0-9]/g, '') }))
                }
                placeholder="0000003100000000000000"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="m-alias">Alias</Label>
              <Input
                id="m-alias"
                value={draft.alias}
                maxLength={40}
                onChange={(e) => setDraft((d) => ({ ...d, alias: e.target.value }))}
                placeholder="juan.perez.grows"
              />
              <p className="text-[11px] text-stitch-on-surface/60">
                6 a 40 caracteres. Letras, números, punto o guion.
              </p>
            </div>
            <label className="mt-2 flex items-center gap-2 text-sm text-stitch-on-surface">
              <input
                type="checkbox"
                checked={draft.es_principal}
                onChange={(e) => setDraft((d) => ({ ...d, es_principal: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600"
              />
              Usar como método principal
            </label>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={cerrarForm} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={guardar} disabled={saving} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editando ? 'Guardar cambios' : 'Agregar método'}
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
              <AlertTriangle className="h-5 w-5" /> Eliminar método de retiro
            </DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer.
              {confirmEliminar ? ` Vas a eliminar el método de "${confirmEliminar.titular}".` : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmEliminar(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={eliminar}
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
    </section>
  );
}

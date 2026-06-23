'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { Building2, Layers } from 'lucide-react';

import { Button } from '@/components/ui/grows';
import { cn } from '@/lib/utils';
import type { CanvasBudgetGroup, CanvasNode } from '@/lib/types/canvasMultinivel';
import { budgetGroupStatusLabel, changeWindowStatusLabel } from './canvasMultinivelHelpers';
import { buildBudgetGroupHierarchyBranches } from '@/lib/canvas/budgetGroupHierarchy';
import { BudgetGroupTaskTree } from './BudgetGroupTaskTree';

type AgendaRow = {
  socio_id: string;
  socio: { nombre?: string | null; email?: string | null } | null;
};

type Props = {
  obraId: string;
  obraNombre: string;
  budgetGroups: CanvasBudgetGroup[];
  nodes: CanvasNode[];
  tareaPublicacionByNodeId: Record<
    string,
    { tareaId: string; estado: string; publishedAt: string | null }
  >;
  patchBudgetGroup: (groupId: string, patch: Partial<CanvasBudgetGroup>) => void;
  createBudgetGroup: (name: string) => string;
  saveCanvasSnapshotToCloud: () => Promise<unknown>;
  onOpenCanvasTab: () => void;
};

export function CanvasPresupuestosTab({
  obraId,
  obraNombre,
  budgetGroups,
  nodes,
  tareaPublicacionByNodeId,
  patchBudgetGroup,
  createBudgetGroup,
  saveCanvasSnapshotToCloud,
  onOpenCanvasTab,
}: Props) {
  const router = useRouter();
  const [agenda, setAgenda] = useState<AgendaRow[]>([]);
  const [agendaLoaded, setAgendaLoaded] = useState(false);
  const [detailGroupId, setDetailGroupId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/cliente/socios/agenda', { credentials: 'include' });
        const j = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && j.success && Array.isArray(j.data)) {
          setAgenda(j.data as AgendaRow[]);
        }
      } finally {
        if (!cancelled) setAgendaLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const tasksByGroup = useMemo(() => {
    const m = new Map<string, CanvasNode[]>();
    for (const n of nodes) {
      if (n.type !== 'tarea' || !n.budgetGroupId) continue;
      const arr = m.get(n.budgetGroupId) ?? [];
      arr.push(n);
      m.set(n.budgetGroupId, arr);
    }
    return m;
  }, [nodes]);

  const socioLabel = useCallback(
    (id: string | null | undefined) => {
      if (!id) return null;
      const row = agenda.find((a) => a.socio_id === id);
      const s = row?.socio;
      return s?.nombre?.trim() || s?.email?.trim() || 'Socio';
    },
    [agenda],
  );

  const detailGroup = detailGroupId ? budgetGroups.find((g) => g.id === detailGroupId) ?? null : null;
  const detailTasks = detailGroupId ? tasksByGroup.get(detailGroupId) ?? [] : [];
  const detailHierarchy = useMemo(
    () => buildBudgetGroupHierarchyBranches(nodes, detailTasks),
    [nodes, detailTasks],
  );

  const [detailName, setDetailName] = useState('');
  const [detailSocioIds, setDetailSocioIds] = useState<Set<string>>(new Set());
  const [detailMensaje, setDetailMensaje] = useState('');
  const [saveBusy, setSaveBusy] = useState(false);
  const [changeNotes, setChangeNotes] = useState('');
  const [changeBusy, setChangeBusy] = useState(false);
  const [sendBusy, setSendBusy] = useState(false);
  const [sendNotice, setSendNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!detailGroup) return;
    setDetailName(detailGroup.name);
    const pre = detailGroup.scheduledSocioId?.trim();
    setDetailSocioIds(pre ? new Set([pre]) : new Set());
    setDetailMensaje(detailGroup.mensajeSocioBorrador ?? '');
    setSendNotice(null);
  }, [detailGroup]);

  const setEnviarResumen = (
    j: {
      presupuestosAprobados?: number;
      presupuestosYaAprobados?: number;
      presupuestosFallidos?: number;
      partial?: boolean;
      pendingPublish?: Array<{ canvasNodeId: string; title: string | null; motivo: string }>;
    },
    warnings: string[],
  ) => {
    const nuevos = Number(j.presupuestosAprobados) || 0;
    const ya = Number(j.presupuestosYaAprobados) || 0;
    const fall = Number(j.presupuestosFallidos) || 0;
    const pend = Array.isArray(j.pendingPublish) ? j.pendingPublish.length : 0;
    let msg = `Solicitud enviada. ${nuevos} solicitud${nuevos === 1 ? '' : 'es'} nueva${nuevos === 1 ? '' : 's'} de presupuesto.`;
    if (ya > 0) msg += ` ${ya} ya existían para ese socio.`;
    if (fall > 0) msg += ` ${fall} con error.`;
    if (j.partial && pend > 0) {
      msg += ` Hay ${pend} tarea${pend === 1 ? '' : 's'} sin publicar; cuando las publiques, volvé a enviar para incluirlas.`;
    }
    msg += ' Los socios recibirán el paquete para presupuestar (sin asignación automática).';
    if (warnings.length > 0) {
      msg += ` · ${warnings.slice(0, 3).join(' ')}`;
    }
    setSendNotice(msg);
  };

  const detailStatus = String(detailGroup?.status ?? '').toLowerCase();
  const detailChangeWindow = String(detailGroup?.changeWindowStatus ?? 'cerrada').toLowerCase();
  const paqueteAprobado = detailStatus === 'aprobado' || detailStatus === 'aprobado_parcial';
  const puedeReenviarTrasCambio = detailChangeWindow === 'confirmada_socio';
  const puedeEnviarPaquete = !paqueteAprobado || puedeReenviarTrasCambio;

  const onSolicitarCambio = async () => {
    if (!detailGroup) return;
    if (!changeNotes.trim()) {
      setSendNotice('Describí qué querés cambiar del paquete aprobado.');
      return;
    }
    setChangeBusy(true);
    setSendNotice(null);
    try {
      const res = await fetch(
        `/api/obras/${encodeURIComponent(obraId)}/canvas/presupuestos/abrir-cambio-grupo`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            budgetGroupId: detailGroup.id,
            changeNotes: changeNotes.trim(),
          }),
        },
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) {
        setSendNotice(typeof j.error === 'string' ? j.error : 'No se pudo abrir la ventana de cambio.');
        return;
      }
      patchBudgetGroup(detailGroup.id, {
        changeWindowStatus: 'abierta_cliente',
        changeWindowNotes: changeNotes.trim(),
      });
      setSendNotice(
        'Ventana de cambio abierta. El socio debe confirmar antes de que puedas re-enviar el paquete modificado.',
      );
    } finally {
      setChangeBusy(false);
    }
  };

  const onGuardarGrupo = async () => {
    if (!detailGroup) return;
    setSaveBusy(true);
    setSendNotice(null);
    try {
      const res = await fetch(
        `/api/obras/${encodeURIComponent(obraId)}/canvas/grupos-presupuesto/${encodeURIComponent(detailGroup.id)}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: detailName,
            scheduledSocioId:
              detailSocioIds.size === 1 ? Array.from(detailSocioIds)[0]! : null,
            mensajeSocioBorrador: detailMensaje || null,
          }),
        },
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) {
        setSendNotice(typeof j.error === 'string' ? j.error : 'No se pudo guardar el grupo.');
        return;
      }
      patchBudgetGroup(detailGroup.id, {
        name: detailName.trim() || detailGroup.name,
        scheduledSocioId:
          detailSocioIds.size === 1 ? Array.from(detailSocioIds)[0]! : null,
        mensajeSocioBorrador: detailMensaje || null,
      });
      setSendNotice('Cambios del grupo guardados.');
    } finally {
      setSaveBusy(false);
    }
  };

  const onEnviarSolicitud = async () => {
    if (!detailGroup) return;
    if (detailTasks.length === 0) {
      setSendNotice('El grupo no tiene tareas incluidas.');
      return;
    }
    if (detailSocioIds.size === 0) {
      setSendNotice('Elegí al menos un socio de tu agenda.');
      return;
    }
    const unpublished = detailTasks.filter((t) => !tareaPublicacionByNodeId[t.id]);
    const published = detailTasks.length - unpublished.length;
    let confirmMsg =
      `¿Enviar el paquete a ${detailSocioIds.size} socio${detailSocioIds.size === 1 ? '' : 's'} para que presupuesten? No se asignarán las tareas hasta que apruebes una oferta.`;
    if (unpublished.length > 0 && published > 0) {
      confirmMsg = `Hay ${unpublished.length} tarea${unpublished.length === 1 ? '' : 's'} que todavía no están publicadas.\n\n¿Enviar ahora las ${published} listas y dejar las ${unpublished.length} restantes pendientes en este mismo grupo? Cuando las publiques, vas a poder sumarlas al paquete.`;
    } else if (unpublished.length > 0 && published === 0) {
      const okAll = window.confirm(
        'Ninguna tarea de este grupo está publicada todavía. ¿Ir a guardar y publicar tareas en el canvas?',
      );
      if (okAll) void saveCanvasSnapshotToCloud();
      return;
    }
    const ok = window.confirm(confirmMsg);
    if (!ok) return;

    setSendBusy(true);
    setSendNotice(null);
    try {
      const res = await fetch(
        `/api/obras/${encodeURIComponent(obraId)}/canvas/presupuestos/enviar-grupo`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            budgetGroupId: detailGroup.id,
            socioIds: Array.from(detailSocioIds),
            message: detailMensaje,
          }),
        },
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) {
        const pend = Array.isArray(j.pendingPublish) ? j.pendingPublish : [];
        if (pend.length > 0) {
          const lines = pend
            .slice(0, 8)
            .map(
              (p: { title?: string | null; motivo?: string }) =>
                `• ${p.title?.trim() || 'Tarea'}: ${p.motivo ?? 'Pendiente'}`,
            )
            .join('\n');
          setSendNotice(
            `${typeof j.error === 'string' ? j.error : 'No se pudo enviar.'}\n\n${lines}${pend.length > 8 ? `\n… y ${pend.length - 8} más` : ''}`,
          );
        } else {
          setSendNotice(typeof j.error === 'string' ? j.error : 'No se pudo enviar la solicitud.');
        }
        return;
      }
      if ((Number(j.presupuestosAprobados) || 0) + (Number(j.presupuestosYaAprobados) || 0) > 0) {
        const st =
          typeof j.groupStatus === 'string' && j.groupStatus
            ? j.groupStatus
            : j.partial
              ? 'enviado_parcial'
              : 'enviado';
        patchBudgetGroup(detailGroup.id, {
          status: st,
          scheduledSocioId:
            detailSocioIds.size === 1 ? Array.from(detailSocioIds)[0]! : detailGroup.scheduledSocioId,
          changeWindowStatus: 'cerrada',
          changeWindowNotes: null,
        });
      }
      const w = Array.isArray(j.warnings) ? j.warnings : [];
      setEnviarResumen(j, w);
    } finally {
      setSendBusy(false);
    }
  };

  if (budgetGroups.length === 0) {
    return (
      <div className="flex min-h-[min(68vh,560px)] flex-col items-center justify-center rounded-2xl border border-dashed border-[#bcc3d9] bg-white/80 px-6 py-14 text-center">
        <Layers className="mb-4 h-12 w-12 text-[#596574]" aria-hidden />
        <p className="text-lg font-extrabold text-[#0f1e1f]">No hay grupos de presupuesto todavía.</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#596574]">
          Desde el canvas podés seleccionar tareas y agruparlas para pedir presupuesto.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button type="button" variant="secondary" onClick={onOpenCanvasTab}>
            Volver al canvas
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              const id = createBudgetGroup('Grupo de presupuesto');
              patchBudgetGroup(id, { status: 'borrador' });
              void saveCanvasSnapshotToCloud();
              onOpenCanvasTab();
            }}
          >
            Crear grupo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col gap-6">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8a94a5]">
          Grupos de presupuesto
        </p>
        <h2 className="mt-1 text-xl font-black text-[#001629]">Presupuestos · {obraNombre}</h2>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {budgetGroups.map((g) => {
          const tasks = tasksByGroup.get(g.id) ?? [];
          const published = tasks.filter((t) => tareaPublicacionByNodeId[t.id]).length;
          return (
            <div
              key={g.id}
              className="relative flex flex-col overflow-hidden rounded-[22px] border border-[#d9dce8] bg-white px-5 py-5 shadow-[0_10px_36px_-12px_rgba(15,30,31,0.18)] ring-1 ring-black/[0.03]"
            >
              <div className="absolute left-0 right-0 top-0 h-[3px] bg-gradient-to-r from-[#0042c8] to-[#5b8edc]" />
              <div className="mb-3 flex items-start justify-between gap-2 pt-1">
                <Building2 className="h-5 w-5 shrink-0 text-[#0042c8]" aria-hidden />
                <span className="rounded-full bg-[#f0f4f8] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#475569]">
                  {budgetGroupStatusLabel(g.status)}
                </span>
              </div>
              <p className="text-[17px] font-extrabold leading-snug text-[#0f1e1f]">{g.name}</p>
              <ul className="mt-4 space-y-2 text-[12px] text-[#596574]">
                <li>
                  <strong className="text-[#001629]">Tareas incluidas:</strong> {tasks.length}
                </li>
                <li>
                  <strong className="text-[#001629]">Publicadas:</strong> {published} / {tasks.length || 0}
                </li>
                <li>
                  <strong className="text-[#001629]">Socio agendado:</strong>{' '}
                  {socioLabel(g.scheduledSocioId) ?? '—'}
                </li>
                <li>
                  <strong className="text-[#001629]">Total estimado:</strong> Sin monto
                </li>
              </ul>
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="mt-5 w-full rounded-xl"
                onClick={() => setDetailGroupId(g.id)}
              >
                Abrir grupo
              </Button>
            </div>
          );
        })}
      </div>

      {detailGroup ? (
        <div
          className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/35 p-0 sm:p-4"
          role="dialog"
          aria-modal
          aria-label="Grupo de presupuesto"
        >
          <div className="flex h-full w-full max-w-xl flex-col border-l border-[#e2e8f0] bg-white shadow-2xl sm:rounded-l-2xl">
            <div className="flex items-center justify-between border-b border-[#eef2f6] px-5 py-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8a94a5]">
                Grupo de presupuesto
              </p>
              <button
                type="button"
                className="text-sm font-semibold text-[#64748b] hover:text-[#0f172a]"
                onClick={() => setDetailGroupId(null)}
              >
                Cerrar
              </button>
            </div>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
              <div>
                <label className="text-[10px] font-bold uppercase text-[#7b8494]">Nombre del grupo</label>
                <input
                  className="mt-1.5 w-full rounded-xl border border-[#c3c7ce]/40 px-3 py-2 text-sm font-semibold text-[#001629] outline-none focus:border-[#24a375] focus:ring-2 focus:ring-[#24a375]/15"
                  value={detailName}
                  onChange={(e) => setDetailName(e.target.value)}
                />
                <p className="mt-2 text-[11px] text-[#64748b]">
                  Estado: <strong>{budgetGroupStatusLabel(detailGroup.status)}</strong> · Tareas:{' '}
                  {detailTasks.length}
                  {changeWindowStatusLabel(detailGroup.changeWindowStatus) ? (
                    <>
                      {' '}
                      · Cambios:{' '}
                      <strong>{changeWindowStatusLabel(detailGroup.changeWindowStatus)}</strong>
                    </>
                  ) : null}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#001629]">
                  Paquete · misma jerarquía que el canvas
                </p>
                <p className="mt-1 text-[11px] text-[#64748b]">
                  Fase, piso, departamento y ambiente como en el lienzo; las tareas van debajo de cada rama.
                </p>
                <div className="mt-3 max-h-[min(48vh,420px)] overflow-y-auto rounded-xl border border-[#eef2f6] bg-white p-3">
                  <BudgetGroupTaskTree
                    branches={detailHierarchy}
                    tareaPublicacionByNodeId={tareaPublicacionByNodeId}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#7b8494]">
                  Contratistas agendados ({detailSocioIds.size} seleccionados)
                </label>
                {!agendaLoaded ? (
                  <p className="mt-2 text-sm text-[#64748b]">Cargando agenda…</p>
                ) : agenda.length === 0 ? (
                  <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
                    <p className="font-semibold">Todavía no tenés socios en tu agenda.</p>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="mt-3 rounded-lg"
                      onClick={() => router.push('/cliente/agenda-socios' as Route)}
                    >
                      Agendar socio
                    </Button>
                  </div>
                ) : (
                  <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-xl border border-[#eef2f6] p-3">
                    {agenda.map((a) => {
                      const checked = detailSocioIds.has(a.socio_id);
                      return (
                        <label
                          key={a.socio_id}
                          className="flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-2 py-1.5 hover:bg-[#f8fafc]"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-[#c3c7ce]"
                            checked={checked}
                            onChange={() => {
                              setDetailSocioIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(a.socio_id)) next.delete(a.socio_id);
                                else next.add(a.socio_id);
                                return next;
                              });
                            }}
                          />
                          <span className="text-sm font-medium text-[#001629]">
                            {socioLabel(a.socio_id) ?? a.socio_id}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-[#7b8494]">Mensaje para el socio</label>
                <textarea
                  className="mt-1.5 min-h-[88px] w-full rounded-xl border border-[#c3c7ce]/40 px-3 py-2 text-sm text-[#001629] outline-none focus:border-[#24a375]"
                  placeholder="Hola, necesito que me presupuestes estas tareas…"
                  value={detailMensaje}
                  onChange={(e) => setDetailMensaje(e.target.value)}
                />
              </div>

              {sendNotice ? (
                <p
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm whitespace-pre-line',
                    /publicad|publicar|Ninguna tarea|no están publicadas/i.test(sendNotice)
                      ? 'border border-amber-200 bg-amber-50 text-amber-950'
                      : 'border border-[#e2e8f0] bg-[#f8fafc] text-[#334155]',
                  )}
                >
                  {sendNotice}
                </p>
              ) : null}

              {sendNotice && /publicad|publicar|Ninguna tarea/i.test(sendNotice) ? (
                <Button
                  type="button"
                  variant="primary"
                  className="w-full rounded-xl"
                  onClick={() => void saveCanvasSnapshotToCloud()}
                >
                  Guardar y publicar tareas
                </Button>
              ) : null}

              {paqueteAprobado ? (
                <div className="rounded-xl border border-[#dbeafe] bg-[#eff6ff] px-3 py-3 text-sm text-[#1e3a5f]">
                  <p className="font-semibold">Paquete aprobado</p>
                  <p className="mt-1 text-[12px]">
                    El socio ya puede operar estas tareas. Para modificar el paquete, abrí una ventana de
                    cambio (doble verificación: vos solicitás → el socio confirma → re-enviás).
                  </p>
                  {detailChangeWindow === 'abierta_cliente' ? (
                    <p className="mt-2 text-[12px] font-medium text-amber-800">
                      Esperando confirmación del socio…
                    </p>
                  ) : puedeReenviarTrasCambio ? (
                    <p className="mt-2 text-[12px] font-medium text-emerald-800">
                      El socio confirmó el cambio. Podés editar tareas y re-enviar el paquete.
                    </p>
                  ) : (
                    <>
                      <textarea
                        className="mt-3 min-h-[72px] w-full rounded-lg border border-[#bfdbfe] bg-white px-3 py-2 text-sm outline-none focus:border-[#0042c8]"
                        placeholder="Ej.: agregar una tarea, cambiar duración del bloque 2…"
                        value={changeNotes}
                        onChange={(e) => setChangeNotes(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="mt-2 w-full rounded-lg"
                        disabled={changeBusy}
                        onClick={() => void onSolicitarCambio()}
                      >
                        {changeBusy ? 'Abriendo…' : 'Solicitar cambio al paquete'}
                      </Button>
                    </>
                  )}
                </div>
              ) : null}

              <div className="flex flex-col gap-2 border-t border-[#eef2f6] pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full rounded-xl"
                  disabled={saveBusy}
                  onClick={() => void onGuardarGrupo()}
                >
                  {saveBusy ? 'Guardando…' : 'Guardar grupo'}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  className="w-full rounded-xl"
                  disabled={sendBusy || detailTasks.length === 0 || !puedeEnviarPaquete}
                  onClick={() => void onEnviarSolicitud()}
                >
                  {sendBusy
                    ? 'Enviando solicitudes…'
                    : paqueteAprobado && puedeReenviarTrasCambio
                      ? 'Re-enviar solicitud de presupuesto'
                      : 'Enviar paquete para presupuestar'}
                </Button>
                {paqueteAprobado && !puedeEnviarPaquete ? (
                  <p className="text-center text-[11px] text-[#64748b]">
                    Para re-enviar, primero solicitá el cambio y esperá la confirmación del socio.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

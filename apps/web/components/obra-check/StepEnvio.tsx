'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Send, Share2, FileText, Copy, CheckCircle2, Package, ExternalLink, Inbox } from 'lucide-react';
import { obraCheckApi } from '@/lib/obra-check/client';
import { canUseWebShareText, shareOrOpenWhatsApp } from '@/lib/obra-check/share';
import type {
  ObraCheckBlock,
  ObraCheckBudgetGroup,
  ObraCheckContact,
  ObraCheckTask,
} from '@/lib/obra-check/types';
import { budgetDisplaySections } from './budget-groups/buildDefaultHierarchy';
import { BRAND, OCButton, OCCard, inputStyle } from './ui';
import type { Assignments } from './StepAsignar';
import { ObraDatosPedidoPanel } from './ObraDatosPedidoPanel';

type Tipo = 'orden_trabajo' | 'pedido_presupuesto';
type Generated = { texto: string; waLink: string; formUrl: string };

type SendGroup = {
  groupId: string;
  phaseName: string | null;
  groupName: string;
  blocks: ObraCheckBlock[];
  taskIds: string[];
  contactId: string;
  primaryBlockId: string;
};

type Lead = {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  detalle: unknown;
  createdAt: string;
  blockId: string | null;
  viewToken: string | null;
};

type DetalleItem = {
  nombre: string;
  included: boolean;
  unidad?: string | null;
  cantidad?: number | null;
  dias?: number | null;
  precio?: number | null;
};

const UNIDADES = ['m2', 'ml', 'gl', 'un'] as const;

export function StepEnvio({
  blocks,
  budgetGroups,
  assignments,
  contacts,
  tasks,
  onTasksChange,
  onFinish,
}: {
  blocks: ObraCheckBlock[];
  budgetGroups?: ObraCheckBudgetGroup[];
  assignments: Assignments;
  contacts: ObraCheckContact[];
  tasks: ObraCheckTask[];
  onTasksChange: (tasks: ObraCheckTask[]) => void;
  onFinish: (enviados: number) => void;
}) {
  const [obraReady, setObraReady] = useState(false);
  const onReadyChange = useCallback((ready: boolean) => setObraReady(ready), []);
  const [inboxUrl, setInboxUrl] = useState<string | null>(null);
  const [copiedInbox, setCopiedInbox] = useState(false);

  const sendGroups = useMemo((): SendGroup[] => {
    const sections =
      budgetGroups && budgetGroups.length > 0
        ? budgetDisplaySections(budgetGroups, blocks)
        : blocks.map((b) => ({
            groupId: b.budgetGroupId ?? b.id,
            phaseName: b.fase,
            subgroupName: b.nombre,
            blocks: [b],
          }));

    return sections
      .map((s) => {
        const contactId = assignments[s.groupId];
        if (!contactId || s.blocks.length === 0) return null;
        const taskIds = s.blocks.flatMap((b) => b.taskIds);
        return {
          groupId: s.groupId,
          phaseName: s.phaseName,
          groupName: s.subgroupName,
          blocks: s.blocks,
          taskIds,
          contactId,
          primaryBlockId: s.blocks[0]!.id,
        } satisfies SendGroup;
      })
      .filter(Boolean) as SendGroup[];
  }, [budgetGroups, blocks, assignments]);

  const cantidadesOk = useMemo(() => {
    return sendGroups.every((g) =>
      g.taskIds.every((tid) => {
        const t = tasks.find((x) => x.id === tid);
        return t != null && t.cantidad != null && t.cantidad > 0;
      }),
    );
  }, [sendGroups, tasks]);

  const canGenerate = obraReady && cantidadesOk;

  const [tipos, setTipos] = useState<Record<string, Tipo>>({});
  const [generated, setGenerated] = useState<Record<string, Generated>>({});
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [shareHint, setShareHint] = useState<string | null>(null);
  const [webShare, setWebShare] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [savingQty, setSavingQty] = useState(false);

  useEffect(() => {
    setWebShare(canUseWebShareText());
    obraCheckApi.listLeads().then(setLeads).catch(() => {});
    obraCheckApi
      .getSession()
      .then((s) => {
        if (s.inboxUrl) setInboxUrl(s.inboxUrl);
        else if (s.inboxToken) setInboxUrl(`${window.location.origin}/obra-check/inbox/${s.inboxToken}`);
      })
      .catch(() => {});
  }, []);

  function patchTask(taskId: string, patch: Partial<ObraCheckTask>) {
    onTasksChange(tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)));
  }

  async function persistCantidades() {
    setSavingQty(true);
    try {
      await obraCheckApi.saveTasks(tasks);
    } catch (e) {
      setShareHint((e as Error).message);
    } finally {
      setSavingQty(false);
    }
  }

  async function generar(group: SendGroup) {
    if (!canGenerate) {
      setShareHint(
        !obraReady
          ? 'Adjuntá al menos un plano.'
          : 'Completá la cantidad (m² u otra unidad) en todas las tareas del grupo.',
      );
      return;
    }
    setBusy(group.groupId);
    try {
      await obraCheckApi.saveTasks(tasks);
      const tipo = tipos[group.groupId] ?? 'pedido_presupuesto';
      const res = await obraCheckApi.generarWa({
        contactId: group.contactId,
        blockId: group.primaryBlockId,
        budgetGroupId: group.groupId,
        groupName: group.groupName,
        tipo,
      });
      setGenerated((g) => ({
        ...g,
        [group.groupId]: { texto: res.texto, waLink: res.waLink, formUrl: res.formUrl },
      }));
      setShareHint(
        'Link listo. El contratista completa el formulario y vos ves la respuesta en tu bandeja — sin reenvíos.',
      );
    } finally {
      setBusy(null);
    }
  }

  async function compartir(group: SendGroup) {
    const g = generated[group.groupId];
    if (!g) return;
    const contact = contacts.find((c) => c.id === group.contactId);
    const result = await shareOrOpenWhatsApp({
      texto: g.texto,
      waLink: g.waLink,
      titulo: contact ? `Formulario para ${contact.nombre}` : 'Formulario de obra',
    });
    if (result.method === 'web_share' && 'cancelled' in result && result.cancelled) return;
    if (result.ok) {
      setSent((s) => new Set(s).add(group.groupId));
      obraCheckApi.event('wa_sent', {
        budgetGroupId: group.groupId,
        method: result.method,
        contactId: group.contactId,
        formUrl: g.formUrl,
      });
    }
  }

  function abrirWaDirecto(group: SendGroup) {
    const g = generated[group.groupId];
    if (!g) return;
    window.open(g.waLink, '_blank', 'noopener');
    setSent((s) => new Set(s).add(group.groupId));
  }

  async function copyForm(groupId: string) {
    const g = generated[groupId];
    if (!g?.formUrl) return;
    try {
      await navigator.clipboard.writeText(g.formUrl);
      setCopied(groupId);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  }

  async function copyInbox() {
    if (!inboxUrl) return;
    try {
      await navigator.clipboard.writeText(inboxUrl);
      setCopiedInbox(true);
      setTimeout(() => setCopiedInbox(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-1 text-xl font-bold" style={{ color: BRAND.blue }}>
        Enviá cada grupo de presupuesto
      </h2>
      <p className="mb-4 text-sm" style={{ color: BRAND.muted }}>
        Cargá cantidad por tarea (m², etc.), adjuntá planos y mandá el link. La respuesta del
        contratista llega sola a tu bandeja.
      </p>

      {inboxUrl && (
        <OCCard className="mb-4" style={{ borderColor: BRAND.blue, background: '#EFF6FF' }}>
          <p className="flex items-center gap-2 text-sm font-bold" style={{ color: BRAND.blue }}>
            <Inbox size={16} /> Tu bandeja permanente
          </p>
          <p className="mt-1 text-xs" style={{ color: BRAND.muted }}>
            Guardá este link. Ahí aparecen todos los presupuestos cargados — el contratista no te
            reenvía nada. También podés recuperarlas con tu email en{' '}
            <a href="/obra-check/bandeja" className="font-semibold underline">
              /obra-check/bandeja
            </a>
            .
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a
              href={inboxUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg px-3 py-2 text-xs font-bold text-white"
              style={{ background: BRAND.blue }}
            >
              Abrir bandeja
            </a>
            <OCButton variant="secondary" onClick={() => void copyInbox()}>
              {copiedInbox ? 'Copiado' : 'Copiar link'}
            </OCButton>
          </div>
        </OCCard>
      )}

      <ObraDatosPedidoPanel onReadyChange={onReadyChange} />

      {shareHint && (
        <p className="mb-3 rounded-lg p-2 text-xs" style={{ background: BRAND.gray, color: BRAND.muted }}>
          {shareHint}
        </p>
      )}

      <div className="space-y-4">
        {sendGroups.map((group) => {
          const contact = contacts.find((c) => c.id === group.contactId);
          const tipo = tipos[group.groupId] ?? 'pedido_presupuesto';
          const g = generated[group.groupId];
          const blockIds = new Set(group.blocks.map((b) => b.id));
          const groupLeads = leads.filter((l) => l.blockId && blockIds.has(l.blockId));
          const groupTasks = group.taskIds
            .map((id) => tasks.find((t) => t.id === id))
            .filter(Boolean) as ObraCheckTask[];

          return (
            <OCCard key={group.groupId}>
              {group.phaseName && (
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wide" style={{ color: BRAND.blueLight }}>
                  {group.phaseName}
                </p>
              )}
              <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: BRAND.text }}>
                    <Package size={14} />
                    {group.groupName} → {contact?.nombre}
                  </p>
                  <p className="text-xs" style={{ color: BRAND.muted }}>
                    {groupTasks.length} tarea(s)
                  </p>
                </div>
                {sent.has(group.groupId) && (
                  <span className="text-xs font-medium" style={{ color: BRAND.green }}>
                    Enviado ✓
                  </span>
                )}
              </div>

              <div className="mb-3 rounded-lg border p-2" style={{ borderColor: BRAND.border }}>
                <p className="mb-2 text-[10px] font-bold uppercase" style={{ color: BRAND.muted }}>
                  Cantidad por tarea (vos) · días y precio (contratista)
                </p>
                <div className="space-y-2">
                  {groupTasks.map((t) => (
                    <div key={t.id} className="grid grid-cols-[1fr_70px_88px] items-center gap-1.5">
                      <p className="truncate text-xs font-medium" style={{ color: BRAND.text }} title={t.nombre}>
                        {t.nombre}
                      </p>
                      <select
                        style={{ ...inputStyle, padding: '6px 8px', fontSize: '0.75rem' }}
                        value={t.unidad ?? 'm2'}
                        onChange={(e) => patchTask(t.id, { unidad: e.target.value })}
                      >
                        {UNIDADES.map((u) => (
                          <option key={u} value={u}>
                            {u === 'm2' ? 'm²' : u}
                          </option>
                        ))}
                      </select>
                      <input
                        style={{ ...inputStyle, padding: '6px 8px', fontSize: '0.75rem' }}
                        inputMode="decimal"
                        placeholder="cant."
                        value={t.cantidad ?? ''}
                        onChange={(e) => {
                          const v = e.target.value.replace(',', '.');
                          patchTask(t.id, {
                            cantidad: v === '' ? null : Number(v),
                          });
                        }}
                        onBlur={() => void persistCantidades()}
                      />
                    </div>
                  ))}
                </div>
                <OCButton
                  variant="ghost"
                  className="mt-2 !text-[11px]"
                  loading={savingQty}
                  onClick={() => void persistCantidades()}
                >
                  Guardar cantidades
                </OCButton>
              </div>

              <div className="mb-2 flex gap-2">
                {(['pedido_presupuesto', 'orden_trabajo'] as Tipo[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipos((prev) => ({ ...prev, [group.groupId]: t }))}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium"
                    style={{
                      background: tipo === t ? BRAND.blue : '#fff',
                      color: tipo === t ? '#fff' : BRAND.muted,
                      border: `1px solid ${tipo === t ? BRAND.blue : BRAND.border}`,
                    }}
                  >
                    {t === 'orden_trabajo' ? 'Orden de trabajo' : 'Pedido de presupuesto'}
                  </button>
                ))}
              </div>

              {g && (
                <>
                  <pre
                    className="mb-2 max-h-28 overflow-y-auto whitespace-pre-wrap rounded-lg p-3 text-xs"
                    style={{ background: BRAND.gray, color: BRAND.text, fontFamily: 'inherit' }}
                  >
                    {g.texto}
                  </pre>
                  <p className="mb-2 truncate text-[11px]" style={{ color: BRAND.blueLight }}>
                    Formulario: {g.formUrl}
                  </p>
                </>
              )}

              {groupLeads.map((l) => {
                const items = (Array.isArray(l.detalle) ? l.detalle : []) as DetalleItem[];
                const included = items.filter((t) => t.included);
                const total = included.reduce(
                  (s, t) => s + (typeof t.precio === 'number' ? t.precio : 0),
                  0,
                );
                return (
                  <div
                    key={l.id}
                    className="mb-3 rounded-lg p-2 text-xs"
                    style={{ background: '#ECFDF5', border: `1px solid ${BRAND.green}` }}
                  >
                    <p className="mb-1 flex items-center gap-1 font-semibold" style={{ color: BRAND.green }}>
                      <CheckCircle2 size={14} /> Ya en tu bandeja
                    </p>
                    <p>
                      {l.nombre}
                      {l.telefono ? ` · ${l.telefono}` : ''}
                    </p>
                    {included.slice(0, 4).map((t, i) => (
                      <p key={i} style={{ color: BRAND.muted }}>
                        {t.nombre}
                        {t.cantidad != null ? ` · ${t.cantidad}${t.unidad === 'm2' ? 'm²' : t.unidad ?? ''}` : ''}
                        {t.dias != null ? ` · ${t.dias}d` : ''}
                        {t.precio != null ? ` · $${Number(t.precio).toLocaleString('es-AR')}` : ''}
                      </p>
                    ))}
                    {total > 0 && <p className="mt-1 font-bold">Total: ${total.toLocaleString('es-AR')}</p>}
                    {l.viewToken && (
                      <a
                        href={`/obra-check/r/${l.viewToken}`}
                        className="mt-1 inline-flex items-center gap-1 font-semibold"
                        style={{ color: BRAND.blue }}
                      >
                        Ver <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                );
              })}

              <div className="flex flex-wrap gap-2">
                {!g ? (
                  <OCButton
                    variant="secondary"
                    onClick={() => void generar(group)}
                    loading={busy === group.groupId}
                    disabled={!canGenerate}
                  >
                    Generar link del grupo
                  </OCButton>
                ) : (
                  <>
                    <OCButton onClick={() => void compartir(group)}>
                      <Share2 size={15} /> Compartir formulario
                    </OCButton>
                    <OCButton variant="secondary" onClick={() => abrirWaDirecto(group)}>
                      <Send size={15} /> Abrir WhatsApp
                    </OCButton>
                    <OCButton variant="ghost" onClick={() => void copyForm(group.groupId)}>
                      <Copy size={15} /> {copied === group.groupId ? 'Copiado' : 'Copiar link'}
                    </OCButton>
                  </>
                )}
                <OCButton variant="ghost" disabled title="Disponible pronto">
                  <FileText size={15} /> PDF (pronto)
                </OCButton>
              </div>
            </OCCard>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <OCButton
          variant="ghost"
          onClick={() => void obraCheckApi.listLeads().then(setLeads).catch(() => {})}
        >
          Actualizar respuestas
        </OCButton>
        <OCButton onClick={() => onFinish(sent.size)}>Ver resumen →</OCButton>
      </div>
    </div>
  );
}

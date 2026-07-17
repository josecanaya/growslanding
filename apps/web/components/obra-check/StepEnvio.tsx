'use client';

import { useEffect, useMemo, useState } from 'react';
import { Send, Share2, FileText, Copy, CheckCircle2, Package } from 'lucide-react';
import { obraCheckApi } from '@/lib/obra-check/client';
import { canUseWebShareText, shareOrOpenWhatsApp } from '@/lib/obra-check/share';
import type { ObraCheckBlock, ObraCheckBudgetGroup, ObraCheckContact } from '@/lib/obra-check/types';
import { budgetDisplaySections } from './budget-groups/buildDefaultHierarchy';
import { BRAND, OCButton, OCCard } from './ui';
import type { Assignments } from './StepAsignar';

type Tipo = 'orden_trabajo' | 'pedido_presupuesto';

type Generated = { texto: string; waLink: string; formUrl: string };

type SendGroup = {
  groupId: string;
  phaseName: string | null;
  groupName: string;
  blocks: ObraCheckBlock[];
  taskCount: number;
  contactId: string;
  /** Bloque representativo para el invite (el form carga todo el grupo vía budget_group). */
  primaryBlockId: string;
};

export function StepEnvio({
  blocks,
  budgetGroups,
  assignments,
  contacts,
  onFinish,
}: {
  blocks: ObraCheckBlock[];
  budgetGroups?: ObraCheckBudgetGroup[];
  assignments: Assignments;
  contacts: ObraCheckContact[];
  onFinish: (enviados: number) => void;
}) {
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
        return {
          groupId: s.groupId,
          phaseName: s.phaseName,
          groupName: s.subgroupName,
          blocks: s.blocks,
          taskCount: s.blocks.reduce((n, b) => n + b.taskIds.length, 0),
          contactId,
          primaryBlockId: s.blocks[0]!.id,
        } satisfies SendGroup;
      })
      .filter(Boolean) as SendGroup[];
  }, [budgetGroups, blocks, assignments]);

  const [tipos, setTipos] = useState<Record<string, Tipo>>({});
  const [generated, setGenerated] = useState<Record<string, Generated>>({});
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [shareHint, setShareHint] = useState<string | null>(null);
  const [webShare, setWebShare] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [leads, setLeads] = useState<
    Array<{ id: string; telefono: string; email: string | null; blockId: string | null; mensaje: string | null }>
  >([]);

  useEffect(() => {
    setWebShare(canUseWebShareText());
    obraCheckApi.listLeads().then(setLeads).catch(() => {});
  }, []);

  async function generar(group: SendGroup) {
    const tipo = tipos[group.groupId] ?? 'pedido_presupuesto';
    setBusy(group.groupId);
    try {
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
    } finally {
      setBusy(null);
    }
  }

  async function compartir(group: SendGroup) {
    const g = generated[group.groupId];
    if (!g) return;
    const contact = contacts.find((c) => c.id === group.contactId);
    setShareHint(null);
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
      setShareHint(
        'Compartido. El contacto real lo vas a ver cuando el contratista complete el formulario.',
      );
    }
  }

  function abrirWaDirecto(group: SendGroup) {
    const g = generated[group.groupId];
    if (!g) return;
    window.open(g.waLink, '_blank', 'noopener');
    setSent((s) => new Set(s).add(group.groupId));
    obraCheckApi.event('wa_sent', {
      budgetGroupId: group.groupId,
      method: 'wa_link',
      contactId: group.contactId,
      formUrl: g.formUrl,
    });
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

  async function refreshLeads() {
    try {
      setLeads(await obraCheckApi.listLeads());
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
        {webShare
          ? 'Un mensaje por grupo: el contratista recibe el paquete de trabajos completo (todos los paquetes del presupuesto).'
          : 'Cada link abre el formulario con el alcance completo del grupo asignado.'}
      </p>

      {shareHint && (
        <p className="mb-3 rounded-lg p-2 text-xs" style={{ background: BRAND.gray, color: BRAND.muted }}>
          {shareHint}
        </p>
      )}

      {sendGroups.length === 0 && (
        <OCCard>
          <p className="text-sm" style={{ color: BRAND.muted }}>
            No hay grupos asignados. Volvé a Asignar y elegí un contratista por grupo de presupuesto.
          </p>
        </OCCard>
      )}

      <div className="space-y-4">
        {sendGroups.map((group) => {
          const contact = contacts.find((c) => c.id === group.contactId);
          const tipo = tipos[group.groupId] ?? 'pedido_presupuesto';
          const g = generated[group.groupId];
          const blockIds = new Set(group.blocks.map((b) => b.id));
          const groupLeads = leads.filter((l) => l.blockId && blockIds.has(l.blockId));

          return (
            <OCCard key={group.groupId}>
              {group.phaseName && (
                <p
                  className="mb-1 text-[10px] font-bold uppercase tracking-wide"
                  style={{ color: BRAND.blueLight }}
                >
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
                    {group.blocks.length} paquete{group.blocks.length === 1 ? '' : 's'} ·{' '}
                    {group.taskCount} tarea{group.taskCount === 1 ? '' : 's'}
                  </p>
                </div>
                {sent.has(group.groupId) && (
                  <span className="text-xs font-medium" style={{ color: BRAND.green }}>
                    Enviado ✓
                  </span>
                )}
              </div>

              <ul className="mb-2 space-y-0.5 text-[11px]" style={{ color: BRAND.muted }}>
                {group.blocks.map((b) => (
                  <li key={b.id}>· {b.nombre}</li>
                ))}
              </ul>

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
                    className="mb-2 max-h-32 overflow-y-auto whitespace-pre-wrap rounded-lg p-3 text-xs"
                    style={{ background: BRAND.gray, color: BRAND.text, fontFamily: 'inherit' }}
                  >
                    {g.texto}
                  </pre>
                  <p className="mb-2 truncate text-[11px]" style={{ color: BRAND.blueLight }}>
                    Formulario: {g.formUrl}
                  </p>
                </>
              )}

              {groupLeads.length > 0 && (
                <div
                  className="mb-3 rounded-lg p-2 text-xs"
                  style={{ background: '#ECFDF5', border: `1px solid ${BRAND.green}`, color: BRAND.text }}
                >
                  <p className="mb-1 flex items-center gap-1 font-semibold" style={{ color: BRAND.green }}>
                    <CheckCircle2 size={14} /> Contacto capturado
                  </p>
                  {groupLeads.map((l) => (
                    <p key={l.id}>
                      {l.telefono || l.email}
                      {l.mensaje ? ` · ${l.mensaje.slice(0, 80)}` : ''}
                    </p>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {!g ? (
                  <OCButton
                    variant="secondary"
                    onClick={() => void generar(group)}
                    loading={busy === group.groupId}
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
        <OCButton variant="ghost" onClick={() => void refreshLeads()}>
          Actualizar respuestas
        </OCButton>
        <OCButton onClick={() => onFinish(sent.size)}>Ver resumen →</OCButton>
      </div>
    </div>
  );
}

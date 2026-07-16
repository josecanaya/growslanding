'use client';

import { useEffect, useState } from 'react';
import { Send, Share2, FileText, Copy, CheckCircle2 } from 'lucide-react';
import { obraCheckApi } from '@/lib/obra-check/client';
import { canUseWebShareText, shareOrOpenWhatsApp } from '@/lib/obra-check/share';
import type { ObraCheckBlock, ObraCheckBudgetGroup, ObraCheckContact } from '@/lib/obra-check/types';
import { BRAND, OCButton, OCCard } from './ui';
import type { Assignments } from './StepAsignar';

type Tipo = 'orden_trabajo' | 'pedido_presupuesto';

type Generated = { texto: string; waLink: string; formUrl: string };

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
  const assignedBlocks = blocks.filter((b) => assignments[b.id]);
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

  async function generar(block: ObraCheckBlock) {
    const contactId = assignments[block.id]!;
    const tipo = tipos[block.id] ?? 'orden_trabajo';
    setBusy(block.id);
    try {
      const res = await obraCheckApi.generarWa({ contactId, blockId: block.id, tipo });
      setGenerated((g) => ({
        ...g,
        [block.id]: { texto: res.texto, waLink: res.waLink, formUrl: res.formUrl },
      }));
    } finally {
      setBusy(null);
    }
  }

  async function compartir(block: ObraCheckBlock) {
    const g = generated[block.id];
    if (!g) return;
    const contact = contacts.find((c) => c.id === assignments[block.id]);
    setShareHint(null);
    const result = await shareOrOpenWhatsApp({
      texto: g.texto,
      waLink: g.waLink,
      titulo: contact ? `Formulario para ${contact.nombre}` : 'Formulario de obra',
    });
    if (result.method === 'web_share' && 'cancelled' in result && result.cancelled) return;
    if (result.ok) {
      setSent((s) => new Set(s).add(block.id));
      obraCheckApi.event('wa_sent', {
        blockId: block.id,
        method: result.method,
        contactId: assignments[block.id],
        formUrl: g.formUrl,
      });
      setShareHint(
        'Compartido. El contacto real lo vas a ver cuando el contratista complete el formulario.',
      );
    }
  }

  function abrirWaDirecto(block: ObraCheckBlock) {
    const g = generated[block.id];
    if (!g) return;
    window.open(g.waLink, '_blank', 'noopener');
    setSent((s) => new Set(s).add(block.id));
    obraCheckApi.event('wa_sent', {
      blockId: block.id,
      method: 'wa_link',
      contactId: assignments[block.id],
      formUrl: g.formUrl,
    });
  }

  async function copyForm(blockId: string) {
    const g = generated[blockId];
    if (!g?.formUrl) return;
    try {
      await navigator.clipboard.writeText(g.formUrl);
      setCopied(blockId);
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
        Compartí el formulario por WhatsApp
      </h2>
      <p className="mb-4 text-sm" style={{ color: BRAND.muted }}>
        {webShare
          ? 'No mandamos la lista de tareas por chat: mandamos un link. El contratista ve el alcance y deja su WhatsApp real — ese es el contacto que necesitás.'
          : 'El mensaje lleva un link al formulario. Cuando lo completen, ves su teléfono acá abajo.'}
      </p>

      {shareHint && (
        <p className="mb-3 rounded-lg p-2 text-xs" style={{ background: BRAND.gray, color: BRAND.muted }}>
          {shareHint}
        </p>
      )}

      <div className="space-y-4">
        {(budgetGroups && budgetGroups.length > 0
          ? budgetGroups.map((group) => ({
              id: group.id,
              nombre: group.nombre,
              blocks: assignedBlocks.filter((b) => group.blockIds.includes(b.id)),
            }))
          : [{ id: 'default', nombre: 'Paquetes', blocks: assignedBlocks }]).map((group) => (
          <div key={group.id}>
            {budgetGroups && budgetGroups.length > 0 && group.blocks.length > 0 && (
              <p className="mb-2 text-sm font-semibold" style={{ color: BRAND.blue }}>
                {group.nombre}
              </p>
            )}
            <div className="space-y-3">
        {group.blocks.map((block) => {
          const contact = contacts.find((c) => c.id === assignments[block.id]);
          const tipo = tipos[block.id] ?? 'orden_trabajo';
          const g = generated[block.id];
          const blockLeads = leads.filter((l) => l.blockId === block.id);
          return (
            <OCCard key={block.id}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold" style={{ color: BRAND.text }}>
                  {block.nombre} → {contact?.nombre}
                </p>
                {sent.has(block.id) && (
                  <span className="text-xs font-medium" style={{ color: BRAND.green }}>
                    Enviado ✓
                  </span>
                )}
              </div>

              <div className="mb-2 flex gap-2">
                {(['orden_trabajo', 'pedido_presupuesto'] as Tipo[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTipos((prev) => ({ ...prev, [block.id]: t }))}
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

              {blockLeads.length > 0 && (
                <div
                  className="mb-3 rounded-lg p-2 text-xs"
                  style={{ background: '#ECFDF5', border: `1px solid ${BRAND.green}`, color: BRAND.text }}
                >
                  <p className="mb-1 flex items-center gap-1 font-semibold" style={{ color: BRAND.green }}>
                    <CheckCircle2 size={14} /> Contacto capturado
                  </p>
                  {blockLeads.map((l) => (
                    <p key={l.id}>
                      {l.telefono || l.email}
                      {l.mensaje ? ` · ${l.mensaje.slice(0, 80)}` : ''}
                    </p>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {!g ? (
                  <OCButton variant="secondary" onClick={() => generar(block)} loading={busy === block.id}>
                    Generar link + mensaje
                  </OCButton>
                ) : (
                  <>
                    <OCButton onClick={() => void compartir(block)}>
                      <Share2 size={15} /> Compartir formulario
                    </OCButton>
                    <OCButton variant="secondary" onClick={() => abrirWaDirecto(block)}>
                      <Send size={15} /> Abrir WhatsApp
                    </OCButton>
                    <OCButton variant="ghost" onClick={() => void copyForm(block.id)}>
                      <Copy size={15} /> {copied === block.id ? 'Copiado' : 'Copiar link'}
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
          </div>
        ))}
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

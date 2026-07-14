'use client';

import { useState } from 'react';
import { Send, FileText } from 'lucide-react';
import { obraCheckApi } from '@/lib/obra-check/client';
import type { ObraCheckBlock, ObraCheckContact } from '@/lib/obra-check/types';
import { BRAND, OCButton, OCCard } from './ui';
import type { Assignments } from './StepAsignar';

type Tipo = 'orden_trabajo' | 'pedido_presupuesto';

export function StepEnvio({
  blocks,
  assignments,
  contacts,
  onFinish,
}: {
  blocks: ObraCheckBlock[];
  assignments: Assignments;
  contacts: ObraCheckContact[];
  onFinish: (enviados: number) => void;
}) {
  const assignedBlocks = blocks.filter((b) => assignments[b.id]);
  const [tipos, setTipos] = useState<Record<string, Tipo>>({});
  const [generated, setGenerated] = useState<Record<string, { texto: string; waLink: string }>>({});
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);

  async function generar(block: ObraCheckBlock) {
    const contactId = assignments[block.id]!;
    const tipo = tipos[block.id] ?? 'orden_trabajo';
    setBusy(block.id);
    try {
      const res = await obraCheckApi.generarWa({ contactId, blockId: block.id, tipo });
      setGenerated((g) => ({ ...g, [block.id]: res }));
    } finally {
      setBusy(null);
    }
  }

  function enviar(block: ObraCheckBlock) {
    const g = generated[block.id];
    if (!g) return;
    window.open(g.waLink, '_blank', 'noopener');
    setSent((s) => new Set(s).add(block.id));
    obraCheckApi.event('wa_sent', { blockId: block.id });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-1 text-xl font-bold" style={{ color: BRAND.blue }}>
        Mandá los trabajos por WhatsApp
      </h2>
      <p className="mb-4 text-sm" style={{ color: BRAND.muted }}>
        Se abre WhatsApp con el mensaje listo. Lo enviás desde tu propio número.
      </p>

      <div className="space-y-3">
        {assignedBlocks.map((block) => {
          const contact = contacts.find((c) => c.id === assignments[block.id]);
          const tipo = tipos[block.id] ?? 'orden_trabajo';
          const g = generated[block.id];
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
                <pre
                  className="mb-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg p-3 text-xs"
                  style={{ background: BRAND.gray, color: BRAND.text, fontFamily: 'inherit' }}
                >
                  {g.texto}
                </pre>
              )}

              <div className="flex flex-wrap gap-2">
                {!g ? (
                  <OCButton variant="secondary" onClick={() => generar(block)} loading={busy === block.id}>
                    Generar mensaje
                  </OCButton>
                ) : (
                  <OCButton onClick={() => enviar(block)}>
                    <Send size={15} /> Enviar por WhatsApp
                  </OCButton>
                )}
                <OCButton variant="ghost" disabled title="Disponible pronto">
                  <FileText size={15} /> PDF (pronto)
                </OCButton>
              </div>
            </OCCard>
          );
        })}
      </div>

      <div className="mt-5 flex justify-end">
        <OCButton onClick={() => onFinish(sent.size)}>Ver resumen →</OCButton>
      </div>
    </div>
  );
}

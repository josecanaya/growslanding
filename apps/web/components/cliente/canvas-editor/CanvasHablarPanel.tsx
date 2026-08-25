'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, MessageSquare, Send, X } from 'lucide-react';
import { parseHiloCanvasUi, type HiloLinea } from '@/lib/proyecto-vivo/hiloCanvasUi';

type Props = {
  obraId: string;
  open: boolean;
  onClose: () => void;
  onCanvasMaybeChanged: () => void;
};

/**
 * Chat que acompaña el Organizar: mismas etapas/tareas/CPM.
 * No es una UI distinta al canvas de precedencias.
 */
export function CanvasHablarPanel({ obraId, open, onClose, onCanvasMaybeChanged }: Props) {
  const [hilo, setHilo] = useState<HiloLinea[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const loadHilo = useCallback(async () => {
    try {
      const res = await fetch(`/api/obras/${encodeURIComponent(obraId)}/canvas`, {
        cache: 'no-store',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return;
      setHilo(parseHiloCanvasUi(json.data?.obra?.canvas_ui));
    } catch {
      /* ignore */
    }
  }, [obraId]);

  useEffect(() => {
    if (open) void loadHilo();
  }, [open, loadHilo]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [hilo.length]);

  const enviar = async () => {
    const mensaje = draft.trim();
    if (!mensaje || busy) return;
    setDraft('');
    setBusy(true);
    setError(null);
    setHilo((prev) => [
      ...prev,
      { id: `opt-${Date.now()}`, role: 'user', text: mensaje, at: new Date().toISOString() },
    ]);
    try {
      const res = await fetch(`/api/obras/${encodeURIComponent(obraId)}/grafo/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje,
          historial: hilo.slice(-12).map((h) => ({ role: h.role, text: h.text.slice(0, 2000) })),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message ?? 'No se pudo seguir');
      if (Array.isArray(json.data?.hilo)) {
        setHilo(parseHiloCanvasUi({ hilo: json.data.hilo }));
      } else {
        await loadHilo();
      }
      if (json.data?.anotoPaso) onCanvasMaybeChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <aside className="flex w-full shrink-0 flex-col border border-[#e5e7eb] bg-white shadow-sm lg:w-[340px] lg:rounded-2xl">
      <div className="flex items-center justify-between border-b border-[#e5e7eb] px-3 py-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#1e293b]">
          <MessageSquare className="h-4 w-4 text-[#2563eb]" />
          Hablar el proyecto
        </div>
        <button type="button" onClick={onClose} className="rounded p-1 text-[#64748b] hover:bg-slate-100" aria-label="Cerrar">
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="border-b border-[#e5e7eb] px-3 py-2 text-[11px] leading-relaxed text-[#64748b]">
        Mismo Organizar: si anotás un paso (`verbo → estado`), crea tarea bajo «00. Definición» con
        precedencia. Publicar / bolsa siguen igual.
      </p>
      {error && <p className="px-3 py-2 text-xs text-red-700">{error}</p>}
      <div ref={scroller} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-3">
        {hilo.length === 0 && (
          <p className="text-[13px] leading-6 text-[#64748b]">
            Preguntá por lote, programa o gremios. Para dejar algo en el canvas:{' '}
            <span className="font-medium text-[#334155]">Definir programa → Unidades por piso</span>.
          </p>
        )}
        {hilo.map((m) => (
          <div key={m.id}>
            <p className="mb-0.5 text-[10px] uppercase tracking-wide text-[#94a3b8]">
              {m.role === 'user' ? 'Vos' : 'Oficio'}
            </p>
            <p
              className={`whitespace-pre-wrap text-[13px] leading-6 ${
                m.role === 'user' ? 'text-[#0f172a]' : 'text-[#334155]'
              }`}
            >
              {m.text}
            </p>
          </div>
        ))}
        {busy && <p className="text-xs text-[#94a3b8]">Pensando…</p>}
      </div>
      <form
        className="flex items-end gap-2 border-t border-[#e5e7eb] p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void enviar();
        }}
      >
        <textarea
          className="min-h-[64px] min-w-0 flex-1 resize-none rounded border border-[#e2e8f0] px-2 py-1.5 text-[13px] outline-none focus:border-[#2563eb]"
          placeholder="Preguntá o verbo → estado"
          value={draft}
          rows={3}
          disabled={busy}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void enviar();
            }
          }}
        />
        <button
          type="submit"
          disabled={busy || !draft.trim()}
          className="mb-0.5 inline-flex items-center gap-1 rounded bg-[#1e40af] px-2.5 py-2 text-xs font-bold text-white disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          Enviar
        </button>
      </form>
    </aside>
  );
}

'use client';

import { useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/grows';

type Line = { id: string; role: 'user' | 'conocimiento'; text: string };

export default function SocioConocimientoPage() {
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hilo, setHilo] = useState<Line[]>([
    {
      id: 'intro',
      role: 'conocimiento',
      text: 'Preguntá al corpus de Grows (construcción + marco). Responde con el oficio, no con plantillas.',
    },
  ]);

  const enviar = async () => {
    const mensaje = draft.trim();
    if (!mensaje || busy) return;
    setDraft('');
    setBusy(true);
    setError(null);
    const prev = hilo;
    setHilo((h) => [...h, { id: `u-${Date.now()}`, role: 'user', text: mensaje }]);
    try {
      const res = await fetch('/api/socio/conocimiento/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje,
          historial: prev.slice(-12).map((h) => ({
            role: h.role === 'user' ? 'user' : 'conocimiento',
            text: h.text.slice(0, 2000),
          })),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message ?? 'No se pudo consultar');
      setHilo((h) => [
        ...h,
        {
          id: `k-${Date.now()}`,
          role: 'conocimiento',
          text: json.data?.reply ?? 'Sin respuesta.',
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] flex-col px-4 py-6">
      <h1 className="mb-1 text-lg font-semibold text-[#163274]">Conocimiento</h1>
      <p className="mb-4 text-xs text-slate-500">
        Motor: Cursor (CURSOR_API_KEY de tu plan) o síntesis del corpus. Sin OpenAI de pago.
      </p>
      {error && <p className="mb-2 rounded-lg bg-red-50 p-2 text-sm text-red-800">{error}</p>}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-white p-3">
        {hilo.map((m) => (
          <div
            key={m.id}
            className={`max-w-[92%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
              m.role === 'user' ? 'ml-auto bg-[#163274] text-white' : 'bg-slate-100 text-slate-800'
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void enviar();
        }}
      >
        <input
          className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Preguntá al corpus…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={busy}
        />
        <Button
          variant="primary"
          size="sm"
          type="submit"
          disabled={busy || !draft.trim()}
          icon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        >
          Enviar
        </Button>
      </form>
    </div>
  );
}

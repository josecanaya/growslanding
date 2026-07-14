'use client';

import { useState } from 'react';
import { obraCheckApi } from '@/lib/obra-check/client';
import { detectarRubro } from '@/lib/obra-check/rubros';
import type { ObraCheckTask } from '@/lib/obra-check/types';
import { BRAND, OCButton, inputStyle } from './ui';

type Msg = { from: 'user' | 'bot'; text: string };

let cid = 0;
function newTaskFromNombre(nombre: string, duracionDias: number | null): ObraCheckTask {
  cid += 1;
  return {
    id: `chat-${Date.now()}-${cid}`,
    nombre,
    rubro: detectarRubro(nombre),
    duracionDias,
    inicio: null,
    fin: null,
    predecesoras: [],
    responsableLabel: null,
    blockId: null,
    origen: 'chat',
  };
}

/**
 * Chat limitado: dicta/desambigua tareas vía n8n. Si n8n no está configurado, degrada y sugiere
 * la carga manual (el flujo nunca depende del chat).
 */
export function ChatPanel({ onAddTasks }: { onAddTasks: (tasks: ObraCheckTask[]) => void }) {
  const [messages, setMessages] = useState<Msg[]>([
    { from: 'bot', text: 'Contame las tareas de tu obra. Por ejemplo: "primero platea, después mampostería, después instalación eléctrica".' },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput('');
    setMessages((m) => [...m, { from: 'user', text }]);
    setBusy(true);
    try {
      const res = await obraCheckApi.chat(text);
      if (res.fallback) {
        setUnavailable(true);
        setMessages((m) => [
          ...m,
          { from: 'bot', text: 'El asistente no está disponible ahora. Cargá tus tareas en la tabla de abajo o subí un archivo.' },
        ]);
        return;
      }
      const actions = (res.actions ?? []) as Array<{ type: string; tasks?: Array<{ nombre: string; duracionDias?: number | null }> }>;
      const added: ObraCheckTask[] = [];
      for (const a of actions) {
        if (a.type === 'add_tasks' && Array.isArray(a.tasks)) {
          for (const t of a.tasks) added.push(newTaskFromNombre(t.nombre, t.duracionDias ?? null));
        }
      }
      if (added.length > 0) onAddTasks(added);
      setMessages((m) => [
        ...m,
        { from: 'bot', text: res.reply ?? (added.length ? `Agregué ${added.length} tarea(s).` : 'Listo.') },
      ]);
    } catch {
      setUnavailable(true);
      setMessages((m) => [...m, { from: 'bot', text: 'No pude conectar con el asistente. Usá la carga manual.' }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col rounded-xl" style={{ border: `1px solid ${BRAND.border}`, height: 320 }}>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-[80%] rounded-lg px-3 py-2 text-sm"
              style={{
                background: m.from === 'user' ? BRAND.blue : BRAND.gray,
                color: m.from === 'user' ? '#fff' : BRAND.text,
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
      </div>
      {!unavailable && (
        <div className="flex gap-2 border-t p-2" style={{ borderColor: BRAND.border }}>
          <input
            style={inputStyle}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Escribí una tarea o secuencia…"
            disabled={busy}
          />
          <OCButton onClick={send} loading={busy} disabled={!input.trim()}>
            Enviar
          </OCButton>
        </div>
      )}
    </div>
  );
}

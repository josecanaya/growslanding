import { useCallback, useMemo, useState } from "react";

const SESSION_ID = "cliente_tecnico_01";

const baseMessages = [
  {
    id: "welcome",
    role: "assistant",
    text: "Hola, ¿en qué puedo ayudarte con tus gestiones de obra?",
  },
];

function buildAssistantText(payload) {
  if (!payload) {
    return "No recibí respuesta del flujo.";
  }

  if (typeof payload === "string") {
    return payload.trim() || "Sin contenido en la respuesta.";
  }

  if (Array.isArray(payload)) {
    return payload.length > 0
      ? buildAssistantText(payload[0])
      : "Sin contenido en la respuesta.";
  }

  if (typeof payload === "object") {
    const possibleKeys = [
      "texto",
      "text",
      "message",
      "respuesta",
      "response",
      "content",
      "data",
    ];

    for (const key of possibleKeys) {
      if (payload[key]) {
        return buildAssistantText(payload[key]);
      }
    }

    try {
      return JSON.stringify(payload);
    } catch (error) {
      console.error("⚠️ No se pudo serializar la respuesta:", error);
    }
  }

  return String(payload);
}

export default function ChatBox() {
  const [mensajes, setMensajes] = useState(baseMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(
    () => input.trim().length > 0 && !loading,
    [input, loading]
  );

  const enviarMensaje = useCallback(
    async (event) => {
      event?.preventDefault();
      const trimmed = input.trim();
      if (!trimmed) return;

      const payload = {
        sessionId: SESSION_ID,
        action: "sendMessage",
        chatinput: trimmed,
      };

      console.log("➡️ Enviando mensaje a n8n", payload);
      setError("");
      setLoading(true);
      setInput("");
      setMensajes((prev) => [
        ...prev,
        { id: `${Date.now()}-user`, role: "user", text: trimmed },
      ]);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Respuesta HTTP ${response.status}`);
        }

        const result = await response.json();
        console.log("✅ Respuesta recibida", result);

        const assistantText = buildAssistantText(result?.data);
        setMensajes((prev) => [
          ...prev,
          {
            id: `${Date.now()}-assistant`,
            role: "assistant",
            text: assistantText,
          },
        ]);
      } catch (err) {
        console.error("⚠️ Error al conectar con n8n", err);
        const message = err instanceof Error ? err.message : "Error desconocido";
        setError(message);
        setMensajes((prev) => [
          ...prev,
          {
            id: `${Date.now()}-assistant-error`,
            role: "assistant",
            text: "No se pudo obtener respuesta. Intentalo nuevamente.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input]
  );

  return (
    <div className="flex h-full w-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm text-slate-500">
        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
        <span>
          Workflow conectado a <code className="font-mono">/api/chat</code>
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-3">
        {mensajes.map((mensaje) => {
          const isUser = mensaje.role === "user";
          return (
            <div
              key={mensaje.id}
              className={`flex w-full ${
                isUser ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs rounded-lg px-4 py-2 text-sm leading-relaxed ${
                  isUser
                    ? "bg-sky-600 text-white shadow-md"
                    : "bg-white text-slate-900 shadow"
                }`}
              >
                {mensaje.text}
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="h-2 w-2 animate-ping rounded-full bg-sky-500"></span>
            <span>Procesando solicitud…</span>
          </div>
        )}
      </div>

      <form
        onSubmit={enviarMensaje}
        className="mt-4 flex flex-col gap-2 md:flex-row"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder='Escribe tu mensaje (ej. "crear nueva obra en Pueblo Esther")'
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
            disabled={loading}
          />
          {loading && (
            <div className="absolute inset-y-0 right-3 flex items-center">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-sky-500"></span>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!canSubmit}
        >
          {loading ? "Enviando…" : "Enviar"}
        </button>
      </form>

      {error && (
        <p className="mt-2 text-xs text-rose-500">
          Ocurrió un problema: {error}. Revisa la consola para más detalles.
        </p>
      )}
    </div>
  );
}

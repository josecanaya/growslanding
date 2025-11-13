"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { scrollToSection } from "@/utils/scrollToSection";

type GrowsBotAction = {
  label: string;
  section: string;
};

type ChatMessage = {
  sender: "user" | "bot";
  text: string;
  actions?: GrowsBotAction[];
};

type GrowsBotProps = {
  onCommand?: (payload: {
    userInput: string;
  }) => void;
};

const storageKey = "fierro-bot-conversation";
const tooltipDurationMs = 4000;
const introBoostDurationMs = 2500;
const storageLastTopicKey = "fierro-bot-last-topic";

const suggestedTopics = [
  { label: "¿Cómo funciona GROWS?", value: "cómo funciona grows" },
  { label: "Problemas comunes de obra", value: "problemas" },
  { label: "Soluciones que ofrece GROWS", value: "soluciones" },
  { label: "Sistema de reputación", value: "reputación" },
  { label: "Planes y precios", value: "precios" },
];

export function GrowsBot({ onCommand }: GrowsBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isIntroBoost, setIsIntroBoost] = useState(true);

  const listContainerRef = useRef<HTMLDivElement>(null);
  const greetingTimeoutRef = useRef<number>();
  const hasSentGreetingRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as ChatMessage[];
        if (Array.isArray(parsed)) {
          setMessages(parsed);
          if (parsed.length > 0) {
            hasSentGreetingRef.current = true;
          }
        }
      }
    } catch (error) {
      console.warn("Fierro: unable to load stored conversation", error);
    } finally {
      setHasHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated || typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (error) {
      console.warn("Fierro: unable to persist conversation", error);
    }
  }, [messages, hasHydrated]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const tooltipTimeout = window.setTimeout(
      () => setShowTooltip(false),
      tooltipDurationMs
    );
    return () => window.clearTimeout(tooltipTimeout);
  }, []);

  useEffect(() => {
    if (!isIntroBoost) return;
    const timeout = window.setTimeout(() => {
      setIsIntroBoost(false);
    }, introBoostDurationMs);
    return () => window.clearTimeout(timeout);
  }, [isIntroBoost]);

  useEffect(() => {
    return () => {
      if (greetingTimeoutRef.current) {
        window.clearTimeout(greetingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const container = listContainerRef.current;
    if (!container) {
      return;
    }
    container.scrollTop = container.scrollHeight;
  }, [messages, isOpen, isTyping]);

  useEffect(() => {
    if (!hasHydrated || hasSentGreetingRef.current) {
      return;
    }
    greetingTimeoutRef.current = window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "👋 ¡Soy Fierro! ¿Querés que te muestre cómo funciona el sistema GROWS?",
        },
      ]);
      hasSentGreetingRef.current = true;
    }, 2000);

    return () => {
      if (greetingTimeoutRef.current) {
        window.clearTimeout(greetingTimeoutRef.current);
      }
    };
  }, [hasHydrated]);

  // 🔄 Reemplazado sistema local de intents por conexión con Fierro (n8n)
  const handleUserMessage = useCallback(
    async (rawInput: string) => {
      const trimmed = rawInput.trim();
      if (!trimmed) return;

      setMessages((prev) => [...prev, { sender: "user", text: trimmed }]);
      setInputValue("");
      setShowSuggestions(false);
      setIsTyping(true);

      try {
        const response = await fetch("/api/fierro", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: trimmed,
            session_id: "landing-" + Date.now(),
          }),
        });

        console.log("Respuesta HTTP:", response.status, response.statusText);

        if (!response.ok) {
          setMessages((prev) => [
            ...prev,
            {
              sender: "bot",
              text: "No pude conectar con Fierro. Probá de nuevo en unos minutos.",
            },
          ]);
          setIsTyping(false);
          return;
        }

        const data = await response.json();

        const botText =
          data?.message ||
          data?.display_message ||
          data?.response ||
          "No recibí respuesta de Fierro.";
        const rawButtons = Array.isArray(data?.buttons) ? data.buttons : [];
        const botActions = rawButtons.map((b: any) => ({
          label: b?.label ?? String(b?.text ?? ""),
          section: b?.action ?? "",
        }));

        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: botText,
            actions: botActions.length > 0 ? botActions : undefined,
          },
        ]);
      } catch (err) {
        console.error("Error al conectar con Fierro:", err);
        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "No pude conectar con Fierro. Probá de nuevo en unos minutos.",
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    []
  );

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => {
      const next = !prev;
      if (!prev) {
        setShowSuggestions(true);
      }
      return next;
    });
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = inputValue.trim();
      if (!trimmed) {
        return;
      }
      void handleUserMessage(trimmed);
    },
    [handleUserMessage, inputValue]
  );

  const handleActionClick = useCallback((section: string) => {
    scrollToSection(section);
    setIsOpen(false);
  }, []);

  const handleSuggestedTopic = useCallback(
    (value: string) => {
      void handleUserMessage(value);
    },
    [handleUserMessage]
  );

  const hasUserMessages = messages.some(
    (message) => message.sender === "user"
  );

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="growsbot-overlay"
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTooltip && (
          <motion.div
            key="growsbot-tooltip"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed bottom-28 right-8 z-[9999] rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-800 shadow-lg"
          >
            👋 ¡Hola! Soy <span className="font-bold text-emerald-600">Fierro</span> — tu
            asistente de obra digital.
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="growsbot-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-[60] w-full max-w-sm"
          >
            <div className="rounded-3xl border border-white/30 bg-white/95 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between rounded-t-3xl bg-emerald-600/10 px-6 py-4">
                  <div className="flex items-center gap-4">
                      <div className="relative h-16 w-16 overflow-hidden rounded-full shadow-lg ring-2 ring-white/40">
                        <Image
                          src="/images/gaucho-icon.png"
                          alt="Fierro avatar"
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-slate-900">Fierro</p>
                        <p className="text-sm text-emerald-600">Tu asistente de obra inteligente</p>
                      </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        window.localStorage.removeItem(storageKey);
                        window.localStorage.removeItem(storageLastTopicKey);
                      } catch (error) {
                        console.warn("Fierro: unable to clear stored conversation", error);
                      }
                      window.location.reload();
                    }}
                    className="rounded-full p-1.5 text-gray-400 transition hover:text-gray-700"
                    title="Reiniciar conversación"
                  >
                    ⟳
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-full p-1.5 text-gray-400 transition hover:text-gray-700"
                    aria-label="Cerrar chat"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              {isTyping && (
                <div className="h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-400 animate-pulse rounded-t-lg" />
              )}
              <div className="flex max-h-[440px] flex-col">
                <div
                  ref={listContainerRef}
                  className="flex-1 space-y-3 overflow-y-auto px-6 py-5 text-sm text-slate-700"
                >
                  {messages.map((message, index) => (
                    <motion.div
                      key={`${message.sender}-${index}`}
                      className={`flex flex-col ${
                        message.sender === "user" ? "items-end" : "items-start"
                      }`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl border px-3 py-2 text-sm leading-relaxed ${
                          message.sender === "user"
                            ? "border-emerald-200 bg-emerald-100 text-emerald-800"
                            : "border-gray-200 bg-gray-100 text-gray-800"
                        }`}
                      >
                        {message.sender === "bot" ? (
                          <div
                            className="text-sm leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: message.text.replace(/\n/g, "<br>"),
                            }}
                          />
                        ) : (
                          message.text
                        )}
                      </div>

                      {message.actions && message.actions.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {message.actions.map((action, actionIndex) => (
                            <button
                              key={`${action.label}-${actionIndex}`}
                              type="button"
                              className="rounded-md bg-emerald-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                              onClick={() => handleActionClick(action.section)}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {isTyping && (
                    <motion.div
                      key="typing-indicator"
                      className="flex items-center gap-2"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                    >
                      <div className="rounded-xl border border-gray-200 bg-gray-100 px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          {[0, 1, 2].map((dot) => (
                            <motion.span
                              key={dot}
                              className="h-2 w-2 rounded-full bg-emerald-500"
                              animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                              transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                delay: dot * 0.18,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {showSuggestions && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-3 shadow-sm">
                      <p className="mb-2 text-center text-xs text-gray-500">
                        Ejemplos de lo que podés preguntar:
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {suggestedTopics.map((topic) => (
                          <button
                            key={topic.value}
                            type="button"
                            className="rounded-full border border-emerald-300 bg-white px-3 py-1.5 text-sm font-medium text-emerald-700 shadow-sm transition duration-200 ease-in-out hover:bg-emerald-100"
                            onClick={() => handleSuggestedTopic(topic.value)}
                          >
                            {topic.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 bg-white px-5 py-3">
                <form
                  onSubmit={handleSubmit}
                  className="flex items-center gap-2"
                >
                  <input
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="Preguntame sobre GROWS o elegí un tema..."
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
                    disabled={!inputValue.trim()}
                    aria-label="Enviar mensaje"
                  >
                    Enviar
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={handleToggle}
        className="fixed bottom-6 right-6 z-[50] flex h-24 w-24 items-center justify-center rounded-full border border-white/30 bg-black/40 text-white shadow-xl backdrop-blur-md transition hover:bg-black/55 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        aria-label="Abrir chat"
      >
        <motion.span
          className="relative inline-flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white/80"
          animate={{ scale: isIntroBoost ? 2 : 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 18 }}
        >
          <Image
            src="/images/gaucho-icon.png"
            alt="Abrir Fierro"
            fill
            sizes="80px"
            className="object-cover"
          />
        </motion.span>
      </button>
    </>
  );
}

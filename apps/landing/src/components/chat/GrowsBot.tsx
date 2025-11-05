"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot } from "lucide-react";

import {
  growsBotFallback,
  growsBotInitialGreeting,
  growsBotIntents,
  type GrowsBotIntent,
} from "@/data/growsBotResponses";
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
    match?: GrowsBotIntent;
  }) => void;
};

const storageKey = "grows-bot-conversation";
const storageLastTopicKey = "grows-bot-last-topic";
const tooltipDurationMs = 4000;

const suggestedTopics = [
  { label: "¿Cómo funciona GROWS?", value: "cómo funciona grows" },
  { label: "Problemas comunes de obra", value: "problemas" },
  { label: "Soluciones que ofrece GROWS", value: "soluciones" },
  { label: "Sistema de reputación", value: "reputación" },
  { label: "Planes y precios", value: "precios" },
];

const normalizeText = (value: string) =>
  value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function GrowsBot({ onCommand }: GrowsBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const listContainerRef = useRef<HTMLDivElement>(null);
  const pendingReplyRef = useRef<number>();
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
      console.warn("GROWS Bot: unable to load stored conversation", error);
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
      console.warn("GROWS Bot: unable to persist conversation", error);
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
    return () => {
      if (pendingReplyRef.current) {
        window.clearTimeout(pendingReplyRef.current);
      }
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
        { sender: "bot", text: growsBotInitialGreeting },
      ]);
      hasSentGreetingRef.current = true;
    }, 2000);

    return () => {
      if (greetingTimeoutRef.current) {
        window.clearTimeout(greetingTimeoutRef.current);
      }
    };
  }, [hasHydrated]);

  const matchIntent = useCallback((input: string) => {
    const normalizedInput = normalizeText(input);
    return growsBotIntents.find((intent) =>
      intent.keywords.some((keyword) =>
        normalizedInput.includes(normalizeText(keyword))
      )
    );
  }, []);

  const handleUserMessage = useCallback(
    (rawInput: string) => {
      const trimmed = rawInput.trim();
      if (!trimmed) {
        return;
      }

      setMessages((prev) => [...prev, { sender: "user", text: trimmed }]);
      setInputValue("");
      setShowSuggestions(false);

      if (pendingReplyRef.current) {
        window.clearTimeout(pendingReplyRef.current);
      }

      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(storageLastTopicKey, trimmed);
        } catch (error) {
          console.warn("GROWS Bot: unable to persist last topic", error);
        }
      }

      const matchedIntent = matchIntent(trimmed);
      onCommand?.({ userInput: trimmed, match: matchedIntent });

      setIsTyping(true);
      const replyDelay = Math.floor(Math.random() * 200) + 500;

      pendingReplyRef.current = window.setTimeout(() => {
        const actions =
          matchedIntent?.actions && matchedIntent.actions.length > 0
            ? matchedIntent.actions
            : undefined;

        setMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: matchedIntent?.reply ?? growsBotFallback,
            actions,
          },
        ]);
        setIsTyping(false);
        pendingReplyRef.current = undefined;
      }, replyDelay);
    },
    [matchIntent, onCommand]
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
      handleUserMessage(trimmed);
    },
    [handleUserMessage, inputValue]
  );

  const handleActionClick = useCallback((section: string) => {
    scrollToSection(section);
    setIsOpen(false);
  }, []);

  const handleSuggestedTopic = useCallback(
    (value: string) => {
      handleUserMessage(value);
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
            transition={{ duration: 0.4 }}
            className="fixed bottom-28 right-8 z-[9999] rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-800 shadow-lg"
          >
            👋 ¡Hola! Soy{" "}
            <span className="font-bold text-emerald-600">GROWS·Bot</span> — tu
            asistente de obra digital.
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="growsbot-panel"
            className="fixed bottom-28 right-8 z-[9998] w-[90vw] max-w-[380px] max-h-[600px] overflow-visible rounded-2xl border border-gray-200 bg-white text-gray-900 shadow-2xl"
            style={{ transformOrigin: "bottom right" }}
            initial={{ opacity: 0, scale: 0.94, y: 24, x: 12 }}
            animate={{ opacity: 1, scale: 1, y: -10, x: -10 }}
            exit={{ opacity: 0, scale: 0.94, y: 24, x: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="flex h-full flex-col justify-between overflow-visible">
              <header className="border-b border-gray-200 px-5 py-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-emerald-700">
                      GROWS·Bot
                    </h2>
                    <p className="text-xs text-gray-500">
                      Tu asistente de obra inteligente
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-full p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                    onClick={handleClose}
                    aria-label="Cerrar chat de GROWS·Bot"
                  >
                    ✕
                  </button>
                </div>
              </header>

              <div
                ref={listContainerRef}
                className="flex-1 overflow-y-auto px-5 pb-6 pt-4"
              >
                <div className="flex flex-col gap-3">
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
                        {message.text}
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
        className="fixed bottom-6 right-6 z-[9999] flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl shadow-[0_0_25px_#00b89466] transition-all duration-300 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 md:h-20 md:w-20 animate-pulse"
        aria-label={isOpen ? "Cerrar GROWS·Bot" : "Abrir GROWS·Bot"}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Bot className="h-8 w-8 md:h-10 md:w-10" />
      </button>
    </>
  );
}

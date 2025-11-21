"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X, MessageCircle, Mail } from "lucide-react";

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
const tooltipDurationMs = 8000; // Mostrar tooltip más tiempo
const introBoostDurationMs = 5000; // Animación inicial más larga para llamar atención
const storageLastTopicKey = "fierro-bot-last-topic";

const suggestedTopics = [
  { label: "Quiero invertir en GROWS", value: "quiero invertir en grows" },
  { label: "Contactar al equipo", value: "contactar al equipo comercial" },
  { label: "Soy constructor / arquitecto", value: "soy constructor o arquitecto" },
  { label: "Quiero una demo", value: "quiero agendar una demo" },
  { label: "Quiero crear cuenta FREE", value: "quiero crear cuenta gratis" },
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
  const [showTutorialOverlay, setShowTutorialOverlay] = useState(false);
  const [tutorialCompleted, setTutorialCompleted] = useState(false);

  // Contactos del footer
  const whatsappNumber = "+543413189944"; // (+54) 341 318-9944 sin espacios
  const email = "makeitgrows@gmail.com";

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

  // Activar overlay tutorial después de 3 segundos
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setShowTutorialOverlay(true);
    }, 3000);
    return () => window.clearTimeout(timeout);
  }, []);

  // Cerrar overlay tutorial después de 8 segundos o al hacer clic
  useEffect(() => {
    if (!showTutorialOverlay) return;
    const timeout = window.setTimeout(() => {
      setShowTutorialOverlay(false);
      setTutorialCompleted(true);
      setIsIntroBoost(false);
    }, 8000);
    return () => window.clearTimeout(timeout);
  }, [showTutorialOverlay]);

  const handleCloseTutorial = useCallback(() => {
    setShowTutorialOverlay(false);
    setTutorialCompleted(true);
    setIsIntroBoost(false);
  }, []);

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
          text: "👋 ¡Hola! Soy Fierro, tu asistente de GROWS. ¿En qué puedo ayudarte? Puedo responder sobre inversiones, demos, planes o crear tu cuenta gratuita.",
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

  // Función para detectar email en el mensaje
  const extractEmail = (text: string): string | null => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const match = text.match(emailRegex);
    return match ? match[0] : null;
  };

  // Función para guardar lead en Supabase
  const saveLead = async (email: string, source: string = 'chatbot', message?: string) => {
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          source,
          message: message || '',
          interest_type: source,
        }),
      });
    } catch (error) {
      console.error("Error guardando lead:", error);
    }
  };

  // 🔄 Reemplazado sistema local de intents por conexión con Fierro (n8n)
  const handleUserMessage = useCallback(
    async (rawInput: string) => {
      const trimmed = rawInput.trim();
      if (!trimmed) return;

      setMessages((prev) => [...prev, { sender: "user", text: trimmed }]);
      setInputValue("");
      setShowSuggestions(false);
      setIsTyping(true);

      // Detectar email y guardar lead
      const email = extractEmail(trimmed);
      if (email) {
        await saveLead(email, 'chatbot', trimmed);
      }

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
      {/* Overlay tutorial tipo spotlight */}
      <AnimatePresence>
        {showTutorialOverlay && (
          <motion.div
            key="tutorial-overlay"
            className="fixed inset-0 z-[45] pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onClick={handleCloseTutorial}
          >
            {/* Fondo oscuro con blur */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            
            {/* Spotlight circular en el botón del chatbot */}
            <div className="absolute bottom-6 right-6 w-32 h-32">
              <div className="absolute inset-0 rounded-full bg-white/20 blur-2xl" />
              <div className="absolute inset-0 rounded-full bg-[#F8D24A]/30 blur-xl" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            className="fixed bottom-28 right-8 z-[9999] rounded-lg border-2 border-[#F8D24A] bg-gradient-to-br from-white to-[#F8D24A]/10 px-5 py-3 text-sm font-bold text-[#002E5D] shadow-2xl"
            style={{
              boxShadow: "0 10px 40px rgba(248, 210, 74, 0.4)",
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">👋</span>
              <div>
                <span className="font-bold text-[#002E5D]">¡Hola! Soy Fierro</span>
                <br />
                <span className="text-xs font-semibold text-gray-700">
                  Tu asistente de GROWS. ¿Querés invertir, agendar demo o crear cuenta?
                </span>
              </div>
            </div>
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
              <div className="flex items-center justify-between rounded-t-3xl bg-gradient-to-r from-[#002E5D] to-[#003d7a] px-6 py-4">
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
                        <p className="text-base font-semibold text-white">Fierro</p>
                        <p className="text-sm text-[#F8D24A]">Tu asistente de obra inteligente</p>
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
                <div className="h-1 bg-gradient-to-r from-[#F8D24A] via-[#F4C430] to-[#F8D24A] animate-pulse rounded-t-lg" />
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
                            ? "border-[#002E5D]/30 bg-[#002E5D]/10 text-[#002E5D]"
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
                              className="rounded-md bg-[#002E5D] px-3 py-1 text-xs font-semibold text-white transition hover:bg-[#003d7a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F8D24A]"
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
                              className="h-2 w-2 rounded-full bg-[#002E5D]"
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
                    <div className="rounded-lg border border-[#F8D24A]/30 bg-[#F8D24A]/10 p-3 shadow-sm">
                      <p className="mb-2 text-center text-xs font-semibold text-[#002E5D]">
                        Ejemplos de lo que podés preguntar:
                      </p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {suggestedTopics.map((topic) => (
                          <button
                            key={topic.value}
                            type="button"
                            className="rounded-full border border-[#002E5D]/30 bg-white px-3 py-1.5 text-sm font-medium text-[#002E5D] shadow-sm transition duration-200 ease-in-out hover:bg-[#002E5D]/10 hover:border-[#002E5D]/50"
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
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F8D24A]"
                    placeholder="Escribí tu email o pregunta sobre inversión, demos o planes..."
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-[#002E5D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#003d7a] disabled:cursor-not-allowed disabled:bg-gray-400"
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

      {/* Contenedor de iconos de contacto y botón del chatbot */}
      <div className="fixed bottom-6 right-6 z-[50] flex flex-col items-end gap-3">
        {/* Iconos de contacto - WhatsApp y Email */}
        {(tutorialCompleted || showTutorialOverlay || isOpen) && (
          <motion.div
            key="contact-icons"
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, delay: showTutorialOverlay ? 0.3 : 0 }}
            className="flex flex-col gap-3"
          >
              {/* Botón WhatsApp */}
              <motion.a
                href={`https://wa.me/${whatsappNumber}?text=Hola,%20me%20interesa%20conocer%20más%20sobre%20GROWS`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition-all hover:scale-110 hover:shadow-2xl"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Contactar por WhatsApp"
              >
                {/* Logo WhatsApp SVG */}
                <svg
                  className="h-8 w-8"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </motion.a>

              {/* Botón Email/Gmail */}
              <motion.button
                type="button"
                onClick={() => {
                  window.location.href = `mailto:${email}?subject=Consulta sobre GROWS`;
                }}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-xl transition-all hover:scale-110 hover:shadow-2xl border-2 border-gray-200 cursor-pointer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Enviar email"
              >
                {/* Logo Gmail SVG mejorado */}
                <svg
                  className="h-8 w-8"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Sobre principal - rojo */}
                  <path
                    d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.546l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"
                    fill="#EA4335"
                  />
                  {/* Parte superior del sobre - rojo oscuro */}
                  <path
                    d="M23.898 6L12 14.09 0.102 6.01A1.636 1.636 0 0 1 1.636 4.364H22.364c1.39 0 2.262 1.533 1.534 1.636z"
                    fill="#C5221F"
                  />
                  {/* Triángulo azul característico de Gmail */}
                  <path
                    d="M12 14.09L0.102 6.01A1.636 1.636 0 0 1 1.636 4.364H22.364c1.39 0 2.262 1.533 1.534 1.636L12 14.09z"
                    fill="#4285F4"
                    opacity="0.2"
                  />
                  {/* Línea azul horizontal */}
                  <path
                    d="M0 6L12 14.09L24 6"
                    stroke="#4285F4"
                    strokeWidth="0.5"
                    opacity="0.3"
                  />
                </svg>
              </motion.button>
          </motion.div>
        )}

        {/* Botón principal del chatbot */}
        <motion.button
          type="button"
          onClick={handleToggle}
          className="flex h-24 w-24 items-center justify-center rounded-full border-3 border-[#F8D24A]/80 bg-gradient-to-br from-[#002E5D] to-[#003d7a] text-white shadow-2xl backdrop-blur-md transition-all hover:border-[#F8D24A] hover:shadow-[#F8D24A]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F8D24A]"
        aria-label="Abrir chat"
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: isIntroBoost ? [0, 1.3, 1.15, 1.2, 1] : 1,
          opacity: 1,
          boxShadow: isIntroBoost
            ? [
                "0 0 0px rgba(248, 210, 74, 0)",
                "0 0 40px rgba(248, 210, 74, 0.8)",
                "0 0 60px rgba(248, 210, 74, 1)",
                "0 0 40px rgba(248, 210, 74, 0.8)",
                "0 0 20px rgba(248, 210, 74, 0.6)",
              ]
            : [
                "0 0 20px rgba(248, 210, 74, 0.4)",
                "0 0 30px rgba(248, 210, 74, 0.6)",
                "0 0 20px rgba(248, 210, 74, 0.4)",
              ],
        }}
        transition={
          isIntroBoost
            ? {
                scale: {
                  duration: 1.5,
                  times: [0, 0.3, 0.6, 0.8, 1],
                  ease: "easeOut",
                },
                boxShadow: {
                  duration: 1.5,
                  times: [0, 0.3, 0.6, 0.8, 1],
                  repeat: Infinity,
                  repeatDelay: 2,
                },
              }
            : {
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }
        }
      >
        <motion.span
          className="relative inline-flex h-20 w-20 items-center justify-center overflow-visible rounded-full border-2 border-[#F8D24A]/90"
          animate={{
            scale: isIntroBoost ? [0, 1.2, 1.1, 1.15, 1] : 1,
            rotate: isIntroBoost ? [0, 5, -5, 0] : 0,
          }}
          transition={
            isIntroBoost
              ? {
                  scale: {
                    duration: 1.5,
                    times: [0, 0.3, 0.6, 0.8, 1],
                  },
                  rotate: {
                    duration: 1.5,
                    times: [0, 0.3, 0.6, 1],
                  },
                }
              : {}
          }
        >
          <div className="relative w-[140%] h-[140%] -m-[20%]">
            <Image
              src="/images/gaucho-icon.png"
              alt="Abrir Fierro"
              fill
              sizes="112px"
              className="object-contain"
            />
          </div>
          {/* Glow effect dorado */}
          <motion.div
            className="absolute inset-0 rounded-full bg-[#F8D24A]/40"
            animate={{
              opacity: isIntroBoost ? [0, 0.8, 1, 0.8, 0.6] : [0.3, 0.6, 0.3],
              scale: isIntroBoost ? [1, 1.5, 1.8, 1.5, 1.2] : [1, 1.2, 1],
            }}
            transition={
              isIntroBoost
                ? {
                    duration: 1.5,
                    times: [0, 0.3, 0.6, 0.8, 1],
                    repeat: Infinity,
                    repeatDelay: 2,
                  }
                : {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }
            }
          />
        </motion.span>
        
        {/* Anillo pulsante exterior para llamar atención */}
        {isIntroBoost && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-[#F8D24A]"
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{
              scale: [1, 1.8, 2.2],
              opacity: [0.8, 0.4, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 0.5,
              ease: "easeOut",
            }}
          />
        )}
        </motion.button>
      </div>
    </>
  );
}

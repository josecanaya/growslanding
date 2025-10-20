'use client';

import { useState, useEffect, useRef, type KeyboardEvent } from 'react';
import {
  Send,
  MessageCircle,
  Bot,
  AlertCircle,
  Menu,
  Plus,
  Mic,
  Settings,
  ChevronDown,
} from 'lucide-react';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatSectionProps {
  userName?: string;
}

const SESSION_ID = 'cliente_tecnico_01';

function extractAssistantMessage(payload: unknown): string {
  if (!payload) {
    return 'No recibimos respuesta del flujo.';
  }

  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    return trimmed.length > 0 ? trimmed : 'Respuesta vacia del flujo.';
  }

  if (Array.isArray(payload)) {
    return payload.length > 0
      ? extractAssistantMessage(payload[0])
      : 'Respuesta vacia del flujo.';
  }

  if (typeof payload === 'object') {
    const candidate = payload as Record<string, unknown>;
    const keys = ['message', 'response', 'texto', 'text', 'content', 'data', 'output', 'result'];

    for (const key of keys) {
      if (key in candidate) {
        return extractAssistantMessage(candidate[key]);
      }
    }

    try {
      return JSON.stringify(candidate);
    } catch {
      return 'No fue posible interpretar la respuesta del flujo.';
    }
  }

  return String(payload);
}

export function ChatSection({ userName = 'Usuario' }: ChatSectionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll al ultimo mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus en el input al cargar
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendToN8nWebhook = async (userMessage: string) => {
    setIsTyping(true);
    setError(null);

    try {
      const payload = {
        sessionId: SESSION_ID,
        action: 'sendMessage',
        chatinput: userMessage,
      };

      console.log('➡️ Enviando mensaje a n8n', payload);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Respuesta HTTP:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Respuesta recibida', result);

      if (result?.success === false) {
        throw new Error(result?.error ?? 'La respuesta de n8n no fue exitosa.');
      }

      const botResponse = extractAssistantMessage(result?.data);

      const botMessage: Message = {
        id: Date.now().toString(),
        content: botResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error('⚠️ Error al conectar con n8n:', err);

      const fallbackMessageText = err instanceof Error ? err.message : 'Error desconocido';
      setError(fallbackMessageText);

      const fallbackResponses = [
        `Hola ${userName}! Soy GrowsBot, tu asistente de construccion. Como puedo ayudarte hoy?`,
        `Entendi tu consulta sobre "${userMessage}". Puedo ayudarte con planificacion de obras, gestion de cuadrillas o pagos.`,
        `Revisemos la planificacion de tareas y disponibilidad de cuadrillas para avanzar con tu proyecto.`,
        `Puedo asistirte con gestion de obras, planificacion de tareas, coordinacion de cuadrillas y seguimiento de proyectos. Que tema necesitas?`,
        `En GROWS podes gestionar estos procesos de forma integrada. Queres que te muestre alguna funcionalidad especifica?`,
      ];

      const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];

      const fallbackMessage: Message = {
        id: Date.now().toString(),
        content: randomResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, fallbackMessage]);

      console.warn('n8n webhook no disponible, usando respuesta de fallback');
      console.warn('Verifica que /api/chat y n8n esten activos en http://localhost:5678');
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    try {
      const userMessage: Message = {
        id: Date.now().toString(),
        content: inputValue.trim(),
        isUser: true,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      setError(null);

      sendToN8nWebhook(userMessage.content);
    } catch (err) {
      console.error('Error en handleSendMessage:', err);
      setError('Error al enviar el mensaje');
    }
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar izquierdo - solo conversaciones anteriores */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* Boton nueva conversacion - arriba de todo */}
        <div className="p-4 border-b border-gray-200">
          <button className="w-full bg-[#0C1D36] text-white py-2 px-4 rounded-lg hover:bg-[#132a52] transition-colors text-sm font-medium">
            Nueva conversacion
          </button>
        </div>

        {/* Titulo conversaciones */}
        <div className="px-4 py-2">
          <h2 className="text-lg font-semibold text-gray-800">Conversaciones</h2>
        </div>

        {/* Lista de conversaciones anteriores */}
        <div className="flex-1 p-4 space-y-2">
          <div className="p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
            <p className="text-sm text-gray-600 truncate">Planificacion de obra nueva</p>
            <p className="text-xs text-gray-400">Hace 2 horas</p>
          </div>
          <div className="p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
            <p className="text-sm text-gray-600 truncate">Consulta sobre cuadrillas</p>
            <p className="text-xs text-gray-400">Ayer</p>
          </div>
          <div className="p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
            <p className="text-sm text-gray-600 truncate">Avance de tareas</p>
            <p className="text-xs text-gray-400">Hace 3 dias</p>
          </div>
        </div>

        {/* Menu inferior */}
        <div className="p-4 border-t border-gray-200 space-y-3 text-sm text-gray-600">
          <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100">
            <span className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              GrowsBot
            </span>
            <ChevronDown className="w-4 h-4" />
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100">
            <AlertCircle className="w-4 h-4" />
            Reportar problema
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100">
            <Settings className="w-4 h-4" />
            Configuracion
          </button>
        </div>
      </div>

      {/* Area principal del chat */}
      <div className="flex-1 flex flex-col">
        {/* Header superior */}
        <div className="h-16 border-b border-gray-200 px-6 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Menu className="w-5 h-5 text-gray-500" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-gray-900">Cliente tecnico</h1>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  En linea
                </span>
              </div>
              <p className="text-sm text-gray-500">Workflow conectado a n8n</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm">
              <MessageCircle className="w-4 h-4" />
              Historial
            </button>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm">
              <Bot className="w-4 h-4" />
              Automations
            </button>
          </div>
        </div>

        {/* Contenido del chat */}
        <div className="flex-1 relative overflow-hidden">
          {/* Fondo decorativo */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#FFE9A9]/30 rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-20 w-[400px] h-[400px] bg-[#DBEAFF]/40 rounded-full blur-3xl" />
          </div>

          {/* Contenedor central */}
          <div className="relative h-full overflow-y-auto">
            {/* Header con cards de sugerencias */}
            <div className="pt-16 pb-12">
              <div className="max-w-[750px] w-full mx-auto px-6">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-lg font-semibold text-gray-900">Sugerencias rapidas</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[#0C1D36] text-white flex items-center justify-center">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900">Estado de obra</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Consulta el avance actual de tus obras o los hitos pendientes.
                    </p>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[#FFE9A9] text-[#955400] flex items-center justify-center">
                        <Bot className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900">Cuadrillas</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Organiza disponibilidad, asignaciones y seguimientos de tus equipos.
                    </p>
                  </div>

                  <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[#DBEAFF] text-[#1B57A6] flex items-center justify-center">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900">Pagos y materiales</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Controla pagos pendientes y solicitudes de materiales para cada obra.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mensajes */}
            {messages.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-center mb-8">
                  <h1 className="text-3xl md:text-4xl font-semibold text-[#0C1D36] mb-4">
                    Hola, {userName}
                  </h1>
                  <p className="text-lg text-gray-600">En que puedo ayudarte hoy?</p>
                </div>
              </div>
            )}

            {messages.length > 0 && (
              <div className="pt-12 pb-32">
                <div className="max-w-[750px] w-full mx-auto space-y-6 px-6">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-3 ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!message.isUser && (
                        <div className="w-6 h-6 flex items-center justify-center rounded-full bg-yellow-400 text-gray-800 font-bold text-xs flex-shrink-0 mt-1">
                          G
                        </div>
                      )}

                      <div
                        className={`max-w-[70%] px-5 py-3 rounded-2xl ${
                          message.isUser ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 flex items-center justify-center rounded-full bg-yellow-400 text-gray-800 font-bold text-xs flex-shrink-0 mt-1">
                        G
                      </div>
                      <div className="bg-gray-100 text-gray-800 rounded-2xl px-5 py-3">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                          <div
                            className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"
                            style={{ animationDelay: '0.2s' }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"
                            style={{ animationDelay: '0.4s' }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}

            {/* Input */}
            {messages.length === 0 ? (
              <div className="absolute top-1/2 left-0 right-0 transform translate-y-8 flex items-center justify-center px-6">
                <div className="flex items-center bg-white rounded-full border border-gray-200 shadow-sm px-6 py-3 w-full max-w-[750px]">
                  <Plus className="w-5 h-5 text-gray-400 mr-3" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Pregunta a GROWS"
                    className="flex-1 bg-transparent outline-none placeholder:text-gray-400 text-gray-800 text-sm"
                    disabled={isTyping}
                  />
                  <span className="text-gray-400 text-sm mr-3">Herramientas</span>
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2">
                    <Mic className="w-5 h-5 text-gray-400" />
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    className="bg-[#0C1D36] text-white p-2 rounded-full hover:bg-[#132a52] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="fixed bottom-12 left-64 right-0 flex items-center justify-center px-6">
                <div className="flex items-center bg-white rounded-full border border-gray-200 shadow-sm px-6 py-3 w-full max-w-[750px]">
                  <Plus className="w-5 h-5 text-gray-400 mr-3" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escribi tu mensaje..."
                    className="flex-1 bg-transparent outline-none placeholder:text-gray-400 text-gray-800 text-sm"
                    disabled={isTyping}
                  />
                  <span className="text-gray-400 text-sm mr-3">Herramientas</span>
                  <button className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2">
                    <Mic className="w-5 h-5 text-gray-400" />
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    className="bg-[#0C1D36] text-white p-2 rounded-full hover:bg-[#132a52] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center px-6 pointer-events-none">
                <p className="bg-rose-50 text-rose-600 text-xs px-3 py-2 rounded-lg border border-rose-200 shadow-sm">
                  Ocurrio un problema: {error}. Revisa la consola para mas detalles.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

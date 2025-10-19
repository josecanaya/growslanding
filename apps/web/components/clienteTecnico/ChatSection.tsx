'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Bot, AlertCircle, Menu, Plus, Mic, Settings, ChevronDown } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatSectionProps {
  userName?: string;
}

export function ChatSection({ userName = 'Usuario' }: ChatSectionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll al último mensaje
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

  // Enviar mensaje al webhook de n8n
  const sendToN8nWebhook = async (userMessage: string) => {
    setIsTyping(true);
    setError(null);
    
    try {
      // URL del webhook de n8n (nueva URL específica)
      const webhookUrl = 'http://localhost:5678/webhook/767d1a90-3a2a-4fdc-b63a-2b94210f6f7d/chat';
      
      console.log('Enviando mensaje a n8n webhook:', webhookUrl);
      console.log('Datos enviados:', {
        message: userMessage,
        userName: userName,
        timestamp: new Date().toISOString(),
        sessionId: Date.now().toString()
      });
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          userName: userName,
          timestamp: new Date().toISOString(),
          sessionId: Date.now().toString() // ID único para la sesión
        }),
      });

      console.log('Respuesta recibida:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Datos de respuesta:', data);
      
      // Crear mensaje del bot con la respuesta de n8n
      // n8n puede devolver la respuesta en diferentes campos
      const botResponse = data.response || 
                         data.message || 
                         data.output || 
                         data.result || 
                         data.data?.response ||
                         'Gracias por tu mensaje. ¿En qué más puedo ayudarte?';
      
      const botMessage: Message = {
        id: Date.now().toString(),
        content: botResponse,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
      
    } catch (err) {
      console.error('Error al enviar mensaje a n8n:', err);
      
      // Respuesta de fallback más inteligente basada en el mensaje
      const fallbackResponses = [
        `Hola ${userName}! Soy GrowsBot, tu asistente de construcción. ¿En qué puedo ayudarte hoy?`,
        `Perfecto, entiendo tu consulta sobre "${userMessage}". Te puedo ayudar con planificación de obras, gestión de cuadrillas, o cualquier tema relacionado con construcción.`,
        `Excelente pregunta! Para proyectos de construcción como el tuyo, te recomiendo revisar la planificación de tareas y el estado de las cuadrillas disponibles.`,
        `Como asistente especializado en construcción, puedo ayudarte con: gestión de obras, planificación de tareas, coordinación de cuadrillas, y seguimiento de proyectos. ¿Qué te interesa más?`,
        `Entiendo perfectamente. En GROWS, puedes gestionar todos estos aspectos de manera integrada. ¿Te gustaría que te muestre alguna funcionalidad específica?`
      ];
      
      const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      
      const fallbackMessage: Message = {
        id: Date.now().toString(),
        content: randomResponse,
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
      setIsTyping(false);
      
      // Mostrar error solo en consola, no al usuario
      console.warn('n8n webhook no disponible, usando respuesta de fallback');
      console.warn('Asegúrate de que n8n esté corriendo en http://localhost:5678');
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    try {
      const userMessage: Message = {
        id: Date.now().toString(),
        content: inputValue.trim(),
        isUser: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      setError(null);
      
      // Enviar mensaje al webhook de n8n
      sendToN8nWebhook(inputValue.trim());
    } catch (err) {
      console.error('Error en handleSendMessage:', err);
      setError('Error al enviar el mensaje');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar izquierdo - Solo conversaciones anteriores */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
        {/* Botón nueva conversación - ARRIBA DE TODO */}
        <div className="p-4 border-b border-gray-200">
          <button className="w-full bg-[#0C1D36] text-white py-2 px-4 rounded-lg hover:bg-[#132a52] transition-colors text-sm font-medium">
            Nueva conversación
          </button>
        </div>

        {/* Título conversaciones */}
        <div className="px-4 py-2">
          <h2 className="text-lg font-semibold text-gray-800">Conversaciones</h2>
        </div>

        {/* Lista de conversaciones anteriores */}
        <div className="flex-1 p-4 space-y-2">
          <div className="p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
            <p className="text-sm text-gray-600 truncate">Planificación de obra nueva</p>
            <p className="text-xs text-gray-400">Hace 2 horas</p>
          </div>
          <div className="p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
            <p className="text-sm text-gray-600 truncate">Consulta sobre cuadrillas</p>
            <p className="text-xs text-gray-400">Ayer</p>
          </div>
          <div className="p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
            <p className="text-sm text-gray-600 truncate">Seguimiento de tareas</p>
            <p className="text-xs text-gray-400">Hace 3 días</p>
          </div>
          <div className="p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
            <p className="text-sm text-gray-600 truncate">Reporte de avances</p>
            <p className="text-xs text-gray-400">Hace 1 semana</p>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        {/* Pelotita GROWS Pro MUCHO más grande y más hacia adentro */}
        <div className="absolute top-8 right-8 z-20">
          <div className="w-20 h-20 bg-[#0C1D36] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
            GROWS Pro
          </div>
        </div>

        {/* Área de chat */}
        <div className="flex-1 relative">
          {/* Mostrar error si existe */}
          {error && (
            <div className="fixed top-20 right-4 bg-red-50 border border-red-200 rounded-lg p-4 max-w-sm z-50">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-red-700 text-sm">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Estado vacío - Saludo reducido y posicionado arriba del chat */}
          {messages.length === 0 && (
            <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex flex-col items-center justify-center px-6">
              <div className="text-center mb-8">
                {/* Saludo principal reducido y centrado arriba del chat */}
                <h1 className="text-3xl md:text-4xl font-semibold text-[#0C1D36] mb-4">
                  Hola, {userName}
                </h1>
                {/* Subtítulo pequeño */}
                <p className="text-lg text-gray-600">
                  ¿En qué puedo ayudarte hoy?
                </p>
              </div>
            </div>
          )}

          {/* Contenedor de mensajes */}
          {messages.length > 0 && (
            <div className="pt-12 pb-32">
              <div className="max-w-[750px] w-full mx-auto space-y-6 px-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 ${
                      message.isUser ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {/* Ícono del bot (solo para mensajes del bot) */}
                    {!message.isUser && (
                      <div className="w-6 h-6 flex items-center justify-center rounded-full bg-yellow-400 text-gray-800 font-bold text-xs flex-shrink-0 mt-1">
                        G
                      </div>
                    )}
                    
                    {/* Mensaje */}
                    <div
                      className={`max-w-[70%] px-5 py-3 rounded-2xl ${
                        message.isUser
                          ? 'bg-gray-800 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                ))}
                
                {/* Indicador de escritura */}
                {isTyping && (
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 flex items-center justify-center rounded-full bg-yellow-400 text-gray-800 font-bold text-xs flex-shrink-0 mt-1">
                      G
                    </div>
                    <div className="bg-gray-100 text-gray-800 rounded-2xl px-5 py-3">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}

          {/* Input posicionado exactamente debajo del saludo */}
          {messages.length === 0 ? (
            <div className="absolute top-1/2 left-0 right-0 transform translate-y-8 flex items-center justify-center px-6">
              <div className="flex items-center bg-white rounded-full border border-gray-200 shadow-sm px-6 py-3 w-full max-w-[750px]">
                <Plus className="w-5 h-5 text-gray-400 mr-3" />
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
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
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribí tu mensaje..."
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
        </div>
      </div>
    </div>
  );
}
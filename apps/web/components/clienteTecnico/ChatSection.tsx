'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Bot, AlertCircle } from 'lucide-react';

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

  // Simular respuesta del bot con manejo de errores
  const simulateBotResponse = (userMessage: string) => {
    setIsTyping(true);
    setError(null);
    
    try {
      setTimeout(() => {
        const responses = [
          `Hola ${userName}! Soy GrowsBot, tu asistente de construcción. ¿En qué puedo ayudarte hoy?`,
          `Perfecto, entiendo tu consulta sobre "${userMessage}". Te puedo ayudar con planificación de obras, gestión de cuadrillas, o cualquier tema relacionado con construcción.`,
          `Excelente pregunta! Para proyectos de construcción como el tuyo, te recomiendo revisar la planificación de tareas y el estado de las cuadrillas disponibles.`,
          `Como asistente especializado en construcción, puedo ayudarte con: gestión de obras, planificación de tareas, coordinación de cuadrillas, y seguimiento de proyectos. ¿Qué te interesa más?`,
          `Entiendo perfectamente. En GROWS, puedes gestionar todos estos aspectos de manera integrada. ¿Te gustaría que te muestre alguna funcionalidad específica?`
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        const botMessage: Message = {
          id: Date.now().toString(),
          content: randomResponse,
          isUser: false,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);
      }, 1500 + Math.random() * 1000);
    } catch (err) {
      console.error('Error en simulateBotResponse:', err);
      setError('Error al procesar la respuesta del bot');
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
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);
      setInputValue('');
      setError(null);
      
      // Simular respuesta del bot
      simulateBotResponse(inputValue.trim());
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
    <div className="min-h-screen bg-white relative">
      {/* Mostrar error si existe */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 max-w-sm z-50">
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

      {/* Estado vacío - Saludo inicial estilo Gemini */}
      {messages.length === 0 && (
        <div className="flex items-center justify-center min-h-screen px-6">
          <div className="text-center animate-fade-in">
            {/* Saludo principal centrado */}
            <h1 
              className="text-4xl md:text-5xl font-semibold text-[#0C1D36] mb-8"
              style={{ fontFamily: 'Rubik, sans-serif' }}
            >
              Hola, {userName}
            </h1>
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
                className={`flex items-start gap-3 animate-fade-in ${
                  message.isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                {/* Ícono del bot (solo para mensajes del bot) */}
                {!message.isUser && (
                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-[#E8C547] text-[#0C1D36] font-bold text-xs animate-fade-in flex-shrink-0 mt-1">
                    G
                  </div>
                )}
                
                {/* Mensaje */}
                <div
                  className={`max-w-[70%] px-5 py-3 rounded-2xl ${
                    message.isUser
                      ? 'bg-[#0C1D36] text-white'
                      : 'bg-[#F7F8FA] text-[#0C1D36] border border-gray-100'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
              </div>
            ))}
            
            {/* Indicador de escritura */}
            {isTyping && (
              <div className="flex items-start gap-3 animate-fade-in">
                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-[#E8C547] text-[#0C1D36] font-bold text-xs flex-shrink-0 mt-1">
                  G
                </div>
                <div className="bg-[#F7F8FA] text-[#0C1D36] border border-gray-100 rounded-2xl px-5 py-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-[#E8C547] rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-[#E8C547] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-[#E8C547] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Input inferior - centrado cuando no hay mensajes, fijo cuando hay conversación */}
      {messages.length === 0 ? (
        <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center px-6">
          <div className="flex items-center bg-white rounded-full border border-gray-200 shadow-sm px-6 py-3 w-full max-w-[750px] md:max-w-[750px] max-w-[95%]">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Pregunta a GrowsBot"
              className="flex-1 bg-transparent outline-none placeholder:text-gray-400 text-[#0C1D36] text-sm"
              disabled={isTyping}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="bg-[#0C1D36] text-white p-3 rounded-full hover:bg-[#132a52] transition-colors ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="fixed bottom-12 left-0 right-0 flex items-center justify-center px-6">
          <div className="flex items-center bg-white rounded-full border border-gray-200 shadow-sm px-6 py-3 w-full max-w-[750px] md:max-w-[750px] max-w-[95%]">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribí tu mensaje..."
              className="flex-1 bg-transparent outline-none placeholder:text-gray-400 text-[#0C1D36] text-sm"
              disabled={isTyping}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              className="bg-[#0C1D36] text-white p-3 rounded-full hover:bg-[#132a52] transition-colors ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Responsive adjustments */}
      <style jsx>{`
        @media (max-width: 768px) {
          .max-w-\\[750px\\] {
            max-width: 90%;
          }
          .pt-12 {
            padding-top: 3rem;
          }
        }
      `}</style>
    </div>
  );
}
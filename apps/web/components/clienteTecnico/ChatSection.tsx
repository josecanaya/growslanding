'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Building2, DollarSign, CheckSquare, User, ArrowRight } from 'lucide-react';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
  action?: {
    type: 'navigate' | 'suggest';
    target: string;
    label: string;
  };
}

interface ChatSectionProps {
  onNavigate?: (section: string) => void;
}

export function ChatSection({ onNavigate }: ChatSectionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mensaje inicial automático
  useEffect(() => {
    const initialMessage: Message = {
      id: 1,
      text: "¡Hola! 👋 Soy GrowsBot, tu asistente inteligente para gestión de obras. Puedo ayudarte a navegar por el panel, gestionar tareas, revisar obras, validar trabajos y mucho más. ¿En qué puedo ayudarte hoy?",
      isUser: false,
      timestamp: new Date()
    };
    setMessages([initialMessage]);
  }, []);

  // Scroll automático al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getBotResponse = (userMessage: string): { text: string; action?: Message['action'] } => {
    const message = userMessage.toLowerCase();

    // Navegación por secciones
    if (message.includes('obras') || message.includes('proyecto') || message.includes('construcción')) {
      return {
        text: "🏗️ Perfecto, te llevo a la sección de Obras donde puedes:\n• Ver todas tus obras activas\n• Crear nuevos proyectos\n• Gestionar tareas por etapa\n• Revisar el progreso\n\n¿Te gustaría que te muestre cómo crear una nueva obra?",
        action: { type: 'navigate', target: 'obras', label: 'Ir a Obras' }
      };
    }

    if (message.includes('validar') || message.includes('revisar') || message.includes('control')) {
      return {
        text: "✅ Te llevo a Validar Tareas donde puedes:\n• Revisar trabajos completados\n• Aprobar o rechazar tareas\n• Dejar comentarios y calificaciones\n• Subir evidencias fotográficas\n\n¿Tienes tareas pendientes de validación?",
        action: { type: 'navigate', target: 'validar', label: 'Ir a Validar Tareas' }
      };
    }

    if (message.includes('presupuesto') || message.includes('costo') || message.includes('dinero') || message.includes('gasto')) {
      return {
        text: "💰 Te muestro la sección de Presupuesto donde puedes:\n• Ver costos por obra\n• Calcular presupuestos\n• Revisar gastos por etapa\n• Generar reportes financieros\n\n¿Necesitas calcular el costo de alguna obra específica?",
        action: { type: 'navigate', target: 'presupuesto', label: 'Ir a Presupuesto' }
      };
    }

    if (message.includes('cuenta') || message.includes('perfil') || message.includes('configuración')) {
      return {
        text: "👤 Te llevo a tu Cuenta donde puedes:\n• Ver tu información personal\n• Configurar notificaciones\n• Cambiar contraseña\n• Revisar historial de actividades\n\n¿Qué configuración te gustaría revisar?",
        action: { type: 'navigate', target: 'cuenta', label: 'Ir a Cuenta' }
      };
    }

    // Consultas específicas sobre tareas
    if (message.includes('tarea') && (message.includes('crear') || message.includes('agregar') || message.includes('nueva'))) {
      return {
        text: "🔨 Para crear una nueva tarea:\n1. Ve a la sección 'Obras'\n2. Selecciona una obra\n3. Haz clic en 'Agregar Tarea'\n4. Elige la etapa (Estructura, Obra Gris, Terminaciones)\n5. Selecciona el tipo de trabajo\n6. Configura cantidad y líder\n\n¿Te guío paso a paso?",
        action: { type: 'navigate', target: 'obras', label: 'Crear Nueva Tarea' }
      };
    }

    if (message.includes('tarea') && (message.includes('estado') || message.includes('progreso') || message.includes('avance'))) {
      return {
        text: "📊 Para revisar el estado de las tareas:\n• Ve a 'Obras' para ver el progreso general\n• Cada obra muestra % completado\n• Las tareas tienen estados: Pendiente, En Progreso, Completada\n• Puedes filtrar por etapa o líder\n\n¿Quieres revisar alguna obra específica?",
        action: { type: 'navigate', target: 'obras', label: 'Ver Estado de Tareas' }
      };
    }

    // Consultas sobre obras
    if (message.includes('obra') && (message.includes('nueva') || message.includes('crear') || message.includes('iniciar'))) {
      return {
        text: "🏗️ Para crear una nueva obra:\n1. Ve a la sección 'Obras'\n2. Haz clic en el botón '+' (Crear Proyecto)\n3. Completa: Nombre, Ubicación, Fechas\n4. La obra se creará con 3 etapas básicas\n5. Luego puedes agregar tareas específicas\n\n¿Te ayudo a crear tu primera obra?",
        action: { type: 'navigate', target: 'obras', label: 'Crear Nueva Obra' }
      };
    }

    // Consultas sobre validación
    if (message.includes('pendiente') || message.includes('esperando') || message.includes('revisión')) {
      return {
        text: "⏳ Tienes tareas pendientes de validación:\n• Revoque - Obra #238 (Juan Pérez)\n• Instalación eléctrica - Obra #241 (María López)\n• Mampostería - Obra #245 (Carlos Ruiz)\n\nVe a 'Validar Tareas' para revisarlas y aprobarlas.",
        action: { type: 'navigate', target: 'validar', label: 'Revisar Tareas Pendientes' }
      };
    }

    // Consultas sobre presupuesto
    if (message.includes('cuánto') || message.includes('costo') || message.includes('precio')) {
      return {
        text: "💰 Para calcular costos:\n• Ve a 'Presupuesto'\n• Selecciona una obra\n• El sistema calcula automáticamente:\n  - Costo por tarea (cantidad × coeficiente)\n  - Días estimados de trabajo\n  - Costo total por etapa\n\n¿Quieres calcular el presupuesto de alguna obra?",
        action: { type: 'navigate', target: 'presupuesto', label: 'Calcular Presupuesto' }
      };
    }

    // Sugerencias de navegación
    if (message.includes('ayuda') || message.includes('qué puedo') || message.includes('opciones')) {
      return {
        text: "🤖 Puedo ayudarte con:\n\n📋 **Navegación:**\n• 'Llévame a obras' - Gestionar proyectos\n• 'Quiero validar tareas' - Revisar trabajos\n• 'Muéstrame el presupuesto' - Ver costos\n• 'Ve a mi cuenta' - Configuración\n\n🔧 **Acciones:**\n• 'Crear nueva obra'\n• 'Agregar tarea'\n• 'Revisar progreso'\n• 'Calcular costos'\n\n¿Qué te gustaría hacer?",
        action: undefined
      };
    }

    // Respuestas inteligentes por defecto
    const smartResponses = [
      {
        text: "Entiendo que necesitas ayuda. Puedo guiarte a cualquier sección del panel. ¿Te gustaría que te lleve a Obras, Validar Tareas, Presupuesto o Cuenta?",
        action: { type: 'suggest', target: 'obras', label: 'Sugerencias' }
      },
      {
        text: "Estoy aquí para ayudarte a navegar por el sistema. Puedes pedirme que te lleve a cualquier sección o que te explique cómo hacer algo específico. ¿Qué necesitas?",
        action: undefined
      },
      {
        text: "Como tu asistente, puedo ayudarte a gestionar obras, validar tareas, revisar presupuestos y configurar tu cuenta. ¿En qué sección te gustaría que te ayude?",
        action: undefined
      }
    ];
    
    return smartResponses[Math.floor(Math.random() * smartResponses.length)];
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simular delay de respuesta como ChatGPT
    setTimeout(() => {
      const response = getBotResponse(inputText);
      const botResponse: Message = {
        id: messages.length + 2,
        text: response.text,
        isUser: false,
        timestamp: new Date(),
        action: response.action
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000); // 1-3 segundos de delay
  };

  const handleActionClick = (action: Message['action']) => {
    if (action && onNavigate) {
      onNavigate(action.target);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primario to-primario/90 px-6 py-4 text-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-acento rounded-full flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-primario" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">GrowsBot</h2>
              <p className="text-sm text-white/80">Asistente inteligente para gestión de obras</p>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex items-start space-x-2 max-w-[80%]">
                {!message.isUser && (
                  <div className="w-8 h-8 bg-acento rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <MessageCircle className="h-4 w-4 text-primario" />
                  </div>
                )}
                <div
                  className={`
                    px-4 py-3 rounded-2xl shadow-sm
                    ${message.isUser
                      ? 'bg-primario text-white rounded-br-md'
                      : 'bg-white text-primario border border-gray-200 rounded-bl-md'
                    }
                  `}
                >
                  <p className="text-sm whitespace-pre-line leading-relaxed">{message.text}</p>
                  
                  {/* Action Button */}
                  {message.action && (
                    <button
                      onClick={() => handleActionClick(message.action)}
                      className="mt-3 bg-acento text-primario px-4 py-2 rounded-lg text-sm font-medium hover:bg-acento/90 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <span>{message.action.label}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                  
                  <p className={`text-xs mt-2 ${message.isUser ? 'text-white/70' : 'text-primario/60'}`}>
                    {message.timestamp.toLocaleTimeString('es-ES', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 bg-acento rounded-full flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-primario" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primario/60 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primario/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primario/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white px-6 py-4 border-t border-gray-200">
          <div className="flex space-x-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje... (ej: 'Llévame a obras', 'Crear nueva tarea')"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primario focus:border-transparent text-primario placeholder-primario/50"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isTyping}
              className="bg-primario text-white px-6 py-3 rounded-xl hover:bg-primario/90 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>Enviar</span>
            </button>
          </div>
          
          {/* Quick Actions */}
          <div className="mt-3 flex flex-wrap gap-2">
            {['Llévame a obras', 'Validar tareas', 'Ver presupuesto', 'Crear nueva obra'].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setInputText(suggestion)}
                className="text-xs bg-gray-100 text-primario px-3 py-1 rounded-full hover:bg-gray-200 transition-colors duration-200"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

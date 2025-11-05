'use client';

import { AlertTriangle, Wrench, TrendingDown, ArrowRight, CheckCircle, Zap, Users, BarChart3, Bot, Shield, Calendar, CreditCard, MessageCircle, Clock, Lightbulb } from 'lucide-react';

// Componente para conversaciones estilo WhatsApp
function WhatsAppChat({ 
  icon: Icon, 
  messages, 
  delay = 0, 
  contact,
  lastSeen = 'en línea'
}: { 
  icon: React.ComponentType<any>, 
  messages: Array<{ text: string, time: string, sent: boolean, delivered?: boolean, read?: boolean }>,
  delay?: number, 
  contact: string,
  lastSeen?: string
}) {
  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
      style={{
        animationDelay: `${delay}ms`,
        animation: 'fadeInUp 0.6s ease-out forwards',
        opacity: 0,
      }}
    >
      {/* Header estilo WhatsApp */}
      <div className="bg-[#075E54] px-3 py-2.5 flex items-center gap-3">
        <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-[#075E54]" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-white truncate">{contact}</h4>
          <p className="text-xs text-green-100">{lastSeen}</p>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="text-xs text-green-100">Activo</span>
        </div>
      </div>
      
      {/* Área de mensajes */}
      <div className="p-3 bg-[#ECE5DD] space-y-2 min-h-[180px]">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.sent ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-2.5 py-1.5 rounded-lg shadow-sm ${
              message.sent 
                ? 'bg-[#DCF8C6] rounded-br-none' 
                : 'bg-white rounded-bl-none'
            }`}>
              <p className="text-sm text-gray-800 leading-relaxed">{message.text}</p>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <p className="text-[10px] text-gray-500">{message.time}</p>
                {message.sent && (
                  <div className="flex items-center">
                    {message.delivered && (
                      <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                      </svg>
                    )}
                    {message.read && (
                      <svg className="w-3 h-3 text-blue-500 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                      </svg>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function IntegratedSolutionSection() {
  // Datos de conversaciones estilo WhatsApp
  const whatsappChats = [
    {
      icon: Users,
      contact: 'Equipo Obra Casa',
      lastSeen: 'en línea',
      delay: 0,
      messages: [
        { text: 'Se atrasó el revoque otra vez', time: '10:23', sent: false, delivered: false },
        { text: 'No coordinamos con el plomero 😓', time: '10:23', sent: false, delivered: false },
        { text: '¿Cuándo puede venir?', time: '10:24', sent: true, delivered: true, read: true },
        { text: 'Recién el jueves...', time: '10:25', sent: false, delivered: false }
      ]
    },
    {
      icon: AlertTriangle,
      contact: 'Capataz Condominio',
      lastSeen: 'hace 2 min',
      delay: 200,
      messages: [
        { text: 'El cliente pregunta cuánto falta', time: '11:45', sent: true, delivered: true, read: true },
        { text: 'No tengo idea, nadie me dice nada', time: '11:47', sent: false, delivered: false },
        { text: 'Necesitamos un cronograma urgente', time: '11:48', sent: true, delivered: true, read: false }
      ]
    },
    {
      icon: MessageCircle,
      contact: 'Cliente Local',
      lastSeen: 'escribiendo...',
      delay: 400,
      messages: [
        { text: '¿Cómo va el presupuesto?', time: '14:30', sent: false, delivered: false },
        { text: '¿Cuánto llevamos gastado?', time: '14:31', sent: false, delivered: false },
        { text: 'Déjame revisar y te confirmo', time: '14:35', sent: true, delivered: true, read: true }
      ]
    }
  ];

  const comparisonData = [
    {
      category: "Planificación",
      problem: {
        title: "Métodos Informales",
        description: "Ausencia de planificación sistemática y trazabilidad",
        icon: AlertTriangle,
        color: "text-grows-error",
        bgColor: "bg-red-50",
        borderColor: "border-red-200"
      },
      solution: {
        title: "Cronogramas Automáticos",
        description: "Planificación inteligente con CPM que se ajusta automáticamente",
        icon: Calendar,
        color: "text-grows-primary",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200"
      }
    },
    {
      category: "Herramientas",
      problem: {
        title: "Herramientas Inadecuadas",
        description: "Plataformas pensadas solo para grandes constructoras",
        icon: Wrench,
        color: "text-grows-warning",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200"
      },
      solution: {
        title: "Gestión Centralizada",
        description: "Un solo panel B2B para todas tus obras y socios",
        icon: Users,
        color: "text-grows-success",
        bgColor: "bg-green-50",
        borderColor: "border-green-200"
      }
    },
    {
      category: "Control",
      problem: {
        title: "Consecuencias Operativas",
        description: "Sobrecostos, baja productividad y conflictos",
        icon: TrendingDown,
        color: "text-grows-error",
        bgColor: "bg-red-50",
        borderColor: "border-red-200"
      },
      solution: {
        title: "GrowsBot IA",
        description: "Asistente inteligente 24/7 con optimizaciones automáticas",
        icon: Bot,
        color: "text-grows-primary",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200"
      }
    },
    {
      category: "Comunicación",
      problem: {
        title: "Coordinación Deficiente",
        description: "Falta de comunicación entre equipos y socios",
        icon: AlertTriangle,
        color: "text-grows-error",
        bgColor: "bg-red-50",
        borderColor: "border-red-200"
      },
      solution: {
        title: "Comunicación Integrada",
        description: "Chat interno, notificaciones automáticas y reportes compartidos",
        icon: Users,
        color: "text-grows-success",
        bgColor: "bg-green-50",
        borderColor: "border-green-200"
      }
    },
    {
      category: "Reportes",
      problem: {
        title: "Falta de Datos",
        description: "Sin información para tomar decisiones informadas",
        icon: BarChart3,
        color: "text-grows-text-secondary",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200"
      },
      solution: {
        title: "Reportes Automáticos",
        description: "Dashboards en tiempo real con KPIs y métricas de rendimiento",
        icon: BarChart3,
        color: "text-grows-success",
        bgColor: "bg-green-50",
        borderColor: "border-green-200"
      }
    },
    {
      category: "Pagos",
      problem: {
        title: "Gestión Manual",
        description: "Procesos de pago lentos y propensos a errores",
        icon: CreditCard,
        color: "text-grows-error",
        bgColor: "bg-red-50",
        borderColor: "border-red-200"
      },
      solution: {
        title: "Pagos Automatizados",
        description: "Validación de tareas dispara pagos automáticos y actualiza KPIs",
        icon: CreditCard,
        color: "text-grows-success",
        bgColor: "bg-green-50",
        borderColor: "border-green-200"
      }
    }
  ];


  return (
    <>
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out;
        }
      `}</style>
      
      <section id="solution" className="py-20 bg-grows-surface">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          
          {/* Header Principal */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-grows-background border border-grows-border rounded-full mb-8">
              <Zap className="h-4 w-4 text-grows-primary" />
              <span className="text-sm font-semibold text-grows-text-primary">Solución Integral</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-grows-text-primary mb-6 leading-tight">
              De problemas comunes a <span className="text-grows-primary">gestión profesional</span>
            </h2>
            <p className="text-lg text-grows-text-secondary max-w-3xl mx-auto leading-relaxed mb-16">
              GROWS transforma la gestión de obras con tecnología enterprise accesible para estudios de arquitectura y constructoras
            </p>

            {/* Chats Individuales */}
            <div className="max-w-6xl mx-auto mb-16">
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-grows-text-primary mb-2">Problemas reales de obras pequeñas</h3>
                <p className="text-grows-text-secondary">Conversaciones típicas que enfrentan profesionales del sector</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {whatsappChats.map((chat, index) => (
                  <WhatsAppChat 
                    key={index}
                    icon={chat.icon}
                    messages={chat.messages}
                    delay={chat.delay}
                    contact={chat.contact}
                    lastSeen={chat.lastSeen}
                  />
                ))}
              </div>
            </div>

            {/* Bloque de Transición */}
            <div className="bg-gradient-to-r from-grows-background to-grows-neutral rounded-2xl p-8 mb-16 max-w-4xl mx-auto">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-12 h-12 bg-grows-primary rounded-full flex items-center justify-center">
                  <Lightbulb className="w-6 h-6 text-grows-secondary" />
                </div>
                <h3 className="text-2xl font-bold text-grows-text-primary">Así es como se gestionan la mayoría de las obras pequeñas.</h3>
              </div>
              <p className="text-xl text-grows-primary font-semibold">Pero con GROWS, todo cambia.</p>
            </div>
          </div>

          {/* Tabla Comparativa */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h3 className="text-2xl font-bold text-grows-text-primary mb-2">Cómo GROWS transforma el caos en control profesional</h3>
              <p className="text-base text-grows-text-secondary">Comparación directa entre problemas comunes y nuestras soluciones</p>
            </div>
            
            <div className="bg-grows-surface rounded-lg border border-grows-border overflow-hidden shadow-grows-sm">
              
              {/* Filas de la tabla */}
              <div className="divide-y divide-grows-border">
                {comparisonData.map((item, index) => {
                  const ProblemIcon = item.problem.icon;
                  const SolutionIcon = item.solution.icon;
                  
                  return (
                    <div
                      key={index}
                      className="grid grid-cols-2 gap-6 p-6 hover:bg-grows-background transition-all duration-300 group"
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animation: 'fadeInUp 0.6s ease-out forwards',
                        opacity: 0,
                      }}
                    >
                      {/* Problema */}
                      <div className="flex items-start gap-3 group-hover:opacity-75 transition-opacity duration-300">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-50 border border-red-200 flex-shrink-0">
                          <ProblemIcon className="h-5 w-5 text-grows-error" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-grows-text-primary text-base mb-1">{item.problem.title}</h5>
                          <p className="text-grows-text-secondary text-sm leading-relaxed">{item.problem.description}</p>
                        </div>
                      </div>
                      
                      {/* Solución */}
                      <div className="flex items-start gap-3 bg-gradient-to-r from-grows-neutral/30 to-transparent rounded-lg p-3 group-hover:from-grows-neutral/50 transition-all duration-300">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-50 border border-green-200 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                          <SolutionIcon className="h-5 w-5 text-grows-success" />
                        </div>
                        <div>
                          <h5 className="font-semibold text-grows-text-primary text-base mb-1">{item.solution.title}</h5>
                          <p className="text-grows-text-secondary text-sm leading-relaxed">{item.solution.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>



          {/* CTA Final */}
          <div className="text-center">
            <div className="relative bg-grows-primary p-10 rounded-lg shadow-grows-lg max-w-4xl mx-auto overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-grows-secondary/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-grows-secondary/10 rounded-full blur-2xl"></div>
              
              <div className="relative z-10">
                <h3 className="text-3xl font-bold text-white mb-4">
                  ¿Listo para transformar tus obras?
                </h3>
                <p className="text-xl text-grows-background mb-8 max-w-2xl mx-auto leading-relaxed">
                  Únete a los estudios de arquitectura y constructoras que ya gestionan sus proyectos con GROWS
                </p>
                <button className="group bg-grows-secondary text-grows-text-primary px-10 py-4 rounded-lg text-lg font-bold hover:bg-grows-secondary/90 hover:shadow-grows-lg transition-all duration-300 flex items-center justify-center gap-3 mx-auto hover:scale-105">
                  Probar GROWS gratis
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

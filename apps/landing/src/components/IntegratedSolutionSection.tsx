'use client';

import { AlertTriangle, Wrench, TrendingDown, ArrowRight, CheckCircle, Zap, Users, BarChart3, Bot, Shield, Calendar, CreditCard, MessageCircle, Clock, Lightbulb } from 'lucide-react';

// Componente para burbujas de problemas
function ChatBubble({ icon: Icon, text, delay = 0, position = 'left' }: { 
  icon: React.ComponentType<any>, 
  text: string, 
  delay?: number, 
  position?: 'left' | 'right' 
}) {
  return (
    <div 
      className={`flex items-start gap-3 ${position === 'right' ? 'flex-row-reverse' : ''}`}
      style={{
        animationDelay: `${delay}ms`,
        animation: 'fadeInUp 0.6s ease-out forwards',
        opacity: 0,
      }}
    >
      <div className="w-10 h-10 bg-grows-background border border-grows-border rounded-full flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-grows-error" />
      </div>
      <div className={`bg-grows-background border border-grows-border rounded-2xl px-4 py-3 max-w-xs ${
        position === 'right' ? 'rounded-br-md' : 'rounded-bl-md'
      }`}>
        <p className="text-sm text-grows-text-primary leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

export function IntegratedSolutionSection() {
  // Datos de burbujas de problemas
  const problemBubbles = [
    {
      icon: Clock,
      text: "Otra vez se atrasó el revoque, no coordinamos con el plomero.",
      position: 'left' as const,
      delay: 0
    },
    {
      icon: AlertTriangle,
      text: "Nadie sabe cuánto falta para terminar.",
      position: 'right' as const,
      delay: 200
    },
    {
      icon: TrendingDown,
      text: "Se compró de más, y ahora no alcanza para las aberturas.",
      position: 'left' as const,
      delay: 400
    },
    {
      icon: MessageCircle,
      text: "El cliente pregunta por el presupuesto y no sé qué responder.",
      position: 'right' as const,
      delay: 600
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

  const processSteps = [
    {
      number: "1",
      title: "Carga tu Obra",
      description: "Define tu proyecto y selecciona tareas del catálogo +1800"
    },
    {
      number: "2", 
      title: "Asigna Socios",
      description: "Designa constructores y forma cuadrillas de trabajo"
    },
    {
      number: "3",
      title: "Sigue el Progreso", 
      description: "Monitorea avance en tiempo real con IA y reportes automáticos"
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
              De problemas comunes a
              <br />
              <span className="text-grows-primary">gestión profesional</span>
            </h2>
            <p className="text-lg text-grows-text-secondary max-w-3xl mx-auto leading-relaxed mb-16">
              GROWS transforma la gestión de obras con tecnología enterprise accesible para estudios de arquitectura y constructoras
            </p>

            {/* Burbujas de Problemas */}
            <div className="max-w-4xl mx-auto mb-16">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {problemBubbles.map((bubble, index) => (
                  <div key={index} className={`${bubble.position === 'right' ? 'md:ml-auto' : ''}`}>
                    <ChatBubble 
                      icon={bubble.icon}
                      text={bubble.text}
                      delay={bubble.delay}
                      position={bubble.position}
                    />
                  </div>
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

          {/* CTA Contextual */}
          <div className="text-center mb-20">
            <div className="bg-gradient-to-r from-grows-primary to-grows-primary/90 rounded-2xl p-8 max-w-4xl mx-auto shadow-grows-lg">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="w-12 h-12 bg-grows-secondary rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-grows-text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-grows-text-primary">Descubrí cómo GROWS puede ordenar tu próxima obra</h3>
              </div>
              <p className="text-grows-text-secondary mb-6 text-lg">Únete a cientos de profesionales que ya gestionan sus obras con precisión</p>
              <button className="bg-grows-secondary hover:bg-grows-secondary/90 text-grows-text-primary font-semibold px-8 py-4 rounded-xl transition-all duration-300 hover:shadow-grows-lg hover:scale-105 flex items-center gap-2 mx-auto">
                Probar gratis
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Proceso de 3 Pasos */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h3 className="text-2xl font-bold text-grows-text-primary mb-2">¿Cómo funciona?</h3>
              <p className="text-base text-grows-text-secondary">Un proceso simple en 3 pasos</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {processSteps.map((step, index) => (
                <div
                  key={index}
                  className="text-center group"
                  style={{
                    animationDelay: `${index * 300}ms`,
                    animation: 'fadeInUp 0.8s ease-out forwards',
                    opacity: 0,
                  }}
                >
                  <div className="relative mb-6">
                    <div className="w-16 h-16 bg-grows-primary text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto group-hover:scale-110 transition-transform duration-300">
                      {step.number}
                    </div>
                    {index < processSteps.length - 1 && (
                      <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-grows-border transform translate-x-4"></div>
                    )}
                  </div>
                  <h4 className="text-lg font-bold text-grows-text-primary mb-3">{step.title}</h4>
                  <p className="text-grows-text-secondary text-sm leading-relaxed">{step.description}</p>
                </div>
              ))}
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

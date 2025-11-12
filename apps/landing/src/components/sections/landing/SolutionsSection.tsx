'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle,
  FileX,
  Clock,
  MessageSquare,
  CalendarX,
  Ban,
  Users,
  TrendingDown,
  ClipboardCheck,
  DollarSign,
  Zap,
  Network,
  Calendar,
  CheckCircle,
  MessageCircle,
  TrendingUp,
  ChevronRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

const APP_URL = 'http://localhost:3001';

export function SolutionsSection() {
  const [isOrdered, setIsOrdered] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [animationComplete, setAnimationComplete] = useState(false);

  // 8 Problemas comunes en obra
  const problems = [
    {
      id: 1,
      icon: AlertTriangle,
      title: "Falta de Trazabilidad",
      description: "Dificultad para saber quién hizo qué y cuándo dentro de la obra.",
    },
    {
      id: 2,
      icon: DollarSign,
      title: "Presupuestos Desactualizados",
      description: "Costos de materiales y mano de obra cambian sin control centralizado.",
    },
    {
      id: 3,
      icon: Clock,
      title: "Pagos Retrasados",
      description: "Demoras por validaciones manuales o errores administrativos.",
    },
    {
      id: 4,
      icon: MessageSquare,
      title: "Duplicación de Información",
      description: "Múltiples grupos de WhatsApp y planillas sin sincronización.",
    },
    {
      id: 5,
      icon: CalendarX,
      title: "Errores en Cronogramas",
      description: "Tareas fuera de orden o mal coordinadas entre oficios.",
    },
    {
      id: 6,
      icon: Ban,
      title: "Ausencia de Control de Calidad",
      description: "Falta de registro fotográfico y validación técnica por etapas.",
    },
    {
      id: 7,
      icon: Users,
      title: "Problemas de Comunicación entre Cuadrillas",
      description: "Instrucciones confusas o tardías generan pérdidas de tiempo.",
    },
    {
      id: 8,
      icon: TrendingDown,
      title: "Falta de Métricas Reales",
      description: "No se mide productividad ni rendimiento, se trabaja 'a ojo'.",
    }
  ];

  // 8 Soluciones GROWS
  const solutions = [
    {
      id: 1,
      icon: ClipboardCheck,
      title: "Registro Automático de Tareas",
      description: "Cada acción queda registrada en la GROWS Control Tower con usuario, hora y ubicación.",
    },
    {
      id: 2,
      icon: DollarSign,
      title: "Cost Manager Dinámico",
      description: "Actualiza precios por proveedor en tiempo real y recalcula presupuestos automáticamente.",
    },
    {
      id: 3,
      icon: Zap,
      title: "Pagos Inteligentes",
      description: "Liberación automática de pagos al validar tareas terminadas y aprobadas.",
    },
    {
      id: 4,
      icon: Network,
      title: "Centralización en una Sola Plataforma",
      description: "GROWS reemplaza planillas y chats dispersos con flujos integrados de comunicación y control.",
    },
    {
      id: 5,
      icon: Calendar,
      title: "Planificación con CPM",
      description: "Cronogramas automáticos que reorganizan dependencias y tiempos según progreso real.",
    },
    {
      id: 6,
      icon: CheckCircle,
      title: "Quality Gate Digital",
      description: "Validación técnica con fotos, checklists y aprobaciones desde el panel.",
    },
    {
      id: 7,
      icon: MessageCircle,
      title: "Mensajería Integrada por Tarea",
      description: "Comunicación directa entre Cliente Técnico y Socio Constructor dentro del flujo de obra.",
    },
    {
      id: 8,
      icon: TrendingUp,
      title: "Analítica en Tiempo Real",
      description: "Dashboard de KPIs: avance físico, horas trabajadas, costos y reputación por usuario.",
    }
  ];

  const handleMakeItGrows = () => {
    console.log('Botón clickeado, cambiando estado a true');
    setAnimationComplete(false);
    setIsOrdered(true);
    
    // Trigger animation completion after a delay
    setTimeout(() => {
      setAnimationComplete(true);
    }, 1000);
  };

  const cards = isOrdered ? solutions : problems;

  return (
    <section id="problemas" className="relative bg-black py-20 overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-emerald-500/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Glow effect when solutions are active */}
      <AnimatePresence>
        {isOrdered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-radial from-emerald-500/10 via-transparent to-transparent pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div
        id="soluciones"
        className="pointer-events-none absolute -top-24 h-px w-px"
        aria-hidden="true"
      />
      <div className="relative z-10 mx-auto max-w-screen-xl px-4 md:px-6 py-10 md:py-16 overflow-hidden">
        
        {/* Header with counter */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            {isOrdered ? (
              <span className="text-emerald-400">Soluciones GROWS</span>
            ) : (
              <span className="text-red-400">Problemas Comunes</span>
            )}
          </motion.h2>
          
          {/* Solution counter */}
          <AnimatePresence>
            {isOrdered && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2 mt-4"
              >
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">
                  8 de 8 problemas resueltos
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Grid/Carrusel de tarjetas */}
        <div className="relative mb-16">
          <div
            className="flex md:grid md:grid-cols-4 gap-4 md:gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory scroll-smooth scrollbar-none touch-pan-x pb-5 md:pb-0"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {cards.map((card, index) => {
              const Icon = card.icon;
              const isHovered = hoveredCard === card.id;
              const currentSolution = solutions.find((s) => s.id === card.id);
              const showSolution = isHovered && !isOrdered;

              const stateStyles = isOrdered
                ? 'bg-[#111111] border-emerald-500/30 hover:border-emerald-500/50 hover:shadow-lg shadow-emerald-500/10'
                : showSolution
                ? 'bg-[#111111] border-emerald-500/50 shadow-lg shadow-emerald-500/20'
                : 'bg-[#1A0A0A] border-red-500/30 hover:border-red-500/50 hover:shadow-md';

              const iconColor = isOrdered || showSolution ? 'text-emerald-400' : 'text-red-400';
              const titleColor = iconColor;
              const descriptionColor = isOrdered || showSolution ? 'text-gray-200' : 'text-gray-300';

              return (
                <motion.div
                  key={card.id}
                  className={`group relative min-w-[82%] md:min-w-0 flex-shrink-0 snap-center rounded-2xl border border-white/10 bg-[#1A1A1A] p-6 md:p-7 flex flex-col transition-transform duration-300 hover:scale-[1.02] overflow-hidden cursor-pointer ${stateStyles}`}
                  style={{ aspectRatio: '1 / 1.05', maxHeight: '380px' }}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  animate={
                    isOrdered
                      ? {
                          scale: [1, 1.05, 1],
                          transition: {
                            delay: index * 0.1,
                            duration: 0.6,
                          },
                        }
                      : {}
                  }
                  onMouseEnter={() => setHoveredCard(card.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {(isOrdered || showSolution) && (
                    <motion.div
                      className="pointer-events-none absolute inset-0 rounded-2xl bg-emerald-500/5 blur-xl"
                      animate={{
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    />
                  )}

                  <div className="relative z-10 flex h-full flex-col gap-3 items-center justify-center text-center">
                    <div className="inline-flex items-center gap-2">
                      {(showSolution && currentSolution) ? (
                        <currentSolution.icon className={`w-5 h-5 ${titleColor}`} />
                      ) : (
                        <Icon className={`w-5 h-5 ${titleColor}`} />
                      )}
                      <h3
                        className={`text-lg md:text-xl font-semibold transition-colors duration-300 ${titleColor}`}
                      >
                        {showSolution && currentSolution ? currentSolution.title : card.title}
                      </h3>
                    </div>

                    <p
                      className={`text-base md:text-lg text-gray-300 leading-snug transition-colors duration-300 ${descriptionColor}`}
                    >
                      {showSolution && currentSolution ? currentSolution.description : card.description}
                    </p>
                  </div>

                  {(showSolution || isOrdered) && (
                    <span className="absolute top-4 right-4 z-20 flex items-center gap-1 text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded-full">
                      <CheckCircle2 className="h-3 w-3" />
                      SOLUCIÓN
                    </span>
                  )}

                  {(isOrdered || showSolution) && (
                    <motion.div
                      className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-emerald-500/30"
                      animate={{
                        opacity: [0.5, 0.8, 0.5],
                        scale: [1, 1.02, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
          <div className="absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-[#0D0D0D] to-transparent pointer-events-none md:hidden" />
        </div>

        {/* Botón CTA con confetti effect placeholders */}
        <motion.div 
          className="text-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          <motion.button
            onClick={handleMakeItGrows}
            disabled={isOrdered}
            className={`group inline-flex items-center gap-3 px-16 py-6 rounded-2xl text-xl font-bold transition-all duration-300 relative overflow-hidden shadow-2xl ${
              isOrdered 
                ? 'bg-green-600 text-white cursor-not-allowed shadow-lg shadow-green-600/50' 
                : 'bg-[#F9D65C] text-black hover:bg-[#F4C430] hover:shadow-[0_0_40px_rgba(249,214,92,0.4)]'
            }`}
            whileHover={!isOrdered ? { scale: 1.08 } : {}}
            whileTap={!isOrdered ? { scale: 0.95 } : {}}
          >
            {/* Shimmer effect */}
            {!isOrdered && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              />
            )}
            
            <Sparkles className="h-6 w-6 relative z-10" />
            <span className="relative z-10 text-xl font-extrabold">
              {isOrdered ? 'SOLUCIONES ACTIVADAS' : 'SOLUCIONALO'}
            </span>
            {!isOrdered && <ChevronRight className="h-6 w-6 group-hover:translate-x-1 transition-transform relative z-10" />}
            
            {/* Celebration effect when clicked */}
            {isOrdered && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.5, 1], opacity: [1, 0] }}
                transition={{ duration: 0.8 }}
                className="absolute inset-0 bg-white/20 rounded-full"
              />
            )}
          </motion.button>
        </motion.div>

      </div>
    </section>
  );
}

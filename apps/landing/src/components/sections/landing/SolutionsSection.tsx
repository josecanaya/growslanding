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
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative z-10">
        
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

        {/* Grid de tarjetas (responsivo: 1 columna en móvil, 2 en tablet, 4 en desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {cards.map((card, index) => {
            const Icon = card.icon;
            const isProblem = !isOrdered;
            const isHovered = hoveredCard === card.id;
            const currentSolution = solutions.find(s => s.id === card.id);
            const showSolution = isHovered && !isOrdered;
            
            return (
              <motion.div
                key={card.id}
                className="group relative h-[300px] cursor-pointer"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                animate={isOrdered ? {
                  scale: [1, 1.05, 1],
                  transition: {
                    delay: index * 0.1,
                    duration: 0.6
                  }
                } : {}}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Tarjeta */}
                <div className={`
                  absolute inset-0 rounded-xl p-8 transition-all duration-500
                  ${isOrdered 
                    ? 'bg-[#111111] border border-emerald-500/30 group-hover:border-emerald-500/50 group-hover:shadow-lg shadow-emerald-500/10' 
                    : showSolution
                    ? 'bg-[#111111] border border-emerald-500/50 shadow-lg shadow-emerald-500/20'
                    : 'bg-[#1A0A0A] border border-red-500/30 group-hover:border-red-500/50 group-hover:shadow-md'
                  }
                  group-hover:shadow-lg
                `}>
                  {/* Glow effect on hover for solutions */}
                  {(isOrdered || showSolution) && (
                    <motion.div
                      className="absolute inset-0 rounded-xl bg-emerald-500/5 blur-xl -z-10"
                      animate={{
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    />
                  )}

                  {/* Icono */}
                  <div className={`
                    h-10 w-10 mb-4 transition-all duration-300
                    ${isOrdered || showSolution ? 'text-emerald-400' : 'text-red-400'}
                    group-hover:scale-110
                  `}>
                    {(showSolution && currentSolution) ? (
                      <currentSolution.icon className="h-full w-full" />
                    ) : (
                      <Icon className="h-full w-full" />
                    )}
                  </div>
                  
                  {/* Título */}
                  <h3 className={`
                    text-lg font-semibold mb-3 font-sans transition-colors duration-300
                    ${isOrdered || showSolution ? 'text-emerald-400' : 'text-red-400'}
                    group-hover:opacity-80
                  `}>
                    {showSolution && currentSolution ? currentSolution.title : card.title}
                  </h3>
                  
                  {/* Descripción */}
                  <p className={`
                    text-sm font-normal leading-relaxed transition-colors duration-300
                    ${isOrdered || showSolution ? 'text-gray-200' : 'text-gray-300'}
                  `}>
                    {showSolution && currentSolution ? currentSolution.description : card.description}
                  </p>

                  {/* Badge de "Solución" cuando se hace hover o está activado */}
                  {(showSolution || isOrdered) && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      SOLUCIÓN
                    </motion.div>
                  )}

                  {/* Pulse effect for solutions */}
                  {(isOrdered || showSolution) && (
                    <motion.div
                      className="absolute inset-0 rounded-xl border-2 border-emerald-500/30"
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
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Botón CTA con confetti effect placeholders */}
        <motion.div 
          className="text-center mt-10"
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

'use client';

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ArrowRight, ChevronRight, ChevronLeft } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useLocale } from 'next-intl';
import Link from 'next/link';

interface Stage {
  id: number;
  image: string;
  title: string;
  paragraphs: string[];
}

const stages: Stage[] = [
  {
    id: 1,
    image: '/images/1Carga.png',
    title: 'Inicio del proyecto',
    paragraphs: [
      'El arquitecto inicia la obra desde su estudio.',
      'Se definen ubicación, duración e hitos iniciales.',
      'GROWS genera tablero, checklist y flujo de trabajo base.',
      'La obra tiene forma digital, con rumbo y contexto.'
    ]
  },
  {
    id: 2,
    image: '/images/2Datos.png',
    title: 'Definición técnica y coherencia',
    paragraphs: [
      'Planos, costos y documentación se transforman en un sistema conectado e inteligente.',
      'Se cargan planos BIM/CAD, partidas y categorías de costo.',
      'GROWS valida metrajes, clasifica la información y centraliza los documentos.',
      'Todo queda sincronizado: información técnica y presupuesto trabajan en conjunto.'
    ]
  },
  {
    id: 3,
    image: '/images/3coneccion.png',
    title: 'Roles, acceso y sincronía',
    paragraphs: [
      'Los actores se integran al flujo digital de la obra.',
      'El arquitecto invita coordinadores y socios constructores.',
      'El sistema asigna tareas, permisos y responsabilidades.',
      'Todos los miembros trabajan dentro del mismo relato.'
    ]
  },
  {
    id: 4,
    image: '/images/4ejecucion.png',
    title: 'Datos que se convierten en acción',
    paragraphs: [
      'El terreno se conecta al tablero digital.',
      'Las cuadrillas reportan avances, materiales y fotos.',
      'GROWS cruza información y valida ejecución y calidad.',
      'Avances trazables y control total sin planillas paralelas.'
    ]
  },
  {
    id: 5,
    image: '/images/5metricas.png',
    title: 'Análisis inteligente en tiempo real',
    paragraphs: [
      'La obra se monitorea como un sistema vivo.',
      'Los datos de terreno alimentan el panel de control.',
      'GrowsBot detecta desviaciones y sugiere correcciones.',
      'Decisiones basadas en evidencia, no en intuición.'
    ]
  },
  {
    id: 6,
    image: '/images/6final.png',
    title: 'Del plano al hogar',
    paragraphs: [
      'El proyecto se convierte en experiencia habitable.',
      'Se consolidan tareas, reportes y documentación final.',
      'GROWS archiva planos "as built" y genera métricas finales.',
      'El conocimiento de esta obra alimenta la próxima.'
    ]
  }
];

const AUTO_PLAY_DURATION = 2000; // 2 seconds

export function StorytellingFlow() {
  const locale = useLocale();
  const [activeStage, setActiveStage] = useState(0);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const totalStages = stages.length + 1; // Including CTA

  // Intersection Observer to detect when section enters viewport
  useEffect(() => {
    if (!sectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
          } else {
            setIsInView(false);
          }
        });
      },
      {
        threshold: 0.3, // Trigger when 30% of section is visible
      }
    );

    observer.observe(sectionRef.current);

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  // Auto-play functionality - only when section is in view
  useEffect(() => {
    if (isPaused || !isInView) return;

    autoPlayTimerRef.current = setInterval(() => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const nextIndex = (activeStage + 1) % totalStages; // Loop to 0 after last
      
      container.scrollTo({ 
        left: nextIndex * containerWidth, 
        behavior: 'smooth' 
      });
    }, AUTO_PLAY_DURATION);

    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    };
  }, [activeStage, isPaused, isInView, totalStages]);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const scrollPosition = containerRef.current.scrollLeft;
      const containerWidth = containerRef.current.clientWidth;
      const currentStage = Math.round(scrollPosition / containerWidth);
      
      setActiveStage(Math.min(currentStage, totalStages - 1));
      
      // Hide scroll indicator after scrolling past first stage
      if (scrollPosition > containerWidth * 0.3) {
        setShowScrollIndicator(false);
      }

      // Pause auto-play when user manually scrolls
      if (!isPaused) {
        setIsPaused(true);
        // Resume after 5 seconds of no manual interaction
        setTimeout(() => {
          setIsPaused(false);
        }, 5000);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [isPaused, totalStages]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return;
      
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        const currentScroll = container.scrollLeft;
        const nextSection = Math.floor(currentScroll / containerWidth) + 1;
        container.scrollTo({ left: nextSection * containerWidth, behavior: 'smooth' });
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        const currentScroll = container.scrollLeft;
        const prevSection = Math.max(0, Math.floor(currentScroll / containerWidth) - 1);
        container.scrollTo({ left: prevSection * containerWidth, behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const scrollToNext = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const nextIndex = (activeStage + 1) % totalStages; // Loop to 0 after last
    container.scrollTo({ left: nextIndex * containerWidth, behavior: 'smooth' });
  };

  const scrollToPrev = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const prevIndex = (activeStage - 1 + totalStages) % totalStages; // Loop to last after 0
    container.scrollTo({ left: prevIndex * containerWidth, behavior: 'smooth' });
  };

  return (
    <section 
      ref={sectionRef}
      className="relative bg-gradient-to-b from-black via-gray-950 to-black text-white overflow-hidden isolate"
    >
      <span
        id="obras"
        className="pointer-events-none absolute -top-24 h-px w-px"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-screen-xl px-4 md:px-6 py-12 md:py-16 overflow-hidden">
        {/* Desktop navigation arrows */}
        <button
          onClick={scrollToPrev}
          className="hidden md:block absolute left-2 top-1/2 -translate-y-1/2 z-30 bg-black/40 text-white p-2 md:p-3 rounded-full md:bg-black/30 md:hover:bg-black/50 transition"
          aria-label="Anterior"
        >
          <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-yellow-400" />
        </button>

        <button
          onClick={scrollToNext}
          className="hidden md:block absolute right-2 top-1/2 -translate-y-1/2 z-30 bg-black/40 text-white p-2 md:p-3 rounded-full md:bg-black/30 md:hover:bg-black/50 transition"
          aria-label="Siguiente"
        >
          <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-yellow-400" />
        </button>

        {/* Scroll indicator (desktop) */}
        <AnimatePresence>
          {showScrollIndicator && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="hidden md:block absolute right-10 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
            >
              <motion.div
                animate={{ x: [0, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ChevronRight className="w-8 h-8 text-yellow-400" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stage indicator dots */}
        <div className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex-row gap-3 pointer-events-auto">
          {[...stages, { id: 'cta' }].map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (containerRef.current) {
                  const containerWidth = containerRef.current.clientWidth;
                  containerRef.current.scrollTo({
                    left: index * containerWidth,
                    behavior: 'smooth'
                  });
                }
              }}
              className="relative group"
              aria-label={`Ir a etapa ${index + 1}`}
            >
              <motion.div
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  activeStage === index
                    ? 'bg-yellow-400 scale-125'
                    : 'bg-gray-600 hover:bg-gray-500'
                }`}
                animate={{
                  scale: activeStage === index ? 1.25 : 1,
                }}
              />
              {activeStage === index && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-yellow-400 blur-md opacity-50"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1.5 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </button>
          ))}
        </div>

        <div className="relative w-full overflow-hidden md:h-[calc(100vh-8rem)] h-auto">
          <div
            ref={containerRef}
            className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide"
            style={{ scrollBehavior: 'smooth' }}
          >
            {/* Stages */}
            {stages.map((stage, index) => {
              const isEven = index % 2 === 0;

              return (
                <motion.div
                  key={stage.id}
                  ref={(el) => {
                    sectionRefs.current[index] = el;
                  }}
                  className={`min-w-full snap-start snap-always flex flex-col md:flex-row ${
                    !isEven ? 'md:flex-row-reverse' : ''
                  } items-center justify-center gap-6 md:gap-12 w-full px-4 md:px-8 py-10 md:py-0 flex-shrink-0`}
                >
                  <motion.div
                    className="w-full md:w-1/2 flex justify-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  >
                    <div className="relative w-full max-w-md md:max-w-none">
                      <Image
                        src={stage.image}
                        alt={`Etapa ${stage.id}: ${stage.title}`}
                        width={1200}
                        height={800}
                        className="w-full max-h-[300px] md:max-h-none object-contain md:object-cover rounded-3xl"
                        priority={index < 2}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute top-4 left-4">
                        <motion.div
                          className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-2xl"
                          initial={{ scale: 0, rotate: -180 }}
                          whileInView={{ scale: 1, rotate: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, type: 'spring' }}
                        >
                          <span className="text-black font-black text-xl md:text-2xl">
                            {stage.id}
                          </span>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    className="w-full md:w-1/2 text-center md:text-left mt-6 md:mt-0 flex flex-col items-center md:items-start gap-4"
                    initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  >
                    <motion.h2
                      className="text-3xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-300 leading-tight text-center md:text-left"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    >
                      {stage.title}
                    </motion.h2>

                    <motion.div
                      className="space-y-4 md:space-y-6 text-base md:text-xl leading-relaxed max-w-xl"
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, margin: '-50px' }}
                      variants={{
                        hidden: { opacity: 0 },
                        visible: {
                          opacity: 1,
                          transition: {
                            staggerChildren: 0.15,
                            delayChildren: 0.3
                          }
                        }
                      }}
                    >
                      {stage.paragraphs.map((paragraph, pIndex) => (
                        <motion.p
                          key={pIndex}
                          className={`${
                            pIndex === 0
                              ? 'text-gray-300 italic text-lg md:text-xl font-light'
                              : pIndex === stage.paragraphs.length - 1
                              ? 'text-yellow-400 font-semibold text-base md:text-lg tracking-wide'
                              : 'text-gray-400 text-base md:text-lg'
                          } text-center md:text-left`}
                          variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0 }
                          }}
                        >
                          {paragraph}
                        </motion.p>
                      ))}
                    </motion.div>
                  </motion.div>
                </motion.div>
              );
            })}

            {/* CTA Section */}
            <motion.div
              className="min-w-full snap-start snap-always flex flex-col items-center justify-center px-4 md:px-8 py-12 md:py-16 h-full flex-shrink-0"
            >
              <div className="w-full max-w-lg md:max-w-4xl mx-auto text-center relative z-10">
                <motion.div
                  className="relative bg-gradient-to-br from-gray-900 to-black rounded-3xl p-6 md:p-10 lg:p-16 shadow-2xl border border-gray-800 overflow-hidden"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                >
                  {/* Animated background gradient */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-yellow-400/5 to-yellow-400/10"
                    animate={{
                      backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                    style={{
                      backgroundSize: '200% 200%'
                    }}
                  />

                  {/* Title */}
                  <motion.h2
                    className="text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 leading-tight mb-6 relative z-10"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    ¿Listo para transformar tu obra?
                  </motion.h2>

                  <motion.p
                    className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed relative z-10"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  >
                    Únete a la revolución digital de la construcción. 
                    Descubre cómo GROWS puede optimizar tu próximo proyecto.
                  </motion.p>

                  {/* CTA Button */}
                  <motion.a
                    href={`/${locale}/coming-soon`}
                    className="group relative inline-flex items-center justify-center gap-2 md:gap-3 w-1/2 md:w-auto px-4 md:px-10 py-3 md:py-5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold text-sm md:text-xl rounded-2xl shadow-2xl overflow-hidden transition-all duración-300 mx-auto z-10"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(234, 179, 8, 0.5)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="relative z-10">Probar GROWS</span>
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-200 relative z-10" />
                    
                    {/* Button shimmer effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{
                        x: ['-100%', '100%'],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    />
                  </motion.a>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Mobile navigation controls */}
        <div className="mt-6 flex md:hidden justify-center gap-4">
          <button
            onClick={scrollToPrev}
            className="p-2 bg-black/40 text-white rounded-full"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={scrollToNext}
            className="p-2 bg-black/40 text-white rounded-full"
            aria-label="Siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}

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
      {/* Left Arrow Button */}
      <button
        onClick={scrollToPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-[98] bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full p-3 transition-all duration-300 hover:scale-110 group"
        aria-label="Anterior"
      >
        <ChevronLeft className="w-8 h-8 text-yellow-400 group-hover:text-yellow-300" />
      </button>

      {/* Right Arrow Button */}
      <button
        onClick={scrollToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-[98] bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full p-3 transition-all duration-300 hover:scale-110 group"
        aria-label="Siguiente"
      >
        <ChevronRight className="w-8 h-8 text-yellow-400 group-hover:text-yellow-300" />
      </button>

      {/* Stage indicator dots - now at bottom */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[98] hidden lg:flex flex-row gap-3 pointer-events-auto">
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

      {/* Scroll indicator - left/right arrows */}
      <AnimatePresence>
        {showScrollIndicator && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute right-8 top-1/2 -translate-y-1/2 z-[98] pointer-events-none"
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

      {/* Main container with smooth horizontal scroll */}
      <div 
        ref={containerRef}
        className="snap-x snap-mandatory h-screen overflow-x-scroll scroll-smooth scrollbar-hide flex"
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
              className="h-screen w-screen snap-start snap-always flex items-center justify-center px-4 sm:px-6 lg:px-12 py-8 relative flex-shrink-0"
            >
              <div className="max-w-7xl mx-auto w-full">
                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center ${
                  !isEven ? 'lg:grid-flow-dense' : ''
                }`}>
                  
                  {/* Image - appears on right for even, left for odd */}
                  <motion.div
                    className={`relative ${!isEven ? 'lg:col-start-1 lg:row-start-1' : ''}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  >
                    <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] rounded-3xl overflow-hidden group">
                      <Image
                        src={stage.image}
                        alt={`Etapa ${stage.id}: ${stage.title}`}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        priority={index < 2}
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      
                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                      
                      {/* Stage number */}
                      <div className="absolute top-6 left-6">
                        <motion.div
                          className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-2xl"
                          initial={{ scale: 0, rotate: -180 }}
                          whileInView={{ scale: 1, rotate: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.6, type: "spring" }}
                        >
                          <span className="text-black font-black text-2xl">{stage.id}</span>
                        </motion.div>
                      </div>

                      {/* Decorative elements */}
                      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-transparent to-transparent pointer-events-none" />
                    </div>
                  </motion.div>

                  {/* Content - appears on left for even, right for odd */}
                  <motion.div
                    className={`${!isEven ? 'lg:col-start-2' : ''}`}
                    initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  >
                    {/* Title */}
                    <motion.h2
                      className="text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-300 leading-tight mb-8"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    >
                      {stage.title}
                    </motion.h2>

                    {/* Paragraphs with stagger animation */}
                    <motion.div
                      className="space-y-6 text-lg md:text-xl leading-relaxed"
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, margin: "-50px" }}
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
                          className={
                            pIndex === 0
                              ? "text-gray-300 italic text-xl font-light"
                              : pIndex === stage.paragraphs.length - 1
                              ? "text-yellow-400 font-semibold text-lg tracking-wide"
                              : "text-gray-400"
                          }
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

                </div>
              </div>
            </motion.div>
          );
        })}

        {/* CTA Section */}
        <motion.div
          className="h-screen w-screen snap-start snap-always flex items-center justify-center px-4 sm:px-6 lg:px-12 py-12 relative flex-shrink-0"
        >
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div
              className="relative bg-gradient-to-br from-gray-900 to-black rounded-3xl p-8 lg:p-16 shadow-2xl border border-gray-800 overflow-hidden"
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
                  ease: "easeInOut"
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
                className="group relative inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-bold text-lg md:text-xl rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 mx-auto z-10"
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
                    ease: "easeInOut"
                  }}
                />
              </motion.a>
            </motion.div>
          </div>
        </motion.div>

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

'use client';

import { motion } from 'framer-motion';

export function CinematicCTASection() {
  return (
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Fondo oscuro con gradiente */}
      <div className="absolute inset-0 bg-gradient-to-br from-grows-primary via-grows-background to-grows-primary" />
      
      {/* Efectos de luz dorada */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-grows-secondary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-grows-secondary/5 rounded-full blur-3xl" />
      </div>

      {/* Contenido principal */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          {/* Frase inspiracional */}
          <motion.h2 
            className="text-4xl sm:text-6xl lg:text-7xl font-bold text-grows-surface leading-tight"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <span className="block">Build</span>
            <span className="block text-grows-secondary text-glow">smarter.</span>
            <span className="block">Build</span>
            <span className="block text-grows-secondary text-glow">together.</span>
          </motion.h2>

          {/* Subtítulo */}
          <motion.p 
            className="text-lg sm:text-xl lg:text-2xl text-grows-concrete max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            viewport={{ once: true }}
          >
            Únete a la revolución de la construcción inteligente. 
            Donde la experiencia humana se encuentra con la innovación tecnológica.
          </motion.p>

          {/* CTA Principal */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            viewport={{ once: true }}
            className="pt-8"
          >
            <button className="group relative px-12 py-6 bg-grows-secondary text-grows-primary font-bold text-xl rounded-lg overflow-hidden transition-all duration-300 hover:scale-105 cinematic-glow-intense">
              <span className="relative z-10 flex items-center">
                Join the Build
                <span className="ml-3 group-hover:translate-x-1 transition-transform duration-300">→</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-grows-secondary to-grows-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </motion.div>

          {/* Elementos de confianza */}
          <motion.div 
            className="flex flex-wrap justify-center gap-8 pt-16 text-grows-concrete"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            viewport={{ once: true }}
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-grows-secondary">100%</div>
              <div className="text-sm">Seguro</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-grows-secondary">24/7</div>
              <div className="text-sm">Soporte</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-grows-secondary">∞</div>
              <div className="text-sm">Escalable</div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Partículas flotantes */}
      <div className="absolute inset-0 z-5 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-grows-secondary/40 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>
    </section>
  );
}

'use client';

import { motion } from 'framer-motion';

export function CinematicFooter() {
  return (
    <footer className="bg-grows-primary border-t border-grows-concrete/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo y descripción */}
          <motion.div 
            className="md:col-span-2"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-grows-secondary rounded-lg flex items-center justify-center">
                <span className="text-grows-primary font-bold text-lg">G</span>
              </div>
              <span className="text-2xl font-bold text-grows-surface">GROWS</span>
            </div>
            <p className="text-grows-concrete max-w-md leading-relaxed">
              Plataforma B2B de gestión inteligente para obras de construcción. 
              Donde la experiencia humana se encuentra con la innovación tecnológica.
            </p>
          </motion.div>

          {/* Links rápidos */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h3 className="text-grows-surface font-semibold mb-4">Producto</h3>
            <ul className="space-y-2">
              {['Funcionalidades', 'Precios', 'Demo', 'Roadmap'].map((item) => (
                <li key={item}>
                  <a 
                    href="#" 
                    className="text-grows-concrete hover:text-grows-secondary transition-colors duration-300"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contacto */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h3 className="text-grows-surface font-semibold mb-4">Contacto</h3>
            <ul className="space-y-2">
              <li className="text-grows-concrete">contacto@grows.com.ar</li>
              <li className="text-grows-concrete">+54 9 11 1234-5678</li>
              <li className="text-grows-concrete">Buenos Aires, Argentina</li>
            </ul>
          </motion.div>
        </div>

        {/* Línea divisoria */}
        <motion.div 
          className="border-t border-grows-concrete/20 mt-12 pt-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-grows-concrete text-sm">
              © 2025 GROWS. Todos los derechos reservados.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-grows-concrete hover:text-grows-secondary transition-colors duration-300">
                Política de Privacidad
              </a>
              <a href="#" className="text-grows-concrete hover:text-grows-secondary transition-colors duration-300">
                Términos de Servicio
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}

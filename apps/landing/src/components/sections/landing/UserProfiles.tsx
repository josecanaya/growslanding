'use client';

import { useTranslations, useLocale } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

export function UserProfiles() {
  const t = useTranslations('users');
  const locale = useLocale();

  const userTypes = [
    {
      key: 'coordinador',
      badge: t('coordinador.badge'),
      title: t('coordinador.title'),
      description: t('coordinador.description'),
      imageSrc: t('coordinador.imageSrc'),
      placeholder: t('coordinador.placeholder'),
      infoLink: t('coordinador.infoLink'),
      ctaButton: t('coordinador.ctaButton'),
      href: '/es/roles/arquitecto-tecnico'
    },
    {
      key: 'socio',
      badge: t('socio.badge'),
      title: t('socio.title'),
      description: t('socio.description'),
      imageSrc: t('socio.imageSrc'),
      placeholder: t('socio.placeholder'),
      infoLink: t('socio.infoLink'),
      ctaButton: t('socio.ctaButton'),
      href: '/es/roles/socio-constructor'
    }
  ];

  return (
    <section id="users" className="py-24 bg-white relative">
      <span
        id="reputacion"
        className="pointer-events-none absolute -top-24 h-px w-px"
        aria-hidden="true"
      />
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        
        {/* Header Minimalista */}
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-6 leading-tight">
            {t('title')}
            <br />
            <span className="text-gray-600">{t('titleHighlight')}</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            {t('description')}
          </p>
        </motion.div>

        {/* Cards Visuales Hiperrealistas */}
        <div className="relative">
          {/* Línea dorada conectiva */}
          <motion.div 
            className="hidden lg:block absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent z-10"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            transition={{ duration: 1.5, delay: 0.5 }}
            viewport={{ once: true }}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {userTypes.map((userType, index) => (
              <motion.div
                key={userType.key}
                className="group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.03 }}
              >
                {/* Imagen hiperrealista - Fixed to show full image */}
                <Link href={userType.href} className="block">
                  <div className="relative w-full h-[500px] overflow-hidden rounded-t-2xl bg-gradient-to-b from-gray-50 to-gray-100">
                    <Image
                      src={userType.imageSrc}
                      alt={userType.placeholder}
                      fill
                      className="object-contain p-4 group-hover:scale-105 transition-transform duration-700"
                      priority
                      quality={90}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                    />
                    
                    {/* Overlay dorado sutil */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent pointer-events-none" />
                    
                    {/* Badge discreto */}
                    <div className="absolute top-6 left-6 z-10">
                      <span className="px-3 py-1 bg-yellow-400 text-black text-xs font-semibold rounded-full shadow-lg">
                        {userType.badge}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Contenido textual minimalista */}
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-black mb-3">
                    {userType.title}
                  </h3>
                  
                  <p className="text-gray-600 text-base leading-relaxed mb-6">
                    {userType.description}
                  </p>
                  
                  {/* Contenedor para link y botón */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {/* Link +info mejorado */}
                    <motion.div
                      className="group/info inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium transition-all duration-300 hover:underline decoration-2 underline-offset-2 self-start"
                      whileHover={{ scale: 1.05, x: 2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link href={userType.href}>
                        <span className="font-sans">{userType.infoLink}</span>
                      </Link>
                      <svg 
                        className="w-3 h-3 group-hover/info:translate-x-1 transition-transform duration-200" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.div>
                    
                    {/* Botón mejorado */}
                    <motion.div
                      className="inline-block"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <a
                        href="http://app.grows.com.ar/auth/register"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/btn inline-flex items-center gap-2 px-6 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-500 transition-all duration-300 shadow-md hover:shadow-lg self-start sm:self-auto"
                      >
                        {userType.ctaButton}
                        <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform duration-200" />
                      </a>
                    </motion.div>
                  </div>
                </div>

                {/* Efecto glow dorado al hover */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-yellow-400/5 to-yellow-400/10 rounded-2xl blur-sm" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA Inferior Minimalista */}
        <motion.div 
          className="text-center mt-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
        >
          
        </motion.div>
      </div>
    </section>
  );
}

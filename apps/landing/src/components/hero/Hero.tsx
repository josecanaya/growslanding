'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useEffect, useState } from 'react';

export function Hero() {
  const t = useTranslations('hero');
  const locale = useLocale();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
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
            @keyframes glow {
              0%, 100% {
                text-shadow: 0 0 5px #F9D65C, 0 0 8px #F9D65C;
              }
              50% {
                text-shadow: 0 0 8px #F9D65C, 0 0 12px #F9D65C;
              }
            }
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out;
        }
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
        .animate-slide-left {
          animation: slideInFromLeft 1s ease-out;
        }
        .animate-slide-right {
          animation: slideInFromRight 1s ease-out;
        }
      `}</style>
      
      {/* Fondo dinámico */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: isMobile
            ? "url('/images/Herocelular.jpg')"
            : "url('/images/hero-desktop.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: isMobile ? 'center top' : 'center',
          backgroundRepeat: 'no-repeat',
          minHeight: '100%'
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-yellow-500/10"></div>
      </div>
      
      {/* Contenido principal - Movido hacia arriba para no tapar la mano */}
      <div className="absolute top-16 left-0 right-0 z-20 text-center px-4 md:px-6">
        {/* Texto principal animado - Todo en una línea */}
        <div className="animate-fade-in-up">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-none tracking-tight">
            <span className="animate-slide-left inline-block text-xl sm:text-2xl lg:text-3xl mr-3">
              {t('title.part1')}
            </span>
            <span className="animate-glow text-yellow-400 inline-block text-2xl sm:text-3xl lg:text-4xl mr-6">
              {t('title.part2')}
            </span>
            <span className="animate-slide-right inline-block text-xl sm:text-2xl lg:text-3xl mr-3">
              {t('title.part3')}
            </span>
            <span className="animate-glow text-yellow-400 inline-block text-4xl sm:text-5xl lg:text-6xl">
              {t('title.part4')}
            </span>
          </h1>
        </div>
      </div>

      {/* Subtítulo y botón - Posicionados en la parte inferior */}
      <div className="absolute bottom-20 left-0 right-0 z-20 text-center px-4 md:px-6">
        {/* Subtítulo con estilo diferente */}
        <div className="animate-fade-in-up mb-8">
          <p className="text-base sm:text-lg text-gray-300 font-medium mb-2">
            {t('subtitle.line1')}
          </p>
          <p className="text-lg sm:text-xl text-white font-semibold bg-black/30 px-4 py-2 rounded-full inline-block border border-yellow-400/30">
            {t('subtitle.line2')}
          </p>
        </div>
        
            {/* Botón principal */}
            <div className="animate-fade-in-up">
              <a
                href="https://calendly.com/grows-demo/30min"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 bg-[#052D3D] text-white px-10 py-5 rounded-xl text-lg font-bold hover:bg-[#041F2B] hover:shadow-2xl transition-all duration-300 shadow-lg hover:scale-105 border-2 border-[#F9D65C]"
              >
                {t('ctaButton')}
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
      </div>
      
      {/* Partículas flotantes doradas */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute bg-yellow-400 rounded-full opacity-30 animate-pulse"
            style={{
              width: Math.random() * 4 + 2 + 'px',
              height: Math.random() * 4 + 2 + 'px',
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%',
              animationDelay: Math.random() * 3 + 's',
              animationDuration: Math.random() * 3 + 2 + 's',
            }}
          />
        ))}
      </div>
    </section>
  );
}
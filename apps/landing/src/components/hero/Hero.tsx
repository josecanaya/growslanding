'use client';

import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

export function Hero() {
  const t = useTranslations('hero');
  const locale = useLocale();
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
      
      {/* Imagen de fondo hiperrealista */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/Hero.jpg"
          alt={t('altText')}
          fill
          className="object-cover"
          priority
          quality={90}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAoADgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD1+iikJBGSQBQAV8//ALSPjvxF4W8PeH7Tw/q13pl1e+fFJLbSmMlBHGxUleTksO4rsP8Ahc/w3/6GnRf/A6L/GigD/9k="
        />
        {/* Overlay oscuro para contraste */}
        <div className="absolute inset-0 bg-black/60"></div>
        {/* Overlay dorado sutil */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-yellow-500/10"></div>
      </div>
      
      {/* Contenido principal - Movido hacia arriba para no tapar la mano */}
      <div className="absolute top-16 left-0 right-0 z-20 text-center px-6 sm:px-8 lg:px-12">
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
      <div className="absolute bottom-20 left-0 right-0 z-20 text-center px-6 sm:px-8 lg:px-12">
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
              <Link
                href={`/${locale}/coming-soon`}
                className="group inline-flex items-center gap-3 bg-[#052D3D] text-white px-10 py-5 rounded-xl text-lg font-bold hover:bg-[#041F2B] hover:shadow-2xl transition-all duration-300 shadow-lg hover:scale-105 border-2 border-[#F9D65C]"
              >
                {t('ctaButton')}
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
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
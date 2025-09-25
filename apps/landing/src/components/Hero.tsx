'use client';

import {useTranslations} from 'next-intl';
import {ArrowRight, Play} from 'lucide-react';
import {cn} from '@/lib/utils';

export function Hero() {
  const t = useTranslations('hero');

  return (
    <section id="home" className="pt-16 bg-gradient-to-br from-primary-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* Main Title */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            <span className="text-primary-600">GROWS</span>
            <br />
            <span className="text-3xl md:text-5xl text-gray-700">
              Plataforma de Gestión Inteligente
            </span>
            <br />
            <span className="text-2xl md:text-4xl text-gray-600">
              para la Construcción
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>

          {/* Description */}
          <p className="text-lg text-gray-500 mb-12 max-w-3xl mx-auto">
            {t('description')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl">
              {t('cta')}
              <ArrowRight className="h-5 w-5" />
            </button>
            
            <button className="border-2 border-primary-600 text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-50 transition-colors duration-200 flex items-center gap-2">
              <Play className="h-5 w-5" />
              {t('learnMore')}
            </button>
          </div>

          {/* Stats or Features Preview */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">100%</div>
              <div className="text-gray-600">Digital</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">24/7</div>
              <div className="text-gray-600">Seguimiento</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">0%</div>
              <div className="text-gray-600">Comisiones</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

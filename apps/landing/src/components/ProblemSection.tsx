'use client';

import {useTranslations} from 'next-intl';
import {AlertTriangle, Wrench, TrendingDown, ArrowRight} from 'lucide-react';

export function ProblemSection() {
  const t = useTranslations('problem');

  const problems = [
    {
      key: 'informal',
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      hoverColor: 'hover:border-red-300',
    },
    {
      key: 'tools',
      icon: Wrench,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      hoverColor: 'hover:border-orange-300',
    },
    {
      key: 'consequences',
      icon: TrendingDown,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      hoverColor: 'hover:border-yellow-300',
    },
  ];

  return (
    <>
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
      `}</style>
    <section id="problem" className="py-24 bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Header mejorado */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 rounded-full mb-4">
            <AlertTriangle className="h-3 w-3 text-red-400" />
            <span className="text-xs font-semibold text-red-500">Problemas comunes</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">
            El problema en la construcción de
            <br />
            <span className="text-red-400">pequeña y mediana escala</span>
          </h2>
          <p className="text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Métodos informales, herramientas inadecuadas y coordinación deficiente
          </p>
        </div>

        {/* Cards de problemas mejoradas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {problems.map((problem, index) => {
            const Icon = problem.icon;
            return (
              <div
                key={problem.key}
                className="group relative p-6 rounded-2xl border bg-white hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                style={{
                  animationDelay: `${index * 200}ms`,
                  animation: 'fadeInUp 0.8s ease-out forwards',
                  opacity: 0,
                }}
              >
                {/* Número de problema */}
                <div className="absolute -top-3 -left-3 w-6 h-6 bg-gray-700 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                
                {/* Ícono mejorado */}
                <div className={`flex items-center justify-center w-16 h-16 rounded-xl ${problem.bgColor} mb-4 mx-auto group-hover:scale-105 transition-transform duration-300`}>
                  <Icon className={`h-8 w-8 ${problem.color}`} />
                </div>
                
                {/* Contenido */}
                <h3 className="text-lg font-bold text-gray-900 mb-3 text-center group-hover:text-gray-700 transition-colors">
                  {t(`issues.${problem.key}.title`)}
                </h3>
                
                <p className="text-gray-600 text-center leading-relaxed text-sm group-hover:text-gray-500 transition-colors">
                  {t(`issues.${problem.key}.description`)}
                </p>
                
                {/* Efecto hover */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-transparent to-gray-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            );
          })}
        </div>

        {/* Call to action mejorado */}
        <div className="text-center">
          <div className="relative bg-gradient-to-br from-gray-800 to-gray-700 p-8 rounded-2xl shadow-xl max-w-4xl mx-auto overflow-hidden">
            {/* Elementos decorativos de fondo */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-400/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-orange-400/10 rounded-full blur-xl"></div>
            
            <div className="relative z-10">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                ¿Te suena familiar?
              </h3>
              <p className="text-base text-gray-300 mb-6 max-w-2xl mx-auto leading-relaxed">
                Si estás experimentando estos problemas en tus obras, GROWS tiene la solución perfecta para ti.
              </p>
              <button className="group bg-white text-gray-900 px-8 py-3 rounded-lg text-base font-bold hover:bg-gray-100 hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 mx-auto hover:scale-105">
                Ver la Solución
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}

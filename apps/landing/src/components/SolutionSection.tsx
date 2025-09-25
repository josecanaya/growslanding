'use client';

import {useTranslations} from 'next-intl';
import {FileText, Calendar, Eye, Users} from 'lucide-react';
import {cn} from '@/lib/utils';

export function SolutionSection() {
  const t = useTranslations('solution');

  const features = [
    {
      key: 'templates',
      icon: FileText,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      key: 'scheduling',
      icon: Calendar,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      key: 'tracking',
      icon: Eye,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      key: 'centralized',
      icon: Users,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-50',
    },
  ];

  return (
    <section id="solution" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('title')}
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
          <p className="text-lg text-gray-500 max-w-4xl mx-auto">
            {t('description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.key}
                className={cn(
                  'p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1',
                  feature.bgColor
                )}
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-white mb-4">
                  <Icon className={cn('h-6 w-6', feature.color)} />
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {t(`features.${feature.key}.title`)}
                </h3>
                
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t(`features.${feature.key}.description`)}
                </p>
              </div>
            );
          })}
        </div>

        {/* How it works section */}
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              ¿Cómo funciona GROWS?
            </h3>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Un proceso simple y eficiente que transforma la gestión de tus obras
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Carga tu Obra
              </h4>
              <p className="text-gray-600">
                Define tu proyecto y selecciona las tareas desde nuestras plantillas predefinidas
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Asigna Líderes
              </h4>
              <p className="text-gray-600">
                Designa responsables para cada tarea y forma cuadrillas de trabajo
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Sigue el Progreso
              </h4>
              <p className="text-gray-600">
                Monitorea el avance en tiempo real con reportes visuales y automáticos
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

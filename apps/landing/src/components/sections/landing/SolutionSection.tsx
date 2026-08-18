'use client';

import {useTranslations} from 'next-intl';
import {FileText, Calendar, Eye, Users, GitBranch, Building2, TrendingUp, CreditCard} from 'lucide-react';

export function SolutionSection() {
  const t = useTranslations('solution');

  const features = [
    {
      key: 'templates',
      icon: FileText,
    },
    {
      key: 'scheduling',
      icon: Calendar,
    },
    {
      key: 'tracking',
      icon: Eye,
    },
    {
      key: 'centralized',
      icon: Users,
    },
    {
      key: 'grafo',
      icon: GitBranch,
    },
    {
      key: 'multitenant',
      icon: Building2,
    },
    {
      key: 'cpm',
      icon: TrendingUp,
    },
    {
      key: 'payments',
      icon: CreditCard,
    },
  ];

  return (
    <section id="solution" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-grows-text-primary mb-4">
            {t('title')}
          </h2>
          <p className="text-xl text-grows-text-secondary mb-8 max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
          <p className="text-lg text-grows-text-secondary/80 max-w-4xl mx-auto">
            {t('description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.key}
                className="p-6 rounded-grows-md border border-grows-border bg-grows-background hover:shadow-grows-lg hover:bg-white transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-white mb-4">
                  <Icon className="h-6 w-6 text-grows-primary" />
                </div>
                
                <h3 className="text-lg font-semibold text-grows-text-primary mb-3">
                  {t(`features.${feature.key}.title`)}
                </h3>
                
                <p className="text-grows-text-secondary text-sm leading-relaxed">
                  {t(`features.${feature.key}.description`)}
                </p>
              </div>
            );
          })}
        </div>

        {/* How it works section */}
        <div className="bg-gradient-to-r from-grows-background to-grows-neutral rounded-grows-lg p-8 md:p-12">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-grows-text-primary mb-4">
              ¿Cómo funciona GROWS?
            </h3>
            <p className="text-lg text-grows-text-secondary max-w-3xl mx-auto">
              Un proceso simple y eficiente que transforma la gestión de tus obras
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-grows-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="text-lg font-semibold text-grows-text-primary mb-2">
                Carga tu Obra
              </h4>
              <p className="text-grows-text-secondary">
                Define tu proyecto y selecciona las tareas desde nuestro catálogo +1800
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-grows-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="text-lg font-semibold text-grows-text-primary mb-2">
                Asigna Socios
              </h4>
              <p className="text-grows-text-secondary">
                Designa socios constructores para cada tarea y forma cuadrillas de trabajo
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-grows-primary text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="text-lg font-semibold text-grows-text-primary mb-2">
                Sigue el Progreso
              </h4>
              <p className="text-grows-text-secondary">
                Monitorea el avance en tiempo real con reportes visuales, IA y automáticos
              </p>
            </div>
          </div>

          {/* Contenido adicional sin imagen */}
          <div className="mt-12 flex justify-center">
            <div className="w-full max-w-md h-96 rounded-grows-lg bg-grows-neutral flex items-center justify-center shadow-grows-lg">
              <div className="text-center">
                <div className="w-16 h-16 bg-grows-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-white">⚡</span>
                </div>
                <h4 className="text-lg font-semibold text-grows-text-primary mb-2">
                  Automatización Inteligente
                </h4>
                <p className="text-grows-text-secondary text-sm">
                  Tecnología digital para la construcción moderna
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

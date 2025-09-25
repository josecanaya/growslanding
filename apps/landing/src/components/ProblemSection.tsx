'use client';

import {useTranslations} from 'next-intl';
import {AlertTriangle, Wrench, TrendingDown} from 'lucide-react';
import {cn} from '@/lib/utils';

export function ProblemSection() {
  const t = useTranslations('problem');

  const problems = [
    {
      key: 'informal',
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
    },
    {
      key: 'tools',
      icon: Wrench,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      key: 'consequences',
      icon: TrendingDown,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
    },
  ];

  return (
    <section id="problem" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {problems.map((problem) => {
            const Icon = problem.icon;
            return (
              <div
                key={problem.key}
                className={cn(
                  'p-8 rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow duration-300',
                  problem.bgColor
                )}
              >
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white mb-6 mx-auto">
                  <Icon className={cn('h-8 w-8', problem.color)} />
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                  {t(`issues.${problem.key}.title`)}
                </h3>
                
                <p className="text-gray-600 text-center leading-relaxed">
                  {t(`issues.${problem.key}.description`)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Call to action */}
        <div className="text-center mt-16">
          <div className="bg-white p-8 rounded-2xl shadow-lg max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              ¿Te suena familiar?
            </h3>
            <p className="text-lg text-gray-600 mb-6">
              Si estás experimentando estos problemas en tus obras, GROWS tiene la solución perfecta para ti.
            </p>
            <button className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200">
              Ver la Solución
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

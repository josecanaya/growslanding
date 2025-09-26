'use client';

import {useTranslations} from 'next-intl';
import {Building2, Users, UserCheck, CheckCircle} from 'lucide-react';
import {cn} from '@/lib/utils';

export function UserProfiles() {
  const t = useTranslations('users');

  const userTypes = [
    {
      key: 'cliente',
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      key: 'lider',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    {
      key: 'socio',
      icon: UserCheck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
  ];

  return (
    <section id="users" className="py-20 bg-claro">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-oscuro mb-4">
            {t('title')}
          </h2>
          <p className="text-xl text-oscuro/70 max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {userTypes.map((userType) => {
            const Icon = userType.icon;
            return (
              <div
                key={userType.key}
                className={cn(
                  'p-8 rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-2',
                  'bg-white border-claro'
                )}
              >
                <div className="text-center mb-6">
                  <div className={cn(
                    'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
                    'bg-claro'
                  )}>
                    <Icon className={cn('h-8 w-8', 'text-primario')} />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-oscuro mb-2">
                    {t(`${userType.key}.title`)}
                  </h3>
                  
                  <p className="text-oscuro/70 mb-6">
                    {t(`${userType.key}.subtitle`)}
                  </p>
                </div>

                <div className="space-y-4">
                  {[0, 1, 2, 3].map((index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-acento mt-0.5 flex-shrink-0" />
                      <p className="text-oscuro/80 text-sm leading-relaxed">
                        {t(`${userType.key}.features.${index}`)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 text-center">
                  <button className={cn(
                    'px-6 py-3 rounded-lg font-semibold transition-colors duration-200',
                    'bg-primario text-white hover:bg-primario/90 hover:shadow-md'
                  )}>
                    Saber más
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional info about the ecosystem */}
        <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-oscuro mb-4">
              Un Ecosistema Completo
            </h3>
            <p className="text-lg text-oscuro/70 max-w-3xl mx-auto">
              GROWS conecta a todos los actores de la construcción en una plataforma unificada
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-oscuro mb-4">
                Sistema de Niveles y Reputación
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-acento rounded-full"></div>
                  <span className="text-oscuro/80">Hierro: Estructura básica</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-acento rounded-full"></div>
                  <span className="text-oscuro/80">Bronce: Estructura / Obra gris</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-acento rounded-full"></div>
                  <span className="text-oscuro/80">Plata: Estructura / Obra gris</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-acento rounded-full"></div>
                  <span className="text-oscuro/80">Platino: Todas las etapas</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-acento rounded-full"></div>
                  <span className="text-oscuro/80">Oro: Líder habilitado</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-oscuro mb-4">
                Beneficios Clave
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-acento mt-0.5 flex-shrink-0" />
                  <span className="text-oscuro/80">Estandarización de procesos</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-acento mt-0.5 flex-shrink-0" />
                  <span className="text-oscuro/80">Trazabilidad completa</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-acento mt-0.5 flex-shrink-0" />
                  <span className="text-oscuro/80">Planificación automática</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-acento mt-0.5 flex-shrink-0" />
                  <span className="text-oscuro/80">Sin comisiones por tarea</span>
                </div>
              </div>
            </div>
          </div>

          {/* Imagen de familia feliz - resultado final */}
          <div className="mt-12 flex justify-center">
            <div className="w-full max-w-lg h-96 rounded-2xl overflow-hidden shadow-lg">
              <img 
                src="/images/familia.png" 
                alt="Familia feliz disfrutando su nueva casa construida con GROWS"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

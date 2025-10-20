'use client';

import {useTranslations} from 'next-intl';
import {Building2, UserCheck, CheckCircle} from 'lucide-react';

export function UserProfiles() {
  const t = useTranslations('users');

  const userTypes = [
    {
      key: 'coordinador',
      icon: Building2,
    },
    {
      key: 'socio',
      icon: UserCheck,
    },
  ];

  return (
    <section id="users" className="py-20 bg-grows-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-grows-text-primary mb-4">
            {t('title')}
          </h2>
          <p className="text-xl text-grows-text-secondary max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {userTypes.map((userType) => {
            const Icon = userType.icon;
            return (
              <div
                key={userType.key}
                className="p-8 rounded-grows-lg border-2 border-grows-border bg-white transition-all duration-300 hover:shadow-grows-xl hover:-translate-y-2"
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-grows-background flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-grows-primary" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-grows-text-primary mb-2">
                    {t(`${userType.key}.title`)}
                  </h3>
                  
                  <p className="text-grows-text-secondary mb-6">
                    {t(`${userType.key}.subtitle`)}
                  </p>
                </div>

                <div className="space-y-4">
                  {[0, 1, 2, 3].map((index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-grows-secondary mt-0.5 flex-shrink-0" />
                      <p className="text-grows-text-primary/80 text-sm leading-relaxed">
                        {t(`${userType.key}.features.${index}`)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 text-center">
                  <a
                    href="#pricing"
                    className="inline-block px-6 py-3 rounded-grows-md font-semibold bg-grows-primary text-white hover:bg-grows-primary/90 hover:shadow-grows-md transition-all duration-200"
                  >
                    Ver planes
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional info about the ecosystem */}
        <div className="mt-16 bg-white rounded-grows-lg p-8 shadow-grows-lg">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-grows-text-primary mb-4">
              Un Ecosistema Completo
            </h3>
            <p className="text-lg text-grows-text-secondary max-w-3xl mx-auto">
              GROWS conecta coordinadores de obra y socios constructores en una plataforma unificada con IA
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-grows-text-primary mb-4">
                Sistema de Niveles y Reputación
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-grows-secondary rounded-full"></div>
                  <span className="text-grows-text-primary/80">Hierro: Estructura básica (0h)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-grows-secondary rounded-full"></div>
                  <span className="text-grows-text-primary/80">Bronce: Estructura / Obra gris (180h)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-grows-secondary rounded-full"></div>
                  <span className="text-grows-text-primary/80">Plata: Estructura / Obra gris (300h)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-grows-secondary rounded-full"></div>
                  <span className="text-grows-text-primary/80">Platino: Todas las etapas (700h)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-grows-secondary rounded-full"></div>
                  <span className="text-grows-text-primary/80">Oro: Líder habilitado (1200h)</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-grows-text-primary mb-4">
                Beneficios Clave
              </h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-grows-secondary mt-0.5 flex-shrink-0" />
                  <span className="text-grows-text-primary/80">Estandarización de procesos con +1800 catálogos</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-grows-secondary mt-0.5 flex-shrink-0" />
                  <span className="text-grows-text-primary/80">Trazabilidad completa con FSM</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-grows-secondary mt-0.5 flex-shrink-0" />
                  <span className="text-grows-text-primary/80">Planificación automática con CPM</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-grows-secondary mt-0.5 flex-shrink-0" />
                  <span className="text-grows-text-primary/80">Asistencia IA 24/7 con GrowsBot</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido adicional sin imagen */}
          <div className="mt-12 flex justify-center">
            <div className="w-full max-w-lg h-96 rounded-grows-lg bg-grows-neutral flex items-center justify-center shadow-grows-md">
              <div className="text-center">
                <div className="w-20 h-20 bg-grows-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl">🏠</span>
                </div>
                <h4 className="text-xl font-semibold text-grows-text-primary mb-2">
                  Resultados Reales
                </h4>
                <p className="text-grows-text-secondary">
                  Familias felices con sus nuevas casas construidas eficientemente
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

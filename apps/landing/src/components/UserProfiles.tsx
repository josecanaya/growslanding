'use client';

import { useTranslations } from 'next-intl';
import { Building2, UserCheck, CheckCircle, ArrowRight, Star, Award, TrendingUp, Users, Zap, Home, Shield, Target } from 'lucide-react';

export function UserProfiles() {
  const t = useTranslations('users');

  const userTypes = [
    {
      key: 'coordinador',
      icon: Building2,
      color: 'grows-primary',
      bgGradient: 'from-grows-primary/5 to-grows-primary/10',
      borderColor: 'border-grows-primary/20',
      iconBg: 'bg-grows-primary/10',
      iconColor: 'text-grows-primary',
      badge: 'Para Líderes',
      badgeBg: 'bg-grows-primary',
      badgeText: 'text-grows-secondary'
    },
    {
      key: 'socio',
      icon: UserCheck,
      color: 'grows-secondary',
      bgGradient: 'from-grows-secondary/5 to-grows-secondary/10',
      borderColor: 'border-grows-secondary/20',
      iconBg: 'bg-grows-secondary/10',
      iconColor: 'text-grows-secondary',
      badge: 'Para Ejecutores',
      badgeBg: 'bg-grows-secondary',
      badgeText: 'text-grows-text-primary'
    },
  ];

  const reputationLevels = [
    { level: 'Hierro', description: 'Estructura básica', hours: '0h', color: 'bg-gray-100', textColor: 'text-gray-700' },
    { level: 'Bronce', description: 'Estructura / Obra gris', hours: '180h', color: 'bg-orange-100', textColor: 'text-orange-700' },
    { level: 'Plata', description: 'Estructura / Obra gris', hours: '300h', color: 'bg-gray-200', textColor: 'text-gray-600' },
    { level: 'Platino', description: 'Todas las etapas', hours: '700h', color: 'bg-blue-100', textColor: 'text-blue-700' },
    { level: 'Oro', description: 'Líder habilitado', hours: '1200h', color: 'bg-yellow-100', textColor: 'text-yellow-700' }
  ];

  const keyBenefits = [
    { icon: CheckCircle, text: 'Estandarización de procesos con +1800 catálogos' },
    { icon: CheckCircle, text: 'Trazabilidad completa con FSM' },
    { icon: CheckCircle, text: 'Planificación automática con CPM' },
    { icon: CheckCircle, text: 'Asistencia IA 24/7 con GrowsBot' }
  ];

  return (
    <section id="users" className="py-24 bg-grows-surface">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        
        {/* Header Elegante */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-grows-background border border-grows-border rounded-full mb-8">
            <Users className="h-4 w-4 text-grows-primary" />
            <span className="text-sm font-semibold text-grows-text-primary">Perfiles de Usuario</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-grows-text-primary mb-6 leading-tight">
            Cada rol trabaja en un entorno digital
            <br />
            <span className="text-grows-primary">claro y adaptado</span>
          </h2>
          <p className="text-lg text-grows-text-secondary max-w-3xl mx-auto leading-relaxed">
            GROWS se adapta a las necesidades específicas de cada profesional en la cadena de construcción
          </p>
        </div>

        {/* Cards de Usuarios Elegantes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-20">
          {userTypes.map((userType, index) => {
            const Icon = userType.icon;
            return (
              <div
                key={userType.key}
                className="group relative bg-grows-surface rounded-3xl border border-grows-border shadow-grows-sm hover:shadow-grows-lg transition-all duration-500 overflow-hidden"
                style={{
                  animationDelay: `${index * 200}ms`,
                  animation: 'fadeInUp 0.8s ease-out forwards',
                  opacity: 0,
                }}
              >
                {/* Badge Superior */}
                <div className="absolute top-6 right-6 z-10">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${userType.badgeBg} ${userType.badgeText}`}>
                    {userType.badge}
                  </span>
                </div>

                {/* Contenido Principal */}
                <div className="p-8">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <div className={`w-20 h-20 ${userType.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`h-10 w-10 ${userType.iconColor}`} />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-grows-text-primary mb-3">
                      {t(`${userType.key}.title`)}
                    </h3>
                    
                    <p className="text-grows-text-secondary text-base leading-relaxed">
                      {t(`${userType.key}.subtitle`)}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-4 mb-8">
                    {[0, 1, 2, 3].map((featureIndex) => (
                      <div key={featureIndex} className="flex items-start gap-4 group/item">
                        <div className={`w-6 h-6 ${userType.iconBg} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform duration-200`}>
                          <CheckCircle className={`h-4 w-4 ${userType.iconColor}`} />
                        </div>
                        <p className="text-grows-text-primary leading-relaxed group-hover/item:text-grows-text-primary transition-colors duration-200">
                          {t(`${userType.key}.features.${featureIndex}`)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Botón */}
                  <div className="text-center">
                    <a
                      href="#pricing"
                      className={`group/btn inline-flex items-center gap-2 px-8 py-4 ${userType.iconBg} ${userType.iconColor} font-semibold rounded-xl hover:shadow-grows-lg transition-all duration-300 hover:scale-105 border border-grows-border`}
                    >
                      Ver planes
                      <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform duration-200" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ecosistema Completo Elegante */}
        <div className="bg-grows-surface rounded-3xl border border-grows-border shadow-grows-lg overflow-hidden">
          {/* Header del Ecosistema */}
          <div className="bg-gradient-to-r from-grows-background to-grows-neutral p-8 text-center border-b border-grows-border">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-grows-primary rounded-full mb-6">
              <Zap className="h-4 w-4 text-grows-secondary" />
              <span className="text-sm font-semibold text-grows-secondary">Ecosistema Completo</span>
            </div>
            <h3 className="text-3xl font-bold text-grows-text-primary mb-4">
              Un Ecosistema Completo
            </h3>
            <p className="text-lg text-grows-text-secondary max-w-3xl mx-auto leading-relaxed">
              GROWS conecta coordinadores de obra y socios constructores en una plataforma unificada con IA
            </p>
          </div>

          {/* Contenido Principal */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              
              {/* Sistema de Niveles */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-grows-primary rounded-xl flex items-center justify-center">
                    <Award className="h-5 w-5 text-grows-secondary" />
                  </div>
                  <h4 className="text-xl font-bold text-grows-text-primary">Sistema de Niveles y Reputación</h4>
                </div>
                <div className="space-y-3">
                  {reputationLevels.map((level, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 rounded-xl hover:bg-grows-background transition-colors duration-200">
                      <div className={`w-10 h-10 ${level.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <Star className={`h-5 w-5 ${level.textColor}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-semibold text-grows-text-primary">{level.level}</h5>
                          <span className="text-sm text-grows-text-secondary">({level.hours})</span>
                        </div>
                        <p className="text-sm text-grows-text-secondary">{level.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Beneficios Clave */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-grows-primary rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-grows-secondary" />
                  </div>
                  <h4 className="text-xl font-bold text-grows-text-primary">Beneficios Clave</h4>
                </div>
                <div className="space-y-3">
                  {keyBenefits.map((benefit, index) => {
                    const Icon = benefit.icon;
                    return (
                      <div key={index} className="flex items-start gap-4 p-4 rounded-xl hover:bg-grows-background transition-colors duration-200">
                        <div className="w-8 h-8 bg-grows-primary rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon className="h-4 w-4 text-grows-secondary" />
                        </div>
                        <p className="text-grows-text-primary leading-relaxed">{benefit.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Resultados Reales Elegante */}
            <div className="mt-12">
              <div className="bg-gradient-to-r from-grows-background to-grows-neutral rounded-2xl p-8 text-center">
                <div className="w-16 h-16 bg-grows-secondary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Home className="h-8 w-8 text-grows-text-primary" />
                </div>
                <h4 className="text-2xl font-bold text-grows-text-primary mb-4">Resultados Reales</h4>
                <p className="text-grows-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
                  Familias felices con sus nuevas casas construidas eficientemente
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

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
    </section>
  );
}
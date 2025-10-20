'use client';

import { Users, TrendingUp, Award, Building, ArrowRight, Zap, Target, Star, CheckCircle, Home } from 'lucide-react';

export function EcosystemSection() {
  const reputationLevels = [
    {
      level: "Hierro",
      description: "Estructura básica",
      hours: "0h",
      color: "bg-gray-100",
      textColor: "text-gray-700"
    },
    {
      level: "Bronce", 
      description: "Estructura / Obra gris",
      hours: "100h",
      color: "bg-orange-100",
      textColor: "text-orange-700"
    },
    {
      level: "Plata",
      description: "Estructura / Obra gris", 
      hours: "300h",
      color: "bg-gray-200",
      textColor: "text-gray-600"
    },
    {
      level: "Platino",
      description: "Todas las etapas",
      hours: "700h", 
      color: "bg-blue-100",
      textColor: "text-blue-700"
    },
    {
      level: "Oro",
      description: "Líder habilitado",
      hours: "1200h",
      color: "bg-yellow-100", 
      textColor: "text-yellow-700"
    }
  ];

  const keyBenefits = [
    {
      icon: CheckCircle,
      text: "Estandarización de procesos con +1000 catálogos"
    },
    {
      icon: CheckCircle,
      text: "Trazabilidad completa con FSM"
    },
    {
      icon: CheckCircle,
      text: "Planificación automática con CPM"
    },
    {
      icon: CheckCircle,
      text: "Asistencia IA 24/7 con GrowsBot"
    }
  ];

  return (
    <section className="py-20 bg-grows-surface">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-grows-background border border-grows-border rounded-full mb-6">
            <Zap className="h-4 w-4 text-grows-primary" />
            <span className="text-sm font-semibold text-grows-text-primary">Ecosistema GROWS</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-grows-text-primary mb-6 leading-tight">
            Un <span className="text-grows-primary">Ecosistema Completo</span>
          </h2>
          <p className="text-lg text-grows-text-secondary max-w-3xl mx-auto leading-relaxed">
            GROWS conecta coordinadores de obra y socios constructores en una plataforma unificada con IA
          </p>
        </div>

        {/* Sistema de Niveles y Beneficios */}
        <div className="mb-20">
          <div className="bg-grows-surface rounded-2xl border border-grows-border p-8 shadow-grows-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              
              {/* Sistema de Niveles y Reputación */}
              <div>
                <h3 className="text-2xl font-bold text-grows-text-primary mb-6">Sistema de Niveles y Reputación</h3>
                <div className="space-y-4">
                  {reputationLevels.map((level, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${level.color} rounded-full flex items-center justify-center`}>
                        <Award className={`w-6 h-6 ${level.textColor}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-grows-text-primary">{level.level}</h4>
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
                <h3 className="text-2xl font-bold text-grows-text-primary mb-6">Beneficios Clave</h3>
                <div className="space-y-4">
                  {keyBenefits.map((benefit, index) => {
                    const Icon = benefit.icon;
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-grows-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon className="w-4 h-4 text-grows-secondary" />
                        </div>
                        <p className="text-grows-text-primary leading-relaxed">{benefit.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Resultados Reales */}
            <div className="mt-12 text-center">
              <div className="bg-grows-background rounded-xl p-6 max-w-md mx-auto">
                <div className="w-12 h-12 bg-grows-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <Home className="w-6 h-6 text-grows-text-primary" />
                </div>
                <h4 className="text-lg font-semibold text-grows-text-primary mb-2">Resultados Reales</h4>
                <p className="text-grows-text-secondary">Familias felices con sus nuevas casas construidas eficientemente</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ejemplo de Escalamiento */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-grows-text-primary mb-4">Ejemplo: Escalamiento de un Profesional</h3>
            <p className="text-grows-text-secondary">Cómo un obrero puede crecer hasta director usando GROWS</p>
          </div>
          
          <div className="bg-grows-surface rounded-2xl border border-grows-border p-8 shadow-grows-sm">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              {/* Carrera Profesional */}
              <div className="flex-1">
                <h4 className="text-xl font-semibold text-grows-text-primary mb-6">Carrera Profesional</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-gray-700" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-grows-text-primary">Obrero</h5>
                      <p className="text-sm text-grows-text-secondary">Trabajador de campo</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-grows-text-secondary" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Target className="w-6 h-6 text-blue-700" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-grows-text-primary">Capataz</h5>
                      <p className="text-sm text-grows-text-secondary">Supervisión de cuadrilla</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-grows-text-secondary" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Award className="w-6 h-6 text-green-700" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-grows-text-primary">Jefe de Obra</h5>
                      <p className="text-sm text-grows-text-secondary">Gestión de proyecto</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-grows-text-secondary" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Building className="w-6 h-6 text-purple-700" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold text-grows-text-primary">Director</h5>
                      <p className="text-sm text-grows-text-secondary">Liderazgo empresarial</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Beneficios del Ecosistema */}
              <div className="flex-1">
                <h4 className="text-xl font-semibold text-grows-text-primary mb-6">Beneficios del Ecosistema</h4>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-grows-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-grows-secondary" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-grows-text-primary mb-1">Escalamiento Automático</h5>
                      <p className="text-sm text-grows-text-secondary">Los trabajadores pueden crecer profesionalmente dentro del ecosistema GROWS</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-grows-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-grows-secondary" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-grows-text-primary mb-1">Red de Profesionales</h5>
                      <p className="text-sm text-grows-text-secondary">Conecta con otros profesionales del sector para colaboraciones</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-grows-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <Star className="w-5 h-5 text-grows-secondary" />
                    </div>
                    <div>
                      <h5 className="font-semibold text-grows-text-primary mb-1">Reputación Digital</h5>
                      <p className="text-sm text-grows-text-secondary">Construye tu perfil profesional con proyectos verificados</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA del Ecosistema */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-grows-primary to-grows-primary/90 rounded-2xl p-8 max-w-4xl mx-auto shadow-grows-lg">
            <h3 className="text-2xl font-bold text-grows-text-primary mb-4">Únete al ecosistema que transforma la construcción</h3>
            <p className="text-grows-text-secondary mb-6 text-lg">Crecimiento profesional garantizado con herramientas enterprise</p>
            <button className="bg-grows-secondary hover:bg-grows-secondary/90 text-grows-text-primary font-semibold px-8 py-4 rounded-xl transition-all duration-300 hover:shadow-grows-lg hover:scale-105 flex items-center gap-2 mx-auto">
              Explorar ecosistema
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
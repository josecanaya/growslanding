'use client';

import { Check, X, Star } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useLocale } from 'next-intl';

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: { text: string; included: boolean }[];
  highlighted?: boolean;
  badge?: string;
  cta: string;
  ctaLink: string;
}

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);
  const locale = useLocale();

  const plans: Plan[] = [
    {
      name: 'Free',
      price: '$0',
      period: 'para siempre',
      description: 'Ideal para explorar la plataforma',
      features: [
        { text: '2 obras activas', included: true },
        { text: 'Catálogo básico de tareas', included: true },
        { text: 'Panel de seguimiento', included: true },
        { text: 'Soporte por email', included: true },
        { text: 'Sin vincular obreros', included: false },
        { text: 'Sin automatizaciones', included: false },
      ],
      cta: 'Empezar gratis',
      ctaLink: `/${locale}/coming-soon`,
    },
    {
      name: 'Starter',
      price: isAnnual ? '$39' : '$49',
      period: 'por mes',
      description: 'Para estudios pequeños',
      features: [
        { text: '5 obras activas', included: true },
        { text: 'Hasta 3 socios habilitados', included: true },
        { text: 'Máximo 3 tareas simultáneas', included: true },
        { text: 'Automatizaciones básicas', included: true },
        { text: 'Reportes simples', included: true },
        { text: 'Soporte prioritario', included: false },
      ],
      cta: 'Contratar Starter',
      ctaLink: `/${locale}/coming-soon`,
    },
    {
      name: 'Pro',
      price: isAnnual ? '$79' : '$99',
      period: 'por mes',
      description: 'Funciones avanzadas completas',
      highlighted: true,
      badge: 'Más popular',
      features: [
        { text: '10 obras activas', included: true },
        { text: 'Hasta 25 socios', included: true },
        { text: '10 tareas simultáneas', included: true },
        { text: 'Automatizaciones rápidas', included: true },
        { text: 'Exportación datos (PDF/CSV)', included: true },
        { text: 'Soporte técnico prioritario', included: true },
      ],
      cta: 'Contratar Pro',
      ctaLink: `/${locale}/coming-soon`,
    },
    {
      name: 'Enterprise',
      price: isAnnual ? '$160' : '$200',
      period: 'por mes',
      description: 'Grandes volúmenes y personalizaciones',
      badge: 'En desarrollo',
      features: [
        { text: 'Obras ilimitadas', included: true },
        { text: 'Socios ilimitados', included: true },
        { text: 'Integraciones externas', included: true },
        { text: 'Dashboard avanzado', included: true },
        { text: 'Despliegue dedicado', included: true },
        { text: 'Soporte gerenciado 24/7', included: true },
      ],
      cta: 'Acceso anticipado',
      ctaLink: `/${locale}/coming-soon`,
    },
  ];

  return (
    <section id="pricing" className="relative bg-white py-20">
      <span
        id="precios"
        className="pointer-events-none absolute -top-24 h-px w-px"
        aria-hidden="true"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-grows-text-primary mb-4">
            Planes para cada etapa de tu negocio
          </h2>
          <p className="text-xl text-grows-text-secondary max-w-3xl mx-auto mb-8">
            Empezá gratis y escalá cuando lo necesites. Sin sorpresas.
          </p>

          {/* Toggle Mensual/Anual */}
          <div className="inline-flex items-center gap-4 bg-grows-background p-2 rounded-grows-md">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-grows-sm font-medium transition-all ${
                !isAnnual
                  ? 'bg-white text-grows-primary shadow-grows-sm'
                  : 'text-grows-text-secondary'
              }`}
            >
              Mensual
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 rounded-grows-sm font-medium transition-all ${
                isAnnual
                  ? 'bg-white text-grows-primary shadow-grows-sm'
                  : 'text-grows-text-secondary'
              }`}
            >
              Anual
              <span className="ml-2 text-xs bg-grows-success text-white px-2 py-1 rounded-full">
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-grows-lg p-8 border-2 transition-all hover:shadow-grows-lg ${
                plan.highlighted
                  ? 'border-grows-primary bg-grows-primary/5 shadow-grows-md transform scale-105'
                  : 'border-grows-border bg-white'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className={`flex items-center gap-1 px-4 py-1 rounded-full text-sm font-semibold ${
                    plan.highlighted 
                      ? 'bg-grows-primary text-white' 
                      : 'bg-grows-warning text-grows-text-primary'
                  }`}>
                    {plan.highlighted && <Star className="h-3 w-3 fill-current" />}
                    {plan.badge}
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-grows-text-primary mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold text-grows-primary">
                    {plan.price}
                  </span>
                  <span className="text-grows-text-secondary text-sm">
                    {plan.period}
                  </span>
                </div>
                <p className="text-sm text-grows-text-secondary">
                  {plan.description}
                </p>
              </div>

              {/* Features List */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="h-5 w-5 text-grows-success flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="h-5 w-5 text-grows-text-secondary/40 flex-shrink-0 mt-0.5" />
                    )}
                    <span
                      className={
                        feature.included
                          ? 'text-grows-text-primary text-sm'
                          : 'text-grows-text-secondary/60 text-sm line-through'
                      }
                    >
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={plan.ctaLink}
                className={`block w-full py-3 px-6 rounded-grows-md font-semibold transition-all text-center ${
                  plan.highlighted
                    ? 'bg-grows-primary text-white hover:bg-grows-primary/90 hover:shadow-grows-md'
                    : 'border-2 border-grows-primary text-grows-primary hover:bg-grows-primary hover:text-white'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-grows-text-secondary">
            Todos los planes incluyen actualizaciones automáticas.
            <br />
            ¿Necesitás más información?{' '}
            <a href="#contact" className="text-grows-primary font-semibold hover:underline">
              Contactanos
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}


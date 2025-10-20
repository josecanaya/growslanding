# 💻 EJEMPLOS DE CÓDIGO - REDISEÑO LANDING

Este documento complementa el `INFORME-REDISEÑO-LANDING.md` con ejemplos concretos de código.

---

## 🎨 1. TAILWIND CONFIG ACTUALIZADO

```javascript
// apps/landing/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta GROWS alineada con app web
        'grows-primary': '#1B5E20',
        'grows-secondary': '#E8C547',
        'grows-background': '#F5F7F5',
        'grows-surface': '#FFFFFF',
        'grows-border': '#E0E0E0',
        'grows-text-primary': '#1A1A1A',
        'grows-text-secondary': '#444444',
        'grows-error': '#B71C1C',
        'grows-success': '#388E3C',
        'grows-warning': '#FBC02D',
        'grows-neutral': '#F0F2F0',
        
        // Legacy (mantener para compatibilidad temporal)
        primario: '#1B263B',
        secundario: '#f5f7fa',
        acento: '#f4e27e',
        claro: '#eaf0f6',
        oscuro: '#10161a',
      },
      fontFamily: {
        sans: ['Inter', 'Nunito', 'Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'grows-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'grows-md': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'grows-lg': '0 10px 15px rgba(0, 0, 0, 0.15)',
        'grows-xl': '0 20px 25px rgba(0, 0, 0, 0.2)',
      },
      borderRadius: {
        'grows-sm': '0.25rem',
        'grows-md': '0.5rem',
        'grows-lg': '1rem',
        'grows-xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
```

---

## 🦸 2. HERO MEJORADO

```tsx
// apps/landing/src/components/Hero.tsx
'use client';

import { ArrowRight, Play, Sparkles } from 'lucide-react';

export function Hero() {
  return (
    <section id="home" className="pt-16 bg-gradient-to-br from-grows-background to-grows-neutral">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Contenido de texto */}
          <div className="text-left">
            {/* Badge IA */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-grows-secondary/20 border border-grows-secondary rounded-full mb-6">
              <Sparkles className="h-4 w-4 text-grows-primary" />
              <span className="text-sm font-semibold text-grows-primary">
                Ahora con IA integrada · GrowsBot
              </span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl md:text-6xl font-bold text-grows-text-primary mb-6 leading-tight">
              <span className="text-grows-primary">GROWS</span>
              <br />
              <span className="text-3xl md:text-5xl">
                Plataforma B2B de
              </span>
              <br />
              <span className="text-3xl md:text-5xl">
                Gestión Inteligente con IA
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-grows-text-secondary mb-8 leading-relaxed">
              Obras de pequeña y mediana escala con control profesional
            </p>

            {/* Description */}
            <p className="text-lg text-grows-text-secondary/80 mb-12 leading-relaxed">
              Centraliza planificación, ejecución y control con <strong>GrowsBot (IA)</strong>, 
              <strong>+1800 catálogos</strong> constructivos y cronogramas automáticos por <strong>CPM</strong>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-grows-primary text-white px-8 py-4 rounded-grows-md text-lg font-semibold hover:bg-grows-primary/90 hover:shadow-grows-lg transition-all duration-200 flex items-center justify-center gap-2">
                Empezar gratis
                <ArrowRight className="h-5 w-5" />
              </button>
              
              <button className="border-2 border-grows-primary text-grows-primary px-8 py-4 rounded-grows-md text-lg font-semibold hover:bg-grows-primary hover:text-white transition-all duration-200 flex items-center justify-center gap-2">
                <Play className="h-5 w-5" />
                Ver demo en vivo
              </button>
            </div>
          </div>

          {/* Video/Imagen demo */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-2xl h-[500px] rounded-grows-lg overflow-hidden shadow-grows-xl border-2 border-grows-border">
              {/* Opción 1: Imagen */}
              <img 
                src="/images/arquitecto.png" 
                alt="Dashboard GROWS - Gestión de obras con IA"
                className="w-full h-full object-cover"
              />
              
              {/* Opción 2: Video (descomentar cuando esté disponible) */}
              {/* <video 
                src="/videos/demo-grows.mp4" 
                poster="/images/arquitecto.png"
                controls
                className="w-full h-full object-cover"
              /> */}
            </div>
          </div>
        </div>

        {/* Stats actualizadas */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center bg-white rounded-grows-md p-6 shadow-grows-sm">
            <div className="text-3xl font-bold text-grows-primary mb-2">+1800</div>
            <div className="text-grows-text-secondary">Tareas Estandarizadas</div>
          </div>
          <div className="text-center bg-white rounded-grows-md p-6 shadow-grows-sm">
            <div className="text-3xl font-bold text-grows-primary mb-2">100%</div>
            <div className="text-grows-text-secondary">Trazabilidad FSM</div>
          </div>
          <div className="text-center bg-white rounded-grows-md p-6 shadow-grows-sm">
            <div className="text-3xl font-bold text-grows-primary mb-2">24/7</div>
            <div className="text-grows-text-secondary">Soporte con GrowsBot</div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

---

## 💰 3. PRICING SECTION (NUEVO)

```tsx
// apps/landing/src/components/PricingSection.tsx
'use client';

import { Check, X, Star } from 'lucide-react';
import { useState } from 'react';

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: { text: string; included: boolean }[];
  highlighted?: boolean;
  badge?: string; // Para "En desarrollo" o "Más popular"
  cta: string;
}

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);

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
    },
    {
      name: 'Pro',
      price: isAnnual ? '$79' : '$99',
      period: 'por mes',
      description: 'Funciones avanzadas completas',
      highlighted: true,
      features: [
        { text: '10 obras activas', included: true },
        { text: 'Hasta 25 socios', included: true },
        { text: '10 tareas simultáneas', included: true },
        { text: 'Automatizaciones rápidas', included: true },
        { text: 'Exportación datos (PDF/CSV)', included: true },
        { text: 'Soporte técnico prioritario', included: true },
      ],
      cta: 'Contratar Pro',
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
    },
  ];

  return (
    <section id="pricing" className="py-20 bg-white">
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
                  {plan.price !== 'Custom' && (
                    <span className="text-grows-text-secondary text-sm">
                      {plan.period}
                    </span>
                  )}
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
              <button
                className={`w-full py-3 px-6 rounded-grows-md font-semibold transition-all ${
                  plan.highlighted
                    ? 'bg-grows-primary text-white hover:bg-grows-primary/90 hover:shadow-grows-md'
                    : 'border-2 border-grows-primary text-grows-primary hover:bg-grows-primary hover:text-white'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <p className="text-sm text-grows-text-secondary">
            Todos los planes incluyen actualizaciones automáticas y acceso al roadmap público.
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
```

---

## 🤖 4. SOLUTION SECTION - CON GROWSBOT

```tsx
// apps/landing/src/components/SolutionSection.tsx (PARCIAL)
// Agregar estos features al array existente:

const features = [
  // ... features existentes (templates, scheduling, tracking, centralized)
  
  {
    key: 'growsbot',
    icon: MessageSquare, // Importar: import { MessageSquare } from 'lucide-react';
    title: 'GrowsBot (IA)',
    description: 'Asistente inteligente 24/7 que responde consultas técnicas, sugiere optimizaciones y registra contexto operativo',
  },
  {
    key: 'multitenant',
    icon: Building2, // Ya debería estar importado
    title: 'Multi-tenant',
    description: 'Organizaciones aisladas con usuarios globales. Gestión segura de obras, socios y planes por cliente técnico',
  },
  {
    key: 'cpm',
    icon: TrendingUp, // Importar: import { TrendingUp } from 'lucide-react';
    title: 'CPM Automático',
    description: 'Calculamos el camino crítico on-demand. Agregá o modificá tareas y recalculamos plazos respetando dependencias',
  },
  {
    key: 'payments',
    icon: CreditCard, // Importar: import { CreditCard } from 'lucide-react';
    title: 'Pagos Automatizados',
    description: 'Al validar una tarea, se genera pago, notifica a cuadrilla y actualiza KPIs automáticamente',
  },
];

// El resto del componente se mantiene igual, pero usar colores GROWS:
// - Iconos: className="text-grows-primary"
// - Hover: hover:bg-grows-background hover:shadow-grows-lg
```

---

## ❓ 5. FAQ SECTION (NUEVO)

```tsx
// apps/landing/src/components/FAQSection.tsx
'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface FAQ {
  question: string;
  answer: string;
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQ[] = [
    {
      question: '¿Qué diferencia a GROWS de otras plataformas de construcción?',
      answer:
        'GROWS está diseñado específicamente para obras de pequeña y mediana escala (estudios de arquitectura, constructoras pequeñas). Mientras otras herramientas son complejas y costosas para grandes empresas, GROWS ofrece catálogos estandarizados (+1800 tareas), IA conversacional (GrowsBot) y modelo B2B multi-tenant con planes desde $0.',
    },
    {
      question: '¿Cómo funciona el sistema de reputación y niveles?',
      answer:
        'Los socios acumulan horas trabajadas y estrellas (0-5) según puntualidad y calidad. Avanzan desde Hierro (0h) → Bronce (180h) → Plata (300h) → Platino (700h) → Oro (1200h). Cada nivel habilita trabajar en etapas más complejas y Oro permite ser líder operativo.',
    },
    {
      question: '¿Puedo migrar de Free a Pro sin perder datos?',
      answer:
        'Sí, absolutamente. Todas tus obras, tareas, socios y evidencias se mantienen intactas. Solo se desbloquean límites superiores (más obras activas, más socios, automatizaciones avanzadas). El upgrade es instantáneo desde tu panel de Cuenta.',
    },
    {
      question: '¿GrowsBot reemplaza a un supervisor humano?',
      answer:
        'No. GrowsBot es un asistente que complementa, no reemplaza. Orienta sobre procesos, interpreta KPIs y sugiere mejoras 24/7. Las decisiones críticas (validar tareas, aprobar presupuestos, emitir alertas) siempre las ejecuta un humano con rol de Supervisor o Cliente Técnico.',
    },
    {
      question: '¿Los pagos son obligatorios dentro de GROWS?',
      answer:
        'No. El módulo de pagos automatiza la generación de registros contables al validar tareas, pero podés seguir usando tu método habitual (transferencia, efectivo). La funcionalidad principal es la trazabilidad financiera y vinculación tarea-pago para reportes.',
    },
    {
      question: '¿Qué pasa si alcanzo el límite de obras de mi plan?',
      answer:
        'Te notificaremos cuando estés cerca del límite. Podés cerrar obras inactivas o hacer upgrade a un plan superior. En Free (2 obras), al intentar crear la 3ra, GrowsBot te sugiere activar Starter. No se pierden datos en ningún caso.',
    },
  ];

  return (
    <section id="faq" className="py-20 bg-grows-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-grows-text-primary mb-4">
            Preguntas Frecuentes
          </h2>
          <p className="text-xl text-grows-text-secondary">
            Todo lo que necesitás saber sobre GROWS
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-grows-md shadow-grows-sm overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-grows-background/50 transition-colors"
              >
                <span className="font-semibold text-grows-text-primary pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-grows-primary flex-shrink-0 transition-transform ${
                    openIndex === index ? 'transform rotate-180' : ''
                  }`}
                />
              </button>
              
              {openIndex === index && (
                <div className="px-6 pb-6 text-grows-text-secondary leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-grows-text-secondary mb-4">
            ¿No encontraste tu respuesta?
          </p>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-grows-primary text-white rounded-grows-md font-semibold hover:bg-grows-primary/90 hover:shadow-grows-md transition-all"
          >
            Contactar soporte
          </a>
        </div>
      </div>
    </section>
  );
}
```

---

## 🌐 6. MESSAGES/ES.JSON ACTUALIZADO

```json
{
  "hero": {
    "badge": "Ahora con IA integrada · GrowsBot",
    "title": "GROWS – Plataforma B2B de Gestión Inteligente con IA",
    "subtitle": "Obras de pequeña y mediana escala con control profesional",
    "description": "Centraliza planificación, ejecución y control con GrowsBot (IA), +1800 catálogos constructivos y cronogramas automáticos por CPM",
    "ctaPrimary": "Empezar gratis",
    "ctaSecondary": "Ver demo en vivo",
    "stats": {
      "tasks": "+1800 Tareas Estandarizadas",
      "traceability": "100% Trazabilidad FSM",
      "support": "24/7 Soporte con GrowsBot"
    }
  },
  "problem": {
    "title": "El problema en la construcción de pequeña y mediana escala",
    "subtitle": "Métodos informales, herramientas inadecuadas y coordinación deficiente",
    "issues": {
      "informal": {
        "title": "Métodos Informales",
        "description": "Ausencia de planificación sistemática, registros confiables y trazabilidad de decisiones operativas"
      },
      "tools": {
        "title": "Herramientas Inadecuadas",
        "description": "Las plataformas existentes están pensadas para grandes constructoras; estudios de arquitectura y pequeñas empresas quedan sin soluciones"
      },
      "consequences": {
        "title": "Consecuencias Operativas",
        "description": "Sobrecostos, baja productividad, conflictos entre actores y falta de datos para tomar decisiones informadas"
      },
      "coordination": {
        "title": "Coordinación Deficiente",
        "description": "Socios, supervisores y clientes técnicos trabajan desconectados, sin canal único ni trazabilidad de acuerdos"
      }
    },
    "cta": {
      "title": "¿Te suena familiar?",
      "description": "Si gestionás obras con estudios, cuadrillas externas y necesitás control operativo real, GROWS tiene la solución B2B que estabas buscando.",
      "button": "Ver la Solución"
    }
  },
  "solution": {
    "title": "La solución integral GROWS",
    "subtitle": "Gestión centralizada B2B con IA, catálogos estandarizados y automatizaciones",
    "description": "GROWS digitaliza y profesionaliza obras de pequeña y mediana escala con tecnología enterprise accesible para estudios de arquitectura y constructoras",
    "features": {
      "templates": {
        "title": "Plantillas Constructivas",
        "description": "Más de 1800 tareas predefinidas y estandarizadas para cada fase de obra"
      },
      "scheduling": {
        "title": "Cronogramas Automáticos",
        "description": "Planificación inteligente que se ajusta automáticamente según dependencias (CPM)"
      },
      "tracking": {
        "title": "Seguimiento Visual",
        "description": "Control en tiempo real del avance físico, financiero y operativo de cada tarea"
      },
      "centralized": {
        "title": "Gestión Centralizada",
        "description": "Un solo panel B2B multi-tenant para gestionar todas tus obras, socios y cuadrillas"
      },
      "growsbot": {
        "title": "GrowsBot (IA)",
        "description": "Asistente inteligente 24/7 que responde consultas técnicas, sugiere optimizaciones y registra contexto"
      },
      "multitenant": {
        "title": "Multi-tenant Seguro",
        "description": "Organizaciones aisladas con usuarios globales. Gestión segura por cliente técnico"
      },
      "cpm": {
        "title": "CPM Automático",
        "description": "Cálculo on-demand del camino crítico. Agregá tareas y recalculamos plazos automáticamente"
      },
      "payments": {
        "title": "Pagos Automatizados",
        "description": "Validar tarea dispara pago, notifica a cuadrilla y actualiza KPIs sin intervención manual"
      }
    }
  },
  "pricing": {
    "title": "Planes para cada etapa de tu negocio",
    "subtitle": "Empezá gratis y escalá cuando lo necesites. Sin sorpresas.",
    "toggle": {
      "monthly": "Mensual",
      "annual": "Anual",
      "discount": "-20%"
    },
    "plans": {
      "free": {
        "name": "Free",
        "price": "$0",
        "period": "para siempre",
        "description": "Ideal para explorar la plataforma",
        "cta": "Empezar gratis"
      },
      "starter": {
        "name": "Starter",
        "price": "$49",
        "priceAnnual": "$39",
        "period": "por mes",
        "description": "Para estudios pequeños",
        "cta": "Contratar Starter"
      },
      "pro": {
        "name": "Pro",
        "price": "$99",
        "priceAnnual": "$79",
        "period": "por mes",
        "description": "Funciones avanzadas completas",
        "badge": "Más popular",
        "cta": "Contratar Pro"
      },
      "enterprise": {
        "name": "Enterprise",
        "price": "Custom",
        "period": "según necesidades",
        "description": "Grandes volúmenes y personalizaciones",
        "cta": "Contactar ventas"
      }
    }
  },
  "users": {
    "title": "Perfiles de Usuario",
    "subtitle": "Cada rol trabaja en un entorno digital claro y adaptado a sus responsabilidades",
    "coordinador": {
      "title": "Coordinador de Obra",
      "alternativeTitles": "Director de Proyecto | Arquitecto/Estudio | Profesional Constructor",
      "subtitle": "Estudios de arquitectura, arquitectos independientes y pequeñas constructoras",
      "features": [
        "Dashboard general con progreso, costos y KPIs por obra activa",
        "Plantillas constructivas aplicables con un clic desde catálogo +1800",
        "Asignación de socios constructores con control de límites por plan",
        "Notificaciones push sobre cambios de estado y alertas operativas"
      ]
    },
    "socio": {
      "title": "Socio Constructor",
      "subtitle": "Profesional o cuadrilla externa que ejecuta, reporta y mantiene su reputación",
      "features": [
        "Crear obras y gestionar tareas asignadas con checklist digital",
        "Subir presupuestos con evidencia fotográfica geolocalizada",
        "Asignar cuadrillas (microcuadrillas hasta 4 personas) y controlar progreso",
        "Sistema de reputación (⭐ 0-5) y niveles (Hierro → Oro) por horas acumuladas"
      ]
    }
  },
  "technology": {
    "title": "Stack Tecnológico Enterprise",
    "subtitle": "Arquitectura moderna, escalable y segura",
    "stack": {
      "frontend": "Next.js 14 (App Router) + React + TailwindCSS",
      "backend": "Node.js + Supabase (PostgreSQL) + Prisma ORM",
      "ia": "n8n workflows + OpenAI GPT-4 (GrowsBot)",
      "infra": "Vercel + Railway + GitHub"
    },
    "integrations": {
      "title": "Integraciones (Roadmap)",
      "list": [
        "Mercado Pago / Stripe para pagos internacionales",
        "Google Calendar / Outlook para sincronización de hitos",
        "Exportación PDF/CSV de reportes y actas digitales",
        "Webhooks para notificaciones push y email personalizadas"
      ]
    }
  },
  "faq": {
    "title": "Preguntas Frecuentes",
    "subtitle": "Todo lo que necesitás saber sobre GROWS",
    "cta": "¿No encontraste tu respuesta?",
    "contactButton": "Contactar soporte"
  },
  "cta": {
    "title": "Empezá gratis y escalá cuando lo necesites",
    "subtitle": "Plan Free sin límite de tiempo. Probá GROWS con 2 obras, familiarizate con el flujo y activá funciones premium cuando quieras.",
    "emailPlaceholder": "Tu email profesional",
    "submitButton": "Crear cuenta gratis",
    "submitSecondary": "Ver demo en vivo",
    "privacy": "Respetamos tu privacidad. Sin spam, solo información valiosa.",
    "success": "¡Gracias! Te contactaremos pronto con acceso early access.",
    "error": "Hubo un error. Por favor, intenta nuevamente.",
    "stats": {
      "trial": "Sin límite en Free",
      "setup": "5 minutos de setup",
      "support": "Chat con GrowsBot 24/7"
    }
  },
  "footer": {
    "description": "GROWS - Plataforma B2B de Gestión Inteligente para Obras de Construcción con IA",
    "resources": {
      "title": "Recursos",
      "blog": "Blog",
      "docs": "Documentación",
      "guides": "Guías",
      "roadmap": "Roadmap Público"
    },
    "newsletter": {
      "title": "Newsletter",
      "placeholder": "Tu email",
      "button": "Suscribirse"
    },
    "rights": "Todos los derechos reservados",
    "legal": {
      "privacy": "Política de Privacidad",
      "terms": "Términos de Servicio"
    }
  },
  "navigation": {
    "home": "Inicio",
    "problem": "Problema",
    "solution": "Solución",
    "pricing": "Precios",
    "users": "Usuarios",
    "faq": "FAQ",
    "contact": "Contacto"
  }
}
```

---

## ✅ NEXT STEPS

1. Revisar estos ejemplos y validar el enfoque
2. Implementar cambios gradualmente por componente
3. Probar responsive en mobile/tablet/desktop
4. Validar performance (Lighthouse >90)
5. Deploy a staging para QA final

---

**Nota:** Estos son ejemplos funcionales listos para implementar. 
Todos usan la nueva paleta GROWS y están alineados con el contexto del negocio.


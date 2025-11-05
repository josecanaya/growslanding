'use client';

import GrowsReputationSystem from '@/components/GrowsReputationSystem';
import { Navigation } from '@/components/navigation/Navigation';
import { Footer } from '@/components/footer/Footer';
import { ArrowDown, Hammer, ClipboardList, Camera, Users, Bell, Star, MessageSquare } from 'lucide-react';
import { useState } from 'react';

export default function SocioConstructorPage() {
  const features = [
    {
      id: "tareas",
      title: "Tareas en curso",
      description: "Checklist digital con inicio, cierre y control de avance en tiempo real. Permite registrar evidencias, observaciones y validaciones directamente desde la app.",
      icon: ClipboardList,
    },
    {
      id: "evidencias",
      title: "Evidencias fotográficas",
      description: "Carga de presupuestos y avances con geolocalización, imágenes automáticas y registro de cada entrega validada por el sistema.",
      icon: Camera,
    },
    {
      id: "cuadrilla",
      title: "Mi cuadrilla",
      description: "Gestión de integrantes, roles y documentos laborales. Facilita la organización interna y el control de permisos o seguros en obra.",
      icon: Users,
    },
    {
      id: "notificaciones",
      title: "Notificaciones",
      description: "Alertas automáticas de pagos, validaciones o incidencias relevantes enviadas por el sistema o por GROWS·Bot en tiempo real.",
      icon: Bell,
    },
    {
      id: "reputacion",
      title: "Sistema de reputación",
      description: "Escalado progresivo de niveles basado en horas validadas, desempeño técnico y evaluaciones positivas por parte del Cliente Técnico.",
      icon: Star,
    },
    {
      id: "comunicacion",
      title: "Comunicación directa",
      description: "Canal integrado entre el Socio Constructor y el Cliente Técnico para registrar comentarios, revisiones y aprobaciones dentro del flujo FSM.",
      icon: MessageSquare,
    },
  ];
  
  const [selectedFeature, setSelectedFeature] = useState(features[0]);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <section 
        className="pt-40 pb-24 relative overflow-hidden"
        style={{ 
          backgroundImage: 'url(/images/Sociohero.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 lg:px-24 text-center">
          <h2 className="text-6xl md:text-7xl font-light text-white mb-8 leading-tight drop-shadow-lg">
            Socio Constructor
          </h2>
          
          <p className="text-2xl text-white/90 mb-8 font-light drop-shadow-md">
            Ejecuta tareas, documenta avances y crece con reputación dentro de GROWS.
          </p>

          <div className="max-w-4xl mx-auto mb-12">
            <p className="text-lg text-white/80 leading-relaxed drop-shadow-md">
              El Socio Constructor es el rol operativo dentro del ecosistema GROWS. Ejecuta tareas en obra, 
              documenta avances y mantiene su reputación profesional dentro de la plataforma.
            </p>
          </div>

          <button 
            onClick={() => document.getElementById('introduccion')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center gap-3 bg-[#C6A34F] text-white px-8 py-4 rounded-full font-medium hover:bg-[#B59445] transition-all duration-300 hover:scale-105 backdrop-blur-sm border border-white/20 shadow-lg"
          >
            Explorar su rol
            <ArrowDown className="w-5 h-5" />
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent"></div>
      </section>

      <section id="introduccion" className="bg-neutral-50 py-20">
        <div className="max-w-4xl mx-auto px-6 space-y-6 text-center">
          <div className="space-y-8">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight">
              Socio Constructor
            </h2>
            
            <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
              El Socio Constructor es el rol operativo dentro del ecosistema GROWS. 
              Su función principal es ejecutar tareas en obra, documentar los avances y 
              garantizar la calidad constructiva de acuerdo con los estándares definidos 
              por el Cliente Técnico.
            </p>
            
            <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
              Este perfil representa a profesionales o líderes de cuadrilla que trabajan de forma 
              independiente o con equipos pequeños, asumiendo la responsabilidad directa sobre 
              las etapas asignadas. A través de la plataforma, el Socio Constructor mantiene 
              comunicación constante con los coordinadores técnicos y gestiona todo su flujo 
              operativo desde un mismo entorno digital.
            </p>

            <h3 className="text-3xl md:text-4xl font-bold text-gray-800 pt-8">Trabajo por Objetivos</h3>
            <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
              GROWS garantiza que el trabajo se realice por objetivos, permitiendo que cada Socio Constructor 
              gestione su actividad con total autonomía y control. La plataforma establece marcos claros de 
              cumplimiento mientras preserva la flexibilidad operativa.
            </p>

            <h3 className="text-3xl md:text-4xl font-bold text-gray-800 pt-8">Gestión Financiera Transparente</h3>
            <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
              Una de las ventajas clave es la garantía de cobro en tiempo y forma. Los presupuestos cerrados 
              se pagan sin contratiempos una vez validada la entrega, eliminando demoras administrativas. 
              Además, todas las tareas realizadas fuera del presupuesto original se registran y facturan 
              de manera automática, asegurando que cada trabajo realizado sea remunerado justamente.
            </p>

            <h3 className="text-3xl md:text-4xl font-bold text-gray-800 pt-8">Bolsa de Trabajo Inteligente</h3>
            <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
              GROWS funciona como una bolsa de trabajo digital donde los Socios Constructores pueden acceder a 
              tareas disponibles en todo el ecosistema. Cada profesional puede tomar aquellas que se ajusten a 
              su capacidad, planificando sus tiempos con total libertad. Las tareas incluyen precios justos 
              predefinidos por el mercado, eliminando la negociación manual y garantizando condiciones transparentes.
            </p>

            <h3 className="text-3xl md:text-4xl font-bold text-gray-800 pt-8">Flujo de trabajo</h3>
            <p className="text-xl md:text-2xl text-gray-700 leading-relaxed">
              Cada tarea se desarrolla dentro de un flujo de estados que asegura trazabilidad y control: 
              desde la propuesta de presupuesto hasta la validación final y el pago automatizado.
            </p>
          </div>

        </div>
      </section>

      <section className="min-h-screen bg-neutral-50 border-t border-gray-100 py-24">
     
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-[600px]">
            <aside className="bg-[#0F172A] rounded-xl p-4 flex flex-col space-y-2">
            <div className="space-y-3">
              {features.map((f) => {
                const Icon = f.icon;
                const isActive = f.id === selectedFeature.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFeature(f)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${
                      isActive
                        ? "bg-amber-400 text-[#0F172A] font-semibold shadow-lg"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    <Icon size={18} />
                    <span className="leading-tight">{f.title}</span>
                  </button>
                );
              })}
            </div>
            </aside>

            <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex flex-col">
              <div className="flex-1 space-y-8">
                <h3 className="text-4xl font-bold text-gray-900 mb-6">
                  {selectedFeature.title}
                </h3>
                
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  {selectedFeature.description}
                </p>

                <div className="mt-auto pt-8">
                  <button className="px-8 py-4 bg-amber-500 text-gray-900 font-semibold rounded-lg hover:bg-amber-600 transition-colors inline-flex items-center gap-3 text-lg">
                    Explorar funcionalidad completa
                    <ArrowDown className="w-5 h-5 rotate-[-90deg]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <GrowsReputationSystem />

      <Footer />
    </div>
  );
}


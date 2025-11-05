'use client';

import { Navigation } from '@/components/navigation/Navigation';
import { ArrowLeft, ArrowDown, Compass, Building, BarChart3, Workflow, Database, Zap, TrendingUp, CheckCircle, Shield, Globe, LogIn, UserPlus, FileText, Target, Layers, Sparkles, Bot, ClipboardList, CheckSquare, Users, Bell, Calendar, CheckCircle2, Clock, Award, MessageSquare, HardHat, User, Building2, Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function ArquitectoTecnicoPage() {
  const [activeSection, setActiveSection] = useState(0);

  return (
    <div className="min-h-screen bg-white" style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      {/* Navigation */}
      <Navigation />


      {/* Hero Inmersivo */}
      <section 
        className="pt-40 pb-24 relative overflow-hidden"
        style={{ 
          backgroundImage: 'url(/images/Heroarquitecto.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        {/* Overlay para mejorar legibilidad */}
        <div className="absolute inset-0 bg-black/50"></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 lg:px-24 text-center">
          <h2 className="text-6xl md:text-7xl font-light text-white mb-8 leading-tight drop-shadow-lg">
            El Arquitecto Técnico
          </h2>
          
          <p className="text-2xl text-white/90 mb-8 font-light drop-shadow-md">
            El punto donde el diseño se encuentra con la ejecución inteligente.
          </p>

          <div className="max-w-4xl mx-auto mb-12">
            <p className="text-lg text-white/80 leading-relaxed drop-shadow-md">
              El arquitecto técnico traduce ideas en sistemas de control, validación y precisión constructiva. 
              Dentro de GROWS, su mirada técnica impulsa decisiones basadas en datos.
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

        {/* Sombra inferior sutil */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent"></div>
      </section>

             {/* Sección 1 — Introducción */}
       <section id="introduccion" className="py-20 bg-gray-50">
         <div className="max-w-7xl mx-auto px-6">
           <div className="max-w-5xl mx-auto">
             <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">Cliente Técnico / Arquitecto Coordinador</h2>
             
             <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
               <p>
                 El <strong className="text-gray-900">Cliente Técnico</strong> es el usuario principal dentro del ecosistema GROWS.
                 Representa a estudios de arquitectura, arquitectos independientes o pequeñas constructoras que asumen la dirección técnica de obras y proyectos.
               </p>
               
               <p>
                 Su función central es coordinar los equipos de trabajo, asignar cuadrillas, controlar el progreso de las tareas y validar entregas dentro del flujo digital de GROWS.
                 Actúa como nexo entre los socios constructores y los clientes finales, asegurando que cada etapa avance con trazabilidad, eficiencia y calidad.
               </p>
               
               <div className="pt-4">
                 <h3 className="text-2xl font-semibold text-gray-900 mb-4">Desde su panel de control, el Cliente Técnico puede:</h3>
                 <ul className="space-y-3 ml-4">
                   <li className="flex items-start gap-3">
                     <CheckCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                     <span><strong>Supervisar múltiples obras</strong> de manera simultánea, con acceso a cronogramas, presupuestos y avances en tiempo real.</span>
                   </li>
                   <li className="flex items-start gap-3">
                     <CheckCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                     <span><strong>Emitir aprobaciones técnicas</strong> y registrar validaciones documentadas.</span>
                   </li>
                   <li className="flex items-start gap-3">
                     <CheckCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                     <span><strong>Gestionar la comunicación</strong> con cada socio constructor a través de un canal unificado.</span>
                   </li>
                   <li className="flex items-start gap-3">
                     <CheckCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
                     <span><strong>Centralizar informes</strong>, evidencias fotográficas y documentación oficial en un mismo entorno digital.</span>
                   </li>
                 </ul>
               </div>
               
               <p>
                 El rol combina visión técnica, capacidad de gestión y toma de decisiones estratégicas, con herramientas diseñadas para reducir errores de coordinación y mejorar la eficiencia operativa en proyectos de pequeña y mediana escala.
               </p>
               
               <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-lg mt-8">
                 <h3 className="text-xl font-semibold text-gray-900 mb-3">Dentro del ecosistema GROWS, el Cliente Técnico se beneficia de:</h3>
                 <div className="grid md:grid-cols-2 gap-4">
                   <div className="flex items-start gap-3">
                     <TrendingUp className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                     <span className="text-gray-700"><strong>Un sistema automatizado</strong> de seguimiento de obra.</span>
                   </div>
                   <div className="flex items-start gap-3">
                     <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                     <span className="text-gray-700"><strong>Validaciones digitales</strong> que reemplazan tareas manuales o dispersas.</span>
                   </div>
                   <div className="flex items-start gap-3">
                     <BarChart3 className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                     <span className="text-gray-700"><strong>Indicadores de desempeño</strong> que facilitan la supervisión y el control de calidad.</span>
                   </div>
                   <div className="flex items-start gap-3">
                     <Bot className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                     <span className="text-gray-700"><strong>Integración directa</strong> con GROWS·Bot para optimizar tareas administrativas y técnicas.</span>
                   </div>
                 </div>
               </div>
               
               <p className="text-xl text-gray-600 italic border-t border-gray-200 pt-6 mt-6">
                 En síntesis, este rol concentra la dirección técnica, la gestión integral y la trazabilidad digital de cada obra, 
                 asegurando que la información fluya de manera continua y verificable entre todos los actores involucrados.
               </p>
             </div>
           </div>
         </div>
       </section>

      {/* Sección 2 — Funcionalidades dentro de GROWS */}
      <section className="py-24 bg-neutral-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <h3 className="text-4xl font-bold text-gray-900 mb-16 text-center">Panel del Arquitecto Técnico</h3>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <aside className="bg-[#0F172A] rounded-xl p-4 flex flex-col space-y-2">
              {[
                { id: 0, title: 'Chat', subtitle: 'con GrowsBot', icon: MessageSquare },
                { id: 1, title: 'Obras', subtitle: '', icon: HardHat },
                { id: 2, title: 'Tareas', subtitle: '', icon: ClipboardList },
                { id: 3, title: 'Cuadrillas', subtitle: '', icon: Users },
                { id: 4, title: 'Notificaciones', subtitle: '', icon: Bell },
                { id: 5, title: 'Calendario', subtitle: '', icon: Calendar },
                { id: 6, title: 'Cuenta', subtitle: '', icon: User },
              ].map((s) => {
                const Icon = s.icon;
                const active = s.id === activeSection;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${
                      active
                        ? "bg-amber-400 text-[#0F172A] font-semibold shadow-lg"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    <Icon size={18} />
                    <div className="flex flex-col">
                      <span className="leading-tight">{s.title}</span>
                      {s.subtitle && <span className="text-xs leading-tight opacity-80">{s.subtitle}</span>}
                    </div>
                  </button>
                );
              })}
            </aside>

                         {/* Content Panel */}
             <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 p-12 animate-fadeIn">
               <div className="space-y-8">
                 {/* Título */}
                 <div>
                   <h3 className="text-4xl font-bold text-gray-900 mb-6">
                     {[
                       { title: 'Chat con GrowsBot' },
                       { title: 'Gestión de Obras' },
                       { title: 'Panel de Tareas' },
                       { title: 'Gestión de Cuadrillas' },
                       { title: 'Notificaciones y Alertas' },
                       { title: 'Calendario de Obra' },
                       { title: 'Perfil y Configuración' },
                     ][activeSection].title}
                   </h3>
                 </div>

                 {/* Descripción principal */}
                 <div className="prose prose-lg max-w-none">
                   <p className="text-xl text-gray-700 leading-relaxed mb-6">
                     {[
                       'El módulo de Chat permite al arquitecto comunicarse directamente con los socios constructores y supervisores. Puede revisar incidencias, validar entregas y automatizar respuestas mediante GrowsBot, integrando información en tiempo real con el flujo de obra.',
                       'Desde Obras, el arquitecto controla todo el portafolio activo: presupuestos, legajos técnicos, cronogramas y validaciones. Cada proyecto se conecta con las tareas, cuadrillas y reportes automáticos de avance.',
                       'El tablero de Tareas permite visualizar el progreso detallado de cada actividad, ajustar dependencias y aprobar entregas validadas. Todas las acciones quedan registradas dentro del flujo FSM de GROWS.',
                       'Esta vista permite al arquitecto controlar la disponibilidad y desempeño de las cuadrillas en obra. Se visualizan horas validadas, especialidades y evaluaciones técnicas por proyecto.',
                       'Centraliza todas las alertas generadas por el sistema o GrowsBot. Informa sobre tareas pendientes, pagos, incidentes o entregas listas para revisión técnica.',
                       'Sincroniza los hitos del proyecto, reuniones, entregas y validaciones. Permite planificar la ejecución semanal y mensual con métricas automáticas de avance.',
                       'En la sección de Cuenta, el arquitecto gestiona su perfil profesional, permisos de acceso y notificaciones. También puede configurar la sincronización con herramientas externas o habilitar autenticación avanzada.',
                     ][activeSection]}
                   </p>
                 </div>

                 {/* Características destacadas */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                   {[
                     {
                       features: [
                         'Comunicación bidireccional en tiempo real',
                         'Respuestas automatizadas con GrowsBot',
                         'Historial completo de conversaciones',
                         'Integración con tareas y obras activas'
                       ]
                     },
                     {
                       features: [
                         'Visualización de presupuestos y cronogramas',
                         'Control de validaciones técnicas',
                         'Reportes automáticos de avance',
                         'Gestión de documentos técnicos'
                       ]
                     },
                     {
                       features: [
                         'Visualización de dependencias entre tareas',
                         'Aprobación de entregas validadas',
                         'Registro completo en flujo FSM',
                         'Seguimiento detallado de progreso'
                       ]
                     },
                     {
                       features: [
                         'Control de disponibilidad en tiempo real',
                         'Visualización de especialidades',
                         'Evaluaciones técnicas por proyecto',
                         'Registro de horas validadas'
                       ]
                     },
                     {
                       features: [
                         'Alertas automáticas del sistema',
                         'Notificaciones de GrowsBot',
                         'Recordatorios de tareas pendientes',
                         'Alertas de pagos y validaciones'
                       ]
                     },
                     {
                       features: [
                         'Sincronización de hitos del proyecto',
                         'Planificación semanal y mensual',
                         'Métricas automáticas de avance',
                         'Coordinación de reuniones'
                       ]
                     },
                     {
                       features: [
                         'Gestión de perfil profesional',
                         'Configuración de permisos',
                         'Autenticación avanzada',
                         'Sincronización con herramientas externas'
                       ]
                     }
                   ][activeSection].features.map((feature, idx) => (
                     <div key={idx} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                       <div className="w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                         <CheckCircle className="w-4 h-4 text-gray-900" />
                       </div>
                       <p className="text-gray-700 font-medium">{feature}</p>
                     </div>
                   ))}
                 </div>

                 {/* CTA */}
                 <div className="pt-6 border-t border-gray-200">
                   <button className="px-8 py-4 bg-amber-500 text-gray-900 font-semibold rounded-lg hover:bg-amber-600 transition-colors inline-flex items-center gap-3 text-lg">
                     Explorar módulo completo
                     <ArrowDown className="w-5 h-5 rotate-[-90deg]" />
                   </button>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </section>
      
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>

      {/* Sección 3 — Beneficios Clave */}
      <section className="py-16 bg-gray-50 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-10 text-center">
          {[
            { icon: 'CheckCircle2', title: 'Control integral', desc: 'Registro auditable de decisiones, costos y evidencias técnicas.' },
            { icon: 'Clock', title: 'Eficiencia operativa', desc: 'Reducción de tiempos de validación y conflictos entre equipos.' },
            { icon: 'Award', title: 'Escalabilidad profesional', desc: 'Crecimiento sostenido de la empresa con procesos digitalizados.' },
          ].map((item, i) => (
            <div key={i} className="p-8 bg-white rounded-xl shadow-sm border-l-4 border-yellow-400 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              {item.icon === 'CheckCircle2' && <CheckCircle2 className="w-8 h-8 text-yellow-500 mx-auto mb-4" />}
              {item.icon === 'Clock' && <Clock className="w-8 h-8 text-yellow-500 mx-auto mb-4" />}
              {item.icon === 'Award' && <Award className="w-8 h-8 text-yellow-500 mx-auto mb-4" />}
              <h4 className="text-xl font-semibold mb-2 text-gray-900">{item.title}</h4>
              <p className="text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Minimalista */}
      <footer id="contacto" className="bg-black text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Building2 className="h-8 w-8 text-yellow-400" />
                <h3 className="text-2xl font-bold text-yellow-400">GROWS</h3>
              </div>
              <p className="text-white/70 mb-6 max-w-md">
                Plataforma integral de gestión para la construcción que conecta constructores, 
                supervisores y clientes para optimizar procesos y mejorar la calidad.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-white/70">
                  <Mail className="h-4 w-4" />
                  <span>contacto@grows.app</span>
                </div>
                <div className="flex items-center gap-3 text-white/70">
                  <Phone className="h-4 w-4" />
                  <span>(+54) 341 318-9944</span>
                </div>
                <div className="flex items-center gap-3 text-white/70">
                  <MapPin className="h-4 w-4" />
                  <span>Rosario, Santa Fe, Argentina</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Enlaces Rápidos</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/es#home" className="text-white/70 hover:text-yellow-400 transition-colors">
                    Inicio
                  </Link>
                </li>
                <li>
                  <Link href="/es#obras" className="text-white/70 hover:text-yellow-400 transition-colors">
                    Soluciones
                  </Link>
                </li>
                <li>
                  <Link href="/es#users" className="text-white/70 hover:text-yellow-400 transition-colors">
                    Roles
                  </Link>
                </li>
                <li>
                  <Link href="/es#ecosystem" className="text-white/70 hover:text-yellow-400 transition-colors">
                    Ecosistema
                  </Link>
                </li>
              </ul>
            </div>

            {/* Features */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Características</h4>
              <ul className="space-y-2">
                <li className="text-white/70">Calendario Inteligente</li>
                <li className="text-white/70">Billetera Digital</li>
                <li className="text-white/70">Bolsa de Trabajo</li>
                <li className="text-white/70">Reportes de Avance</li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-white/60 text-sm">
              © 2024 GROWS. Todos los derechos reservados.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="#" className="text-white/60 hover:text-yellow-400 transition-colors text-sm">
                Política de Privacidad
              </Link>
              <Link href="#" className="text-white/60 hover:text-yellow-400 transition-colors text-sm">
                Términos de Servicio
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
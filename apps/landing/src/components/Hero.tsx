'use client';

import { ArrowRight, Sparkles, Zap, Shield, Clock } from 'lucide-react';

const APP_URL = 'http://localhost:3001';

export function Hero() {
  return (
    <section id="home" className="pt-24 bg-gradient-to-br from-grows-background via-white to-grows-neutral/30">
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
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out;
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Contenido de texto */}
          <div className="text-left space-y-8">
            {/* Badge IA mejorado */}
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-grows-secondary/20 to-grows-secondary/10 border-2 border-grows-secondary/30 rounded-full shadow-lg">
              <div className="w-8 h-8 bg-grows-secondary rounded-full flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-grows-primary" />
              </div>
              <span className="text-base font-bold text-grows-primary">
                ✨ Nuevo: GrowsBot IA · Tu asistente para planificar y controlar obras sin errores
              </span>
            </div>

            {/* Main Title mejorado */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-black text-grows-text-primary leading-[0.9] tracking-tight">
                <span className="text-grows-primary drop-shadow-lg">GROWS</span>
                <br />
                <span className="text-3xl md:text-5xl font-bold">
                  Gestioná tus obras con precisión,
                </span>
                <br />
                <span className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-grows-primary to-grows-primary/70 bg-clip-text text-transparent">
                  con la inteligencia que tu proyecto merece
                </span>
              </h1>
            </div>

            {/* Descripción mejorada */}
            <div className="space-y-4">
              <p className="text-base md:text-lg text-grows-text-secondary font-medium leading-relaxed">
                Tu obra, bajo control. Sin caos, sin planillas, sin estrés.
              </p>
            </div>

            {/* Características clave */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4">
              <div className="flex items-center gap-3 p-4 bg-white/60 rounded-lg border border-grows-border/50">
                <div className="w-10 h-10 bg-grows-primary/10 rounded-full flex items-center justify-center">
                  <Zap className="h-5 w-5 text-grows-primary" />
                </div>
                <span className="text-sm font-semibold text-grows-text-primary">Cronogramas inteligentes por IA</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white/60 rounded-lg border border-grows-border/50">
                <div className="w-10 h-10 bg-grows-primary/10 rounded-full flex items-center justify-center">
                  <Shield className="h-5 w-5 text-grows-primary" />
                </div>
                <span className="text-sm font-semibold text-grows-text-primary">Control total de tareas y costos</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white/60 rounded-lg border border-grows-border/50">
                <div className="w-10 h-10 bg-grows-primary/10 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-grows-primary" />
                </div>
                <span className="text-sm font-semibold text-grows-text-primary">Reportes automáticos y alertas en tiempo real</span>
              </div>
            </div>

            {/* Botón principal */}
            <div className="flex justify-center sm:justify-start pt-4">
              <a
                href={`${APP_URL}/auth/login`}
                className="group bg-grows-secondary text-grows-primary px-10 py-4 rounded-xl text-lg font-bold hover:bg-grows-secondary/90 hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:scale-105 border-2 border-grows-secondary/20"
              >
                Probar GROWS gratis
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

          {/* Elemento visual mejorado */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative animate-fade-in-up">
              {/* Círculo de fondo con gradiente */}
              <div className="w-96 h-96 bg-gradient-to-br from-grows-primary/10 to-grows-secondary/10 rounded-full absolute -top-8 -right-8 blur-3xl animate-pulse"></div>
              
              {/* Card simple con información real */}
              <div className="relative w-full max-w-lg h-[400px] rounded-3xl bg-white shadow-2xl border border-grows-border/20 overflow-hidden hover:shadow-3xl transition-all duration-500">
                {/* Header */}
                <div className="bg-gradient-to-r from-grows-primary to-grows-primary/80 p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-grows-secondary rounded-lg flex items-center justify-center">
                      <span className="text-grows-primary font-bold text-xl">G</span>
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-xl">GROWS</h3>
                      <p className="text-white/80 text-sm">Control profesional de obras</p>
                    </div>
                  </div>
                </div>

                {/* Contenido informativo */}
                <div className="p-6 space-y-6">
                  {/* Beneficios únicos */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-grows-primary/10 rounded-full flex items-center justify-center">
                        <Zap className="h-5 w-5 text-grows-primary" />
                      </div>
                      <span className="text-grows-text-primary font-semibold text-sm">Cronogramas automáticos</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-grows-primary/10 rounded-full flex items-center justify-center">
                        <Shield className="h-5 w-5 text-grows-primary" />
                      </div>
                      <span className="text-grows-text-primary font-semibold text-sm">Control en tiempo real</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-grows-primary/10 rounded-full flex items-center justify-center">
                        <Clock className="h-5 w-5 text-grows-primary" />
                      </div>
                      <span className="text-grows-text-primary font-semibold text-sm">Asistente inteligente</span>
                    </div>
                  </div>

                  {/* GrowsBot destacado */}
                  <div className="bg-gradient-to-r from-grows-secondary/15 to-grows-secondary/8 rounded-xl p-4 border-2 border-grows-secondary/30 shadow-lg hover:shadow-xl hover:border-grows-secondary/50 transition-all duration-300 group">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-grows-secondary rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                        <Sparkles className="h-4 w-4 text-grows-primary group-hover:animate-pulse" />
                      </div>
                      <div>
                        <span className="font-bold text-grows-text-primary text-base">GrowsBot</span>
                        <p className="text-xs text-grows-text-secondary/80">Tu asistente de IA</p>
                      </div>
                    </div>
                    <p className="text-xs text-grows-text-secondary font-medium leading-relaxed">
                      Optimiza cronogramas, gestiona tareas y brinda soporte inteligente las 24 horas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
'use client';

import {ArrowRight, Play} from 'lucide-react';

export function Hero() {
  return (
    <section id="home" className="pt-16 bg-gradient-to-br from-secundario to-claro">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Contenido de texto */}
          <div className="text-left">
            {/* Main Title */}
            <h1 className="text-4xl md:text-6xl font-bold text-oscuro mb-6 leading-tight">
              <span className="text-primario">GROWS</span>
              <br />
              <span className="text-3xl md:text-5xl text-oscuro">
                Plataforma de Gestión Inteligente
              </span>
              <br />
              <span className="text-2xl md:text-4xl text-oscuro/80">
                para la Construcción
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-oscuro/70 mb-8 leading-relaxed">
              Revoluciona la forma de gestionar obras de construcción con tecnología de última generación
            </p>

            {/* Description */}
            <p className="text-lg text-oscuro/60 mb-12 leading-relaxed">
              Conecta constructores, supervisores y clientes en una plataforma única que optimiza tiempos, 
              reduce costos y mejora la calidad de tus proyectos.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-acento text-oscuro px-8 py-4 rounded-lg text-lg font-semibold hover:bg-acento/90 transition-colors duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl">
                Comenzar ahora
                <ArrowRight className="h-5 w-5" />
              </button>
              
              <button className="border-2 border-primario text-primario px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primario hover:text-white transition-colors duration-200 flex items-center gap-2">
                <Play className="h-5 w-5" />
                Ver demo
              </button>
            </div>
          </div>

                  {/* Imagen de construcción moderna */}
                  <div className="flex justify-center lg:justify-end">
                    <div className="w-full max-w-2xl h-[500px] rounded-2xl overflow-hidden shadow-xl">
                      <img 
                        src="/images/arquitecto.png" 
                        alt="Arquitecto supervisando obra de construcción"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-primario mb-2">100%</div>
            <div className="text-oscuro/70">Digital</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primario mb-2">24/7</div>
            <div className="text-oscuro/70">Seguimiento</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primario mb-2">0%</div>
            <div className="text-oscuro/70">Comisiones</div>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import {ArrowRight} from 'lucide-react';

export function FinalCTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-primario to-primario/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
          ¿Listo para revolucionar tu construcción?
        </h2>
        <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
          Únete a miles de profesionales que ya están transformando la industria 
          de la construcción con GROWS.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-acento text-oscuro px-8 py-4 rounded-lg text-lg font-semibold hover:bg-acento/90 transition-colors duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl">
            Comenzar gratis
            <ArrowRight className="h-5 w-5" />
          </button>
          <button className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-primario transition-colors duration-200">
            Contactar ventas
          </button>
        </div>
      </div>
    </section>
  );
}

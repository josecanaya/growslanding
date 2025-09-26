'use client';

import {ArrowRight} from 'lucide-react';

export function ConstructorSection() {
  return (
    <section id="comenzar" className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-oscuro mb-6">
          Convertite en Constructor
        </h2>
        <p className="text-xl text-oscuro/70 mb-12 max-w-3xl mx-auto leading-relaxed">
          Únete a la revolución digital de la construcción. Accede a obras de calidad, 
          gestiona tu cuadrilla eficientemente y maximiza tus ganancias con nuestra plataforma.
        </p>
        <button className="bg-acento text-oscuro px-8 py-4 rounded-lg text-lg font-semibold hover:bg-acento/90 transition-colors duration-200 flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl">
          Registrarse como Constructor
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}

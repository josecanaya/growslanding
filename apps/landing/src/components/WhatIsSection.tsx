'use client';

export function WhatIsSection() {
  const cards = [
    {
      title: 'Socio Constructor',
      description: 'Profesionales de la construcción que lideran cuadrillas y ejecutan obras de calidad.',
      icon: '👷‍♂️',
      features: ['Gestión de cuadrilla', 'Seguimiento de obras', 'Control de calidad', 'Reportes de avance']
    },
    {
      title: 'Supervisor',
      description: 'Especialistas que supervisan y controlan la calidad de las obras en ejecución.',
      icon: '👨‍💼',
      features: ['Inspección de obras', 'Control de calidad', 'Reportes técnicos', 'Comunicación con clientes']
    },
    {
      title: 'Cliente',
      description: 'Propietarios que buscan construir o remodelar con transparencia y calidad garantizada.',
      icon: '🏠',
      features: ['Seguimiento en tiempo real', 'Transparencia total', 'Calidad garantizada', 'Comunicación directa']
    }
  ];

  return (
    <section id="que-es" className="py-20 bg-claro">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-oscuro mb-6">
            ¿Qué es GROWS?
          </h2>
          <p className="text-xl text-oscuro/70 max-w-3xl mx-auto">
            Una plataforma integral que conecta todos los actores de la construcción 
            para optimizar procesos, mejorar la calidad y reducir tiempos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map((card, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">{card.icon}</div>
                <h3 className="text-2xl font-bold text-oscuro mb-4">{card.title}</h3>
                <p className="text-oscuro/70 leading-relaxed">{card.description}</p>
              </div>
              <ul className="space-y-2">
                {card.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-oscuro/60">
                    <span className="w-2 h-2 bg-acento rounded-full mr-3"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

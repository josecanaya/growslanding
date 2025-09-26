'use client';

export function FeaturesSection() {
  const features = [
    {
      title: 'Calendario Inteligente',
      description: 'Planifica y organiza tus obras con un calendario que se adapta a tus necesidades.',
      icon: '📅',
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Billetera Digital',
      description: 'Gestiona pagos, presupuestos y finanzas de manera transparente y segura.',
      icon: '💰',
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Bolsa de Trabajo',
      description: 'Conecta con los mejores profesionales y encuentra oportunidades laborales.',
      icon: '👥',
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Reportes de Avance',
      description: 'Genera reportes detallados del progreso de tus obras en tiempo real.',
      icon: '📊',
      color: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <section id="caracteristicas" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-oscuro mb-6">
            Características Principales
          </h2>
          <p className="text-xl text-oscuro/70 max-w-3xl mx-auto">
            Herramientas poderosas diseñadas específicamente para optimizar 
            la gestión de obras de construcción.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center group">
              <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-oscuro mb-4">{feature.title}</h3>
              <p className="text-oscuro/70 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

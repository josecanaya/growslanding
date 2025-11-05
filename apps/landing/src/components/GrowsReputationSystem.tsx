'use client';

import Image from 'next/image';
import { useState } from 'react';

const reputationLevels = [
  {
    image: '/assets/grows/g.png',
    title: 'Hierro',
    hours: '0 h',
    description: 'Primeros pasos en el ecosistema',
    gradient: 'from-gray-600 to-gray-700',
    fullDescription: 'Inicio del recorrido profesional. Aprendizaje de herramientas básicas y primeros proyectos.'
  },
  {
    image: '/assets/grows/r.png',
    title: 'Bronce',
    hours: '180 h',
    description: 'Desarrollo de habilidades técnicas',
    gradient: 'from-amber-600 to-amber-700',
    fullDescription: 'Consolidación de conocimientos técnicos. Ejecución independiente de tareas especializadas.'
  },
  {
    image: '/assets/grows/o.png',
    title: 'Plata',
    hours: '300 h',
    description: 'Dominio de procesos constructivos',
    gradient: 'from-gray-400 to-gray-500',
    fullDescription: 'Maestría en procesos constructivos. Capacidad de liderar equipos pequeños y proyectos complejos.'
  },
  {
    image: '/assets/grows/w.png',
    title: 'Palatino',
    hours: '700 h',
    description: 'Liderazgo profesional',
    gradient: 'from-slate-300 to-slate-400',
    fullDescription: 'Liderazgo técnico avanzado. Gestión de múltiples proyectos y formación de nuevos profesionales.'
  },
  {
    image: '/assets/grows/s.png',
    title: 'Oro',
    hours: '1200 h',
    description: 'Cumbre del desarrollo profesional',
    gradient: 'from-yellow-500 to-yellow-600',
    fullDescription: 'Excelencia máxima en el ecosistema. Referencia técnica y acceso a oportunidades exclusivas.'
  }
];

export default function GrowsReputationSystem() {
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);

  return (
    <section className="bg-neutral-50 py-20 border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-6 space-y-16">
        
        {/* Introducción */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-gray-900">Sistema de Puntuación y Reputación</h2>
          <p className="text-gray-700 max-w-3xl mx-auto leading-relaxed">
            El sistema de reputación de GROWS organiza el progreso profesional de los Socios Constructores 
            en función de su experiencia verificada, desempeño cualitativo y conducta dentro de las obras. 
            Cada tarea validada contribuye a un puntaje acumulativo que determina el nivel alcanzado y las 
            habilitaciones disponibles dentro del ecosistema.
          </p>
        </div>

        {/* Visual Levels Section */}
        <div className="py-12">
          <div className="relative">
            {/* Connecting Line */}
            <div className="absolute top-32 left-0 right-0 h-px bg-gray-300 z-0 hidden md:block"></div>
            
            {/* Levels Container */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-12 md:gap-8 relative z-10">
              {reputationLevels.map((level, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center group cursor-pointer transition-all duration-300 ease-out"
                  onMouseEnter={() => setHoveredLevel(index)}
                  onMouseLeave={() => setHoveredLevel(null)}
                  style={{
                    transform: hoveredLevel === index ? 'translateY(-8px)' : 'translateY(0)',
                    transition: 'transform 0.3s ease-out'
                  }}
                >
                  {/* Image Container */}
                  <div className="relative w-32 h-32 md:w-40 md:h-40 mb-6 transition-all duration-300">
                    <Image
                      src={level.image}
                      alt={`Nivel ${level.title}`}
                      fill
                      className="object-contain transition-transform duration-300 group-hover:scale-110"
                      priority={index < 2}
                    />
                  </div>

                  {/* Level Info */}
                  <div className="text-center max-w-48">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {level.title}
                    </h3>
                    
                    {/* Hours Badge */}
                    <div className="inline-block px-4 py-2 bg-gray-100 rounded-full mb-3 transition-all duration-300 group-hover:bg-gray-200">
                      <span className="text-sm font-semibold text-gray-700">
                        {level.hours}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2 font-medium">
                      {level.description}
                    </p>
                    
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {level.fullDescription}
                    </p>
                  </div>

                  {/* Hover Line Effect */}
                  {hoveredLevel === index && (
                    <div className={`absolute top-32 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r ${level.gradient} transition-all duration-300 rounded-full`}></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Acumulación de puntos */}
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold text-gray-900">Acumulación de Puntos</h3>
          <p className="text-gray-700 leading-relaxed">
            Cada tarea completada y verificada por un supervisor suma horas al perfil del socio. 
            Estas horas se clasifican según el tipo de actividad (estructura, obra gris o terminación) 
            y reflejan la experiencia práctica acumulada dentro del sistema. 
            Los niveles alcanzados representan la confianza y la responsabilidad que GROWS deposita 
            en cada profesional.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border border-gray-200 rounded-lg text-sm">
              <thead className="bg-gray-100 text-gray-800">
                <tr>
                  <th className="px-4 py-2">Nivel</th>
                  <th className="px-4 py-2">Horas mínimas acumuladas</th>
                  <th className="px-4 py-2">Etapas habilitadas</th>
                </tr>
              </thead>
              <tbody className="text-gray-700 divide-y divide-gray-200">
                <tr className="hover:bg-gray-50"><td className="px-4 py-2 font-medium">Hierro</td><td className="px-4 py-2">0 h</td><td className="px-4 py-2">Estructura</td></tr>
                <tr className="hover:bg-gray-50"><td className="px-4 py-2 font-medium">Bronce</td><td className="px-4 py-2">180 h</td><td className="px-4 py-2">Estructura / Obra gris</td></tr>
                <tr className="hover:bg-gray-50"><td className="px-4 py-2 font-medium">Plata</td><td className="px-4 py-2">300 h</td><td className="px-4 py-2">Estructura / Obra gris</td></tr>
                <tr className="hover:bg-gray-50"><td className="px-4 py-2 font-medium">Palatino</td><td className="px-4 py-2">700 h</td><td className="px-4 py-2">Todas las etapas</td></tr>
                <tr className="hover:bg-gray-50"><td className="px-4 py-2 font-medium">Oro</td><td className="px-4 py-2">1200 h</td><td className="px-4 py-2">Todas las etapas</td></tr>
              </tbody>
            </table>
          </div>

          <p className="text-sm text-gray-600 italic">
            Cada fase (estructura, obra gris y terminación) se lleva por separado, 
            por lo tanto un socio puede tener distintos niveles en cada etapa.
          </p>
        </div>

        {/* Niveles y habilitaciones */}
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold text-gray-900">Niveles y Habilitaciones</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>Hierro:</strong> tareas iniciales, bajo supervisión directa.</li>
            <li><strong>Bronce:</strong> acceso a tareas de obra gris, confianza creciente.</li>
            <li><strong>Plata:</strong> posibilidad de postularse como referente si posee reputación sólida.</li>
            <li><strong>Palatino:</strong> acceso completo a cualquier tipo de obra, incluyendo terminaciones.</li>
            <li><strong>Oro:</strong> prioridad en asignaciones, liderazgo de cuadrillas y acceso a proyectos premium.</li>
          </ul>
        </div>

        {/* Evaluación cualitativa */}
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold text-gray-900">Evaluación Cualitativa</h3>
          <p className="text-gray-700 leading-relaxed">
            Además de las horas verificadas, cada tarea se evalúa cualitativamente mediante un sistema 
            de puntuación en estrellas (1 a 5). Esta evaluación refleja el desempeño técnico, la actitud 
            y la responsabilidad del socio durante la ejecución del trabajo.
          </p>
          <h4 className="text-lg font-semibold text-gray-800">Criterios de evaluación:</h4>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>Puntualidad y cumplimiento de plazos.</li>
            <li>Comunicación y respuesta ante observaciones.</li>
            <li>Orden y cuidado del entorno de trabajo.</li>
            <li>Calidad técnica y finalización correcta de la tarea.</li>
          </ul>
          <p className="text-gray-700 leading-relaxed">
            La calificación obtenida incide directamente en la reputación pública y determina:
            la prioridad en futuras asignaciones, el acceso a obras complejas y la posibilidad 
            de asumir responsabilidades mayores dentro del ecosistema.
          </p>
        </div>

        {/* Beneficios del sistema */}
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold text-gray-900">Beneficios del Sistema</h3>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>Transparencia:</strong> el historial de puntos y reputación es visible para supervisores y clientes técnicos.</li>
            <li><strong>Motivación:</strong> incentiva la mejora continua y el progreso profesional dentro del ecosistema.</li>
            <li><strong>Segmentación:</strong> permite asignar tareas específicas según la experiencia comprobada.</li>
            <li><strong>Calidad:</strong> impulsa la profesionalización gradual del oficio y garantiza estándares constructivos más altos.</li>
          </ul>
        </div>

        {/* Evaluación de conducta */}
        <div className="space-y-4">
          <h3 className="text-2xl font-semibold text-gray-900">Evaluación de Conducta</h3>
          <p className="text-gray-700 leading-relaxed">
            Cada tarea completada se somete a una evaluación de conducta basada en un sistema 
            de estrellas (1 a 5), que pondera cumplimiento, actitud y responsabilidad. 
            Las evaluaciones deficientes pueden limitar temporalmente el acceso a nuevas obras 
            o afectar el nivel de reputación alcanzado.
          </p>
        </div>

      </div>
    </section>
  );
}

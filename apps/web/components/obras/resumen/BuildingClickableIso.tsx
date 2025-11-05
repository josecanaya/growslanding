'use client';

import { useState } from 'react';

interface BuildingClickableIsoProps {
  pisos?: number; // cantidad de pisos a renderizar
  onClickPiso?: (index: number) => void; // acción al hacer click en un piso
  className?: string;
}

export default function BuildingClickableIso({ 
  pisos = 5, 
  onClickPiso,
  className = '' 
}: BuildingClickableIsoProps) {
  const [hoveredPiso, setHoveredPiso] = useState<number | null>(null);

  // Espaciado entre pisos (aumentado)
  const ESCALON_VERTICAL = 50;
  const ANCHO_PISO = 180; // Aumentado de 120 a 180
  const ALTO_PISO = 120; // Aumentado de 80 a 120
  const PROFUNDIDAD = 25; // Grosor/extrusión del piso (aumentado significativamente)
  const ANGULO_X = 55; // Grados para perspectiva isométrica
  const ANGULO_Z = 45; // Grados para rotación isométrica

  return (
    <div className={`relative flex justify-center items-end bg-gray-50 rounded-lg overflow-hidden ${className}`}>
      {/* Contenedor con altura dinámica (aumentada para más espacio) */}
      <div 
        className="relative w-full flex justify-center items-end"
        style={{
          height: `${Math.max(500, 200 + pisos * ESCALON_VERTICAL)}px`,
          perspective: '1200px',
          perspectiveOrigin: 'center bottom'
        }}
      >
        {/* Pisos apilados */}
        {[...Array(pisos)].map((_, i) => {
          const index = pisos - 1 - i; // Invertir para que el último piso quede arriba
          const isHovered = hoveredPiso === index;
          const translateY = -index * ESCALON_VERTICAL + (isHovered ? 5 : 0);

          return (
            <div
              key={index}
              onClick={() => onClickPiso?.(index)}
              onMouseEnter={() => setHoveredPiso(index)}
              onMouseLeave={() => setHoveredPiso(null)}
              className="absolute cursor-pointer transition-all duration-300"
              style={{
                transform: `rotateX(${ANGULO_X}deg) rotateZ(${ANGULO_Z}deg) translateY(${translateY}px)`,
                transformStyle: 'preserve-3d',
                zIndex: index + 1,
                willChange: 'transform'
              }}
            >
              {/* Losa isométrica principal (cara superior) */}
              <div
                className="relative rounded-sm transition-all duration-300"
                style={{
                  width: `${ANCHO_PISO}px`,
                  height: `${ALTO_PISO}px`,
                  background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
                  border: '2px solid #9ca3af',
                  borderTop: '3px solid #e2e8f0',
                  borderLeft: '3px solid #e2e8f0',
                  borderRight: '1px solid #64748b',
                  borderBottom: '1px solid #64748b',
                  boxShadow: isHovered
                    ? '0 12px 24px rgba(0,0,0,0.3), 0 6px 12px rgba(0,0,0,0.2)'
                    : '0 8px 16px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.15)',
                  filter: isHovered ? 'brightness(1.15)' : 'brightness(1)',
                  transition: 'all 0.3s ease',
                  transformStyle: 'preserve-3d'
                }}
              >
                {/* Brillo superior (simula iluminación) */}
                <div 
                  className="absolute top-0 left-0 right-0 h-[4px] rounded-t-sm"
                  style={{ 
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 50%, transparent 100%)'
                  }}
                />

                {/* Cara frontal (profundidad aumentada) */}
                <div
                  className="absolute"
                  style={{
                    width: `${ANCHO_PISO}px`,
                    height: `${PROFUNDIDAD}px`,
                    bottom: `-${PROFUNDIDAD}px`,
                    left: '0',
                    background: 'linear-gradient(180deg, #cbd5e1 0%, #94a3b8 50%, #64748b 100%)',
                    transform: `rotateX(90deg) translateZ(${PROFUNDIDAD}px)`,
                    transformOrigin: 'top center',
                    transformStyle: 'preserve-3d',
                    borderLeft: '2px solid #94a3b8',
                    borderRight: '2px solid #64748b',
                    borderBottom: '2px solid #475569'
                  }}
                />

                {/* Cara lateral derecha (profundidad aumentada) */}
                <div
                  className="absolute"
                  style={{
                    width: `${PROFUNDIDAD}px`,
                    height: `${ALTO_PISO}px`,
                    top: '0',
                    right: `-${PROFUNDIDAD}px`,
                    background: 'linear-gradient(90deg, #cbd5e1 0%, #94a3b8 50%, #64748b 100%)',
                    transform: `rotateY(90deg) translateZ(${PROFUNDIDAD}px)`,
                    transformOrigin: 'left center',
                    transformStyle: 'preserve-3d',
                    borderTop: '2px solid #94a3b8',
                    borderBottom: '2px solid #64748b',
                    borderRight: '2px solid #475569'
                  }}
                />

                {/* Esquina inferior derecha (cara pequeña para cerrar el volumen) */}
                <div
                  className="absolute"
                  style={{
                    width: `${PROFUNDIDAD}px`,
                    height: `${PROFUNDIDAD}px`,
                    bottom: `-${PROFUNDIDAD}px`,
                    right: `-${PROFUNDIDAD}px`,
                    background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                    transform: `rotateX(90deg) rotateY(90deg)`,
                    transformStyle: 'preserve-3d',
                    border: '1px solid #334155'
                  }}
                />
              </div>

              {/* Sombra proyectada en el suelo (más grande y pronunciada) */}
              <div
                className="absolute rounded-sm opacity-30 pointer-events-none"
                style={{
                  width: `${ANCHO_PISO * 0.9}px`,
                  height: `${ALTO_PISO * 0.9}px`,
                  bottom: `-${30 + index * 5}px`,
                  left: '50%',
                  transform: `translateX(-${index * 8}px) translateZ(-50px) rotateX(90deg) scaleY(0.4)`,
                  background: 'radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 40%, transparent 80%)',
                  filter: 'blur(6px)'
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Indicador de hover (opcional, solo muestra número del piso) */}
      {hoveredPiso !== null && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg shadow-lg text-xs font-medium z-50 animate-in fade-in duration-200">
          Piso {hoveredPiso + 1}
        </div>
      )}
    </div>
  );
}


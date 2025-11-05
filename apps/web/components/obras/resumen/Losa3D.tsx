'use client';

import { useState } from 'react';

interface Losa3DProps {
  pisos?: number;
  onClickPiso?: (index: number) => void;
  className?: string;
}

export default function Losa3D({ 
  pisos = 5, 
  onClickPiso,
  className = '' 
}: Losa3DProps) {
  const [hoveredPiso, setHoveredPiso] = useState<number | null>(null);

  // Dimensiones y espaciado (ajustados para que quepan en pantalla)
  const ANCHO_LOSA = 140;
  const ALTO_LOSA = 90;
  const ESPESOR = 12; // Grosor/extrusión de la losa
  const ESCALON_VERTICAL = 35; // Reducido para que quepan mejor
  const ANGULO_X = 55; // Grados para perspectiva isométrica
  const ANGULO_Z = 45; // Grados para rotación isométrica

  return (
    <div className={`relative flex justify-center items-center bg-gray-50 rounded-lg overflow-visible ${className}`}>
      <div 
        className="relative w-full flex justify-center items-center py-12"
        style={{
          minHeight: `${Math.max(350, 100 + pisos * ESCALON_VERTICAL)}px`,
          perspective: '1000px',
          perspectiveOrigin: 'center center'
        }}
      >
        {[...Array(pisos)].map((_, i) => {
          const index = pisos - 1 - i; // Invertir para que el último piso quede arriba
          const isHovered = hoveredPiso === index;
          // Centrar verticalmente y luego desplazar
          const baseOffset = -((pisos - 1) * ESCALON_VERTICAL) / 2;
          const translateY = baseOffset + (index * ESCALON_VERTICAL) + (isHovered ? -10 : 0);

          return (
            <div
              key={index}
              onClick={() => onClickPiso?.(index)}
              onMouseEnter={() => setHoveredPiso(index)}
              onMouseLeave={() => setHoveredPiso(null)}
              className="relative cursor-pointer transition-all duration-300"
              style={{
                transform: `translateY(${translateY}px) rotateX(${ANGULO_X}deg) rotateZ(${ANGULO_Z}deg)`,
                transformStyle: 'preserve-3d',
                zIndex: pisos - index + (isHovered ? 100 : 0),
                willChange: 'transform'
              }}
            >
              {/* Cara superior de la losa */}
              <div
                className="absolute"
                style={{
                  width: `${ANCHO_LOSA}px`,
                  height: `${ALTO_LOSA}px`,
                  background: 'linear-gradient(145deg, #ffffff 0%, #e5e7eb 100%)',
                  boxShadow: isHovered
                    ? '0 15px 30px rgba(0, 0, 0, 0.25), 0 8px 16px rgba(0, 0, 0, 0.15)'
                    : '0 10px 25px rgba(0, 0, 0, 0.15), 0 5px 10px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #d1d5db',
                  borderTop: '2px solid #f3f4f6',
                  borderLeft: '2px solid #f3f4f6',
                  transformStyle: 'preserve-3d',
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Brillo superior */}
                <div 
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{ 
                    background: 'linear-gradient(90deg, rgba(255,255,255,0.8) 0%, transparent 100%)'
                  }}
                />
              </div>

              {/* Cara frontal (espesor) */}
              <div
                className="absolute"
                style={{
                  bottom: `-${ESPESOR}px`,
                  left: '0',
                  width: `${ANCHO_LOSA}px`,
                  height: `${ESPESOR}px`,
                  background: 'linear-gradient(to bottom, #cbd5e1 0%, #94a3b8 100%)',
                  transform: `skewX(-45deg) rotateX(90deg)`,
                  transformOrigin: 'top center',
                  transformStyle: 'preserve-3d',
                  borderLeft: '1px solid #94a3b8',
                  borderRight: '1px solid #64748b',
                  borderBottom: '1px solid #475569'
                }}
              />

              {/* Cara lateral derecha (profundidad) */}
              <div
                className="absolute"
                style={{
                  right: `-${ESPESOR}px`,
                  top: '0',
                  width: `${ESPESOR}px`,
                  height: `${ALTO_LOSA}px`,
                  background: 'linear-gradient(to right, #cbd5e1 0%, #94a3b8 100%)',
                  transform: `skewY(-45deg) rotateY(90deg)`,
                  transformOrigin: 'left center',
                  transformStyle: 'preserve-3d',
                  borderTop: '1px solid #94a3b8',
                  borderBottom: '1px solid #64748b',
                  borderRight: '1px solid #475569'
                }}
              />

              {/* Esquina inferior derecha (cierra el volumen) */}
              <div
                className="absolute"
                style={{
                  right: `-${ESPESOR}px`,
                  bottom: `-${ESPESOR}px`,
                  width: `${ESPESOR}px`,
                  height: `${ESPESOR}px`,
                  background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                  transform: `rotateX(90deg) rotateY(90deg)`,
                  transformStyle: 'preserve-3d',
                  border: '1px solid #334155'
                }}
              />

              {/* Sombra proyectada en el suelo (ajustada para no salirse) */}
              <div
                className="absolute rounded-sm opacity-20 pointer-events-none"
                style={{
                  width: `${ANCHO_LOSA * 0.8}px`,
                  height: `${ALTO_LOSA * 0.8}px`,
                  bottom: `-${15 + index * 2}px`,
                  left: '50%',
                  transform: `translateX(-50%) translateX(${index * 4}px) translateZ(-30px) rotateX(90deg) scaleY(0.3)`,
                  background: 'radial-gradient(ellipse, rgba(0,0,0,0.25) 0%, transparent 70%)',
                  filter: 'blur(3px)'
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Indicador de hover */}
      {hoveredPiso !== null && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-1.5 rounded-lg shadow-lg text-xs font-medium z-50 animate-in fade-in duration-200">
          Piso {hoveredPiso + 1}
        </div>
      )}
    </div>
  );
}


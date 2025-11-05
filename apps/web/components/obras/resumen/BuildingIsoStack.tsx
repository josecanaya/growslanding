'use client';

import { useState } from 'react';
import { Building, X, Layers, ChevronRight } from 'lucide-react';

interface Piso {
  id: string;
  nombre: string;
  progreso: number;
}

interface BuildingIsoStackProps {
  pisos: Piso[];
  obraId?: string;
  onVerDetallePiso?: (pisoId: string) => void;
  className?: string;
}

export default function BuildingIsoStack({ 
  pisos, 
  obraId,
  onVerDetallePiso,
  className = '' 
}: BuildingIsoStackProps) {
  const [pisoSeleccionado, setPisoSeleccionado] = useState<Piso | null>(null);
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [hoveredPiso, setHoveredPiso] = useState<string | null>(null);

  // Ordenar pisos: Planta Baja primero, luego de menor a mayor, reverse para mostrar desde arriba
  const pisosOrdenados = [...pisos].sort((a, b) => {
    if (a.nombre.toLowerCase().includes('baja') || a.nombre.toLowerCase().includes('pb')) return -1;
    if (b.nombre.toLowerCase().includes('baja') || b.nombre.toLowerCase().includes('pb')) return 1;
    
    const numA = parseInt(a.nombre.match(/\d+/)?.[0] || '999');
    const numB = parseInt(b.nombre.match(/\d+/)?.[0] || '999');
    
    return numA - numB;
  }).reverse(); // Mostrar desde arriba

  const abrirDrawer = (piso: Piso) => {
    setPisoSeleccionado(piso);
    setDrawerAbierto(true);
  };

  const cerrarDrawer = () => {
    setDrawerAbierto(false);
    setTimeout(() => setPisoSeleccionado(null), 300);
  };

  const getColorProgreso = (progreso: number) => {
    if (progreso < 30) {
      return {
        gradient: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
        bar: '#9ca3af',
        shadow: 'rgba(156, 163, 175, 0.3)',
        border: '#9ca3af'
      };
    } else if (progreso < 70) {
      return {
        gradient: 'linear-gradient(135deg, #93c5fd 0%, #60a5fa 50%, #2563eb 100%)',
        bar: '#2563eb',
        shadow: 'rgba(37, 99, 235, 0.3)',
        border: '#3b82f6'
      };
    } else {
      return {
        gradient: 'linear-gradient(135deg, #86efac 0%, #4ade80 50%, #22c55e 100%)',
        bar: '#22c55e',
        shadow: 'rgba(34, 197, 94, 0.3)',
        border: '#16a34a'
      };
    }
  };

  // Espaciado entre pisos (aumentado para más separación)
  const ESCALON_VERTICAL = 70; // Aumentado de 40 a 70 para más separación
  const ANGULO_SKEW = -20; // Grados para perspectiva isométrica
  const ANGULO_ROTATE_X = 5; // Grados para profundidad

  return (
    <>
      <div className={`relative w-full ${className}`}>
        {/* Contenedor principal con fondo técnico y cuadrícula (altura aumentada para más espacio) */}
        <div 
          className="relative flex flex-col items-center justify-end bg-gray-50 rounded-lg overflow-hidden"
          style={{
            height: `${Math.max(600, 200 + pisosOrdenados.length * ESCALON_VERTICAL)}px`,
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            backgroundPosition: 'center center'
          }}
        >
          {/* Pisos apilados */}
          {pisosOrdenados.map((piso, index) => {
            const color = getColorProgreso(piso.progreso);
            const isHovered = hoveredPiso === piso.id;
            const translateY = -index * ESCALON_VERTICAL + (isHovered ? 15 : 0); // Aumentado el hover de 10 a 15

            return (
              <div
                key={piso.id}
                className="relative transition-all duration-300 cursor-pointer group"
                style={{
                  transform: `translateY(${translateY}px) skewY(${ANGULO_SKEW}deg) rotateX(${ANGULO_ROTATE_X}deg)`,
                  transformStyle: 'preserve-3d',
                  zIndex: pisosOrdenados.length - index + (isHovered ? 100 : 0),
                  willChange: 'transform'
                }}
                onMouseEnter={() => setHoveredPiso(piso.id)}
                onMouseLeave={() => setHoveredPiso(null)}
                onClick={() => abrirDrawer(piso)}
              >
                {/* Losa isométrica principal */}
                <div
                  className="relative w-[280px] h-[70px] rounded-md shadow-md"
                  style={{
                    background: color.gradient,
                    boxShadow: isHovered 
                      ? `0 10px 20px ${color.shadow}, 0 4px 8px rgba(0,0,0,0.15)` 
                      : `0 4px 8px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)`,
                    borderTop: `2px solid ${color.border}`,
                    borderLeft: `2px solid ${color.border}`,
                    borderRight: '1px solid rgba(255,255,255,0.4)',
                    borderBottom: '1px solid rgba(255,255,255,0.4)',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {/* Brillo superior (simula iluminación) */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-[2px] rounded-t-md"
                    style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}
                  />

                  {/* Etiqueta del piso (Piso 1, Piso 2, etc.) */}
                  <div className="absolute top-2 left-3 flex items-center gap-2">
                    <Building className="h-3.5 w-3.5 text-gray-800 opacity-80" />
                    <span 
                      className="text-[11px] font-semibold text-gray-900"
                      style={{ transform: `skewY(${-ANGULO_SKEW}deg)` }}
                    >
                      Piso {pisosOrdenados.length - index}
                    </span>
                  </div>

                  {/* Porcentaje de progreso */}
                  <div className="absolute top-2 right-3">
                    <span 
                      className="text-xs font-bold"
                      style={{ 
                        color: piso.progreso < 30 ? '#6b7280' : 
                               piso.progreso < 70 ? '#1e40af' : '#15803d',
                        transform: `skewY(${-ANGULO_SKEW}deg)`
                      }}
                    >
                      {Math.round(piso.progreso)}%
                    </span>
                  </div>

                  {/* Barra de progreso visual */}
                  <div className="absolute bottom-2 left-2 right-2">
                    <div 
                      className="h-1.5 rounded-full bg-white/50 overflow-hidden"
                      style={{ 
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                      }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min(100, Math.max(0, piso.progreso))}%`,
                          backgroundColor: color.bar,
                          boxShadow: `0 1px 2px ${color.shadow}`
                        }}
                      />
                    </div>
                  </div>

                  {/* Borde inferior simulando espesor (cara frontal) */}
                  <div 
                    className="absolute bottom-[-6px] left-0 w-full h-[6px] rounded-b-md"
                    style={{ 
                      background: `linear-gradient(180deg, ${color.border}88 0%, ${color.border}cc 100%)`,
                      transform: 'skewX(-45deg) translateX(-2px)',
                      transformOrigin: 'bottom',
                      opacity: 0.7
                    }}
                  />

                  {/* Indicador de hover */}
                  {isHovered && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="bg-white/90 px-3 py-1.5 rounded-full shadow-lg animate-pulse">
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                          <span>Ver detalle</span>
                          <ChevronRight className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Sombra proyectada en el suelo (estilo arquitectónico) */}
                <div
                  className="absolute left-1/2 -translate-x-1/2 rounded-md opacity-40 pointer-events-none"
                  style={{
                    width: '260px',
                    height: '8px',
                    bottom: '-14px',
                    background: `linear-gradient(180deg, rgba(0,0,0,0.2) 0%, transparent 100%)`,
                    filter: 'blur(3px)',
                    transform: `translateX(-${index * 8}px) scaleY(0.5) skewY(${-ANGULO_SKEW * 0.3}deg)`,
                    transformOrigin: 'center'
                  }}
                />
              </div>
            );
          })}

          {/* Leyenda técnica */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
            <div className="flex items-center gap-6 text-xs bg-white/95 px-4 py-2 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-sm"
                  style={{ background: 'linear-gradient(135deg, #86efac, #22c55e)' }}
                ></div>
                <span className="text-gray-700 font-medium">Avanzado (&gt;70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-sm"
                  style={{ background: 'linear-gradient(135deg, #93c5fd, #2563eb)' }}
                ></div>
                <span className="text-gray-700 font-medium">En progreso (30-70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-sm"
                  style={{ background: 'linear-gradient(135deg, #e5e7eb, #d1d5db)' }}
                ></div>
                <span className="text-gray-700 font-medium">Inicial (&lt;30%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer lateral para detalles */}
      {drawerAbierto && pisoSeleccionado && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
            onClick={cerrarDrawer}
          />
          
          {/* Drawer */}
          <div 
            className={`
              fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50
              transform transition-transform duration-300 ease-in-out
              ${drawerAbierto ? 'translate-x-0' : 'translate-x-full'}
            `}
          >
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 border border-blue-200">
                      <Building className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold" style={{ color: '#003C6E' }}>
                        {pisoSeleccionado.nombre}
                      </h2>
                      <p className="text-sm text-gray-600">
                        Avance: {Math.round(pisoSeleccionado.progreso)}%
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={cerrarDrawer}
                    className="p-2 rounded-lg hover:bg-gray-100 transition"
                    aria-label="Cerrar"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>

                {/* Barra de progreso */}
                <div className="mt-4">
                  <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.min(100, Math.max(0, pisoSeleccionado.progreso))}%`,
                        backgroundColor: pisoSeleccionado.progreso >= 70 ? '#22c55e' : 
                                       pisoSeleccionado.progreso >= 30 ? '#2563eb' : '#9ca3af'
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Contenido scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Layers className="h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium mb-2">Información del piso</p>
                  <p className="text-sm text-gray-400">
                    Progreso: {Math.round(pisoSeleccionado.progreso)}%
                  </p>
                  
                  {/* TODO: Aquí se puede agregar el listado detallado de elementos cuando esté disponible */}
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 w-full">
                    <p className="text-xs text-gray-500">
                      Los elementos detallados se cargarán desde la base de datos
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                {onVerDetallePiso && obraId ? (
                  <button
                    onClick={() => {
                      onVerDetallePiso(pisoSeleccionado.id);
                      cerrarDrawer();
                    }}
                    className="w-full px-4 py-3 rounded-lg font-medium text-white transition"
                    style={{ backgroundColor: '#003C6E' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#004a8c'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#003C6E'}
                  >
                    Ver detalle completo →
                  </button>
                ) : (
                  <button
                    onClick={cerrarDrawer}
                    className="w-full px-4 py-3 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                  >
                    Cerrar
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}


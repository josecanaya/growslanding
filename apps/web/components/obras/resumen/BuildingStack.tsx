'use client';

import { useState } from 'react';
import { Building, X, Layers, ExternalLink, ChevronRight } from 'lucide-react';

interface ElementoPiso {
  id: string;
  nombre: string;
  tipo: string;
  categoria?: string;
}

interface PisoData {
  id: string;
  nombre: string;
  progreso: number;
  elementos: ElementoPiso[];
}

interface BuildingStackProps {
  pisos: PisoData[];
  obraId?: string;
  onVerDetallePiso?: (pisoId: string) => void;
  className?: string;
}

export default function BuildingStack({ 
  pisos, 
  obraId,
  onVerDetallePiso,
  className = '' 
}: BuildingStackProps) {
  const [pisoSeleccionado, setPisoSeleccionado] = useState<PisoData | null>(null);
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [hoveredPiso, setHoveredPiso] = useState<string | null>(null);

  // Ordenar pisos: Planta Baja primero, luego de menor a mayor, y reverse para mostrar desde arriba
  const pisosOrdenados = [...pisos].sort((a, b) => {
    if (a.nombre.toLowerCase().includes('baja') || a.nombre.toLowerCase().includes('pb')) return -1;
    if (b.nombre.toLowerCase().includes('baja') || b.nombre.toLowerCase().includes('pb')) return 1;
    
    const numA = parseInt(a.nombre.match(/\d+/)?.[0] || '999');
    const numB = parseInt(b.nombre.match(/\d+/)?.[0] || '999');
    
    return numA - numB;
  }).reverse(); // Mostrar desde arriba (último piso arriba, planta baja abajo)

  const abrirDrawer = (piso: PisoData) => {
    setPisoSeleccionado(piso);
    setDrawerAbierto(true);
  };

  const cerrarDrawer = () => {
    setDrawerAbierto(false);
    setTimeout(() => setPisoSeleccionado(null), 300);
  };

  const getColorProgreso = (progreso: number) => {
    if (progreso >= 70) {
      return {
        base: 'from-green-100 to-green-200',
        accent: '#059669',
        border: 'border-green-300',
        shadow: 'shadow-green-200/50'
      };
    } else if (progreso >= 30) {
      return {
        base: 'from-blue-100 to-blue-200',
        accent: '#004A7C',
        border: 'border-blue-300',
        shadow: 'shadow-blue-200/50'
      };
    } else {
      return {
        base: 'from-gray-200 to-gray-300',
        accent: '#6b7280',
        border: 'border-gray-400',
        shadow: 'shadow-gray-300/50'
      };
    }
  };

  // Dimensiones isométricas
  const ANCHO_PISO = 360;
  const ALTO_PISO = 100;
  const ESCALON_VERTICAL = 50; // Separación entre pisos
  const ANGULO_PERSPECTIVA = -20; // Grados para efecto isométrico
  const ANGULO_SKEW = -2; // Inclinación sutil

  return (
    <>
      <div className={`w-full ${className}`} style={{ backgroundColor: '#f3f4f6' }}>
        {/* Contenedor principal con perspectiva isométrica */}
        <div 
          className="relative flex flex-col items-center justify-end min-h-[600px] py-12 perspective-1000"
          style={{
            perspective: '1200px',
            perspectiveOrigin: '50% 50%'
          }}
        >
          {/* Grid de referencia (opcional, estilo técnico) */}
          <div 
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }}
          />

          {/* Pisos apilados con perspectiva isométrica */}
          <div className="relative z-10">
            {pisosOrdenados.map((piso, index) => {
              const color = getColorProgreso(piso.progreso);
              const isHovered = hoveredPiso === piso.id;
              
              // Calcular transformación isométrica
              const translateY = -index * ESCALON_VERTICAL;
              const translateZ = index * 20; // Profundidad 3D
              const scale = isHovered ? 1.05 : 1;
              
              return (
                <div
                  key={piso.id}
                  className="relative transition-all duration-300 ease-in-out cursor-pointer"
                  style={{
                    transform: `
                      translateY(${translateY}px) 
                      translateZ(${translateZ}px)
                      rotateX(${ANGULO_PERSPECTIVA}deg) 
                      rotateY(${-ANGULO_PERSPECTIVA * 0.5}deg)
                      scale(${scale})
                    `,
                    transformStyle: 'preserve-3d',
                    zIndex: pisosOrdenados.length - index + (isHovered ? 100 : 0),
                    willChange: 'transform'
                  }}
                  onMouseEnter={() => setHoveredPiso(piso.id)}
                  onMouseLeave={() => setHoveredPiso(null)}
                  onClick={() => abrirDrawer(piso)}
                >
                  {/* Bloque principal del piso (cara superior isométrica) */}
                  <div
                    className={`
                      relative rounded-sm border-2 ${color.border}
                      bg-gradient-to-br ${color.base}
                      transition-all duration-300
                      ${isHovered ? 'shadow-2xl ' + color.shadow : 'shadow-lg'}
                    `}
                    style={{
                      width: `${ANCHO_PISO}px`,
                      height: `${ALTO_PISO}px`,
                      borderTop: '3px solid rgba(0,0,0,0.1)',
                      borderLeft: '3px solid rgba(0,0,0,0.1)',
                      borderRight: '1px solid rgba(255,255,255,0.3)',
                      borderBottom: '1px solid rgba(255,255,255,0.3)',
                      boxShadow: isHovered 
                        ? `0 20px 40px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.3)` 
                        : `0 8px 16px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.3)`,
                      backdropFilter: 'blur(1px)'
                    }}
                  >
                    {/* Cara frontal del piso (simula altura del volumen) */}
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-400 to-gray-300 opacity-80"
                      style={{
                        height: '12px',
                        transform: 'skewX(45deg) translateX(-2px)',
                        transformOrigin: 'bottom',
                        borderTop: '1px solid rgba(0,0,0,0.1)'
                      }}
                    />

                    {/* Cara lateral del piso */}
                    <div
                      className="absolute bottom-0 right-0 bg-gradient-to-l from-gray-400 to-gray-300 opacity-70"
                      style={{
                        width: '12px',
                        height: '12px',
                        transform: 'skewY(-45deg) translateY(2px)',
                        transformOrigin: 'bottom right',
                        borderLeft: '1px solid rgba(0,0,0,0.1)'
                      }}
                    />

                    {/* Detalles de fachada (pilares/tabiques verticales) */}
                    <div className="absolute right-8 top-2 h-16 w-1 bg-gray-400/40 rounded-full opacity-60" />
                    <div className="absolute right-12 top-2 h-14 w-0.5 bg-gray-300/50 rounded-full opacity-50" />
                    <div className="absolute right-16 top-2 h-12 w-0.5 bg-gray-300/40 rounded-full opacity-40" />

                    {/* Contenido del piso */}
                    <div className="relative z-20 p-4 h-full flex flex-col justify-between">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 mb-1">
                            {piso.nombre}
                          </h3>
                          <p className="text-xs text-gray-600">
                            {piso.elementos.length} {piso.elementos.length === 1 ? 'elemento' : 'elementos'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold" style={{ color: color.accent }}>
                            {Math.round(piso.progreso)}%
                          </span>
                        </div>
                      </div>

                      {/* Barra de progreso isométrica */}
                      <div className="relative mt-2">
                        <div 
                          className="h-2 bg-white/50 rounded-sm overflow-hidden"
                          style={{
                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)'
                          }}
                        >
                          <div
                            className="h-full transition-all duration-500 rounded-sm"
                            style={{ 
                              width: `${Math.min(100, Math.max(0, piso.progreso))}%`,
                              backgroundColor: color.accent,
                              boxShadow: `0 1px 3px ${color.accent}40, inset 0 1px 1px rgba(255,255,255,0.3)`
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Indicador de click (flecha) */}
                    {isHovered && (
                      <div className="absolute bottom-2 right-2 text-xs text-gray-600 animate-pulse">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  {/* Sombra proyectada en el suelo (estilo arquitectónico) */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 rounded-md opacity-20 pointer-events-none"
                    style={{
                      width: `${ANCHO_PISO * 0.9}px`,
                      height: '8px',
                      bottom: '-16px',
                      backgroundColor: '#000',
                      filter: 'blur(4px)',
                      transform: `translateX(-${index * 10}px) scaleY(0.6)`,
                      transformOrigin: 'center'
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Leyenda técnica */}
        <div className="mt-12 pt-6 border-t border-gray-300">
          <div className="flex items-center justify-center gap-8 text-xs flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-green-100 to-green-200 border border-green-300"></div>
              <span className="text-gray-700 font-medium">Avanzado (&gt;70%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-blue-100 to-blue-200 border border-blue-300"></div>
              <span className="text-gray-700 font-medium">En progreso (30-70%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-gradient-to-br from-gray-200 to-gray-300 border border-gray-400"></div>
              <span className="text-gray-700 font-medium">Inicial (&lt;30%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer lateral (mantener el existente) */}
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
                        Avance: {Math.round(pisoSeleccionado.progreso)}% • {pisoSeleccionado.elementos.length} elementos
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
                        backgroundColor: pisoSeleccionado.progreso >= 70 ? '#10b981' : 
                                       pisoSeleccionado.progreso >= 30 ? '#3b82f6' : '#9ca3af'
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Contenido scrollable */}
              <div className="flex-1 overflow-y-auto p-6">
                {pisoSeleccionado.elementos.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Elementos configurados
                    </h3>
                    {pisoSeleccionado.elementos.map((elemento) => (
                      <div
                        key={elemento.id}
                        className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 transition cursor-pointer"
                        onClick={() => {
                          console.log('Ver elemento:', elemento.id);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{elemento.nombre}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">{elemento.tipo}</span>
                              {elemento.categoria && (
                                <>
                                  <span className="text-xs text-gray-400">•</span>
                                  <span className="text-xs text-gray-500">{elemento.categoria}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <ExternalLink className="h-4 w-4 text-gray-400 ml-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <Layers className="h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-500 font-medium">Sin elementos configurados</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Agregá elementos desde la pestaña "Elementos"
                    </p>
                  </div>
                )}
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

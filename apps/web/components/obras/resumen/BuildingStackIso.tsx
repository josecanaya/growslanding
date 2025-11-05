'use client';

import { useState } from 'react';
import { Building, X, Layers, ChevronRight } from 'lucide-react';

interface Piso {
  id: string;
  nombre: string;
  progreso: number;
  elementos: number;
}

interface BuildingStackIsoProps {
  pisos: Piso[];
  obraId?: string;
  onVerDetallePiso?: (pisoId: string) => void;
  className?: string;
}

export default function BuildingStackIso({ 
  pisos, 
  obraId,
  onVerDetallePiso,
  className = '' 
}: BuildingStackIsoProps) {
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
    if (progreso >= 70) {
      return {
        overlay: 'rgba(34, 197, 94, 0.25)', // verde
        brightness: 'brightness-100',
        shadow: 'shadow-green-300/50'
      };
    } else if (progreso >= 30) {
      return {
        overlay: 'rgba(37, 99, 235, 0.25)', // azul técnico
        brightness: 'brightness-95',
        shadow: 'shadow-blue-300/50'
      };
    } else {
      return {
        overlay: 'rgba(209, 213, 219, 0.3)', // gris
        brightness: 'brightness-75',
        shadow: 'shadow-gray-300/50'
      };
    }
  };

  // Espaciado vertical entre pisos
  const ESCALON_VERTICAL = 35;
  const ESCALON_Z = 5;

  return (
    <>
      <div className={`relative w-full ${className}`}>
        {/* Contenedor principal con fondo técnico y cuadrícula */}
        <div 
          className="relative flex flex-col items-center justify-end h-[600px] bg-gray-50 rounded-lg overflow-hidden"
          style={{
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
            const translateY = -index * ESCALON_VERTICAL;
            const translateZ = index * ESCALON_Z;

            return (
              <div
                key={piso.id}
                className="relative transition-all duration-300 cursor-pointer group"
                style={{
                  transform: `translateY(${translateY}px) translateZ(${translateZ}px)`,
                  zIndex: pisosOrdenados.length - index + (isHovered ? 100 : 0),
                  willChange: 'transform'
                }}
                onMouseEnter={() => setHoveredPiso(piso.id)}
                onMouseLeave={() => setHoveredPiso(null)}
                onClick={() => abrirDrawer(piso)}
              >
                {/* Imagen base del piso */}
                <div 
                  className={`
                    relative drop-shadow-xl transition-all duration-300
                    ${color.brightness}
                    ${isHovered ? 'scale-105 brightness-110 ' + color.shadow : 'scale-100'}
                  `}
                  style={{
                    filter: isHovered ? 'drop-shadow(0 10px 20px rgba(0,0,0,0.2))' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))'
                  }}
                >
                  <img
                    src="/assets/piso_base.svg"
                    alt={piso.nombre}
                    className="w-[400px] h-auto"
                    style={{
                      maxWidth: '100%',
                      height: 'auto'
                    }}
                  />

                  {/* Overlay de color según progreso */}
                  <div
                    className="absolute inset-0 rounded pointer-events-none transition-opacity duration-300"
                    style={{
                      backgroundColor: color.overlay,
                      opacity: isHovered ? 0.4 : 0.3,
                      mixBlendMode: 'multiply'
                    }}
                  />

                  {/* Barra de progreso visual */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-2 rounded-b"
                    style={{
                      backgroundColor: piso.progreso >= 70 ? 'rgba(34, 197, 94, 0.8)' :
                                      piso.progreso >= 30 ? 'rgba(37, 99, 235, 0.8)' :
                                      'rgba(156, 163, 175, 0.8)',
                      width: `${Math.min(100, Math.max(0, piso.progreso))}%`,
                      transition: 'width 0.5s ease'
                    }}
                  />

                  {/* Nombre del piso */}
                  <div className="absolute top-3 left-4 flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-700" />
                    <span className="text-sm font-semibold text-gray-800 bg-white/90 px-2 py-1 rounded shadow-sm">
                      {piso.nombre}
                    </span>
                  </div>

                  {/* Información de progreso y elementos */}
                  <div className="absolute top-3 right-4">
                    <div className="bg-white/90 px-2 py-1 rounded shadow-sm">
                      <span className="text-xs font-medium text-gray-700">
                        {Math.round(piso.progreso)}% • {piso.elementos} {piso.elementos === 1 ? 'elemento' : 'elementos'}
                      </span>
                    </div>
                  </div>

                  {/* Indicador de hover (click) */}
                  {isHovered && (
                    <div className="absolute bottom-3 right-4 bg-blue-600 text-white px-3 py-1 rounded-full shadow-lg animate-pulse">
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <span>Ver detalle</span>
                        <ChevronRight className="h-3 w-3" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Tooltip al hover */}
                {isHovered && !drawerAbierto && (
                  <div 
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl text-xs whitespace-nowrap z-50 animate-in fade-in duration-200"
                  >
                    <p className="font-medium">Avance: {Math.round(piso.progreso)}%</p>
                    <p className="text-gray-300">{piso.elementos} elementos configurados</p>
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Leyenda técnica */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <div className="flex items-center gap-6 text-xs bg-white/90 px-4 py-2 rounded-lg shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500"></div>
                <span className="text-gray-700 font-medium">Avanzado (&gt;70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500"></div>
                <span className="text-gray-700 font-medium">En progreso (30-70%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-gray-400"></div>
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
                        Avance: {Math.round(pisoSeleccionado.progreso)}% • {pisoSeleccionado.elementos} elementos
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
                    {pisoSeleccionado.elementos} {pisoSeleccionado.elementos === 1 ? 'elemento' : 'elementos'} configurados
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
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

